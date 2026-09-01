import { useEffect, useState } from 'react';
import { Polyline } from 'react-leaflet';

const OSRM_FOOT_URL = 'https://routing.openstreetmap.de/routed-foot/route/v1/foot';

// Walking directions between two fixed points (user -> chosen bus stop).
// Falls back to a straight dashed line if the routing service is unreachable.
export default function WalkingRoutePolyline({ start, end }) {
  const [path, setPath] = useState(null);

  useEffect(() => {
    if (!start || !end) {
      setPath(null);
      return;
    }

    let cancelled = false;
    setPath(null);
    const coordsParam = `${start.lng},${start.lat};${end.lng},${end.lat}`;

    fetch(`${OSRM_FOOT_URL}/${coordsParam}?overview=full&geometries=geojson`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const coords = data?.routes?.[0]?.geometry?.coordinates;
        if (coords?.length > 0) {
          setPath(coords.map(([lng, lat]) => [lat, lng]));
        } else {
          setPath([[start.lat, start.lng], [end.lat, end.lng]]);
        }
      })
      .catch(() => {
        if (!cancelled) setPath([[start.lat, start.lng], [end.lat, end.lng]]);
      });

    return () => {
      cancelled = true;
    };
  }, [start?.lat, start?.lng, end?.lat, end?.lng]);

  if (!path) return null;

  return (
    <Polyline
      positions={path}
      pathOptions={{ color: '#2563eb', weight: 4, opacity: 0.85, dashArray: '8 8' }}
    />
  );
}
