import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { getAccessToken } from '../api/axios';
import { getDriverSocket, disconnectDriverSocket } from '../socket/socket';

export default function DriverPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [bus, setBus] = useState(null);
  const [busLoading, setBusLoading] = useState(true);
  const [shiftActive, setShiftActive] = useState(false);
  const [breakdownActive, setBreakdownActive] = useState(false);
  const [telemetry, setTelemetry] = useState({
    lat: null,
    lng: null,
    speed: 0,
    accuracy: null,
    lastSync: null,
    lastBroadcast: null,
  });
  const [statusError, setStatusError] = useState(null);

  useEffect(() => {
    api
      .get('/api/buses?driver=me')
      .then((res) => setBus(res.data.buses[0] || null))
      .catch(() => setBus(null))
      .finally(() => setBusLoading(false));
  }, []);

  // Registered once for the life of this page — the driver socket stays
  // connected across multiple start/end shift cycles so these listeners
  // don't need to be re-attached to a new connection each time.
  useEffect(() => {
    const socket = getDriverSocket(getAccessToken);

    const handleShiftStarted = ({ bus: startedBus }) => {
      setShiftActive(true);
      setBreakdownActive(false);
      setStatusError(null);
      setBus((prev) => (prev ? { ...prev, ...startedBus } : startedBus));
    };

    const handleSocketError = ({ message }) => {
      setStatusError(message);
    };

    socket.on('shift-started', handleShiftStarted);
    socket.on('error', handleSocketError);

    return () => {
      socket.off('shift-started', handleShiftStarted);
      socket.off('error', handleSocketError);
      disconnectDriverSocket();
    };
  }, []);

  // The Geolocation API only exists on `Window`, not inside the service
  // worker — see public/sw.js for why. This page-level watch is the only
  // place that can actually read GPS, throttled to one POST every 3s.
  //
  // Accuracy handling: browsers without a real GPS chip (most laptops) fall
  // back to WiFi/IP-based positioning, which can be off by hundreds or
  // thousands of meters — enableHighAccuracy just requests the best
  // available source, it can't force GPS-grade precision to exist. So we
  // prefer a fix under ACCURACY_THRESHOLD_M when one's available, but on a
  // device that can never do better (e.g. stuck on IP-based positioning),
  // we still broadcast the best available reading every FALLBACK_INTERVAL_MS
  // rather than staying silent forever.
  useEffect(() => {
    if (!shiftActive) return;

    const ACCURACY_THRESHOLD_M = 100;
    const FALLBACK_INTERVAL_MS = 5000;

    navigator.serviceWorker?.ready.then((reg) => {
      reg.active?.postMessage({ type: 'START_TRACKING' });
    });

    let lastPost = 0;
    let lastPublished = 0;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed, accuracy } = pos.coords;
        setTelemetry((prev) => ({
          ...prev,
          lat: latitude,
          lng: longitude,
          speed: speed || 0,
          accuracy,
          lastSync: new Date(),
        }));

        const now = Date.now();
        if (now - lastPost < 3000) return;

        const isAccurate = accuracy <= ACCURACY_THRESHOLD_M;
        const dueForFallback = now - lastPublished > FALLBACK_INTERVAL_MS;
        if (!isAccurate && !dueForFallback) return;

        lastPost = now;
        lastPublished = now;

        api
          .post('/api/buses/location', { lat: latitude, lng: longitude, speed: speed || 0 })
          .then(() => setTelemetry((prev) => ({ ...prev, lastBroadcast: new Date() })))
          .catch((err) => console.error('Location POST failed:', err));
      },
      (err) => setStatusError(`Location error: ${err.message}`),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      navigator.serviceWorker?.ready.then((reg) => {
        reg.active?.postMessage({ type: 'STOP_TRACKING' });
      });
    };
  }, [shiftActive]);

  const handleStartShift = () => {
    setStatusError(null);
    getDriverSocket(getAccessToken).emit('driver-connect');
  };

  const handleEndShift = () => {
    getDriverSocket(getAccessToken).emit('driver-disconnect');
    setShiftActive(false);
    setBreakdownActive(false);
    setTelemetry({
      lat: null,
      lng: null,
      speed: 0,
      accuracy: null,
      lastSync: null,
      lastBroadcast: null,
    });
  };

  const handleBreakdown = () => {
    if (!window.confirm('Report this bus as broken down? This alerts passengers immediately.')) {
      return;
    }
    getDriverSocket(getAccessToken).emit('bus-breakdown', {});
    setBreakdownActive(true);
  };

  const handleSignOut = async () => {
    if (shiftActive) handleEndShift();
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-900">Driver Console</div>
          <div className="text-xs text-slate-500">{user?.name}</div>
        </div>
        <button onClick={handleSignOut} className="text-xs font-medium text-red-600 hover:text-red-700">
          Sign out
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm flex flex-col gap-4">
          {busLoading && <div className="text-center text-sm text-slate-500">Loading bus assignment...</div>}

          {!busLoading && !bus && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center text-sm text-slate-500">
              No bus assigned to your account yet. Contact your admin.
            </div>
          )}

          {!busLoading && bus && (
            <>
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="text-xs text-slate-500 uppercase tracking-wide font-medium">Assigned bus</div>
                <div className="text-lg font-semibold text-slate-900 mt-1">{bus.busNumber}</div>
                {bus.route && (
                  <div className="text-xs text-slate-500 mt-0.5">
                    Route {bus.route.routeNumber} · {bus.route.routeName}
                  </div>
                )}
                <div
                  className={`mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                    breakdownActive
                      ? 'bg-red-100 text-red-700'
                      : shiftActive
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {breakdownActive ? 'Breakdown reported' : shiftActive ? 'On shift' : 'Offline'}
                </div>
              </div>

              {statusError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2.5">
                  {statusError}
                </div>
              )}

              {shiftActive && (
                <div className="bg-white border border-gray-200 rounded-2xl p-5 text-xs text-slate-600 flex flex-col gap-1">
                  <div>Lat: {telemetry.lat?.toFixed(5) ?? '—'}</div>
                  <div>Lng: {telemetry.lng?.toFixed(5) ?? '—'}</div>
                  <div>Speed: {telemetry.speed ? `${Math.round(telemetry.speed * 3.6)} km/h` : '—'}</div>
                  {telemetry.accuracy != null && (
                    <div className={telemetry.accuracy > 100 ? 'text-amber-600' : 'text-emerald-600'}>
                      GPS accuracy: ±{Math.round(telemetry.accuracy)}m
                      {telemetry.accuracy > 100 && ' (low — broadcasting best-available fix every ~5s)'}
                    </div>
                  )}
                  <div>
                    Last GPS read:{' '}
                    {telemetry.lastSync ? telemetry.lastSync.toLocaleTimeString() : 'waiting for GPS...'}
                  </div>
                  <div>
                    Last broadcast to passengers:{' '}
                    {telemetry.lastBroadcast ? telemetry.lastBroadcast.toLocaleTimeString() : 'not yet sent'}
                  </div>
                </div>
              )}

              {!shiftActive ? (
                <button
                  onClick={handleStartShift}
                  className="py-4 rounded-2xl bg-emerald-600 text-white text-base font-bold hover:bg-emerald-700 transition"
                >
                  START SHIFT
                </button>
              ) : (
                <>
                  {!breakdownActive && (
                    <button
                      onClick={handleBreakdown}
                      className="py-4 rounded-2xl bg-red-600 text-white text-base font-bold hover:bg-red-700 transition"
                    >
                      BREAKDOWN
                    </button>
                  )}
                  <button
                    onClick={handleEndShift}
                    className="py-3 rounded-2xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition"
                  >
                    End Shift
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
