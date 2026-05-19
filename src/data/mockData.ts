import { User, Company, Bus, Route, Trip, Booking } from '../types';

export const cities = [
  'Kigali', 'Huye (Butare)', 'Musanze (Ruhengeri)', 'Rubavu (Gisenyi)',
  'Rusizi (Cyangugu)', 'Karongi (Kibuye)', 'Nyamagabe (Gikongoro)',
  'Rwamagana', 'Kayonza', 'Nyanza', 'Bugesera'
];

export const mockUsers: User[] = [
  {
    id: 'admin-1',
    name: 'Admin User',
    email: 'admin@busbook.rw',
    password: 'admin123',
    role: 'admin',
    phone: '+250788000001',
    createdAt: '2024-01-01'
  },
  {
    id: 'passenger-1',
    name: 'Jean Pierre Habimana',
    email: 'jean@example.com',
    password: 'pass123',
    role: 'passenger',
    phone: '+250788000002',
    createdAt: '2024-02-15'
  },
  {
    id: 'passenger-2',
    name: 'Marie Claire Uwimana',
    email: 'marie@example.com',
    password: 'pass123',
    role: 'passenger',
    phone: '+250788000003',
    createdAt: '2024-03-01'
  },
  {
    id: 'company-1',
    name: 'Rwanda Express Co.',
    email: 'info@rwandaexpress.rw',
    password: 'company123',
    role: 'company',
    phone: '+250788000010',
    companyId: 'comp-1',
    createdAt: '2024-01-15'
  },
  {
    id: 'company-2',
    name: 'Virunga Express',
    email: 'info@virungaexpress.rw',
    password: 'company123',
    role: 'company',
    phone: '+250788000011',
    companyId: 'comp-2',
    createdAt: '2024-02-01'
  },
  {
    id: 'operator-1',
    name: 'Emmanuel Ndayisaba',
    email: 'emmanuel@rwandaexpress.rw',
    password: 'oper123',
    role: 'operator',
    phone: '+250788000020',
    companyId: 'comp-1',
    createdAt: '2024-03-15'
  }
];

export const mockCompanies: Company[] = [
  {
    id: 'comp-1',
    name: 'Rwanda Express Co.',
    ownerId: 'company-1',
    description: 'Premium bus services connecting all major cities in Rwanda with comfortable coaches and reliable schedules.',
    status: 'approved',
    phone: '+250788000010',
    email: 'info@rwandaexpress.rw',
    createdAt: '2024-01-15'
  },
  {
    id: 'comp-2',
    name: 'Virunga Express',
    ownerId: 'company-2',
    description: 'Fast and affordable travel to Northern and Western Rwanda. Modern fleet with WiFi on board.',
    status: 'approved',
    phone: '+250788000011',
    email: 'info@virungaexpress.rw',
    createdAt: '2024-02-01'
  },
  {
    id: 'comp-3',
    name: 'Stella Bus Lines',
    ownerId: 'pending-3',
    description: 'New bus company aiming to serve eastern Rwanda routes.',
    status: 'pending',
    phone: '+250788000012',
    email: 'info@stellabus.rw',
    createdAt: '2024-03-20'
  },
  {
    id: 'comp-4',
    name: 'Capital Express',
    ownerId: 'pending-4',
    description: 'Luxury bus travel across Rwanda.',
    status: 'pending',
    phone: '+250788000013',
    email: 'info@capitalexpress.rw',
    createdAt: '2024-04-01'
  }
];

export const mockBuses: Bus[] = [
  { id: 'bus-1', companyId: 'comp-1', name: 'RE-001', plateNumber: 'RA 123 A', totalSeats: 49, layout: '2-2', amenities: ['WiFi', 'AC', 'USB Charging'] },
  { id: 'bus-2', companyId: 'comp-1', name: 'RE-002', plateNumber: 'RA 456 B', totalSeats: 33, layout: '2-2', amenities: ['AC', 'USB Charging'] },
  { id: 'bus-3', companyId: 'comp-2', name: 'VE-001', plateNumber: 'RA 789 C', totalSeats: 49, layout: '2-2', amenities: ['WiFi', 'AC', 'USB Charging', 'Reclining Seats'] },
  { id: 'bus-4', companyId: 'comp-2', name: 'VE-002', plateNumber: 'RA 101 D', totalSeats: 33, layout: '2-2', amenities: ['AC', 'USB Charging'] },
];

export const mockRoutes: Route[] = [
  { id: 'route-1', companyId: 'comp-1', origin: 'Kigali', destination: 'Huye (Butare)', distance: 135, duration: '2h 30min' },
  { id: 'route-2', companyId: 'comp-1', origin: 'Kigali', destination: 'Musanze (Ruhengeri)', distance: 110, duration: '2h 15min' },
  { id: 'route-3', companyId: 'comp-1', origin: 'Kigali', destination: 'Rubavu (Gisenyi)', distance: 150, duration: '3h' },
  { id: 'route-4', companyId: 'comp-2', origin: 'Kigali', destination: 'Musanze (Ruhengeri)', distance: 110, duration: '2h 15min' },
  { id: 'route-5', companyId: 'comp-2', origin: 'Kigali', destination: 'Rubavu (Gisenyi)', distance: 150, duration: '3h' },
  { id: 'route-6', companyId: 'comp-2', origin: 'Kigali', destination: 'Rusizi (Cyangugu)', distance: 230, duration: '4h 30min' },
  { id: 'route-7', companyId: 'comp-1', origin: 'Kigali', destination: 'Karongi (Kibuye)', distance: 195, duration: '3h 30min' },
  { id: 'route-8', companyId: 'comp-1', origin: 'Kigali', destination: 'Rwamagana', distance: 50, duration: '1h' },
  { id: 'route-9', companyId: 'comp-2', origin: 'Kigali', destination: 'Nyanza', distance: 90, duration: '1h 45min' },
  { id: 'route-10', companyId: 'comp-1', origin: 'Kigali', destination: 'Nyamagabe (Gikongoro)', distance: 160, duration: '3h' },
];

const today = new Date().toISOString().split('T')[0];
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
const dayAfter = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];

export const mockTrips: Trip[] = [
  { id: 'trip-1', routeId: 'route-1', companyId: 'comp-1', busId: 'bus-1', date: today, departureTime: '06:00', arrivalTime: '08:30', price: 3500, availableSeats: 40, totalSeats: 49, bookedSeats: [3, 5, 7, 12, 15, 20, 22, 25, 30], status: 'scheduled' },
  { id: 'trip-2', routeId: 'route-1', companyId: 'comp-1', busId: 'bus-2', date: today, departureTime: '08:00', arrivalTime: '10:30', price: 3500, availableSeats: 30, totalSeats: 33, bookedSeats: [1, 5, 10], status: 'scheduled' },
  { id: 'trip-3', routeId: 'route-1', companyId: 'comp-1', busId: 'bus-1', date: tomorrow, departureTime: '06:00', arrivalTime: '08:30', price: 3500, availableSeats: 49, totalSeats: 49, bookedSeats: [], status: 'scheduled' },
  { id: 'trip-4', routeId: 'route-2', companyId: 'comp-1', busId: 'bus-1', date: today, departureTime: '07:00', arrivalTime: '09:15', price: 3000, availableSeats: 35, totalSeats: 49, bookedSeats: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28], status: 'scheduled' },
  { id: 'trip-5', routeId: 'route-2', companyId: 'comp-1', busId: 'bus-2', date: tomorrow, departureTime: '09:00', arrivalTime: '11:15', price: 3000, availableSeats: 33, totalSeats: 33, bookedSeats: [], status: 'scheduled' },
  { id: 'trip-6', routeId: 'route-3', companyId: 'comp-1', busId: 'bus-1', date: today, departureTime: '06:30', arrivalTime: '09:30', price: 4000, availableSeats: 44, totalSeats: 49, bookedSeats: [1, 2, 3, 4, 5], status: 'scheduled' },
  { id: 'trip-7', routeId: 'route-3', companyId: 'comp-1', busId: 'bus-2', date: tomorrow, departureTime: '07:00', arrivalTime: '10:00', price: 4000, availableSeats: 30, totalSeats: 33, bookedSeats: [1, 2, 3], status: 'scheduled' },
  { id: 'trip-8', routeId: 'route-4', companyId: 'comp-2', busId: 'bus-3', date: today, departureTime: '07:30', arrivalTime: '09:45', price: 2800, availableSeats: 40, totalSeats: 49, bookedSeats: [5, 10, 15, 20, 25, 30, 35, 40, 45], status: 'scheduled' },
  { id: 'trip-9', routeId: 'route-5', companyId: 'comp-2', busId: 'bus-3', date: today, departureTime: '08:00', arrivalTime: '11:00', price: 3800, availableSeats: 42, totalSeats: 49, bookedSeats: [1, 5, 10, 15, 20, 25, 30], status: 'scheduled' },
  { id: 'trip-10', routeId: 'route-6', companyId: 'comp-2', busId: 'bus-3', date: today, departureTime: '05:30', arrivalTime: '10:00', price: 5500, availableSeats: 46, totalSeats: 49, bookedSeats: [1, 2, 3], status: 'scheduled' },
  { id: 'trip-11', routeId: 'route-6', companyId: 'comp-2', busId: 'bus-4', date: tomorrow, departureTime: '06:00', arrivalTime: '10:30', price: 5500, availableSeats: 33, totalSeats: 33, bookedSeats: [], status: 'scheduled' },
  { id: 'trip-12', routeId: 'route-7', companyId: 'comp-1', busId: 'bus-1', date: today, departureTime: '07:00', arrivalTime: '10:30', price: 4500, availableSeats: 43, totalSeats: 49, bookedSeats: [1, 5, 10, 15, 20, 25], status: 'scheduled' },
  { id: 'trip-13', routeId: 'route-8', companyId: 'comp-1', busId: 'bus-2', date: today, departureTime: '09:00', arrivalTime: '10:00', price: 1500, availableSeats: 30, totalSeats: 33, bookedSeats: [1, 5, 10], status: 'scheduled' },
  { id: 'trip-14', routeId: 'route-8', companyId: 'comp-1', busId: 'bus-2', date: tomorrow, departureTime: '10:00', arrivalTime: '11:00', price: 1500, availableSeats: 33, totalSeats: 33, bookedSeats: [], status: 'scheduled' },
  { id: 'trip-15', routeId: 'route-9', companyId: 'comp-2', busId: 'bus-4', date: today, departureTime: '08:30', arrivalTime: '10:15', price: 2500, availableSeats: 28, totalSeats: 33, bookedSeats: [1, 2, 3, 4, 5], status: 'scheduled' },
  { id: 'trip-16', routeId: 'route-10', companyId: 'comp-1', busId: 'bus-1', date: dayAfter, departureTime: '06:00', arrivalTime: '09:00', price: 4000, availableSeats: 49, totalSeats: 49, bookedSeats: [], status: 'scheduled' },
];

export const mockBookings: Booking[] = [
  {
    id: 'BK-001',
    tripId: 'trip-1',
    passengerId: 'passenger-1',
    companyId: 'comp-1',
    seatNumber: 3,
    passengerName: 'Jean Pierre Habimana',
    passengerPhone: '+250788000002',
    origin: 'Kigali',
    destination: 'Huye (Butare)',
    departureDate: today,
    departureTime: '06:00',
    price: 3500,
    status: 'confirmed',
    qrCode: 'BK-001-QR-ABCD123',
    createdAt: new Date().toISOString()
  }
];

export const getCompanyName = (companyId: string): string => {
  return mockCompanies.find(c => c.id === companyId)?.name || 'Unknown';
};

export const getRouteInfo = (routeId: string): Route | undefined => {
  return mockRoutes.find(r => r.id === routeId);
};

export const getBusInfo = (busId: string): Bus | undefined => {
  return mockBuses.find(b => b.id === busId);
};
