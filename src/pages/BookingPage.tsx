import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { IconArrowLeft, IconArrowRight, IconCheckCircle, IconSeat, IconClock, IconCalendar, IconBus, IconLock, IconLogin } from '../components/Icons';

const BookingPage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { trips, getCompanyName, getRouteInfo, getBusInfo, createBooking } = useData();
  const { user, isAuthenticated } = useAuth();
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'mtn_momo' | 'airtel_money'>('mtn_momo');
  const [paymentPhone, setPaymentPhone] = useState('');
  const [step, setStep] = useState<'seat' | 'payment' | 'processing' | 'success'>('seat');
  const [bookingId, setBookingId] = useState('');

  const trip = trips.find(t => t.id === tripId);
  const route = trip ? getRouteInfo(trip.routeId) : undefined;
  const company = trip ? getCompanyName(trip.companyId) : '';
  const bus = trip ? getBusInfo(trip.busId) : undefined;

  const rows = useMemo(() => {
    if (!bus || !trip) return [];
    const r: { number: number; booked: boolean }[][] = [];
    for (let i = 1; i <= bus.totalSeats; i++) {
      const rowIdx = Math.floor((i - 1) / 4);
      if (!r[rowIdx]) r[rowIdx] = [];
      r[rowIdx].push({ number: i, booked: trip.bookedSeats.includes(i) });
    }
    return r;
  }, [bus, trip]);

  if (!trip || !route || !bus) {
    return (
      <div className="min-h-[calc(100vh-60px)] bg-surface-secondary flex items-center justify-center">
        <div className="text-center"><div className="w-14 h-14 bg-surface-tertiary rounded-2xl flex items-center justify-center mx-auto mb-3"><IconBus size={24} className="text-gray-300" /></div>
          <h3 className="font-semibold text-gray-700 mb-1 text-sm">Trip not found</h3>
          <button onClick={() => navigate('/search')} className="text-xs text-primary-600 font-semibold hover:underline mt-2">Search trips</button></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-60px)] bg-surface-secondary flex items-center justify-center">
        <div className="text-center"><div className="w-14 h-14 bg-surface-tertiary rounded-2xl flex items-center justify-center mx-auto mb-3"><IconLock size={24} className="text-gray-300" /></div>
          <h3 className="font-semibold text-gray-700 mb-1 text-sm">Login required</h3>
          <p className="text-xs text-gray-400 mb-3">Please log in to book a ticket</p>
          <button onClick={() => navigate('/login')} className="bg-primary-600 text-white px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 mx-auto"><IconLogin size={14} /> Log in</button></div>
      </div>
    );
  }

  const handleBooking = async () => {
  if (!selectedSeat || !user) return;
  setStep('processing');
  try {
    const b = await createBooking({
      tripId: trip.id,
      passengerId: user.id,
      companyId: trip.companyId,
      seatNumber: selectedSeat,
      passengerName: user.name,
      passengerPhone: user.phone,
      origin: route.origin,
      destination: route.destination,
      departureDate: trip.date,
      departureTime: trip.departureTime,
      price: trip.price,
      status: 'confirmed',
      qrCode: ''
    });
    setBookingId(b.id);
    setStep('success');
  } catch (e) {
    console.error(e);
    setStep('seat');
    alert('Booking failed. Please try again.');
  }
};

  if (step === 'success') return (
    <div className="min-h-[calc(100vh-60px)] bg-surface-secondary flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-border shadow-sm p-7 text-center max-w-sm w-full slide-up">
        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4"><IconCheckCircle size={28} className="text-emerald-500" /></div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Booking confirmed</h2>
        <p className="text-gray-400 text-xs mb-5">Your ticket has been booked successfully</p>
        <div className="bg-surface-secondary rounded-xl p-4 mb-5 text-left">
          <div className="grid grid-cols-2 gap-y-2.5 text-xs">
            <span className="text-gray-400">Booking</span><span className="font-semibold text-gray-800">{bookingId}</span>
            <span className="text-gray-400">Route</span><span className="font-semibold text-gray-800">{route.origin} → {route.destination}</span>
            <span className="text-gray-400">Seat</span><span className="font-semibold text-gray-800">{selectedSeat}</span>
            <span className="text-gray-400">Total</span><span className="font-bold text-primary-600">{trip.price.toLocaleString()} RWF</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/ticket/${bookingId}`)} className="flex-1 bg-primary-600 text-white py-2.5 rounded-xl text-xs font-semibold hover:bg-primary-700 transition-all">View ticket</button>
          <button onClick={() => navigate('/dashboard')} className="flex-1 bg-surface-secondary text-gray-600 py-2.5 rounded-xl text-xs font-semibold hover:bg-surface-tertiary transition-all">My bookings</button>
        </div>
      </div>
    </div>
  );

  if (step === 'processing') return (
    <div className="min-h-[calc(100vh-60px)] bg-surface-secondary flex items-center justify-center">
      <div className="text-center"><div className="w-10 h-10 border-[3px] border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h3 className="font-semibold text-gray-700 text-sm">Processing payment…</h3>
        <p className="text-xs text-gray-400 mt-1">Please wait for confirmation</p></div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-60px)] bg-surface-secondary">
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 transition-colors"><IconArrowLeft size={18} /></button>
          <div className="h-4 w-px bg-border" />
          <h1 className="text-sm font-semibold text-gray-900">Book your trip</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            {/* Trip card */}
            <div className="bg-white rounded-xl border border-border p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md inline-block mb-2">{company}</div>
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-900">{route.origin} <IconArrowRight size={14} className="text-gray-300" /> {route.destination}</div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1"><IconCalendar size={12} />{new Date(trip.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400"><IconClock size={12} />{trip.departureTime} – {trip.arrivalTime}</div>
                </div>
              </div>
            </div>

            {/* Seat layout */}
            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2"><IconSeat size={16} /> Select your seat</h3>
              <div className="flex gap-5 mb-5 text-[11px]">
                <span className="flex items-center gap-1.5"><span className="w-5 h-5 bg-surface-secondary border border-border rounded" /> Available</span>
                <span className="flex items-center gap-1.5"><span className="w-5 h-5 bg-primary-600 rounded" /> Selected</span>
                <span className="flex items-center gap-1.5"><span className="w-5 h-5 bg-gray-200 rounded" /> Booked</span>
              </div>
              <div className="bg-surface-secondary rounded-xl p-5 border border-border-light">
                <div className="bg-gray-200 rounded-t-xl h-5 w-3/4 mx-auto mb-5 flex items-center justify-center"><span className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Driver</span></div>
                <div className="space-y-2 max-w-[240px] mx-auto">
                  {rows.map((row, ri) => (
                    <div key={ri} className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        {row.slice(0, 2).map(s => (
                          <button key={s.number} disabled={s.booked} onClick={() => setSelectedSeat(s.number)}
                            className={`w-10 h-9 rounded-lg text-[11px] font-semibold transition-all ${s.booked ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : selectedSeat === s.number ? 'bg-primary-600 text-white shadow-md shadow-primary-200 scale-105' : 'bg-white border border-border text-gray-600 hover:border-primary-300 hover:bg-primary-50'}`}>
                            {s.number}
                          </button>
                        ))}
                      </div>
                      <div className="w-6 text-center text-[9px] text-gray-300 font-medium">{ri + 1}</div>
                      <div className="flex gap-1.5">
                        {row.slice(2).map(s => (
                          <button key={s.number} disabled={s.booked} onClick={() => setSelectedSeat(s.number)}
                            className={`w-10 h-9 rounded-lg text-[11px] font-semibold transition-all ${s.booked ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : selectedSeat === s.number ? 'bg-primary-600 text-white shadow-md shadow-primary-200 scale-105' : 'bg-white border border-border text-gray-600 hover:border-primary-300 hover:bg-primary-50'}`}>
                            {s.number}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div className="bg-white rounded-xl border border-border p-5 sticky top-[76px]">
              <h3 className="font-semibold text-gray-900 text-sm mb-4">Booking summary</h3>
              <div className="space-y-2.5 text-xs mb-5">
                {[ ['Route', `${route.origin} → ${route.destination}`], ['Company', company], ['Date', new Date(trip.date+'T00:00:00').toLocaleDateString()], ['Time', trip.departureTime], ['Seat', selectedSeat ? String(selectedSeat) : '—'] ]
                  .map(([l, v], i) => (
                    <div key={i} className="flex justify-between"><span className="text-gray-400">{l}</span><span className="font-semibold text-gray-800">{v}</span></div>
                  ))}
                <div className="border-t border-border-light pt-2.5 flex justify-between">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-bold text-primary-600 text-sm">{trip.price.toLocaleString()} RWF</span>
                </div>
              </div>

              {selectedSeat && step === 'seat' && (
                <button onClick={() => setStep('payment')} className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl text-xs transition-all hover:shadow-lg hover:shadow-primary-200">
                  Proceed to payment
                </button>
              )}

              {step === 'payment' && (
                <div className="space-y-3 fade-in">
                  <h4 className="font-semibold text-gray-900 text-xs">Payment method</h4>
                  {[
                    { key: 'mtn_momo' as const, name: 'MTN MoMo', sub: 'Mobile Money', color: 'bg-yellow-400 text-yellow-900' },
                    { key: 'airtel_money' as const, name: 'Airtel Money', sub: 'Coming soon', color: 'bg-red-500 text-white' },
                  ].map(m => (
                    <button key={m.key} onClick={() => setPaymentMethod(m.key)}
                      className={`w-full p-3 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${paymentMethod === m.key ? 'border-primary-400 bg-primary-50' : 'border-border-light hover:border-gray-300'}`}>
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-extrabold ${m.color}`}>{m.name.substring(0, 3).toUpperCase()}</div>
                      <div><div className="text-xs font-semibold text-gray-800">{m.name}</div><div className="text-[10px] text-gray-400">{m.sub}</div></div>
                    </button>
                  ))}
                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Phone number</label>
                    <input type="tel" value={paymentPhone} onChange={e => setPaymentPhone(e.target.value)} placeholder="+250 788 000 000"
                      className="w-full bg-surface-secondary border border-border-light rounded-xl px-4 py-2.5 text-xs focus:border-primary-400 outline-none transition-all" />
                  </div>
                  <button onClick={handleBooking} disabled={!paymentPhone}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl text-xs transition-all">
                    Pay {trip.price.toLocaleString()} RWF
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
