import { UserRole } from '../../types';
import type { ConfirmationResult } from 'firebase/auth';

export interface SignupState {
  // Form fields
  name: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
  companyName: string;
  companyCode: string;
  companyDescription: string;
  
  // Verification states
  emailOtp: string;
  emailOtpVerifiedFor: string;
  sendingEmailOtp: boolean;
  verifyingEmailOtp: boolean;
  
  phoneOtp: string;
  phoneOtpVerifiedFor: string;
  sendingPhoneOtp: boolean;
  verifyingPhoneOtp: boolean;
  phoneOtpSession: ConfirmationResult | null;
  
  // UI states
  error: string;
  success: string;
  verificationNotice: string;
  submitting: boolean;
  countdown: number;
}

export type SignupAction =
  | { type: 'SET_FIELD'; field: keyof SignupState; value: any }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'SET_SUCCESS'; success: string }
  | { type: 'SET_VERIFICATION_NOTICE'; notice: string }
  | { type: 'RESET_MESSAGES' }
  | { type: 'START_SENDING_EMAIL_OTP' }
  | { type: 'END_SENDING_EMAIL_OTP' }
  | { type: 'START_VERIFYING_EMAIL_OTP' }
  | { type: 'END_VERIFYING_EMAIL_OTP' }
  | { type: 'SET_EMAIL_OTP_VERIFIED'; email: string }
  | { type: 'CLEAR_EMAIL_OTP_VERIFIED' }
  | { type: 'START_SENDING_PHONE_OTP' }
  | { type: 'END_SENDING_PHONE_OTP' }
  | { type: 'START_VERIFYING_PHONE_OTP' }
  | { type: 'END_VERIFYING_PHONE_OTP' }
  | { type: 'SET_PHONE_OTP_SESSION'; session: ConfirmationResult | null }
  | { type: 'SET_PHONE_OTP_VERIFIED'; phone: string }
  | { type: 'CLEAR_PHONE_OTP_VERIFIED' }
  | { type: 'START_SUBMITTING' }
  | { type: 'END_SUBMITTING' }
  | { type: 'START_COUNTDOWN' }
  | { type: 'DECREMENT_COUNTDOWN' }
  | { type: 'RESET_COUNTDOWN' }
  | { type: 'RESET_FORM' };

const initialState: SignupState = {
  name: '',
  email: '',
  password: '',
  phone: '',
  role: 'passenger',
  companyName: '',
  companyCode: '',
  companyDescription: '',
  emailOtp: '',
  emailOtpVerifiedFor: '',
  sendingEmailOtp: false,
  verifyingEmailOtp: false,
  phoneOtp: '',
  phoneOtpVerifiedFor: '',
  sendingPhoneOtp: false,
  verifyingPhoneOtp: false,
  phoneOtpSession: null,
  error: '',
  success: '',
  verificationNotice: '',
  submitting: false,
  countdown: 0,
};

export function signupReducer(state: SignupState, action: SignupAction): SignupState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    
    case 'SET_ERROR':
      return { ...state, error: action.error, success: '', verificationNotice: '' };
    
    case 'SET_SUCCESS':
      return { ...state, success: action.success, error: '', verificationNotice: '' };
    
    case 'SET_VERIFICATION_NOTICE':
      return { ...state, verificationNotice: action.notice, error: '', success: '' };
    
    case 'RESET_MESSAGES':
      return { ...state, error: '', success: '', verificationNotice: '' };
    
    case 'START_SENDING_EMAIL_OTP':
      return { ...state, sendingEmailOtp: true };
    
    case 'END_SENDING_EMAIL_OTP':
      return { ...state, sendingEmailOtp: false };
    
    case 'START_VERIFYING_EMAIL_OTP':
      return { ...state, verifyingEmailOtp: true };
    
    case 'END_VERIFYING_EMAIL_OTP':
      return { ...state, verifyingEmailOtp: false };
    
    case 'SET_EMAIL_OTP_VERIFIED':
      return { ...state, emailOtpVerifiedFor: action.email };
    
    case 'CLEAR_EMAIL_OTP_VERIFIED':
      return { ...state, emailOtpVerifiedFor: '' };
    
    case 'START_SENDING_PHONE_OTP':
      return { ...state, sendingPhoneOtp: true };
    
    case 'END_SENDING_PHONE_OTP':
      return { ...state, sendingPhoneOtp: false };
    
    case 'START_VERIFYING_PHONE_OTP':
      return { ...state, verifyingPhoneOtp: true };
    
    case 'END_VERIFYING_PHONE_OTP':
      return { ...state, verifyingPhoneOtp: false };
    
    case 'SET_PHONE_OTP_SESSION':
      return { ...state, phoneOtpSession: action.session };
    
    case 'SET_PHONE_OTP_VERIFIED':
      return { ...state, phoneOtpVerifiedFor: action.phone };
    
    case 'CLEAR_PHONE_OTP_VERIFIED':
      return { ...state, phoneOtpVerifiedFor: '', phoneOtpSession: null };
    
    case 'START_SUBMITTING':
      return { ...state, submitting: true };
    
    case 'END_SUBMITTING':
      return { ...state, submitting: false };
    
    case 'START_COUNTDOWN':
      return { ...state, countdown: 60 };
    
    case 'DECREMENT_COUNTDOWN':
      return { ...state, countdown: Math.max(0, state.countdown - 1) };
    
    case 'RESET_COUNTDOWN':
      return { ...state, countdown: 0 };
    
    case 'RESET_FORM':
      return { ...initialState };
    
    default:
      return state;
  }
}

export { initialState };
