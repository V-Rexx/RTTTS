import React from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';

export default function UserLocationMarker({ lat, lng }) {
  if (!lat || !lng) return null;

  // Custom SVG pulsing blue dot icon
  const pulsingDotIcon = L.divIcon({
    className: 'pulsing-user-marker',
    html: `
      <div class="relative flex items-center justify-center w-6 h-6">
        <div class="absolute w-5 h-5 rounded-full bg-blue-500/30 animate-ping" />
        <div class="absolute w-3.5 h-3.5 rounded-full bg-blue-500 border border-white shadow shadow-blue-500/50" />
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  return (
    <Marker position={[lat, lng]} icon={pulsingDotIcon} />
  );
}
