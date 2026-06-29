import {
  ensureFirebaseAdmin,
  getFirestore,
  isFirestoreUnauthenticatedError,
} from './_firebase-admin.js';
import {
  assertSeatBookable,
  reserveSeatInTransaction,
  releaseSeatInTransaction,
  applySuccessfulBooking,
} from './_seat-reservation.js';

const PAYPACK_API = 'https://payments.paypack.rw/api';

function isPaymentTestMode() {
  return String(process.env.PAYMENT_TEST_MODE || '')
    .trim()
    .toLowerCase() === 'true';
}

async function getPaypackToken() {
  const clientId = process.env.PAYPACK_CLIENT_ID?.trim();
  const clientSecret = process.env.PAYPACK_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error('Paypack credentials are not configured (PAYPACK_CLIENT_ID / PAYPACK_CLIENT_SECRET)');
  }

  const res = await fetch(`${PAYPACK_API}/auth/agents/authorize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Paypack auth failed: ${text}`);
  }

  const data = await res.json();
  return data.access;
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
    body: JSON.stringify(body),
  };
}

async function completeTestPayment(db, ref) {
  const admin = ensureFirebaseAdmin();
  const paymentRef = db.collection('payments').doc(ref);

  await db.runTransaction(async (tx) => {
    const paymentSnap = await tx.get(paymentRef);
    const payment = paymentSnap.data();

    if (!payment || payment.status !== 'pending') return;

    const tripRef = db.collection('trips').doc(payment.tripId);
    const tripSnap = await tx.get(tripRef);

    if (!tripSnap.exists) {
      tx.update(paymentRef, {
        status: 'failed',
        failureReason: 'Trip no longer exists',
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      if (payment.seatReserved) {
        // Trip gone — hold was on missing doc; nothing to release
      }
      return;
    }

    const trip = tripSnap.data();
    const bookingRef = db.collection('bookings').doc();
    const bookingId = bookingRef.id;

    const result = applySuccessfulBooking(tx, {
      tripRef,
      trip,
      payment,
      bookingRef,
      bookingId,
      admin,
    });

    if (!result.ok) {
      if (payment.seatReserved) {
        releaseSeatInTransaction(tx, tripRef, trip, payment.seatNumber);
      }
      tx.update(paymentRef, {
        status: 'failed',
        failureReason: result.failureReason,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return;
    }

    tx.update(paymentRef, {
      status: 'completed',
      bookingId,
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      testMode: true,
    });
  });
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return json(200, {});
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  try {
    const admin = ensureFirebaseAdmin();
    const db = getFirestore();

    const authHeader = event.headers.authorization || event.headers.Authorization || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    if (!idToken) {
      return json(401, { error: 'Missing authentication token' });
    }

    const decoded = await admin.auth().verifyIdToken(idToken);
    const body = JSON.parse(event.body || '{}');
    const tripId = String(body.tripId || '').trim();
    const seatNumber = Number(body.seatNumber);
    const phone = String(body.phone || '').replace(/\s+/g, '');
    const paymentMethod = String(body.paymentMethod || '').trim();
    const validPaymentMethods = new Set(['mtn_momo', 'airtel_money']);

    if (!tripId || !Number.isInteger(seatNumber) || seatNumber <= 0 || !phone) {
      return json(400, { error: 'Trip, seat, and phone number are required' });
    }

    if (paymentMethod && !validPaymentMethods.has(paymentMethod)) {
      return json(400, { error: 'Unsupported payment method' });
    }

    const [tripSnap, userSnap] = await Promise.all([
      db.collection('trips').doc(tripId).get(),
      db.collection('users').doc(decoded.uid).get(),
    ]);

    if (!tripSnap.exists) {
      return json(404, { error: 'Trip not found' });
    }

    if (!userSnap.exists) {
      return json(403, { error: 'User profile not found' });
    }

    const trip = tripSnap.data();
    const user = userSnap.data();

    try {
      assertSeatBookable(trip, seatNumber);
    } catch (seatErr) {
      return json(seatErr.statusCode || 409, { error: seatErr.message });
    }

    const tripRef = db.collection('trips').doc(tripId);

    await db.runTransaction(async (tx) => {
      const freshTripSnap = await tx.get(tripRef);
      if (!freshTripSnap.exists) {
        throw Object.assign(new Error('Trip not found'), { statusCode: 404 });
      }
      reserveSeatInTransaction(tx, tripRef, freshTripSnap.data(), seatNumber);
    });

    const routeSnap = await db.collection('routes').doc(trip.routeId).get();

    if (!routeSnap.exists) {
      await db.runTransaction(async (tx) => {
        const freshTripSnap = await tx.get(tripRef);
        if (freshTripSnap.exists) {
          releaseSeatInTransaction(tx, tripRef, freshTripSnap.data(), seatNumber);
        }
      });
      return json(500, { error: 'Trip route is missing' });
    }

    const route = routeSnap.data();
    let ref = `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const isTestMode = isPaymentTestMode();

    try {
      if (!isTestMode) {
        const token = await getPaypackToken();

        const cashinRes = await fetch(`${PAYPACK_API}/transactions/cashin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
            'X-Webhook-Mode': process.env.PAYPACK_WEBHOOK_MODE || 'production',
          },
          body: JSON.stringify({
            number: phone,
            amount: trip.price,
          }),
        });

        if (!cashinRes.ok) {
          const text = await cashinRes.text();
          throw new Error(`Paypack cashin failed: ${text}`);
        }

        const cashin = await cashinRes.json();
        ref = cashin.ref || cashin.data?.ref;

        if (!ref) {
          throw new Error('Paypack did not return a transaction reference');
        }
      }

      await db.collection('payments').doc(ref).set({
        paypackRef: ref,
        tripId,
        companyId: trip.companyId,
        passengerId: decoded.uid,
        seatNumber,
        amount: trip.price,
        phone,
        ...(paymentMethod ? { paymentMethod } : {}),
        status: 'pending',
        seatReserved: true,
        passengerName: user.name || '',
        passengerPhone: user.phone || phone,
        origin: route.origin,
        destination: route.destination,
        departureDate: trip.date,
        departureTime: trip.departureTime,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        testMode: isTestMode,
      });

      if (isTestMode) {
        console.log(`TEST MODE: Auto-completing payment ${ref}`);
        await completeTestPayment(db, ref);
      }

      return json(200, { ref, testMode: isTestMode });
    } catch (payErr) {
      await db.runTransaction(async (tx) => {
        const freshTripSnap = await tx.get(tripRef);
        if (freshTripSnap.exists) {
          releaseSeatInTransaction(tx, tripRef, freshTripSnap.data(), seatNumber);
        }
      });
      throw payErr;
    }
  } catch (err) {
    if (err?.statusCode) {
      return json(err.statusCode, { error: err.message });
    }
    if (isFirestoreUnauthenticatedError(err)) {
      return json(500, {
        error:
          'Firebase Admin could not authenticate to Firestore. Verify FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY on Netlify are from the same service account JSON (and FIREBASE_PRIVATE_KEY uses \\n).',
        errorCode: 'FIRESTORE_UNAUTHENTICATED',
      });
    }

    const message = err?.message || 'Payment initiation failed';
    if (/Missing required environment variable/i.test(message)) {
      return json(500, {
        error: `${message}. Set this in Netlify → Site configuration → Environment variables.`,
        errorCode: 'MISSING_ENV',
      });
    }

    console.error('Initiate cashin error:', err);
    return json(500, { error: message });
  }
};
