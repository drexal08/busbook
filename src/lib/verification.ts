import {
  ConfirmationResult,
  linkWithPhoneNumber,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut,
} from 'firebase/auth';
import { auth } from './firebase';

const recaptchaVerifiers = new Map<string, RecaptchaVerifier>();

function resetRecaptcha(containerId: string) {
  const existing = recaptchaVerifiers.get(containerId);
  if (existing) {
    existing.clear();
    recaptchaVerifiers.delete(containerId);
  }
}

async function createRecaptcha(containerId: string) {
  resetRecaptcha(containerId);

  const verifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
  });

  await verifier.render();
  recaptchaVerifiers.set(containerId, verifier);
  return verifier;
}

function jsonOrThrow(res: Response) {
  return res.json().catch(() => {
    throw new Error('Unexpected server response');
  });
}

export async function sendEmailOtp(email: string) {
  const res = await fetch('/.netlify/functions/send-email-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email }),
  });

  const data = await jsonOrThrow(res);
  if (!res.ok) {
    throw new Error(data.error || 'Failed to send email OTP');
  }

  return data as { sent: boolean; expiresInMinutes: number };
}

export async function verifyEmailOtp(email: string, code: string) {
  const res = await fetch('/.netlify/functions/verify-email-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email, code }),
  });

  const data = await jsonOrThrow(res);
  if (!res.ok) {
    throw new Error(data.error || 'Failed to verify email OTP');
  }

  return data as { verified: boolean };
}

export async function requestSignupPhoneOtp(phone: string, containerId: string) {
  const verifier = await createRecaptcha(containerId);
  return signInWithPhoneNumber(auth, phone, verifier);
}

export async function confirmSignupPhoneOtp(
  confirmationResult: ConfirmationResult,
  code: string
) {
  await confirmationResult.confirm(code);
  await signOut(auth);
  return true;
}

export async function requestCurrentUserPhoneOtp(phone: string, containerId: string) {
  if (!auth.currentUser) {
    throw new Error('Please log in again before verifying your phone number');
  }

  const verifier = await createRecaptcha(containerId);
  return linkWithPhoneNumber(auth.currentUser, phone, verifier);
}

export async function confirmCurrentUserPhoneOtp(
  confirmationResult: ConfirmationResult,
  code: string
) {
  await confirmationResult.confirm(code);
  return true;
}
