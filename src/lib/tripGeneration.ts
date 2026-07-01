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

function deterministicIntervalTripId(templateId: string, date: string, departureTime: string) {
  return `${templateId}_${date}_${departureTime.replace(':', '')}`;
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }
  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes: number) {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${pad2(hours)}:${pad2(minutes)}`;
}

function getTripDurationMinutes(template: TripTemplate) {
  const departureMinutes = timeToMinutes(template.departureTime);
  const arrivalMinutes = timeToMinutes(template.arrivalTime);
  if (departureMinutes === null || arrivalMinutes === null) {
    return 0;
  }
  const rawDuration = arrivalMinutes - departureMinutes;
  return rawDuration >= 0 ? rawDuration : rawDuration + 1440;
}

async function createTemplateTrip(
  template: TripTemplate,
  date: string,
  departureTime: string,
  arrivalTime: string,
  tripId: string
) {
  const tripRef = doc(db, 'trips', tripId);
  const existing = await getDoc(tripRef);
  if (existing.exists()) {
    return false;
  }

  const trip: Omit<Trip, 'id'> = {
    routeId: template.routeId,
    companyId: template.companyId,
    busId: template.busId,
    date,
    departureTime,
    arrivalTime,
    price: template.price,
    onlineSeats: template.onlineSeats,
    totalSeats: template.totalSeats,
    bookedSeats: [],
    availableSeats: template.onlineSeats,
    status: 'scheduled',
    templateId: template.id,
    source: 'template',
  };

  await setDoc(tripRef, { ...trip, createdAt: serverTimestamp() });
  return true;
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
    const recurrenceMode = t.recurrenceMode || 'weekly';

    if (recurrenceMode === 'interval') {
      const intervalValue = Number.isFinite(t.intervalValue) ? Math.max(1, t.intervalValue ?? 1) : 1;
      const intervalMinutes = intervalValue * ((t.intervalUnit || 'hours') === 'hours' ? 60 : 1);
      const startDate = t.startDate || dateStringFromUtcMs(startMs);
      const [year, month, day] = startDate.split('-').map(Number);
      const departureMinutes = timeToMinutes(t.departureTime);
      const durationMinutes = getTripDurationMinutes(t);
      if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day) || departureMinutes === null) {
        continue;
      }

      const firstDepartureMs = Date.UTC(year, month - 1, day, Math.floor(departureMinutes / 60), departureMinutes % 60);
      const windowStartMs = startMs;
      const windowEndMs = startMs + horizon * 24 * 60 * 60 * 1000;
      let occurrenceMs = firstDepartureMs;

      if (occurrenceMs < windowStartMs) {
        const missedOccurrences = Math.ceil((windowStartMs - occurrenceMs) / (intervalMinutes * 60 * 1000));
        occurrenceMs += missedOccurrences * intervalMinutes * 60 * 1000;
      }

      while (occurrenceMs < windowEndMs) {
        const departureDateTime = new Date(occurrenceMs);
        const arrivalDateTime = new Date(occurrenceMs + durationMinutes * 60 * 1000);
        const departureDate = dateStringFromUtcMs(occurrenceMs);
        const departureTime = minutesToTime(departureDateTime.getUTCHours() * 60 + departureDateTime.getUTCMinutes());
        const arrivalTime = minutesToTime(arrivalDateTime.getUTCHours() * 60 + arrivalDateTime.getUTCMinutes());
        const tripId = deterministicIntervalTripId(t.id, departureDate, departureTime);
        if (await createTemplateTrip(t, departureDate, departureTime, arrivalTime, tripId)) {
          created += 1;
        }
        occurrenceMs += intervalMinutes * 60 * 1000;
      }

      continue;
    }

    for (let i = 0; i < horizon; i++) {
      const dayMs = startMs + i * 24 * 60 * 60 * 1000;
      const dow = dayOfWeekMon1Sun7FromUtcMs(dayMs);
      if (daysOfWeek.length && !daysOfWeek.includes(dow)) continue;

      const date = dateStringFromUtcMs(dayMs);
      const tripId = deterministicTripId(t.id, date);
      if (await createTemplateTrip(t, date, t.departureTime, t.arrivalTime, tripId)) {
        created += 1;
      }
    }
  }

  return { created };
}
