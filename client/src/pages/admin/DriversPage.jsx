import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import api from '../../lib/api';
import Button from '../../components/shared/Button';
import Input from '../../components/shared/Input';
import Modal from '../../components/shared/Modal';
import Spinner from '../../components/shared/Spinner';

export default function DriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadDrivers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/drivers');
      setDrivers(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  const handleOpenCreate = () => {
    setName('');
    setEmail('');
    setPassword('password123');
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Driver Name and Email are required.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const payload = { name, email, password };
      await api.post('/api/drivers', payload);
      
      // Notify other pages
      const channel = new BroadcastChannel('citytrack_db_sync');
      channel.postMessage({ type: 'drivers' });
      channel.close();

      setModalOpen(false);
      loadDrivers();
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this driver account? Drivers currently on shift will be logged out!')) return;
    try {
      await api.delete(`/api/drivers/${id}`);
      // Notify other pages
      const channel = new BroadcastChannel('citytrack_db_sync');
      channel.postMessage({ type: 'drivers' });
      channel.close();
      loadDrivers();
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
            Manage Drivers
          </h1>
        </div>
        <Button onClick={handleOpenCreate} className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider">
          Create Driver Account
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
                <th className="px-5 py-3.5">Email / Username</th>
                <th className="px-5 py-3.5">Account Role</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-semibold text-slate-300">
              {drivers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-5 py-8 text-center text-slate-500 font-medium">
                    No drivers registered. Create a driver account to get started.
                  </td>
                </tr>
              ) : (
                drivers.map((drv) => (
                  <tr key={drv._id} className="hover:bg-slate-850/30 transition-colors">
                    <td className="px-5 py-4 flex items-center gap-2.5">
                      <div
                        style={{ backgroundColor: drv.avatarColor }}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-slate-950 text-[10px] font-black uppercase shadow select-none"
                      >
                        {drv.name.slice(0, 2)}
                      </div>
                      <span className="text-slate-100 font-bold">{drv.name}</span>
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-400 select-all">{drv.email}</td>
                    <td className="px-5 py-4 font-bold text-indigo-400 uppercase tracking-wider text-[10px]">
                      {drv.role}
                    </td>
                    <td className="px-5 py-4 text-right select-none flex justify-end gap-2">
                      <Button
                        onClick={() => handleDelete(drv._id)}
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

      {/* Create Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Driver Account"
        className="max-w-md"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-slate-300">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 text-[11px] font-semibold select-none">
              {error}
            </div>
          )}

          <Input
            id="driverName"
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Rahul Kumar"
            required
          />

          <Input
            id="driverEmail"
            label="Email Address / Login ID"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. rahul@citytrack.com"
            type="email"
            required
          />

          <Input
            id="driverPassword"
            label="Account Security Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Seed Password"
            type="text"
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
              Seed Account
            </Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
