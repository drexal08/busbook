import crypto from 'crypto';
import { ensureFirebaseAdmin, getFirestore } from './_firebase-admin.js';
import {
  applySuccessfulBooking,
  releaseSeatInTransaction,
} from './_seat-reservation.js';

async function failPaymentAndReleaseSeat(db, paymentRef, failureReason) {
  const admin = ensureFirebaseAdmin();

  await db.runTransaction(async (tx) => {
    const freshSnap = await tx.get(paymentRef);
    const fresh = freshSnap.data();
    if (!fresh || fresh.status !== 'pending') return;

    if (fresh.seatReserved) {
      const tripRef = db.collection('trips').doc(fresh.tripId);
      const tripSnap = await tx.get(tripRef);
      if (tripSnap.exists) {
        releaseSeatInTransaction(tx, tripRef, tripSnap.data(), fresh.seatNumber);
      }
    }

    tx.update(paymentRef, {
      status: 'failed',
      failureReason,
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
}

export const handler = async (event) => {
  if (event.httpMethod === 'HEAD') {
    return { statusCode: 200, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

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
    const admin = ensureFirebaseAdmin();
    const db = getFirestore();
    const paymentRef = db.collection('payments').doc(ref);
    const paymentSnap = await paymentRef.get();

    if (!paymentSnap.exists) {
      return { statusCode: 200, body: JSON.stringify({ received: true }) };
    }

    const payment = paymentSnap.data();

    if (payment.status !== 'pending') {
      return { statusCode: 200, body: JSON.stringify({ already_processed: true }) };
    }

    if (status === 'successful') {
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
        const bookingRef = db.collection('bookings').doc();
        const bookingId = bookingRef.id;

        const result = applySuccessfulBooking(tx, {
          tripRef,
          trip,
          payment: freshPayment,
          bookingRef,
          bookingId,
          admin,
        });

        if (!result.ok) {
          if (freshPayment.seatReserved) {
            releaseSeatInTransaction(tx, tripRef, trip, freshPayment.seatNumber);
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
        });
      });
    } else {
      await failPaymentAndReleaseSeat(db, paymentRef, 'Payment was not successful');
    }

    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  } catch (err) {
    console.error('Webhook error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal error' }) };
  }
};
