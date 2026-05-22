import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { validateBooking } from '../lib/bookings';
// Import the Iconly components
import { Camera, Scan, ShieldDone, ShieldFail, Calendar, InfoCircle } from 'react-iconly';

export default function ScanPage() {
  const [bookingId, setBookingId] = useState('');
  const [result, setResult] = useState<{ valid: boolean; message?: string; booking?: any } | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  async function startScanner() {
    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;
    setScanning(true);
    await scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: 250 },
      async (decodedText) => {
        await scanner.stop();
        setScanning(false);
        await extractAndValidateId(decodedText);
      },
      () => {}
    );
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
      scannerRef.current?.stop().catch(() => {});
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-1 text-gray-800">BusBook</h1>
        <p className="text-center text-gray-500 mb-6 text-sm">Conductor Ticket Scanner</p>

        {!scanning && (
          <button onClick={startScanner}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold mb-4 flex items-center justify-center gap-2 transition">
            <Camera set="light" size="medium" primaryColor="white"/>
            Scan QR Code
          </button>
        )}

        <div id="qr-reader" className={scanning ? 'mb-4 rounded-xl overflow-hidden border-2 border-blue-500' : 'hidden'} />

        {scanning && (
          <button onClick={() => { scannerRef.current?.stop(); setScanning(false); }}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-xl text-sm mb-4 transition">
            Cancel
          </button>
        )}

        <div className="flex gap-2 mb-6">
          <input
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
            placeholder="Or paste booking ID"
            value={bookingId}
            onChange={e => setBookingId(e.target.value)}
          />
          <button onClick={() => validate(bookingId)} disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 rounded-xl font-semibold text-sm transition flex items-center justify-center">
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
              ? 'bg-green-50 border-green-200 text-green-900' 
              : 'bg-red-50 border-red-200 text-red-900'
          }`}>
            <div className="flex justify-center mb-3">
              {result.valid ? (
                <ShieldDone set="bulk" size="xlarge" primaryColor="#16a34a" />
              ) : (
                <ShieldFail set="bulk" size="xlarge" primaryColor="#dc2626" />
              )}
            </div>
            
            {result.valid && result.booking ? (
              <div className="text-left space-y-2 mt-2">
                <div className="border-b border-green-200 pb-2 text-center">
                  <p className="font-bold text-xl">{result.booking.passengerName || 'Passenger'}</p>
                  <p className="text-xs text-green-700 font-medium tracking-wide mt-0.5">VALID TICKET</p>
                </div>
                
                <div className="flex items-center gap-3 pt-1">
                  <Scan set="light" size="small" primaryColor="#15803d" />
                  <p className="text-sm font-semibold">
                    {result.booking.origin} → {result.booking.destination}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar set="light" size="small" primaryColor="#15803d" />
                  <p className="text-sm">
                    {result.booking.departureDate} at {result.booking.departureTime}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <InfoCircle set="light" size="small" primaryColor="#15803d" />
                  <p className="text-sm font-bold">
                    Seat Number: <span className="text-blue-600 font-extrabold">{result.booking.seatNumber}</span>
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