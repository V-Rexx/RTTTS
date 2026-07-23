import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../api/axios';
import { getPassengerSocket } from '../socket/socket';
import { toLatLng } from '../utils/geo';
import { upsertById } from '../utils/upsertById';
import RoutePolyline from '../components/RoutePolyline';
import StopMarker from '../components/StopMarker';
import BusMarker from '../components/BusMarker';
import ChatBot from '../components/ChatBot';

function formatDuration(seconds) {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  return `${Math.round(seconds / 60)} min`;
}

export default function PassengerMap() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [city, setCity] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);
  const [buses, setBuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [pulsingRouteId, setPulsingRouteId] = useState(null);
  const [selectedBusId, setSelectedBusId] = useState(null);
  const [catchableResults, setCatchableResults] = useState(null);
  const [catchableLoading, setCatchableLoading] = useState(false);
  const [catchableError, setCatchableError] = useState(null);

  const routeByIdRef = useRef({});
  const stopsRef = useRef([]);
  const mapRef = useRef(null);
  const stopMarkerRefs = useRef({});

  useEffect(() => {
    routeByIdRef.current = Object.fromEntries(routes.map((r) => [r._id, r]));
  }, [routes]);

  useEffect(() => {
    stopsRef.current = stops;
  }, [stops]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setBuses({});
      setCatchableResults(null);
      try {
        const [cityRes, routesRes, stopsRes, liveRes] = await Promise.all([
          api.get(`/api/cities/${slug}`),
          api.get(`/api/routes?city=${slug}`),
          api.get(`/api/stops?city=${slug}`),
          api.get(`/api/buses/live?city=${slug}`),
        ]);

        if (cancelled) return;

        setCity(cityRes.data);
        setRoutes(routesRes.data.routes);
        setStops(stopsRes.data.stops);

        liveRes.data.buses.forEach((bus) => {
          upsertById(setBuses, bus._id, {
            busNumber: bus.busNumber,
            lat: bus.currentLocation?.lat,
            lng: bus.currentLocation?.lng,
            status: bus.status,
            routeId: bus.route?._id,
            routeNumber: bus.route?.routeNumber,
            routeColor: bus.route?.color,
            driverName: bus.driver?.name,
          });
        });
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'City not found');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    const socket = getPassengerSocket();

    const handleInitialState = ({ buses: initialBuses }) => {
      initialBuses.forEach((bus) => {
        const route = routeByIdRef.current[bus.route];
        upsertById(setBuses, bus._id, {
          busNumber: bus.busNumber,
          lat: bus.lat,
          lng: bus.lng,
          status: bus.status,
          routeId: bus.route,
          routeNumber: route?.routeNumber,
          routeColor: route?.color,
        });
      });
    };

    const handleBusLocation = (payload) => {
      const route = routeByIdRef.current[payload.route];
      upsertById(setBuses, payload.busId, {
        busNumber: payload.busNumber,
        lat: payload.lat,
        lng: payload.lng,
        status: payload.status,
        routeId: payload.route,
        routeNumber: route?.routeNumber,
        routeColor: route?.color,
      });
    };

    const handleBusOnline = (payload) => {
      const route = routeByIdRef.current[payload.route];
      upsertById(setBuses, payload.busId, {
        busNumber: payload.busNumber,
        status: 'active',
        driverName: payload.driverName,
        routeId: payload.route,
        routeNumber: route?.routeNumber,
        routeColor: route?.color,
      });
    };

    const handleBusOffline = ({ busId }) => {
      setBuses((prev) => {
        const next = { ...prev };
        delete next[busId];
        return next;
      });
      setSelectedBusId((prev) => (prev === busId ? null : prev));
    };

    const handleBusBreakdown = ({ busId }) => {
      upsertById(setBuses, busId, { status: 'breakdown' });
    };

    socket.emit('subscribe-city', { citySlug: slug });
    socket.on('initial-state', handleInitialState);
    socket.on('bus-location', handleBusLocation);
    socket.on('bus-online', handleBusOnline);
    socket.on('bus-offline', handleBusOffline);
    socket.on('bus-breakdown', handleBusBreakdown);

    return () => {
      socket.emit('unsubscribe-city', { citySlug: slug });
      socket.off('initial-state', handleInitialState);
      socket.off('bus-location', handleBusLocation);
      socket.off('bus-online', handleBusOnline);
      socket.off('bus-offline', handleBusOffline);
      socket.off('bus-breakdown', handleBusBreakdown);
    };
  }, [slug]);

  const findStopByName = (name) => {
    const needle = name.trim().toLowerCase();
    return stopsRef.current.find((s) => s.name.toLowerCase().includes(needle));
  };

  const handleFindMyBus = () => {
    if (!navigator.geolocation) {
      setCatchableError('Geolocation is not supported by this browser.');
      return;
    }
    setCatchableLoading(true);
    setCatchableError(null);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const { data } = await api.get(
            `/api/buses/catchable?lat=${coords.latitude}&lng=${coords.longitude}`
          );
          setCatchableResults(data.catchableBuses);
          if (data.catchableBuses.length === 0) {
            setCatchableError(data.reason || 'No catchable buses right now.');
          }
        } catch (err) {
          setCatchableError(err.response?.data?.message || 'Failed to find nearby buses.');
        } finally {
          setCatchableLoading(false);
        }
      },
      () => {
        setCatchableError('Could not get your location.');
        setCatchableLoading(false);
      }
    );
  };

  const focusOnStop = (stopId, lat, lng) => {
    mapRef.current?.flyTo([lat, lng], 15, { duration: 1 });
    setTimeout(() => stopMarkerRefs.current[stopId]?.openPopup?.(), 700);
  };

  // Routes stay hidden by default (see rendering below) — picking a bus,
  // either by clicking its marker or a "Find my bus" result, is what
  // reveals that one route. Clicking the same bus again hides it.
  const handleSelectBus = (busId) => {
    setSelectedBusId((prev) => (prev === busId ? null : busId));
  };

  const handleMapAction = (action) => {
    if (!action?.type || !action?.target) return;

    if (action.type === 'highlight_route') {
      const route = routes.find(
        (r) => r.routeNumber.toLowerCase() === action.target.toLowerCase()
      );
      if (!route) return;
      setPulsingRouteId(route._id);
      setTimeout(() => setPulsingRouteId(null), 3000);
      if (route.stops.length > 0) {
        const bounds = L.latLngBounds(route.stops.map((s) => toLatLng(s.location.coordinates)));
        mapRef.current?.flyToBounds(bounds, { padding: [60, 60], duration: 1 });
      }
      return;
    }

    if (action.type === 'zoom_to') {
      const stop = findStopByName(action.target);
      if (stop) {
        const [lat, lng] = toLatLng(stop.location.coordinates);
        mapRef.current?.flyTo([lat, lng], 15, { duration: 1 });
      }
      return;
    }

    if (action.type === 'show_stop') {
      const stop = findStopByName(action.target);
      if (stop) {
        const [lat, lng] = toLatLng(stop.location.coordinates);
        focusOnStop(stop._id, lat, lng);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        Loading {slug}...
      </div>
    );
  }

  if (error || !city) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4 text-center px-4">
        <p className="text-slate-600 font-medium">{error || 'City not found'}</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium"
        >
          Back to search
        </button>
      </div>
    );
  }

  const highlightedStopIds = new Set((catchableResults || []).map((r) => r.stop._id));
  const highlightedBusIds = new Set((catchableResults || []).map((r) => r.busId));

  const selectedBus = selectedBusId ? buses[selectedBusId] : null;
  const visibleRouteIds = new Set(
    [selectedBus?.routeId, pulsingRouteId].filter(Boolean)
  );

  return (
    <div className="relative w-screen h-screen">
      <header className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] max-w-[65vw] sm:max-w-none bg-white rounded-2xl shadow-lg border border-gray-200 px-5 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="text-slate-400 hover:text-slate-700 transition flex-shrink-0"
          aria-label="Back"
        >
          &larr;
        </button>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900 truncate">{city.name}</div>
          <div className="text-[11px] text-emerald-600 font-medium uppercase tracking-wide">
            Live tracking
          </div>
        </div>
      </header>

      <button
        onClick={handleFindMyBus}
        disabled={catchableLoading}
        className="absolute top-20 right-4 sm:top-4 z-[1000] bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-lg hover:bg-slate-800 transition disabled:opacity-60"
      >
        {catchableLoading ? 'Locating...' : '📍 Find my bus'}
      </button>

      {catchableResults !== null && (
        <div className="absolute top-36 right-4 sm:top-20 z-[1000] w-[85vw] max-w-72 max-h-[60vh] overflow-y-auto bg-white rounded-2xl shadow-xl border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-900">Catchable buses</span>
            <button
              onClick={() => setCatchableResults(null)}
              className="text-slate-400 hover:text-slate-700"
              aria-label="Close"
            >
              &times;
            </button>
          </div>

          {catchableError && (
            <div className="px-4 py-4 text-xs text-slate-500">{catchableError}</div>
          )}

          {catchableResults.map((r) => (
            <button
              key={`${r.busId}-${r.stop._id}`}
              onClick={() => {
                setSelectedBusId(r.busId);
                const liveBus = buses[r.busId];
                const target =
                  liveBus && typeof liveBus.lat === 'number'
                    ? [liveBus.lat, liveBus.lng]
                    : [r.stop.lat, r.stop.lng];
                mapRef.current?.flyTo(target, 15, { duration: 1 });
              }}
              className="w-full text-left px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-slate-50 transition"
            >
              <div className="text-sm font-semibold text-slate-800">
                Bus {r.busNumber}
                {routeByIdRef.current[r.route]?.routeNumber && (
                  <span className="text-slate-400 font-normal"> · Route {routeByIdRef.current[r.route].routeNumber}</span>
                )}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">via {r.stop.name}</div>
              <div className="text-xs text-slate-500 mt-1 flex gap-3">
                <span>🚶 {formatDuration(r.walkTimeSeconds)}</span>
                <span>🚌 ETA {formatDuration(r.busEtaSeconds)}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      <MapContainer
        ref={mapRef}
        center={[city.lat, city.lng]}
        zoom={city.zoom}
        zoomControl={false}
        className="w-full h-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {routes
          .filter((route) => visibleRouteIds.has(route._id))
          .map((route) => (
            <RoutePolyline key={route._id} route={route} pulsing={route._id === pulsingRouteId} />
          ))}

        {stops.map((stop) => (
          <StopMarker
            key={stop._id}
            stop={stop}
            highlighted={highlightedStopIds.has(stop._id)}
            markerRef={(el) => {
              stopMarkerRefs.current[stop._id] = el;
            }}
          />
        ))}

        {Object.values(buses).map((bus) => (
          <BusMarker
            key={bus._id}
            bus={bus}
            highlighted={highlightedBusIds.has(bus._id)}
            onSelect={() => handleSelectBus(bus._id)}
          />
        ))}
      </MapContainer>

      {selectedBus && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] max-w-[90vw] bg-white rounded-2xl shadow-lg border border-gray-200 px-4 py-2.5 flex items-center gap-3">
          <span className="text-sm font-medium text-slate-800 truncate">
            Showing Route {selectedBus.routeNumber || '—'} · Bus {selectedBus.busNumber}
          </span>
          <button
            onClick={() => setSelectedBusId(null)}
            className="text-slate-400 hover:text-slate-700 text-sm font-medium flex-shrink-0"
          >
            Hide
          </button>
        </div>
      )}

      <ChatBot citySlug={slug} onAction={handleMapAction} />
    </div>
  );
}
