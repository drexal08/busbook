import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import Navbar from './components/Navbar';
import { IconHome } from './components/Icons';
import { isFirebaseConfigured } from './lib/firebase';
import ProtectedRoute from './components/ProtectedRoute';

const HomePage = React.lazy(() => import('./pages/HomePage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const SignupPage = React.lazy(() => import('./pages/SignupPage'));
const ForgotPasswordPage = React.lazy(() => import('./pages/ForgotPasswordPage'));
const SearchResultsPage = React.lazy(() => import('./pages/SearchResultsPage'));
const BookingPage = React.lazy(() => import('./pages/BookingPage'));
const TicketPage = React.lazy(() => import('./pages/TicketPage'));
const PassengerDashboard = React.lazy(() => import('./pages/PassengerDashboard'));
const CompanyDashboard = React.lazy(() => import('./pages/CompanyDashboard'));
const OperatorDashboard = React.lazy(() => import('./pages/OperatorDashboard'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const StatusPage = React.lazy(() => import('./pages/StatusPage'));
const ScanPage = React.lazy(() => import('./pages/ScanPage'));

const App: React.FC = () => {
  if (!isFirebaseConfigured) {
    return (
      <div className="min-h-screen bg-surface-secondary flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border border-border rounded-2xl p-6 text-center shadow-sm">
          <h1 className="text-lg font-bold text-gray-900 mb-2">Firebase setup required</h1>
          <p className="text-sm text-gray-500">
            Add the required `VITE_FIREBASE_*` values from `.env.example` before running or deploying BusBook.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <DataProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-surface-secondary">
            <Navbar />
            <React.Suspense
              fallback={
                <div className="min-h-[calc(100vh-60px)] bg-surface-secondary flex items-center justify-center">
                  <div className="w-8 h-8 border-[3px] border-primary-600 border-t-transparent rounded-full animate-spin" />
                </div>
              }
            >
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/search" element={<SearchResultsPage />} />
                <Route path="/book/:tripId" element={<BookingPage />} />
                <Route
                  path="/ticket/:bookingId"
                  element={
                    <ProtectedRoute allowedRoles={['passenger']} redirectTo="/dashboard">
                      <TicketPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['passenger']} redirectTo="/">
                      <PassengerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute redirectTo="/">
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/company"
                  element={
                    <ProtectedRoute allowedRoles={['company']} redirectTo="/">
                      <CompanyDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/operator"
                  element={
                    <ProtectedRoute allowedRoles={['operator']} redirectTo="/">
                      <OperatorDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['admin']} redirectTo="/">
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/status"
                  element={
                    <ProtectedRoute allowedRoles={['admin']} redirectTo="/">
                      <StatusPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/scan"
                  element={
                    <ProtectedRoute allowedRoles={['operator', 'admin']} redirectTo="/">
                      <ScanPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={
                  <div className="min-h-[calc(100vh-60px)] bg-surface-secondary flex items-center justify-center">
                    <div className="text-center slide-up">
                      <div className="w-14 h-14 bg-surface-tertiary rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl text-gray-300">?</span>
                      </div>
                      <h3 className="text-base font-semibold text-gray-700 mb-1">Page not found</h3>
                      <p className="text-xs text-gray-400 mb-5">The page you're looking for doesn't exist</p>
                      <Link to="/" className="inline-flex items-center gap-1.5 bg-primary-600 text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-primary-700 transition-all">
                        <IconHome size={14} /> Back to home
                      </Link>
                    </div>
                  </div>
                } />
              </Routes>
            </React.Suspense>
          </div>
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  );
};

export default App;
