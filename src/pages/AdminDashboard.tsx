import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { IconShield, IconChart, IconBuilding, IconCalendar, IconTicket, IconCheck, IconX, IconArrowRight, IconBus, IconSeat, IconWallet, IconCheckCircle, IconXCircle, IconClock } from '../components/Icons';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { companies, approveCompany, rejectCompany, trips, bookings, routes } = useData();
  const [tab, setTab] = useState<string>('overview');

  if (authLoading) return null;
  if (!isAuthenticated || !user || user.role !== 'admin') { navigate('/login'); return null; }

  const pending = companies.filter(c => c.status === 'pending');
  const approved = companies.filter(c => c.status === 'approved');
  const revenue = bookings.filter(b => b.status !== 'cancelled').reduce((s, b) => s + b.price, 0);
  const today = new Date().toISOString().split('T')[0];

  const tabs = [
    { key: 'overview', label: 'Overview', icon: <IconChart size={15} /> },
    { key: 'companies', label: `Companies (${companies.length})`, icon: <IconBuilding size={15} /> },
    { key: 'trips', label: `Trips (${trips.length})`, icon: <IconCalendar size={15} /> },
    { key: 'bookings', label: `Bookings (${bookings.length})`, icon: <IconTicket size={15} /> },
  ];

  return (
    <div className="min-h-[calc(100vh-60px)] bg-surface-secondary">
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600"><IconShield size={20} /></div>
          <div><h1 className="text-base font-bold text-gray-900">Admin Panel</h1><p className="text-xs text-gray-400">Platform control & analytics</p></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-1 mb-6 overflow-x-auto bg-white rounded-xl border border-border p-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-medium transition-all whitespace-nowrap ${tab === t.key ? 'bg-rose-600 text-white shadow-sm' : 'text-gray-500 hover:bg-surface-secondary'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Companies', value: companies.length, sub: `${approved.length} approved`, icon: <IconBuilding size={18} />, color: 'text-primary-600 bg-primary-50' },
                { label: 'Pending', value: pending.length, sub: 'awaiting review', icon: <IconClock size={18} />, color: 'text-amber-600 bg-amber-50' },
                { label: 'Active trips', value: trips.filter(t => t.date === today).length, sub: 'today', icon: <IconBus size={18} />, color: 'text-emerald-600 bg-emerald-50' },
                { label: 'Revenue', value: revenue >= 1000 ? `${(revenue/1000).toFixed(1)}K` : revenue.toString(), icon: <IconWallet size={18} />, color: 'text-amber-600 bg-amber-50' },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.color}`}>{s.icon}</div>
                    <span className="text-[10px] text-gray-400 font-medium">{s.sub}</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">{s.value}</div>
                  <div className="text-[11px] text-gray-400 font-medium">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white rounded-xl border border-border p-5">
                <h3 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2"><IconClock size={15} className="text-amber-500" /> Pending approvals ({pending.length})</h3>
                {pending.length === 0 ? <p className="text-xs text-gray-400 text-center py-4">All clear</p> : (
                  <div className="space-y-3">
                    {pending.map(c => (
                      <div key={c.id} className="bg-amber-50/50 border border-amber-100 rounded-xl p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-xs font-semibold text-gray-900">{c.name}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5">{c.email} · {c.phone}</div>
                            <div className="text-[10px] text-gray-400 mt-1 line-clamp-2">{c.description}</div>
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            <button onClick={() => approveCompany(c.id)} className="w-8 h-8 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-600 flex items-center justify-center transition-all" title="Approve"><IconCheck size={14} /></button>
                            <button onClick={() => rejectCompany(c.id)} className="w-8 h-8 rounded-lg bg-red-100 hover:bg-red-200 text-red-500 flex items-center justify-center transition-all" title="Reject"><IconX size={14} /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-border p-5">
                <h3 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2"><IconChart size={15} className="text-primary-500" /> Platform stats</h3>
                <div className="space-y-0">
                  {[
                    { label: 'Routes', value: routes.length },
                    { label: 'Total trips', value: trips.length },
                    { label: 'Total bookings', value: bookings.length },
                    { label: 'Confirmed', value: bookings.filter(b => b.status === 'confirmed').length, color: 'text-emerald-600' },
                    { label: 'Used', value: bookings.filter(b => b.status === 'used').length, color: 'text-gray-500' },
                    { label: 'Cancelled', value: bookings.filter(b => b.status === 'cancelled').length, color: 'text-red-500' },
                  ].map((s, i) => (
                    <div key={i} className="flex justify-between items-center py-2.5 border-b border-border-light last:border-0">
                      <span className="text-xs text-gray-500">{s.label}</span>
                      <span className={`text-xs font-bold ${s.color || 'text-gray-900'}`}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'companies' && (
          <div className="space-y-3">
            {companies.map(c => (
              <div key={c.id} className="bg-white rounded-xl border border-border p-5 hover:border-primary-200 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 font-bold text-sm shrink-0">{c.name.charAt(0)}</div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{c.name}</div>
                      <div className="text-[11px] text-gray-400">{c.email} · {c.phone}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5 max-w-md">{c.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-semibold px-3 py-1 rounded-full border ${c.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : c.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-red-50 text-red-500 border-red-100'}`}>
                      {c.status}
                    </span>
                    {c.status === 'pending' && (
                      <>
                        <button onClick={() => approveCompany(c.id)} className="w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center transition-all"><IconCheck size={14} /></button>
                        <button onClick={() => rejectCompany(c.id)} className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-all"><IconX size={14} /></button>
                      </>
                    )}
                    {c.status === 'rejected' && (
                      <button onClick={() => approveCompany(c.id)} className="text-[10px] font-semibold text-emerald-600 hover:underline">Re-approve</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'trips' && (
          <div className="space-y-2">
            {trips.sort((a,b) => a.date.localeCompare(b.date)).map(t => {
              const r = routes.find(rt => rt.id === t.routeId);
              const co = companies.find(c => c.id === t.companyId);
              return (
                <div key={t.id} className="bg-white rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">{r?.origin} <IconArrowRight size={11} className="text-gray-300" /> {r?.destination}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">{co?.name} · {t.date} · {t.departureTime}–{t.arrivalTime} · {t.price.toLocaleString()} RWF</div>
                  </div>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="text-gray-400 flex items-center gap-1"><IconSeat size={11} /> {t.bookedSeats.length}/{t.totalSeats}</span>
                    <span className={`font-semibold px-2 py-0.5 rounded-full ${t.status === 'scheduled' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>{t.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'bookings' && (
          <div className="space-y-2">
            {bookings.length === 0 && <div className="text-center py-12 text-xs text-gray-400">No bookings</div>}
            {bookings.map(b => (
              <div key={b.id} className="bg-white rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold text-gray-900">{b.passengerName} · <span className="font-mono text-gray-400">{b.id}</span></div>
                  <div className="text-[11px] text-gray-400 mt-0.5">{b.origin} → {b.destination} · {b.departureDate} · Seat {b.seatNumber}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-900">{b.price.toLocaleString()} <span className="text-gray-400 font-normal">RWF</span></span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${b.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' : b.status === 'used' ? 'bg-gray-100 text-gray-500' : 'bg-red-50 text-red-500'}`}>
                    {b.status === 'confirmed' ? <><IconCheckCircle size={10} /> Confirmed</> : b.status === 'used' ? <><IconCheckCircle size={10} /> Used</> : <><IconXCircle size={10} /> Cancelled</>}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
