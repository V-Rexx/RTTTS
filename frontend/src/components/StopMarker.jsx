import { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { toLatLng } from '../utils/geo';

const stopIcon = L.divIcon({
  className: '',
  html: '<div class="w-3 h-3 rounded-full bg-slate-600 border-2 border-white shadow"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const highlightedStopIcon = L.divIcon({
  className: '',
  html: '<div class="w-5 h-5 rounded-full bg-amber-500 border-2 border-white shadow-lg ring-4 ring-amber-400/40"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

export default function StopMarker({ stop, markerRef, highlighted }) {
  const icon = useMemo(() => (highlighted ? highlightedStopIcon : stopIcon), [highlighted]);

  return (
    <Marker ref={markerRef} position={toLatLng(stop.location.coordinates)} icon={icon}>
      <Popup>{stop.name}</Popup>
    </Marker>
  );
}
