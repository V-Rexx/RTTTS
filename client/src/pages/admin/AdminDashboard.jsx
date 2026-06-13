import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import useSocket from '../../hooks/useSocket';
import api, { getCitiesFromDb, getRoutesFromDb, getStopsFromDb, getBusesFromDb, getDriversFromDb } from '../../lib/api';
import Spinner from '../../components/shared/Spinner';

export default function AdminDashboard() {
  const socket = useSocket();
  const [buses, setBuses] = useState([]);
  const [stats, setStats] = useState({ cities: 0, routes: 0, stops: 0, buses: 0, online: 0, breakdowns: 0 });
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      const citiesCount = getCitiesFromDb().length;
      const routesCount = getRoutesFromDb().length;
      const stopsCount = getStopsFromDb().length;
      const drivers = getDriversFromDb();
      
      const busesList = getBusesFromDb();
      
      // Resolve driver names and route names for rendering
      const resolvedBuses = busesList.map(bus => {
        const driver = drivers.find(d => d._id === bus.driverId);
        const routes = getRoutesFromDb();
        const route = routes.find(r => r._id === bus.routeId);
        return {
          ...bus,
          driverName: driver ? driver.name : 'Unassigned',
          routeName: route ? `Route ${route.routeNumber} (${route.name})` : 'Unassigned'
        };
      });

      setBuses(resolvedBuses);

      const onlineCount = busesList.filter(b => b.status === 'active').length;
      const breakdownCount = busesList.filter(b => b.status === 'breakdown').length;

      setStats({
        cities: citiesCount,
        routes: routesCount,
        stops: stopsCount,
        buses: busesList.length,
        online: onlineCount,
        breakdowns: breakdownCount
      });
    } catch (error) {
      console.error('Failed loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Hook up socket sync so if drivers start shift/update location, the table updates instantly!
    const handleBusLocation = ({ busId, lat, lng, speed }) => {
      setBuses(prev => 
        prev.map(b => b._id === busId ? { ...b, lat, lng, speed, status: b.status === 'offline' ? 'active' : b.status } : b)
      );
      // Recalculate stats dynamically
      const currentBuses = getBusesFromDb();
      setStats(prev => ({
        ...prev,
        online: currentBuses.filter(b => b.status === 'active').length,
        breakdowns: currentBuses.filter(b => b.status === 'breakdown').length
      }));
    };

    const handleBusOnline = (newBus) => {
      loadDashboardData();
    };

    const handleBusOffline = ({ busId }) => {
      loadDashboardData();
    };

    const handleBusBreakdown = ({ busId, message }) => {
      setBuses(prev => 
        prev.map(b => b._id === busId ? { ...b, status: 'breakdown', speed: 0, breakdownMessage: message } : b)
      );
      const currentBuses = getBusesFromDb();
      setStats(prev => ({
        ...prev,
        online: currentBuses.filter(b => b.status === 'active').length,
        breakdowns: currentBuses.filter(b => b.status === 'breakdown').length
      }));
    };

    socket.on('bus-location', handleBusLocation);
    socket.on('bus-online', handleBusOnline);
    socket.on('bus-offline', handleBusOffline);
    socket.on('bus-breakdown', handleBusBreakdown);

    // Sync if Admin performs CRUD in other tabs
    const syncChannel = new BroadcastChannel('citytrack_db_sync');
    syncChannel.onmessage = () => {
      loadDashboardData();
    };

    return () => {
      socket.off('bus-location', handleBusLocation);
      socket.off('bus-online', handleBusOnline);
      socket.off('bus-offline', handleBusOffline);
      socket.off('bus-breakdown', handleBusBreakdown);
      syncChannel.close();
    };
  }, [socket]);

  return (
    <AdminLayout>
      {/* HUD Header */}
      <div className="flex flex-col gap-1.5 border-b border-slate-200 pb-5 select-none">
  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-500 font-mono">
    System Control HUD
  </span>

  <h1 className="text-3xl font-black text-slate-900 uppercase tracking-wide">
    Live Fleet Overview
  </h1>
</div>

      {loading ? (
        <Spinner size="lg" />
      ) : (
        <>
          {/* Stat Badges Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 select-none">
            {/* Total Cities */}
            <div className="card p-4 flex flex-col gap-1.5 shadow-md">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Cities</span>
              <span className="text-xl font-black text-slate-100 font-mono">{stats.cities}</span>
            </div>
            
            {/* Total Routes */}
            <div className="card p-4 flex flex-col gap-1.5 shadow-md">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Routes</span>
              <span className="text-xl font-black text-slate-100 font-mono">{stats.routes}</span>
            </div>
            
            {/* Total Stops */}
            <div className="card p-4 flex flex-col gap-1.5 shadow-md">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Stops</span>
              <span className="text-xl font-black text-slate-100 font-mono">{stats.stops}</span>
            </div>

            {/* Total Buses */}
            <div className="card p-4 flex flex-col gap-1.5 shadow-md">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Buses</span>
              <span className="text-xl font-black text-slate-100 font-mono">{stats.buses}</span>
            </div>

            {/* Online/Active */}
            <div className="card p-4 border border-emerald-500/10 bg-emerald-500/5 flex flex-col gap-1.5 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Online</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <span className="text-xl font-black text-emerald-400 font-mono">{stats.online}</span>
            </div>

            {/* Emergency breakdowns */}
            <div className={`card p-4 border flex flex-col gap-1.5 shadow-md ${
              stats.breakdowns > 0 
                ? 'border-red-500/25 bg-red-500/10 text-red-400 animate-pulse'
                : 'border-slate-800 text-slate-400 bg-slate-900'
            }`}>
              <span className="text-[9px] font-bold uppercase tracking-widest">Breakdowns</span>
              <span className="text-xl font-black font-mono">{stats.breakdowns}</span>
            </div>
          </div>

          {/* Fleet Status Table Card */}
          <div className="card border border-slate-800/80 bg-slate-900 rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between select-none">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Live Fleet Telemetry Table</span>
              <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest font-mono">Sync Interval: Instant</span>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/40 text-slate-400 uppercase font-black tracking-wider text-[9px] border-b border-slate-800 select-none">
                    <th className="px-5 py-3.5">Bus / Plate</th>
                    <th className="px-5 py-3.5">Assigned Route</th>
                    <th className="px-5 py-3.5">Active Driver</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Speed</th>
                    <th className="px-5 py-3.5">GPS coordinates</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-semibold text-slate-300">
                  {buses.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-5 py-8 text-center text-slate-500 font-medium">
                        No registered buses found. Seed fleets in the Buses CRUD view.
                      </td>
                    </tr>
                  ) : (
                    buses.map((bus) => (
                      <tr key={bus._id} className="hover:bg-slate-850/30 transition-colors">
                        {/* Bus plate */}
                        <td className="px-5 py-4 select-all">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-slate-100 font-extrabold font-mono">{bus.busNumber}</span>
                            <span className="text-[9px] font-bold text-slate-500 font-mono">{bus.plateNumber}</span>
                          </div>
                        </td>

                        {/* Assigned Route */}
                        <td className="px-5 py-4 text-xs font-bold">
                          {bus.routeName}
                        </td>

                        {/* Active Driver */}
                        <td className="px-5 py-4 text-slate-100 font-bold">
                          {bus.driverName}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4 select-none">
                          <span
                            className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border tracking-wider ${
                              bus.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : bus.status === 'breakdown'
                                ? 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse'
                                : 'bg-slate-850 text-slate-500 border-slate-800'
                            }`}
                          >
                            {bus.status}
                          </span>
                        </td>

                        {/* Speed */}
                        <td className="px-5 py-4 font-mono font-bold text-indigo-400">
                          {bus.status === 'offline' ? '—' : `${bus.speed} km/h`}
                        </td>

                        {/* Coordinates */}
                        <td className="px-5 py-4 font-mono text-[10px] text-slate-400 select-all">
                          {bus.status === 'offline' 
                            ? 'Offline' 
                            : `${parseFloat(bus.lat).toFixed(5)}, ${parseFloat(bus.lng).toFixed(5)}`}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
export { AdminDashboard };
