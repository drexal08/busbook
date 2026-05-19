import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

const defaults = { size: 20, strokeWidth: 1.5 };

export const IconSearch: React.FC<IconProps> = ({ size = defaults.size, className = '', strokeWidth = defaults.strokeWidth }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="7" />
    <line x1="16.65" y1="16.65" x2="21" y2="21" />
  </svg>
);

export const IconHome: React.FC<IconProps> = ({ size = defaults.size, className = '', strokeWidth = defaults.strokeWidth }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
    <path d="M9 21V13h6v8" />
  </svg>
);

export const IconUser: React.FC<IconProps> = ({ size = defaults.size, className = '', strokeWidth = defaults.strokeWidth }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="8" r="4" />
    <path d="M5 20c0-3.87 3.13-7 7-7s7 3.13 7 7" />
  </svg>
);

export const IconUsers: React.FC<IconProps> = ({ size = defaults.size, className = '', strokeWidth = defaults.strokeWidth }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2 20c0-3.31 3.13-6 7-6s7 2.69 7 6" />
    <circle cx="17.5" cy="8.5" r="2.5" />
    <path d="M17.5 14c2.76 0 5 1.79 5 4" />
  </svg>
);

export const IconTicket: React.FC<IconProps> = ({ size = defaults.size, className = '', strokeWidth = defaults.strokeWidth }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2 9V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3" />
    <path d="M2 15v3a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-3" />
    <path d="M22 9a3 3 0 0 1-3 3 3 3 0 0 1 3 3" />
    <path d="M2 9a3 3 0 0 0 3 3 3 3 0 0 0-3 3" />
    <line x1="9" y1="4" x2="9" y2="8" />
    <line x1="9" y1="16" x2="9" y2="20" />
    <line x1="9" y1="11" x2="9" y2="13" />
  </svg>
);

export const IconBus: React.FC<IconProps> = ({ size = defaults.size, className = '', strokeWidth = defaults.strokeWidth }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="3" width="18" height="15" rx="3" />
    <path d="M3 10h18" />
    <path d="M12 3v7" />
    <circle cx="7" cy="21" r="1.5" />
    <circle cx="17" cy="21" r="1.5" />
    <path d="M5.5 18v1.5" />
    <path d="M18.5 18v1.5" />
  </svg>
);

export const IconRoute: React.FC<IconProps> = ({ size = defaults.size, className = '', strokeWidth = defaults.strokeWidth }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="6" cy="5" r="2.5" />
    <circle cx="18" cy="19" r="2.5" />
    <path d="M8.5 5H14a4 4 0 0 1 0 8H10a4 4 0 0 0 0 8h5.5" />
  </svg>
);

export const IconCalendar: React.FC<IconProps> = ({ size = defaults.size, className = '', strokeWidth = defaults.strokeWidth }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="4" width="18" height="17" rx="2.5" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="8" y1="2" x2="8" y2="5" />
    <line x1="16" y1="2" x2="16" y2="5" />
  </svg>
);

export const IconClock: React.FC<IconProps> = ({ size = defaults.size, className = '', strokeWidth = defaults.strokeWidth }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="9" />
    <polyline points="12,7 12,12 15.5,14" />
  </svg>
);

export const IconWallet: React.FC<IconProps> = ({ size = defaults.size, className = '', strokeWidth = defaults.strokeWidth }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="5" width="20" height="15" rx="2.5" />
    <path d="M2 10h20" />
    <circle cx="17" cy="15" r="1" />
  </svg>
);

export const IconShield: React.FC<IconProps> = ({ size = defaults.size, className = '', strokeWidth = defaults.strokeWidth }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2L4 6v5c0 5.25 3.4 10.15 8 11.25C16.6 21.15 20 16.25 20 11V6l-8-4z" />
    <polyline points="9,12 11,14 15,10" />
  </svg>
);

export const IconBuilding: React.FC<IconProps> = ({ size = defaults.size, className = '', strokeWidth = defaults.strokeWidth }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="4" y="3" width="16" height="18" rx="1.5" />
    <line x1="9" y1="7" x2="9" y2="7.01" />
    <line x1="15" y1="7" x2="15" y2="7.01" />
    <line x1="9" y1="11" x2="9" y2="11.01" />
    <line x1="15" y1="11" x2="15" y2="11.01" />
    <rect x="9" y="16" width="6" height="5" />
  </svg>
);

export const IconChart: React.FC<IconProps> = ({ size = defaults.size, className = '', strokeWidth = defaults.strokeWidth }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="12" width="4" height="9" rx="1" />
    <rect x="10" y="6" width="4" height="15" rx="1" />
    <rect x="17" y="3" width="4" height="18" rx="1" />
  </svg>
);

export const IconCheck: React.FC<IconProps> = ({ size = defaults.size, className = '', strokeWidth = defaults.strokeWidth }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="4,12 9,17 20,6" />
  </svg>
);

export const IconCheckCircle: React.FC<IconProps> = ({ size = defaults.size, className = '', strokeWidth = defaults.strokeWidth }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="9.5" />
    <polyline points="8,12 11,15 16,9" />
  </svg>
);

export const IconXCircle: React.FC<IconProps> = ({ size = defaults.size, className = '', strokeWidth = defaults.strokeWidth }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="9.5" />
    <line x1="9" y1="9" x2="15" y2="15" />
    <line x1="15" y1="9" x2="9" y2="15" />
  </svg>
);

export const IconArrowRight: React.FC<IconProps> = ({ size = defaults.size, className = '', strokeWidth = defaults.strokeWidth }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="4" y1="12" x2="20" y2="12" />
    <polyline points="14,6 20,12 14,18" />
  </svg>
);

export const IconArrowLeft: React.FC<IconProps> = ({ size = defaults.size, className = '', strokeWidth = defaults.strokeWidth }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="20" y1="12" x2="4" y2="12" />
    <polyline points="10,6 4,12 10,18" />
  </svg>
);

export const IconSwap: React.FC<IconProps> = ({ size = defaults.size, className = '', strokeWidth = defaults.strokeWidth }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="7,3 3,7 7,11" />
    <path d="M3 7h14a4 4 0 0 1 4 4" />
    <polyline points="17,21 21,17 17,13" />
    <path d="M21 17H7a4 4 0 0 1-4-4" />
  </svg>
);

export const IconLogout: React.FC<IconProps> = ({ size = defaults.size, className = '', strokeWidth = defaults.strokeWidth }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16,17 21,12 16,7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export const IconLogin: React.FC<IconProps> = ({ size = defaults.size, className = '', strokeWidth = defaults.strokeWidth }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <polyline points="10,17 15,12 10,7" />
    <line x1="15" y1="12" x2="3" y2="12" />
  </svg>
);

export const IconPlus: React.FC<IconProps> = ({ size = defaults.size, className = '', strokeWidth = defaults.strokeWidth }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const IconScan: React.FC<IconProps> = ({ size = defaults.size, className = '', strokeWidth = defaults.strokeWidth }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 7V4a1 1 0 0 1 1-1h3" />
    <path d="M17 3h3a1 1 0 0 1 1 1v3" />
    <path d="M21 17v3a1 1 0 0 1-1 1h-3" />
    <path d="M7 21H4a1 1 0 0 1-1-1v-3" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const IconSeat: React.FC<IconProps> = ({ size = defaults.size, className = '', strokeWidth = defaults.strokeWidth }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 11V7a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v4" />
    <rect x="3" y="11" width="18" height="6" rx="2" />
    <path d="M5 17v3" />
    <path d="M19 17v3" />
  </svg>
);

export const IconMapPin: React.FC<IconProps> = ({ size = defaults.size, className = '', strokeWidth = defaults.strokeWidth }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 21s-7-5.6-7-11a7 7 0 1 1 14 0c0 5.4-7 11-7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

export const IconPhone: React.FC<IconProps> = ({ size = defaults.size, className = '', strokeWidth = defaults.strokeWidth }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="6" y="2" width="12" height="20" rx="3" />
    <line x1="12" y1="18" x2="12" y2="18.01" />
  </svg>
);

export const IconMail: React.FC<IconProps> = ({ size = defaults.size, className = '', strokeWidth = defaults.strokeWidth }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="4" width="20" height="16" rx="2.5" />
    <polyline points="2,4 12,13 22,4" />
  </svg>
);

export const IconChevronDown: React.FC<IconProps> = ({ size = defaults.size, className = '', strokeWidth = defaults.strokeWidth }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="6,9 12,15 18,9" />
  </svg>
);

export const IconStar: React.FC<IconProps> = ({ size = defaults.size, className = '', strokeWidth = defaults.strokeWidth }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
  </svg>
);

export const IconWifi: React.FC<IconProps> = ({ size = defaults.size, className = '', strokeWidth = defaults.strokeWidth }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2 8.5a14.5 14.5 0 0 1 20 0" />
    <path d="M6 12.5a8.5 8.5 0 0 1 12 0" />
    <path d="M10 16.5a3.5 3.5 0 0 1 4 0" />
    <circle cx="12" cy="20" r="1" fill="currentColor" />
  </svg>
);

export const IconSnowflake: React.FC<IconProps> = ({ size = defaults.size, className = '', strokeWidth = defaults.strokeWidth }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="2" x2="12" y2="22" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    <line x1="19.07" y1="4.93" x2="4.93" y2="19.07" />
  </svg>
);

export const IconBolt: React.FC<IconProps> = ({ size = defaults.size, className = '', strokeWidth = defaults.strokeWidth }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" />
  </svg>
);

export const IconQr: React.FC<IconProps> = ({ size = defaults.size, className = '', strokeWidth = defaults.strokeWidth }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="3" height="3" rx="0.5" />
    <rect x="18" y="14" width="3" height="3" rx="0.5" />
    <rect x="14" y="18" width="3" height="3" rx="0.5" />
    <rect x="18" y="18" width="3" height="3" rx="0.5" />
  </svg>
);

export const IconGrid: React.FC<IconProps> = ({ size = defaults.size, className = '', strokeWidth = defaults.strokeWidth }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

export const IconList: React.FC<IconProps> = ({ size = defaults.size, className = '', strokeWidth = defaults.strokeWidth }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <circle cx="4" cy="6" r="1" fill="currentColor" />
    <circle cx="4" cy="12" r="1" fill="currentColor" />
    <circle cx="4" cy="18" r="1" fill="currentColor" />
  </svg>
);

export const IconMenu: React.FC<IconProps> = ({ size = defaults.size, className = '', strokeWidth = defaults.strokeWidth }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

export const IconX: React.FC<IconProps> = ({ size = defaults.size, className = '', strokeWidth = defaults.strokeWidth }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const IconFilter: React.FC<IconProps> = ({ size = defaults.size, className = '', strokeWidth = defaults.strokeWidth }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="3,4 21,4 14,12.5 14,19 10,21 10,12.5" />
  </svg>
);

export const IconEye: React.FC<IconProps> = ({ size = defaults.size, className = '', strokeWidth = defaults.strokeWidth }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const IconLock: React.FC<IconProps> = ({ size = defaults.size, className = '', strokeWidth = defaults.strokeWidth }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);
