import React from 'react';
import { IconPhone } from '../Icons';
import { LOADING_MESSAGES } from '../../lib/auth/constants';

interface PhoneVerificationStepProps {
  phone: string;
  verified: boolean;
  otp: string;
  onOtpChange: (value: string) => void;
  onSend: () => void;
  onVerify: () => void;
  sending: boolean;
  verifying: boolean;
  hasSession: boolean;
}

export const PhoneVerificationStep: React.FC<PhoneVerificationStepProps> = ({
  phone,
  verified,
  otp,
  onOtpChange,
  onSend,
  onVerify,
  sending,
  verifying,
  hasSession,
}) => {
  if (!phone) {
    return null;
  }

  return (
    <div className="rounded-xl border border-white bg-white p-3 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <IconPhone size={16} className={verified ? 'text-emerald-500' : 'text-gray-300'} />
          <div>
            <p className="text-[12px] font-semibold text-gray-800">Phone OTP</p>
            <p className="text-[11px] text-gray-400">
              {verified ? 'Verified for this phone number' : 'Send an SMS code to confirm your number'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onSend}
          disabled={sending}
          className="rounded-lg border border-border px-3 py-2 text-[11px] font-semibold text-gray-700 transition-all hover:bg-surface-secondary disabled:opacity-60"
        >
          {sending ? LOADING_MESSAGES.SENDING_PHONE_OTP : 'Send SMS'}
        </button>
      </div>

      {!verified && (
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(e) => onOtpChange(e.target.value.replace(/\D/g, ''))}
            placeholder="Enter phone OTP"
            className="w-full bg-surface-secondary border border-border-light rounded-xl px-4 py-3 text-[13px] text-gray-800 font-medium focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
          />
          <button
            type="button"
            onClick={onVerify}
            disabled={verifying || !hasSession}
            className="shrink-0 rounded-xl bg-primary-600 px-4 py-3 text-[12px] font-semibold text-white transition-all hover:bg-primary-700 disabled:opacity-60"
          >
            {verifying ? LOADING_MESSAGES.VERIFYING_PHONE_OTP : 'Verify'}
          </button>
        </div>
      )}
    </div>
  );
};
