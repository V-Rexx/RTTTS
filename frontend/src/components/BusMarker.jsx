import { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

function buildIcon(busNumber, status, highlighted) {
  const bg = status === 'breakdown' ? '#dc2626' : '#16a34a';
  const ring = highlighted ? 'ring-4 ring-amber-400 animate-pulse' : '';
  return L.divIcon({
    className: 'bus-marker-icon',
    html: `
      <div style="background:${bg}" class="px-2 py-1 rounded-full text-white text-[10px] font-bold shadow-lg border-2 border-white whitespace-nowrap ${ring}">
        🚌 ${busNumber}
      </div>
    `,
    iconSize: undefined,
    iconAnchor: [20, 12],
  });
}

export default function BusMarker({ bus, highlighted, onSelect }) {
  // Recreated only when status/number/highlight change so position-only
  // updates keep the same DOM node — that's what lets the CSS transition on
  // .bus-marker-icon (see index.css) animate the move instead of snapping.
  const icon = useMemo(
    () => buildIcon(bus.busNumber, bus.status, highlighted),
    [bus.busNumber, bus.status, highlighted]
  );

  if (typeof bus.lat !== 'number' || typeof bus.lng !== 'number') return null;

  return (
    <Marker position={[bus.lat, bus.lng]} icon={icon} eventHandlers={onSelect ? { click: onSelect } : undefined}>
      <Popup>
        <div className="text-xs font-semibold">Bus {bus.busNumber}</div>
        {bus.routeNumber && <div className="text-xs text-slate-500">Route {bus.routeNumber}</div>}
        {bus.driverName && <div className="text-xs text-slate-500">Driver: {bus.driverName}</div>}
        <div className="text-xs mt-1 capitalize">{bus.status}</div>
      </Popup>
    </Marker>
  );
}
