import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { initiateCashin, listenToPayment } from '../lib/payments';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Trip } from '../types';
import { IconArrowLeft, IconArrowRight, IconCheckCircle, IconSeat, IconClock, IconCalendar, IconBus, IconLock, IconLogin } from '../components/Icons';

const PAYMENT_METHOD_CONFIG = {
  mtn_momo: {
    name: 'MTN MoMo',
    prefixes: ['078', '079'],
    intlPrefixes: ['+25078', '+25079', '25078', '25079'],
    placeholder: '0781234567 or +25078XXXXXXX',
  },
  airtel_money: {
    name: 'Airtel Money',
    prefixes: ['072', '073'],
    intlPrefixes: ['+25072', '+25073', '25072', '25073'],
    placeholder: '0721234567 or +25072XXXXXXX',
  },
} as const;

type PaymentMethod = keyof typeof PAYMENT_METHOD_CONFIG;

const PAYMENT_OPTIONS: Array<{
  key: PaymentMethod;
  name: string;
  sub: string;
  badge: string;
  badgeClassName: string;
}> = [
  {
    key: 'mtn_momo',
    name: 'MTN MoMo',
    sub: 'Pay with MTN Mobile Money',
    accent: 'bg-[#FFF7CC] text-[#7A5A00]',
    icon: <img src="/logos/mtn.png" alt="MTN MoMo" className="h-7 w-7 object-contain" loading="lazy" decoding="async" />,
  },
  {
    key: 'airtel_money',
    name: 'Airtel Money',
    sub: 'Pay with Airtel Money',
    accent: 'bg-[#FDE3E1] text-[#B21F16]',
    icon: <img src="/logos/airtel.png" alt="Airtel Money" className="h-7 w-7 object-contain" loading="lazy" decoding="async" />,
  },
];

function normalizePhoneInput(value: string) {
  const compact = value.replace(/\s+/g, '');
  const stripped = compact.replace(/[^\d+]/g, '');

  if (stripped.startsWith('+')) {
    return `+${stripped.slice(1).replace(/\+/g, '')}`;
  }

  return stripped.replace(/\+/g, '');
}

function validatePaymentPhone(phone: string, paymentMethod: PaymentMethod) {
  const normalized = normalizePhoneInput(phone);
  const methodConfig = PAYMENT_METHOD_CONFIG[paymentMethod];
  const isRwandaMobile = /^(\+250|250|0)7\d{8}$/.test(normalized);

  if (!normalized) {
    return 'Phone number is required';
  }

  if (!isRwandaMobile) {
    return 'Use a valid Rwanda mobile number';
  }

  const matchesProvider =
    methodConfig.prefixes.some(prefix => normalized.startsWith(prefix)) ||
    methodConfig.intlPrefixes.some(prefix => normalized.startsWith(prefix));

  if (!matchesProvider) {
    return `Use a ${methodConfig.name} number starting with ${methodConfig.prefixes.join(' or ')}`;
  }

  return '';
}

const BookingPage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { trips, bookings, getCompanyName, getRouteInfo, getBusInfo } = useData();
  const { user, isAuthenticated } = useAuth();
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mtn_momo');
  const [paymentPhone, setPaymentPhone] = useState('');
  const [step, setStep] = useState<'seat' | 'payment' | 'processing' | 'success'>('seat');
  const [bookingId, setBookingId] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentError, setPaymentError] = useState('');

  const staticTrip = trips.find(t => t.id === tripId);
  const [liveTrip, setLiveTrip] = useState<Trip | null>(null);
  const trip = liveTrip ?? staticTrip;

  useEffect(() => {
    if (!tripId) return;
    return onSnapshot(doc(db, 'trips', tripId), (snap) => {
      if (snap.exists()) {
        setLiveTrip({ id: snap.id, ...snap.data() } as Trip);
      }
    });
  }, [tripId]);

  const route = trip ? getRouteInfo(trip.routeId) : undefined;
  const company = trip ? getCompanyName(trip.companyId) : '';
  const bus = trip ? getBusInfo(trip.busId) : undefined;

  useEffect(() => {
    if (!paymentRef) return;
    return listenToPayment(paymentRef, (payment) => {
      if (payment.status === 'completed' && payment.bookingId) {
        setBookingId(payment.bookingId);
        setStep('success');
      }

      if (payment.status === 'failed') {
        setPaymentError(payment.failureReason || 'Payment failed. Please try again.');
        setStep('payment');
      }
    });
  }, [paymentRef]);

  // Sold seats (payment/booking), not operator scan — includes confirmed + boarded, excludes cancelled
  const occupiedSeats = useMemo(() => {
    const seats = new Set<number>(trip?.bookedSeats ?? []);
    if (!tripId) return seats;
    for (const b of bookings) {
      if (b.tripId === tripId && b.status !== 'cancelled') {
        seats.add(b.seatNumber);
      }
    }
    return seats;
  }, [trip?.bookedSeats, bookings, tripId]);

  useEffect(() => {
    if (!trip || !selectedSeat) return;
    if (occupiedSeats.has(selectedSeat) || selectedSeat > trip.onlineSeats) {
      setSelectedSeat(null);
      if (step === 'payment') setStep('seat');
    }
  }, [trip, selectedSeat, step, occupiedSeats]);

  // DYNAMIC SEAT MAP ENGINE: Automatically configures structure based on any total capacity
const layoutRows = useMemo(() => {
  if (!bus || !trip) return [];
  
  const N = bus.totalSeats;
  const remainder = N % 4;
  const fullRowsCount = Math.floor(N / 4);
  const matrix: Array<Array<{
    id: string;
    number?: number;
    label: string;
    type: 'passenger' | 'foldable' | 'driver' | 'empty';
    booked: boolean;
    counterOnly: boolean;
  }>> = [];

  const isOnlineBookable = (num: number) => num <= trip.onlineSeats;
  
  let currentSeatNum = 1;
  
  // 1. FRONT ROW: Driver on the LEFT (Rwanda standard), remainder passenger seats fill on the right
  const frontRow = [
    {
      id: 'driver-slot',
      label: 'Drv',
      type: 'driver' as const,
      booked: false,
      counterOnly: false,
    },
    {
      id: 'front-r1',
      number: remainder >= 1 ? currentSeatNum : undefined,
      label: remainder >= 1 ? String(currentSeatNum++) : '',
      type: remainder >= 1 ? ('passenger' as const) : ('empty' as const),
      booked: remainder >= 1 ? occupiedSeats.has(currentSeatNum - 1) : false,
      counterOnly: remainder >= 1 ? !isOnlineBookable(currentSeatNum - 1) : false
    },
    {
      id: 'front-r2',
      number: remainder >= 2 ? currentSeatNum : undefined,
      label: remainder >= 2 ? String(currentSeatNum++) : '',
      type: remainder >= 2 ? ('passenger' as const) : ('empty' as const),
      booked: remainder >= 2 ? occupiedSeats.has(currentSeatNum - 1) : false,
      counterOnly: remainder >= 2 ? !isOnlineBookable(currentSeatNum - 1) : false
    },
    {
      id: 'front-r3',
      number: remainder >= 3 ? currentSeatNum : undefined,
      label: remainder >= 3 ? String(currentSeatNum++) : '',
      type: remainder >= 3 ? ('passenger' as const) : ('empty' as const),
      booked: remainder >= 3 ? occupiedSeats.has(currentSeatNum - 1) : false,
      counterOnly: remainder >= 3 ? !isOnlineBookable(currentSeatNum - 1) : false
    }
  ];
  matrix.push(frontRow);
  
  // 2. BACK ROWS: Rows of 4 (2 left, 1 foldable middle, 1 extreme right)
  for (let r = 0; r < fullRowsCount; r++) {
    const leftSeat1Num = currentSeatNum++;
    const leftSeat2Num = currentSeatNum++;
    const foldableSeatNum = currentSeatNum++;
    const rightSeatNum = currentSeatNum++;
    
    const rowSeats = [
      {
        id: `row-${r}-l1`,
        number: leftSeat1Num,
        label: String(leftSeat1Num),
        type: 'passenger' as const,
        booked: occupiedSeats.has(leftSeat1Num),
        counterOnly: !isOnlineBookable(leftSeat1Num)
      },
      {
        id: `row-${r}-l2`,
        number: leftSeat2Num,
        label: String(leftSeat2Num),
        type: 'passenger' as const,
        booked: occupiedSeats.has(leftSeat2Num),
        counterOnly: !isOnlineBookable(leftSeat2Num)
      },
      {
        id: `row-${r}-m`,
        number: foldableSeatNum,
        label: `${foldableSeatNum}F`, // Appends an 'F' to visually indicate Foldable in the map
        type: 'foldable' as const,
        booked: occupiedSeats.has(foldableSeatNum),
        counterOnly: !isOnlineBookable(foldableSeatNum)
      },
      {
        id: `row-${r}-r`,
        number: rightSeatNum,
        label: String(rightSeatNum),
        type: 'passenger' as const,
        booked: occupiedSeats.has(rightSeatNum),
        counterOnly: !isOnlineBookable(rightSeatNum)
      }
    ];
    matrix.push(rowSeats);
  }
  
  return matrix;
}, [bus, trip, occupiedSeats]);

  if (!trip || !route || !bus) {
    return (
      <div className="min-h-[calc(100vh-60px)] bg-surface-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 bg-surface-tertiary rounded-2xl flex items-center justify-center mx-auto mb-3">
            <IconBus size={24} className="text-gray-300" />
          </div>
          <h3 className="font-semibold text-gray-700 mb-1 text-sm">Trip not found</h3>
          <button onClick={() => navigate('/search')} className="text-xs text-primary-600 font-semibold hover:underline mt-2">Search trips</button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-60px)] bg-surface-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 bg-surface-tertiary rounded-2xl flex items-center justify-center mx-auto mb-3">
            <IconLock size={24} className="text-gray-300" />
          </div>
          <h3 className="font-semibold text-gray-700 mb-1 text-sm">Login required</h3>
          <p className="text-xs text-gray-400 mb-3">Please log in to book a ticket</p>
          <button onClick={() => navigate('/login')} className="bg-primary-600 text-white px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 mx-auto">
            <IconLogin size={14} /> Log in
          </button>
        </div>
      </div>
    );
  }

  const handleBooking = async () => {
    if (!selectedSeat || !user) return;
    
    const phoneError = validatePaymentPhone(paymentPhone, paymentMethod);
    if (phoneError) {
      setPaymentError(phoneError);
      return;
    }
    
    setPaymentError('');
    setStep('processing');
    try {
      const result = await initiateCashin({
        tripId: trip.id,
        seatNumber: selectedSeat,
        phone: normalizePhoneInput(paymentPhone),
        paymentMethod,
      });

      if (result.error || !result.ref) {
        throw new Error(result.error || 'Payment could not be started');
      }

      setPaymentRef(result.ref);
    } catch (e) {
      console.error(e);
      setPaymentError(e instanceof Error ? e.message : 'Payment failed. Please try again.');
      setStep('payment');
    }
  };

  if (step === 'success') return (
    <div className="min-h-[calc(100vh-60px)] bg-surface-secondary flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-border shadow-sm p-7 text-center max-w-sm w-full slide-up">
        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <IconCheckCircle size={28} className="text-emerald-500" />
        </div>
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
      <div className="text-center">
        <div className="w-10 h-10 border-[3px] border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h3 className="font-semibold text-gray-700 text-sm">Processing payment…</h3>
        <p className="text-xs text-gray-400 mt-1">Please wait for confirmation</p>
      </div>
    </div>
  );

  const inlinePhoneError = paymentPhone
    ? validatePaymentPhone(paymentPhone, paymentMethod)
    : '';
  const paymentPlaceholder = PAYMENT_METHOD_CONFIG[paymentMethod].placeholder;

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
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                    <IconCalendar size={12} />{new Date(trip.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <IconClock size={12} />{trip.departureTime} – {trip.arrivalTime}
                  </div>
                </div>
              </div>
            </div>

            {/* Seat layout */}
            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2"><IconSeat size={16} /> Select your seat</h3>
              <div className="flex flex-wrap gap-4 mb-5 text-[11px]">
                <span className="flex items-center gap-1.5"><span className="w-5 h-5 bg-white border border-border rounded" /> Available online</span>
                <span className="flex items-center gap-1.5"><span className="w-5 h-5 bg-amber-50 border border-amber-200 rounded" /> Foldable (F)</span>
                <span className="flex items-center gap-1.5"><span className="w-5 h-5 bg-slate-100 border border-slate-300 rounded" /> Counter only</span>
                <span className="flex items-center gap-1.5"><span className="w-5 h-5 bg-primary-600 rounded" /> Selected</span>
                <span className="flex items-center gap-1.5"><span className="w-5 h-5 bg-gray-200 rounded" /> Booked</span>
              </div>
              {trip.onlineSeats < bus.totalSeats && (
                <p className="text-[11px] text-slate-500 mb-4 -mt-2">
                  Seats {trip.onlineSeats + 1}–{bus.totalSeats} can only be booked at the counter.
                </p>
              )}
              
              <div className="bg-surface-secondary rounded-xl p-6 border border-border-light max-w-[280px] mx-auto">
                {/* Windshield Indicator */}
                <div className="text-center font-bold text-gray-400 text-[10px] tracking-widest uppercase mb-4 pb-2 border-b border-gray-200">
                  Front / Windshield
                </div>

                {/* Unified dynamic grid rendering columns cleanly */}
                <div className="space-y-3">
                  {layoutRows.map((row, ri) => (
                    <div key={ri} className="grid grid-cols-4 gap-2">
                      {row.map((slot) => {
                        if (slot.type === 'empty') {
                          return <div key={slot.id} className="w-10 h-9" />;
                        }

                        if (slot.type === 'driver') {
                          return (
                            <div key={slot.id} className="w-10 h-9 bg-gray-800 text-white rounded-lg flex items-center justify-center text-[10px] font-bold shadow-sm">
                              Drv
                            </div>
                          );
                        }

                        const unavailable = slot.booked || slot.counterOnly;

                        return (
                          <button
                            key={slot.id}
                            disabled={unavailable}
                            title={slot.counterOnly ? 'Book at counter only' : slot.booked ? 'Already booked' : undefined}
                            onClick={() => !unavailable && setSelectedSeat(slot.number || null)}
                            className={`w-10 h-9 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center border ${
                              slot.booked
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed border-transparent'
                                : slot.counterOnly
                                ? 'bg-slate-100 border-slate-300 text-slate-400 cursor-not-allowed'
                                : selectedSeat === slot.number
                                ? 'bg-primary-600 text-white shadow-md shadow-primary-200 scale-105 border-transparent'
                                : slot.type === 'foldable'
                                ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 hover:border-amber-300'
                                : 'bg-white border border-border text-gray-600 hover:border-primary-300 hover:bg-primary-50'
                            }`}
                          >
                            {slot.label}
                          </button>
                        );
                      })}
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
                {[ 
                  ['Route', `${route.origin} → ${route.destination}`], 
                  ['Company', company], 
                  ['Date', new Date(trip.date+'T00:00:00').toLocaleDateString()], 
                  ['Time', trip.departureTime], 
                  ['Seat', selectedSeat ? String(selectedSeat) : '—'] 
                ].map(([l, v], i) => (
                  <div key={i} className="flex justify-between"><span className="text-gray-400">{l}</span><span className="font-semibold text-gray-800">{v}</span></div>
                ))}
                <div className="border-t border-border-light pt-2.5 flex justify-between">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-bold text-primary-600 text-sm">{trip.price.toLocaleString()} RWF</span>
                </div>
              </div>

              {selectedSeat && step === 'seat' && (
                <button
                  onClick={() => {
                    if (selectedSeat > trip.onlineSeats) {
                      setPaymentError('This seat is only available at the counter.');
                      return;
                    }
                    setPaymentError('');
                    setStep('payment');
                  }}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl text-xs transition-all hover:shadow-lg hover:shadow-primary-200"
                >
                  Proceed to payment
                </button>
              )}

              {step === 'payment' && (
                <div className="space-y-3 fade-in">
                  <h4 className="font-semibold text-gray-900 text-xs">Payment method</h4>
                  {paymentError && (
                    <div className="bg-red-50 border border-red-100 text-red-600 px-3 py-2 rounded-xl text-[11px] font-medium">
                      {paymentError}
                    </div>
                  )}
                  {PAYMENT_OPTIONS.map((m) => (
                    <button key={m.key} onClick={() => setPaymentMethod(m.key)}
                      className={`w-full p-3 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${
                        paymentMethod === m.key ? 'border-primary-400 bg-primary-50' : 'border-border-light hover:border-gray-300'
                      }`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border border-border-light overflow-hidden ${m.accent}`}>
                        {m.icon}
                      </div>
                      <div><div className="text-xs font-semibold text-gray-800">{m.name}</div><div className="text-[10px] text-gray-400">{m.sub}</div></div>
                    </button>
                  ))}
                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Phone number</label>
                    <input type="tel" value={paymentPhone} onChange={e => {
                      setPaymentPhone(normalizePhoneInput(e.target.value));
                      if (paymentError) {
                        setPaymentError('');
                      }
                    }} placeholder={paymentPlaceholder}
                      className="w-full bg-surface-secondary border border-border-light rounded-xl px-4 py-2.5 text-xs focus:border-primary-400 outline-none transition-all" />
                    <p className="text-[10px] text-gray-400 mt-1">
                      Accepted for {PAYMENT_METHOD_CONFIG[paymentMethod].name}: {PAYMENT_METHOD_CONFIG[paymentMethod].prefixes.join(', ')} or the matching `+250` format.
                    </p>
                    {inlinePhoneError && (
                      <p className="text-[10px] text-red-500 mt-1">{inlinePhoneError}</p>
                    )}
                  </div>
                  <button onClick={handleBooking} disabled={!paymentPhone || Boolean(inlinePhoneError)}
                    className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl text-xs transition-all">
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
