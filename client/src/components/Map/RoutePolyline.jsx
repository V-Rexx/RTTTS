import React from 'react';
import { Polyline } from 'react-leaflet';
import { useCity } from '../../context/CityContext';

export default function RoutePolyline({ route }) {
  const { stops, activeRouteFilter } = useCity();

  // Find stop details in exact order specified by route
  const routeStops = route.stops
    .map(stopId => stops.find(s => s._id === stopId))
    .filter(Boolean); // Clean missing stops

  if (routeStops.length < 2) return null;

  const positions = routeStops.map(s => [s.lat, s.lng]);
  const isHighlighted = activeRouteFilter === route._id || activeRouteFilter === route.routeNumber;

  return (
    <>
      {/* Background Pulse Glow if highlighted */}
      {isHighlighted && (
        <Polyline
          positions={positions}
          pathOptions={{
            color: route.color,
            weight: 12,
            opacity: 0.25,
            dashArray: '8, 8',
            className: 'animate-pulse'
          }}
        />
      )}

      {/* Main Core Polyline */}
      <Polyline
        positions={positions}
        pathOptions={{
          color: route.color,
          weight: isHighlighted ? 6 : 3,
          opacity: isHighlighted ? 0.95 : 0.6,
          lineJoin: 'round',
          lineCap: 'round',
          className: `transition-all duration-300 ${isHighlighted ? 'drop-shadow-lg shadow-indigo-500' : ''}`
        }}
      />
    </>
  );
}
