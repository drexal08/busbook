import { collection, getDocs, query, where } from 'firebase/firestore';
import { Booking } from '../types';
import { auth, db } from './firebase';

/** Marks ticket as boarded through the server so validation remains auditable. */
export async function validateBooking(
  bookingId: string
): Promise<{ valid: boolean; message?: string; error?: string; booking?: Booking }> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) {
    return { valid: false, error: 'Please log in again before validating tickets' };
  }

  const res = await fetch('/.netlify/functions/validate-ticket', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ bookingId }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { valid: false, error: data.error || 'Ticket validation failed' };
  }

  return data;
}

export async function getPassengerBookings(passengerId: string): Promise<Booking[]> {
  const q = query(collection(db, 'bookings'), where('passengerId', '==', passengerId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Booking));
}
