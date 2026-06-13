import React from 'react';
import { Polyline } from 'react-leaflet';
import { useCity } from '../../context/CityContext';

export default function RoutePolyline({ route }) {
  const { stops, activeRouteFilter } = useCity();

  const routeStops = route.stops
    .map(id => stops.find(s => s._id === id))
    .filter(Boolean);

  if (routeStops.length < 2) return null;

  const positions = routeStops.map(stop => [
    stop.lat,
    stop.lng
  ]);

  const active =
    activeRouteFilter === route._id ||
    activeRouteFilter === route.routeNumber;

  return (
    <Polyline
      positions={positions}
      pathOptions={{
        color: route.color,
        weight: active ? 8 : 6,
        opacity: active ? 1 : 0.75,
        lineCap: 'round',
        lineJoin: 'round'
      }}
    />
  );
}