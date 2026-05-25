import React from 'react';
import { useNavigate } from 'react-router-dom';
import CitySearch from '../components/Search/CitySearch';

export default function LandingPage() {
  const navigate = useNavigate();

  const handleCitySelect = (item) => {
    if (item.type === 'city') {
      navigate(`/city/${item.slug}`);
    } else {
      // If it's a general address place from Nominatim, redirect to the closest seeded city (Bangalore)
      // and center the map around this coordinate!
      navigate(`/city/bangalore?lat=${item.lat}&lng=${item.lng}&zoom=${item.zoom}`);
    }
  };

  const handleQuickCity = (slug) => {
    navigate(`/city/${slug}`);
  };

  return (
    <div className="relative min-h-screen bg-slate-950 flex flex-col justify-between overflow-x-hidden selection:bg-indigo-500/20">
      {/* Glow Backdrops */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="px-6 md:px-12 py-6 border-b border-slate-900 bg-slate-950/60 backdrop-blur-md sticky top-0 z-[4000] flex items-center justify-between">
        <div className="flex items-center gap-2.5 select-none">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-slate-100 shadow-lg shadow-indigo-600/30 border border-indigo-500">
            CT
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-extrabold uppercase tracking-widest text-slate-100 font-sans">CityTrack</span>
            <span className="text-[9px] uppercase tracking-widest font-black text-slate-500">Real-Time Fleet Console</span>
          </div>
        </div>
        <button
          onClick={() => navigate('/login')}
          className="btn-ghost border border-slate-800 hover:border-slate-700 hover:bg-slate-800 px-4 py-2 text-xs uppercase tracking-wider select-none font-bold"
        >
          Staff Console
        </button>
      </header>

      {/* Main Content Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 md:px-8 py-16 gap-10 z-[10]">
        <div className="max-w-2xl w-full text-center flex flex-col gap-5 select-none">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400 font-mono animate-fade-in">
            Seamless Commute Infrastructure
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-50 tracking-tight leading-none uppercase">
            Track Your City <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-indigo-500 to-emerald-400">
              Buses Live.
            </span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 max-w-lg mx-auto font-medium leading-relaxed">
            Zero friction, zero registration. Search your destination, view glowing active routes, estimate coordinates, and chat with AI in under 3 seconds.
          </p>
        </div>

        {/* Debounced Search box overlay */}
        <CitySearch onSelect={handleCitySelect} />

        {/* Quick Access Grid */}
        <div className="flex flex-col gap-4 max-w-lg w-full text-center select-none pt-4">
          <span className="text-[10px] uppercase tracking-widest font-black text-slate-500">Popular Seeded Hubs</span>
          <div className="grid grid-cols-2 gap-4">
            {/* Bangalore */}
            <button
              onClick={() => handleQuickCity('bangalore')}
              className="card bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700/80 p-5 rounded-2xl flex flex-col items-start text-left gap-1.5 shadow-lg shadow-slate-950/20 hover:scale-[1.02] transition-all duration-300 outline-none group"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-sm font-bold text-slate-100 uppercase tracking-wide group-hover:text-indigo-400 transition-colors">Bangalore</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">
                3 Routes · 14 Stops · Live GPS
              </span>
            </button>

            {/* Mumbai */}
            <button
              onClick={() => handleQuickCity('mumbai')}
              className="card bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700/80 p-5 rounded-2xl flex flex-col items-start text-left gap-1.5 shadow-lg shadow-slate-950/20 hover:scale-[1.02] transition-all duration-300 outline-none group"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-sm font-bold text-slate-100 uppercase tracking-wide group-hover:text-indigo-400 transition-colors">Mumbai</span>
                <span className="w-2 h-2 rounded-full bg-slate-500" />
              </div>
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500">
                No active fleets currently
              </span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-slate-900 text-center select-none text-[10px] text-slate-500 font-bold uppercase tracking-wider bg-slate-950/80 backdrop-blur-md">
        CityTrack App &copy; {new Date().getFullYear()} &middot; Built with premium Web Components
      </footer>
    </div>
  );
}
export { LandingPage };
