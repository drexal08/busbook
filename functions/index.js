const functions = require('firebase-functions/v2/https');
const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const crypto = require('crypto');

admin.initializeApp();
const db = admin.firestore();

exports.paypackWebhook = onRequest(async (req, res) => {
  // Paypack pings with HEAD first to verify URL is alive
  if (req.method === 'HEAD') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  // Verify signature using process.env (new Firebase Functions v2 way)
  const secret = process.env.PAYPACK_WEBHOOK_SECRET;
  
  if (!secret) {
    console.error('PAYPACK_WEBHOOK_SECRET not set');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  const requestSignature = req.get('X-Paypack-Signature');
  
  // For HEAD pings there is no signature, already handled above
  if (!requestSignature) {
    return res.status(401).json({ error: 'Missing signature' });
  }

  const rawBody = JSON.stringify(req.body);
  const hash = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('base64');

  if (hash !== requestSignature) {
    console.error('Invalid webhook signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = req.body;

  // Only handle processed transactions
  if (event.kind !== 'transaction:processed') {
    return res.status(200).json({ received: true });
  }

  const txn = event.data;
  const ref = txn.ref;
  const status = txn.status; // 'successful' or 'failed'

  try {
    const paymentRef = db.collection('payments').doc(ref);
    const paymentSnap = await paymentRef.get();

    if (!paymentSnap.exists) {
      // Not a payment we initiated
      return res.status(200).json({ received: true });
    }

    const payment = paymentSnap.data();

    // Prevent double-processing — idempotency check
    if (payment.status !== 'pending') {
      return res.status(200).json({ already_processed: true });
    }

    if (status === 'successful') {
      const bookingRef = db.collection('bookings').doc();
      const bookingId = bookingRef.id;

      // Use a batch so booking + trip update are atomic
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

      // Update payment record
      batch.update(paymentRef, {
        status: 'completed',
        bookingId: bookingId,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await batch.commit();

      // Decrement trip seat separately (needs a read first)
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
      // Payment failed
      await paymentRef.update({
        status: 'failed',
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return res.status(200).json({ received: true });

  } catch (err) {
    console.error('Webhook processing error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
});