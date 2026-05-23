import { db } from './firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { Payment } from '../types';

const PAYPACK_API = 'https://payments.paypack.rw/api';

async function getPaypackToken(): Promise<string> {
  const res = await fetch(`${PAYPACK_API}/auth/agents/authorize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      client_id: import.meta.env.VITE_PAYPACK_CLIENT_ID,
      client_secret: import.meta.env.VITE_PAYPACK_CLIENT_SECRET,
    }),
  });
  if (!res.ok) throw new Error('Paypack auth failed');
  const data = await res.json();
  return data.access;
}

interface CashinInput {
  phone: string;
  amount: number;
  tripId: string;
  companyId: string;
  passengerId: string;
  seatNumber: number;
  passengerName: string;
  passengerPhone: string;
  origin: string;
  destination: string;
  departureDate: string;
  departureTime: string;
}

export async function initiateCashin(
  data: CashinInput
): Promise<{ ref?: string; error?: string }> {
  try {
    const token = await getPaypackToken();

    const res = await fetch(`${PAYPACK_API}/transactions/cashin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Webhook-Mode': import.meta.env.PROD ? 'production' : 'development',
      },
      body: JSON.stringify({
        number: data.phone,
        amount: data.amount,
      }),
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || 'Cashin failed');
    }

    const result = await res.json();
    const ref: string = result.ref;

    const payment: Omit<Payment, 'id'> = {
      paypackRef: ref,
      tripId: data.tripId,
      companyId: data.companyId,
      passengerId: data.passengerId,
      seatNumber: data.seatNumber,
      amount: data.amount,
      phone: data.phone,
      status: 'pending',
      passengerName: data.passengerName,
      passengerPhone: data.passengerPhone,
      origin: data.origin,
      destination: data.destination,
      departureDate: data.departureDate,
      departureTime: data.departureTime,
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'payments', ref), payment);
    return { ref };

  } catch (err: any) {
    console.error('Cashin error:', err);
    return { error: err.message || 'Payment initiation failed' };
  }
}

export function listenToPayment(
  ref: string,
  callback: (payment: Payment) => void
): () => void {
  return onSnapshot(doc(db, 'payments', ref), (snap) => {
    if (snap.exists()) {
      callback({ id: snap.id, ...(snap.data() as object) } as Payment);
    }
  });
}