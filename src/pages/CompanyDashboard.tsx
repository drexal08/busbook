import React, { useState, useMemo, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { cities } from '../data/mockData';
import { IconChart, IconRoute, IconBus, IconCalendar, IconTicket, IconPlus, IconArrowRight, IconSeat, IconWallet, IconScan } from '../components/Icons';
import Select from '../components/Select';
import DatePicker from '../components/DatePicker';
import { db } from '../lib/firebase';
import { parsePositiveInteger, parseRwfAmount, sanitizeRwfAmountInput } from '../lib/numberInput';
import { collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore'; 
import { IconCheck, IconX } from '../components/Icons';
import { TripTemplate, User } from '../types';

const DAY_OPTIONS = [
  { v: 1, l: 'Monday', s: 'Mon' },
  { v: 2, l: 'Tuesday', s: 'Tue' },
  { v: 3, l: 'Wednesday', s: 'Wed' },
  { v: 4, l: 'Thursday', s: 'Thu' },
  { v: 5, l: 'Friday', s: 'Fri' },
  { v: 6, l: 'Saturday', s: 'Sat' },
  { v: 7, l: 'Sunday', s: 'Sun' },
] as const;

const CompanyDashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const {
    companies,
    getCompanyTrips,
    getCompanyBookings,
    getCompanyRoutes,
    getCompanyBuses,
    getCompanyTripTemplates,
    addRoute,
    addBus,
    addTrip,
    cancelTrip,
    addTripTemplate,
    updateTripTemplate,
    deleteTripTemplate,
    generateUpcomingTrips,
    getRouteInfo
  } = useData();
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
  const [tripView, setTripView] = useState<'upcoming' | 'past'>('upcoming');
  const [tsRoute, setTsRoute] = useState('');
  const [tsBus, setTsBus] = useState('');
  const [tsDep, setTsDep] = useState('');
  const [tsArr, setTsArr] = useState('');
  const [tsPrice, setTsPrice] = useState('');
  const [tsOnlineSeats, setTsOnlineSeats] = useState('');
  const [tsSellDaysAhead, setTsSellDaysAhead] = useState('7');
  const [tsRecurrenceMode, setTsRecurrenceMode] = useState<'weekly' | 'interval'>('weekly');
  const [tsDaysOfWeek, setTsDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);
  const [tsStartDate, setTsStartDate] = useState('');
  const [tsIntervalValue, setTsIntervalValue] = useState('1');
  const [tsIntervalUnit, setTsIntervalUnit] = useState<'minutes' | 'hours'>('hours');
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  const cid = user?.companyId || '';
  const company = companies.find(c => c.id === cid);
  const trips = getCompanyTrips(cid);
  const bookings = getCompanyBookings(cid);
  const routes = getCompanyRoutes(cid);
  const buses = getCompanyBuses(cid);
  const templates = getCompanyTripTemplates(cid);
  const formatDateInput = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const today = formatDateInput(new Date());
  const revenue = bookings.filter(b => b.status !== 'cancelled').reduce((s, b) => s + b.price, 0);

  const cityOpts = useMemo(() => cities.map(c => ({ value: c, label: c })), []);
  const routeOpts = useMemo(() => routes.map(r => ({ value: r.id, label: `${r.origin} → ${r.destination}` })), [routes]);
  const busOpts = useMemo(() => buses.map(b => ({ value: b.id, label: `${b.name} (${b.plateNumber})` })), [buses]);
  const selectedTripRoute = routes.find(r => r.id === ntRoute);
  const selectedTripBus = buses.find(b => b.id === ntBus);
  const selectedScheduleRoute = routes.find(r => r.id === tsRoute);
  const selectedScheduleBus = buses.find(b => b.id === tsBus);
  const templateSummaries = useMemo(() => {
    return templates.map(template => {
      const dayLabels = DAY_OPTIONS
        .filter(day => template.daysOfWeek?.includes(day.v))
        .map(day => day.s)
        .join(', ');
      const recurrenceLabel = (template.recurrenceMode || 'weekly') === 'interval'
        ? `Every ${template.intervalValue || 1} ${template.intervalUnit || 'hours'} from ${template.startDate || today}`
        : dayLabels || 'Every day';
      return { id: template.id, recurrenceLabel };
    });
  }, [templates, today]);

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

  useEffect(() => {
    if (!cid) return;
    generateUpcomingTrips(cid).catch(() => {});
  }, [cid, generateUpcomingTrips]);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };
  const copyCompanyCode = async () => {
    if (!cid) return;
    await navigator.clipboard.writeText(cid);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };
  const handleAddRoute = async (e: React.FormEvent) => {
    e.preventDefault();

    const distance = parsePositiveInteger(nrDist);
    if (!distance) {
      flash('Enter a valid route distance greater than zero');
      return;
    }

    await addRoute({
      companyId: cid,
      origin: nrOrigin,
      destination: nrDest,
      distance,
      duration: nrDur,
    });
    setNrOrigin('');
    setNrDest('');
    setNrDist('');
    setNrDur('');
    flash('Route added');
    setTab('routes');
  };

  const handleAddBus = async (e: React.FormEvent) => {
    e.preventDefault();

    const totalSeats = parsePositiveInteger(nbSeats);
    if (!totalSeats) {
      flash('Enter a valid seat capacity greater than zero');
      return;
    }

    await addBus({
      companyId: cid,
      name: nbName,
      plateNumber: nbPlate,
      totalSeats,
      layout: '2-2',
      amenities: ['AC'],
    });
    setNbName('');
    setNbPlate('');
    setNbSeats('49');
    flash('Bus added');
    setTab('buses');
  };

  const handleAddTrip = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedBus = buses.find(b => b.id === ntBus);
    const totalSeats = selectedBus?.totalSeats || 49;
    const price = parseRwfAmount(ntPrice);
    const onlineSeats = parsePositiveInteger(ntOnlineSeats);

    if (!ntRoute || !ntBus || !ntDate || !ntDep || !ntArr) {
      flash('Complete the trip form before scheduling');
      return;
    }

    if (!price) {
      flash('Enter a valid trip price such as 3500 or 3,500');
      return;
    }

    if (!onlineSeats) {
      flash('Enter a valid number of online seats greater than zero');
      return;
    }

    if (onlineSeats > totalSeats) {
      flash(`Online seats cannot exceed the bus capacity of ${totalSeats}`);
      return;
    }

    await addTrip({
      routeId: ntRoute,
      companyId: cid,
      busId: ntBus,
      date: ntDate,
      departureTime: ntDep,
      arrivalTime: ntArr,
      price,
      totalSeats,
      onlineSeats,
      status: 'scheduled'
    });
    setNtRoute('');
    setNtBus('');
    setNtDate('');
    setNtDep('');
    setNtArr('');
    setNtPrice('');
    setNtOnlineSeats('');
    flash('Trip scheduled');
    setTab('trips');
  };

  const resetTemplateForm = () => {
    setTsRoute('');
    setTsBus('');
    setTsDep('');
    setTsArr('');
    setTsPrice('');
    setTsOnlineSeats('');
    setTsSellDaysAhead('7');
    setTsRecurrenceMode('weekly');
    setTsDaysOfWeek([1, 2, 3, 4, 5, 6, 7]);
    setTsStartDate(today);
    setTsIntervalValue('1');
    setTsIntervalUnit('hours');
    setEditingTemplateId(null);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cid) return;
    if (!tsRoute || !tsBus || !tsDep || !tsArr || !tsPrice || !tsOnlineSeats) return;

    const totalSeats = buses.find(b => b.id === tsBus)?.totalSeats || 49;
    const price = parseRwfAmount(tsPrice);
    const onlineSeats = parsePositiveInteger(tsOnlineSeats);
    const sellDaysAhead = parsePositiveInteger(tsSellDaysAhead);
    const intervalValue = parsePositiveInteger(tsIntervalValue);

    if (!price) {
      flash('Enter a valid schedule price such as 3500 or 3,500');
      return;
    }

    if (!onlineSeats) {
      flash('Enter a valid number of online seats greater than zero');
      return;
    }

    if (onlineSeats > totalSeats) {
      flash(`Online seats cannot exceed the bus capacity of ${totalSeats}`);
      return;
    }

    if (!sellDaysAhead) {
      flash('Sell days ahead must be a whole number greater than zero');
      return;
    }

    if (tsRecurrenceMode === 'weekly' && !tsDaysOfWeek.length) {
      flash('Choose at least one day of the week for this schedule');
      return;
    }

    if (tsRecurrenceMode === 'interval') {
      if (!tsStartDate) {
        flash('Choose the first departure date for interval schedules');
        return;
      }

      if (!intervalValue) {
        flash('Set how often this trip should repeat in minutes or hours');
        return;
      }
    }

    const existingTemplate = editingTemplateId ? templates.find(t => t.id === editingTemplateId) : null;
    const payload: Omit<TripTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
      companyId: cid,
      routeId: tsRoute,
      busId: tsBus,
      recurrenceMode: tsRecurrenceMode,
      departureTime: tsDep,
      arrivalTime: tsArr,
      price,
      onlineSeats,
      totalSeats,
      daysOfWeek: tsRecurrenceMode === 'weekly' ? tsDaysOfWeek.slice().sort((a, b) => a - b) : [],
      sellDaysAhead,
      startDate: tsRecurrenceMode === 'interval' ? tsStartDate : undefined,
      intervalValue: tsRecurrenceMode === 'interval' ? intervalValue || 1 : undefined,
      intervalUnit: tsRecurrenceMode === 'interval' ? tsIntervalUnit : undefined,
      active: existingTemplate?.active ?? true,
    };

    let nextTemplates: TripTemplate[];
    if (editingTemplateId) {
      await updateTripTemplate(editingTemplateId, payload);
      nextTemplates = templates.map(t => (
        t.id === editingTemplateId
          ? { ...t, ...payload, id: editingTemplateId, updatedAt: new Date().toISOString() }
          : t
      ));
      flash('Schedule updated');
    } else {
      const createdId = await addTripTemplate(payload);
      nextTemplates = [
        ...templates,
        {
          ...payload,
          id: createdId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      flash('Schedule created');
    }

    await generateUpcomingTrips(cid, nextTemplates);
    resetTemplateForm();
    setTab('schedules');
  };

  if (!isAuthenticated || !user || user.role !== 'company') {
    return <Navigate to="/login" replace />;
  }

  const tabGroups = [
    {
      label: 'Planning',
      items: [
        { key: 'overview', label: 'Overview', icon: <IconChart size={15} /> },
        { key: 'schedules', label: 'Schedules', icon: <IconCalendar size={15} /> },
        { key: 'trips', label: 'Trips', icon: <IconCalendar size={15} /> },
      ],
    },
    {
      label: 'Fleet',
      items: [
        { key: 'routes', label: 'Routes', icon: <IconRoute size={15} /> },
        { key: 'buses', label: 'Buses', icon: <IconBus size={15} /> },
      ],
    },
    {
      label: 'Operations',
      items: [
        { key: 'operators', label: 'Operators', icon: <IconScan size={15} /> },
        { key: 'bookings', label: 'Bookings', icon: <IconTicket size={15} /> },
      ],
    },
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

        <div className="mb-6 grid gap-3 lg:grid-cols-3">
          {tabGroups.map(group => (
            <div key={group.label} className="bg-white rounded-xl border border-border p-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400 mb-2">{group.label}</div>
              <div className="flex flex-wrap gap-1">
                {group.items.map(item => (
                  <button
                    key={item.key}
                    onClick={() => setTab(item.key)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12px] font-medium transition-all whitespace-nowrap ${tab === item.key ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-500 hover:bg-surface-secondary'}`}
                  >
                    {item.icon} {item.label}
                  </button>
                ))}
              </div>
            </div>
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
            <div className="grid gap-3 lg:grid-cols-3">
              {[
                {
                  title: 'Fleet setup',
                  desc: 'Keep route and bus records in one place.',
                  actions: [
                    { label: 'Add route', t: 'addRoute' },
                    { label: 'Add bus', t: 'addBus' },
                  ],
                },
                {
                  title: 'Trip planning',
                  desc: 'Create one-time trips or reusable schedules.',
                  actions: [
                    { label: 'One-time trip', t: 'addTrip' },
                    { label: 'Recurring schedule', t: 'addSchedule' },
                  ],
                },
                {
                  title: 'Operations',
                  desc: 'Review trips, bookings, and operator activity.',
                  actions: [
                    { label: 'Open trips', t: 'trips' },
                    { label: 'Open bookings', t: 'bookings' },
                  ],
                },
              ].map(section => (
                <div key={section.title} className="bg-white rounded-xl border border-border p-5">
                  <h3 className="font-semibold text-gray-900 text-sm">{section.title}</h3>
                  <p className="text-[11px] text-gray-400 mt-1 mb-4">{section.desc}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {section.actions.map(action => (
                      <button
                        key={action.label}
                        onClick={() => setTab(action.t)}
                        className="rounded-xl border border-border bg-surface-secondary px-3 py-3 text-[11px] font-semibold text-gray-700 hover:bg-surface-tertiary transition-all"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
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
                <div><label htmlFor="route-distance" className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Distance (km)</label><input id="route-distance" type="number" min="1" step="1" value={nrDist} onChange={e => setNrDist(e.target.value)} className={field} required title="Distance in kilometers" aria-label="Distance in kilometers" /></div>
                <div><label htmlFor="route-duration" className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Duration</label><input id="route-duration" type="text" value={nrDur} onChange={e => setNrDur(e.target.value)} placeholder="2h 30min" className={field} required title="Route duration" aria-label="Route duration" /></div>
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
              <div><label htmlFor="bus-name" className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Bus name</label><input id="bus-name" type="text" value={nbName} onChange={e => setNbName(e.target.value)} placeholder="RE-003" className={field} required title="Bus name" aria-label="Bus name" /></div>
              <div><label htmlFor="bus-plate" className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Plate number</label><input id="bus-plate" type="text" value={nbPlate} onChange={e => setNbPlate(e.target.value)} placeholder="RA 999 Z" className={field} required title="Plate number" aria-label="Plate number" /></div>
              <div><label htmlFor="bus-seats" className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Seats</label><input id="bus-seats" type="number" min="1" step="1" value={nbSeats} onChange={e => setNbSeats(e.target.value)} className={field} required title="Seat capacity" aria-label="Seat capacity" /></div>
              <button type="submit" className="bg-primary-600 text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-primary-700 transition-all">Add bus</button>
            </form>
          </div>
        )}

        {tab === 'schedules' && (
          <div>
            <div className="flex justify-between items-center mb-4 gap-2">
              <h3 className="font-semibold text-gray-900 text-sm">Schedules ({templates.length})</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    const r = await generateUpcomingTrips(cid);
                    flash(r.created ? `Generated ${r.created} trips` : 'No new trips to generate');
                  }}
                  className="bg-surface-secondary text-gray-600 px-3.5 py-2 rounded-lg text-[11px] font-semibold hover:bg-surface-tertiary"
                >
                  Generate trips
                </button>
                <button
                  onClick={() => { resetTemplateForm(); setTab('addSchedule'); }}
                  className="bg-primary-600 text-white px-3.5 py-2 rounded-lg text-[11px] font-semibold flex items-center gap-1 hover:bg-primary-700"
                >
                  <IconPlus size={13} /> Add
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {templates.map(t => {
                const r = getRouteInfo(t.routeId);
                const busLabel = buses.find(b => b.id === t.busId)?.name || 'Bus';
                const recurrenceLabel = templateSummaries.find(summary => summary.id === t.id)?.recurrenceLabel || 'Every day';
                return (
                  <div key={t.id} className="bg-white rounded-xl border border-border p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                        {r?.origin} <IconArrowRight size={11} className="text-gray-300" /> {r?.destination}
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${t.active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-100 text-gray-500 border-border-light'}`}>
                          {t.active ? 'active' : 'inactive'}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        {t.departureTime}–{t.arrivalTime} · {busLabel} · {t.onlineSeats}/{t.totalSeats} online · {t.price.toLocaleString()} RWF · {t.sellDaysAhead} days ahead
                      </div>
                      <div className="text-[11px] text-primary-600 mt-1 font-medium">
                        {recurrenceLabel}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        onClick={async () => {
                          const nextTemplates = templates.map(template => (
                            template.id === t.id ? { ...template, active: !t.active } : template
                          ));
                          await updateTripTemplate(t.id, { active: !t.active });
                          if (!t.active) {
                            await generateUpcomingTrips(cid, nextTemplates);
                          }
                          flash(t.active ? 'Schedule paused' : 'Schedule activated');
                        }}
                        className="bg-surface-secondary text-gray-600 px-3 py-2 rounded-lg text-[11px] font-semibold hover:bg-surface-tertiary"
                      >
                        {t.active ? 'Pause' : 'Activate'}
                      </button>
                      <button
                        onClick={() => {
                          setEditingTemplateId(t.id);
                          setTsRoute(t.routeId);
                          setTsBus(t.busId);
                          setTsDep(t.departureTime);
                          setTsArr(t.arrivalTime);
                          setTsPrice(String(t.price));
                          setTsOnlineSeats(String(t.onlineSeats));
                          setTsSellDaysAhead(String(t.sellDaysAhead || 7));
                          setTsRecurrenceMode(t.recurrenceMode || 'weekly');
                          setTsDaysOfWeek(Array.isArray(t.daysOfWeek) ? t.daysOfWeek : [1,2,3,4,5,6,7]);
                          setTsStartDate(t.startDate || today);
                          setTsIntervalValue(String(t.intervalValue || 1));
                          setTsIntervalUnit(t.intervalUnit || 'hours');
                          setTab('addSchedule');
                        }}
                        className="bg-surface-secondary text-gray-600 px-3 py-2 rounded-lg text-[11px] font-semibold hover:bg-surface-tertiary"
                      >
                        Edit
                      </button>
                      <button
                        onClick={async () => {
                          if (!window.confirm('Delete this schedule?')) return;
                          await deleteTripTemplate(t.id);
                          flash('Schedule deleted');
                        }}
                        className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-[11px] font-semibold hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
              {templates.length === 0 && <div className="text-center py-8 text-xs text-gray-400">No schedules</div>}
            </div>
          </div>
        )}

        {tab === 'addSchedule' && (
          <div className="bg-white rounded-xl border border-border p-6">
            <div className="max-w-4xl">
              <h3 className="font-semibold text-gray-900 text-sm mb-1 flex items-center gap-1.5"><IconPlus size={15} /> {editingTemplateId ? 'Edit schedule' : 'Add schedule'}</h3>
              <p className="text-[11px] text-gray-400 mb-5">Use weekly schedules for fixed weekdays, or interval schedules for departures every few minutes or hours.</p>
            </div>
            <form onSubmit={handleSaveTemplate} className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_320px]">
              <div className="space-y-5">
                <div className="rounded-2xl border border-border p-4">
                  <h4 className="text-[12px] font-semibold text-gray-900 mb-3">Trip details</h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Select options={routeOpts} value={tsRoute} onChange={setTsRoute} label="Route" placeholder="Select route" required />
                    <Select options={busOpts} value={tsBus} onChange={setTsBus} label="Bus" placeholder="Select bus" required />
                    <div><label htmlFor="schedule-departure" className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Departure</label><input id="schedule-departure" type="time" value={tsDep} onChange={e => setTsDep(e.target.value)} className={field} required title="Schedule departure time" aria-label="Schedule departure time" /></div>
                    <div><label htmlFor="schedule-arrival" className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Arrival</label><input id="schedule-arrival" type="time" value={tsArr} onChange={e => setTsArr(e.target.value)} className={field} required title="Schedule arrival time" aria-label="Schedule arrival time" /></div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <h4 className="text-[12px] font-semibold text-gray-900">Recurrence</h4>
                      <p className="text-[11px] text-gray-400">Choose how this schedule should keep creating trips.</p>
                    </div>
                    <div className="flex items-center gap-1 rounded-xl bg-surface-secondary p-1">
                      <button
                        type="button"
                        onClick={() => setTsRecurrenceMode('weekly')}
                        className={`px-3 py-2 rounded-lg text-[11px] font-semibold transition-all ${tsRecurrenceMode === 'weekly' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500'}`}
                      >
                        Weekly
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTsRecurrenceMode('interval');
                          if (!tsStartDate) setTsStartDate(today);
                        }}
                        className={`px-3 py-2 rounded-lg text-[11px] font-semibold transition-all ${tsRecurrenceMode === 'interval' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500'}`}
                      >
                        Every X time
                      </button>
                    </div>
                  </div>

                  {tsRecurrenceMode === 'weekly' ? (
                    <div>
                      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Days of week</label>
                      <div className="grid grid-cols-2 gap-2 text-[12px] text-gray-700">
                        {DAY_OPTIONS.map(d => (
                          <label key={d.v} className="flex items-center gap-2 bg-surface-secondary border border-border-light rounded-xl px-3 py-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={tsDaysOfWeek.includes(d.v)}
                              onChange={() => setTsDaysOfWeek(prev => prev.includes(d.v) ? prev.filter(x => x !== d.v) : [...prev, d.v])}
                            />
                            <span className="font-medium">{d.l}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-3">
                      <DatePicker value={tsStartDate || today} onChange={setTsStartDate} min={today} label="First departure date" required />
                      <div>
                        <label htmlFor="schedule-interval-value" className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Repeat every</label>
                        <input
                          id="schedule-interval-value"
                          type="number"
                          min="1"
                          step="1"
                          value={tsIntervalValue}
                          onChange={e => setTsIntervalValue(e.target.value)}
                          className={field}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="schedule-interval-unit" className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Unit</label>
                        <select
                          id="schedule-interval-unit"
                          value={tsIntervalUnit}
                          onChange={e => setTsIntervalUnit(e.target.value as 'minutes' | 'hours')}
                          className={field}
                        >
                          <option value="minutes">Minutes</option>
                          <option value="hours">Hours</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-border p-4">
                  <h4 className="text-[12px] font-semibold text-gray-900 mb-3">Selling rules</h4>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label htmlFor="schedule-price" className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Price (RWF)</label>
                      <input id="schedule-price" type="text" inputMode="numeric" value={tsPrice} onChange={e => setTsPrice(sanitizeRwfAmountInput(e.target.value))} placeholder="3500 or 3,500" className={field} required title="Ticket price" aria-label="Ticket price" />
                    </div>
                    <div>
                      <label htmlFor="schedule-online-seats" className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Online seats</label>
                      <input id="schedule-online-seats" type="number" min="1" step="1" value={tsOnlineSeats} onChange={e => setTsOnlineSeats(e.target.value)} className={field} required title="Online seats" aria-label="Online seats" />
                    </div>
                    <div>
                      <label htmlFor="schedule-sell-days" className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Sell days ahead</label>
                      <input id="schedule-sell-days" type="number" min="1" step="1" value={tsSellDaysAhead} onChange={e => setTsSellDaysAhead(e.target.value)} className={field} required title="Sell days ahead" aria-label="Sell days ahead" />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2">Accepts whole RWF values like 3500 or 3,500.</p>
                </div>

                <div className="flex items-center gap-2">
                  <button type="submit" className="bg-primary-600 text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-primary-700 transition-all">{editingTemplateId ? 'Save changes' : 'Create schedule'}</button>
                  <button
                    type="button"
                    onClick={() => { resetTemplateForm(); setTab('schedules'); }}
                    className="bg-surface-secondary text-gray-600 px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-surface-tertiary transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-surface-secondary/70 p-4 h-fit">
                <h4 className="text-[12px] font-semibold text-gray-900 mb-3">Schedule summary</h4>
                <div className="space-y-2 text-[11px] text-gray-600">
                  <div><span className="font-semibold text-gray-900">Route:</span> {selectedScheduleRoute ? `${selectedScheduleRoute.origin} → ${selectedScheduleRoute.destination}` : 'Select a route'}</div>
                  <div><span className="font-semibold text-gray-900">Bus:</span> {selectedScheduleBus ? `${selectedScheduleBus.name} (${selectedScheduleBus.totalSeats} seats)` : 'Select a bus'}</div>
                  <div><span className="font-semibold text-gray-900">Pattern:</span> {tsRecurrenceMode === 'interval' ? `Every ${tsIntervalValue || '1'} ${tsIntervalUnit} starting ${tsStartDate || today}` : DAY_OPTIONS.filter(day => tsDaysOfWeek.includes(day.v)).map(day => day.s).join(', ') || 'Choose days'}</div>
                  <div><span className="font-semibold text-gray-900">Window:</span> Generates trips up to {tsSellDaysAhead || '7'} days ahead</div>
                  <div><span className="font-semibold text-gray-900">Capacity:</span> {tsOnlineSeats || '0'} online seats from {selectedScheduleBus?.totalSeats ?? '—'} total seats</div>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Trips list */}
        {tab === 'trips' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900 text-sm">Trips ({trips.length})</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTripView('upcoming')}
                  className={`px-3.5 py-2 rounded-lg text-[11px] font-semibold border ${tripView === 'upcoming' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-border hover:bg-surface-secondary'}`}
                >
                  Upcoming
                </button>
                <button
                  onClick={() => setTripView('past')}
                  className={`px-3.5 py-2 rounded-lg text-[11px] font-semibold border ${tripView === 'past' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-border hover:bg-surface-secondary'}`}
                >
                  Past
                </button>
                <button
                  onClick={() => setTab('addTrip')}
                  className="bg-primary-600 text-white px-3.5 py-2 rounded-lg text-[11px] font-semibold flex items-center gap-1 hover:bg-primary-700"
                >
                  <IconPlus size={13} /> One-time trip
                </button>
              </div>
            </div>
            <div className="space-y-2">{(() => {
              const visibleTrips = trips
                .filter(t => tripView === 'upcoming' ? t.date >= today : t.date < today)
                .sort((a, b) => `${a.date}${a.departureTime}`.localeCompare(`${b.date}${b.departureTime}`));

              return (
                <>
                  {visibleTrips.map(t => {
              const r = getRouteInfo(t.routeId);
              return (
                <div key={t.id} className="bg-white rounded-xl border border-border p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                      {r?.origin} <IconArrowRight size={11} className="text-gray-300" /> {r?.destination}
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${t.source === 'template' ? 'bg-primary-50 text-primary-700' : 'bg-violet-50 text-violet-700'}`}>
                        {t.source === 'template' ? 'scheduled' : 'one-time'}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5">{t.date} · {t.departureTime}–{t.arrivalTime} · {t.availableSeats}/{t.totalSeats} seats · {t.price.toLocaleString()} RWF</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {t.status === 'scheduled' && (
                      <>
                        <button
                          onClick={async () => {
                            const reason = window.prompt('Cancel reason (optional)') || '';
                            await cancelTrip(t.id, reason);
                            flash('Trip cancelled');
                          }}
                          className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-[11px] font-semibold hover:bg-red-100"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            setNtRoute(t.routeId);
                            setNtBus(t.busId);
                            setNtDate(t.date);
                            setNtDep(t.departureTime);
                            setNtArr(t.arrivalTime);
                            setNtPrice(String(t.price));
                            setNtOnlineSeats(String(t.onlineSeats));
                            setTab('addTrip');
                          }}
                          className="bg-surface-secondary text-gray-600 px-3 py-2 rounded-lg text-[11px] font-semibold hover:bg-surface-tertiary"
                        >
                          Replace
                        </button>
                      </>
                    )}
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${t.status === 'scheduled' ? 'bg-emerald-50 text-emerald-600' : t.status === 'cancelled' ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-500'}`}>{t.status}</span>
                  </div>
                </div>
                    );
                  })}
                  {visibleTrips.length === 0 && <div className="text-center py-8 text-xs text-gray-400">No trips yet. Create a one-time trip or generate them from your schedules.</div>}
                </>
              );
            })()}</div>
          </div>
        )}

        {/* Add Trip */}
        {tab === 'addTrip' && (
          <div className="bg-white rounded-xl border border-border p-6">
            <div className="max-w-4xl">
              <h3 className="font-semibold text-gray-900 text-sm mb-1 flex items-center gap-1.5"><IconPlus size={15} /> Schedule trip</h3>
              <p className="text-[11px] text-gray-400 mb-5">Create a one-time trip that should appear immediately in your active trip list and in public search for approved companies.</p>
            </div>
            <form onSubmit={handleAddTrip} className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_320px]">
              <div className="space-y-5">
                <div className="rounded-2xl border border-border p-4">
                  <h4 className="text-[12px] font-semibold text-gray-900 mb-3">Trip details</h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Select options={routeOpts} value={ntRoute} onChange={setNtRoute} label="Route" placeholder="Select route" required />
                    <Select options={busOpts} value={ntBus} onChange={setNtBus} label="Bus" placeholder="Select bus" required />
                    <DatePicker value={ntDate} onChange={setNtDate} min={today} label="Date" required />
                    <div />
                    <div><label htmlFor="trip-departure" className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Departure</label><input id="trip-departure" type="time" value={ntDep} onChange={e => setNtDep(e.target.value)} className={field} required title="Trip departure time" aria-label="Trip departure time" /></div>
                    <div><label htmlFor="trip-arrival" className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Arrival</label><input id="trip-arrival" type="time" value={ntArr} onChange={e => setNtArr(e.target.value)} className={field} required title="Trip arrival time" aria-label="Trip arrival time" /></div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border p-4">
                  <h4 className="text-[12px] font-semibold text-gray-900 mb-3">Selling rules</h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="trip-price" className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Price (RWF)</label>
                      <input id="trip-price" type="text" inputMode="numeric" value={ntPrice} onChange={e => setNtPrice(sanitizeRwfAmountInput(e.target.value))} placeholder="3500 or 3,500" className={field} required title="Trip price" aria-label="Trip price" />
                      <p className="text-[10px] text-gray-400 mt-1">Accepts whole RWF values like 3500 or 3,500.</p>
                    </div>
                    <div>
                      <label htmlFor="trip-online-seats" className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Online seats</label>
                      <input
                        id="trip-online-seats"
                        type="number"
                        min="1"
                        step="1"
                        value={ntOnlineSeats}
                        onChange={e => setNtOnlineSeats(e.target.value)}
                        placeholder="Seats available to book online"
                        className={field}
                        required
                        title="Online seats"
                        aria-label="Online seats"
                      />
                      <p className="text-[10px] text-gray-400 mt-1">
                        Physical capacity: {selectedTripBus?.totalSeats ?? '—'} seats total
                      </p>
                    </div>
                  </div>
                </div>

                <button type="submit" className="bg-primary-600 text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-primary-700 transition-all">Schedule trip</button>
              </div>

              <div className="rounded-2xl border border-border bg-surface-secondary/70 p-4 h-fit">
                <h4 className="text-[12px] font-semibold text-gray-900 mb-3">Trip summary</h4>
                <div className="space-y-2 text-[11px] text-gray-600">
                  <div><span className="font-semibold text-gray-900">Route:</span> {selectedTripRoute ? `${selectedTripRoute.origin} → ${selectedTripRoute.destination}` : 'Select a route'}</div>
                  <div><span className="font-semibold text-gray-900">Duration:</span> {selectedTripRoute?.duration || 'Select a route to view duration'}</div>
                  <div><span className="font-semibold text-gray-900">Bus:</span> {selectedTripBus ? `${selectedTripBus.name} (${selectedTripBus.plateNumber})` : 'Select a bus'}</div>
                  <div><span className="font-semibold text-gray-900">Capacity:</span> {ntOnlineSeats || '0'} online seats from {selectedTripBus?.totalSeats ?? '—'} total seats</div>
                  <div><span className="font-semibold text-gray-900">Travel date:</span> {ntDate || 'Choose a date'}</div>
                </div>
              </div>
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
                  type="button"
                  aria-label="Approve operator"
                  title="Approve operator"
                  onClick={async () => {
                    await updateDoc(doc(db, 'users', op.id), { operatorStatus: 'approved' });
                    flash('Operator approved');
                  }}
                  className="w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center"
                >
                  <span className="sr-only">Approve operator</span>
                  <IconCheck size={14} />
                </button>
                <button 
                  type="button"
                  aria-label="Reject operator"
                  title="Reject operator"
                  onClick={async () => {
                    await updateDoc(doc(db, 'users', op.id), { operatorStatus: 'rejected' });
                    flash('Operator rejected');
                  }}
                  className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center"
                >
                  <span className="sr-only">Reject operator</span>
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
