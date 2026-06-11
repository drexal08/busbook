import React from 'react';
import { IconMail } from '../Icons';
import { LOADING_MESSAGES } from '../../lib/auth/constants';

interface EmailVerificationStepProps {
  email: string;
  verified: boolean;
  otp: string;
  onOtpChange: (value: string) => void;
  onSend: () => void;
  onVerify: () => void;
  sending: boolean;
  verifying: boolean;
  countdown?: number;
}

export const EmailVerificationStep: React.FC<EmailVerificationStepProps> = ({
  email,
  verified,
  otp,
  onOtpChange,
  onSend,
  onVerify,
  sending,
  verifying,
  countdown = 0,
}) => {
  if (!email) {
    return null;
  }

  return (
    <div className="rounded-xl border border-white bg-white p-3 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <IconMail size={16} className={verified ? 'text-emerald-500' : 'text-gray-300'} />
          <div>
            <p className="text-[12px] font-semibold text-gray-800">Email OTP</p>
            <p className="text-[11px] text-gray-400">
              {verified ? 'Verified for this email' : 'Send a 6-digit code to your email'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onSend}
          disabled={sending || countdown > 0}
          className="rounded-lg border border-border px-3 py-2 text-[11px] font-semibold text-gray-700 transition-all hover:bg-surface-secondary disabled:opacity-60"
        >
          {sending ? LOADING_MESSAGES.SENDING_EMAIL_OTP : countdown > 0 ? `Resend (${countdown}s)` : 'Send code'}
        </button>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={otp}
          onChange={(e) => onOtpChange(e.target.value.replace(/\D/g, ''))}
          placeholder="Enter email OTP"
          className="w-full bg-surface-secondary border border-border-light rounded-xl px-4 py-3 text-[13px] text-gray-800 font-medium focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
        />
        <button
          type="button"
          onClick={onVerify}
          disabled={verifying || verified}
          className="shrink-0 rounded-xl bg-primary-600 px-4 py-3 text-[12px] font-semibold text-white transition-all hover:bg-primary-700 disabled:opacity-60"
        >
          {verifying ? LOADING_MESSAGES.VERIFYING_EMAIL_OTP : verified ? 'Verified' : 'Verify'}
        </button>
      </div>
    </div>
  );
};
