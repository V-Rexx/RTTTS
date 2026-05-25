import React, { useState } from 'react';
import Button from '../shared/Button';
import Modal from '../shared/Modal';

export default function BreakdownButton({ onTrigger, disabled }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleTrigger = async () => {
    setSubmitting(true);
    try {
      await onTrigger(message || 'Engine breakdown reported by driver.');
      setShowConfirm(false);
      setMessage('');
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="card p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col gap-4 shadow-xl select-none">
        <div className="flex flex-col gap-1 border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
            Emergency Diagnostics
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Breakdown Incident Reporting</p>
        </div>

        <button
          onClick={() => setShowConfirm(true)}
          disabled={disabled}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-red-600/10 hover:shadow-red-600/30 transition-all duration-300 transform active:scale-95 disabled:opacity-30 disabled:pointer-events-none select-none border border-red-500 hover:border-red-400 animate-pulse hover:animate-none flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Report Breakdown
        </button>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Declare Fleet Emergency"
        className="max-w-sm"
      >
        <div className="flex flex-col gap-4 text-slate-300 text-xs">
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 flex gap-2 font-medium select-none">
            <svg className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex flex-col gap-0.5">
              <span className="font-extrabold uppercase text-[10px] tracking-wide text-red-400">Critical Incident Report</span>
              <span>This will immediately flag your bus as inactive (red icon) on all passengers maps and sound fleet alarms.</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Describe Breakdown Reason</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="E.g., Flat tire, overheating, engine fire..."
              rows="3"
              className="w-full bg-slate-800 border border-slate-700/80 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 rounded-lg p-3 outline-none text-slate-100 text-xs resize-none placeholder-slate-500 transition-all duration-200"
            />
          </div>

          <div className="flex gap-2.5 pt-2 border-t border-slate-800/80">
            <Button
              onClick={() => setShowConfirm(false)}
              variant="ghost"
              className="flex-1 py-2.5 border border-slate-800 text-xs font-bold uppercase tracking-wider"
            >
              Cancel
            </Button>
            <Button
              onClick={handleTrigger}
              variant="danger"
              loading={submitting}
              className="flex-1 py-2.5 text-xs font-bold uppercase tracking-wider"
            >
              Broadcast Alarm
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
