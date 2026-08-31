import { Marker, Circle } from 'react-leaflet';
import L from 'leaflet';

const userIcon = L.divIcon({
  className: '',
  html: `
    <div class="relative w-4 h-4">
      <div class="absolute inset-0 rounded-full bg-blue-500/30 animate-ping"></div>
      <div class="relative w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg"></div>
    </div>
  `,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export default function UserLocationMarker({ position }) {
  if (!position) return null;
  const { lat, lng, accuracy } = position;

  return (
    <>
      {typeof accuracy === 'number' && accuracy < 1000 && (
        <Circle
          center={[lat, lng]}
          radius={accuracy}
          pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 1 }}
        />
      )}
      <Marker position={[lat, lng]} icon={userIcon} zIndexOffset={900} />
    </>
  );
}
