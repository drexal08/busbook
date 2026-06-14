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
export const IconAnalytics: React.FC<IconProps> = (props) => renderIconly(Chart, props);
export const IconCamera: React.FC<IconProps> = (props) => renderIconly(Camera, props);
export const IconShieldSuccess: React.FC<IconProps> = (props) => renderIconly(ShieldDone, props);
export const IconShieldError: React.FC<IconProps> = (props) => renderIconly(ShieldFail, props);
export const IconStatus: React.FC<IconProps> = (props) => renderIconly(Activity, props);
export const IconDatabase: React.FC<IconProps> = (props) => renderIconly(Category, props);
