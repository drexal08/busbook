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

  if (webhookEvent.kind !== 'transaction:processed') {
    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  }

  const txn = webhookEvent.data;
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
      const bookingRef = db.collection('bookings').doc();
      const bookingId = bookingRef.id;

      const batch = db.batch();

      batch.set(bookingRef, {
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

      batch.update(paymentRef, {
        status: 'completed',
        bookingId: bookingId,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await batch.commit();

      // Decrement trip seat
      const tripRef = db.collection('trips').doc(payment.tripId);
      const tripSnap = await tripRef.get();
      if (tripSnap.exists) {
        const trip = tripSnap.data();
        const newBooked = [...(trip.bookedSeats || []), payment.seatNumber];
        await tripRef.update({
          bookedSeats: newBooked,
          availableSeats: trip.onlineSeats - newBooked.length,
        });
      }

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