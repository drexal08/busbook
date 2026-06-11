import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { IconScan, IconBus, IconUsers, IconCheckCircle, IconXCircle, IconClock, IconSeat, IconArrowRight, IconTicket } from '../components/Icons';
import Select from '../components/Select';
import { useState } from 'react';

const OperatorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { validateTicket, getCompanyTrips, bookings, getRouteInfo } = useData();
  const [qr, setQr] = useState('');
  const [result, setResult] = useState<{ valid: boolean; message: string; booking?: any } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [selTrip, setSelTrip] = useState<string | null>(null);
  const [tab, setTab] = useState<'scan' | 'trips' | 'passengers'>('scan');
  
  // 1. FIRST: Authenticate and confirm role boundaries
  if (authLoading) {
    return null;
  }

  if (!isAuthenticated || !user || user.role !== 'operator') { 
    navigate('/login'); 
    return null; 
  }

  // 2. SECOND: Check safe operator state variables now that user object is fully loaded
  if (user.operatorStatus !== 'approved') {
    return (
      <div className="min-h-[calc(100vh-60px)] bg-surface-secondary flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl border border-border p-8 max-w-md">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <IconClock size={24} className="text-amber-500" />
          </div>
          <h3 className="font-bold text-gray-700 text-sm mb-2">Approval Pending</h3>
          <p className="text-xs text-gray-400">Your company must approve your operator account before you can scan tickets.</p>
        </div>
      </div>
    );
  }
  const cid = user.companyId || '';
  const cTrips = getCompanyTrips(cid);
  const cBookings = bookings.filter(b => b.companyId === cid);
  const today = new Date().toISOString().split('T')[0];
  const todayTrips = cTrips.filter(t => t.date === today);
  const tripPassengers = (id: string) => bookings.filter(b => b.tripId === id && b.status !== 'cancelled');

 const handleScan = async (bookingId?: string) => {
  const targetId = bookingId || qr.trim();
  if (!targetId) return;
  
  setScanning(true);
  try {
    const r = await validateTicket(targetId);
    setResult({ 
      valid: r.valid, 
      message: r.error || 'Ticket validated — passenger may board.', 
      booking: r.booking 
    });
  } catch (error) {
    setResult({ 
      valid: false, 
      message: 'Validation failed. Please try again.' 
    });
  } finally {
    setScanning(false);
  }
};

  const selTripData = selTrip ? cTrips.find(t => t.id === selTrip) : null;
  const selPassengers = selTrip ? tripPassengers(selTrip) : [];

  const tabs = [
    { key: 'scan', label: 'Scan', icon: <IconScan size={15} /> },
    { key: 'trips', label: `Trips (${todayTrips.length})`, icon: <IconBus size={15} /> },
    { key: 'passengers', label: 'Passengers', icon: <IconUsers size={15} /> },
  ];

  return (
    <div className="min-h-[calc(100vh-60px)] bg-surface-secondary">
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-violet-100 rounded-2xl flex items-center justify-center text-violet-600"><IconScan size={20} /></div>
          <div><h1 className="text-base font-bold text-gray-900">Operator</h1><p className="text-xs text-gray-400">{user.name}</p></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-1 mb-6 bg-white rounded-xl border border-border p-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-medium transition-all whitespace-nowrap ${tab === t.key ? 'bg-violet-600 text-white shadow-sm' : 'text-gray-500 hover:bg-surface-secondary'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {tab === 'scan' && (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
    <div className="bg-white rounded-xl border border-border p-6">
      <h2 className="font-semibold text-gray-900 text-sm mb-1 flex items-center gap-2"><IconScan size={16} /> Scan ticket</h2>
      <p className="text-[11px] text-gray-400 mb-5">Scan QR code or enter booking ID to validate passenger ticket.</p>
      
      {/* Camera Scanner Integration */}
      {!scanning && (
        <button 
          onClick={async () => {
            setScanning(true);
            const Html5Qrcode = (await import('html5-qrcode')).Html5Qrcode;
            const scanner = new Html5Qrcode('qr-reader-operator');
            try {
              await scanner.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: 250 },
                async (decodedText) => {
                  await scanner.stop();
                  setScanning(false);
                  // Extract booking ID from various QR formats
                  let extractedId = decodedText.trim();
                  if (extractedId.startsWith('{') && extractedId.endsWith('}')) {
                    try {
                      const parsed = JSON.parse(extractedId);
                      if (parsed.id) extractedId = parsed.id;
                    } catch (e) {}
                  }
                  setQr(extractedId);
                  handleScan(extractedId);
                },
                () => {}
              );
            } catch (err) {
              console.error('Camera error:', err);
              setScanning(false);
              setResult({ valid: false, message: 'Camera access denied or unavailable' });
            }
          }}
          className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-2 mb-4"
        >
          <IconScan size={14} /> Open Camera Scanner
        </button>
      )}

      {/* Camera Preview */}
      <div id="qr-reader-operator" className={scanning ? 'mb-4 rounded-xl overflow-hidden border-2 border-violet-500' : 'hidden'} />

      {scanning && (
        <button 
          onClick={() => {
            setScanning(false);
            // Stop scanner cleanup handled by component
          }}
          className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-xl text-xs mb-4 transition"
        >
          Cancel Scanning
        </button>
      )}

      <div className="space-y-3">
        <input 
          type="text" 
          value={qr} 
          onChange={e => setQr(e.target.value)} 
          placeholder="Or paste booking ID here…"
          className="w-full bg-surface-secondary border border-border-light rounded-xl px-4 py-3 text-xs font-mono focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-all" 
        />
        <button 
          onClick={() => handleScan(qr)} 
          disabled={!qr.trim() || scanning}
          className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-2"
        >
          {scanning ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> 
              Validating…
            </>
          ) : (
            <>
              <IconScan size={14} /> Validate Ticket
            </>
          )}
        </button>
      </div>

              {result && (
                <div className={`mt-4 p-4 rounded-xl border fade-in ${result.valid ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                  <div className="flex items-start gap-3">
                    {result.valid ? <IconCheckCircle size={20} className="text-emerald-500 shrink-0 mt-0.5" /> : <IconXCircle size={20} className="text-red-400 shrink-0 mt-0.5" />}
                    <div>
                      <div className={`text-xs font-bold ${result.valid ? 'text-emerald-700' : 'text-red-600'}`}>{result.valid ? 'VALID' : 'INVALID'}</div>
                      <p className={`text-[11px] mt-0.5 ${result.valid ? 'text-emerald-600' : 'text-red-500'}`}>{result.message}</p>
                      {result.booking && (
                        <div className="mt-2.5 bg-white/60 rounded-lg p-3 text-[11px] space-y-1">
                          <div><span className="text-gray-400">Passenger:</span> <span className="font-semibold text-gray-800">{result.booking.passengerName}</span></div>
                          <div><span className="text-gray-400">Route:</span> <span className="font-semibold text-gray-800">{result.booking.origin} → {result.booking.destination}</span></div>
                          <div><span className="text-gray-400">Seat:</span> <span className="font-semibold text-gray-800">{result.booking.seatNumber}</span></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-5 pt-4 border-t border-border-light">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Demo tickets</p>
                <div className="flex flex-wrap gap-1.5">
                  {cBookings.filter(b => b.status === 'confirmed').map(b => (
                    <button key={b.id} onClick={() => setQr(b.qrCode)} className="text-[10px] bg-surface-secondary hover:bg-surface-tertiary px-2.5 py-1.5 rounded-lg font-mono transition-colors border border-border-light">
                      {b.qrCode.substring(0, 18)}…
                    </button>
                  ))}
                  {cBookings.filter(b => b.status === 'confirmed').length === 0 && <p className="text-[10px] text-gray-400">No active tickets</p>}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Today's trips", value: todayTrips.length, icon: <IconBus size={16} />, color: 'text-violet-600 bg-violet-50' },
                  { label: 'Scanned', value: cBookings.filter(b => b.status === 'used').length, icon: <IconCheckCircle size={16} />, color: 'text-emerald-600 bg-emerald-50' },
                  { label: 'Pending', value: cBookings.filter(b => b.status === 'confirmed').length, icon: <IconClock size={16} />, color: 'text-amber-600 bg-amber-50' },
                  { label: 'Total', value: cBookings.length, icon: <IconTicket size={16} />, color: 'text-gray-600 bg-gray-100' },
                ].map((s, i) => (
                  <div key={i} className="bg-white rounded-xl border border-border p-4">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${s.color}`}>{s.icon}</div>
                    <div className="text-lg font-bold text-gray-900">{s.value}</div>
                    <div className="text-[10px] text-gray-400 font-medium">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-xl border border-border p-5">
                <h3 className="font-semibold text-gray-900 text-xs mb-3">Recently scanned</h3>
                {cBookings.filter(b => b.status === 'used').slice(0, 5).map(b => (
                  <div key={b.id} className="flex items-center justify-between py-2 border-b border-border-light last:border-0">
                    <div><div className="text-xs font-medium text-gray-800">{b.passengerName}</div><div className="text-[10px] text-gray-400">Seat {b.seatNumber}</div></div>
                    <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-medium flex items-center gap-1"><IconCheckCircle size={10} /> Done</span>
                  </div>
                ))}
                {cBookings.filter(b => b.status === 'used').length === 0 && <p className="text-[10px] text-gray-400 text-center py-3">None yet</p>}
              </div>
            </div>
          </div>
        )}

        {tab === 'trips' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {todayTrips.length === 0 && <div className="col-span-2 text-center py-16 bg-white rounded-xl border border-border"><div className="w-14 h-14 bg-surface-tertiary rounded-2xl flex items-center justify-center mx-auto mb-3"><IconBus size={24} className="text-gray-300" /></div><p className="text-xs text-gray-400">No trips today</p></div>}
            {todayTrips.map(t => {
              const route = getRouteInfo(t.routeId);
              const pax = tripPassengers(t.id);
              return (
                <div key={t.id} className="bg-white rounded-xl border border-border p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">{route?.origin} <IconArrowRight size={11} className="text-gray-300" /> {route?.destination}</div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${t.status === 'scheduled' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>{t.status}</span>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-gray-400 mb-3">
                    <span className="flex items-center gap-1"><IconClock size={11} /> {t.departureTime}–{t.arrivalTime}</span>
                    <span className="flex items-center gap-1"><IconUsers size={11} /> {pax.length}</span>
                    <span className="flex items-center gap-1"><IconSeat size={11} /> {t.availableSeats} left</span>
                  </div>
                  <button onClick={() => { setSelTrip(t.id); setTab('passengers'); }}
                    className="w-full bg-violet-50 hover:bg-violet-100 text-violet-600 py-2 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5">
                    <IconUsers size={13} /> View passengers
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'passengers' && (
          <div>
            <div className="bg-white rounded-xl border border-border p-4 mb-4">
              <Select
                options={cTrips.map(t => { const r = getRouteInfo(t.routeId); return { value: t.id, label: `${t.date} · ${t.departureTime} · ${r?.origin} → ${r?.destination}` }; })}
                value={selTrip || ''}
                onChange={(v) => setSelTrip(v || null)}
                label="Select trip"
                placeholder="Choose a trip"
              />
            </div>

            {selTripData ? (
              <div className="bg-white rounded-xl border border-border overflow-hidden">
                <div className="bg-violet-50 px-5 py-4 border-b border-border flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">{getRouteInfo(selTripData.routeId)?.origin} <IconArrowRight size={11} className="text-gray-300" /> {getRouteInfo(selTripData.routeId)?.destination}</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">{selTripData.date} · {selTripData.departureTime}–{selTripData.arrivalTime}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-violet-600">{selPassengers.length}</div>
                    <div className="text-[10px] text-gray-400">passengers</div>
                  </div>
                </div>

                {selPassengers.length === 0 ? (
                  <div className="p-8 text-center"><div className="w-12 h-12 bg-surface-tertiary rounded-2xl flex items-center justify-center mx-auto mb-3"><IconUsers size={20} className="text-gray-300" /></div><p className="text-xs text-gray-400">No passengers</p></div>
                ) : (
                  <>
                    <div className="hidden sm:grid grid-cols-12 gap-2 px-5 py-2.5 bg-surface-secondary text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-border-light">
                      <div className="col-span-1">Seat</div><div className="col-span-4">Passenger</div><div className="col-span-3">Phone</div><div className="col-span-2">ID</div><div className="col-span-2">Status</div>
                    </div>
                    <div className="divide-y divide-border-light">
                      {selPassengers.sort((a,b) => a.seatNumber - b.seatNumber).map(p => (
                        <div key={p.id} className="grid grid-cols-12 gap-2 px-5 py-3 items-center text-xs hover:bg-surface-secondary transition-colors">
                          <div className="col-span-1 font-bold text-violet-600">{p.seatNumber}</div>
                          <div className="col-span-4 font-medium text-gray-800">{p.passengerName}</div>
                          <div className="col-span-3 text-gray-400 text-[11px]">{p.passengerPhone}</div>
                          <div className="col-span-2 font-mono text-[10px] text-gray-400">{p.id}</div>
                          <div className="col-span-2">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${p.status === 'confirmed' ? 'bg-amber-50 text-amber-600' : p.status === 'used' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                              {p.status === 'confirmed' ? 'Pending' : p.status === 'used' ? 'Boarded' : 'Cancelled'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-surface-secondary px-5 py-3 border-t border-border flex items-center justify-between text-[11px]">
                      <div className="flex gap-4 text-gray-400">
                        <span>Boarded: <span className="font-semibold text-gray-700">{selPassengers.filter(p => p.status === 'used').length}</span></span>
                        <span>Pending: <span className="font-semibold text-gray-700">{selPassengers.filter(p => p.status === 'confirmed').length}</span></span>
                      </div>
                      <button onClick={() => setTab('scan')} className="bg-violet-600 text-white px-3.5 py-1.5 rounded-lg text-[10px] font-semibold hover:bg-violet-700 transition-all flex items-center gap-1"><IconScan size={11} /> Scan</button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-border p-8 text-center">
                <div className="w-12 h-12 bg-surface-tertiary rounded-2xl flex items-center justify-center mx-auto mb-3"><IconUsers size={20} className="text-gray-300" /></div>
                <p className="text-xs text-gray-400">Select a trip to view passengers</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OperatorDashboard;
