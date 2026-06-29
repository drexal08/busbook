export type UserRole = 'passenger' | 'company' | 'operator' | 'admin';
export type AuthProvider = 'password' | 'google' | 'facebook';

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
  operatorStatus?: 'pending' | 'approved' | 'rejected';
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
  status: 'pending' | 'approved' | 'rejected';
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
  layout: '2-2' | '2-1';
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
  departureTime: string;
  arrivalTime: string;
  price: number;
  onlineSeats: number;
  totalSeats: number;
  daysOfWeek: number[];
  sellDaysAhead: number;
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
  status: 'scheduled' | 'departed' | 'cancelled';
  templateId?: string;
  source?: 'template' | 'manual';
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
  status: 'confirmed' | 'cancelled' | 'used';
  qrCode: string;
  createdAt: string;
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
  paymentMethod?: 'mtn_momo' | 'airtel_money';
  status: 'pending' | 'completed' | 'failed';
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
