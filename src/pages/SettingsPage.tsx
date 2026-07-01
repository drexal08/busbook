import React, { useEffect, useState } from 'react';
import type { ConfirmationResult } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  deleteCurrentUserAccount,
  refreshCurrentUserProfile,
  resendVerificationEmail,
  updateCurrentUserName,
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
  IconSettings,
  IconLock,
  IconMail,
  IconPhone,
  IconUser,
  IconXCircle,
} from '../components/Icons';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../lib/auth/constants';
import { toAuthError } from '../lib/auth/errors';
import {
  normalizePhoneInput,
  toRwandaE164Phone,
  validateSupportedPhone,
} from '../lib/phone';

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
  const [name, setName] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const normalizedPhone = normalizePhoneInput(phone);
  const canonicalPhone = toRwandaE164Phone(normalizedPhone);
  const phoneValidationError = normalizedPhone ? validateSupportedPhone(normalizedPhone) : '';

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [loading, navigate, user]);

  useEffect(() => {
    setPhone(user?.phone || '');
    setName(user?.name || '');
  }, [user?.name, user?.phone]);

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

  const handleUpdateName = async () => {
    if (!user) return;

    if (!name.trim()) {
      setFeedback('', 'Enter a username first');
      return;
    }

    if (name.trim() === user.name.trim()) {
      setFeedback('Your username is already up to date.');
      return;
    }

    try {
      setBusy('profile-name');
      setFeedback();
      await updateCurrentUserName(name);
      await refreshUser();
      setFeedback('Username updated successfully.');
    } catch (e) {
      const error = toAuthError(e);
      setFeedback('', error.message || ERROR_MESSAGES.UNKNOWN_ERROR);
    } finally {
      setBusy(null);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation.trim().toUpperCase() !== 'DELETE') {
      setFeedback('', 'Type DELETE to confirm account deletion');
      return;
    }

    try {
      setBusy('delete-account');
      setFeedback();
      await deleteCurrentUserAccount();
      navigate('/');
    } catch (e) {
      const error = toAuthError(e);
      const message =
        error.message.includes('recent') || error.message.includes('credential')
          ? 'Please log in again before deleting your account.'
          : error.message || ERROR_MESSAGES.UNKNOWN_ERROR;
      setFeedback('', message);
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
    const phoneError = validateSupportedPhone(normalizedPhone);
    if (phoneError) {
      setFeedback('', !normalizedPhone ? ERROR_MESSAGES.PHONE_REQUIRED : phoneError);
      return;
    }

    try {
      setBusy('phone-otp-send');
      setFeedback();
      const session = await requestCurrentUserPhoneOtp(
        canonicalPhone,
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
        phone: canonicalPhone || normalizedPhone,
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

  const authProviderLabel =
    user.authProvider === 'google'
      ? 'Google'
      : user.authProvider === 'facebook'
      ? 'Facebook'
      : 'Email & Password';
  const joinedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Unknown';
  const verificationStatus = needsAccountVerification(user) ? 'Pending' : 'Complete';
  const accountOverview = [
    ['Role', user.role.charAt(0).toUpperCase() + user.role.slice(1)],
    ['Sign-in', authProviderLabel],
    ['Member since', joinedDate],
    ['Verification', verificationStatus],
  ];

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
          <div className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-4 md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-surface-secondary text-gray-500">
                <IconSettings size={18} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Account overview</h2>
                <p className="text-[12px] text-gray-400">
                  Quick details about this profile and how it is currently secured
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {accountOverview.map(([label, value]) => (
                <div key={label} className="rounded-xl border border-border-light bg-surface-secondary px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">{label}</p>
                  <p className="mt-1 text-[13px] font-semibold text-gray-900">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary-50 text-primary-600">
                <IconUser size={18} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Profile details</h2>
                <p className="text-[12px] text-gray-400">
                  Change the username shown across your account and bookings
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                Username
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your username"
                className="w-full rounded-xl border border-border-light bg-surface-secondary px-4 py-3 text-[13px] text-gray-800 font-medium outline-none transition-all focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              />
            </div>

            <div className="rounded-xl border border-primary-100 bg-primary-50 px-4 py-3 text-[12px] text-primary-700">
              Your email stays the same. Only the display name changes.
            </div>

            <button
              type="button"
              onClick={handleUpdateName}
              disabled={busy === 'profile-name'}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-[12px] font-semibold text-white transition-all hover:bg-primary-700 disabled:opacity-60"
            >
              <IconSettings size={16} />
              {busy === 'profile-name' ? 'Saving...' : 'Save username'}
            </button>
          </div>

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
                      setPhone(normalizePhoneInput(e.target.value));
                    }}
                    placeholder="0781234567 or +250788123456"
                    className="w-full rounded-xl border border-border-light bg-surface-secondary px-4 py-3 text-[13px] text-gray-800 font-medium outline-none transition-all focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                  />
                  {phoneValidationError && (
                    <p className="text-[10px] text-red-500 col-span-3">{phoneValidationError}</p>
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

          <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5 space-y-4 md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-50 text-red-500">
                <IconXCircle size={18} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Danger zone</h2>
                <p className="text-[12px] text-gray-400">
                  Permanently delete this user account and remove access to your profile
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[12px] text-red-600">
              This action cannot be undone. Type DELETE below before continuing.
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full rounded-xl border border-red-100 bg-white px-4 py-3 text-[13px] text-gray-800 font-medium outline-none transition-all focus:border-red-300 focus:ring-2 focus:ring-red-100"
              />
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={busy === 'delete-account'}
                className="rounded-xl bg-red-500 px-4 py-2.5 text-[12px] font-semibold text-white transition-all hover:bg-red-600 disabled:opacity-60"
              >
                {busy === 'delete-account' ? 'Deleting...' : 'Delete account'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
