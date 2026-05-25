import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useSocket from '../hooks/useSocket';
import api, { getBusesFromDb, getRoutesFromDb, getStopsFromDb, saveBusesToDb } from '../lib/api';
import ShiftControl from '../components/Driver/ShiftControl';
import LocationBadge from '../components/Driver/LocationBadge';
import BreakdownButton from '../components/Driver/BreakdownButton';
import Spinner from '../components/shared/Spinner';

export default function DriverPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();

  const [buses, setBuses] = useState([]);
  const [activeBus, setActiveBus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [telemetry, setTelemetry] = useState({ lat: null, lng: null, speed: 0, lastSync: null });
  const [isBreakdown, setIsBreakdown] = useState(false);
  const [breakdownMsg, setBreakdownMsg] = useState('');

  const gpsTimerRef = useRef(null);
  const routePointsRef = useRef([]);
  const currentPointIndexRef = useRef(0);
  const isReversingRef = useRef(false);

  // Fetch driver assigned buses
  useEffect(() => {
    async function loadDriverBuses() {
      if (!user) return;
      try {
        setLoading(true);
        const response = await api.get('/api/buses?driver=me');
        setBuses(response.data);
      } catch (error) {
        console.error('Failed to load buses:', error);
      } finally {
        setLoading(false);
      }
    }
    loadDriverBuses();
  }, [user]);

  // Telemetry simulation loop helper: interpolates coordinates between stops
  const interpolatePoints = (stopsList) => {
    if (stopsList.length < 2) return [];
    const points = [];
    const steps = 15; // Number of intermediate steps between stops for smooth moving

    for (let i = 0; i < stopsList.length - 1; i++) {
      const start = stopsList[i];
      const end = stopsList[i + 1];

      for (let j = 0; j < steps; j++) {
        const factor = j / steps;
        const lat = start.lat + (end.lat - start.lat) * factor;
        const lng = start.lng + (end.lng - start.lng) * factor;
        points.push({ lat, lng });
      }
    }
    // Add the final stop coordinate
    points.push({
      lat: stopsList[stopsList.length - 1].lat,
      lng: stopsList[stopsList.length - 1].lng
    });

    return points;
  };

  const handleStartShift = async (busId) => {
    setLoading(true);
    try {
      // 1. Mark bus as active in mock DB
      const response = await api.put(`/api/buses/${busId}`, { status: 'active' });
      const bus = response.data;
      setActiveBus(bus);
      setIsBreakdown(false);
      setBreakdownMsg('');

      // 2. Connect driver socket singleton
      socket.emit('driver-connect', { busId });

      // 3. Set up Telemetry points along the assigned Route
      const allRoutes = getRoutesFromDb();
      const route = allRoutes.find(r => r._id === bus.routeId);

      if (route) {
        const allStops = getStopsFromDb();
        const routeStops = route.stops
          .map(sid => allStops.find(s => s._id === sid))
          .filter(Boolean);

        if (routeStops.length >= 2) {
          const interpolated = interpolatePoints(routeStops);
          routePointsRef.current = interpolated;
          currentPointIndexRef.current = 0;
          isReversingRef.current = false;

          // Prime starting telemetry
          const firstPoint = interpolated[0];
          setTelemetry({
            lat: firstPoint.lat,
            lng: firstPoint.lng,
            speed: 25,
            lastSync: new Date().toISOString()
          });

          // 4. Activate simulated GPS tracker loop (emulating a Service Worker background GPS watch)
          startGpsTracking(busId);
        }
      }
    } catch (error) {
      console.error('Failed to start shift:', error);
    } finally {
      setLoading(false);
    }
  };

  const startGpsTracking = (busId) => {
    if (gpsTimerRef.current) clearInterval(gpsTimerRef.current);

    gpsTimerRef.current = setInterval(async () => {
      const points = routePointsRef.current;
      if (points.length === 0) return;

      let idx = currentPointIndexRef.current;
      let reversing = isReversingRef.current;

      // Increment or decrement index based on route reversal
      if (reversing) {
        idx--;
        if (idx < 0) {
          idx = 1;
          reversing = false;
        }
      } else {
        idx++;
        if (idx >= points.length) {
          idx = points.length - 2;
          reversing = true;
        }
      }

      currentPointIndexRef.current = idx;
      isReversingRef.current = reversing;

      const currentLoc = points[idx];
      // Generate a realistic slight speed variation (e.g. 15-40 km/h)
      const currentSpeed = Math.floor(Math.random() * 25) + 15;

      // Update Local telemetry states
      setTelemetry({
        lat: currentLoc.lat,
        lng: currentLoc.lng,
        speed: currentSpeed,
        lastSync: new Date().toISOString()
      });

      // Synchronize location via Mock REST API and emit events
      try {
        await api.post('/api/buses/location', {
          busId,
          lat: currentLoc.lat,
          lng: currentLoc.lng,
          speed: currentSpeed
        });
      } catch (err) {
        console.error('Failed syncing emulated telemetry:', err);
      }
    }, 4000); // Trigger location updates every 4 seconds
  };

  const stopGpsTracking = () => {
    if (gpsTimerRef.current) {
      clearInterval(gpsTimerRef.current);
      gpsTimerRef.current = null;
    }
  };

  const handleEndShift = async () => {
    if (!activeBus) return;
    setLoading(true);
    stopGpsTracking();
    try {
      const busId = activeBus._id;
      // Mark bus offline in DB
      await api.put(`/api/buses/${busId}`, { status: 'offline', speed: 0 });
      
      // Emit socket disconnect
      socket.emit('driver-disconnect', { busId });
      
      setActiveBus(null);
      setTelemetry({ lat: null, lng: null, speed: 0, lastSync: null });
      setIsBreakdown(false);
      setBreakdownMsg('');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleBreakdown = async (message) => {
    if (!activeBus) return;
    stopGpsTracking(); // freeze movement
    
    try {
      const busId = activeBus._id;
      // Update state in DB
      await api.put(`/api/buses/${busId}`, { status: 'breakdown', speed: 0 });
      
      // Emit socket alarm event
      socket.emit('bus-breakdown', { busId, message });
      
      setIsBreakdown(true);
      setBreakdownMsg(message);
      setTelemetry(prev => ({ ...prev, speed: 0, lastSync: new Date().toISOString() }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    await handleEndShift();
    await logout();
    navigate('/login');
  };

  if (authLoading) return <div className="min-h-screen bg-slate-950" />;

  return (
    <div className="relative min-h-screen bg-slate-950 flex flex-col justify-between selection:bg-indigo-500/20">
      {/* HUD Header */}
      <header className="px-6 py-4 border-b border-slate-900 bg-slate-950/60 backdrop-blur-md sticky top-0 z-[4000] flex items-center justify-between">
        <div className="flex items-center gap-2.5 select-none">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-slate-100 shadow-lg shadow-indigo-600/30 border border-indigo-500">
            CT
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-black uppercase tracking-wider text-slate-100 font-sans">Driver Console</span>
            <span className="text-[9px] uppercase tracking-widest font-black text-slate-500 font-mono">
              Driver: {user?.name || 'Rahul'}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs font-bold uppercase tracking-wider text-red-400 hover:text-red-300 transition-colors py-1.5 px-3 rounded-lg hover:bg-red-500/5 select-none outline-none border border-transparent hover:border-red-500/10"
        >
          Sign Out
        </button>
      </header>

      {/* Main Console HUD */}
      <main className="flex-grow flex items-center justify-center p-4">
        {loading ? (
          <Spinner size="lg" />
        ) : (
          <div className="max-w-md w-full flex flex-col gap-4">
            {/* Breakdown Warning Banner */}
            {isBreakdown && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl p-4 flex gap-3 select-none animate-bounce">
                <svg className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex flex-col gap-0.5 text-xs">
                  <span className="font-extrabold uppercase text-[10px] tracking-wide text-red-400">Emergency Declared</span>
                  <span>GPS transmission suspended. Breakdown logged: "{breakdownMsg}"</span>
                </div>
              </div>
            )}

            {/* Shift controls */}
            <ShiftControl
              buses={buses}
              onStart={handleStartShift}
              onEnd={handleEndShift}
              activeBus={activeBus}
              loading={loading}
            />

            {/* Live GPS Telemetry values */}
            <LocationBadge
              lat={telemetry.lat}
              lng={telemetry.lng}
              speed={telemetry.speed}
              lastSync={telemetry.lastSync}
              active={!!activeBus && !isBreakdown}
            />

            {/* Breakdown Red panic button */}
            {activeBus && !isBreakdown && (
              <BreakdownButton
                onTrigger={handleBreakdown}
                disabled={!activeBus}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer PWA hint */}
      <footer className="px-6 py-4 border-t border-slate-900 text-center select-none text-[9px] text-slate-500 font-bold uppercase tracking-wider bg-slate-950/80 backdrop-blur-md">
        CityTrack PWA &middot; Service Worker GPS Engaged &middot; locked background active
      </footer>
    </div>
  );
}
export { DriverPage };
