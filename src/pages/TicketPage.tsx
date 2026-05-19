import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useData } from '../contexts/DataContext';
import { IconArrowLeft, IconArrowRight, IconCheckCircle, IconXCircle, IconTicket } from '../components/Icons';
import { LogoFull } from '../components/Logo';
import { ImigongoCorner, ImigongoDivider } from '../components/Imigongo';

const TicketPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { bookings } = useData();
  const booking = bookings.find(b => b.id === bookingId);

  if (!booking) return (
    <div className="min-h-[calc(100vh-60px)] bg-surface-secondary flex items-center justify-center">
      <div className="text-center">
        <div className="w-14 h-14 bg-surface-tertiary rounded-2xl flex items-center justify-center mx-auto mb-3"><IconTicket size={24} className="text-gray-300" /></div>
        <h3 className="font-bold text-gray-700 text-sm mb-1">Ticket not found</h3>
        <button onClick={() => navigate('/dashboard')} className="text-xs text-primary-700 font-bold hover:underline mt-2">My bookings</button>
      </div>
    </div>
  );

  const statusConf: Record<string, { icon: React.ReactNode; label: string; bg: string; text: string; border: string }> = {
    confirmed: { icon: <IconCheckCircle size={14} />, label: 'Confirmed', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
    cancelled: { icon: <IconXCircle size={14} />, label: 'Cancelled', bg: 'bg-red-50', text: 'text-red-500', border: 'border-red-100' },
    used: { icon: <IconCheckCircle size={14} />, label: 'Used', bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-200' },
  };
  const s = statusConf[booking.status];

  return (
    <div className="min-h-[calc(100vh-60px)] bg-surface-secondary py-8 px-4">
      <div className="max-w-md mx-auto slide-up">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mb-4 font-medium transition-colors">
          <IconArrowLeft size={14} /> Back
        </button>

        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden relative">
          {/* Imigongo corner accents — cultural identity on the boarding pass */}
          <ImigongoCorner position="top-left" size={50} color="#1c3f94" opacity={0.12} />
          <ImigongoCorner position="top-right" size={50} color="#1c3f94" opacity={0.12} />

          {/* Header */}
          <div className="bg-primary-800 px-6 py-5 flex flex-col items-center relative overflow-hidden">
            {/* Subtle Imigongo texture in header */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.04]">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="tkt-pat" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
                    <path d="M14 2 L26 14 L14 26 L2 14 Z" stroke="white" strokeWidth="0.5" fill="none" />
                    <path d="M14 7 L21 14 L14 21 L7 14 Z" stroke="white" strokeWidth="0.5" fill="none" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#tkt-pat)" />
              </svg>
            </div>
            <div className="relative z-10">
              <LogoFull size="sm" variant="white" />
            </div>
            <p className="text-primary-300 text-[11px] font-medium mt-2 relative z-10">E-Ticket · Boarding Pass</p>
          </div>

          {/* Status badge */}
          <div className="flex justify-center -mt-3 relative z-10">
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold border ${s.bg} ${s.text} ${s.border}`}>
              {s.icon} {s.label}
            </span>
          </div>

          <div className="p-6">
            {/* Route */}
            <div className="flex items-center justify-between mb-6">
              <div className="text-center flex-1">
                <div className="text-xl font-extrabold text-gray-900">{booking.origin.split(' ')[0].substring(0, 3).toUpperCase()}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">{booking.origin}</div>
              </div>
              <div className="flex-1 flex flex-col items-center px-4">
                <div className="w-full h-px bg-gray-200 relative my-1">
                  <div className="absolute -top-[3px] left-0 w-[7px] h-[7px] rounded-full bg-primary-600 border-2 border-white" />
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2"><IconArrowRight size={10} className="text-gray-300" /></div>
                  <div className="absolute -top-[3px] right-0 w-[7px] h-[7px] rounded-full bg-emerald-500 border-2 border-white" />
                </div>
              </div>
              <div className="text-center flex-1">
                <div className="text-xl font-extrabold text-gray-900">{booking.destination.split(' ')[0].substring(0, 3).toUpperCase()}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">{booking.destination}</div>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-2.5 mb-6">
              {[
                { label: 'Date', value: new Date(booking.departureDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
                { label: 'Departure', value: booking.departureTime },
                { label: 'Passenger', value: booking.passengerName },
                { label: 'Seat', value: String(booking.seatNumber) },
                { label: 'Booking ID', value: booking.id },
                { label: 'Price', value: `${booking.price.toLocaleString()} RWF` },
              ].map((d, i) => (
                <div key={i} className="bg-surface-secondary rounded-xl p-3">
                  <div className="text-[10px] text-gray-400 font-medium">{d.label}</div>
                  <div className={`text-xs font-bold mt-0.5 ${d.label === 'Price' ? 'text-primary-700' : 'text-gray-800'}`}>{d.value}</div>
                </div>
              ))}
            </div>

            {/* QR Code */}
            <div className="text-center mb-4">
              <div className="bg-white border border-border rounded-xl p-5 inline-block">
                <QRCodeSVG
                  value={JSON.stringify({ id: booking.id, qr: booking.qrCode, passenger: booking.passengerName, route: `${booking.origin} → ${booking.destination}`, date: booking.departureDate, time: booking.departureTime, seat: booking.seatNumber, status: booking.status })}
                  size={160} level="M" includeMargin={false}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-3 font-medium">Show this QR code to the operator before boarding</p>
            </div>
          </div>

          {/* Imigongo bottom corners */}
          <ImigongoCorner position="bottom-left" size={40} color="#1c3f94" opacity={0.08} />
          <ImigongoCorner position="bottom-right" size={40} color="#1c3f94" opacity={0.08} />

          {/* Imigongo divider above footer */}
          <ImigongoDivider color="#1c3f94" opacity={0.05} />
          <div className="px-6 py-3 text-center">
            <p className="text-[10px] text-gray-400">BusBook Rwanda · {booking.id} · Issued {new Date(booking.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketPage;
