import { useEffect, useState } from 'react';
import { Polyline } from 'react-leaflet';
import { toLatLng } from '../utils/geo';

const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';

// Module-level so the same route's road geometry isn't re-fetched every time
// its polyline remounts (city revisits, chatbot re-render, etc).
const roadGeometryCache = new Map();

export default function RoutePolyline({ route, pulsing }) {
  const straightPositions = route.stops.map((stop) => toLatLng(stop.location.coordinates));
  const cacheKey = route.stops.map((s) => s._id).join(',');
  const [roadPositions, setRoadPositions] = useState(() => roadGeometryCache.get(cacheKey) ?? null);

  useEffect(() => {
    if (straightPositions.length < 2) return;

    const cached = roadGeometryCache.get(cacheKey);
    if (cached) {
      setRoadPositions(cached);
      return;
    }

    let cancelled = false;
    const coordsParam = route.stops
      .map((s) => `${s.location.coordinates[0]},${s.location.coordinates[1]}`)
      .join(';');

    fetch(`${OSRM_URL}/${coordsParam}?overview=full&geometries=geojson`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const coords = data?.routes?.[0]?.geometry?.coordinates;
        if (coords?.length > 0) {
          const latLngs = coords.map(([lng, lat]) => [lat, lng]);
          roadGeometryCache.set(cacheKey, latLngs);
          setRoadPositions(latLngs);
        }
        // No route found (e.g. OSRM couldn't match the road network) —
        // leave roadPositions null and fall back to the straight line below.
      })
      .catch(() => {
        // Network/rate-limit failure on the free OSRM demo endpoint — same
        // fallback, the straight line is still an honest approximation.
      });

    return () => {
      cancelled = true;
    };
  }, [cacheKey]);

  if (straightPositions.length < 2) return null;

  return (
    <Polyline
      positions={roadPositions || straightPositions}
      pathOptions={{
        color: route.color,
        weight: pulsing ? 7 : 4,
        opacity: pulsing ? 1 : 0.8,
      }}
    />
  );
}
