import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { validateBooking } from '../lib/bookings';

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
        
        // Extract the ID and process it
        await extractAndValidateId(decodedText);
      },
      () => {}
    );
  }

  // Extracts just the ID from the QR text block and validates it
  async function extractAndValidateId(scannedText: string) {
    let extractedId = scannedText.trim();

    // Scenario A: If the QR code is a JSON string block
    if (extractedId.startsWith('{') && extractedId.endsWith('}')) {
      try {
        const parsed = JSON.parse(extractedId);
        if (parsed.id) {
          extractedId = parsed.id;
        }
      } catch (e) {
        // Fallback if parsing fails
      }
    } 
    // Scenario B: If it's a URL or text string containing an ID parameter (e.g., id=12345)
    else {
      const idMatch = extractedId.match(/(?:id|bookingId)["规律 text='":\s]+([a-zA-Z0-9-]+)/i) || 
                      extractedId.match(/id=([a-zA-Z0-9-]+)/i);
      if (idMatch && idMatch[1]) {
        extractedId = idMatch[1];
      }
    }

    // 1. Paste ONLY the extracted clean ID into the text box input
    setBookingId(extractedId);

    // 2. Trigger the database check immediately with that clean ID
    await validate(extractedId);
  }

  // Handles checking the ID against the database
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
        <h1 className="text-2xl font-bold text-center mb-2">BusBook</h1>
        <p className="text-center text-gray-500 mb-6">Conductor Ticket Scanner</p>

        {!scanning && (
          <button onClick={startScanner}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold mb-4">
            Scan QR Code
          </button>
        )}

        <div id="qr-reader" className={scanning ? 'mb-4 rounded-lg overflow-hidden' : 'hidden'} />

        {scanning && (
          <button onClick={() => { scannerRef.current?.stop(); setScanning(false); }}
            className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg text-sm mb-4">
            Cancel
          </button>
        )}

        <div className="flex gap-2 mb-4">
          <input
            className="flex-1 border rounded-lg px-4 py-3 text-sm"
            placeholder="Or paste booking ID"
            value={bookingId}
            onChange={e => setBookingId(e.target.value)}
          />
          <button onClick={() => validate(bookingId)} disabled={loading}
            className="bg-blue-600 text-white px-4 rounded-lg font-semibold text-sm">
            {loading ? '...' : 'Check'}
          </button>
        </div>

        {result && (
          <div className={`p-4 rounded-lg text-center ${result.valid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <p className="text-2xl mb-2">{result.valid ? '✅' : '❌'}</p>
            {result.valid && result.booking ? (
              <>
                <p className="font-bold text-lg">{result.booking.passengerName || 'Unknown Passenger'}</p>
                <p className="text-sm mt-1">
                  {result.booking.origin || 'N/A'} → {result.booking.destination || 'N/A'}
                </p>
                <p className="text-sm">
                  {result.booking.departureDate || ''} {result.booking.departureTime ? `at ${result.booking.departureTime}` : ''}
                </p>
                <p className="font-semibold text-blue-600 mt-1">Seat: {result.booking.seatNumber || 'N/A'}</p>
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