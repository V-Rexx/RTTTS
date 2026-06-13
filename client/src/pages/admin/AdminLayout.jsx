import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Spinner from '../../components/shared/Spinner';

export default function AdminLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Fleet Overview', path: '/admin', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { name: 'Cities', path: '/admin/cities', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { name: 'Routes', path: '/admin/routes', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
    { name: 'Stops', path: '/admin/stops', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
    { name: 'Buses', path: '/admin/buses', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
    { name: 'Drivers', path: '/admin/drivers', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <Spinner size="lg" />
        <span className="text-xs text-slate-400 font-bold uppercase tracking-widest animate-pulse">
          Opening Admin Console...
        </span>
      </div>
    );
  }

  // Security Role Guard
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl max-w-sm flex flex-col gap-3">
          <svg className="w-10 h-10 text-red-400 mx-auto animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="font-extrabold uppercase text-[10px] tracking-widest">Unauthorized Staff Role</span>
          <p className="text-xs text-slate-400 leading-relaxed font-medium">
            This console is strictly restricted to seeded Administrator credentials. Drivers must use the mobile console.
          </p>
        </div>
        <button
          onClick={() => navigate('/login')}
          className="btn-ghost border border-slate-800 hover:border-slate-700 px-5 py-2.5 text-xs select-none uppercase tracking-wider font-bold mt-4"
        >
          Return to Login
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#F8F7F3] flex overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between flex-shrink-0 select-none z-[10] shadow-sm">
        <div className="flex flex-col gap-6">
          {/* Logo Branding */}
          <div className="px-6 py-5 border-b border-slate-850 flex items-center gap-2.5 select-none">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center font-black text-white">
  CT
</div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-black uppercase tracking-wider text-slate-900 font-sans">Fleet Command</span>
              <span className="text-[8px] uppercase tracking-widest font-black text-slate-400 font-mono">
                Role: Administrator
              </span>
            </div>
          </div>

          {/* Links list */}
          <nav className="px-3 flex flex-col gap-1 select-none">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <button
                  key={item.name}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 outline-none ${
                    active
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d={item.icon} />
                  </svg>
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer controls */}
        <div className="p-4 border-t border-slate-850 flex flex-col gap-3">
          <div className="flex items-center gap-2 px-2 select-none">
            <div className="w-7 h-7 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-xs font-black text-emerald-600">
              A
            </div>
            <div className="flex flex-col gap-0.5 text-[9px]">
              <span className="font-bold text-slate-800">Fleet Administrator</span>
              <span className="text-slate-500 font-mono">admin@citytrack.com</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-center py-2 hover:bg-red-50 hover:text-red-500 border border-transparent hover:border-red-200 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-500 transition-all select-none outline-none"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Core Content container */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#F8F7F3]">
        <div className="p-6 md:p-8 max-w-6xl w-full mx-auto flex flex-col gap-6">
          {children}
        </div>
      </main>
    </div>
  );
}
export { AdminLayout };
