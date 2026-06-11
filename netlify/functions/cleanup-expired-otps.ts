import admin from 'firebase-admin';

interface JsonResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

interface ApiEvent {
  httpMethod: string;
}

// Firebase admin app singleton
let adminApp: admin.app.App | null = null;

function json(statusCode: number, body: Record<string, unknown>): JsonResponse {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
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

export const handler = async (event: ApiEvent): Promise<JsonResponse> => {
  // Only allow scheduled cron jobs or internal calls
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
    return json(405, { error: 'Method not allowed' });
  }

  try {
    const app = getFirebaseAdmin();
    const db = app.firestore();
    const now = admin.firestore.Timestamp.now();

    // Clean up expired OTPs using the TTL field
    const expiredOtps = await db
      .collection('emailOtps')
      .where('ttl', '<', now)
      .limit(500)
      .get();

    let deletedCount = 0;
    const batch = db.batch();

    expiredOtps.forEach((doc) => {
      batch.delete(doc.ref);
      deletedCount++;
    });

    if (deletedCount > 0) {
      await batch.commit();
    }

    return json(200, { 
      success: true, 
      deletedCount,
      message: `Cleaned up ${deletedCount} expired OTP records`
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Cleanup expired OTPs error:', err);
    return json(500, { error: errorMessage || 'Could not cleanup expired OTPs' });
  }
};
