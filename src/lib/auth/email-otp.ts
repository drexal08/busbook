import { API_ENDPOINTS } from './constants';
import { toAuthError } from './errors';
import { logger } from '../logger';
import { analytics } from '../analytics';

function jsonOrThrow(res: Response) {
  return res.json().catch(() => {
    throw new Error('Unexpected server response');
  });
}

export async function sendEmailOtp(email: string) {
  logger.logApiCall('POST', API_ENDPOINTS.SEND_EMAIL_OTP, { email });
  analytics.trackEmailOtpRequested(email);
  
  try {
    const res = await fetch(API_ENDPOINTS.SEND_EMAIL_OTP, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await jsonOrThrow(res);
    
    if (!res.ok) {
      logger.error('Email OTP send failed', undefined, { email, statusCode: res.status, errorCode: data.errorCode });
      analytics.trackEmailOtpSendFailed(email, data.error || 'Unknown error');
      throw toAuthError(data.error || 'Failed to send email OTP');
    }

    logger.logVerificationEvent('email_otp_sent', { email, expiresInMinutes: data.expiresInMinutes });
    analytics.trackEmailOtpSent(email, data.expiresInMinutes);
    return data as { sent: boolean; expiresInMinutes: number };
  } catch (error) {
    logger.error('Email OTP send error', error as Error, { email });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    analytics.trackEmailOtpSendFailed(email, errorMessage);
    throw error;
  }
}

export async function verifyEmailOtp(email: string, code: string) {
  logger.logApiCall('POST', API_ENDPOINTS.VERIFY_EMAIL_OTP, { email });
  
  try {
    const res = await fetch(API_ENDPOINTS.VERIFY_EMAIL_OTP, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email, code }),
    });

    const data = await jsonOrThrow(res);
    
    if (!res.ok) {
      logger.error('Email OTP verification failed', undefined, { email, statusCode: res.status, errorCode: data.errorCode });
      const errorMessage = data.error || 'Failed to verify email OTP';
      analytics.trackEmailOtpVerificationFailed(email, errorMessage, 1);
      throw toAuthError(errorMessage);
    }

    logger.logVerificationEvent('email_otp_verified', { email });
    analytics.trackEmailOtpVerified(email, 1);
    return data as { verified: boolean };
  } catch (error) {
    logger.error('Email OTP verification error', error as Error, { email });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    analytics.trackEmailOtpVerificationFailed(email, errorMessage, 1);
    throw error;
  }
}
