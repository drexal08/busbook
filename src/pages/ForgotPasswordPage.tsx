import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendResetPasswordEmail } from '../lib/auth';
import { IconCheckCircle, IconMail } from '../components/Icons';
import { LogoMark } from '../components/Logo';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await sendResetPasswordEmail(email.trim());
      setSuccess('Password reset email sent. Check your inbox and spam folder.');
    } catch (e: any) {
      setError(e.message || 'Could not send password reset email');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-60px)] bg-surface-secondary flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-[400px] slide-up">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-fit">
            <LogoMark size={48} />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Reset password</h1>
          <p className="text-gray-400 mt-1 text-sm">We’ll send a reset link to your email address.</p>
        </div>

        <div className="bg-white rounded-2xl border border-border shadow-sm p-6 sm:p-7">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-2.5 rounded-xl mb-4 text-xs font-medium">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-4 py-2.5 rounded-xl mb-4 text-xs font-medium flex items-center gap-2">
              <IconCheckCircle size={16} />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Email</label>
              <div className="relative">
                <IconMail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-secondary border border-border-light rounded-xl pl-10 pr-4 py-3 text-[13px] text-gray-800 font-medium focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                  placeholder="you@email.com"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary-700 hover:bg-primary-800 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3 rounded-xl transition-all text-[13px]"
            >
              {submitting ? 'Sending...' : 'Send reset link'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-gray-400 text-xs">
              Remembered your password?{' '}
              <Link to="/login" className="text-primary-600 font-semibold hover:underline">
                Back to login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
