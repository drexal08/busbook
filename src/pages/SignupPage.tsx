import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { UserRole } from '../types';
import { IconUser, IconBuilding, IconScan, IconCheckCircle } from '../components/Icons';
import { LogoMark } from '../components/Logo';

const SignupPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('passenger');
  const [companyName, setCompanyName] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { signup, updateUserCompanyId } = useAuth();
  const { addCompanyWithId } = useData();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (role === 'company' && !companyName.trim()) { setError('Company name is required'); return; }

    if (role === 'company') {
      const companyId = `comp-${Date.now()}`;
      const result = signup(name, email, password, phone, role, companyId);
      if (result.success && result.userId) {
        addCompanyWithId({ id: companyId, name: companyName, ownerId: result.userId, description: companyDescription || 'New bus company', status: 'pending', phone, email, createdAt: new Date().toISOString().split('T')[0] });
        updateUserCompanyId(result.userId, companyId);
        setSuccess('Registration submitted! Admin approval is required before you can operate.');
        setTimeout(() => navigate('/login'), 3000);
      } else setError(result.error || 'Registration failed');
      return;
    }

    const result = signup(name, email, password, phone, role);
    if (result.success) navigate('/');
    else setError(result.error || 'Signup failed');
  };

  const roles: { value: UserRole; label: string; desc: string; icon: React.ReactNode }[] = [
    { value: 'passenger', label: 'Passenger', desc: 'Book tickets', icon: <IconUser size={18} /> },
    { value: 'company', label: 'Company', desc: 'Manage fleet', icon: <IconBuilding size={18} /> },
    { value: 'operator', label: 'Operator', desc: 'Scan tickets', icon: <IconScan size={18} /> },
  ];

  const fieldClasses = "w-full bg-surface-secondary border border-border-light rounded-xl px-4 py-3 text-[13px] text-gray-800 font-medium focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all";

  return (
    <div className="min-h-[calc(100vh-60px)] bg-surface-secondary flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-[420px] slide-up">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-fit">
            <LogoMark size={48} />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Create account</h1>
          <p className="text-gray-400 mt-1 text-sm">Join BusBook Rwanda today</p>
        </div>

        <div className="bg-white rounded-2xl border border-border shadow-sm p-6 sm:p-7">
          {error && <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-2.5 rounded-xl mb-4 text-xs font-medium">{error}</div>}
          {success && <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-4 py-2.5 rounded-xl mb-4 text-xs font-medium flex items-center gap-2"><IconCheckCircle size={16} /> {success}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block">I am a</label>
              <div className="grid grid-cols-3 gap-2">
                {roles.map(r => (
                  <button key={r.value} type="button" onClick={() => setRole(r.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${role === r.value ? 'border-primary-500 bg-primary-50 text-primary-600' : 'border-border-light text-gray-400 hover:border-gray-300'}`}>
                    {r.icon}
                    <span className="text-[11px] font-semibold">{r.label}</span>
                    <span className="text-[9px] text-gray-400">{r.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {role === 'company' && (
              <>
                <div>
                  <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Company Name</label>
                  <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g., Safari Express Ltd." className={fieldClasses} required />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Description</label>
                  <textarea value={companyDescription} onChange={e => setCompanyDescription(e.target.value)} placeholder="Brief description…" rows={2} className={fieldClasses + " resize-none"} />
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-[11px] text-amber-700 font-medium">
                  Company registrations require admin approval before activation.
                </div>
              </>
            )}

            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">{role === 'company' ? 'Owner name' : 'Full name'}</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full name" className={fieldClasses} required />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" className={fieldClasses} required />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Phone</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+250 788 000 000" className={fieldClasses} required />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" className={fieldClasses} required />
            </div>
            <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-primary-200 active:scale-[0.99] text-[13px]">
              {role === 'company' ? 'Submit registration' : 'Create account'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-gray-400 text-xs">Already have an account? <Link to="/login" className="text-primary-600 font-semibold hover:underline">Log in</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
