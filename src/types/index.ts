export type UserRole = 'passenger' | 'company' | 'operator' | 'admin';
export type AuthProvider = 'password' | 'google' | 'facebook';
export type CompanyStatus = 'pending' | 'approved' | 'rejected';
export type OperatorStatus = 'pending' | 'approved' | 'rejected';
export type TripStatus = 'scheduled' | 'departed' | 'cancelled';
export type BookingStatus = 'confirmed' | 'cancelled' | 'used';
export type PaymentStatus = 'pending' | 'completed' | 'failed';
export type PaymentMethod = 'mtn_momo' | 'airtel_money';
export type BusLayout = '2-2' | '2-1';
export type TripSource = 'template' | 'manual';
export type TripTemplateRecurrenceMode = 'weekly' | 'interval';
export type TripTemplateIntervalUnit = 'minutes' | 'hours';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  authProvider?: AuthProvider;
  emailVerified?: boolean;
  emailOtpVerified?: boolean;
  phoneVerified?: boolean;
  companyId?: string;
  operatorStatus?: OperatorStatus;
  avatar?: string;
  createdAt: string;
  password?: string;
}

export interface Company {
  id: string;
  name: string;
  ownerId: string;
  logo?: string;
  description: string;
  status: CompanyStatus;
  phone: string;
  email: string;
  createdAt: string;
}

export interface Bus {
  id: string;
  companyId: string;
  name: string;
  plateNumber: string;
  totalSeats: number;
  layout: BusLayout;
  amenities: string[];
}

export interface Route {
  id: string;
  companyId: string;
  origin: string;
  destination: string;
  distance: number;
  duration: string;
}

export interface TripTemplate {
  id: string;
  companyId: string;
  routeId: string;
  busId: string;
  recurrenceMode?: TripTemplateRecurrenceMode;
  departureTime: string;
  arrivalTime: string;
  price: number;
  onlineSeats: number;
  totalSeats: number;
  daysOfWeek: number[];
  sellDaysAhead: number;
  startDate?: string;
  intervalValue?: number;
  intervalUnit?: TripTemplateIntervalUnit;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Trip {
  id: string;
  routeId: string;
  companyId: string;
  busId: string;
  date: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  onlineSeats: number;
  availableSeats: number;
  totalSeats: number;
  bookedSeats: number[];
  status: TripStatus;
  templateId?: string;
  source?: TripSource;
  cancelledAt?: string;
  cancelReason?: string;
}

export interface Booking {
  id: string;
  tripId: string;
  passengerId: string;
  companyId: string;
  seatNumber: number;
  passengerName: string;
  passengerPhone: string;
  origin: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  price: number;
  status: BookingStatus;
  qrCode: string;
  createdAt: string;
  validatedAt?: string;
  validatedBy?: string;
}

export interface Payment {
  id: string;
  paypackRef: string;
  tripId: string;
  companyId: string;
  passengerId: string;
  seatNumber: number;
  amount: number;
  phone: string;
  paymentMethod?: PaymentMethod;
  status: PaymentStatus;
  passengerName: string;
  passengerPhone: string;
  origin: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  createdAt: string;
  bookingId?: string;
  processedAt?: string;
  failureReason?: string;
  seatReserved?: boolean;
}
