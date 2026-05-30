import { db } from './firebase';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

export async function createBooking(data: {
  tripId: string;
  companyId: string;
  seatNumber: number;
  passengerName: string;
  passengerPhone: string;
  origin: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  price: number;
  passengerId: string;
}) {
  const ref = await addDoc(collection(db, 'bookings'), {
    ...data,
    status: 'confirmed',
    createdAt: serverTimestamp()
  });
  // QR encodes the real Firestore booking ID
  await updateDoc(ref, { qrCode: ref.id });
  return ref.id;
}

/** Marks ticket as boarded. Does not change trip seat counts — inventory is updated when the ticket is sold (payment/booking). */
export async function validateBooking(bookingId: string) {
  const snap = await getDoc(doc(db, 'bookings', bookingId));
  if (!snap.exists()) return { valid: false, message: 'Ticket not found' };
  const data = snap.data();
  if (data.status === 'used') return { valid: false, message: 'Ticket already used', booking: data };
  if (data.status === 'cancelled') return { valid: false, message: 'Ticket was cancelled', booking: data };
  await updateDoc(doc(db, 'bookings', bookingId), { status: 'used' });
  return { valid: true, booking: { ...data, id: bookingId, status: 'used' } };
}
export async function getPassengerBookings(passengerId: string) {
  const q = query(collection(db, 'bookings'), where('passengerId', '==', passengerId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}