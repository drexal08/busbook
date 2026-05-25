import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { cities } from '../data/mockData';
import { IconChart, IconRoute, IconBus, IconCalendar, IconTicket, IconPlus, IconArrowRight, IconSeat, IconWallet, IconScan } from '../components/Icons';
import Select from '../components/Select';
import DatePicker from '../components/DatePicker';
import { db } from '../lib/firebase';
import { collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore'; 
import { IconCheck, IconX } from '../components/Icons';
import { User } from '../types';

const CompanyDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { companies, getCompanyTrips, getCompanyBookings, getCompanyRoutes, getCompanyBuses, addRoute, addBus, addTrip, getRouteInfo } = useData();
  const [tab, setTab] = useState<string>('overview');
  const [msg, setMsg] = useState('');
  const [nrOrigin, setNrOrigin] = useState('');
  const [nrDest, setNrDest] = useState('');
  const [nrDist, setNrDist] = useState('');
  const [nrDur, setNrDur] = useState('');
  const [nbName, setNbName] = useState('');
  const [nbPlate, setNbPlate] = useState('');
  const [nbSeats, setNbSeats] = useState('49');
  const [ntRoute, setNtRoute] = useState('');
const [ntBus, setNtBus] = useState('');
const [ntDate, setNtDate] = useState('');
const [ntDep, setNtDep] = useState('');
const [ntArr, setNtArr] = useState('');
const [ntPrice, setNtPrice] = useState('');
const [ntOnlineSeats, setNtOnlineSeats] = useState('');
const [operators, setOperators] = useState<User[]>([]);
const [codeCopied, setCodeCopied] = useState(false);

  const cid = user?.companyId || '';
  const company = companies.find(c => c.id === cid);
  const trips = getCompanyTrips(cid);
  const bookings = getCompanyBookings(cid);
  const routes = getCompanyRoutes(cid);
  const buses = getCompanyBuses(cid);
  const today = new Date().toISOString().split('T')[0];
  const revenue = bookings.filter(b => b.status !== 'cancelled').reduce((s, b) => s + b.price, 0);

  const cityOpts = useMemo(() => cities.map(c => ({ value: c, label: c })), []);
  const routeOpts = useMemo(() => routes.map(r => ({ value: r.id, label: `${r.origin} → ${r.destination}` })), [routes]);
  const busOpts = useMemo(() => buses.map(b => ({ value: b.id, label: `${b.name} (${b.plateNumber})` })), [buses]);

  useEffect(() => {
    if (!cid) return;
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'operator'),
      where('companyId', '==', cid)
    );
    return onSnapshot(q, (snapshot) => {
      setOperators(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as User)));
    });
  }, [cid]);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };
  const copyCompanyCode = async () => {
    if (!cid) return;
    await navigator.clipboard.writeText(cid);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };
  const handleAddRoute = (e: React.FormEvent) => { e.preventDefault(); addRoute({ companyId: cid, origin: nrOrigin, destination: nrDest, distance: parseInt(nrDist), duration: nrDur }); setNrOrigin(''); setNrDest(''); setNrDist(''); setNrDur(''); flash('Route added'); setTab('routes'); };
  const handleAddBus = (e: React.FormEvent) => { e.preventDefault(); addBus({ companyId: cid, name: nbName, plateNumber: nbPlate, totalSeats: parseInt(nbSeats), layout: '2-2', amenities: ['AC'] }); setNbName(''); setNbPlate(''); setNbSeats('49'); flash('Bus added'); setTab('buses'); };
  const handleAddTrip = async (e: React.FormEvent) => {
  e.preventDefault();
  await addTrip({
    routeId: ntRoute,
    companyId: cid,
    busId: ntBus,
    date: ntDate,
    departureTime: ntDep,
    arrivalTime: ntArr,
    price: parseInt(ntPrice),
    totalSeats: buses.find(b => b.id === ntBus)?.totalSeats || 49,
    onlineSeats: parseInt(ntOnlineSeats),
    status: 'scheduled'
  });
  setNtRoute(''); setNtBus(''); setNtDate('');
  setNtDep(''); setNtArr(''); setNtPrice(''); setNtOnlineSeats('');
  flash('Trip scheduled');
  setTab('trips');
};

  if (!isAuthenticated || !user || user.role !== 'company') { navigate('/login'); return null; }

  const tabs = [
  { key: 'overview', label: 'Overview', icon: <IconChart size={15} /> },
  { key: 'routes', label: 'Routes', icon: <IconRoute size={15} /> },
  { key: 'buses', label: 'Buses', icon: <IconBus size={15} /> },
  { key: 'trips', label: 'Trips', icon: <IconCalendar size={15} /> },
  { key: 'operators', label: 'Operators', icon: <IconScan size={15} /> }, // NEW
  { key: 'bookings', label: 'Bookings', icon: <IconTicket size={15} /> },
];

  const field = "w-full bg-surface-secondary border border-border-light rounded-xl px-4 py-3 text-[13px] text-gray-800 font-medium focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all";

  return (
    <div className="min-h-[calc(100vh-60px)] bg-surface-secondary">
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-bold text-gray-900">{company?.name || 'Company'}</h1>
            <p className="text-xs text-gray-400">Manage fleet, routes, and schedules</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <button
              type="button"
              onClick={copyCompanyCode}
              className="text-[10px] font-semibold px-3 py-1 rounded-full border border-border bg-surface-secondary text-gray-600 hover:bg-surface-tertiary transition-all"
              title="Copy company code"
            >
              Code: <span className="font-mono">{cid || 'unassigned'}</span>{codeCopied ? ' copied' : ''}
            </button>
            <span className={`text-[10px] font-semibold px-3 py-1 rounded-full border ${company?.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : company?.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-red-50 text-red-500 border-red-100'}`}>
              {company?.status?.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {msg && <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-4 py-2.5 rounded-xl mb-4 text-xs font-medium fade-in">{msg}</div>}

        <div className="flex gap-1 mb-6 overflow-x-auto bg-white rounded-xl border border-border p-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-medium transition-all whitespace-nowrap ${tab === t.key ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-500 hover:bg-surface-secondary'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Trips', value: trips.length, icon: <IconCalendar size={18} />, color: 'text-primary-600 bg-primary-50' },
                { label: 'Today', value: trips.filter(t => t.date === today).length, icon: <IconBus size={18} />, color: 'text-emerald-600 bg-emerald-50' },
                { label: 'Bookings', value: bookings.length, icon: <IconTicket size={18} />, color: 'text-violet-600 bg-violet-50' },
                { label: 'Revenue', value: revenue >= 1000 ? `${(revenue/1000).toFixed(1)}K` : revenue.toString(), icon: <IconWallet size={18} />, color: 'text-amber-600 bg-amber-50' },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-xl border border-border p-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 ${s.color}`}>{s.icon}</div>
                  <div className="text-lg font-bold text-gray-900">{s.value}</div>
                  <div className="text-[11px] text-gray-400 font-medium">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-3">Quick actions</h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Add route', icon: <IconRoute size={18} />, t: 'addRoute', c: 'text-primary-600 bg-primary-50 hover:bg-primary-100' },
                  { label: 'Add bus', icon: <IconBus size={18} />, t: 'addBus', c: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' },
                  { label: 'Add trip', icon: <IconCalendar size={18} />, t: 'addTrip', c: 'text-violet-600 bg-violet-50 hover:bg-violet-100' },
                ].map((a, i) => (
                  <button key={i} onClick={() => setTab(a.t)} className={`p-4 rounded-xl text-center transition-all ${a.c}`}>
                    <div className="flex justify-center mb-1.5">{a.icon}</div>
                    <div className="text-[11px] font-semibold">{a.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Routes list */}
        {tab === 'routes' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900 text-sm">Routes ({routes.length})</h3>
              <button onClick={() => setTab('addRoute')} className="bg-primary-600 text-white px-3.5 py-2 rounded-lg text-[11px] font-semibold flex items-center gap-1 hover:bg-primary-700"><IconPlus size={13} /> Add</button>
            </div>
            <div className="space-y-2">{routes.map(r => (
              <div key={r.id} className="bg-white rounded-xl border border-border p-4 flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600"><IconRoute size={16} /></div>
                <div><div className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">{r.origin} <IconArrowRight size={11} className="text-gray-300" /> {r.destination}</div><div className="text-[11px] text-gray-400">{r.distance} km · {r.duration}</div></div>
              </div>
            ))}{routes.length === 0 && <div className="text-center py-8 text-xs text-gray-400">No routes</div>}</div>
          </div>
        )}

        {/* Add Route */}
        {tab === 'addRoute' && (
          <div className="bg-white rounded-xl border border-border p-6 max-w-lg">
            <h3 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-1.5"><IconPlus size={15} /> Add route</h3>
            <form onSubmit={handleAddRoute} className="space-y-3">
              <Select options={cityOpts} value={nrOrigin} onChange={setNrOrigin} label="Origin" placeholder="Select city" searchable required />
              <Select options={cityOpts} value={nrDest} onChange={setNrDest} label="Destination" placeholder="Select city" searchable required />
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Distance (km)</label><input type="number" value={nrDist} onChange={e => setNrDist(e.target.value)} className={field} required /></div>
                <div><label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Duration</label><input type="text" value={nrDur} onChange={e => setNrDur(e.target.value)} placeholder="2h 30min" className={field} required /></div>
              </div>
              <button type="submit" className="bg-primary-600 text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-primary-700 transition-all">Add route</button>
            </form>
          </div>
        )}

        {/* Buses list */}
        {tab === 'buses' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900 text-sm">Buses ({buses.length})</h3>
              <button onClick={() => setTab('addBus')} className="bg-primary-600 text-white px-3.5 py-2 rounded-lg text-[11px] font-semibold flex items-center gap-1 hover:bg-primary-700"><IconPlus size={13} /> Add</button>
            </div>
            <div className="space-y-2">{buses.map(b => (
              <div key={b.id} className="bg-white rounded-xl border border-border p-4 flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600"><IconBus size={16} /></div>
                <div><div className="text-xs font-semibold text-gray-900">{b.name} <span className="text-gray-400 font-mono">({b.plateNumber})</span></div><div className="text-[11px] text-gray-400 flex items-center gap-1"><IconSeat size={11} /> {b.totalSeats} seats · {b.amenities.join(', ')}</div></div>
              </div>
            ))}{buses.length === 0 && <div className="text-center py-8 text-xs text-gray-400">No buses</div>}</div>
          </div>
        )}

        {/* Add Bus */}
        {tab === 'addBus' && (
          <div className="bg-white rounded-xl border border-border p-6 max-w-lg">
            <h3 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-1.5"><IconPlus size={15} /> Add bus</h3>
            <form onSubmit={handleAddBus} className="space-y-3">
              <div><label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Bus name</label><input type="text" value={nbName} onChange={e => setNbName(e.target.value)} placeholder="RE-003" className={field} required /></div>
              <div><label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Plate number</label><input type="text" value={nbPlate} onChange={e => setNbPlate(e.target.value)} placeholder="RA 999 Z" className={field} required /></div>
              <div><label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Seats</label><input type="number" value={nbSeats} onChange={e => setNbSeats(e.target.value)} className={field} required /></div>
              <button type="submit" className="bg-primary-600 text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-primary-700 transition-all">Add bus</button>
            </form>
          </div>
        )}

        {/* Trips list */}
        {tab === 'trips' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900 text-sm">Trips ({trips.length})</h3>
              <button onClick={() => setTab('addTrip')} className="bg-primary-600 text-white px-3.5 py-2 rounded-lg text-[11px] font-semibold flex items-center gap-1 hover:bg-primary-700"><IconPlus size={13} /> Add</button>
            </div>
            <div className="space-y-2">{trips.sort((a,b) => a.date.localeCompare(b.date)).map(t => {
              const r = getRouteInfo(t.routeId);
              return (
                <div key={t.id} className="bg-white rounded-xl border border-border p-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">{r?.origin} <IconArrowRight size={11} className="text-gray-300" /> {r?.destination}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">{t.date} · {t.departureTime}–{t.arrivalTime} · {t.availableSeats}/{t.totalSeats} seats · {t.price.toLocaleString()} RWF</div>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${t.status === 'scheduled' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>{t.status}</span>
                </div>
              );
            })}{trips.length === 0 && <div className="text-center py-8 text-xs text-gray-400">No trips</div>}</div>
          </div>
        )}

        {/* Add Trip */}
        {tab === 'addTrip' && (
          <div className="bg-white rounded-xl border border-border p-6 max-w-lg">
            <h3 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-1.5"><IconPlus size={15} /> Schedule trip</h3>
            <form onSubmit={handleAddTrip} className="space-y-3">
              <Select options={routeOpts} value={ntRoute} onChange={setNtRoute} label="Route" placeholder="Select route" required />
              <Select options={busOpts} value={ntBus} onChange={setNtBus} label="Bus" placeholder="Select bus" required />
              <DatePicker value={ntDate} onChange={setNtDate} min={today} label="Date" required />
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Departure</label><input type="time" value={ntDep} onChange={e => setNtDep(e.target.value)} className={field} required /></div>
                <div><label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Arrival</label><input type="time" value={ntArr} onChange={e => setNtArr(e.target.value)} className={field} required /></div>
              </div>
              <div><label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Price (RWF)</label><input type="number" value={ntPrice} onChange={e => setNtPrice(e.target.value)} className={field} required /></div>
              <div>
  <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
    Online seats
  </label>
  <input
    type="number"
    value={ntOnlineSeats}
    onChange={e => setNtOnlineSeats(e.target.value)}
    placeholder="Seats available to book online"
    className={field}
    required
  />
  <p className="text-[10px] text-gray-400 mt-1">
    Physical capacity: {buses.find(b => b.id === ntBus)?.totalSeats ?? '—'} seats total
  </p>
</div>
              <button type="submit" className="bg-primary-600 text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-primary-700 transition-all">Schedule trip</button>
            </form>
          </div>
        )}

        {/* Operators */}
{tab === 'operators' && (
  <div>
    <h3 className="font-semibold text-gray-900 text-sm mb-4">Operators</h3>
    <div className="space-y-2">
      {operators.map(op => (
        <div key={op.id} className="bg-white rounded-xl border border-border p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-900">{op.name}</div>
            <div className="text-[11px] text-gray-400">{op.email} · {op.phone}</div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              op.operatorStatus === 'approved' ? 'bg-emerald-50 text-emerald-600' :
              op.operatorStatus === 'pending' ? 'bg-amber-50 text-amber-600' :
              'bg-red-50 text-red-500'
            }`}>
              {op.operatorStatus || 'pending'}
            </span>
            {op.operatorStatus === 'pending' && (
              <>
                <button 
                  onClick={async () => {
                    await updateDoc(doc(db, 'users', op.id), { operatorStatus: 'approved' });
                    flash('Operator approved');
                  }}
                  className="w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center"
                >
                  <IconCheck size={14} />
                </button>
                <button 
                  onClick={async () => {
                    await updateDoc(doc(db, 'users', op.id), { operatorStatus: 'rejected' });
                    flash('Operator rejected');
                  }}
                  className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center"
                >
                  <IconX size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      ))}
      {operators.length === 0 && <div className="text-center py-8 text-xs text-gray-400">No operator accounts yet</div>}
    </div>
  </div>
)}

        {/* Bookings */}
        {tab === 'bookings' && (
          <div>
            <h3 className="font-semibold text-gray-900 text-sm mb-4">Bookings ({bookings.length})</h3>
            <div className="space-y-2">{bookings.map(b => (
              <div key={b.id} className="bg-white rounded-xl border border-border p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-gray-900">{b.passengerName} · <span className="font-mono text-gray-500">{b.id}</span></div>
                  <div className="text-[11px] text-gray-400 flex items-center gap-1.5 mt-0.5">{b.origin} <IconArrowRight size={10} className="text-gray-300" /> {b.destination} · {b.departureDate} · Seat {b.seatNumber}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-gray-900">{b.price.toLocaleString()} <span className="text-gray-400 font-normal">RWF</span></div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${b.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' : b.status === 'used' ? 'bg-gray-100 text-gray-500' : 'bg-red-50 text-red-500'}`}>{b.status}</span>
                </div>
              </div>
            ))}{bookings.length === 0 && <div className="text-center py-8 text-xs text-gray-400">No bookings</div>}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyDashboard;
