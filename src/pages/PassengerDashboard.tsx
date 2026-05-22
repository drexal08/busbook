import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getPassengerBookings } from '../lib/bookings';
import { IconSearch, IconArrowRight, IconCalendar, IconClock, IconSeat, IconTicket, IconEye } from '../components/Icons';

const PassengerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) { navigate('/login'); return; }
    getPassengerBookings(user.id)
      .then(data => setBookings(data.sort((a: any, b: any) => new Date(b.createdAt?.seconds ? b.createdAt.seconds * 1000 : b.createdAt).getTime() - new Date(a.createdAt?.seconds ? a.createdAt.seconds * 1000 : a.createdAt).getTime())))
      .finally(() => setLoading(false));
  }, [user, isAuthenticated]);

  if (!isAuthenticated || !user) return null;

  const statusBadge: Record<string, string> = {
    confirmed: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    cancelled: 'bg-red-50 text-red-500 border-red-100',
    used: 'bg-gray-100 text-gray-500 border-gray-200',
  };

  return (
    <div className="min-h-[calc(100vh-60px)] bg-surface-secondary">
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-600 text-base font-bold">
                {user.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900">{user.name}</h1>
                <p className="text-gray-400 text-xs">{user.email}</p>
              </div>
            </div>
            <button onClick={() => navigate('/search')} className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm">
              <IconSearch size={14} /> Book new trip
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-sm font-bold text-gray-900 mb-4">My bookings <span className="text-gray-300 font-normal">({bookings.length})</span></h2>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-[3px] border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-border">
            <div className="w-14 h-14 bg-surface-tertiary rounded-2xl flex items-center justify-center mx-auto mb-3"><IconTicket size={24} className="text-gray-300" /></div>
            <h3 className="font-semibold text-gray-700 text-sm mb-1">No bookings yet</h3>
            <p className="text-xs text-gray-400 mb-4">Start by searching for available routes</p>
            <button onClick={() => navigate('/search')} className="text-xs font-semibold text-primary-600 hover:underline">Search routes</button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {bookings.map(b => (
              <div key={b.id} className="bg-white rounded-xl border border-border p-4 sm:p-5 hover:border-primary-200 hover:shadow-sm transition-all fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] font-mono font-semibold text-gray-500">{b.id}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusBadge[b.status]}`}>{b.status}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      {b.origin} <IconArrowRight size={12} className="text-gray-300" /> {b.destination}
                    </div>
                    <div className="flex gap-4 mt-1.5 text-[11px] text-gray-400">
                      <span className="flex items-center gap-1"><IconCalendar size={11} /> {new Date(b.departureDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      <span className="flex items-center gap-1"><IconClock size={11} /> {b.departureTime}</span>
                      <span className="flex items-center gap-1"><IconSeat size={11} /> Seat {b.seatNumber}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-900">{b.price.toLocaleString()} <span className="text-[10px] text-gray-400 font-medium">RWF</span></span>
                    {b.status === 'confirmed' && (
                      <button onClick={() => navigate(`/ticket/${b.id}`)} className="bg-primary-50 hover:bg-primary-100 text-primary-600 px-3.5 py-2 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1.5">
                        <IconEye size={13} /> Ticket
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PassengerDashboard;