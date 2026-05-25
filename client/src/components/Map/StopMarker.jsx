import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useCity } from '../../context/CityContext';

export default function StopMarker({ stop }) {
  const { routes } = useCity();

  // Find actual Route Numbers servicing this stop
  const stopRoutes = routes.filter(r => stop.routes?.includes(r._id));

  // Custom premium SVG stop indicator
  const customIcon = L.divIcon({
    className: 'custom-stop-marker',
    html: `
      <div class="relative flex items-center justify-center w-6 h-6 bg-slate-900 border border-slate-700/80 rounded-full shadow-lg group hover:scale-110 hover:border-indigo-500 transition-all duration-300">
        <div class="w-2.5 h-2.5 rounded-full bg-indigo-400 group-hover:bg-indigo-500 animate-pulse" />
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });

  return (
    <Marker position={[stop.lat, stop.lng]} icon={customIcon}>
      <Popup className="premium-leaflet-popup">
        <div className="flex flex-col gap-2 p-1 min-w-[150px] select-none text-slate-100">
          <div className="flex flex-col border-b border-slate-700/60 pb-1.5 gap-0.5">
            <span className="text-xs font-bold text-slate-100">
              {stop.name}
            </span>
            <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Bus Transit Stop</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Serviced By</span>
            {stopRoutes.length === 0 ? (
              <span className="text-[10px] text-slate-400">No active routes</span>
            ) : (
              <div className="flex flex-wrap gap-1">
                {stopRoutes.map(route => (
                  <span
                    key={route._id}
                    style={{ backgroundColor: `${route.color}20`, borderColor: `${route.color}40`, color: route.color }}
                    className="px-2 py-0.5 rounded text-[9px] font-black border uppercase tracking-wider select-none"
                  >
                    {route.routeNumber}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
