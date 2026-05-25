import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { IconMail, IconLock } from '../components/Icons';
import { LogoMark } from '../components/Logo';
import { loginWithGoogle } from '../lib/auth';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  const result = await login(email, password);
  if (result.success) navigate('/');
  else setError(result.error || 'Login failed');
};

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
            <button type="button" onClick={async () => {
  try {
    await loginWithGoogle();
    navigate('/');
  } catch (e: any) {
    setError(e.message || 'Google login failed');
  }
}} className="w-full border border-border text-gray-700 font-semibold py-3 rounded-xl text-[13px] flex items-center justify-center gap-2 hover:bg-gray-50 transition-all">
  <img src="https://www.google.com/favicon.ico" className="w-4 h-4" /> Continue with Google
</button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-gray-400 text-xs">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary-600 font-semibold hover:underline">Sign up</Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
