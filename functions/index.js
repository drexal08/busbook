const functions = require('firebase-functions/v2/https');
const { onRequest } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');
const crypto = require('crypto');

admin.initializeApp();
const db = admin.firestore();

function pad2(n) {
  return String(n).padStart(2, '0');
}

function kigaliTodayUtcMidnightMs(nowMs) {
  const offsetMs = 2 * 60 * 60 * 1000;
  const kigali = new Date(nowMs + offsetMs);
  const y = kigali.getUTCFullYear();
  const m = kigali.getUTCMonth();
  const d = kigali.getUTCDate();
  return Date.UTC(y, m, d);
}

function dateStringFromUtcMs(ms) {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

function dayOfWeekMon1Sun7FromUtcMs(ms) {
  const d = new Date(ms);
  const dowSun0 = d.getUTCDay();
  return ((dowSun0 + 6) % 7) + 1;
}

function deterministicTripId(templateId, date) {
  return `${templateId}_${date}`;
}

exports.generateTripsDaily = onSchedule(
  { schedule: '5 0 * * *', timeZone: 'Africa/Kigali' },
  async () => {
    const nowMs = Date.now();
    const startMs = kigaliTodayUtcMidnightMs(nowMs);
    const templatesSnap = await db.collection('tripTemplates').where('active', '==', true).get();

    for (const docSnap of templatesSnap.docs) {
      const t = docSnap.data() || {};
      const templateId = docSnap.id;
      const daysOfWeek = Array.isArray(t.daysOfWeek) ? t.daysOfWeek : [];
      const horizon = Number.isFinite(t.sellDaysAhead) ? Math.max(1, Math.min(30, t.sellDaysAhead)) : 7;

      for (let i = 0; i < horizon; i++) {
        const dayMs = startMs + i * 24 * 60 * 60 * 1000;
        const dow = dayOfWeekMon1Sun7FromUtcMs(dayMs);
        if (daysOfWeek.length && !daysOfWeek.includes(dow)) continue;

        const date = dateStringFromUtcMs(dayMs);
        const tripId = deterministicTripId(templateId, date);
        const tripRef = db.collection('trips').doc(tripId);
        const existing = await tripRef.get();
        if (existing.exists) continue;

        const onlineSeats = Number(t.onlineSeats) || 0;
        await tripRef.set({
          routeId: t.routeId,
          companyId: t.companyId,
          busId: t.busId,
          date,
          departureTime: t.departureTime,
          arrivalTime: t.arrivalTime,
          price: Number(t.price) || 0,
          onlineSeats,
          totalSeats: Number(t.totalSeats) || Number(t.onlineSeats) || 0,
          bookedSeats: [],
          availableSeats: onlineSeats,
          status: 'scheduled',
          templateId,
          source: 'template',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }
  }
);

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
  const eventKind = event.kind || event.event_kind;
  if (eventKind !== 'transaction:processed') {
    return res.status(200).json({ received: true });
  }

  const txn = event.data || event;
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
        const bookingId = bookingRef.id;
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
