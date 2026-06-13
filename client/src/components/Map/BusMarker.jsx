import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

export default function BusMarker({ bus }) {
  const isBreakdown = bus.status === 'breakdown';

  const customIcon = L.divIcon({
    className: '',
    html: `
      <div
        style="
          width:32px;
          height:32px;
          border-radius:50%;
          background:${isBreakdown ? '#EF4444' : '#F59E0B'};
          border:3px solid white;
          box-shadow:0 2px 10px rgba(0,0,0,0.25);
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:14px;
        "
      >
        🚌
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  return (
    <Marker position={[bus.lat, bus.lng]} icon={customIcon}>
      <Popup>
        <div className="min-w-[180px] text-slate-800">
          <h3 className="font-bold text-sm">{bus.busNumber}</h3>

          <div className="mt-2 text-xs space-y-1">
            <p>Speed: {bus.speed} km/h</p>
            <p>Status: {bus.status}</p>

            {bus.driverName && (
              <p>Driver: {bus.driverName}</p>
            )}
          </div>

          {isBreakdown && (
            <div className="mt-2 text-red-600 text-xs font-semibold">
              {bus.breakdownMessage || 'Vehicle breakdown reported'}
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
}