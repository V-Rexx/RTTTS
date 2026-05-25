import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import api, { getCitiesFromDb } from '../../lib/api';
import Button from '../../components/shared/Button';
import Input from '../../components/shared/Input';
import Modal from '../../components/shared/Modal';
import Spinner from '../../components/shared/Spinner';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Sub-component to capture click coords on the Leaflet map
function MapClickListener({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function StopsPage() {
  const [stops, setStops] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCitySlug, setSelectedCitySlug] = useState('bangalore');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStop, setEditingStop] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [lat, setLat] = useState('12.9716');
  const [lng, setLng] = useState('77.5946');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const citiesList = getCitiesFromDb();
      setCities(citiesList);
      
      const res = await api.get(`/api/stops?city=${selectedCitySlug}`);
      setStops(res.data);
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
    setEditingStop(null);
    setName('');
    const activeCity = cities.find(c => c.slug === selectedCitySlug) || { lat: 12.9716, lng: 77.5946 };
    setLat(activeCity.lat.toString());
    setLng(activeCity.lng.toString());
    setError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (stop) => {
    setEditingStop(stop);
    setName(stop.name);
    setLat(stop.lat.toString());
    setLng(stop.lng.toString());
    setError(null);
    setModalOpen(true);
  };

  const handleMapSelection = (latitude, longitude) => {
    setLat(latitude.toFixed(6));
    setLng(longitude.toFixed(6));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Stop Name is required.');
      return;
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      setError('Invalid Latitude or Longitude.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const payload = { name, lat: latitude, lng: longitude, city: selectedCitySlug };
      if (editingStop) {
        await api.put(`/api/stops/${editingStop._id}`, payload);
      } else {
        await api.post('/api/stops', payload);
      }
      
      // Notify other pages
      const channel = new BroadcastChannel('citytrack_db_sync');
      channel.postMessage({ type: 'stops' });
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
    if (!window.confirm('Delete this stop? It will remove this stop from all assigned routes!')) return;
    try {
      await api.delete(`/api/stops/${id}`);
      // Notify other pages
      const channel = new BroadcastChannel('citytrack_db_sync');
      channel.postMessage({ type: 'stops' });
      channel.close();
      loadData();
    } catch (e) {
      console.error(e);
      alert('Delete failed.');
    }
  };

  const activeCityDetails = cities.find(c => c.slug === selectedCitySlug) || { lat: 12.9716, lng: 77.5946, zoom: 12 };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between border-b border-slate-850 pb-5 select-none">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-400 font-mono">
            System Control Console
          </span>
          <h1 className="text-2xl font-black text-slate-100 uppercase tracking-wide">
            Manage Stops
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
            Create Transit Stop
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
                <th className="px-5 py-3.5">Name</th>
                <th className="px-5 py-3.5">Assigned Routes Count</th>
                <th className="px-5 py-3.5">GPS Position</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-semibold text-slate-300">
              {stops.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-5 py-8 text-center text-slate-500 font-medium">
                    No stops created for {selectedCitySlug.toUpperCase()} yet.
                  </td>
                </tr>
              ) : (
                stops.map((stop) => (
                  <tr key={stop._id} className="hover:bg-slate-850/30 transition-colors">
                    <td className="px-5 py-4 text-slate-100 font-bold">{stop.name}</td>
                    <td className="px-5 py-4 text-indigo-400 font-bold">{stop.routes?.length || 0} Routes</td>
                    <td className="px-5 py-4 font-mono text-slate-400">
                      {stop.lat.toFixed(5)}, {stop.lng.toFixed(5)}
                    </td>
                    <td className="px-5 py-4 text-right select-none flex justify-end gap-2">
                      <Button
                        onClick={() => handleOpenEdit(stop)}
                        variant="ghost"
                        className="py-1.5 px-3 text-[10px] uppercase font-bold border border-slate-800 hover:border-slate-700/80 hover:bg-slate-800/60"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDelete(stop._id)}
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

      {/* Place Stop Modal with Leaflet Mini Map */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingStop ? 'Edit Transit Stop' : 'Create Transit Stop'}
        className="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-slate-300">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 text-[11px] font-semibold">
              {error}
            </div>
          )}

          <Input
            id="stopName"
            label="Stop Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Silk Board, Majestic"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="stopLat"
              label="Latitude"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="e.g. 12.9176"
              required
            />
            <Input
              id="stopLng"
              label="Longitude"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              placeholder="e.g. 77.6244"
              required
            />
          </div>

          {/* Interactive mini placement map container */}
          <div className="flex flex-col gap-1.5 select-none">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Placer Map (Click map to auto-fill coordinates)
            </span>
            <div className="w-full h-48 border border-slate-800 rounded-xl overflow-hidden z-[1]">
              <MapContainer
                center={[parseFloat(lat) || activeCityDetails.lat, parseFloat(lng) || activeCityDetails.lng]}
                zoom={13}
                className="w-full h-full"
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  className="dark-leaflet-tiles"
                />
                <MapClickListener onMapClick={handleMapSelection} />
                <Marker position={[parseFloat(lat) || activeCityDetails.lat, parseFloat(lng) || activeCityDetails.lng]} />
              </MapContainer>
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
              {editingStop ? 'Save Stop' : 'Place Stop'}
            </Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
