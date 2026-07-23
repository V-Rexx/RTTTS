import { useEffect, useState } from 'react';
import api from '../../api/axios';
import Modal from '../../components/admin/Modal';
import { useToast } from '../../context/ToastContext';

const EMPTY_FORM = { name: '', email: '', password: '' };

export default function Drivers() {
  const { showToast } = useToast();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    setLoadError(null);
    api
      .get('/api/auth/drivers')
      .then((res) => setDrivers(res.data.drivers))
      .catch((err) => {
        setDrivers([]);
        setLoadError(err.response?.data?.message || 'Could not reach the server.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || form.password.length < 6) {
      setError('Name, email, and a password of at least 6 characters are required.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await api.post('/api/auth/register', { ...form, role: 'driver' });
      setModalOpen(false);
      load();
      showToast(`Driver account created for ${form.name}.`, 'success');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create driver.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Drivers</h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition"
        >
          + New driver
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3">Name</th>
              <th className="text-left px-5 py-3">Email</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={2} className="px-5 py-6 text-center text-slate-400">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && loadError && (
              <tr>
                <td colSpan={2} className="px-5 py-6 text-center text-red-500">
                  Failed to load drivers. {loadError}
                </td>
              </tr>
            )}
            {!loading && !loadError && drivers.length === 0 && (
              <tr>
                <td colSpan={2} className="px-5 py-6 text-center text-slate-400">
                  No drivers yet.
                </td>
              </tr>
            )}
            {drivers.map((d) => (
              <tr key={d._id}>
                <td className="px-5 py-3 flex items-center gap-2.5">
                  <div
                    style={{ backgroundColor: d.avatarColor }}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                  >
                    {d.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="font-medium text-slate-800">{d.name}</span>
                </td>
                <td className="px-5 py-3 text-slate-500 font-mono text-xs">{d.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Driver">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2">{error}</div>}

          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Full name
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Temporary password
            <input
              type="text"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="min. 6 characters"
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-60"
          >
            {submitting ? 'Creating...' : 'Create driver'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
