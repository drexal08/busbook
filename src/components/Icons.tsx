import React from 'react';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Call,
  Camera,
  Category,
  Chart,
  ChevronDown,
  CloseSquare,
  Discovery,
  Filter,
  Graph,
  Home,
  InfoSquare,
  Location,
  Lock,
  Login,
  Logout,
  Message,
  MoreSquare,
  Paper,
  Password,

  Scan,
  Search,
  ShieldDone,
  ShieldFail,
  Show,
  Star,
  Swap,
  Ticket,
  TickSquare,
  TimeCircle,
  TwoUsers,
  User,
  Wallet,
  Work,
} from 'react-iconly';
import type { IconProps as IconlyProps } from 'react-iconly';

interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

type IconlyComponent = React.FC<IconlyProps>;

const renderIconly = (
  Icon: IconlyComponent,
  { size = 20, className = '' }: IconProps,
  set: IconlyProps['set'] = 'curved'
) => (
  <span className={`inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
    <Icon size={size} set={set} stroke="regular" primaryColor="currentColor" />
  </span>
);

export const IconSearch: React.FC<IconProps> = (props) => renderIconly(Search, props);
export const IconHome: React.FC<IconProps> = (props) => renderIconly(Home, props);
export const IconUser: React.FC<IconProps> = (props) => renderIconly(User, props);
export const IconUsers: React.FC<IconProps> = (props) => renderIconly(TwoUsers, props);
export const IconTicket: React.FC<IconProps> = (props) => renderIconly(Ticket, props);
export const IconBus: React.FC<IconProps> = (props) => renderIconly(Work, props);
export const IconRoute: React.FC<IconProps> = (props) => renderIconly(Discovery, props);
export const IconCalendar: React.FC<IconProps> = (props) => renderIconly(Calendar, props);
export const IconClock: React.FC<IconProps> = (props) => renderIconly(TimeCircle, props);
export const IconWallet: React.FC<IconProps> = (props) => renderIconly(Wallet, props);
export const IconShield: React.FC<IconProps> = (props) => renderIconly(ShieldDone, props);
export const IconBuilding: React.FC<IconProps> = (props) => renderIconly(Work, props);
export const IconChart: React.FC<IconProps> = (props) => renderIconly(Graph, props);
export const IconCheck: React.FC<IconProps> = (props) => renderIconly(TickSquare, props);
export const IconCheckCircle: React.FC<IconProps> = (props) => renderIconly(TickSquare, props, 'bulk');
export const IconXCircle: React.FC<IconProps> = (props) => renderIconly(CloseSquare, props, 'bulk');
export const IconArrowRight: React.FC<IconProps> = (props) => renderIconly(ArrowRight, props);
export const IconArrowLeft: React.FC<IconProps> = (props) => renderIconly(ArrowLeft, props);
export const IconSwap: React.FC<IconProps> = (props) => renderIconly(Swap, props);
export const IconLogout: React.FC<IconProps> = (props) => renderIconly(Logout, props);
export const IconLogin: React.FC<IconProps> = (props) => renderIconly(Login, props);
export const IconPlus: React.FC<IconProps> = (props) => renderIconly(Paper, props);
export const IconScan: React.FC<IconProps> = (props) => renderIconly(Scan, props);
export const IconSeat: React.FC<IconProps> = (props) => renderIconly(Category, props);
export const IconMapPin: React.FC<IconProps> = (props) => renderIconly(Location, props);
export const IconPhone: React.FC<IconProps> = (props) => renderIconly(Call, props);
export const IconMail: React.FC<IconProps> = (props) => renderIconly(Message, props);
export const IconChevronDown: React.FC<IconProps> = (props) => renderIconly(ChevronDown, props);
export const IconStar: React.FC<IconProps> = (props) => renderIconly(Star, props);
export const IconWifi: React.FC<IconProps> = (props) => renderIconly(Activity, props);
export const IconSnowflake: React.FC<IconProps> = (props) => renderIconly(Discovery, props);
export const IconBolt: React.FC<IconProps> = (props) => renderIconly(Activity, props);
export const IconQr: React.FC<IconProps> = (props) => renderIconly(Scan, props);
export const IconGrid: React.FC<IconProps> = (props) => renderIconly(Category, props);
export const IconList: React.FC<IconProps> = (props) => renderIconly(Paper, props);
export const IconMenu: React.FC<IconProps> = (props) => renderIconly(MoreSquare, props);
export const IconX: React.FC<IconProps> = (props) => renderIconly(CloseSquare, props);
export const IconFilter: React.FC<IconProps> = (props) => renderIconly(Filter, props);
export const IconEye: React.FC<IconProps> = (props) => renderIconly(Show, props);
export const IconLock: React.FC<IconProps> = (props) => renderIconly(Lock, props);
export const IconInfo: React.FC<IconProps> = (props) => renderIconly(InfoSquare, props);
export const IconPassword: React.FC<IconProps> = (props) => renderIconly(Password, props);
export const IconRefresh: React.FC<IconProps> = (props) => renderIconly(Swap, props);
export const IconAnalytics: React.FC<IconProps> = (props) => renderIconly(Chart, props);
export const IconCamera: React.FC<IconProps> = (props) => renderIconly(Camera, props);
export const IconShieldSuccess: React.FC<IconProps> = (props) => renderIconly(ShieldDone, props);
export const IconShieldError: React.FC<IconProps> = (props) => renderIconly(ShieldFail, props);
export const IconStatus: React.FC<IconProps> = (props) => renderIconly(Activity, props);
export const IconDatabase: React.FC<IconProps> = (props) => renderIconly(Category, props);
export const IconSettings: React.FC<IconProps> = ({ size = 20, className = '' }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    style={{ width: size, height: size }}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 8.75a3.25 3.25 0 1 0 0 6.5 3.25 3.25 0 0 0 0-6.5Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M19.4 13.5a1.2 1.2 0 0 0 .24 1.32l.04.04a1.45 1.45 0 0 1 0 2.05l-.5.5a1.45 1.45 0 0 1-2.05 0l-.04-.04a1.2 1.2 0 0 0-1.32-.24 1.2 1.2 0 0 0-.73 1.1v.12A1.45 1.45 0 0 1 13.6 20h-.7a1.45 1.45 0 0 1-1.45-1.45v-.07a1.2 1.2 0 0 0-.79-1.14 1.2 1.2 0 0 0-1.26.27l-.04.04a1.45 1.45 0 0 1-2.05 0l-.5-.5a1.45 1.45 0 0 1 0-2.05l.04-.04a1.2 1.2 0 0 0 .24-1.32 1.2 1.2 0 0 0-1.1-.73h-.12A1.45 1.45 0 0 1 4.4 11.6v-.7a1.45 1.45 0 0 1 1.45-1.45h.07a1.2 1.2 0 0 0 1.14-.79 1.2 1.2 0 0 0-.27-1.26l-.04-.04a1.45 1.45 0 0 1 0-2.05l.5-.5a1.45 1.45 0 0 1 2.05 0l.04.04a1.2 1.2 0 0 0 1.32.24 1.2 1.2 0 0 0 .73-1.1v-.12A1.45 1.45 0 0 1 12.9 2.4h.7a1.45 1.45 0 0 1 1.45 1.45v.07a1.2 1.2 0 0 0 .79 1.14 1.2 1.2 0 0 0 1.26-.27l.04-.04a1.45 1.45 0 0 1 2.05 0l.5.5a1.45 1.45 0 0 1 0 2.05l-.04.04a1.2 1.2 0 0 0-.24 1.32 1.2 1.2 0 0 0 1.1.73h.12A1.45 1.45 0 0 1 20 10.9v.7a1.45 1.45 0 0 1-1.45 1.45h-.07a1.2 1.2 0 0 0-1.14.45Z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconMtn: React.FC<IconProps> = ({ size = 20, className = '' }) => (
  <svg
    viewBox="0 0 48 48"
    className={className}
    style={{ width: size, height: size }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="4" y="8" width="40" height="32" rx="16" fill="#FFCC00" />
    <path
      d="M10 24c0-7.2 6.3-13 14-13s14 5.8 14 13-6.3 13-14 13-14-5.8-14-13Z"
      fill="none"
      stroke="#111827"
      strokeWidth="2.2"
    />
    <path
      d="M17 28V20.5h1.9l2.2 3.7 2.2-3.7h1.8V28h-1.9v-4.1l-1.8 3h-.7l-1.8-3V28H17Zm10.2 0v-7.5H29l3.7 4.7v-4.7h2V28H33l-3.8-4.8V28h-2Z"
      fill="#111827"
    />
  </svg>
);

export const IconAirtel: React.FC<IconProps> = ({ size = 20, className = '' }) => (
  <svg
    viewBox="0 0 48 48"
    className={className}
    style={{ width: size, height: size }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="4" y="8" width="40" height="32" rx="16" fill="#EE3124" />
    <path
      d="M28.8 15.8c-4.1 0-7.4 2.7-7.4 6.2 0 2.2 1.3 4 3.2 5.1-.2-1.2.2-2.8 1.2-4.3 1.7-2.6 4.7-4 7.2-3.5-.7-2.1-2.4-3.5-4.2-3.5Z"
      fill="#fff"
    />
    <path
      d="M18 28.5c2.6-2 7.1-2.9 10.6-2 2.3.6 4 1.8 5 3.4-.9.9-2.2 1.5-3.8 1.8-2.5.5-5.8.1-8.6-1.1-1.5-.6-2.7-1.3-3.2-2.1Z"
      fill="#fff"
    />
  </svg>
);

// Social login icons
export const IconGoogle: React.FC<IconProps> = (props) => {
  return (
    <svg viewBox="0 0 24 24" {...props} className={props.className} style={{ width: props.size || 20, height: props.size || 20 }}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
};

export const IconFacebook: React.FC<IconProps> = (props) => {
  return (
    <svg viewBox="0 0 24 24" {...props} className={props.className} style={{ width: props.size || 20, height: props.size || 20 }}>
      <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
};
