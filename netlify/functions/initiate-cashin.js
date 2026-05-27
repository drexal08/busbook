import admin from 'firebase-admin';

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getServiceAccount() {
  const projectId = getRequiredEnv('FIREBASE_PROJECT_ID');
  const clientEmail = getRequiredEnv('FIREBASE_CLIENT_EMAIL');
  const privateKeyRaw = getRequiredEnv('FIREBASE_PRIVATE_KEY');
  const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

  if (!privateKey.includes('BEGIN PRIVATE KEY')) {
    throw new Error(
      'FIREBASE_PRIVATE_KEY is not valid. Paste the service account private_key string and keep newlines escaped as \\n.'
    );
  }

  return { projectId, clientEmail, privateKey };
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(getServiceAccount()),
  });
}

const db = admin.firestore();
const PAYPACK_API = 'https://payments.paypack.rw/api';

async function getPaypackToken() {
  const res = await fetch(`${PAYPACK_API}/auth/agents/authorize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.PAYPACK_CLIENT_ID,
      client_secret: process.env.PAYPACK_CLIENT_SECRET,
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    },
    body: JSON.stringify(body),
  };
}

async function completeTestPayment(ref) {
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
      return;
    }

    const trip = tripSnap.data();
    const bookedSeats = trip.bookedSeats || [];

    if (bookedSeats.includes(payment.seatNumber)) {
      tx.update(paymentRef, {
        status: 'failed',
        failureReason: 'Seat is already booked',
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return;
    }

    const bookingRef = db.collection('bookings').doc();
    const bookingId = bookingRef.id;
    const newBooked = [...bookedSeats, payment.seatNumber];

    tx.set(bookingRef, {
      id: bookingId,
      tripId: payment.tripId,
      passengerId: payment.passengerId,
      companyId: payment.companyId,
      seatNumber: payment.seatNumber,
      passengerName: payment.passengerName,
      passengerPhone: payment.passengerPhone,
      origin: payment.origin,
      destination: payment.destination,
      departureDate: payment.departureDate,
      departureTime: payment.departureTime,
      price: payment.amount,
      status: 'confirmed',
      qrCode: bookingId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    tx.update(tripRef, {
      bookedSeats: newBooked,
      availableSeats: trip.onlineSeats - newBooked.length,
    });

    tx.update(paymentRef, {
      status: 'completed',
      bookingId,
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      testMode: true,
    });
  });
}

export const handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return json(200, {});
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  try {
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

    if (!tripId || !Number.isInteger(seatNumber) || seatNumber <= 0 || !phone) {
      return json(400, { error: 'Trip, seat, and phone number are required' });
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
    const bookedSeats = trip.bookedSeats || [];

    if (trip.status !== 'scheduled') {
      return json(409, { error: 'Trip is not available for booking' });
    }

    if (seatNumber > trip.onlineSeats || seatNumber > trip.totalSeats) {
      return json(409, { error: 'Seat is not available for online booking' });
    }

    if (bookedSeats.includes(seatNumber)) {
      return json(409, { error: 'Seat is already booked' });
    }

    const routeSnap = await db.collection('routes').doc(trip.routeId).get();

    if (!routeSnap.exists) {
      return json(500, { error: 'Trip route is missing' });
    }

    const route = routeSnap.data();
    let ref = `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Check if test mode is enabled
    const isTestMode = process.env.PAYMENT_TEST_MODE === 'true';

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
      status: 'pending',
      passengerName: user.name || '',
      passengerPhone: user.phone || phone,
      origin: route.origin,
      destination: route.destination,
      departureDate: trip.date,
      departureTime: trip.departureTime,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      testMode: isTestMode,
    });

    // Auto-complete payment in test mode
    if (isTestMode) {
      console.log(`🧪 TEST MODE: Auto-completing payment ${ref}`);
      await completeTestPayment(ref);
    }

    return json(200, { ref, testMode: isTestMode });
  } catch (err) {
    console.error('Initiate cashin error:', err);
    return json(500, { error: err.message || 'Payment initiation failed' });
  }
};
