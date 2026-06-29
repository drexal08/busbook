import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Navigate } from 'react-router-dom';
import { validateBooking } from '../lib/bookings';
import { IconCamera, IconScan, IconShieldSuccess, IconShieldError, IconCalendar, IconInfo } from '../components/Icons';
import { useAuth } from '../contexts/AuthContext';

export default function ScanPage() {
  const { user } = useAuth();
  const [bookingId, setBookingId] = useState('');
  const [result, setResult] = useState<{ valid: boolean; message?: string; booking?: any } | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  async function stopScanner() {
    const scanner = scannerRef.current;
    scannerRef.current = null;

    if (!scanner) {
      setScanning(false);
      return;
    }

    try {
      await scanner.stop();
    } catch {}

    try {
      await scanner.clear();
    } catch {}

    setScanning(false);
  }

  async function startScanner() {
    if (scanning) return;

    await stopScanner();
    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;

    try {
      setResult(null);
      setScanning(true);
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        async (decodedText) => {
          await stopScanner();
          await extractAndValidateId(decodedText);
        },
        () => {}
      );
    } catch {
      await stopScanner();
      setResult({ valid: false, message: 'Camera access was denied or no supported camera was found.' });
    }
  }

  async function extractAndValidateId(scannedText: string) {
    let extractedId = scannedText.trim();

    if (extractedId.startsWith('{') && extractedId.endsWith('}')) {
      try {
        const parsed = JSON.parse(extractedId);
        if (parsed.id) extractedId = parsed.id;
      } catch (e) {}
    } else {
      const idMatch = extractedId.match(/(?:id|bookingId)["']?:\s*["']?([a-zA-Z0-9-]+)/i) || 
                      extractedId.match(/id=([a-zA-Z0-9-]+)/i);
      if (idMatch && idMatch[1]) extractedId = idMatch[1];
    }

    setBookingId(extractedId);
    await validate(extractedId);
  }

  async function validate(id: string) {
    const cleanId = id.trim();
    if (!cleanId) return;

    setLoading(true);
    setResult(null);
    try {
      const res = await validateBooking(cleanId);
      setResult(res);
    } catch {
      setResult({ valid: false, message: 'Error validating ticket' });
    }
    setLoading(false);
  }

  useEffect(() => {
    return () => {
      void stopScanner();
    };
  }, []);

  if (user?.role === 'operator' && user.operatorStatus !== 'approved') {
    return <Navigate to="/operator" replace />;
  }

  return (
    <div className="min-h-screen bg-surface-secondary flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-1 text-gray-800">BusBook</h1>
        <p className="text-center text-gray-500 mb-6 text-sm">Conductor Ticket Scanner</p>

        {!scanning && (
          <button onClick={startScanner}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-xl font-semibold mb-4 flex items-center justify-center gap-2 transition">
            <IconCamera size={20} className="text-white"/>
            Scan QR Code
          </button>
        )}

        <div id="qr-reader" className={scanning ? 'mb-4 rounded-xl overflow-hidden border-2 border-primary-500' : 'hidden'} />

        {scanning && (
          <button onClick={() => { void stopScanner(); }}
            className="w-full bg-surface-tertiary hover:bg-surface-secondary text-gray-700 py-2 rounded-xl text-sm mb-4 transition">
            Cancel
          </button>
        )}

        <div className="flex gap-2 mb-6">
          <input
            className="flex-1 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-400 bg-surface-secondary"
            placeholder="Or paste booking ID"
            value={bookingId}
            onChange={e => setBookingId(e.target.value)}
          />
          <button onClick={() => validate(bookingId)} disabled={loading}
            className="bg-primary-600 hover:bg-primary-700 text-white px-5 rounded-xl font-semibold text-sm transition flex items-center justify-center">
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Check'
            )}
          </button>
        </div>

        {result && (
          <div className={`p-5 rounded-2xl border ${
            result.valid
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}>
            <div className="flex justify-center mb-3">
              {result.valid ? (
                <IconShieldSuccess size={48} className="text-emerald-600" />
              ) : (
                <IconShieldError size={48} className="text-red-600" />
              )}
            </div>

            {result.valid && result.booking ? (
              <div className="text-left space-y-2 mt-2">
                <div className="border-b border-emerald-200 pb-2 text-center">
                  <p className="font-bold text-xl">{result.booking.passengerName || 'Passenger'}</p>
                  <p className="text-xs text-emerald-700 font-medium tracking-wide mt-0.5">VALID TICKET</p>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <IconScan size={18} className="text-emerald-600" />
                  <p className="text-sm font-semibold">
                    {result.booking.origin} → {result.booking.destination}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <IconCalendar size={18} className="text-emerald-600" />
                  <p className="text-sm">
                    {result.booking.departureDate} at {result.booking.departureTime}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <IconInfo size={18} className="text-emerald-600" />
                  <p className="text-sm font-bold">
                    Seat Number: <span className="text-primary-600 font-extrabold">{result.booking.seatNumber}</span>
                  </p>
                </div>
              </div>
            ) : (
              <p className="font-semibold text-center">{result.message}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
