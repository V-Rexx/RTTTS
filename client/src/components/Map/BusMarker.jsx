import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

export default function BusMarker({ bus }) {
  const isBreakdown = bus.status === 'breakdown';

  // Custom premium SVG glowing DivIcon
  const customIcon = L.divIcon({
    className: 'custom-bus-marker',
    html: `
      <div class="relative flex items-center justify-center w-8 h-8 rounded-full border border-white/20 shadow-2xl transition-all duration-500 transform ${
        isBreakdown ? 'bg-red-500 animate-pulse ring-4 ring-red-500/20' : 'bg-indigo-600 ring-4 ring-indigo-500/20'
      }">
        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        ${
          !isBreakdown
            ? `<span class="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 font-mono text-[8px] font-black text-slate-950 border border-slate-900 animate-bounce">${bus.busNumber.slice(
                -2
              )}</span>`
            : `<span class="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-600 font-mono text-[8px] font-black text-white border border-slate-900">!</span>`
        }
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });

  return (
    <Marker position={[bus.lat, bus.lng]} icon={customIcon}>
      <Popup className="premium-leaflet-popup">
        <div className="flex flex-col gap-2 p-1 min-w-[160px] select-none text-slate-100">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-1.5">
            <span className="text-xs font-black uppercase tracking-wider font-mono text-slate-100">
              {bus.busNumber}
            </span>
            <span
              className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                isBreakdown ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}
            >
              {bus.status}
            </span>
          </div>

          {/* Details */}
          <div className="flex flex-col gap-1 text-[11px] font-medium text-slate-300">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Telemetry Speed:</span>
              <span className="font-semibold text-slate-100 font-mono">{bus.speed} km/h</span>
            </div>
            {bus.driverName && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Driver Assign:</span>
                <span className="font-semibold text-indigo-400">{bus.driverName}</span>
              </div>
            )}
          </div>

          {/* Breakdown Warning */}
          {isBreakdown && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-2 mt-1 text-[10px] font-semibold leading-relaxed flex items-start gap-1.5">
              <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{bus.breakdownMessage || 'Bus broke down in transit. Dispatch pending.'}</span>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
}
