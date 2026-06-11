import { User, UserRole } from '../types';

export function getDashboardPath(role?: UserRole | null) {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'company':
      return '/company';
    case 'operator':
      return '/operator';
    default:
      return '/dashboard';
  }
}

export function needsAccountVerification(user?: Partial<User> | null) {
  if (!user) return false;

  return !user.emailVerified || !user.emailOtpVerified || !user.phoneVerified;
}

export function getPostAuthPath(user?: Partial<User> | null) {
  if (!user) return '/';
  return needsAccountVerification(user) ? '/settings' : getDashboardPath(user.role);
}
