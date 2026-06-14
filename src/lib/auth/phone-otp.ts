import {
  ConfirmationResult,
  linkWithPhoneNumber,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut,
} from 'firebase/auth';
import { auth } from '../firebase';
import { RECAPTCHA_CONTAINER_IDS } from './constants';
import { logger } from '../logger';

const recaptchaVerifiers = new Map<string, RecaptchaVerifier>();

export interface RecaptchaConfig {
  size: 'invisible' | 'normal' | 'compact';
  timeout?: number;
  badge?: 'bottomright' | 'bottomleft' | 'inline';
}

const DEFAULT_RECAPTCHA_CONFIG: RecaptchaConfig = {
  size: 'invisible',
  timeout: 60000,
  badge: 'bottomright',
};

function resetRecaptcha(containerId: string) {
  const existing = recaptchaVerifiers.get(containerId);
  if (existing) {
    try {
      existing.clear();
      logger.logSystemEvent('recaptcha_cleared', { containerId });
    } catch (error) {
      logger.error('Failed to clear reCAPTCHA', error as Error, { containerId });
    }
    recaptchaVerifiers.delete(containerId);
  }
}

async function createRecaptcha(containerId: string, config: RecaptchaConfig = DEFAULT_RECAPTCHA_CONFIG) {
  resetRecaptcha(containerId);

  try {
    const verifier = new RecaptchaVerifier(auth, containerId, {
      size: config.size,
      timeout: config.timeout,
      badge: config.badge,
    });

    await verifier.render();
    recaptchaVerifiers.set(containerId, verifier);
    
    logger.logSystemEvent('recaptcha_created', { 
      containerId, 
      size: config.size,
      badge: config.badge 
    });
    
    return verifier;
  } catch (error) {
    logger.error('Failed to create reCAPTCHA verifier', error as Error, { containerId, config });
    throw new Error('Failed to initialize reCAPTCHA. Please check your connection and try again.');
  }
}

export async function verifyRecaptchaScore(verifier: RecaptchaVerifier, minScore: number = 0.5): Promise<boolean> {
  try {
    // Firebase Auth automatically handles reCAPTCHA verification
    // For additional security, you could implement custom score checking here
    // This is a placeholder for future enhancement with reCAPTCHA v3
    logger.logSystemEvent('recaptcha_verified', { minScore });
    return true;
  } catch (error) {
    logger.error('reCAPTCHA verification failed', error as Error);
    return false;
  }
}

export async function requestSignupPhoneOtp(
  phone: string, 
  containerId: string = RECAPTCHA_CONTAINER_IDS.SIGNUP,
  config: RecaptchaConfig = DEFAULT_RECAPTCHA_CONFIG
) {
  try {
    const verifier = await createRecaptcha(containerId, config);
    const result = await signInWithPhoneNumber(auth, phone, verifier);
    
    // Verify reCAPTCHA score (placeholder for future enhancement)
    await verifyRecaptchaScore(verifier);
    
    logger.logSystemEvent('phone_otp_requested', { phone, containerId });
    return result;
  } catch (error) {
    logger.error('Phone OTP request failed', error as Error, { phone, containerId });
    throw error;
  }
}

export async function confirmSignupPhoneOtp(
  confirmationResult: ConfirmationResult,
  code: string
) {
  try {
    await confirmationResult.confirm(code);
    await signOut(auth);
    logger.logSystemEvent('phone_otp_confirmed', { success: true });
    return true;
  } catch (error) {
    logger.error('Phone OTP confirmation failed', error as Error);
    throw new Error('Invalid verification code. Please try again.');
  }
}

export async function requestCurrentUserPhoneOtp(
  phone: string, 
  containerId: string = RECAPTCHA_CONTAINER_IDS.SETTINGS,
  config: RecaptchaConfig = DEFAULT_RECAPTCHA_CONFIG
) {
  if (!auth.currentUser) {
    throw new Error('Please log in again before verifying your phone number');
  }

  try {
    const verifier = await createRecaptcha(containerId, config);
    const result = await linkWithPhoneNumber(auth.currentUser, phone, verifier);
    
    // Verify reCAPTCHA score (placeholder for future enhancement)
    await verifyRecaptchaScore(verifier);
    
    logger.logSystemEvent('current_user_phone_otp_requested', { phone, containerId });
    return result;
  } catch (error) {
    logger.error('Current user phone OTP request failed', error as Error, { phone, containerId });
    throw error;
  }
}

export async function confirmCurrentUserPhoneOtp(
  confirmationResult: ConfirmationResult,
  code: string
) {
  try {
    await confirmationResult.confirm(code);
    logger.logSystemEvent('current_user_phone_otp_confirmed', { success: true });
    return true;
  } catch (error) {
    logger.error('Current user phone OTP confirmation failed', error as Error);
    throw new Error('Invalid verification code. Please try again.');
  }
}

export function cleanupRecaptcha(containerId?: string) {
  if (containerId) {
    resetRecaptcha(containerId);
  } else {
    // Clean up all reCAPTCHA instances
    recaptchaVerifiers.forEach((_, id) => {
      resetRecaptcha(id);
    });
    logger.logSystemEvent('all_recaptcha_cleaned', {});
  }
}
