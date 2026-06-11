// Re-export for backward compatibility
// New code should import directly from the auth submodules
export {
  sendEmailOtp,
  verifyEmailOtp,
} from './auth/email-otp';

export {
  requestSignupPhoneOtp,
  confirmSignupPhoneOtp,
  requestCurrentUserPhoneOtp,
  confirmCurrentUserPhoneOtp,
} from './auth/phone-otp';

