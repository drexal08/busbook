import React, { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { ConfirmationResult } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { UserRole } from '../types';
import { IconUser, IconBuilding, IconScan, IconCheckCircle, IconMail, IconPhone } from '../components/Icons';
import { LogoMark } from '../components/Logo';
import { deleteRegistration } from '../lib/auth';
import {
  confirmSignupPhoneOtp,
  requestSignupPhoneOtp,
  sendEmailOtp,
  verifyEmailOtp,
} from '../lib/verification';
import { getPostAuthPath } from '../lib/userRoutes';

const SignupPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('passenger');
  const [companyName, setCompanyName] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpVerifiedFor, setEmailOtpVerifiedFor] = useState('');
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [verifyingEmailOtp, setVerifyingEmailOtp] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState('');
  const [sendingPhoneOtp, setSendingPhoneOtp] = useState(false);
  const [verifyingPhoneOtp, setVerifyingPhoneOtp] = useState(false);
  const [phoneOtpVerifiedFor, setPhoneOtpVerifiedFor] = useState('');
  const [phoneOtpSession, setPhoneOtpSession] = useState<ConfirmationResult | null>(null);
  const [verificationNotice, setVerificationNotice] = useState('');
  const { signup, loginWithGoogle, loginWithFacebook } = useAuth();
  const { companies, loading, addCompanyWithId } = useData();
  const navigate = useNavigate();

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPhone = phone.trim().replace(/\s+/g, '');
  const emailOtpVerified = !!normalizedEmail && emailOtpVerifiedFor === normalizedEmail;
  const phoneOtpVerified = !!normalizedPhone && phoneOtpVerifiedFor === normalizedPhone;

  const socialOptions = useMemo(
    () => [
      {
        label: 'Google',
        action: async () => loginWithGoogle(),
        className: 'border border-border text-gray-700 hover:bg-gray-50',
        markClassName: 'bg-white text-gray-700 border border-border',
        mark: 'G',
      },
      {
        label: 'Facebook',
        action: async () => loginWithFacebook(),
        className: 'bg-[#1877F2] text-white hover:bg-[#1667d8]',
        markClassName: 'bg-white/20 text-white',
        mark: 'f',
      },
    ],
    [loginWithFacebook, loginWithGoogle]
  );

  const resetVerificationMessages = () => {
    setError('');
    setSuccess('');
    setVerificationNotice('');
  };

  const handleSendEmailOtp = async () => {
    if (!normalizedEmail) {
      setError('Enter your email address first');
      return;
    }

    try {
      setSendingEmailOtp(true);
      resetVerificationMessages();
      await sendEmailOtp(normalizedEmail);
      setEmailOtpVerifiedFor('');
      setVerificationNotice('Email OTP sent. Check your inbox for the 6-digit code.');
    } catch (e: any) {
      setError(e.message || 'Could not send email OTP');
    } finally {
      setSendingEmailOtp(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!normalizedEmail || !emailOtp.trim()) {
      setError('Enter the email OTP code first');
      return;
    }

    try {
      setVerifyingEmailOtp(true);
      resetVerificationMessages();
      await verifyEmailOtp(normalizedEmail, emailOtp.trim());
      setEmailOtpVerifiedFor(normalizedEmail);
      setVerificationNotice('Email OTP verified successfully.');
    } catch (e: any) {
      setError(e.message || 'Email OTP verification failed');
    } finally {
      setVerifyingEmailOtp(false);
    }
  };

  const handleSendPhoneOtp = async () => {
    if (!normalizedPhone) {
      setError('Enter your phone number first');
      return;
    }

    try {
      setSendingPhoneOtp(true);
      resetVerificationMessages();
      const session = await requestSignupPhoneOtp(normalizedPhone, 'signup-phone-recaptcha');
      setPhoneOtpSession(session);
      setPhoneOtpVerifiedFor('');
      setVerificationNotice('Phone OTP sent. Enter the SMS code to confirm your number.');
    } catch (e: any) {
      setError(e.message || 'Could not send phone OTP');
    } finally {
      setSendingPhoneOtp(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!phoneOtpSession || !phoneOtp.trim()) {
      setError('Send the phone OTP and enter the SMS code first');
      return;
    }

    try {
      setVerifyingPhoneOtp(true);
      resetVerificationMessages();
      await confirmSignupPhoneOtp(phoneOtpSession, phoneOtp.trim());
      setPhoneOtpVerifiedFor(normalizedPhone);
      setPhoneOtpSession(null);
      setVerificationNotice('Phone number verified successfully.');
    } catch (e: any) {
      setError(e.message || 'Phone OTP verification failed');
    } finally {
      setVerifyingPhoneOtp(false);
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
    setError(result.error || 'Social signup failed');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    resetVerificationMessages();

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (role === 'company' && !companyName.trim()) {
      setError('Company name is required');
      return;
    }

    if (role === 'operator' && !companyCode.trim()) {
      setError('Company code is required');
      return;
    }

    if (role === 'operator') {
      if (loading) {
        setError('Company data is still loading. Please try again in a moment.');
        return;
      }

      const companyExists = companies.find(
        (company) => company.id === companyCode.trim() && company.status === 'approved'
      );
      if (!companyExists) {
        setError('Invalid company code or company not approved');
        return;
      }
    }

    if (role === 'company') {
      setSubmitting(true);
      const companyId = `comp-${Date.now()}`;
      try {
        const result = await signup(name, email, password, phone, role, companyId, {
          emailOtpVerified,
          phoneVerified: phoneOtpVerified,
        });
        if (!result.success || !result.userId) {
          setError(result.error || 'Registration failed');
          return;
        }

        try {
          await addCompanyWithId({
            id: companyId,
            name: companyName,
            ownerId: result.userId,
            description: companyDescription || 'New bus company',
            status: 'pending',
            phone,
            email,
            createdAt: new Date().toISOString().split('T')[0],
          });
        } catch (setupError) {
          await deleteRegistration(result.userId);
          throw setupError;
        }

        setSuccess('Registration submitted. Complete remaining verification in Settings while approval is pending.');
        setTimeout(() => navigate(getPostAuthPath(result.profile)), 1200);
      } catch (e: any) {
        setError(e.message || 'Registration failed. Please try again.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (role === 'operator') {
      setSubmitting(true);
      try {
        const result = await signup(name, email, password, phone, role, companyCode.trim(), {
          emailOtpVerified,
          phoneVerified: phoneOtpVerified,
        });
        if (result.success && result.userId) {
          setSuccess('Registration submitted. Finish verification in Settings while company approval is pending.');
          setTimeout(() => navigate(getPostAuthPath(result.profile)), 1200);
        } else {
          setError(result.error || 'Registration failed');
        }
      } finally {
        setSubmitting(false);
      }
      return;
    }

    setSubmitting(true);
    try {
      const result = await signup(name, email, password, phone, role, undefined, {
        emailOtpVerified,
        phoneVerified: phoneOtpVerified,
      });
      if (result.success) navigate(getPostAuthPath(result.profile));
      else setError(result.error || 'Signup failed');
    } finally {
      setSubmitting(false);
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
          {error && <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-2.5 rounded-xl mb-4 text-xs font-medium">{error}</div>}
          {success && <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-4 py-2.5 rounded-xl mb-4 text-xs font-medium flex items-center gap-2"><IconCheckCircle size={16} /> {success}</div>}
          {verificationNotice && <div className="bg-blue-50 border border-blue-100 text-blue-600 px-4 py-2.5 rounded-xl mb-4 text-xs font-medium">{verificationNotice}</div>}

          {role === 'passenger' && (
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
                      <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${item.markClassName}`}>
                        {item.mark}
                      </span>
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
                    onClick={() => setRole(roleOption.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${role === roleOption.value ? 'border-primary-500 bg-primary-50 text-primary-600' : 'border-border-light text-gray-400 hover:border-gray-300'}`}
                  >
                    {roleOption.icon}
                    <span className="text-[11px] font-semibold">{roleOption.label}</span>
                    <span className="text-[9px] text-gray-400">{roleOption.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {role === 'company' && (
              <>
                <div>
                  <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Company Name</label>
                  <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g., Safari Express Ltd." className={fieldClasses} required />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Description</label>
                  <textarea value={companyDescription} onChange={(e) => setCompanyDescription(e.target.value)} placeholder="Brief description…" rows={2} className={`${fieldClasses} resize-none`} />
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-[11px] text-amber-700 font-medium">
                  Company registrations require admin approval before activation.
                </div>
              </>
            )}

            {role === 'operator' && (
              <div>
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Company code</label>
                <input
                  type="text"
                  value={companyCode}
                  onChange={(e) => setCompanyCode(e.target.value)}
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
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">{role === 'company' ? 'Owner name' : 'Full name'}</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className={fieldClasses} required />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className={fieldClasses} required />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Phone</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+250 788 000 000" className={fieldClasses} required />
            </div>

            <div className="rounded-xl border border-border-light bg-surface-secondary p-4 space-y-3">
              <div>
                <p className="text-[12px] font-semibold text-gray-800">Verification checks</p>
                <p className="text-[11px] text-gray-400">You can verify now or continue and finish later in Settings.</p>
              </div>

              <div className="rounded-xl border border-white bg-white p-3 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <IconMail size={16} className={emailOtpVerified ? 'text-emerald-500' : 'text-gray-300'} />
                    <div>
                      <p className="text-[12px] font-semibold text-gray-800">Email OTP</p>
                      <p className="text-[11px] text-gray-400">
                        {emailOtpVerified ? 'Verified for this email' : 'Send a 6-digit code to your email'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSendEmailOtp}
                    disabled={sendingEmailOtp}
                    className="rounded-lg border border-border px-3 py-2 text-[11px] font-semibold text-gray-700 transition-all hover:bg-surface-secondary disabled:opacity-60"
                  >
                    {sendingEmailOtp ? 'Sending...' : 'Send code'}
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter email OTP"
                    className={fieldClasses}
                  />
                  <button
                    type="button"
                    onClick={handleVerifyEmailOtp}
                    disabled={verifyingEmailOtp}
                    className="shrink-0 rounded-xl bg-primary-600 px-4 py-3 text-[12px] font-semibold text-white transition-all hover:bg-primary-700 disabled:opacity-60"
                  >
                    {verifyingEmailOtp ? 'Checking...' : 'Verify'}
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-white bg-white p-3 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <IconPhone size={16} className={phoneOtpVerified ? 'text-emerald-500' : 'text-gray-300'} />
                    <div>
                      <p className="text-[12px] font-semibold text-gray-800">Phone OTP</p>
                      <p className="text-[11px] text-gray-400">
                        {phoneOtpVerified ? 'Verified for this phone number' : 'Send an SMS code to confirm your number'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSendPhoneOtp}
                    disabled={sendingPhoneOtp}
                    className="rounded-lg border border-border px-3 py-2 text-[11px] font-semibold text-gray-700 transition-all hover:bg-surface-secondary disabled:opacity-60"
                  >
                    {sendingPhoneOtp ? 'Sending...' : 'Send SMS'}
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={phoneOtp}
                    onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter phone OTP"
                    className={fieldClasses}
                  />
                  <button
                    type="button"
                    onClick={handleVerifyPhoneOtp}
                    disabled={verifyingPhoneOtp || !phoneOtpSession}
                    className="shrink-0 rounded-xl bg-primary-600 px-4 py-3 text-[12px] font-semibold text-white transition-all hover:bg-primary-700 disabled:opacity-60"
                  >
                    {verifyingPhoneOtp ? 'Checking...' : 'Verify'}
                  </button>
                </div>
                <div id="signup-phone-recaptcha" />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 characters" className={fieldClasses} required />
            </div>
            <button type="submit" disabled={submitting} className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-primary-200 active:scale-[0.99] text-[13px]">
              {submitting ? 'Creating account...' : role === 'company' ? 'Submit registration' : 'Create account'}
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
