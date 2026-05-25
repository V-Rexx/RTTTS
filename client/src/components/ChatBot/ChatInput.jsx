import React, { useState } from 'react';

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!text.trim() || disabled) return;
    onSend(text);
    setText('');
  };

  const handleKeyDown = (e) => {
    // Enter submits, Shift+Enter adds newline
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-end border-t border-slate-800/80 p-3 bg-slate-900/60 backdrop-blur-sm">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={disabled ? 'Streaming response...' : 'Ask CityTrack AI directions...'}
        rows="1"
        className="flex-1 max-h-24 min-h-[38px] bg-slate-800 border border-slate-700/80 focus:border-indigo-500 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none resize-none transition-all duration-200 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={!text.trim() || disabled}
        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl p-2.5 shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center flex-shrink-0"
        aria-label="Send message"
      >
        <svg className="w-4 h-4 transform rotate-90" fill="currentColor" viewBox="0 0 24 24">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
        </svg>
      </button>
    </form>
  );
}
