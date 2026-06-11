import crypto from 'crypto';
import admin from 'firebase-admin';

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

function getRequiredEnv(name) {
  const raw = process.env[name];
  const value = typeof raw === 'string' ? raw.trim() : '';
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function stripWrappingQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function getServiceAccount() {
  const projectId = stripWrappingQuotes(getRequiredEnv('FIREBASE_PROJECT_ID'));
  const clientEmail = stripWrappingQuotes(getRequiredEnv('FIREBASE_CLIENT_EMAIL'));
  const privateKeyRaw = stripWrappingQuotes(getRequiredEnv('FIREBASE_PRIVATE_KEY'));
  const privateKey = privateKeyRaw.replace(/\\n/g, '\n').trim();

  return { projectId, clientEmail, privateKey };
}

function getOtpHash(email, code) {
  const secret = stripWrappingQuotes(getRequiredEnv('EMAIL_OTP_SECRET'));
  return crypto
    .createHash('sha256')
    .update(`${email}:${code}:${secret}`)
    .digest('hex');
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function getOtpDocId(email) {
  return Buffer.from(email).toString('base64url');
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return json(200, {});
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const email = normalizeEmail(body.email);
    const code = String(body.code || '').trim();

    if (!email || !code) {
      return json(400, { error: 'Email and OTP code are required' });
    }

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(getServiceAccount()),
      });
    }

    const db = admin.firestore();
    const ref = db.collection('emailOtps').doc(getOtpDocId(email));
    const snap = await ref.get();

    if (!snap.exists) {
      return json(404, { error: 'OTP not found. Request a new code and try again.' });
    }

    const otp = snap.data();
    const expiresAt = otp.expiresAt?.toDate?.();

    if (!expiresAt || expiresAt.getTime() < Date.now()) {
      await ref.delete().catch(() => {});
      return json(400, { error: 'OTP expired. Request a new code and try again.' });
    }

    const expectedHash = getOtpHash(email, code);
    if (otp.codeHash !== expectedHash) {
      await ref.update({
        attempts: Number(otp.attempts || 0) + 1,
        lastFailedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return json(400, { error: 'Invalid OTP code' });
    }

    await ref.delete().catch(() => {});
    return json(200, { verified: true });
  } catch (err) {
    if (/Missing required environment variable:/i.test(err?.message || '')) {
      return json(500, { error: err.message, errorCode: 'MISSING_ENV' });
    }

    console.error('Verify email OTP error:', err);
    return json(500, { error: err?.message || 'Could not verify email OTP' });
  }
};
