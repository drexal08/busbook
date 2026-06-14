import admin from 'firebase-admin';

interface JsonResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

interface ApiEvent {
  httpMethod: string;
  body?: string;
}

interface VerifyEmailOtpBody {
  email: string;
  code: string;
  recaptchaToken?: string;
}

// Firebase admin app singleton
let adminApp: admin.app.App | null = null;

function json(statusCode: number, body: Record<string, unknown>): JsonResponse {
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

function getRequiredEnv(name: string): string {
  const raw = process.env[name];
  const value = typeof raw === 'string' ? raw.trim() : '';
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function stripWrappingQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function getOtpHash(email: string, code: string): string {
  const secret = stripWrappingQuotes(getRequiredEnv('EMAIL_OTP_SECRET'));
  const crypto = require('crypto');
  return crypto
    .createHash('sha256')
    .update(`${email}:${code}:${secret}`)
    .digest('hex');
}

function normalizeEmail(email: string): string {
  return String(email || '').trim().toLowerCase();
}

function getOtpDocId(email: string): string {
  return Buffer.from(email).toString('base64url');
}

function getServiceAccount(): admin.ServiceAccount {
  const projectId = stripWrappingQuotes(getRequiredEnv('FIREBASE_PROJECT_ID'));
  const clientEmail = stripWrappingQuotes(getRequiredEnv('FIREBASE_CLIENT_EMAIL'));
  const privateKeyRaw = stripWrappingQuotes(getRequiredEnv('FIREBASE_PRIVATE_KEY'));
  const privateKey = privateKeyRaw.replace(/\\n/g, '\n').trim();

  return { projectId, clientEmail, privateKey };
}

function getFirebaseAdmin(): admin.app.App {
  if (!adminApp) {
    if (!admin.apps.length) {
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(getServiceAccount()),
      });
    } else {
      adminApp = admin.apps[0]!;
    }
  }
  return adminApp;
}

async function verifyRecaptchaToken(token: string): Promise<boolean> {
  const secret = stripWrappingQuotes(process.env.RECAPTCHA_SECRET_KEY || '');
  
  if (!secret) {
    console.warn('[RECAPTCHA] No secret key configured, skipping verification');
    return true;
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`,
    });

    const result = await response.json() as { success: boolean; score?: number; 'error-codes'?: string[] };
    
    if (!result.success) {
      console.error('[RECAPTCHA] Verification failed:', result['error-codes']);
      return false;
    }

    const minScore = Number(process.env.RECAPTCHA_MIN_SCORE || '0.5');
    if (result.score !== undefined && result.score < minScore) {
      console.error(`[RECAPTCHA] Score too low: ${result.score} < ${minScore}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[RECAPTCHA] Verification error:', error);
    return true;
  }
}

export const handler = async (event: ApiEvent): Promise<JsonResponse> => {
  if (event.httpMethod === 'OPTIONS') {
    return json(200, {});
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  try {
    const body: VerifyEmailOtpBody = JSON.parse(event.body || '{}');
    const email = normalizeEmail(body.email);
    const code = body.code?.trim() || '';

    if (!email || !email.includes('@')) {
      return json(400, { error: 'A valid email address is required' });
    }

    if (!code) {
      return json(400, { error: 'Verification code is required' });
    }

    // reCAPTCHA verification
    if (body.recaptchaToken) {
      const recaptchaValid = await verifyRecaptchaToken(body.recaptchaToken);
      if (!recaptchaValid) {
        return json(400, { 
          error: 'reCAPTCHA verification failed. Please try again.',
          errorCode: 'RECAPTCHA_FAILED'
        });
      }
    } else if (process.env.REQUIRE_RECAPTCHA === 'true') {
      return json(400, { 
        error: 'reCAPTCHA token is required',
        errorCode: 'RECAPTCHA_REQUIRED'
      });
    }

    // Firebase initialization
    const app = getFirebaseAdmin();
    const db = app.firestore();
    const docId = getOtpDocId(email);

    // Get OTP document
    const otpDoc = await db.collection('emailOtps').doc(docId).get();
    if (!otpDoc.exists) {
      return json(400, { error: 'No OTP found for this email. Please request a new one.' });
    }

    const otpData = otpDoc.data();
    if (!otpData) {
      return json(400, { error: 'Invalid OTP data' });
    }

    // Check expiration
    const now = new Date();
    const expiresAt = otpData.expiresAt?.toDate();
    if (!expiresAt || expiresAt < now) {
      await db.collection('emailOtps').doc(docId).delete();
      return json(400, { error: 'The verification code has expired. Please request a new one.' });
    }

    // Check attempt limits
    const maxAttempts = Number(process.env.MAX_OTP_ATTEMPTS || '3');
    const currentAttempts = otpData.attempts || 0;
    if (currentAttempts >= maxAttempts) {
      await db.collection('emailOtps').doc(docId).delete();
      return json(429, { 
        error: 'Too many failed attempts. Please request a new code.',
        errorCode: 'TOO_MANY_ATTEMPTS'
      });
    }

    // Verify OTP
    const expectedHash = otpData.codeHash;
    const providedHash = getOtpHash(email, code);

    if (providedHash !== expectedHash) {
      // Increment attempt counter
      await db.collection('emailOtps').doc(docId).update({
        attempts: admin.firestore.FieldValue.increment(1),
      });
      
      const remainingAttempts = maxAttempts - (currentAttempts + 1);
      return json(400, { 
        error: `Invalid verification code. ${remainingAttempts} attempts remaining.`,
        errorCode: 'INVALID_OTP'
      });
    }

    // OTP verified - delete the document
    await db.collection('emailOtps').doc(docId).delete();

    return json(200, { verified: true });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    
    if (/Missing required environment variable:/i.test(errorMessage)) {
      return json(500, { error: errorMessage, errorCode: 'MISSING_ENV' });
    }

    console.error('Verify email OTP error:', err);
    return json(500, { error: errorMessage || 'Could not verify email OTP' });
  }
};
