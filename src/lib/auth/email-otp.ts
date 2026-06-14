import { API_ENDPOINTS } from './constants';
import { toAuthError, AuthError, AuthErrorType } from './errors';
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

    // Check if response is ok before parsing JSON
    if (!res.ok) {
      let errorData: any = {};
      try {
        errorData = await res.json();
      } catch (e) {
        // If JSON parsing fails, use status text
        errorData = { error: res.statusText || 'HTTP error' };
      }
      
      logger.error('Email OTP send failed', undefined, { 
        email, 
        statusCode: res.status, 
        errorCode: errorData.errorCode,
        error: errorData.error 
      });
      analytics.trackEmailOtpSendFailed(email, errorData.error || `HTTP ${res.status}`);
      
      // Provide more specific error messages
      if (res.status === 429) {
        throw new AuthError(AuthErrorType.RATE_LIMITED, errorData.error || 'Too many OTP requests. Please wait a few minutes.', 429);
      }
      if (res.status === 500 && errorData.errorCode === 'MISSING_ENV') {
        throw new AuthError(AuthErrorType.CONFIGURATION_ERROR, 'Email service is not configured. Please contact support.', 500);
      }
      
      throw toAuthError(errorData.error || 'Failed to send email OTP');
    }

    const data = await jsonOrThrow(res);
    
    logger.logVerificationEvent('email_otp_sent', { email, expiresInMinutes: data.expiresInMinutes });
    analytics.trackEmailOtpSent(email, data.expiresInMinutes);
    return data as { sent: boolean; expiresInMinutes: number; devMode?: boolean };
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

    // Check if response is ok before parsing JSON
    if (!res.ok) {
      let errorData: any = {};
      try {
        errorData = await res.json();
      } catch (e) {
        errorData = { error: res.statusText || 'HTTP error' };
      }
      
      logger.error('Email OTP verification failed', undefined, { 
        email, 
        statusCode: res.status, 
        errorCode: errorData.errorCode,
        error: errorData.error 
      });
      
      const errorMessage = errorData.error || 'Failed to verify email OTP';
      analytics.trackEmailOtpVerificationFailed(email, errorMessage, 1);
      
      if (res.status === 429) {
        throw new AuthError(AuthErrorType.RATE_LIMITED, errorData.error || 'Too many attempts. Please wait.', 429);
      }
      if (errorData.errorCode === 'TOO_MANY_ATTEMPTS') {
        throw new AuthError(AuthErrorType.TOO_MANY_ATTEMPTS, errorData.error, 429);
      }
      
      throw toAuthError(errorMessage);
    }

    const data = await jsonOrThrow(res);
    
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
