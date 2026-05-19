import React from 'react';

interface LogoMarkProps {
  size?: number;
  className?: string;
  variant?: 'primary' | 'white' | 'dark';
}

/**
 * BusBook Logomark — "The Hidden b"
 *
 * FIRST IMPRESSION:
 *   A single sweeping road ascending through Rwanda's
 *   thousand hills — from a quiet origin to a bright
 *   destination at the peak.
 *
 * THE SECRET:
 *   The entire path traces a lowercase "b".
 *   The stem: the road climbing upward.
 *   The bowl: the road curving through the hillside.
 *   Once it's pointed out, you can never unsee it.
 *
 * DESIGN DNA:
 *   • FedEx's arrow — hidden in the negative space
 *   • Apple's apple — one shape, zero decoration
 *   • Rwanda's geography — hills and roads made abstract
 *   • One continuous stroke — one journey, one story
 *
 *   The origin dot is soft and transparent — where you were.
 *   The destination dot is bold and bright — where you're going.
 *   The path between them IS the brand.
 */
export const LogoMark: React.FC<LogoMarkProps> = ({
  size = 32,
  className = '',
  variant = 'primary',
}) => {
  const bg: Record<string, string> = {
    primary: '#15316b',
    white: 'rgba(255,255,255,0.13)',
    dark: '#0f172a',
  };
  const fg: Record<string, string> = {
    primary: '#ffffff',
    white: '#ffffff',
    dark: '#ffffff',
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="40" height="40" rx="10" fill={bg[variant]} />

      {/*
        THE PATH — one continuous bezier stroke.

        Anatomically it's a lowercase "b":
          • The climb from (12,33) to (15,9) = the stem
          • The sweep from (15,9) through (29,4)→(29,16) = top of the bowl
          • The return from (29,16) through (27,26)→(18,23) = base of the bowl

        Visually it's a winding road through hills:
          • Rising through a valley
          • Cresting over a ridgeline
          • Sweeping back down to the destination

        The hidden "b" emerges when you trace the outline.
        Like FedEx's arrow — once you see it, it's permanent.
      */}
      <path
        d="M12 33 C12 25, 12 17, 15 9 C19 1, 29 3, 29 13 C29 22, 23 27, 18 23"
        stroke={fg[variant]}
        strokeWidth="2.8"
        strokeLinecap="round"
        fill="none"
      />

      {/* Origin — where you start. Subtle, past tense. */}
      <circle cx="12" cy="33" r="2" fill={fg[variant]} opacity="0.25" />

      {/* Destination — where you're going. Bold, present tense. */}
      <circle cx="18" cy="23" r="3" fill={fg[variant]} />
    </svg>
  );
};

interface LogoFullProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'white';
  className?: string;
}

export const LogoFull: React.FC<LogoFullProps> = ({
  size = 'md',
  variant = 'default',
  className = '',
}) => {
  const conf = {
    sm: { mark: 28, name: 'text-[14px]', sub: 'text-[7px] tracking-[0.16em]', gap: 'gap-2' },
    md: { mark: 36, name: 'text-[17px]', sub: 'text-[8px] tracking-[0.16em]', gap: 'gap-2.5' },
    lg: { mark: 46, name: 'text-[24px]', sub: 'text-[10px] tracking-[0.16em]', gap: 'gap-3' },
  };
  const s = conf[size];
  const nameColor = variant === 'white' ? 'text-white' : 'text-gray-900';
  const subColor = variant === 'white' ? 'text-white/40' : 'text-primary-700';

  return (
    <div className={`flex items-center ${s.gap} ${className}`}>
      <LogoMark size={s.mark} variant={variant === 'white' ? 'white' : 'primary'} />
      <div className="flex flex-col leading-none">
        <span className={`${s.name} font-extrabold ${nameColor} tracking-[-0.02em]`}>
          BusBook
        </span>
        <span className={`${s.sub} font-bold ${subColor} uppercase mt-[2px]`}>
          Rwanda
        </span>
      </div>
    </div>
  );
};
