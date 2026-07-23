import { useEffect, useState } from 'react';
import api from '../../api/axios';
import Modal from '../../components/admin/Modal';
import { useAdminCity } from '../../context/AdminCityContext';
import { useToast } from '../../context/ToastContext';

const EMPTY_FORM = { routeNumber: '', routeName: '', color: '#4F46E5' };

export default function Routes() {
  const { cities, citySlug, setCitySlug } = useAdminCity();
  const { showToast } = useToast();
  const [routes, setRoutes] = useState([]);
  const [cityStops, setCityStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedStops, setSelectedStops] = useState([]);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    if (!citySlug) return;
    setLoading(true);
    setLoadError(null);
    Promise.all([
      api.get(`/api/routes?city=${citySlug}`),
      api.get(`/api/stops?city=${citySlug}`),
    ])
      .then(([routesRes, stopsRes]) => {
        setRoutes(routesRes.data.routes);
        setCityStops(stopsRes.data.stops);
      })
      .catch((err) => {
        setRoutes([]);
        setCityStops([]);
        setLoadError(err.response?.data?.message || 'Could not reach the server.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [citySlug]);

  const openCreate = () => {
    setEditingRoute(null);
    setForm(EMPTY_FORM);
    setSelectedStops([]);
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (route) => {
    setEditingRoute(route);
    setForm({ routeNumber: route.routeNumber, routeName: route.routeName, color: route.color });
    setSelectedStops(route.stops.map((s) => s._id));
    setError(null);
    setModalOpen(true);
  };

  const toggleStop = (stopId) => {
    setSelectedStops((prev) =>
      prev.includes(stopId) ? prev.filter((id) => id !== stopId) : [...prev, stopId]
    );
  };

  const moveStop = (index, direction) => {
    setSelectedStops((prev) => {
      const next = [...prev];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.routeNumber.trim() || !form.routeName.trim()) {
      setError('Route number and name are required.');
      return;
    }
    if (selectedStops.length < 2) {
      setError('Select at least 2 stops.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const payload = { ...form, stops: selectedStops };
      if (editingRoute) {
        await api.put(`/api/routes/${editingRoute._id}`, payload);
      } else {
        await api.post('/api/routes', { ...payload, citySlug });
      }
      setModalOpen(false);
      load();
      showToast(editingRoute ? 'Route updated.' : 'Route created.', 'success');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save route.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (route) => {
    if (!window.confirm(`Delete route ${route.routeNumber}? It will be unassigned from any buses.`)) return;
    try {
      await api.delete(`/api/routes/${route._id}`);
      load();
      showToast(`Route ${route.routeNumber} deleted.`, 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Delete failed.');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Routes</h1>
        <div className="flex items-center gap-3">
          <select
            value={citySlug}
            onChange={(e) => setCitySlug(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-300 text-sm"
          >
            {cities.map((c) => (
              <option key={c._id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            onClick={openCreate}
            disabled={!citySlug}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-50"
          >
            + New route
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3">Route</th>
              <th className="text-left px-5 py-3">Name</th>
              <th className="text-left px-5 py-3">Stops</th>
              <th className="text-left px-5 py-3">Color</th>
              <th className="text-right px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-center text-slate-400">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && loadError && (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-center text-red-500">
                  Failed to load routes. {loadError}
                </td>
              </tr>
            )}
            {!loading && !loadError && routes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-center text-slate-400">
                  No routes in this city yet.
                </td>
              </tr>
            )}
            {routes.map((route) => (
              <tr key={route._id}>
                <td className="px-5 py-3 font-mono text-xs font-semibold text-slate-800">{route.routeNumber}</td>
                <td className="px-5 py-3 text-slate-700">{route.routeName}</td>
                <td className="px-5 py-3 text-slate-500">{route.stops.length} stops</td>
                <td className="px-5 py-3">
                  <span
                    className="inline-block w-4 h-4 rounded-full border border-gray-200 align-middle"
                    style={{ backgroundColor: route.color }}
                  />
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => openEdit(route)}
                    className="text-xs font-medium text-slate-600 hover:text-slate-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(route)}
                    className="text-xs font-medium text-red-600 hover:text-red-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRoute ? 'Edit Route' : 'New Route'}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2">{error}</div>}

          <div className="grid grid-cols-3 gap-3">
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600 col-span-2">
              Route number
              <input
                value={form.routeNumber}
                onChange={(e) => setForm({ ...form, routeNumber: e.target.value })}
                className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
              Color
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="h-9 rounded-lg border border-gray-300"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Route name
            <input
              value={form.routeName}
              onChange={(e) => setForm({ ...form, routeName: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </label>

          <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-slate-600">Available stops</span>
              <div className="border border-gray-200 rounded-xl p-2 h-44 overflow-y-auto flex flex-col gap-1">
                {cityStops.length === 0 && (
                  <span className="text-xs text-slate-400 px-1">No stops in this city yet.</span>
                )}
                {cityStops.map((stop) => (
                  <label key={stop._id} className="flex items-center gap-2 text-xs text-slate-700 px-1 py-0.5">
                    <input
                      type="checkbox"
                      checked={selectedStops.includes(stop._id)}
                      onChange={() => toggleStop(stop._id)}
                    />
                    {stop.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-slate-600">Order (stop 1 → last)</span>
              <div className="border border-gray-200 rounded-xl p-2 h-44 overflow-y-auto flex flex-col gap-1">
                {selectedStops.length === 0 && (
                  <span className="text-xs text-slate-400 px-1">Select stops on the left.</span>
                )}
                {selectedStops.map((stopId, index) => {
                  const stop = cityStops.find((s) => s._id === stopId);
                  if (!stop) return null;
                  return (
                    <div
                      key={stopId}
                      className="flex items-center justify-between bg-slate-50 rounded-lg px-2 py-1 text-xs"
                    >
                      <span className="truncate">{index + 1}. {stop.name}</span>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => moveStop(index, 'up')}
                          disabled={index === 0}
                          className="disabled:opacity-30"
                        >
                          &uarr;
                        </button>
                        <button
                          type="button"
                          onClick={() => moveStop(index, 'down')}
                          disabled={index === selectedStops.length - 1}
                          className="disabled:opacity-30"
                        >
                          &darr;
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-60"
          >
            {submitting ? 'Saving...' : editingRoute ? 'Save changes' : 'Create route'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
