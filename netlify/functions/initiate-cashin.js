const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
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

    const [routeSnap, token] = await Promise.all([
      db.collection('routes').doc(trip.routeId).get(),
      getPaypackToken(),
    ]);

    if (!routeSnap.exists) {
      return json(500, { error: 'Trip route is missing' });
    }

    const route = routeSnap.data();

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
    const ref = cashin.ref;

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
    });

    return json(200, { ref });
  } catch (err) {
    console.error('Initiate cashin error:', err);
    return json(500, { error: err.message || 'Payment initiation failed' });
  }
};
