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
    <div className="relative min-h-screen bg-slate-950 overflow-hidden flex flex-col items-center justify-center p-4 selection:bg-indigo-500/20">
      {/* Background Mesh Glows */}
     {/* Background Grid */}
<div className="absolute inset-0 opacity-[0.03]">
  <div
    className="w-full h-full"
    style={{
      backgroundImage:
        "linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)",
      backgroundSize: "40px 40px",
    }}
  />
</div>

{/* Ambient Glow */}
<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-indigo-600/10 blur-[180px] pointer-events-none" />

      {/* Main card panel */}
      <div className="relative max-w-lg w-full p-8 md:p-10 bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl flex flex-col gap-6 select-none animate-scale-in">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center gap-1.5 border-b border-slate-850 pb-5 select-none">
          <div className="relative mb-2">
  <div className="absolute inset-0 bg-amber-500 blur-xl opacity-40 rounded-xl" />

  <div className="relative w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center font-black text-white text-lg border border-amber-400 shadow-xl shadow-amber-500/20">
    CT
  </div>
</div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10">
    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
      Fleet Network Online
    </span>
  </div>
          <h2 className="text-3xl font-black text-white uppercase tracking-[0.12em]">
  Fleet Command
</h2>
          <p className="text-xs text-slate-500 uppercase tracking-[0.25em] font-semibold">
  Real-Time Transit Operations Center
  
</p>
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
