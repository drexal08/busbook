import admin from 'firebase-admin';
import crypto from 'crypto';

interface JsonResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

interface ApiEvent {
  httpMethod: string;
  headers?: Record<string, string>;
}

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    database: { status: string; latency?: number; error?: string };
    firebaseAuth: { status: string; latency?: number; error?: string };
    emailService: { status: string; latency?: number; error?: string };
    otpSystem: { status: string; latency?: number; error?: string };
    ticketGeneration: { status: string; latency?: number; error?: string };
    environment: { status: string; variables: string[] };
  };
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
  };
}

// Firebase admin app singleton
let adminApp: admin.app.App | null = null;

function json(statusCode: number, body: Record<string, unknown> | HealthCheckResult): JsonResponse {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
    body: JSON.stringify(body),
  };
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

function getRequiredEnv(name: string): string {
  const raw = process.env[name];
  const value = typeof raw === 'string' ? raw.trim() : '';
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
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

async function measureLatency<T>(fn: () => Promise<T>): Promise<{ result: T; latency: number }> {
  const start = Date.now();
  try {
    const result = await fn();
    return { result, latency: Date.now() - start };
  } catch (error) {
    throw error;
  }
}

async function checkDatabase(): Promise<{ status: string; latency?: number; error?: string }> {
  try {
    const app = getFirebaseAdmin();
    const db = app.firestore();
    
    const { result, latency } = await measureLatency(async () => {
      // Try to read a simple collection to check connectivity
      await db.collection('health-checks').limit(1).get();
      return true;
    });

    return { status: 'healthy', latency };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Database health check failed:', error);
    return { status: 'unhealthy', error: errorMessage };
  }
}

async function checkFirebaseAuth(): Promise<{ status: string; latency?: number; error?: string }> {
  try {
    const app = getFirebaseAdmin();
    
    const { latency } = await measureLatency(async () => {
      // Just check if we can access auth
      app.auth();
      return true;
    });

    return { status: 'healthy', latency };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Firebase Auth health check failed:', error);
    return { status: 'unhealthy', error: errorMessage };
  }
}

async function checkEmailService(): Promise<{ status: string; latency?: number; error?: string }> {
  try {
    const smtpHost = stripWrappingQuotes(process.env.SMTP_HOST || '');
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = stripWrappingQuotes(process.env.SMTP_USER || '');

    if (!smtpHost || !smtpPort || !smtpUser) {
      return { 
        status: 'degraded', 
        error: 'Email service not configured (missing SMTP credentials)' 
      };
    }

    // We can't actually send a test email in a health check, but we can verify configuration
    return { status: 'healthy', latency: 0 };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Email service health check failed:', error);
    return { status: 'unhealthy', error: errorMessage };
  }
}

async function checkOtpSystem(): Promise<{ status: string; latency?: number; error?: string }> {
  try {
    const app = getFirebaseAdmin();
    const db = app.firestore();
    
    const { result, latency } = await measureLatency(async () => {
      // Check if we can access the OTP collection
      await db.collection('emailOtps').limit(1).get();
      return true;
    });

    // Also check OTP secret is configured
    const otpSecret = stripWrappingQuotes(process.env.EMAIL_OTP_SECRET || '');
    if (!otpSecret) {
      return { 
        status: 'degraded', 
        error: 'OTP secret not configured',
        latency 
      };
    }

    return { status: 'healthy', latency };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('OTP system health check failed:', error);
    return { status: 'unhealthy', error: errorMessage };
  }
}

async function checkTicketGeneration(): Promise<{ status: string; latency?: number; error?: string }> {
  try {
    const app = getFirebaseAdmin();
    const db = app.firestore();
    
    const { result, latency } = await measureLatency(async () => {
      // Check if we can access the bookings collection
      await db.collection('bookings').limit(1).get();
      return true;
    });

    return { status: 'healthy', latency };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Ticket generation health check failed:', error);
    return { status: 'unhealthy', error: errorMessage };
  }
}

function checkEnvironment(): { status: string; variables: string[] } {
  const requiredVars = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
    'EMAIL_OTP_SECRET',
  ];

  const optionalVars = [
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'RECAPTCHA_SECRET_KEY',
  ];

  const missingVars: string[] = [];
  const presentVars: string[] = [];

  requiredVars.forEach(varName => {
    const value = stripWrappingQuotes(process.env[varName] || '');
    if (value) {
      presentVars.push(varName);
    } else {
      missingVars.push(varName);
    }
  });

  optionalVars.forEach(varName => {
    const value = stripWrappingQuotes(process.env[varName] || '');
    if (value) {
      presentVars.push(varName);
    }
  });

  return {
    status: missingVars.length === 0 ? 'healthy' : 'degraded',
    variables: presentVars,
  };
}

export const handler = async (event: ApiEvent): Promise<JsonResponse> => {
  if (event.httpMethod === 'OPTIONS') {
    return json(200, {});
  }

  if (event.httpMethod !== 'GET') {
    return json(405, { error: 'Method not allowed' });
  }

  try {
    const timestamp = new Date().toISOString();

    // Run all health checks in parallel
    const [
      database,
      firebaseAuth,
      emailService,
      otpSystem,
      ticketGeneration,
    ] = await Promise.all([
      checkDatabase(),
      checkFirebaseAuth(),
      checkEmailService(),
      checkOtpSystem(),
      checkTicketGeneration(),
    ]);

    const environment = checkEnvironment();

    // Calculate overall health
    const checks = { database, firebaseAuth, emailService, otpSystem, ticketGeneration, environment };
    const allStatuses = Object.values(checks).map(c => c.status);
    
    const healthy = allStatuses.filter(s => s === 'healthy').length;
    const degraded = allStatuses.filter(s => s === 'degraded').length;
    const unhealthy = allStatuses.filter(s => s === 'unhealthy').length;
    const total = allStatuses.length;

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (unhealthy > 0) {
      overallStatus = 'unhealthy';
    } else if (degraded > 0) {
      overallStatus = 'degraded';
    }

    const result: HealthCheckResult = {
      status: overallStatus,
      timestamp,
      checks,
      summary: {
        total,
        healthy,
        degraded,
        unhealthy,
      },
    };

    // Return appropriate status code
    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;
    return json(statusCode, result);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    
    if (/Missing required environment variable:/i.test(errorMessage)) {
      return json(500, { error: errorMessage, errorCode: 'MISSING_ENV' });
    }

    console.error('Health check error:', err);
    return json(500, { error: errorMessage || 'Health check failed' });
  }
};
