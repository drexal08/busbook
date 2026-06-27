import React, { useEffect, useState } from 'react';
import type { ConfirmationResult } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  refreshCurrentUserProfile,
  resendVerificationEmail,
  updateUserVerificationFlags,
} from '../lib/auth';
import {
  confirmCurrentUserPhoneOtp,
  requestCurrentUserPhoneOtp,
  sendEmailOtp,
  verifyEmailOtp,
} from '../lib/verification';
import { getDashboardPath, needsAccountVerification } from '../lib/userRoutes';
import {
  IconArrowRight,
  IconCheckCircle,
  IconLock,
  IconMail,
  IconPhone,
} from '../components/Icons';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../lib/auth/constants';
import { toAuthError } from '../lib/auth/errors';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading, refreshUser } = useAuth();
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneSession, setPhoneSession] = useState<ConfirmationResult | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [loading, navigate, user]);

  useEffect(() => {
    setPhone(user?.phone || '');
  }, [user?.phone]);

  const setFeedback = (nextSuccess = '', nextError = '') => {
    setSuccess(nextSuccess);
    setError(nextError);
  };

  const refreshAndSync = async () => {
    const profile = await refreshCurrentUserProfile();
    if (profile) {
      await refreshUser();
    }
  };

  const handleSendVerificationEmail = async () => {
    try {
      setBusy('email-link');
      setFeedback();
      await resendVerificationEmail();
      setFeedback('', SUCCESS_MESSAGES.VERIFICATION_EMAIL_SENT);
    } catch (e) {
      const error = toAuthError(e);
      setFeedback('', error.message || ERROR_MESSAGES.UNKNOWN_ERROR);
    } finally {
      setBusy(null);
    }
  };

  const handleRefreshEmailStatus = async () => {
    try {
      setBusy('refresh-email');
      setFeedback();
      await refreshAndSync();
      setFeedback('', SUCCESS_MESSAGES.EMAIL_STATUS_REFRESHED);
    } catch (e) {
      const error = toAuthError(e);
      setFeedback('', error.message || ERROR_MESSAGES.UNKNOWN_ERROR);
    } finally {
      setBusy(null);
    }
  };

  const handleSendEmailOtp = async () => {
    if (!user?.email) return;

    try {
      setBusy('email-otp-send');
      setFeedback();
      await sendEmailOtp(user.email);
      setFeedback('', SUCCESS_MESSAGES.EMAIL_OTP_SENT);
    } catch (e) {
      const error = toAuthError(e);
      setFeedback('', error.message || ERROR_MESSAGES.UNKNOWN_ERROR);
    } finally {
      setBusy(null);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!user?.email || !emailOtp.trim()) {
      setFeedback('', ERROR_MESSAGES.EMAIL_OTP_REQUIRED);
      return;
    }

    try {
      setBusy('email-otp-verify');
      setFeedback();
      await verifyEmailOtp(user.email, emailOtp.trim());
      await updateUserVerificationFlags(user.id, { emailOtpVerified: true });
      await refreshUser();
      setFeedback('', SUCCESS_MESSAGES.EMAIL_OTP_VERIFIED);
    } catch (e) {
      const error = toAuthError(e);
      setFeedback('', error.message || ERROR_MESSAGES.UNKNOWN_ERROR);
    } finally {
      setBusy(null);
    }
  };

  const handleSendPhoneOtp = async () => {
    if (!phone.trim()) {
      setFeedback('', ERROR_MESSAGES.PHONE_REQUIRED);
      return;
    }

    // Validate phone number
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    if (!/^(\+250)?(07[2389]|2507[2389])\d{7}$/.test(cleanPhone)) {
      setFeedback('', 'Invalid phone number. Must start with 078, 079, 073, 072 or +250');
      return;
    }

    try {
      setBusy('phone-otp-send');
      setFeedback();
      const session = await requestCurrentUserPhoneOtp(
        cleanPhone,
        'settings-phone-recaptcha'
      );
      setPhoneSession(session);
      setFeedback('', SUCCESS_MESSAGES.PHONE_OTP_SENT);
    } catch (e) {
      const error = toAuthError(e);
      setFeedback('', error.message || ERROR_MESSAGES.UNKNOWN_ERROR);
    } finally {
      setBusy(null);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!phoneSession || !phoneOtp.trim() || !user) {
      setFeedback('', ERROR_MESSAGES.PHONE_OTP_REQUIRED);
      return;
    }

    try {
      setBusy('phone-otp-verify');
      setFeedback();
      await confirmCurrentUserPhoneOtp(phoneSession, phoneOtp.trim());
      await updateUserVerificationFlags(user.id, {
        phone: phone.trim(),
        phoneVerified: true,
      });
      setPhoneSession(null);
      await refreshUser();
      setFeedback('', SUCCESS_MESSAGES.PHONE_OTP_VERIFIED);
    } catch (e) {
      const error = toAuthError(e);
      setFeedback('', error.message || ERROR_MESSAGES.UNKNOWN_ERROR);
    } finally {
      setBusy(null);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-[calc(100vh-60px)] bg-surface-secondary flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-60px)] bg-surface-secondary py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-300">Account Settings</p>
              <h1 className="text-lg font-bold text-gray-900 mt-1">{user.name}</h1>
              <p className="text-sm text-gray-400">{user.email}</p>
            </div>
            <button
              onClick={() => navigate(getDashboardPath(user.role))}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2.5 text-[12px] font-semibold text-white transition-all hover:bg-primary-700"
            >
              Open dashboard
              <IconArrowRight size={14} />
            </button>
          </div>

          {needsAccountVerification(user) ? (
            <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-[12px] font-medium text-amber-700">
              Some verification steps are still pending. Complete them below to fully secure this account.
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-[12px] font-medium text-emerald-700 flex items-center gap-2">
              <IconCheckCircle size={16} />
              Your account is fully verified.
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[12px] font-medium text-red-600">
              {error}
            </div>
          )}
          {success && (
            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-[12px] font-medium text-blue-600">
              {success}
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${user.emailVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-surface-secondary text-gray-400'}`}>
                <IconMail size={18} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Email verification link</h2>
                <p className="text-[12px] text-gray-400">
                  {user.emailVerified ? 'Email address verified in Firebase Auth' : 'Send and confirm the verification link from your inbox'}
                </p>
              </div>
            </div>

            {!user.emailVerified && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSendVerificationEmail}
                  disabled={busy === 'email-link'}
                  className="rounded-xl border border-border px-4 py-2.5 text-[12px] font-semibold text-gray-700 transition-all hover:bg-surface-secondary disabled:opacity-60"
                >
                  {busy === 'email-link' ? 'Sending...' : 'Send verification link'}
                </button>
                <button
                  type="button"
                  onClick={handleRefreshEmailStatus}
                  disabled={busy === 'refresh-email'}
                  className="rounded-xl bg-primary-600 px-4 py-2.5 text-[12px] font-semibold text-white transition-all hover:bg-primary-700 disabled:opacity-60"
                >
                  {busy === 'refresh-email' ? 'Refreshing...' : 'I have verified'}
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${user.emailOtpVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-surface-secondary text-gray-400'}`}>
                <IconLock size={18} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Email OTP</h2>
                <p className="text-[12px] text-gray-400">
                  {user.emailOtpVerified ? 'Email OTP already confirmed' : 'Receive a 6-digit email code and confirm it here'}
                </p>
              </div>
            </div>

            {!user.emailOtpVerified && (
              <div className="space-y-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={emailOtp}
                  onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter email OTP"
                  className="w-full rounded-xl border border-border-light bg-surface-secondary px-4 py-3 text-[13px] text-gray-800 font-medium outline-none transition-all focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleSendEmailOtp}
                    disabled={busy === 'email-otp-send'}
                    className="rounded-xl border border-border px-4 py-2.5 text-[12px] font-semibold text-gray-700 transition-all hover:bg-surface-secondary disabled:opacity-60"
                  >
                    {busy === 'email-otp-send' ? 'Sending...' : 'Send OTP'}
                  </button>
                  <button
                    type="button"
                    onClick={handleVerifyEmailOtp}
                    disabled={busy === 'email-otp-verify'}
                    className="rounded-xl bg-primary-600 px-4 py-2.5 text-[12px] font-semibold text-white transition-all hover:bg-primary-700 disabled:opacity-60"
                  >
                    {busy === 'email-otp-verify' ? 'Checking...' : 'Verify OTP'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-4 md:col-span-2">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${user.phoneVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-surface-secondary text-gray-400'}`}>
                <IconPhone size={18} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Phone OTP</h2>
                <p className="text-[12px] text-gray-400">
                  {user.phoneVerified ? 'Phone number already verified' : 'Link and verify your phone number with an SMS code'}
                </p>
              </div>
            </div>

            {!user.phoneVerified && (
              <>
                <div className="grid gap-2 md:grid-cols-[1fr_auto_auto]">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\s+/g, '');
                      // Allow only digits and + sign
                      if (/^[0+]*$/.test(value)) {
                        setPhone(value);
                      }
                    }}
                    placeholder="0781234567 or +250788123456"
                    className="w-full rounded-xl border border-border-light bg-surface-secondary px-4 py-3 text-[13px] text-gray-800 font-medium outline-none transition-all focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                  />
                  {phone && !/^(\+250)?(07[2389]|2507[2389])\d{7}$/.test(phone.replace(/\s+/g, '')) && (
                    <p className="text-[10px] text-red-500 col-span-3">Must start with 078, 079, 073, 072 or +250</p>
                  )}
                  <button
                    type="button"
                    onClick={handleSendPhoneOtp}
                    disabled={busy === 'phone-otp-send'}
                    className="rounded-xl border border-border px-4 py-2.5 text-[12px] font-semibold text-gray-700 transition-all hover:bg-surface-secondary disabled:opacity-60"
                  >
                    {busy === 'phone-otp-send' ? 'Sending...' : 'Send SMS'}
                  </button>
                  <button
                    type="button"
                    onClick={handleVerifyPhoneOtp}
                    disabled={busy === 'phone-otp-verify' || !phoneSession}
                    className="rounded-xl bg-primary-600 px-4 py-2.5 text-[12px] font-semibold text-white transition-all hover:bg-primary-700 disabled:opacity-60"
                  >
                    {busy === 'phone-otp-verify' ? 'Checking...' : 'Verify SMS'}
                  </button>
                </div>

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={phoneOtp}
                  onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter phone OTP"
                  className="w-full rounded-xl border border-border-light bg-surface-secondary px-4 py-3 text-[13px] text-gray-800 font-medium outline-none transition-all focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                />
                <div id="settings-phone-recaptcha" />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
