import crypto from 'crypto';
import admin from 'firebase-admin';
import nodemailer from 'nodemailer';
import { generateEmailOtpTemplate } from './email-templates';

interface JsonResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

interface ApiEvent {
  httpMethod: string;
  body?: string;
  headers?: Record<string, string>;
}

interface SendEmailOtpBody {
  email: string;
}

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

// In-memory rate limiting (for production, use Redis or Firestore)
const rateLimitMap = new Map<string, RateLimitEntry>();

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

function parseBool(value: string | undefined): boolean {
  const v = stripWrappingQuotes(String(value || '')).trim().toLowerCase();
  return v === 'true' || v === '1' || v === 'yes';
}

function getServiceAccount(): admin.ServiceAccount {
  const projectId = stripWrappingQuotes(getRequiredEnv('FIREBASE_PROJECT_ID'));
  const clientEmail = stripWrappingQuotes(getRequiredEnv('FIREBASE_CLIENT_EMAIL'));
  const privateKeyRaw = stripWrappingQuotes(getRequiredEnv('FIREBASE_PRIVATE_KEY'));
  const privateKey = privateKeyRaw.replace(/\\n/g, '\n').trim();

  return { projectId, clientEmail, privateKey };
}

function getOtpHash(email: string, code: string): string {
  const secret = stripWrappingQuotes(getRequiredEnv('EMAIL_OTP_SECRET'));
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

function getRateLimitKey(email: string): string {
  return `email-otp:${normalizeEmail(email)}`;
}

function checkRateLimit(email: string, maxRequests: number, windowMinutes: number): boolean {
  const key = getRateLimitKey(email);
  const now = Date.now();
  const windowMs = windowMinutes * 60 * 1000;

  const entry = rateLimitMap.get(key);
  if (!entry) {
    rateLimitMap.set(key, { count: 1, windowStart: now });
    return true;
  }

  if (now - entry.windowStart > windowMs) {
    // Window expired, reset
    rateLimitMap.set(key, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

function generateSecureOtp(length: number): string {
  const chars = '0123456789';
  let result = '';
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  
  return result;
}

function isOtpDevMode(): boolean {
  return parseBool(process.env.OTP_DEV_MODE);
}

function createTransporter(): nodemailer.Transporter {
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

export const handler = async (event: ApiEvent): Promise<JsonResponse> => {
  if (event.httpMethod === 'OPTIONS') {
    return json(200, {});
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  try {
    const body: SendEmailOtpBody = JSON.parse(event.body || '{}');
    const email = normalizeEmail(body.email);

    if (!email || !email.includes('@')) {
      return json(400, { error: 'A valid email address is required' });
    }

    // Rate limiting
    const maxRequests = Number(process.env.MAX_OTP_REQUESTS || '5');
    const windowMinutes = Number(process.env.OTP_RATE_LIMIT_MINUTES || '15');
    
    if (!checkRateLimit(email, maxRequests, windowMinutes)) {
      return json(429, { 
        error: 'Too many OTP requests. Please wait a few minutes before trying again.',
        errorCode: 'RATE_LIMITED'
      });
    }

    // Firebase initialization
    const app = getFirebaseAdmin();
    const db = app.firestore();

    // Configuration
    const otpLength = Number(process.env.OTP_LENGTH || '6');
    const expiresInMinutes = Math.max(
      3,
      Number(process.env.EMAIL_OTP_EXPIRES_MINUTES || '10')
    );
    
    // Generate secure OTP
    const code = generateSecureOtp(otpLength);
    const docId = getOtpDocId(email);
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
    const ttlDate = new Date(Date.now() + (expiresInMinutes + 1) * 60 * 1000); // Add buffer for cleanup

    // Store OTP in Firestore with TTL
    await db.collection('emailOtps').doc(docId).set({
      email,
      codeHash: getOtpHash(email, code),
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      ttl: admin.firestore.Timestamp.fromDate(ttlDate), // For TTL cleanup
      attempts: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Send email (or log in dev mode when SMTP is unavailable)
    if (isOtpDevMode()) {
      console.log(`[OTP_DEV_MODE] Email OTP for ${email}: ${code} (expires in ${expiresInMinutes} min)`);
      return json(200, { sent: true, expiresInMinutes, devMode: true });
    }

    const transporter = createTransporter();
    const from = stripWrappingQuotes(getRequiredEnv('SMTP_FROM_EMAIL'));
    const emailTemplate = generateEmailOtpTemplate({ code, expiresInMinutes });

    await transporter.sendMail({
      from,
      to: email,
      subject: emailTemplate.subject,
      text: emailTemplate.text,
      html: emailTemplate.html,
    });

    return json(200, { sent: true, expiresInMinutes });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    
    if (/Missing required environment variable:/i.test(errorMessage)) {
      return json(500, { error: errorMessage, errorCode: 'MISSING_ENV' });
    }

    console.error('Send email OTP error:', err);
    return json(500, { error: errorMessage || 'Could not send email OTP' });
  }
};
