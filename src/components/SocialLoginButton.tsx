import React from 'react';

interface SocialLoginButtonProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}

export const SocialLoginButton: React.FC<SocialLoginButtonProps> = ({
  label,
  icon,
  onClick,
  className = 'border border-border text-gray-700 hover:bg-surface-secondary',
  disabled = false,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full font-semibold py-3 rounded-xl text-[13px] flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {icon && <span className="inline-flex">{icon}</span>}
      {label}
    </button>
  );
};
