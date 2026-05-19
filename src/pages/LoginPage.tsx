import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { IconMail, IconLock, IconUser, IconBuilding, IconScan, IconShield } from '../components/Icons';
import { LogoMark } from '../components/Logo';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = login(email, password);
    if (result.success) navigate('/');
    else setError(result.error || 'Login failed');
  };

  const demoLogins = [
    { label: 'Passenger', email: 'jean@example.com', password: 'pass123', icon: <IconUser size={14} />, color: 'text-primary-600 bg-primary-50 border-primary-100 hover:bg-primary-100' },
    { label: 'Company', email: 'info@rwandaexpress.rw', password: 'company123', icon: <IconBuilding size={14} />, color: 'text-emerald-600 bg-emerald-50 border-emerald-100 hover:bg-emerald-100' },
    { label: 'Operator', email: 'emmanuel@rwandaexpress.rw', password: 'oper123', icon: <IconScan size={14} />, color: 'text-violet-600 bg-violet-50 border-violet-100 hover:bg-violet-100' },
    { label: 'Admin', email: 'admin@busbook.rw', password: 'admin123', icon: <IconShield size={14} />, color: 'text-rose-600 bg-rose-50 border-rose-100 hover:bg-rose-100' },
  ];

  return (
    <div className="min-h-[calc(100vh-60px)] bg-surface-secondary flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-[400px] slide-up">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-fit">
            <LogoMark size={48} />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-400 mt-1 text-sm">Log in to your BusBook account</p>
        </div>

        <div className="bg-white rounded-2xl border border-border shadow-sm p-6 sm:p-7">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-2.5 rounded-xl mb-4 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Email</label>
              <div className="relative">
                <IconMail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full bg-surface-secondary border border-border-light rounded-xl pl-10 pr-4 py-3 text-[13px] text-gray-800 font-medium focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all" placeholder="you@email.com" required />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Password</label>
              <div className="relative">
                <IconLock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full bg-surface-secondary border border-border-light rounded-xl pl-10 pr-4 py-3 text-[13px] text-gray-800 font-medium focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all" placeholder="Enter password" required />
              </div>
            </div>
            <button type="submit"
              className="w-full bg-primary-700 hover:bg-primary-800 text-white font-bold py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-primary-200 active:scale-[0.99] text-[13px]">
              Log in
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-gray-400 text-xs">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary-600 font-semibold hover:underline">Sign up</Link>
            </p>
          </div>
        </div>

        <div className="mt-5 bg-white rounded-2xl border border-border shadow-sm p-5">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3 text-center">Quick demo login</p>
          <div className="grid grid-cols-2 gap-2">
            {demoLogins.map(d => (
              <button key={d.label} onClick={() => { setEmail(d.email); setPassword(d.password); }}
                className={`flex items-center gap-2 text-xs font-semibold py-2.5 px-3 rounded-xl border transition-all ${d.color}`}>
                {d.icon} {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
