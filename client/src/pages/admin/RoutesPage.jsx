import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import api, { getCitiesFromDb, getStopsFromDb } from '../../lib/api';
import Button from '../../components/shared/Button';
import Input from '../../components/shared/Input';
import Modal from '../../components/shared/Modal';
import Spinner from '../../components/shared/Spinner';

export default function RoutesPage() {
  const [routes, setRoutes] = useState([]);
  const [cities, setCities] = useState([]);
  const [allStops, setAllStops] = useState([]);
  const [selectedCitySlug, setSelectedCitySlug] = useState('bangalore');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);

  // Form states
  const [routeNumber, setRouteNumber] = useState('');
  const [name, setName] = useState('');
  const [color, setColor] = useState('#4F46E5');
  const [selectedStops, setSelectedStops] = useState([]); // Array of stop IDs in order
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const citiesList = getCitiesFromDb();
      setCities(citiesList);
      
      const stopsList = getStopsFromDb().filter(s => s.city === selectedCitySlug);
      setAllStops(stopsList);

      const res = await api.get(`/api/routes?city=${selectedCitySlug}`);
      setRoutes(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCitySlug]);

  const handleOpenCreate = () => {
    setEditingRoute(null);
    setRouteNumber('');
    setName('');
    setColor('#4F46E5');
    setSelectedStops([]);
    setError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (route) => {
    setEditingRoute(route);
    setRouteNumber(route.routeNumber);
    setName(route.name);
    setColor(route.color);
    setSelectedStops(route.stops || []);
    setError(null);
    setModalOpen(true);
  };

  // Reorder Stops callbacks
  const moveStop = (index, direction) => {
    const updated = [...selectedStops];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= updated.length) return;
    
    // Swap
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    
    setSelectedStops(updated);
  };

  const toggleStopSelection = (stopId) => {
    if (selectedStops.includes(stopId)) {
      setSelectedStops(selectedStops.filter(id => id !== stopId));
    } else {
      setSelectedStops([...selectedStops, stopId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!routeNumber.trim() || !name.trim()) {
      setError('Route number and Name are required.');
      return;
    }

    if (selectedStops.length < 2) {
      setError('A route must contain at least 2 serviced stops.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        routeNumber,
        name,
        color,
        stops: selectedStops,
        city: selectedCitySlug
      };

      if (editingRoute) {
        await api.put(`/api/routes/${editingRoute._id}`, payload);
      } else {
        await api.post('/api/routes', payload);
      }

      // Notify other pages
      const channel = new BroadcastChannel('citytrack_db_sync');
      channel.postMessage({ type: 'routes' });
      channel.close();

      setModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this route? It will unlink this route from all assigned buses!')) return;
    try {
      await api.delete(`/api/routes/${id}`);
      // Notify other pages
      const channel = new BroadcastChannel('citytrack_db_sync');
      channel.postMessage({ type: 'routes' });
      channel.close();
      loadData();
    } catch (e) {
      console.error(e);
      alert('Delete failed.');
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between border-b border-slate-850 pb-5 select-none">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-400 font-mono">
            System Control Console
          </span>
          <h1 className="text-2xl font-black text-slate-100 uppercase tracking-wide">
            Manage Routes
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedCitySlug}
            onChange={(e) => setSelectedCitySlug(e.target.value)}
            className="px-4 py-2.5 rounded-lg text-xs bg-slate-900 border border-slate-800 focus:border-indigo-500 text-slate-200 outline-none transition-all select-none uppercase tracking-wider font-bold"
          >
            {cities.map((city) => (
              <option key={city._id} value={city.slug}>
                {city.name} HUB
              </option>
            ))}
          </select>
          <Button onClick={handleOpenCreate} className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider">
            Create Transit Route
          </Button>
        </div>
      </div>

      {loading ? (
        <Spinner size="lg" />
      ) : (
        <div className="card border border-slate-800/80 bg-slate-900 rounded-2xl shadow-xl overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/40 text-slate-400 uppercase font-black tracking-wider text-[9px] border-b border-slate-800 select-none">
                <th className="px-5 py-3.5">Route</th>
                <th className="px-5 py-3.5">Name</th>
                <th className="px-5 py-3.5">Stops Count</th>
                <th className="px-5 py-3.5">Color Badge</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-semibold text-slate-300">
              {routes.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-5 py-8 text-center text-slate-500 font-medium">
                    No routes created for {selectedCitySlug.toUpperCase()} yet.
                  </td>
                </tr>
              ) : (
                routes.map((route) => (
                  <tr key={route._id} className="hover:bg-slate-850/30 transition-colors">
                    <td className="px-5 py-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                        {route.routeNumber}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-100 font-bold">{route.name}</td>
                    <td className="px-5 py-4 text-emerald-400 font-bold">{route.stops?.length || 0} Stops</td>
                    <td className="px-5 py-4 font-mono select-none">
                      <span
                        className="inline-block w-4 h-4 rounded-full border border-slate-700 align-middle mr-2"
                        style={{ backgroundColor: route.color }}
                      />
                      {route.color}
                    </td>
                    <td className="px-5 py-4 text-right select-none flex justify-end gap-2">
                      <Button
                        onClick={() => handleOpenEdit(route)}
                        variant="ghost"
                        className="py-1.5 px-3 text-[10px] uppercase font-bold border border-slate-800 hover:border-slate-700/80 hover:bg-slate-800/60"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDelete(route._id)}
                        variant="danger"
                        className="py-1.5 px-3 text-[10px] uppercase font-bold"
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRoute ? 'Edit Transit Route' : 'Create Transit Route'}
        className="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-slate-300">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 text-[11px] font-semibold select-none">
              {error}
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Input
                id="routeNumber"
                label="Route Number"
                value={routeNumber}
                onChange={(e) => setRouteNumber(e.target.value)}
                placeholder="e.g. 500C, G-3"
                required
              />
            </div>
            <div>
              <Input
                id="routeColor"
                label="Color Hex"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                type="color"
                required
              />
            </div>
          </div>

          <Input
            id="routeName"
            label="Route Description"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Silk Board - Majestic Terminal"
            required
          />

          {/* Stops Ordering Panel */}
          <div className="grid grid-cols-2 gap-4 border-t border-slate-850 pt-3 select-none">
            {/* Checklist of all stops in city */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Select Active Stops
              </span>
              <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/20 h-48 overflow-y-auto flex flex-col gap-1.5">
                {allStops.length === 0 ? (
                  <span className="text-[10px] text-slate-500">No stops found. Place stops first!</span>
                ) : (
                  allStops.map(stop => {
                    const checked = selectedStops.includes(stop._id);
                    return (
                      <label key={stop._id} className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-slate-300 hover:text-slate-100">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleStopSelection(stop._id)}
                          className="w-3.5 h-3.5 rounded text-indigo-600 bg-slate-800 border-slate-700 focus:ring-indigo-500"
                        />
                        {stop.name}
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            {/* Ordered display list */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Stop Order Traversal
              </span>
              <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/20 h-48 overflow-y-auto flex flex-col gap-1.5">
                {selectedStops.length === 0 ? (
                  <span className="text-[10px] text-slate-500">No stops selected. Check options on the left.</span>
                ) : (
                  selectedStops.map((stopId, index) => {
                    const stop = allStops.find(s => s._id === stopId);
                    if (!stop) return null;
                    return (
                      <div key={stopId} className="flex items-center justify-between bg-slate-850 border border-slate-800 rounded-lg p-2 gap-2 text-[10px] font-black">
                        <span className="truncate text-slate-200">{index + 1}. {stop.name}</span>
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => moveStop(index, 'up')}
                            disabled={index === 0}
                            className="p-1 hover:bg-slate-700 text-slate-400 hover:text-slate-200 disabled:opacity-30 rounded"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() => moveStop(index, 'down')}
                            disabled={index === selectedStops.length - 1}
                            className="p-1 hover:bg-slate-700 text-slate-400 hover:text-slate-200 disabled:opacity-30 rounded"
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2.5 pt-3 border-t border-slate-800/80">
            <Button
              type="button"
              onClick={() => setModalOpen(false)}
              variant="ghost"
              className="flex-1 py-2.5 border border-slate-800 text-xs font-bold uppercase tracking-wider"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={submitting}
              className="flex-1 py-2.5 text-xs font-bold uppercase tracking-wider"
            >
              {editingRoute ? 'Save Route' : 'Create Route'}
            </Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
