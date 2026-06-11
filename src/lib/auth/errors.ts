export enum AuthErrorType {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  RATE_LIMITED = 'RATE_LIMITED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_EMAIL = 'INVALID_EMAIL',
  INVALID_PHONE = 'INVALID_PHONE',
  OTP_EXPIRED = 'OTP_EXPIRED',
  OTP_INVALID = 'OTP_INVALID',
  TOO_MANY_ATTEMPTS = 'TOO_MANY_ATTEMPTS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  VERIFICATION_FAILED = 'VERIFICATION_FAILED',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
}

export class AuthError extends Error {
  constructor(
    public type: AuthErrorType,
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export function toAuthError(error: unknown): AuthError {
  if (error instanceof AuthError) return error;
  
  if (error instanceof Error) {
    // Try to map common error messages to AuthErrorType
    const message = error.message.toLowerCase();
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return new AuthError(AuthErrorType.RATE_LIMITED, error.message, 429);
    }
    if (message.includes('invalid email') || message.includes('email format')) {
      return new AuthError(AuthErrorType.INVALID_EMAIL, error.message);
    }
    if (message.includes('expired')) {
      return new AuthError(AuthErrorType.OTP_EXPIRED, error.message);
    }
    if (message.includes('invalid') && message.includes('otp')) {
      return new AuthError(AuthErrorType.OTP_INVALID, error.message);
    }
    if (message.includes('network') || message.includes('fetch')) {
      return new AuthError(AuthErrorType.NETWORK_ERROR, error.message, 503);
    }
    
    return new AuthError(AuthErrorType.VERIFICATION_FAILED, error.message);
  }
  
  return new AuthError(AuthErrorType.VERIFICATION_FAILED, 'An unknown error occurred');
}
