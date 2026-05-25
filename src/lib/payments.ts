import { db } from './firebase';
import { auth } from './firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Payment } from '../types';

interface CashinInput {
  phone: string;
  tripId: string;
  seatNumber: number;
}

async function readResponseBody(res: Response): Promise<any> {
  const text = await res.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function initiateCashin(
  data: CashinInput
): Promise<{ ref?: string; error?: string }> {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('Please log in again before paying');

    const res = await fetch('/.netlify/functions/initiate-cashin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        phone: data.phone,
        tripId: data.tripId,
        seatNumber: data.seatNumber,
      }),
    });

    if (!res.ok) {
      const errData = await readResponseBody(res);
      const message = typeof errData === 'string' ? errData : errData?.error;
      throw new Error(message || `Payment request failed with status ${res.status}`);
    }

    const result = await readResponseBody(res);
    if (!result?.ref) {
      throw new Error(
        'Payment function did not return a transaction reference. If you are testing locally, run with Netlify Functions enabled.'
      );
    }

    return { ref: result.ref };

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
