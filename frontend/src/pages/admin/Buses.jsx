import { useEffect, useState } from 'react';
import api from '../../api/axios';
import Modal from '../../components/admin/Modal';
import { useAdminCity } from '../../context/AdminCityContext';

const EMPTY_FORM = { busNumber: '', plateNumber: '', driverId: '', routeId: '' };

export default function Buses() {
  const { cities, citySlug, setCitySlug } = useAdminCity();
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [cityRoutes, setCityRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBus, setEditingBus] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/api/auth/drivers').then((res) => setDrivers(res.data.drivers));
  }, []);

  const load = () => {
    if (!citySlug) return;
    setLoading(true);
    Promise.all([
      api.get(`/api/buses?city=${citySlug}`),
      api.get(`/api/routes?city=${citySlug}`),
    ])
      .then(([busesRes, routesRes]) => {
        setBuses(busesRes.data.buses);
        setCityRoutes(routesRes.data.routes);
      })
      .catch(() => {
        setBuses([]);
        setCityRoutes([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [citySlug]);

  const openCreate = () => {
    setEditingBus(null);
    setForm(EMPTY_FORM);
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (bus) => {
    setEditingBus(bus);
    setForm({
      busNumber: bus.busNumber,
      plateNumber: bus.plateNumber,
      driverId: bus.driver?._id || '',
      routeId: bus.route?._id || '',
    });
    setError(null);
    setModalOpen(true);
  };

  const isFormComplete =
    form.busNumber.trim() && form.plateNumber.trim() && form.driverId && form.routeId;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormComplete) {
      setError('All fields are required — bus number, plate, driver, and route.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      if (editingBus) {
        await api.put(`/api/buses/${editingBus._id}`, form);
      } else {
        await api.post('/api/buses', { ...form, citySlug });
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save bus.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (bus) => {
    if (!window.confirm(`Delete bus ${bus.busNumber}?`)) return;
    try {
      await api.delete(`/api/buses/${bus._id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed.');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Buses</h1>
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
            disabled={!citySlug || cityRoutes.length === 0 || drivers.length === 0}
            title={cityRoutes.length === 0 ? 'Create a route in this city first' : drivers.length === 0 ? 'Create a driver first' : ''}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-50"
          >
            + New bus
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3">Bus</th>
              <th className="text-left px-5 py-3">Plate</th>
              <th className="text-left px-5 py-3">Route</th>
              <th className="text-left px-5 py-3">Driver</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="text-right px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-slate-400">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && buses.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-slate-400">
                  No buses in this city yet.
                </td>
              </tr>
            )}
            {buses.map((bus) => (
              <tr key={bus._id}>
                <td className="px-5 py-3 font-mono text-xs font-semibold text-slate-800">{bus.busNumber}</td>
                <td className="px-5 py-3 text-slate-500 font-mono text-xs">{bus.plateNumber}</td>
                <td className="px-5 py-3 text-slate-700">{bus.route?.routeNumber || '—'}</td>
                <td className="px-5 py-3 text-slate-700">{bus.driver?.name || '—'}</td>
                <td className="px-5 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                      bus.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700'
                        : bus.status === 'breakdown'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {bus.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => openEdit(bus)}
                    className="text-xs font-medium text-slate-600 hover:text-slate-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(bus)}
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingBus ? 'Edit Bus' : 'New Bus'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2">{error}</div>}

          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Bus number
            <input
              value={form.busNumber}
              onChange={(e) => setForm({ ...form, busNumber: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Plate number
            <input
              value={form.plateNumber}
              onChange={(e) => setForm({ ...form, plateNumber: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Route
            <select
              value={form.routeId}
              onChange={(e) => setForm({ ...form, routeId: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm"
            >
              <option value="">Select a route...</option>
              {cityRoutes.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.routeNumber} — {r.routeName}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Driver
            <select
              value={form.driverId}
              onChange={(e) => setForm({ ...form, driverId: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm"
            >
              <option value="">Select a driver...</option>
              {drivers.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name} ({d.email})
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-60"
          >
            {submitting ? 'Saving...' : editingBus ? 'Save changes' : 'Create bus'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
