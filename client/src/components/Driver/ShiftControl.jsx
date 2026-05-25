import React, { useState } from 'react';
import Button from '../shared/Button';

export default function ShiftControl({ buses, onStart, onEnd, activeBus, loading }) {
  const [selectedBusId, setSelectedBusId] = useState('');

  const handleStart = () => {
    if (!selectedBusId) return;
    onStart(selectedBusId);
  };

  const isShiftActive = !!activeBus;

  return (
    <div className="card p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col gap-4 shadow-xl select-none">
      <div className="flex flex-col gap-1 border-b border-slate-800 pb-3">
        <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
          Shift Status Control
        </h3>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Telemetry Configuration</p>
      </div>

      {!isShiftActive ? (
        <div className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Select Assigned Fleet Bus
            </label>
            <select
              value={selectedBusId}
              onChange={(e) => setSelectedBusId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg text-sm bg-slate-800 border border-slate-700 focus:border-indigo-500 text-slate-100 placeholder-slate-500 outline-none transition-all duration-200 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="" className="text-slate-500 font-medium">Select a bus...</option>
              {buses.map((bus) => (
                <option key={bus._id} value={bus._id} className="text-slate-100 bg-slate-900">
                  {bus.busNumber} ({bus.plateNumber}) - Route {bus.routeId ? 'Assigned' : 'Unassigned'}
                </option>
              ))}
            </select>
          </div>

          <Button
            onClick={handleStart}
            disabled={!selectedBusId}
            loading={loading}
            className="w-full py-3 hover:scale-[1.01]"
          >
            Start Shift & Broadcast GPS
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3.5 flex items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Active Broadcasting</span>
              <span className="text-xs font-bold text-slate-200">Bus: {activeBus.busNumber}</span>
            </div>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>

          <Button
            onClick={onEnd}
            variant="ghost"
            loading={loading}
            className="w-full py-3 border border-slate-800 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all duration-300"
          >
            End Shift & Stop GPS
          </Button>
        </div>
      )}
    </div>
  );
}
