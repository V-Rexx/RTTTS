import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Input from '../components/shared/Input';
import Button from '../components/shared/Button';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please provide both email and password.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const loggedUser = await login(email, password);
      if (loggedUser.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/driver');
      }
    } catch (err) {
      setError(err || 'Failed to authenticate. Check credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFillPreset = (pEmail, pPassword) => {
    setEmail(pEmail);
    setPassword(pPassword);
    setError(null);
  };

  return (
    <div className="relative min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-indigo-500/20">
      {/* Background Mesh Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-indigo-600/10 blur-[100px] pointer-events-none" />

      {/* Main card panel */}
      <div className="card max-w-md w-full p-6 md:p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col gap-6 select-none animate-scale-in">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center gap-1.5 border-b border-slate-850 pb-5 select-none">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-slate-100 shadow-lg shadow-indigo-600/30 border border-indigo-500 mb-1">
            CT
          </div>
          <h2 className="text-xl font-bold text-slate-100 uppercase tracking-wide">
            Staff Authentication
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Secure Fleet Controller Portal</p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 flex gap-2 font-medium text-[11px] leading-relaxed select-none">
            <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex flex-col gap-0.5">
              <span className="font-extrabold uppercase text-[9px] tracking-wide text-red-400">Access Denied</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="email"
            type="email"
            label="Staff Email Address"
            placeholder="e.g. driver1@citytrack.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            id="password"
            type="password"
            label="Security Password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button
            type="submit"
            loading={submitting}
            className="w-full py-3 hover:scale-[1.01] mt-2 select-none font-bold uppercase tracking-wider"
          >
            Authorize Access
          </Button>
        </form>

        {/* Demo Preset Panel */}
        <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex flex-col gap-0.5 select-none">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Rapid Sandbox Testing</span>
            <span className="text-[8px] text-slate-500 font-semibold uppercase">Click a preset below to instantly fill credentials</span>
          </div>

          <div className="flex flex-col gap-2">
            {/* Driver Trigger */}
            <button
              onClick={() => handleFillPreset('driver1@citytrack.com', 'password')}
              className="flex items-center justify-between bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-slate-700/80 transition-all rounded-lg p-2.5 outline-none select-none text-[10px]"
            >
              <div className="flex flex-col items-start gap-0.5 font-semibold text-slate-300">
                <span>Driver Panel</span>
                <span className="font-mono text-[9px] font-normal text-slate-500">driver1@citytrack.com</span>
              </div>
              <span className="text-indigo-400 font-bold uppercase tracking-wider">Fill Form</span>
            </button>

            {/* Admin Trigger */}
            <button
              onClick={() => handleFillPreset('admin@citytrack.com', 'admin123')}
              className="flex items-center justify-between bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-slate-700/80 transition-all rounded-lg p-2.5 outline-none select-none text-[10px]"
            >
              <div className="flex flex-col items-start gap-0.5 font-semibold text-slate-300">
                <span>Administrator Dashboard</span>
                <span className="font-mono text-[9px] font-normal text-slate-500">admin@citytrack.com</span>
              </div>
              <span className="text-indigo-400 font-bold uppercase tracking-wider">Fill Form</span>
            </button>
          </div>
        </div>

        {/* Home Back Navigator */}
        <button
          onClick={() => navigate('/')}
          className="text-center text-[10px] uppercase tracking-widest font-black text-slate-500 hover:text-slate-300 transition-colors select-none outline-none py-1"
        >
          Cancel and return home
        </button>
      </div>
    </div>
  );
}
export { LoginPage };
