import crypto from 'crypto';
import admin from 'firebase-admin';
import nodemailer from 'nodemailer';

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

function parseBool(value) {
  const v = stripWrappingQuotes(String(value || '')).trim().toLowerCase();
  return v === 'true' || v === '1' || v === 'yes';
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

function createTransporter() {
  return nodemailer.createTransport({
    host: stripWrappingQuotes(getRequiredEnv('SMTP_HOST')),
    port: Number(stripWrappingQuotes(getRequiredEnv('SMTP_PORT'))),
    secure: parseBool(process.env.SMTP_SECURE),
    auth: {
      user: stripWrappingQuotes(getRequiredEnv('SMTP_USER')),
      pass: stripWrappingQuotes(getRequiredEnv('SMTP_PASS')),
    },
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
    const body = JSON.parse(event.body || '{}');
    const email = normalizeEmail(body.email);

    if (!email || !email.includes('@')) {
      return json(400, { error: 'A valid email address is required' });
    }

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(getServiceAccount()),
      });
    }

    const expiresInMinutes = Math.max(
      3,
      Number(stripWrappingQuotes(String(process.env.EMAIL_OTP_EXPIRES_MINUTES || '10')))
    );
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const db = admin.firestore();
    const docId = getOtpDocId(email);
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    await db.collection('emailOtps').doc(docId).set({
      email,
      codeHash: getOtpHash(email, code),
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      attempts: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const transporter = createTransporter();
    const from = stripWrappingQuotes(getRequiredEnv('SMTP_FROM_EMAIL'));

    await transporter.sendMail({
      from,
      to: email,
      subject: 'Your BusBook verification code',
      text: `Your BusBook verification code is ${code}. It expires in ${expiresInMinutes} minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #111827;">
          <h2 style="margin: 0 0 12px;">BusBook verification code</h2>
          <p style="margin: 0 0 16px; color: #4b5563;">Use this code to verify your email address.</p>
          <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; background: #f3f4f6; border-radius: 12px; padding: 18px; text-align: center;">
            ${code}
          </div>
          <p style="margin: 16px 0 0; color: #6b7280;">This code expires in ${expiresInMinutes} minutes.</p>
        </div>
      `,
    });

    return json(200, { sent: true, expiresInMinutes });
  } catch (err) {
    if (/Missing required environment variable:/i.test(err?.message || '')) {
      return json(500, { error: err.message, errorCode: 'MISSING_ENV' });
    }

    console.error('Send email OTP error:', err);
    return json(500, { error: err?.message || 'Could not send email OTP' });
  }
};
