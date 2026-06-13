import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import api, { getCitiesFromDb, getRoutesFromDb, getDriversFromDb } from '../../lib/api';
import Button from '../../components/shared/Button';
import Input from '../../components/shared/Input';
import Modal from '../../components/shared/Modal';
import Spinner from '../../components/shared/Spinner';

export default function BusesPage() {
  const [buses, setBuses] = useState([]);
  const [cities, setCities] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [selectedCitySlug, setSelectedCitySlug] = useState('bangalore');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBus, setEditingBus] = useState(null);

  // Form states
  const [busNumber, setBusNumber] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const citiesList = getCitiesFromDb();
      setCities(citiesList);

      const driversList = getDriversFromDb();
      setDrivers(driversList);

      const routesList = getRoutesFromDb().filter(r => r.city === selectedCitySlug);
      setRoutes(routesList);

      const res = await api.get(`/api/buses?city=${selectedCitySlug}`);
      
      // Resolve driver and route names in local state
      const resolved = res.data.map(bus => {
        const drv = driversList.find(d => d._id === bus.driverId);
        const rte = routesList.find(r => r._id === bus.routeId);
        return {
          ...bus,
          driverName: drv ? drv.name : 'None Assigned',
          routeNumber: rte ? rte.routeNumber : 'None Assigned'
        };
      });
      setBuses(resolved);
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
    setEditingBus(null);
    setBusNumber('');
    setPlateNumber('');
    setSelectedDriverId('');
    setSelectedRouteId('');
    setError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (bus) => {
    setEditingBus(bus);
    setBusNumber(bus.busNumber);
    setPlateNumber(bus.plateNumber);
    setSelectedDriverId(bus.driverId || '');
    setSelectedRouteId(bus.routeId || '');
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!busNumber.trim() || !plateNumber.trim()) {
      setError('Bus identifier and Plate number are required.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        busNumber,
        plateNumber,
        driverId: selectedDriverId || null,
        routeId: selectedRouteId || null,
        city: selectedCitySlug
      };

      if (editingBus) {
        await api.put(`/api/buses/${editingBus._id}`, payload);
      } else {
        await api.post('/api/buses', payload);
      }

      // Notify other pages
      const channel = new BroadcastChannel('citytrack_db_sync');
      channel.postMessage({ type: 'buses' });
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
    if (!window.confirm('Are you sure you want to delete this bus record from the fleet database?')) return;
    try {
      await api.delete(`/api/buses/${id}`);
      // Notify other pages
      const channel = new BroadcastChannel('citytrack_db_sync');
      channel.postMessage({ type: 'buses' });
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
            Manage Buses
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
            Create Fleet Bus
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
                <th className="px-5 py-3.5">Bus Num</th>
                <th className="px-5 py-3.5">Plate License</th>
                <th className="px-5 py-3.5">Assigned Route</th>
                <th className="px-5 py-3.5">Assigned Driver</th>
                <th className="px-5 py-3.5">Operational Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-semibold text-slate-300">
              {buses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-8 text-center text-slate-500 font-medium">
                    No buses registered for {selectedCitySlug.toUpperCase()} yet.
                  </td>
                </tr>
              ) : (
                buses.map((bus) => (
                  <tr key={bus._id} className="hover:bg-slate-850/30 transition-colors">
                    <td className="px-5 py-4">
  <div className="flex flex-col">
    <span className="font-extrabold text-slate-100 font-mono">
      {bus.busNumber}
    </span>
    <span className="text-[10px] text-slate-500 uppercase tracking-wider">
      Fleet Unit
    </span>
  </div>
</td>
                    <td className="px-5 py-4 font-mono text-slate-400">{bus.plateNumber}</td>
                    <td className="px-5 py-4">
  <div className="inline-flex items-center gap-2">
    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
    <span className="font-bold text-indigo-400">
      {bus.routeNumber}
    </span>
  </div>
</td>
                    <td className="px-5 py-4">
  <div className="flex items-center gap-2">
    <div className="w-7 h-7 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-[10px] font-black text-indigo-400">
      {bus.driverName?.slice(0,2)}
    </div>

    <span className="font-semibold text-slate-100">
      {bus.driverName}
    </span>
  </div>
</td>
                    <td className="px-5 py-4 select-none">
                      <span
  className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
    bus.status === 'active'
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      : bus.status === 'breakdown'
      ? 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse'
      : 'bg-slate-800 text-slate-400 border-slate-700'
  }`}
>
  {bus.status}
</span>
                    </td>
                    <td className="px-5 py-4 text-right select-none flex justify-end gap-2">
                      <Button
                        onClick={() => handleOpenEdit(bus)}
                        variant="ghost"
                        className="py-1.5 px-3 text-[10px] uppercase font-bold border border-slate-800 hover:border-slate-700/80 hover:bg-slate-800/60"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDelete(bus._id)}
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
        title={editingBus ? 'Edit Fleet Bus' : 'Create Fleet Bus'}
        className="max-w-md"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-slate-300">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 text-[11px] font-semibold select-none">
              {error}
            </div>
          )}

          <Input
            id="busNumber"
            label="Bus Identifier / Internal Code"
            value={busNumber}
            onChange={(e) => setBusNumber(e.target.value)}
            placeholder="e.g. KA-01-F-1234"
            required
          />

          <Input
            id="plateNumber"
            label="License Plate Number"
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value)}
            placeholder="e.g. KA-01-F-1234"
            required
          />

          <div className="flex flex-col gap-1.5 select-none">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Assign Route
            </label>
            <select
              value={selectedRouteId}
              onChange={(e) => setSelectedRouteId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg text-sm bg-slate-800 border border-slate-700 focus:border-indigo-500 text-slate-200 outline-none transition-all"
            >
              <option value="" className="text-slate-500 font-medium">None Assigned</option>
              {routes.map(r => (
                <option key={r._id} value={r._id} className="text-slate-100 bg-slate-900">
                  Route {r.routeNumber} ({r.name})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5 select-none">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Assign Driver
            </label>
            <select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg text-sm bg-slate-800 border border-slate-700 focus:border-indigo-500 text-slate-200 outline-none transition-all"
            >
              <option value="" className="text-slate-500 font-medium">None Assigned</option>
              {drivers.map(d => (
                <option key={d._id} value={d._id} className="text-slate-100 bg-slate-900">
                  {d.name} ({d.email})
                </option>
              ))}
            </select>
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
              {editingBus ? 'Save Fleet' : 'Seed Fleet'}
            </Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
