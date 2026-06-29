import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Company, Trip, Booking, Route, Bus, TripTemplate } from '../types';
import {
  fetchCompanies, fetchRoutes, fetchBuses, fetchTrips,
  createCompany as fbCreateCompany,
  createCompanyWithId,
  createRoute as fbCreateRoute,
  createBus as fbCreateBus,
  createTrip as fbCreateTrip,
  fetchTripTemplates as fbFetchTripTemplates,
  createTripTemplate as fbCreateTripTemplate,
  updateTripTemplate as fbUpdateTripTemplate,
  deleteTripTemplate as fbDeleteTripTemplate,
  cancelTrip as fbCancelTrip,
  updateCompanyStatus,
  decrementTripSeat,
  fetchCompanyBookings
} from '../lib/firestore';
import { createBooking as fbCreateBooking, validateBooking as fbValidateBooking } from '../lib/bookings';
// FIX 1: Added 'collection' to the firebase/firestore imports
import { onSnapshot, collection, query, where } from 'firebase/firestore'; 
// FIX 2: Imported your Firestore instance 'db'
import { db } from '../lib/firebase'; 
import { ensureUpcomingTripsFromTemplates } from '../lib/tripGeneration';
import { useAuth } from './AuthContext';

interface DataContextType {
  companies: Company[];
  trips: Trip[];
  bookings: Booking[];
  routes: Route[];
  buses: Bus[];
  tripTemplates: TripTemplate[];
  loading: boolean;
  refreshCompanyData: (companyId: string) => Promise<void>;
  searchTrips: (origin: string, destination: string, date: string) => Trip[];
  createBooking: (booking: Omit<Booking, 'id' | 'createdAt'>) => Promise<Booking>;
  cancelBooking: (bookingId: string) => void;
  cancelTrip: (tripId: string, reason?: string) => Promise<void>;
  approveCompany: (companyId: string) => Promise<void>;
  rejectCompany: (companyId: string) => Promise<void>;
  addCompany: (company: Omit<Company, 'id' | 'createdAt'>) => Promise<string>;
  addCompanyWithId: (company: Company) => Promise<void>;
  addRoute: (route: Omit<Route, 'id'>) => Promise<void>;
  addBus: (bus: Omit<Bus, 'id'>) => Promise<void>;
  addTrip: (trip: Omit<Trip, 'id' | 'bookedSeats' | 'availableSeats'>) => Promise<Trip>;
  addTripTemplate: (template: Omit<TripTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateTripTemplate: (
    templateId: string,
    data: Partial<Omit<TripTemplate, 'id' | 'companyId' | 'createdAt'>>
  ) => Promise<void>;
  deleteTripTemplate: (templateId: string) => Promise<void>;
  generateUpcomingTrips: (companyId: string) => Promise<{ created: number }>;
  validateTicket: (qrCode: string) => Promise<{ valid: boolean; booking?: Booking; error?: string }>;
  getPassengerBookings: (passengerId: string) => Booking[];
  getCompanyTrips: (companyId: string) => Trip[];
  getCompanyBookings: (companyId: string) => Booking[];
  getCompanyRoutes: (companyId: string) => Route[];
  getCompanyBuses: (companyId: string) => Bus[];
  getCompanyTripTemplates: (companyId: string) => TripTemplate[];
  getCompanyName: (companyId: string) => string;
  getRouteInfo: (routeId: string) => Route | undefined;
  getBusInfo: (busId: string) => Bus | undefined;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [tripTemplates, setTripTemplates] = useState<TripTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Real-time bookings listener scoped to the current role. The /scan demo page
  // uses its own direct lookup and is intentionally left unchanged.
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setBookings([]);
      return;
    }

    let bookingsQuery;
    if (user.role === 'admin') {
      bookingsQuery = collection(db, 'bookings');
    } else if ((user.role === 'company' || user.role === 'operator') && user.companyId) {
      bookingsQuery = query(collection(db, 'bookings'), where('companyId', '==', user.companyId));
    } else {
      bookingsQuery = query(collection(db, 'bookings'), where('passengerId', '==', user.id));
    }

    const unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
      const updated = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      setBookings(updated);
    });
    
    return () => unsubscribe();
  }, [authLoading, user]);

  // Initial load
  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      const [companiesResult, routesResult, busesResult, tripsResult] = await Promise.allSettled([
        fetchCompanies(),
        fetchRoutes(),
        fetchBuses(),
        fetchTrips(),
      ]);

      if (!active) {
        return;
      }

      if (companiesResult.status === 'fulfilled') {
        setCompanies(companiesResult.value);
      } else {
        console.error('Failed to load companies:', companiesResult.reason);
      }

      if (routesResult.status === 'fulfilled') {
        setRoutes(routesResult.value);
      } else {
        console.error('Failed to load routes:', routesResult.reason);
      }

      if (busesResult.status === 'fulfilled') {
        setBuses(busesResult.value);
      } else {
        console.error('Failed to load buses:', busesResult.reason);
      }

      if (tripsResult.status === 'fulfilled') {
        setTrips(tripsResult.value);
      } else {
        console.error('Failed to load trips:', tripsResult.reason);
      }

      if (active) {
        setLoading(false);
      }
    };

    load().catch((e) => {
      if (active) {
        console.error('DataContext load error:', e);
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (user?.role !== 'company' || !user.companyId) {
      setTripTemplates([]);
      return;
    }

    let active = true;

    const loadTripTemplates = async () => {
      try {
        const templates = await fbFetchTripTemplates(user.companyId);
        if (active) {
          setTripTemplates(templates);
        }
      } catch (e) {
        console.error('Failed to load trip templates:', e);
      }
    };

    loadTripTemplates();

    return () => {
      active = false;
    };
  }, [authLoading, user?.companyId, user?.role]);

  const refreshCompanyData = useCallback(async (companyId: string) => {
    const [r, b, t, bk, tt] = await Promise.all([
      fetchRoutes(companyId),
      fetchBuses(companyId),
      fetchTrips({ companyId }),
      fetchCompanyBookings(companyId),
      fbFetchTripTemplates(companyId)
    ]);
    setRoutes(prev => [...prev.filter(x => x.companyId !== companyId), ...r]);
    setBuses(prev => [...prev.filter(x => x.companyId !== companyId), ...b]);
    setTrips(prev => [...prev.filter(x => x.companyId !== companyId), ...t]);
    setBookings(prev => [...prev.filter(x => x.companyId !== companyId), ...bk]);
    setTripTemplates(prev => [...prev.filter(x => x.companyId !== companyId), ...tt]);
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
      source: 'manual',
    };
    const id = await fbCreateTrip(newTrip);
    const trip = { ...newTrip, id };
    setTrips(prev => [...prev, trip]);
    return trip;
  }, []);

  const cancelTrip = useCallback(async (tripId: string, reason?: string) => {
    await fbCancelTrip(tripId, reason);
    setTrips(prev => prev.map(t => t.id === tripId ? {
      ...t,
      status: 'cancelled',
      ...(reason ? { cancelReason: reason } : {}),
      cancelledAt: new Date().toISOString(),
    } : t));
  }, []);

  const addTripTemplate = useCallback(async (template: Omit<TripTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = await fbCreateTripTemplate(template);
    setTripTemplates(prev => [...prev, { ...template, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]);
    return id;
  }, []);

  const updateTripTemplate = useCallback(async (
    templateId: string,
    data: Partial<Omit<TripTemplate, 'id' | 'companyId' | 'createdAt'>>
  ) => {
    await fbUpdateTripTemplate(templateId, data);
    setTripTemplates(prev => prev.map(t => t.id === templateId ? { ...t, ...data, updatedAt: new Date().toISOString() } : t));
  }, []);

  const deleteTripTemplate = useCallback(async (templateId: string) => {
    await fbDeleteTripTemplate(templateId);
    setTripTemplates(prev => prev.filter(t => t.id !== templateId));
  }, []);

  const generateUpcomingTrips = useCallback(async (companyId: string) => {
    const templates = tripTemplates.filter(t => t.companyId === companyId && t.active);
    const result = await ensureUpcomingTripsFromTemplates(templates);
    if (result.created > 0) {
      const t = await fetchTrips({ companyId });
      setTrips(prev => [...prev.filter(x => x.companyId !== companyId), ...t]);
    }
    return result;
  }, [tripTemplates]);

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

  const getCompanyTripTemplates = useCallback((companyId: string) =>
    tripTemplates.filter(t => t.companyId === companyId), [tripTemplates]);

  const getCompanyName = useCallback((companyId: string) =>
    companies.find(c => c.id === companyId)?.name || 'Unknown', [companies]);

  const getRouteInfo = useCallback((routeId: string) =>
    routes.find(r => r.id === routeId), [routes]);

  const getBusInfo = useCallback((busId: string) =>
    buses.find(b => b.id === busId), [buses]);

  return (
    <DataContext.Provider value={{
      companies, trips, bookings, routes, buses, tripTemplates, loading,
      refreshCompanyData,
      searchTrips, createBooking, cancelBooking, cancelTrip,
      approveCompany, rejectCompany, addCompany, addCompanyWithId,
      addRoute, addBus, addTrip,
      addTripTemplate, updateTripTemplate, deleteTripTemplate, generateUpcomingTrips,
      validateTicket,
      getPassengerBookings, getCompanyTrips, getCompanyBookings,
      getCompanyRoutes, getCompanyBuses, getCompanyTripTemplates,
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
