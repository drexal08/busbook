import {
  ConfirmationResult,
  linkWithPhoneNumber,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut,
} from 'firebase/auth';
import { auth } from '../firebase';
import { RECAPTCHA_CONTAINER_IDS } from './constants';

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

export async function requestSignupPhoneOtp(phone: string, containerId: string = RECAPTCHA_CONTAINER_IDS.SIGNUP) {
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

export async function requestCurrentUserPhoneOtp(phone: string, containerId: string = RECAPTCHA_CONTAINER_IDS.SETTINGS) {
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
