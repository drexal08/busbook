import React, { createContext, useContext, useState, useCallback } from 'react';
import { Company, Trip, Booking, Route, Bus } from '../types';
import { mockCompanies, mockTrips, mockBookings, mockRoutes, mockBuses } from '../data/mockData';
import { createBooking as fbCreateBooking } from '../lib/bookings';
interface DataContextType {
  companies: Company[];
  trips: Trip[];
  bookings: Booking[];
  routes: Route[];
  buses: Bus[];
  searchTrips: (origin: string, destination: string, date: string) => Trip[];
  createBooking: (booking: Omit<Booking, 'id' | 'createdAt'>) => Promise<Booking>;
  cancelBooking: (bookingId: string) => void;
  approveCompany: (companyId: string) => void;
  rejectCompany: (companyId: string) => void;
  addCompany: (company: Omit<Company, 'id' | 'createdAt'>) => void;
  addCompanyWithId: (company: Company) => void;
  addRoute: (route: Omit<Route, 'id'>) => void;
  addBus: (bus: Omit<Bus, 'id'>) => void;
  addTrip: (trip: Omit<Trip, 'id' | 'bookedSeats' | 'availableSeats'>) => Trip;
  validateTicket: (qrCode: string) => { valid: boolean; booking?: Booking; error?: string };
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
  const [companies, setCompanies] = useState<Company[]>(mockCompanies);
  const [trips, setTrips] = useState<Trip[]>(mockTrips);
  const [bookings, setBookings] = useState<Booking[]>(mockBookings);
  const [routes, setRoutes] = useState<Route[]>(mockRoutes);
  const [buses, setBuses] = useState<Bus[]>(mockBuses);

  const searchTrips = useCallback((origin: string, destination: string, date: string) => {
    return trips.filter(trip => {
      const route = routes.find(r => r.id === trip.routeId);
      if (!route) return false;
      const matchRoute = route.origin.toLowerCase().includes(origin.toLowerCase()) &&
        route.destination.toLowerCase().includes(destination.toLowerCase());
      const matchDate = trip.date === date;
      const isApproved = companies.find(c => c.id === trip.companyId)?.status === 'approved';
      return matchRoute && matchDate && isApproved && trip.status === 'scheduled';
    });
  }, [trips, routes, companies]);


const createBooking = useCallback(async (bookingData: Omit<Booking, 'id' | 'createdAt'>) => {
  const bookingId = await fbCreateBooking(bookingData);
  const booking: Booking = {
    ...bookingData,
    id: bookingId,
    qrCode: bookingId,
    createdAt: new Date().toISOString()
  };
  setBookings(prev => [...prev, booking]);
  setTrips(prev => prev.map(t => {
    if (t.id === booking.tripId) {
      return {
        ...t,
        bookedSeats: [...t.bookedSeats, booking.seatNumber],
        availableSeats: t.availableSeats - 1
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
        return {
          ...t,
          bookedSeats: t.bookedSeats.filter(s => s !== booking.seatNumber),
          availableSeats: t.availableSeats + 1
        };
      }
      return t;
    }));
  }, [bookings]);

  const approveCompany = useCallback((companyId: string) => {
    setCompanies(prev => prev.map(c => 
      c.id === companyId ? { ...c, status: 'approved' as const } : c
    ));
  }, []);

  const rejectCompany = useCallback((companyId: string) => {
    setCompanies(prev => prev.map(c => 
      c.id === companyId ? { ...c, status: 'rejected' as const } : c
    ));
  }, []);

  const addCompany = useCallback((company: Omit<Company, 'id' | 'createdAt'>) => {
    const newCompany: Company = {
      ...company,
      id: `comp-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setCompanies(prev => [...prev, newCompany]);
  }, []);

  const addCompanyWithId = useCallback((company: Company) => {
    setCompanies(prev => [...prev, company]);
  }, []);

  const addRoute = useCallback((route: Omit<Route, 'id'>) => {
    const newRoute: Route = {
      ...route,
      id: `route-${Date.now()}`
    };
    setRoutes(prev => [...prev, newRoute]);
  }, []);

  const addBus = useCallback((bus: Omit<Bus, 'id'>) => {
    const newBus: Bus = {
      ...bus,
      id: `bus-${Date.now()}`
    };
    setBuses(prev => [...prev, newBus]);
  }, []);

  const addTrip = useCallback((tripData: Omit<Trip, 'id' | 'bookedSeats' | 'availableSeats'>) => {
    const bus = buses.find(b => b.id === tripData.busId);
    const totalSeats = bus?.totalSeats || 49;
    const newTrip: Trip = {
      ...tripData,
      id: `trip-${Date.now()}`,
      bookedSeats: [],
      availableSeats: totalSeats,
      totalSeats
    };
    setTrips(prev => [...prev, newTrip]);
    return newTrip;
  }, [buses]);

  const validateTicket = useCallback((qrCode: string) => {
    const booking = bookings.find(b => b.qrCode === qrCode);
    if (!booking) return { valid: false, error: 'Ticket not found' };
    if (booking.status === 'cancelled') return { valid: false, error: 'Ticket has been cancelled', booking };
    if (booking.status === 'used') return { valid: false, error: 'Ticket already used', booking };
    
    setBookings(prev => prev.map(b => 
      b.id === booking.id ? { ...b, status: 'used' as const } : b
    ));
    
    return { valid: true, booking: { ...booking, status: 'used' as const } };
  }, [bookings]);

  const getPassengerBookings = useCallback((passengerId: string) => {
    return bookings.filter(b => b.passengerId === passengerId);
  }, [bookings]);

  const getCompanyTrips = useCallback((companyId: string) => {
    return trips.filter(t => t.companyId === companyId);
  }, [trips]);

  const getCompanyBookings = useCallback((companyId: string) => {
    return bookings.filter(b => b.companyId === companyId);
  }, [bookings]);

  const getCompanyRoutes = useCallback((companyId: string) => {
    return routes.filter(r => r.companyId === companyId);
  }, [routes]);

  const getCompanyBuses = useCallback((companyId: string) => {
    return buses.filter(b => b.companyId === companyId);
  }, [buses]);

  const getCompanyName = useCallback((companyId: string) => {
    return companies.find(c => c.id === companyId)?.name || 'Unknown';
  }, [companies]);

  const getRouteInfo = useCallback((routeId: string) => {
    return routes.find(r => r.id === routeId);
  }, [routes]);

  const getBusInfo = useCallback((busId: string) => {
    return buses.find(b => b.id === busId);
  }, [buses]);

  return (
    <DataContext.Provider value={{
      companies, trips, bookings, routes, buses,
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
