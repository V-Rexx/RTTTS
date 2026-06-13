import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useCity } from '../../context/CityContext';

export default function StopMarker({ stop }) {
  const { routes } = useCity();

  const stopRoutes = routes.filter(
    r => stop.routes?.includes(r._id)
  );

  const customIcon = L.divIcon({
    className: '',
    html: `
      <div
        style="
          width:14px;
          height:14px;
          border-radius:50%;
          background:white;
          border:3px solid #334155;
          box-shadow:0 2px 6px rgba(0,0,0,0.2);
        "
      ></div>
    `,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });

  return (
    <Marker position={[stop.lat, stop.lng]} icon={customIcon}>
      <Popup>
        <div className="min-w-[180px]">
          <h3 className="font-semibold text-sm">
            {stop.name}
          </h3>

          <p className="text-xs text-slate-500 mt-1">
            Bus Stop
          </p>

          <div className="flex flex-wrap gap-1 mt-3">
            {stopRoutes.map(route => (
              <span
                key={route._id}
                className="px-2 py-1 rounded text-xs font-medium"
                style={{
                  backgroundColor: route.color,
                  color: 'white'
                }}
              >
                {route.routeNumber}
              </span>
            ))}
          </div>
        </div>
      </Popup>
    </Marker>
  );
}