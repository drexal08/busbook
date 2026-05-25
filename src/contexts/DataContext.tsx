import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Company, Trip, Booking, Route, Bus } from '../types';
import {
  fetchCompanies, fetchRoutes, fetchBuses, fetchTrips,
  createCompany as fbCreateCompany,
  createCompanyWithId,
  createRoute as fbCreateRoute,
  createBus as fbCreateBus,
  createTrip as fbCreateTrip,
  updateCompanyStatus,
  decrementTripSeat,
  fetchCompanyBookings
} from '../lib/firestore';
import { createBooking as fbCreateBooking, validateBooking as fbValidateBooking } from '../lib/bookings';
// FIX 1: Added 'collection' to the firebase/firestore imports
import { onSnapshot, collection } from 'firebase/firestore'; 
// FIX 2: Imported your Firestore instance 'db'
import { db } from '../lib/firebase'; 

interface DataContextType {
  companies: Company[];
  trips: Trip[];
  bookings: Booking[];
  routes: Route[];
  buses: Bus[];
  loading: boolean;
  refreshCompanyData: (companyId: string) => Promise<void>;
  searchTrips: (origin: string, destination: string, date: string) => Trip[];
  createBooking: (booking: Omit<Booking, 'id' | 'createdAt'>) => Promise<Booking>;
  cancelBooking: (bookingId: string) => void;
  approveCompany: (companyId: string) => Promise<void>;
  rejectCompany: (companyId: string) => Promise<void>;
  addCompany: (company: Omit<Company, 'id' | 'createdAt'>) => Promise<string>;
  addCompanyWithId: (company: Company) => Promise<void>;
  addRoute: (route: Omit<Route, 'id'>) => Promise<void>;
  addBus: (bus: Omit<Bus, 'id'>) => Promise<void>;
  addTrip: (trip: Omit<Trip, 'id' | 'bookedSeats' | 'availableSeats'>) => Promise<Trip>;
  validateTicket: (qrCode: string) => Promise<{ valid: boolean; booking?: Booking; error?: string }>;
  getPassengerBookings: (passengerId: string) => Booking[];
  getCompanyTrips: (companyId: string) => Trip[];
  getCompanyBookings: (companyId: string) => Booking[];
  getCompanyRoutes: (companyId: string) => Route[];
  getCompanyBuses: (companyId: string) => Bus[];
  getCompanyName: (companyId: string) => string;
  getRouteInfo: (routeId: string) => Route | undefined;
  getBusInfo: (busId: string) => Bus | undefined;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);

  // Real-time bookings listener
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'bookings'), (snapshot) => {
      const updated = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      setBookings(updated);
    });
    
    return () => unsubscribe();
  }, []);

  // Initial load
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [c, r, b, t] = await Promise.all([
          fetchCompanies(),
          fetchRoutes(),
          fetchBuses(),
          fetchTrips()
        ]);
        setCompanies(c);
        setRoutes(r);
        setBuses(b);
        setTrips(t);
      } catch (e) {
        console.error('DataContext load error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const refreshCompanyData = useCallback(async (companyId: string) => {
    const [r, b, t, bk] = await Promise.all([
      fetchRoutes(companyId),
      fetchBuses(companyId),
      fetchTrips({ companyId }),
      fetchCompanyBookings(companyId)
    ]);
    setRoutes(prev => [...prev.filter(x => x.companyId !== companyId), ...r]);
    setBuses(prev => [...prev.filter(x => x.companyId !== companyId), ...b]);
    setTrips(prev => [...prev.filter(x => x.companyId !== companyId), ...t]);
    setBookings(prev => [...prev.filter(x => x.companyId !== companyId), ...bk]);
  }, []);

  const searchTrips = useCallback((origin: string, destination: string, date: string) => {
    return trips.filter(trip => {
      const route = routes.find(r => r.id === trip.routeId);
      if (!route) return false;
      const matchRoute =
        route.origin.toLowerCase().includes(origin.toLowerCase()) &&
        route.destination.toLowerCase().includes(destination.toLowerCase());
      const matchDate = trip.date === date;
      const isApproved = companies.find(c => c.id === trip.companyId)?.status === 'approved';
      const hasSeats = trip.availableSeats > 0;
      return matchRoute && matchDate && isApproved && trip.status === 'scheduled' && hasSeats;
    });
  }, [trips, routes, companies]);

  const createBooking = useCallback(async (bookingData: Omit<Booking, 'id' | 'createdAt'>) => {
    const bookingId = await fbCreateBooking(bookingData);
    await decrementTripSeat(bookingData.tripId, bookingData.seatNumber);
    const booking: Booking = {
      ...bookingData,
      id: bookingId,
      qrCode: bookingId,
      createdAt: new Date().toISOString()
    };
    setBookings(prev => [...prev, booking]);
    setTrips(prev => prev.map(t => {
      if (t.id === booking.tripId) {
        const newBooked = [...t.bookedSeats, booking.seatNumber];
        return {
          ...t,
          bookedSeats: newBooked,
          availableSeats: t.onlineSeats - newBooked.length
        };
      }
      return t;
    }));
    return booking;
  }, []);

  const cancelBooking = useCallback((bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;
    setBookings(prev => prev.map(b =>
      b.id === bookingId ? { ...b, status: 'cancelled' as const } : b
    ));
    setTrips(prev => prev.map(t => {
      if (t.id === booking.tripId) {
        const newBooked = t.bookedSeats.filter(s => s !== booking.seatNumber);
        return { ...t, bookedSeats: newBooked, availableSeats: t.onlineSeats - newBooked.length };
      }
      return t;
    }));
  }, [bookings]);

  const approveCompany = useCallback(async (companyId: string) => {
    await updateCompanyStatus(companyId, 'approved');
    setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, status: 'approved' } : c));
  }, []);

  const rejectCompany = useCallback(async (companyId: string) => {
    await updateCompanyStatus(companyId, 'rejected');
    setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, status: 'rejected' } : c));
  }, []);

  const addCompany = useCallback(async (company: Omit<Company, 'id' | 'createdAt'>) => {
    const id = await fbCreateCompany({ ...company, createdAt: new Date().toISOString().split('T')[0] });
    const newCompany = { ...company, id, createdAt: new Date().toISOString().split('T')[0] };
    setCompanies(prev => [...prev, newCompany]);
    return id;
  }, []);

  const addCompanyWithId = useCallback(async (company: Company) => {
    await createCompanyWithId(company);
    setCompanies(prev => [...prev, company]);
  }, []);

  const addRoute = useCallback(async (route: Omit<Route, 'id'>) => {
    const id = await fbCreateRoute(route);
    setRoutes(prev => [...prev, { ...route, id }]);
  }, []);

  const addBus = useCallback(async (bus: Omit<Bus, 'id'>) => {
    const id = await fbCreateBus(bus);
    setBuses(prev => [...prev, { ...bus, id }]);
  }, []);

  const addTrip = useCallback(async (tripData: Omit<Trip, 'id' | 'bookedSeats' | 'availableSeats'>) => {
    const newTrip: Omit<Trip, 'id'> = {
      ...tripData,
      bookedSeats: [],
      availableSeats: tripData.onlineSeats,
    };
    const id = await fbCreateTrip(newTrip);
    const trip = { ...newTrip, id };
    setTrips(prev => [...prev, trip]);
    return trip;
  }, []);

  const validateTicket = useCallback(async (qrCode: string) => {
    const result = await fbValidateBooking(qrCode);
    return result as { valid: boolean; booking?: Booking; error?: string };
  }, []);

  const getPassengerBookings = useCallback((passengerId: string) =>
    bookings.filter(b => b.passengerId === passengerId), [bookings]);

  const getCompanyTrips = useCallback((companyId: string) =>
    trips.filter(t => t.companyId === companyId), [trips]);

  const getCompanyBookings = useCallback((companyId: string) =>
    bookings.filter(b => b.companyId === companyId), [bookings]);

  const getCompanyRoutes = useCallback((companyId: string) =>
    routes.filter(r => r.companyId === companyId), [routes]);

  const getCompanyBuses = useCallback((companyId: string) =>
    buses.filter(b => b.companyId === companyId), [buses]);

  const getCompanyName = useCallback((companyId: string) =>
    companies.find(c => c.id === companyId)?.name || 'Unknown', [companies]);

  const getRouteInfo = useCallback((routeId: string) =>
    routes.find(r => r.id === routeId), [routes]);

  const getBusInfo = useCallback((busId: string) =>
    buses.find(b => b.id === busId), [buses]);

  return (
    <DataContext.Provider value={{
      companies, trips, bookings, routes, buses, loading,
      refreshCompanyData,
      searchTrips, createBooking, cancelBooking,
      approveCompany, rejectCompany, addCompany, addCompanyWithId,
      addRoute, addBus, addTrip, validateTicket,
      getPassengerBookings, getCompanyTrips, getCompanyBookings,
      getCompanyRoutes, getCompanyBuses,
      getCompanyName, getRouteInfo, getBusInfo
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};