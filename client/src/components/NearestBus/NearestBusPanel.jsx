import React, { useState, useEffect } from 'react';
import useGeolocation from '../../hooks/useGeolocation';
import useNearestBus from '../../hooks/useNearestBus';
import Spinner from '../shared/Spinner';
import Button from '../shared/Button';
import { useCity } from '../../context/CityContext';

export default function NearestBusPanel() {
  const [active, setActive] = useState(false);
  const { city } = useCity();
  
  // Dynamically center emulated passenger near the selected city center
  const fallbackCoords = city 
    ? { lat: city.lat + 0.004, lng: city.lng + 0.004 } 
    : { lat: 12.9250, lng: 77.6350 };

  const { position, error, loading: geoLoading, request, setPosition } = useGeolocation(fallbackCoords);
  const { nearestStop, catchableBuses, loading: calcLoading } = useNearestBus(position);

  const handleActivate = () => {
    setActive(true);
    request();
  };

  const handleClose = () => {
    setActive(false);
    setPosition(null);
  };

  // Capture AI Chatbot custom action events to open the Nearest Bus panel automatically
  useEffect(() => {
    const handleMapAction = (e) => {
      const { type } = e.detail;
      if (type === 'find_nearest_bus') {
        handleActivate();
      }
    };
    window.addEventListener('citytrack_map_action', handleMapAction);
    return () => window.removeEventListener('citytrack_map_action', handleMapAction);
  }, []);

  return (
    <div className="absolute top-4 left-4 z-[1000] max-w-sm w-full pointer-events-none">
      {!active ? (
        <button
          onClick={handleActivate}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-3 rounded-xl shadow-xl transition-all duration-300 transform active:scale-95 outline-none text-xs border border-indigo-500 hover:border-indigo-400 select-none uppercase tracking-wider pointer-events-auto"
        >
          <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Find Nearest Bus
        </button>
      ) : (
        <div className="card bg-slate-900/90 backdrop-blur-md border border-slate-800 p-5 rounded-2xl shadow-2xl flex flex-col gap-4 max-h-[80vh] overflow-y-auto w-[360px] animate-scale-in pointer-events-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex flex-col gap-0.5">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                Nearest Stops
              </h3>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">GPS Telemetry Analysis</p>
            </div>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-200 transition-colors p-1 hover:bg-slate-800 rounded-lg outline-none"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Loading Indicator */}
          {(geoLoading || calcLoading) && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Spinner size="md" />
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider animate-pulse">Scanning Satellite Data...</span>
            </div>
          )}

          {/* Geolocation Error Fallback Notification */}
          {!geoLoading && error && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl p-3 flex flex-col gap-1 text-[11px] font-medium leading-relaxed">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase tracking-wider text-[10px]">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Mock GPS Fallback
              </div>
              {error}
            </div>
          )}

          {/* Core Content */}
          {!geoLoading && !calcLoading && position && (
            <div className="flex flex-col gap-4">
              {/* Closest Stop Panel */}
              {nearestStop ? (
                <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-xl p-4 flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Closest Stop Identified</span>
                  <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    {nearestStop.name}
                  </h4>
                  <div className="flex items-center gap-4 text-xs text-slate-300 font-semibold pt-1">
                    <span className="flex items-center gap-1 text-slate-400">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {nearestStop.distance >= 1000 ? `${(nearestStop.distance / 1000).toFixed(1)} km` : `${Math.round(nearestStop.distance)} meters`}
                    </span>
                    <span className="flex items-center gap-1 text-indigo-400">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      ~{nearestStop.walkTime} min walk
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">No nearby stops found in this city.</p>
              )}

              {/* Catchable Buses */}
              {nearestStop && (
                <div className="flex flex-col gap-2.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Incoming Live Fleets</span>
                  {catchableBuses.length === 0 ? (
                    <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-800/80 text-center">
                      <p className="text-xs text-slate-400 font-medium">No live buses heading to this stop currently.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {catchableBuses.map((bus) => (
                        <div
                          key={bus._id}
                          className="bg-slate-800/50 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700/80 transition-all duration-300 rounded-xl p-3.5 flex items-center justify-between gap-3"
                        >
                          <div className="flex flex-col gap-1 select-none">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                {bus.routeNumber}
                              </span>
                              <span className="text-xs font-bold text-slate-200 truncate max-w-[120px]">{bus.routeName}</span>
                            </div>
                            <span className="font-mono text-[9px] font-semibold text-slate-500">{bus.plateNumber}</span>
                          </div>

                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className="text-xs font-extrabold text-indigo-400">
                              ETA {bus.eta} mins
                            </span>
                            
                            {bus.isCatchable ? (
                              <span className="bg-emerald-500/10 text-emerald-400 text-[8px] font-extrabold px-1.5 py-0.5 rounded border border-emerald-500/20 select-none uppercase tracking-wide">
                                Catchable
                              </span>
                            ) : (
                              <span className="bg-red-500/10 text-red-400 text-[8px] font-extrabold px-1.5 py-0.5 rounded border border-red-500/20 select-none uppercase tracking-wide">
                                Tight Squeeze
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Reset Action */}
          {!geoLoading && !calcLoading && position && (
            <Button
              onClick={request}
              variant="ghost"
              className="border border-slate-800 hover:border-slate-700 py-2.5 text-xs select-none uppercase tracking-wider font-bold"
            >
              Recalibrate Geolocation
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
