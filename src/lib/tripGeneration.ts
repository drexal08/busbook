import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Trip, TripTemplate } from '../types';

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function kigaliTodayUtcMidnightMs(nowMs: number) {
  const offsetMs = 2 * 60 * 60 * 1000;
  const kigali = new Date(nowMs + offsetMs);
  const y = kigali.getUTCFullYear();
  const m = kigali.getUTCMonth();
  const d = kigali.getUTCDate();
  return Date.UTC(y, m, d);
}

function dateStringFromUtcMs(ms: number) {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

function dayOfWeekMon1Sun7FromUtcMs(ms: number) {
  const d = new Date(ms);
  const dowSun0 = d.getUTCDay();
  return ((dowSun0 + 6) % 7) + 1;
}

export function deterministicTripId(templateId: string, date: string) {
  return `${templateId}_${date}`;
}

export async function ensureUpcomingTripsFromTemplates(
  templates: TripTemplate[]
): Promise<{ created: number }> {
  const nowMs = Date.now();
  const startMs = kigaliTodayUtcMidnightMs(nowMs);
  let created = 0;

  for (const t of templates) {
    if (!t.active) continue;
    const horizon = Number.isFinite(t.sellDaysAhead) ? Math.max(1, Math.min(30, t.sellDaysAhead)) : 7;
    const daysOfWeek = Array.isArray(t.daysOfWeek) ? t.daysOfWeek : [];

    for (let i = 0; i < horizon; i++) {
      const dayMs = startMs + i * 24 * 60 * 60 * 1000;
      const dow = dayOfWeekMon1Sun7FromUtcMs(dayMs);
      if (daysOfWeek.length && !daysOfWeek.includes(dow)) continue;

      const date = dateStringFromUtcMs(dayMs);
      const tripId = deterministicTripId(t.id, date);
      const tripRef = doc(db, 'trips', tripId);
      const existing = await getDoc(tripRef);
      if (existing.exists()) continue;

      const trip: Omit<Trip, 'id'> = {
        routeId: t.routeId,
        companyId: t.companyId,
        busId: t.busId,
        date,
        departureTime: t.departureTime,
        arrivalTime: t.arrivalTime,
        price: t.price,
        onlineSeats: t.onlineSeats,
        totalSeats: t.totalSeats,
        bookedSeats: [],
        availableSeats: t.onlineSeats,
        status: 'scheduled',
        templateId: t.id,
        source: 'template',
      };

      await setDoc(tripRef, { ...trip, createdAt: serverTimestamp() });
      created += 1;
    }
  }

  return { created };
}
