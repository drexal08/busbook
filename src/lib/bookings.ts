import { db } from './firebase';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

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

export async function validateBooking(bookingId: string) {
  const snap = await getDoc(doc(db, 'bookings', bookingId));
  if (!snap.exists()) return { valid: false, message: 'Ticket not found' };
  const data = snap.data();
  if (data.status === 'used') return { valid: false, message: 'Ticket already used' };
  await updateDoc(doc(db, 'bookings', bookingId), { status: 'used' });
  return { valid: true, booking: data };
}