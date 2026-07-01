import React, { useMemo, useReducer, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { UserRole } from '../types';
import { IconUser, IconBuilding, IconScan, IconCheckCircle, IconGoogle, IconFacebook } from '../components/Icons';
import { LogoMark } from '../components/Logo';
import { EmailVerificationStep, PhoneVerificationStep } from '../components/auth';
import { deleteRegistration } from '../lib/auth';
import {
  confirmSignupPhoneOtp,
  requestSignupPhoneOtp,
  sendEmailOtp,
  verifyEmailOtp,
} from '../lib/verification';
import {
  normalizePhoneInput,
  toRwandaE164Phone,
  validateSupportedPhone,
} from '../lib/phone';
import { getPostAuthPath } from '../lib/userRoutes';
import { signupReducer, initialState } from '../lib/auth/signupReducer';
import { ERROR_MESSAGES, SUCCESS_MESSAGES, VERIFICATION_CONFIG } from '../lib/auth/constants';
import { toAuthError } from '../lib/auth/errors';

const SignupPage: React.FC = () => {
  const [state, dispatch] = useReducer(signupReducer, initialState);
  const { signup, loginWithGoogle, loginWithFacebook } = useAuth();
  const { companies, loading, addCompanyWithId } = useData();
  const navigate = useNavigate();

  // Countdown timer for resend button
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (state.countdown > 0) {
      interval = setInterval(() => {
        dispatch({ type: 'DECREMENT_COUNTDOWN' });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.countdown]);

  const normalizedEmail = state.email.trim().toLowerCase();
  const normalizedPhone = normalizePhoneInput(state.phone.trim());
  const canonicalPhone = toRwandaE164Phone(normalizedPhone);
  const emailOtpVerified = !!normalizedEmail && state.emailOtpVerifiedFor === normalizedEmail;
  const phoneOtpVerified = !!canonicalPhone && state.phoneOtpVerifiedFor === canonicalPhone;
  const phoneValidationError = normalizedPhone ? validateSupportedPhone(normalizedPhone) : '';

  const socialOptions = useMemo(
    () => [
      {
        label: 'Google',
        action: async () => loginWithGoogle(),
        className: 'border border-border text-gray-700 hover:bg-surface-secondary',

        icon: <IconGoogle size={18} />,
      },
      {
        label: 'Facebook',
        action: async () => loginWithFacebook(),
        className: 'border border-border text-gray-700 hover:bg-surface-secondary',

        icon: <IconFacebook size={18} />,
      },
    ],
    [loginWithFacebook, loginWithGoogle]
  );

  const resetVerificationMessages = () => {
    dispatch({ type: 'RESET_MESSAGES' });
  };

  const startResendCountdown = () => {
    dispatch({ type: 'START_COUNTDOWN' });
  };

  const handleSendEmailOtp = async () => {
    if (!normalizedEmail) {
      dispatch({ type: 'SET_ERROR', error: ERROR_MESSAGES.EMAIL_REQUIRED });
      return;
    }

    try {
      dispatch({ type: 'START_SENDING_EMAIL_OTP' });
      resetVerificationMessages();
      await sendEmailOtp(normalizedEmail);
      dispatch({ type: 'CLEAR_EMAIL_OTP_VERIFIED' });
      dispatch({ type: 'SET_VERIFICATION_NOTICE', notice: SUCCESS_MESSAGES.EMAIL_OTP_SENT });
      startResendCountdown();
    } catch (e) {
      const error = toAuthError(e);
      dispatch({ type: 'SET_ERROR', error: error.message || ERROR_MESSAGES.UNKNOWN_ERROR });
    } finally {
      dispatch({ type: 'END_SENDING_EMAIL_OTP' });
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!normalizedEmail || !state.emailOtp.trim()) {
      dispatch({ type: 'SET_ERROR', error: ERROR_MESSAGES.EMAIL_OTP_REQUIRED });
      return;
    }

    try {
      dispatch({ type: 'START_VERIFYING_EMAIL_OTP' });
      resetVerificationMessages();
      await verifyEmailOtp(normalizedEmail, state.emailOtp.trim());
      dispatch({ type: 'SET_EMAIL_OTP_VERIFIED', email: normalizedEmail });
      dispatch({ type: 'SET_VERIFICATION_NOTICE', notice: SUCCESS_MESSAGES.EMAIL_OTP_VERIFIED });
      dispatch({ type: 'RESET_COUNTDOWN' });
    } catch (e) {
      const error = toAuthError(e);
      dispatch({ type: 'SET_ERROR', error: error.message || ERROR_MESSAGES.UNKNOWN_ERROR });
    } finally {
      dispatch({ type: 'END_VERIFYING_EMAIL_OTP' });
    }
  };

  const handleSendPhoneOtp = async () => {
    const phoneError = validateSupportedPhone(normalizedPhone);
    if (phoneError) {
      dispatch({
        type: 'SET_ERROR',
        error: !normalizedPhone ? ERROR_MESSAGES.PHONE_REQUIRED : phoneError,
      });
      return;
    }

    try {
      dispatch({ type: 'START_SENDING_PHONE_OTP' });
      resetVerificationMessages();
      const session = await requestSignupPhoneOtp(canonicalPhone, 'signup-phone-recaptcha');
      dispatch({ type: 'SET_PHONE_OTP_SESSION', session });
      dispatch({ type: 'CLEAR_PHONE_OTP_VERIFIED' });
      dispatch({ type: 'SET_VERIFICATION_NOTICE', notice: SUCCESS_MESSAGES.PHONE_OTP_SENT });
    } catch (e) {
      const error = toAuthError(e);
      dispatch({ type: 'SET_ERROR', error: error.message || ERROR_MESSAGES.UNKNOWN_ERROR });
    } finally {
      dispatch({ type: 'END_SENDING_PHONE_OTP' });
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!state.phoneOtpSession || !state.phoneOtp.trim()) {
      dispatch({ type: 'SET_ERROR', error: ERROR_MESSAGES.PHONE_OTP_REQUIRED });
      return;
    }

    try {
      dispatch({ type: 'START_VERIFYING_PHONE_OTP' });
      resetVerificationMessages();
      await confirmSignupPhoneOtp(state.phoneOtpSession, state.phoneOtp.trim());
      dispatch({ type: 'SET_PHONE_OTP_VERIFIED', phone: canonicalPhone });
      dispatch({ type: 'SET_PHONE_OTP_SESSION', session: null });
      dispatch({ type: 'SET_VERIFICATION_NOTICE', notice: SUCCESS_MESSAGES.PHONE_OTP_VERIFIED });
    } catch (e) {
      const error = toAuthError(e);
      dispatch({ type: 'SET_ERROR', error: error.message || ERROR_MESSAGES.UNKNOWN_ERROR });
    } finally {
      dispatch({ type: 'END_VERIFYING_PHONE_OTP' });
    }
  };

  const handleSocialSignup = async (
    action: () => Promise<{ success: boolean; error?: string; profile?: any }>
  ) => {
    resetVerificationMessages();
    const result = await action();
    if (result.success) {
      navigate(getPostAuthPath(result.profile));
      return;
    }
    dispatch({ type: 'SET_ERROR', error: result.error || 'Social signup failed' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state.submitting) return;

    resetVerificationMessages();

    if (state.password.length < VERIFICATION_CONFIG.PASSWORD.MIN_LENGTH) {
      dispatch({ type: 'SET_ERROR', error: ERROR_MESSAGES.PASSWORD_TOO_SHORT });
      return;
    }

    const phoneError = validateSupportedPhone(normalizedPhone);
    if (phoneError) {
      dispatch({
        type: 'SET_ERROR',
        error: !normalizedPhone ? ERROR_MESSAGES.PHONE_REQUIRED : phoneError,
      });
      return;
    }

    const storedPhone = canonicalPhone || normalizedPhone;

    if (state.role === 'company' && !state.companyName.trim()) {
      dispatch({ type: 'SET_ERROR', error: ERROR_MESSAGES.COMPANY_NAME_REQUIRED });
      return;
    }

    if (state.role === 'operator' && !state.companyCode.trim()) {
      dispatch({ type: 'SET_ERROR', error: ERROR_MESSAGES.COMPANY_CODE_REQUIRED });
      return;
    }

    if (state.role === 'operator') {
      if (loading) {
        dispatch({ type: 'SET_ERROR', error: 'Company data is still loading. Please try again in a moment.' });
        return;
      }

      const companyExists = companies.find(
        (company) => company.id === state.companyCode.trim() && company.status === 'approved'
      );
      if (!companyExists) {
        dispatch({ type: 'SET_ERROR', error: ERROR_MESSAGES.COMPANY_CODE_INVALID });
        return;
      }
    }

    if (state.role === 'company') {
      dispatch({ type: 'START_SUBMITTING' });
      const companyId = `comp-${Date.now()}`;
      try {
        const result = await signup(state.name, state.email, state.password, storedPhone, state.role, companyId, {
          emailOtpVerified,
          phoneVerified: phoneOtpVerified,
        });
        if (!result.success || !result.userId) {
          dispatch({ type: 'SET_ERROR', error: result.error || ERROR_MESSAGES.SIGNUP_FAILED });
          return;
        }

        try {
          await addCompanyWithId({
            id: companyId,
            name: state.companyName,
            ownerId: result.userId,
            description: state.companyDescription || 'New bus company',
            status: 'pending',
            phone: storedPhone,
            email: state.email,
            createdAt: new Date().toISOString().split('T')[0],
          });
        } catch (setupError) {
          await deleteRegistration(result.userId);
          throw setupError;
        }

        dispatch({ type: 'SET_SUCCESS', success: SUCCESS_MESSAGES.REGISTRATION_SUBMITTED });
        setTimeout(() => navigate(getPostAuthPath(result.profile)), 1200);
      } catch (e) {
        const error = toAuthError(e);
        dispatch({ type: 'SET_ERROR', error: error.message || ERROR_MESSAGES.SIGNUP_FAILED });
      } finally {
        dispatch({ type: 'END_SUBMITTING' });
      }
      return;
    }

    if (state.role === 'operator') {
      dispatch({ type: 'START_SUBMITTING' });
      try {
        const result = await signup(state.name, state.email, state.password, storedPhone, state.role, state.companyCode.trim(), {
          emailOtpVerified,
          phoneVerified: phoneOtpVerified,
        });
        if (result.success && result.userId) {
          dispatch({ type: 'SET_SUCCESS', success: SUCCESS_MESSAGES.REGISTRATION_SUBMITTED });
          setTimeout(() => navigate(getPostAuthPath(result.profile)), 1200);
        } else {
          dispatch({ type: 'SET_ERROR', error: result.error || ERROR_MESSAGES.SIGNUP_FAILED });
        }
      } finally {
        dispatch({ type: 'END_SUBMITTING' });
      }
      return;
    }

    dispatch({ type: 'START_SUBMITTING' });
    try {
      const result = await signup(state.name, state.email, state.password, storedPhone, state.role, undefined, {
        emailOtpVerified,
        phoneVerified: phoneOtpVerified,
      });
      if (result.success) {
        dispatch({ type: 'SET_SUCCESS', success: 'Registration successful! Redirecting...' });
        setTimeout(() => navigate(getPostAuthPath(result.profile)), 1200);
      } else {
        dispatch({ type: 'SET_ERROR', error: result.error || ERROR_MESSAGES.SIGNUP_FAILED });
      }
    } catch (e) {
      const error = toAuthError(e);
      dispatch({ type: 'SET_ERROR', error: error.message || ERROR_MESSAGES.SIGNUP_FAILED });
    } finally {
      dispatch({ type: 'END_SUBMITTING' });
    }
  };

  const roles: { value: UserRole; label: string; desc: string; icon: React.ReactNode }[] = [
    { value: 'passenger', label: 'Passenger', desc: 'Book tickets', icon: <IconUser size={18} /> },
    { value: 'company', label: 'Company', desc: 'Manage fleet', icon: <IconBuilding size={18} /> },
    { value: 'operator', label: 'Operator', desc: 'Scan tickets', icon: <IconScan size={18} /> },
  ];

  const fieldClasses =
    'w-full bg-surface-secondary border border-border-light rounded-xl px-4 py-3 text-[13px] text-gray-800 font-medium focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all';

  return (
    <div className="min-h-[calc(100vh-60px)] bg-surface-secondary flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-[420px] slide-up">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-fit">
            <LogoMark size={48} />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Create account</h1>
          <p className="text-gray-400 mt-1 text-sm">Join BusBook Rwanda today</p>
        </div>

        <div className="bg-white rounded-2xl border border-border shadow-sm p-6 sm:p-7">
          {state.error && <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-2.5 rounded-xl mb-4 text-xs font-medium">{state.error}</div>}
          {state.success && <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-4 py-2.5 rounded-xl mb-4 text-xs font-medium flex items-center gap-2"><IconCheckCircle size={16} /> {state.success}</div>}
          {state.verificationNotice && <div className="bg-blue-50 border border-blue-100 text-blue-600 px-4 py-2.5 rounded-xl mb-4 text-xs font-medium">{state.verificationNotice}</div>}

          {state.role === 'passenger' && (
            <div className="mb-4 space-y-2">
              <div className="rounded-xl border border-border-light bg-surface-secondary p-4">
                <p className="text-[12px] font-semibold text-gray-800">Quick signup options</p>
                <p className="text-[11px] text-gray-400">Passenger accounts can start with social login and finish verification in Settings.</p>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {socialOptions.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => handleSocialSignup(item.action)}
                      className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[13px] font-semibold transition-all ${item.className}`}
                    >
                      {item.icon && <span className="inline-flex">{item.icon}</span>}


                      Continue with {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block">I am a</label>
              <div className="grid grid-cols-3 gap-2">
                {roles.map((roleOption) => (
                  <button
                    key={roleOption.value}
                    type="button"
                    onClick={() => dispatch({ type: 'SET_FIELD', field: 'role', value: roleOption.value })}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${state.role === roleOption.value ? 'border-primary-500 bg-primary-50 text-primary-600' : 'border-border-light text-gray-400 hover:border-gray-300'}`}
                  >
                    {roleOption.icon}
                    <span className="text-[11px] font-semibold">{roleOption.label}</span>
                    <span className="text-[9px] text-gray-400">{roleOption.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {state.role === 'company' && (
              <>
                <div>
                  <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Company Name</label>
                  <input type="text" value={state.companyName} onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'companyName', value: e.target.value })} placeholder="e.g., Safari Express Ltd." className={fieldClasses} required />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Description</label>
                  <textarea value={state.companyDescription} onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'companyDescription', value: e.target.value })} placeholder="Brief description…" rows={2} className={`${fieldClasses} resize-none`} />
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-[11px] text-amber-700 font-medium">
                  Company registrations require admin approval before activation.
                </div>
              </>
            )}

            {state.role === 'operator' && (
              <div>
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Company code</label>
                <input
                  type="text"
                  value={state.companyCode}
                  onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'companyCode', value: e.target.value })}
                  placeholder="Ask your company admin for this code"
                  className={fieldClasses}
                  required
                />
                <p className="text-[10px] text-gray-400 mt-1.5">
                  This is the company ID shown in the company dashboard.
                </p>
              </div>
            )}

            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">{state.role === 'company' ? 'Owner name' : 'Full name'}</label>
              <input type="text" value={state.name} onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'name', value: e.target.value })} placeholder="Full name" className={fieldClasses} required />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Email</label>
              <input type="email" value={state.email} onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'email', value: e.target.value })} placeholder="you@email.com" className={fieldClasses} required />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Phone</label>
              <input type="tel" value={state.phone} onChange={(e) => {
                dispatch({ type: 'SET_FIELD', field: 'phone', value: normalizePhoneInput(e.target.value) });
              }} placeholder="0781234567 or +250788123456" className={fieldClasses} required />
              {phoneValidationError && (
                <p className="text-[10px] text-red-500 mt-1">{phoneValidationError}</p>
              )}
            </div>

            <div className="rounded-xl border border-border-light bg-surface-secondary p-4 space-y-3">
              <div>
                <p className="text-[12px] font-semibold text-gray-800">Verification checks</p>
                <p className="text-[11px] text-gray-400">You can verify now or continue and finish later in Settings.</p>
              </div>

              <EmailVerificationStep
                email={normalizedEmail}
                verified={emailOtpVerified}
                otp={state.emailOtp}
                onOtpChange={(value) => dispatch({ type: 'SET_FIELD', field: 'emailOtp', value })}
                onSend={handleSendEmailOtp}
                onVerify={handleVerifyEmailOtp}
                sending={state.sendingEmailOtp}
                verifying={state.verifyingEmailOtp}
                countdown={state.countdown}
              />

              <PhoneVerificationStep
                phone={normalizedPhone}
                verified={phoneOtpVerified}
                otp={state.phoneOtp}
                onOtpChange={(value) => dispatch({ type: 'SET_FIELD', field: 'phoneOtp', value })}
                onSend={handleSendPhoneOtp}
                onVerify={handleVerifyPhoneOtp}
                sending={state.sendingPhoneOtp}
                verifying={state.verifyingPhoneOtp}
                hasSession={!!state.phoneOtpSession}
              />
              <div id="signup-phone-recaptcha" />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Password</label>
              <input type="password" value={state.password} onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'password', value: e.target.value })} placeholder="Min. 6 characters" className={fieldClasses} required />
            </div>
            <button type="submit" disabled={state.submitting} className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-primary-200 active:scale-[0.99] text-[13px]">
              {state.submitting ? 'Creating account...' : state.role === 'company' ? 'Submit registration' : 'Create account'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-gray-400 text-xs">Already have an account? <Link to="/login" className="text-primary-600 font-semibold hover:underline">Log in</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
