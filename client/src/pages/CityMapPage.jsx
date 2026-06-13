import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { CityProvider, useCity } from '../context/CityContext';
import BusMap from '../components/Map/BusMap';
import BusMarker from '../components/Map/BusMarker';
import StopMarker from '../components/Map/StopMarker';
import RoutePolyline from '../components/Map/RoutePolyline';
import UserLocationMarker from '../components/Map/UserLocationMarker';
import NearestBusPanel from '../components/NearestBus/NearestBusPanel';
import ChatBot from '../components/ChatBot/ChatBot';
import Spinner from '../components/shared/Spinner';

function CityMapPageContent() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    city,
    routes,
    stops,
    buses,
    loading,
    error,
    activeRouteFilter,
    setActiveRouteFilter
  } = useCity();

  // Handle custom geocoded search coordinate overrides from Landing page
  const [searchedLoc, setSearchedLoc] = useState(null);

  useEffect(() => {
    const lat = parseFloat(searchParams.get('lat'));
    const lng = parseFloat(searchParams.get('lng'));
    if (!isNaN(lat) && !isNaN(lng)) {
      setSearchedLoc({ lat, lng });
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <Spinner size="lg" />
        <span className="text-xs text-slate-400 font-bold uppercase tracking-widest animate-pulse">
          Calibrating Real-Time Fleet Sensors...
        </span>
      </div>
    );
  }

  if (error || !city) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 select-none p-4 text-center">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl max-w-sm flex flex-col gap-3">
          <svg className="w-10 h-10 text-red-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="font-extrabold uppercase text-xs tracking-wider">Connection Failure</span>
          <p className="text-xs text-slate-400 font-medium leading-relaxed">
            {error || 'Specified city profile does not exist in our regional database.'}
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="btn-ghost border border-slate-800 hover:border-slate-700 px-5 py-2.5 text-xs select-none uppercase tracking-wider font-bold"
        >
          Return to Hub search
        </button>
      </div>
    );
  }

  const mapCenter = [city.lat, city.lng];

  return (
    <div className="relative w-screen h-screen bg-[#F7F5F0] overflow-hidden">
      {/* Header HUD Overlay */}
      <header className="absolute top-5 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-xl px-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg px-5 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all rounded-lg outline-none flex items-center justify-center flex-shrink-0"
            aria-label="Go back"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex flex-col items-center text-center">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 font-mono">
              Broadcasting Live
            </span>
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
              {city.name} Transit Network
            </h2>
          </div>

          <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 select-none">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>
      </header>

      {/* Floating Route Filter Overlays - Top Right */}
      <div className="absolute top-6 right-4 z-[1000] flex flex-col gap-2.5 items-end pointer-events-auto">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-3 border border-slate-800/80 shadow-2xl w-56 flex flex-col gap-2 select-none">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Seeded Routes
          </span>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => setActiveRouteFilter(null)}
              className={`w-full text-left px-2.5 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all border ${
                activeRouteFilter === null
                  ? 'bg-emerald-50 border-indigo-500/30 text-emerald-700 font-extrabold shadow shadow-indigo-600/5'
                  : 'bg-slate-850/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-750'
              }`}
            >
              All Routes
            </button>
            {routes.map(route => {
              const isActive = activeRouteFilter === route._id;
              return (
                <button
                  key={route._id}
                  onClick={() => setActiveRouteFilter(route._id)}
                  style={{
                    backgroundColor: isActive ? `${route.color}15` : 'transparent',
                    borderColor: isActive ? `${route.color}40` : 'transparent',
                    color: isActive ? route.color : '#94A3B8'
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all border ${
                    !isActive ? 'hover:bg-slate-800/40 hover:text-slate-200 hover:border-slate-800' : 'font-extrabold'
                  }`}
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full mr-2"
                    style={{ backgroundColor: route.color }}
                  />
                  Route {route.routeNumber}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating Nearest Bus Finder - Left */}
      <NearestBusPanel />

      {/* Leaflet Live Map wrapper */}
      <div className="w-full h-full">
        <BusMap cityCenter={mapCenter} zoom={city.zoom}>
          {/* Geocoded searched location marker fallback */}
          {searchedLoc && (
            <UserLocationMarker lat={searchedLoc.lat} lng={searchedLoc.lng} />
          )}

          {/* Route lines */}
          {routes.map(route => (
            <RoutePolyline key={route._id} route={route} />
          ))}

          {/* Stop markers */}
          {stops.map(stop => (
            <StopMarker key={stop._id} stop={stop} />
          ))}

          {/* Live moving Bus markers */}
          {buses.map(bus => (
            <BusMarker key={bus._id} bus={bus} />
          ))}
        </BusMap>
      </div>

      {/* Floating ChatBot Overlay - Bottom Right */}
      <ChatBot citySlug={slug} />
    </div>
  );
}

export default function CityMapPage() {
  const { slug } = useParams();
  return (
    <CityProvider slug={slug}>
      <CityMapPageContent />
    </CityProvider>
  );
}
export { CityMapPage };
