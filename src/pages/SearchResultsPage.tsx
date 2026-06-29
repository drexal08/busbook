import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { cities } from '../data/mockData';
import { IconSearch, IconArrowRight, IconCalendar, IconSeat, IconWifi, IconSnowflake, IconBolt, IconBus } from '../components/Icons';
import Select from '../components/Select';
import DatePicker from '../components/DatePicker';

const SearchResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { searchTrips, getCompanyName, getRouteInfo, getBusInfo } = useData();

  const origin = searchParams.get('origin') || '';
  const destination = searchParams.get('destination') || '';
  const date = searchParams.get('date') || '';

  const [fOrigin, setFOrigin] = useState(origin);
  const [fDest, setFDest] = useState(destination);
  const [fDate, setFDate] = useState(date);

  const cityOptions = useMemo(() => cities.map(c => ({ value: c, label: c })), []);
  const results = useMemo(() => searchTrips(fOrigin, fDest, fDate), [fOrigin, fDest, fDate, searchTrips]);
  const today = new Date().toISOString().split('T')[0];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/search?origin=${encodeURIComponent(fOrigin)}&destination=${encodeURIComponent(fDest)}&date=${fDate}`);
  };

  const formatDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  const amenityIcon = (a: string) => {
    if (a.toLowerCase().includes('wifi')) return <IconWifi size={12} />;
    if (a.toLowerCase().includes('ac')) return <IconSnowflake size={12} />;
    if (a.toLowerCase().includes('usb') || a.toLowerCase().includes('charg')) return <IconBolt size={12} />;
    return null;
  };

  return (
    <div className="min-h-[calc(100vh-60px)] bg-surface-secondary">
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 w-full">
              <Select options={cityOptions} value={fOrigin} onChange={setFOrigin} label="From" placeholder="Select" searchable />
            </div>
            <div className="flex-1 w-full">
              <Select options={cityOptions} value={fDest} onChange={setFDest} label="To" placeholder="Select" searchable />
            </div>
            <div className="flex-1 w-full">
              <DatePicker value={fDate} onChange={setFDate} label="Date" min={today} />
            </div>
            <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-3 rounded-xl font-semibold text-[13px] transition-all flex items-center gap-1.5 whitespace-nowrap shadow-sm">
              <IconSearch size={15} /> Search
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          {fOrigin && fDest ? (
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              {fOrigin} <IconArrowRight size={16} className="text-gray-300" /> {fDest}
            </h1>
          ) : <h1 className="text-lg font-bold text-gray-900">Search Routes</h1>}
          {fDate && <p className="text-gray-400 text-xs mt-1">{formatDate(fDate)} · {results.length} trip{results.length !== 1 ? 's' : ''} available</p>}
        </div>

        {results.length === 0 ? (
          <div className="text-center py-20 slide-up">
            <div className="w-16 h-16 bg-surface-tertiary rounded-2xl flex items-center justify-center mx-auto mb-4"><IconBus size={28} className="text-gray-300" /></div>
            <h3 className="text-base font-semibold text-gray-700 mb-1">No trips found</h3>
            <p className="text-gray-400 text-xs mb-6">{fOrigin && fDest ? 'Try a different date or route' : 'Enter origin, destination and date to search'}</p>
            <button onClick={() => navigate('/')} className="text-[13px] font-semibold text-primary-600 hover:underline">Back to home</button>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map(trip => {
              const route = getRouteInfo(trip.routeId);
              const company = getCompanyName(trip.companyId);
              const bus = getBusInfo(trip.busId);
              return (
                <div key={trip.id} className="bg-white rounded-xl border border-border hover:border-primary-200 hover:shadow-sm transition-all fade-in">
                  <div className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-[11px] font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md">{company}</span>
                          <span className="text-[11px] text-gray-300 font-mono">{bus?.plateNumber}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-lg font-bold text-gray-900">{trip.departureTime}</div>
                            <div className="text-[11px] text-gray-400 font-medium">{route?.origin}</div>
                          </div>
                          <div className="flex-1 flex flex-col items-center px-2">
                            <div className="text-[10px] text-gray-300 font-medium mb-1.5">{route?.duration}</div>
                            <div className="w-full h-px bg-gray-200 relative">
                              <div className="absolute -top-[3px] left-0 w-[7px] h-[7px] rounded-full bg-primary-500 border-2 border-white" />
                              <div className="absolute -top-[3px] right-0 w-[7px] h-[7px] rounded-full bg-emerald-500 border-2 border-white" />
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-gray-900">{trip.arrivalTime}</div>
                            <div className="text-[11px] text-gray-400 font-medium">{route?.destination}</div>
                          </div>
                        </div>
                      </div>
                      <div className="sm:text-right flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1.5 sm:min-w-[120px]">
                        <div>
                          <span className="text-xl font-extrabold text-gray-900">{trip.price.toLocaleString()}</span>
                          <span className="text-[11px] text-gray-400 font-medium ml-1">RWF</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-gray-400"><IconSeat size={12} /> {trip.availableSeats} left</div>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-col gap-3 border-t border-border-light pt-3.5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <span className="flex items-center gap-1 text-[11px] text-gray-400"><IconCalendar size={12} /> {formatDate(trip.date)}</span>
                        {bus?.amenities?.map((a, i) => (
                          <span key={i} className="flex items-center gap-1 text-[10px] text-gray-400 bg-surface-secondary px-1.5 py-0.5 rounded">{amenityIcon(a)} {a}</span>
                        ))}
                      </div>
                      <button onClick={() => navigate(`/book/${trip.id}`)}
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary-600 px-5 py-2 text-[12px] font-semibold text-white transition-all hover:bg-primary-700 hover:shadow-md hover:shadow-primary-100 active:scale-[0.98] sm:w-auto">
                        Select seat <IconArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResultsPage;
