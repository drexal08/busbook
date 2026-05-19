import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { cities } from '../data/mockData';
import { IconSearch, IconRoute, IconSeat, IconPhone, IconQr, IconArrowRight, IconSwap, IconMapPin, IconClock, IconShield, IconBus, IconMail } from '../components/Icons';
import { LogoFull } from '../components/Logo';
import Select from '../components/Select';
import DatePicker from '../components/DatePicker';
import { ImigongoBackground, ImigongoDivider, ImigongoBar, ImigongoMotif } from '../components/Imigongo';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState(today);

  const cityOptions = useMemo(() => cities.map(c => ({ value: c, label: c })), []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (origin && destination && date) {
      navigate(`/search?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&date=${date}`);
    }
  };

  const swapCities = () => { setOrigin(destination); setDestination(origin); };

  const popularRoutes = [
    { from: 'Kigali', to: 'Huye (Butare)', price: '3,500', duration: '2h 30m' },
    { from: 'Kigali', to: 'Musanze (Ruhengeri)', price: '3,000', duration: '2h 15m' },
    { from: 'Kigali', to: 'Rubavu (Gisenyi)', price: '4,000', duration: '3h' },
    { from: 'Kigali', to: 'Rusizi (Cyangugu)', price: '5,500', duration: '4h 30m' },
    { from: 'Kigali', to: 'Karongi (Kibuye)', price: '4,500', duration: '3h 30m' },
    { from: 'Kigali', to: 'Rwamagana', price: '1,500', duration: '1h' },
  ];

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden bg-white">
        {/* Imigongo nested-diamond background — very subtle cultural texture */}
        <ImigongoBackground opacity={0.025} />

        {/* Soft radial glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[480px] h-[480px] rounded-full bg-primary-100/40" />
          <div className="absolute -bottom-48 -left-32 w-[380px] h-[380px] rounded-full bg-primary-50/50" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-20 sm:pb-28">
          <div className="text-center mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-2.5 bg-primary-50/80 backdrop-blur-sm border border-primary-100 rounded-full px-4 py-1.5 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
              <span className="text-[11px] font-bold text-primary-700 tracking-wide uppercase">Rwanda's Bus Booking Platform</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold text-gray-900 leading-[1.08] tracking-tight mb-5">
              Travel across Rwanda<br />
              <span className="text-primary-700">with confidence</span>
            </h1>
            <p className="text-gray-500 text-[15px] sm:text-base max-w-lg mx-auto leading-relaxed">
              Search routes, select your seat, pay with mobile money, and receive your QR ticket instantly.
            </p>
          </div>

          {/* Search */}
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-border shadow-[0_8px_40px_rgba(0,0,0,0.06)] p-5 sm:p-7 relative">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 relative">
                <Select options={cityOptions} value={origin} onChange={setOrigin} label="From" placeholder="Select origin city" searchable required />
                <Select options={cityOptions} value={destination} onChange={setDestination} label="To" placeholder="Select destination" searchable required />
                <button type="button" onClick={swapCities}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 translate-y-1 w-9 h-9 bg-white border border-border rounded-full shadow-sm hover:shadow hover:border-primary-300 transition-all z-10 hidden sm:flex items-center justify-center text-gray-400 hover:text-primary-600">
                  <IconSwap size={14} />
                </button>
              </div>
              <div className="mb-4">
                <DatePicker value={date} onChange={setDate} min={today} label="Travel date" required />
              </div>
              <button type="submit"
                className="w-full bg-primary-700 hover:bg-primary-800 text-white font-semibold py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-primary-200 active:scale-[0.99] flex items-center justify-center gap-2 text-[14px]">
                <IconSearch size={18} /> Search available trips
              </button>
            </form>
          </div>
        </div>

        {/* Imigongo divider between hero and next section */}
        <ImigongoDivider color="#1c3f94" opacity={0.06} />
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-3">
              <ImigongoMotif size={20} className="text-primary-600" />
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">How it works</h2>
              <ImigongoMotif size={20} className="text-primary-600" />
            </div>
            <p className="text-gray-400 mt-1 text-sm">Book your bus ticket in four simple steps</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {[
              { icon: <IconRoute size={22} />, title: 'Search route', desc: 'Pick your origin, destination, and travel date' },
              { icon: <IconSeat size={22} />, title: 'Select seat', desc: 'Choose your preferred seat from the bus layout' },
              { icon: <IconPhone size={22} />, title: 'Pay via MoMo', desc: 'Complete payment with MTN Mobile Money' },
              { icon: <IconQr size={22} />, title: 'Get QR ticket', desc: 'Receive your scannable e-ticket instantly' },
            ].map((step, i) => (
              <div key={i} className="bg-white rounded-2xl border border-border p-5 sm:p-6 relative group hover:border-primary-200 hover:shadow-sm transition-all">
                <div className="absolute top-4 right-4 text-[11px] font-extrabold text-gray-200/80">{String(i + 1).padStart(2, '0')}</div>
                <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center mb-4">{step.icon}</div>
                <h3 className="font-bold text-gray-900 text-[13px] mb-1">{step.title}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ POPULAR ROUTES ═══ */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Popular routes</h2>
              <p className="text-gray-400 mt-1 text-sm">Most booked destinations in Rwanda</p>
            </div>
            <button onClick={() => navigate('/search')} className="hidden sm:flex items-center gap-1.5 text-[13px] font-bold text-primary-700 hover:text-primary-800">
              View all <IconArrowRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {popularRoutes.map((r, i) => (
              <button key={i} onClick={() => navigate(`/search?origin=${encodeURIComponent(r.from)}&destination=${encodeURIComponent(r.to)}&date=${date}`)}
                className="flex items-center gap-4 bg-surface-secondary hover:bg-primary-50 border border-border-light hover:border-primary-200 rounded-xl p-4 text-left transition-all group">
                <div className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center text-primary-600 group-hover:bg-primary-100 group-hover:border-primary-200 transition-all shrink-0">
                  <IconBus size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-[13px] font-bold text-gray-800">
                    <span>{r.from}</span> <IconArrowRight size={12} className="text-gray-300" /> <span className="truncate">{r.to}</span>
                  </div>
                  <span className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5"><IconClock size={11} />{r.duration}</span>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-extrabold text-primary-700">{r.price}</div>
                  <div className="text-[10px] text-gray-400 font-medium">RWF</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section className="relative py-14 bg-primary-800 overflow-hidden">
        {/* Subtle Imigongo texture on the stats bar */}
        <ImigongoBackground color="#ffffff" opacity={0.015} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {[
              { value: '50+', label: 'Daily trips' },
              { value: '11', label: 'Destinations' },
              { value: '5,000+', label: 'Travelers' },
              { value: '99%', label: 'On-time rate' },
            ].map((s, i) => (
              <div key={i}>
                <div className="text-2xl sm:text-3xl font-extrabold text-white">{s.value}</div>
                <div className="text-primary-300 text-xs font-medium mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WHY BUSBOOK ═══ */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Why BusBook?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: <IconShield size={22} />, title: 'Secure payments', desc: 'Transactions processed securely via MTN MoMo with instant confirmation.' },
              { icon: <IconQr size={22} />, title: 'QR e-tickets', desc: 'No paper needed. Show your QR code to the operator at boarding.' },
              { icon: <IconClock size={22} />, title: 'Real-time updates', desc: 'Live seat availability and instant booking confirmation for every trip.' },
            ].map((f, i) => (
              <div key={i} className="text-center p-6">
                <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-700 flex items-center justify-center mx-auto mb-4">{f.icon}</div>
                <h3 className="font-bold text-gray-900 text-sm mb-2">{f.title}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <ImigongoBar className="bg-gray-900" color="#ffffff" height={5} />
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            <div>
              <div className="mb-4"><LogoFull size="sm" variant="white" /></div>
              <p className="text-xs leading-relaxed text-gray-500">Rwanda's leading bus booking platform. Travel smart, travel safe.</p>
            </div>
            <div>
              <h4 className="text-white text-[11px] font-bold uppercase tracking-wider mb-3">Quick Links</h4>
              <div className="flex flex-col gap-2 text-xs">
                <Link to="/search" className="hover:text-white transition-colors">Search Routes</Link>
                <Link to="/signup" className="hover:text-white transition-colors">Register Company</Link>
                <Link to="/login" className="hover:text-white transition-colors">Login</Link>
              </div>
            </div>
            <div>
              <h4 className="text-white text-[11px] font-bold uppercase tracking-wider mb-3">Contact</h4>
              <div className="flex flex-col gap-2 text-xs">
                <span className="flex items-center gap-2"><IconMapPin size={13} /> Kigali, Rwanda</span>
                <span className="flex items-center gap-2"><IconPhone size={13} /> +250 788 000 001</span>
                <span className="flex items-center gap-2"><IconMail size={13} /> info@busbook.rw</span>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-center text-[11px] text-gray-600">
            © {new Date().getFullYear()} BusBook Rwanda. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
