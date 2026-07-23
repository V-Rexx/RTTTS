import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../../api/axios';
import Modal from '../../components/admin/Modal';
import { toLatLng } from '../../utils/geo';
import { useAdminCity } from '../../context/AdminCityContext';
import { useToast } from '../../context/ToastContext';

function ClickToPlace({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function Stops() {
  const { cities, citySlug, setCitySlug } = useAdminCity();
  const { showToast } = useToast();
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingStop, setEditingStop] = useState(null);
  const [name, setName] = useState('');
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    if (!citySlug) return;
    setLoading(true);
    setLoadError(null);
    api
      .get(`/api/stops?city=${citySlug}`)
      .then((res) => setStops(res.data.stops))
      .catch((err) => {
        setStops([]);
        setLoadError(err.response?.data?.message || 'Could not reach the server.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [citySlug]);

  const activeCity = cities.find((c) => c.slug === citySlug);

  const openCreate = () => {
    setEditingStop(null);
    setName('');
    setLat(activeCity?.center.lat ?? null);
    setLng(activeCity?.center.lng ?? null);
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (stop) => {
    const [stopLat, stopLng] = toLatLng(stop.location.coordinates);
    setEditingStop(stop);
    setName(stop.name);
    setLat(stopLat);
    setLng(stopLng);
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || lat === null || lng === null) {
      setError('Name and a map location are required.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      if (editingStop) {
        await api.put(`/api/stops/${editingStop._id}`, { name: name.trim(), lat, lng });
      } else {
        await api.post('/api/stops', { name: name.trim(), lat, lng, citySlug });
      }
      setModalOpen(false);
      load();
      showToast(editingStop ? 'Stop updated.' : 'Stop created.', 'success');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save stop.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (stop) => {
    if (!window.confirm(`Delete stop "${stop.name}"? It will be removed from any routes.`)) return;
    try {
      await api.delete(`/api/stops/${stop._id}`);
      load();
      showToast(`${stop.name} deleted.`, 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Delete failed.');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Stops</h1>
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
            + New stop
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3">Name</th>
              <th className="text-left px-5 py-3">Coordinates</th>
              <th className="text-right px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={3} className="px-5 py-6 text-center text-slate-400">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && loadError && (
              <tr>
                <td colSpan={3} className="px-5 py-6 text-center text-red-500">
                  Failed to load stops. {loadError}
                </td>
              </tr>
            )}
            {!loading && !loadError && stops.length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-6 text-center text-slate-400">
                  No stops in this city yet.
                </td>
              </tr>
            )}
            {stops.map((stop) => {
              const [slat, slng] = toLatLng(stop.location.coordinates);
              return (
                <tr key={stop._id}>
                  <td className="px-5 py-3 font-medium text-slate-800">{stop.name}</td>
                  <td className="px-5 py-3 text-slate-500 font-mono text-xs">
                    {slat.toFixed(5)}, {slng.toFixed(5)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => openEdit(stop)}
                      className="text-xs font-medium text-slate-600 hover:text-slate-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(stop)}
                      className="text-xs font-medium text-red-600 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingStop ? 'Edit Stop' : 'New Stop'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2">{error}</div>}

          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </label>

          <div className="text-xs font-medium text-slate-600">
            Click the map to place the stop{' '}
            {lat !== null && (
              <span className="font-mono text-slate-400">
                ({lat.toFixed(5)}, {lng.toFixed(5)})
              </span>
            )}
          </div>

          <div className="h-56 rounded-xl overflow-hidden border border-gray-200">
            {lat !== null && lng !== null && (
              <MapContainer center={[lat, lng]} zoom={13} className="w-full h-full">
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <ClickToPlace onPick={(newLat, newLng) => { setLat(newLat); setLng(newLng); }} />
                <Marker position={[lat, lng]} />
              </MapContainer>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-60"
          >
            {submitting ? 'Saving...' : editingStop ? 'Save changes' : 'Create stop'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
