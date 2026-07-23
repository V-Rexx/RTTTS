import { useState } from 'react';
import api from '../../api/axios';
import Modal from '../../components/admin/Modal';
import { useAdminCity } from '../../context/AdminCityContext';
import { useToast } from '../../context/ToastContext';

const EMPTY_FORM = { name: '', lat: '', lng: '', zoom: '12' };

export default function Cities() {
  const { cities, loading, loadError, refreshCities } = useAdminCity();
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCity, setEditingCity] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const openCreate = () => {
    setEditingCity(null);
    setForm(EMPTY_FORM);
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (city) => {
    setEditingCity(city);
    setForm({
      name: city.name,
      lat: String(city.center.lat),
      lng: String(city.center.lng),
      zoom: String(city.zoom),
    });
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const lat = parseFloat(form.lat);
    const lng = parseFloat(form.lng);
    const zoom = parseInt(form.zoom, 10);

    if (!form.name.trim() || isNaN(lat) || isNaN(lng)) {
      setError('Name, latitude, and longitude are required.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const payload = { name: form.name.trim(), lat, lng, zoom: isNaN(zoom) ? 12 : zoom };
      if (editingCity) {
        await api.put(`/api/cities/${editingCity._id}`, payload);
      } else {
        await api.post('/api/cities', payload);
      }
      setModalOpen(false);
      refreshCities().catch(() => {});
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save city.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (city) => {
    if (!window.confirm(`Delete ${city.name}? This does not remove its routes, stops, or buses.`)) return;
    try {
      await api.delete(`/api/cities/${city._id}`);
      refreshCities().catch(() => {});
      showToast(`${city.name} deleted.`, 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Delete failed.');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Cities</h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition"
        >
          + New city
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3">Name</th>
              <th className="text-left px-5 py-3">Slug</th>
              <th className="text-left px-5 py-3">Center</th>
              <th className="text-left px-5 py-3">Zoom</th>
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
                  Failed to load cities. {loadError}
                </td>
              </tr>
            )}
            {!loading && !loadError && cities.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-center text-slate-400">
                  No cities yet.
                </td>
              </tr>
            )}
            {cities.map((city) => (
              <tr key={city._id}>
                <td className="px-5 py-3 font-medium text-slate-800">{city.name}</td>
                <td className="px-5 py-3 text-slate-500 font-mono text-xs">{city.slug}</td>
                <td className="px-5 py-3 text-slate-500 font-mono text-xs">
                  {city.center.lat.toFixed(4)}, {city.center.lng.toFixed(4)}
                </td>
                <td className="px-5 py-3 text-slate-500">{city.zoom}</td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => openEdit(city)}
                    className="text-xs font-medium text-slate-600 hover:text-slate-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(city)}
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingCity ? 'Edit City' : 'New City'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2">{error}</div>}

          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Name
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
              Latitude
              <input
                value={form.lat}
                onChange={(e) => setForm({ ...form, lat: e.target.value })}
                className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
              Longitude
              <input
                value={form.lng}
                onChange={(e) => setForm({ ...form, lng: e.target.value })}
                className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Default zoom
            <input
              value={form.zoom}
              onChange={(e) => setForm({ ...form, zoom: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-60"
          >
            {submitting ? 'Saving...' : editingCity ? 'Save changes' : 'Create city'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
