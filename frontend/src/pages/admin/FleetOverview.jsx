import { useEffect, useRef, useState } from 'react';
import api from '../../api/axios';
import { getPassengerSocket } from '../../socket/socket';
import { upsertById } from '../../utils/upsertById';

export default function FleetOverview() {
  const [buses, setBuses] = useState({});
  const [loading, setLoading] = useState(true);
  const routeByIdRef = useRef({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [citiesRes, busesRes] = await Promise.all([
          api.get('/api/cities'),
          api.get('/api/buses'),
        ]);

        if (cancelled) return;

        const initial = {};
        const routeById = {};
        busesRes.data.buses.forEach((bus) => {
          if (bus.route) routeById[bus.route._id] = bus.route;
          initial[bus._id] = {
            _id: bus._id,
            busNumber: bus.busNumber,
            plateNumber: bus.plateNumber,
            citySlug: bus.city?.slug,
            cityName: bus.city?.name,
            routeNumber: bus.route?.routeNumber,
            driverName: bus.driver?.name,
            status: bus.status,
            isOnline: bus.isOnline,
            lastUpdated: bus.lastUpdated,
          };
        });
        routeByIdRef.current = routeById;
        setBuses(initial);

        const socket = getPassengerSocket();
        citiesRes.data.forEach((city) => {
          socket.emit('subscribe-city', { citySlug: city.slug });
        });
      } catch {
        if (!cancelled) setBuses({});
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const socket = getPassengerSocket();

    const handleInitialState = ({ buses: liveBuses }) => {
      liveBuses.forEach((bus) => {
        const route = routeByIdRef.current[bus.route];
        upsertById(setBuses, bus._id, {
          busNumber: bus.busNumber,
          citySlug: bus.citySlug,
          routeNumber: route?.routeNumber,
          status: bus.status,
          isOnline: true,
          lastUpdated: new Date().toISOString(),
        });
      });
    };

    const handleBusLocation = (payload) => {
      const route = routeByIdRef.current[payload.route];
      upsertById(setBuses, payload.busId, {
        busNumber: payload.busNumber,
        routeNumber: route?.routeNumber,
        status: payload.status,
        isOnline: true,
        lastUpdated: payload.lastUpdated,
      });
    };

    const handleBusOnline = (payload) => {
      const route = routeByIdRef.current[payload.route];
      upsertById(setBuses, payload.busId, {
        busNumber: payload.busNumber,
        routeNumber: route?.routeNumber,
        driverName: payload.driverName,
        status: 'active',
        isOnline: true,
        lastUpdated: new Date().toISOString(),
      });
    };

    const handleBusOffline = ({ busId }) => {
      upsertById(setBuses, busId, {
        status: 'inactive',
        isOnline: false,
        lastUpdated: new Date().toISOString(),
      });
    };

    const handleBusBreakdown = ({ busId }) => {
      upsertById(setBuses, busId, {
        status: 'breakdown',
        lastUpdated: new Date().toISOString(),
      });
    };

    socket.on('initial-state', handleInitialState);
    socket.on('bus-location', handleBusLocation);
    socket.on('bus-online', handleBusOnline);
    socket.on('bus-offline', handleBusOffline);
    socket.on('bus-breakdown', handleBusBreakdown);

    return () => {
      socket.off('initial-state', handleInitialState);
      socket.off('bus-location', handleBusLocation);
      socket.off('bus-online', handleBusOnline);
      socket.off('bus-offline', handleBusOffline);
      socket.off('bus-breakdown', handleBusBreakdown);
    };
  }, []);

  const rows = Object.values(buses).sort((a, b) => (a.busNumber || '').localeCompare(b.busNumber || ''));

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900 mb-6">Fleet Overview</h1>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3">City</th>
              <th className="text-left px-5 py-3">Bus</th>
              <th className="text-left px-5 py-3">Plate</th>
              <th className="text-left px-5 py-3">Route</th>
              <th className="text-left px-5 py-3">Driver</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="text-left px-5 py-3">Last Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={7} className="px-5 py-6 text-center text-slate-400">
                  Loading fleet...
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-6 text-center text-slate-400">
                  No buses registered yet.
                </td>
              </tr>
            )}
            {rows.map((bus) => (
              <tr key={bus._id}>
                <td className="px-5 py-3 text-slate-500">{bus.cityName || bus.citySlug || '—'}</td>
                <td className="px-5 py-3 font-mono text-xs font-semibold text-slate-800">{bus.busNumber}</td>
                <td className="px-5 py-3 text-slate-500 font-mono text-xs">{bus.plateNumber || '—'}</td>
                <td className="px-5 py-3 text-slate-700">{bus.routeNumber || '—'}</td>
                <td className="px-5 py-3 text-slate-700">{bus.driverName || '—'}</td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${bus.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    />
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                        bus.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700'
                          : bus.status === 'breakdown'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {bus.status}
                    </span>
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-400 text-xs">
                  {bus.lastUpdated ? new Date(bus.lastUpdated).toLocaleTimeString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
