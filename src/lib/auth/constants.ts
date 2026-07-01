export const RECAPTCHA_CONTAINER_IDS = {
  SIGNUP: 'signup-phone-recaptcha',
  SETTINGS: 'settings-phone-recaptcha',
  LOGIN: 'login-phone-recaptcha',
} as const;

export const RECAPTCHA_CONFIG = {
  MIN_SCORE: 0.5,
  TIMEOUT: 60000,
  SIZE: 'invisible' as const,
  BADGE: 'bottomright' as const,
  SITE_KEY: import.meta.env.VITE_RECAPTCHA_SITE_KEY || '',
} as const;

export const VERIFICATION_CONFIG = {
  EMAIL_OTP: {
    LENGTH: 6,
    EXPIRES_MINUTES_DEFAULT: 10,
    MIN_EXPIRES_MINUTES: 3,
    MAX_REQUESTS_PER_WINDOW: 5,
    RATE_LIMIT_WINDOW_MINUTES: 15,
    MAX_ATTEMPTS: 3,
  },
  PHONE_OTP: {
    MAX_ATTEMPTS: 3,
  },
  PASSWORD: {
    MIN_LENGTH: 6,
  },
} as const;

export const EMAIL_TEMPLATES = {
  VERIFICATION_CODE: {
    SUBJECT: 'Your BusBook verification code',
    FROM_NAME: 'BusBook',
  },
} as const;

export const API_ENDPOINTS = {
  SEND_EMAIL_OTP: '/.netlify/functions/send-email-otp',
  VERIFY_EMAIL_OTP: '/.netlify/functions/verify-email-otp',
  HEALTH_CHECK: '/.netlify/functions/health-check',
} as const;

export const ERROR_MESSAGES = {
  EMAIL_REQUIRED: 'Enter your email address first',
  EMAIL_INVALID: 'Please enter a valid email address',
  EMAIL_OTP_REQUIRED: 'Enter the email OTP code first',
  PHONE_REQUIRED: 'Enter your phone number first',
  PHONE_OTP_REQUIRED: 'Send the phone OTP and enter the SMS code first',
  PASSWORD_REQUIRED: 'Password is required',
  PASSWORD_TOO_SHORT: `Password must be at least ${VERIFICATION_CONFIG.PASSWORD.MIN_LENGTH} characters`,
  COMPANY_NAME_REQUIRED: 'Company name is required',
  COMPANY_CODE_REQUIRED: 'Company code is required',
  COMPANY_CODE_INVALID: 'Invalid company code or company not approved',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  RATE_LIMITED: 'Too many attempts. Please wait a few minutes before trying again.',
  OTP_EXPIRED: 'The verification code has expired. Please request a new one.',
  OTP_INVALID: 'Invalid verification code. Please try again.',
  TOO_MANY_ATTEMPTS: 'Too many failed attempts. Please request a new code.',
  EMAIL_ALREADY_EXISTS: 'An account already exists with this email address',
  LOGIN_FAILED: 'Invalid email or password',
  SIGNUP_FAILED: 'Registration failed. Please try again.',
} as const;

export const SUCCESS_MESSAGES = {
  EMAIL_OTP_SENT: 'Email OTP sent. Check your inbox for the 6-digit code.',
  EMAIL_OTP_VERIFIED: 'Email OTP verified successfully.',
  PHONE_OTP_SENT: 'Phone OTP sent. Enter the SMS code to confirm your number.',
  PHONE_OTP_VERIFIED: 'Phone number verified successfully.',
  VERIFICATION_EMAIL_SENT: 'Verification email sent. Open the link in your inbox, then return here and refresh.',
  EMAIL_STATUS_REFRESHED: 'Email verification status refreshed.',
  REGISTRATION_SUBMITTED: 'Registration submitted. Complete remaining verification in Settings while approval is pending.',
  ACCOUNT_FULLY_VERIFIED: 'Your account is fully verified.',
} as const;

export const LOADING_MESSAGES = {
  SENDING_EMAIL_OTP: 'Sending email OTP...',
  VERIFYING_EMAIL_OTP: 'Verifying email OTP...',
  SENDING_PHONE_OTP: 'Sending phone OTP...',
  VERIFYING_PHONE_OTP: 'Verifying phone OTP...',
  LOGGING_IN: 'Logging in...',
  SIGNING_UP: 'Creating account...',
  SENDING_VERIFICATION_EMAIL: 'Sending verification email...',
  REFRESHING_EMAIL_STATUS: 'Refreshing email status...',
} as const;
