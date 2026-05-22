import { useState } from 'react';
import { validateBooking } from '../lib/bookings';

export default function ScanPage() {
  const [bookingId, setBookingId] = useState('');
  const [result, setResult] = useState<{ valid: boolean; message?: string; booking?: any } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleValidate() {
    if (!bookingId.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await validateBooking(bookingId.trim());
      setResult(res);
    } catch (e) {
      setResult({ valid: false, message: 'Error validating ticket' });
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-2">BusBook</h1>
        <p className="text-center text-gray-500 mb-6">Conductor Ticket Scanner</p>

        <input
          className="w-full border rounded-lg px-4 py-3 mb-4 text-sm"
          placeholder="Paste or type booking ID"
          value={bookingId}
          onChange={e => setBookingId(e.target.value)}
        />

        <button
          onClick={handleValidate}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold"
        >
          {loading ? 'Checking...' : 'Validate Ticket'}
        </button>

        {result && (
          <div className={`mt-6 p-4 rounded-lg text-center ${result.valid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <p className="text-2xl mb-2">{result.valid ? '✅' : '❌'}</p>
            {result.valid && result.booking ? (
              <>
                <p className="font-bold">{result.booking.passengerName}</p>
                <p>{result.booking.origin} → {result.booking.destination}</p>
                <p>{result.booking.departureDate} at {result.booking.departureTime}</p>
                <p>Seat {result.booking.seatNumber}</p>
              </>
            ) : (
              <p className="font-semibold">{result.message}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}