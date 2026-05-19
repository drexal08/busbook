import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { IconSearch, IconHome, IconLogout, IconMenu, IconX, IconShield, IconBuilding, IconScan, IconGrid } from './Icons';
import { LogoFull } from './Logo';

const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate('/');
  };

  const getDashboardPath = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'admin': return '/admin';
      case 'company': return '/company';
      case 'operator': return '/operator';
      default: return '/dashboard';
    }
  };

  const getDashboardIcon = () => {
    if (!user) return <IconGrid size={18} />;
    switch (user.role) {
      case 'admin': return <IconShield size={18} />;
      case 'company': return <IconBuilding size={18} />;
      case 'operator': return <IconScan size={18} />;
      default: return <IconGrid size={18} />;
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const navLink = (to: string, label: string, icon: React.ReactNode) => (
    <Link
      to={to}
      onClick={() => setMobileOpen(false)}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-all
        ${isActive(to)
          ? 'text-primary-600 bg-primary-50'
          : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
        }`}
    >
      {icon}
      {label}
    </Link>
  );

  const roleBadge: Record<string, { label: string; color: string }> = {
    passenger: { label: 'Passenger', color: 'bg-blue-50 text-blue-600' },
    company: { label: 'Company', color: 'bg-emerald-50 text-emerald-600' },
    operator: { label: 'Operator', color: 'bg-violet-50 text-violet-600' },
    admin: { label: 'Admin', color: 'bg-rose-50 text-rose-600' },
  };

  return (
    <nav className="bg-white border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-[60px]">
          {/* Logo */}
          <Link to="/" onClick={() => setMobileOpen(false)} className="group">
            <LogoFull size="md" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLink('/', 'Home', <IconHome size={18} />)}
            {navLink('/search', 'Search', <IconSearch size={18} />)}
            {isAuthenticated && navLink(getDashboardPath(), 'Dashboard', getDashboardIcon())}
          </div>

          {/* Desktop Right */}
          <div className="hidden md:flex items-center gap-2.5">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-2.5 border border-border rounded-full pl-1 pr-3 py-1">
                  <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-600 text-xs font-bold">{user?.name.charAt(0)}</span>
                  </div>
                  <div className="flex flex-col leading-none">
                    <span className="text-xs font-semibold text-gray-800">{user?.name?.split(' ')[0]}</span>
                    <span className={`text-[9px] font-semibold mt-0.5 px-1.5 py-px rounded-full w-fit ${roleBadge[user?.role || 'passenger'].color}`}>
                      {roleBadge[user?.role || 'passenger'].label}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
                  title="Logout"
                >
                  <IconLogout size={18} />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-[13px] font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="text-[13px] font-semibold text-white bg-primary-600 hover:bg-primary-700 px-4 py-2 rounded-lg transition-all shadow-sm hover:shadow"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-50"
          >
            {mobileOpen ? <IconX size={20} /> : <IconMenu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-white fade-in">
          <div className="px-4 py-3 space-y-1">
            {navLink('/', 'Home', <IconHome size={18} />)}
            {navLink('/search', 'Search Routes', <IconSearch size={18} />)}
            {isAuthenticated && navLink(getDashboardPath(), 'Dashboard', getDashboardIcon())}
            <hr className="my-2 border-border" />
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-2.5 px-3 py-2">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-600 text-sm font-bold">{user?.name.charAt(0)}</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{user?.name}</div>
                    <div className="text-xs text-gray-400">{user?.email}</div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[13px] font-medium text-red-500 hover:bg-red-50 transition-all"
                >
                  <IconLogout size={18} /> Log out
                </button>
              </>
            ) : (
              <div className="flex gap-2 pt-1">
                <Link to="/login" onClick={() => setMobileOpen(false)} className="flex-1 text-center text-[13px] font-medium text-gray-700 border border-border py-2 rounded-lg hover:bg-gray-50">Log in</Link>
                <Link to="/signup" onClick={() => setMobileOpen(false)} className="flex-1 text-center text-[13px] font-semibold text-white bg-primary-600 py-2 rounded-lg hover:bg-primary-700">Sign up</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
