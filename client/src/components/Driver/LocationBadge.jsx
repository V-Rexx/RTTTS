import React from 'react';

export default function LocationBadge({ lat, lng, speed, lastSync, active }) {
  return (
    <div className="card p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col gap-4 shadow-xl select-none">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
            Telemetry Feedback
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">GPS Live Coordinates</p>
        </div>
        <span
          className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider select-none ${
            active
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}
        >
          {active ? 'Transmitting' : 'Idle'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Latitude */}
        <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3 flex flex-col gap-1 select-none">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Latitude</span>
          <span className="font-mono text-sm font-black text-slate-200 truncate">
            {lat ? parseFloat(lat).toFixed(6) : '0.000000'}
          </span>
        </div>

        {/* Longitude */}
        <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3 flex flex-col gap-1 select-none">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Longitude</span>
          <span className="font-mono text-sm font-black text-slate-200 truncate">
            {lng ? parseFloat(lng).toFixed(6) : '0.000000'}
          </span>
        </div>

        {/* Speed */}
        <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3 flex flex-col gap-1 col-span-2 select-none">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Simulated Transit Speed</span>
            {active && speed > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            )}
          </div>
          <span className="font-mono text-lg font-black text-indigo-400 flex items-baseline gap-1 select-none">
            {speed || 0}
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">km/h</span>
          </span>
        </div>
      </div>

      {/* Sync Telemetry Time */}
      {lastSync && (
        <div className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider text-right border-t border-slate-800/50 pt-2">
          Sync Ping: <span className="font-mono font-bold text-slate-400">{new Date(lastSync).toLocaleTimeString()}</span>
        </div>
      )}
    </div>
  );
}
