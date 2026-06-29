import {
  ensureFirebaseAdmin,
  getFirestore,
  isFirestoreUnauthenticatedError,
} from './_firebase-admin.js';

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

function canValidateTickets(user) {
  return user?.role === 'admin' || (user?.role === 'operator' && user?.operatorStatus === 'approved');
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
    const userSnap = await db.collection('users').doc(decoded.uid).get();
    const user = userSnap.data();

    if (!userSnap.exists || !canValidateTickets(user)) {
      return json(403, { error: 'Only approved operators and admins can validate tickets' });
    }

    const body = JSON.parse(event.body || '{}');
    const bookingId = String(body.bookingId || '').trim();
    if (!bookingId || bookingId.length > 128) {
      return json(400, { error: 'A valid booking ID is required' });
    }

    const bookingRef = db.collection('bookings').doc(bookingId);
    let response;

    await db.runTransaction(async (tx) => {
      const bookingSnap = await tx.get(bookingRef);
      if (!bookingSnap.exists) {
        response = { statusCode: 404, body: { valid: false, message: 'Ticket not found' } };
        return;
      }

      const booking = bookingSnap.data();

      if (user.role === 'operator' && user.companyId !== booking.companyId) {
        response = { statusCode: 403, body: { valid: false, error: 'Ticket belongs to another company' } };
        return;
      }

      if (booking.status === 'used') {
        response = {
          statusCode: 409,
          body: { valid: false, message: 'Ticket already used', booking: { id: bookingId, ...booking } },
        };
        return;
      }

      if (booking.status === 'cancelled') {
        response = {
          statusCode: 409,
          body: { valid: false, message: 'Ticket was cancelled', booking: { id: bookingId, ...booking } },
        };
        return;
      }

      if (booking.status !== 'confirmed') {
        response = {
          statusCode: 409,
          body: { valid: false, message: 'Ticket is not valid for boarding', booking: { id: bookingId, ...booking } },
        };
        return;
      }

      tx.update(bookingRef, {
        status: 'used',
        validatedAt: admin.firestore.FieldValue.serverTimestamp(),
        validatedBy: decoded.uid,
      });

      response = {
        statusCode: 200,
        body: {
          valid: true,
          booking: { id: bookingId, ...booking, status: 'used' },
        },
      };
    });

    return json(response.statusCode, response.body);
  } catch (err) {
    if (isFirestoreUnauthenticatedError(err)) {
      return json(500, {
        error:
          'Firebase Admin could not authenticate to Firestore. Verify FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.',
        errorCode: 'FIRESTORE_UNAUTHENTICATED',
      });
    }

    console.error('Validate ticket error:', err);
    return json(500, { error: err?.message || 'Ticket validation failed' });
  }
};
