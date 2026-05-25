import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import api, { getCitiesFromDb, saveCitiesToDb } from '../../lib/api';
import Button from '../../components/shared/Button';
import Input from '../../components/shared/Input';
import Modal from '../../components/shared/Modal';
import Spinner from '../../components/shared/Spinner';

export default function CitiesPage() {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCity, setEditingCity] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [lat, setLat] = useState('12.9716');
  const [lng, setLng] = useState('77.5946');
  const [zoom, setZoom] = useState('12');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadCities = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/cities');
      setCities(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCities();
  }, []);

  const handleOpenCreate = () => {
    setEditingCity(null);
    setName('');
    setLat('12.9716');
    setLng('77.5946');
    setZoom('12');
    setError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (city) => {
    setEditingCity(city);
    setName(city.name);
    setLat(city.lat.toString());
    setLng(city.lng.toString());
    setZoom(city.zoom.toString());
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('City Name is required.');
      return;
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const zoomLevel = parseInt(zoom);

    if (isNaN(latitude) || isNaN(longitude) || isNaN(zoomLevel)) {
      setError('Invalid coordinates or zoom level values.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const payload = { name, lat: latitude, lng: longitude, zoom: zoomLevel };
      if (editingCity) {
        await api.put(`/api/cities/${editingCity._id}`, payload);
      } else {
        await api.post('/api/cities', payload);
      }
      
      // Notify other pages
      const channel = new BroadcastChannel('citytrack_db_sync');
      channel.postMessage({ type: 'cities' });
      channel.close();

      setModalOpen(false);
      loadCities();
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you absolutely sure you want to delete this city profile? This will break stops/routes assigned to this city!')) return;
    try {
      await api.delete(`/api/cities/${id}`);
      // Notify other pages
      const channel = new BroadcastChannel('citytrack_db_sync');
      channel.postMessage({ type: 'cities' });
      channel.close();
      loadCities();
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
            Manage Cities
          </h1>
        </div>
        <Button onClick={handleOpenCreate} className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider">
          Create City Profile
        </Button>
      </div>

      {loading ? (
        <Spinner size="lg" />
      ) : (
        <div className="card border border-slate-800/80 bg-slate-900 rounded-2xl shadow-xl overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/40 text-slate-400 uppercase font-black tracking-wider text-[9px] border-b border-slate-800 select-none">
                <th className="px-5 py-3.5">Name</th>
                <th className="px-5 py-3.5">Slug</th>
                <th className="px-5 py-3.5">Zoom</th>
                <th className="px-5 py-3.5">GPS Center</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-semibold text-slate-300">
              {cities.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-5 py-8 text-center text-slate-500 font-medium">
                    No cities seeded yet. Create one to get started.
                  </td>
                </tr>
              ) : (
                cities.map((city) => (
                  <tr key={city._id} className="hover:bg-slate-850/30 transition-colors">
                    <td className="px-5 py-4 text-slate-100 font-bold">{city.name}</td>
                    <td className="px-5 py-4 font-mono text-slate-400">{city.slug}</td>
                    <td className="px-5 py-4 font-mono">{city.zoom}</td>
                    <td className="px-5 py-4 font-mono text-slate-400">
                      {city.lat.toFixed(4)}, {city.lng.toFixed(4)}
                    </td>
                    <td className="px-5 py-4 text-right select-none flex justify-end gap-2">
                      <Button
                        onClick={() => handleOpenEdit(city)}
                        variant="ghost"
                        className="py-1.5 px-3 text-[10px] uppercase font-bold border border-slate-800 hover:border-slate-700/80 hover:bg-slate-800/60"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDelete(city._id)}
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
        title={editingCity ? 'Edit City Profile' : 'Create City Profile'}
        className="max-w-md"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-slate-300">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 text-[11px] font-semibold">
              {error}
            </div>
          )}

          <Input
            id="cityName"
            label="City Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Bangalore, Mumbai"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="cityLat"
              label="Center Latitude"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="e.g. 12.9716"
              required
            />
            <Input
              id="cityLng"
              label="Center Longitude"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              placeholder="e.g. 77.5946"
              required
            />
          </div>

          <Input
            id="cityZoom"
            label="Map Zoom Level (10 - 15)"
            value={zoom}
            onChange={(e) => setZoom(e.target.value)}
            placeholder="e.g. 12"
            type="number"
            min="10"
            max="18"
            required
          />

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
              {editingCity ? 'Save Profile' : 'Seed Profile'}
            </Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
