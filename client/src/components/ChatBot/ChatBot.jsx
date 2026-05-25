import React, { useState, useEffect, useRef } from 'react';
import useChat from '../../hooks/useChat';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import Spinner from '../shared/Spinner';

export default function ChatBot({ citySlug }) {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, sendMessage, loading, streaming } = useChat();
  const chatEndRef = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <div className="absolute bottom-4 right-4 z-[9999] pointer-events-auto flex flex-col items-end">
      {/* Floating Panel */}
      {isOpen && (
        <div className="card glass-panel w-[340px] h-[450px] mb-3 flex flex-col overflow-hidden shadow-2xl border border-slate-800 animate-scale-in">
          {/* Header */}
          <div className="bg-slate-900/90 border-b border-slate-800 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
              <div className="flex flex-col gap-0.5 select-none">
                <span className="text-xs font-bold text-slate-100 uppercase tracking-wider">AI Travel Assistant</span>
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-indigo-400">Gemini Fleet Engine</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-200 transition-colors p-1 hover:bg-slate-800 rounded-lg outline-none"
            >
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-slate-950/20">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4 gap-3 select-none">
                <div className="w-10 h-10 rounded-full bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-md">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="flex flex-col gap-1">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">Live Map Assistant</h4>
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed max-w-[200px]">
                    Ask directions, find the nearest stops, or request details about routes servicing {citySlug.toUpperCase()}.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg, index) => (
                <ChatMessage key={index} message={msg} />
              ))
            )}

            {/* Simulated SSE Typing Loader */}
            {loading && (
              <div className="self-start flex flex-col gap-1 items-start max-w-[85%] select-none">
                <span className="text-[9px] uppercase tracking-widest font-bold text-slate-500 font-mono px-1">CityTrack AI</span>
                <div className="bg-slate-800 border border-slate-700/80 rounded-2xl rounded-tl-none px-4 py-3 flex items-center justify-center">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Form Input */}
          <ChatInput onSend={sendMessage} disabled={loading || streaming} />
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 outline-none ring-4 ring-indigo-600/10 border border-indigo-500 hover:border-indigo-400 select-none"
        aria-label="Toggle chatbot"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>
    </div>
  );
}
export { ChatBot };
