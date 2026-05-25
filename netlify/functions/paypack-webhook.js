const admin = require('firebase-admin');
const crypto = require('crypto');

// Initialize Firebase Admin only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Netlify env vars can't have newlines — we encode them
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

exports.handler = async (event) => {
  // Paypack pings with HEAD first
  if (event.httpMethod === 'HEAD') {
    return { statusCode: 200, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  // Verify Paypack signature
  const secret = process.env.PAYPACK_WEBHOOK_SECRET;
  const requestSignature = event.headers['x-paypack-signature'];

  if (!secret || !requestSignature) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Missing signature' }) };
  }

  const hash = crypto
    .createHmac('sha256', secret)
    .update(event.body)
    .digest('base64');

  if (hash !== requestSignature) {
    console.error('Invalid signature');
    return { statusCode: 401, body: JSON.stringify({ error: 'Invalid signature' }) };
  }

  let webhookEvent;
  try {
    webhookEvent = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const eventKind = webhookEvent.kind || webhookEvent.event_kind;
  if (eventKind !== 'transaction:processed') {
    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  }

  const txn = webhookEvent.data || webhookEvent;
  const ref = txn.ref;
  const status = txn.status;

  try {
    const paymentRef = db.collection('payments').doc(ref);
    const paymentSnap = await paymentRef.get();

    if (!paymentSnap.exists) {
      return { statusCode: 200, body: JSON.stringify({ received: true }) };
    }

    const payment = paymentSnap.data();

    // Idempotency — don't process twice
    if (payment.status !== 'pending') {
      return { statusCode: 200, body: JSON.stringify({ already_processed: true }) };
    }

    if (status === 'successful') {
      let bookingId = '';

      await db.runTransaction(async (tx) => {
        const freshPaymentSnap = await tx.get(paymentRef);
        const freshPayment = freshPaymentSnap.data();

        if (!freshPayment || freshPayment.status !== 'pending') return;

        const tripRef = db.collection('trips').doc(freshPayment.tripId);
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

        if (bookedSeats.includes(freshPayment.seatNumber)) {
          tx.update(paymentRef, {
            status: 'failed',
            failureReason: 'Seat is already booked',
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          return;
        }

        const bookingRef = db.collection('bookings').doc();
        bookingId = bookingRef.id;
        const newBooked = [...bookedSeats, freshPayment.seatNumber];

        tx.set(bookingRef, {
          id: bookingId,
          tripId: freshPayment.tripId,
          passengerId: freshPayment.passengerId,
          companyId: freshPayment.companyId,
          seatNumber: freshPayment.seatNumber,
          passengerName: freshPayment.passengerName,
          passengerPhone: freshPayment.passengerPhone,
          origin: freshPayment.origin,
          destination: freshPayment.destination,
          departureDate: freshPayment.departureDate,
          departureTime: freshPayment.departureTime,
          price: freshPayment.amount,
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
        });
      });
    } else {
      await paymentRef.update({
        status: 'failed',
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return { statusCode: 200, body: JSON.stringify({ received: true }) };

  } catch (err) {
    console.error('Webhook error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal error' }) };
  }
};
