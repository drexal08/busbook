import { db } from './firebase';
import {
  collection, doc, addDoc, updateDoc, getDocs,
  query, where, onSnapshot, serverTimestamp,
  setDoc, getDoc, deleteDoc
} from 'firebase/firestore';
import { Company, Trip, Route, Bus, Booking, TripTemplate } from '../types';

// ─── Companies ───────────────────────────────────────────────
export async function fetchCompanies(): Promise<Company[]> {
  const snap = await getDocs(collection(db, 'companies'));
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as object) } as Company));
}

export async function createCompany(data: Omit<Company, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'companies'), {
    ...data,
    createdAt: serverTimestamp()
  });
  return ref.id;
}

export async function createCompanyWithId(company: Company): Promise<void> {
  const { id, ...rest } = company;
  await setDoc(doc(db, 'companies', id), { ...rest, createdAt: serverTimestamp() });
}

export async function updateCompanyStatus(
  companyId: string,
  status: 'approved' | 'rejected' | 'pending'
): Promise<void> {
  await updateDoc(doc(db, 'companies', companyId), { status });
}

// ─── Routes ──────────────────────────────────────────────────
export async function fetchRoutes(companyId?: string): Promise<Route[]> {
  const q = companyId
    ? query(collection(db, 'routes'), where('companyId', '==', companyId))
    : collection(db, 'routes');
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as object) } as Route));
}

export async function createRoute(data: Omit<Route, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'routes'), data);
  return ref.id;
}

// ─── Buses ───────────────────────────────────────────────────
export async function fetchBuses(companyId?: string): Promise<Bus[]> {
  const q = companyId
    ? query(collection(db, 'buses'), where('companyId', '==', companyId))
    : collection(db, 'buses');
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as object) } as Bus));
}

export async function createBus(data: Omit<Bus, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'buses'), data);
  return ref.id;
}

// ─── Trips ───────────────────────────────────────────────────
export async function fetchTrips(filters?: { companyId?: string }): Promise<Trip[]> {
  const q = filters?.companyId
    ? query(collection(db, 'trips'), where('companyId', '==', filters.companyId))
    : collection(db, 'trips');
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as object) } as Trip));
}

export async function createTrip(data: Omit<Trip, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'trips'), data);
  return ref.id;
}

export async function createTripWithId(tripId: string, data: Omit<Trip, 'id'>): Promise<void> {
  await setDoc(doc(db, 'trips', tripId), { ...data });
}

export async function cancelTrip(tripId: string, reason?: string): Promise<void> {
  const payload: Record<string, unknown> = { status: 'cancelled', cancelledAt: serverTimestamp() };
  if (reason && reason.trim()) payload.cancelReason = reason.trim();
  await updateDoc(doc(db, 'trips', tripId), payload);
}

export async function decrementTripSeat(tripId: string, seatNumber: number): Promise<void> {
  const ref = doc(db, 'trips', tripId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Trip not found');
  const trip = snap.data() as Trip;
  const newBooked = [...(trip.bookedSeats || []), seatNumber];
  const newAvailable = trip.onlineSeats - newBooked.length;
  await updateDoc(ref, {
    bookedSeats: newBooked,
    availableSeats: newAvailable
  });
}

// ─── Bookings ────────────────────────────────────────────────
export async function fetchCompanyBookings(companyId: string): Promise<Booking[]> {
  const q = query(collection(db, 'bookings'), where('companyId', '==', companyId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as object) } as Booking));
}

export async function fetchTripTemplates(companyId?: string): Promise<TripTemplate[]> {
  const q = companyId
    ? query(collection(db, 'tripTemplates'), where('companyId', '==', companyId))
    : collection(db, 'tripTemplates');
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as object) } as TripTemplate));
}

export async function createTripTemplate(
  data: Omit<TripTemplate, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'tripTemplates'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateTripTemplate(
  templateId: string,
  data: Partial<Omit<TripTemplate, 'id' | 'companyId' | 'createdAt'>>
): Promise<void> {
  await updateDoc(doc(db, 'tripTemplates', templateId), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteTripTemplate(templateId: string): Promise<void> {
  await deleteDoc(doc(db, 'tripTemplates', templateId));
}

export function subscribeToCompanyTrips(
  companyId: string,
  callback: (trips: Trip[]) => void
): () => void {
  const q = query(collection(db, 'trips'), where('companyId', '==', companyId));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...(d.data() as object) } as Trip)));
  });
}
