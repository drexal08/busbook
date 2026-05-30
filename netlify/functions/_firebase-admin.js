import admin from 'firebase-admin';

let initialized = false;

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

  if (!privateKey.includes('BEGIN PRIVATE KEY')) {
    throw new Error(
      'FIREBASE_PRIVATE_KEY is not valid. Paste the service account private_key string and keep newlines escaped as \\n.'
    );
  }

  if (!projectId || !clientEmail.includes('@')) {
    throw new Error(
      'Firebase Admin credentials look invalid. Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY all come from the same service account JSON.'
    );
  }

  return { projectId, clientEmail, privateKey };
}

/** Lazy init so missing env vars return JSON 500 instead of a 502 at cold start. */
export function ensureFirebaseAdmin() {
  if (initialized) return admin;

  admin.initializeApp({
    credential: admin.credential.cert(getServiceAccount()),
  });
  initialized = true;
  return admin;
}

export function getFirestore() {
  return ensureFirebaseAdmin().firestore();
}

export function isFirestoreUnauthenticatedError(err) {
  const code = err?.code;
  return code === 16 || code === '16' || /UNAUTHENTICATED/i.test(err?.message || '');
}
