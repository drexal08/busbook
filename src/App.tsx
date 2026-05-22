import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import ScanPage from './pages/ScanPage';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import SearchResultsPage from './pages/SearchResultsPage';
import BookingPage from './pages/BookingPage';
import TicketPage from './pages/TicketPage';
import PassengerDashboard from './pages/PassengerDashboard';
import CompanyDashboard from './pages/CompanyDashboard';
import OperatorDashboard from './pages/OperatorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { IconHome } from './components/Icons';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <DataProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-surface-secondary">
            <Navbar />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/search" element={<SearchResultsPage />} />
              <Route path="/book/:tripId" element={<BookingPage />} />
              <Route path="/ticket/:bookingId" element={<TicketPage />} />
              <Route path="/dashboard" element={<PassengerDashboard />} />
              <Route path="/company" element={<CompanyDashboard />} />
              <Route path="/operator" element={<OperatorDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/scan" element={<ScanPage />} />
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
          </div>
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  );
};

export default App;
