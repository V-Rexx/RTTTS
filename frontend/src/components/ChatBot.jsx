import { useState } from 'react';
import api from '../api/axios';

export default function ChatBot({ citySlug, onAction }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/api/chat', { message: text, citySlug, history });
      setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
      if (data.action) onAction?.(data.action);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: err.response?.data?.message || "Sorry, I couldn't reach the assistant." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-[1000] flex flex-col items-end gap-3">
      {open && (
        <div className="w-80 h-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-slate-900 text-white">
            <span className="text-sm font-semibold">CityTrack Assistant</span>
            <button onClick={() => setOpen(false)} className="text-slate-300 hover:text-white">
              &times;
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
            {messages.length === 0 && (
              <div className="text-xs text-slate-400 text-center mt-6">
                Ask me about routes, stops, or nearby buses.
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'self-end bg-emerald-600 text-white rounded-br-sm'
                    : 'self-start bg-slate-100 text-slate-800 rounded-bl-sm'
                }`}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="self-start bg-slate-100 text-slate-400 px-3 py-2 rounded-2xl text-xs">
                Thinking...
              </div>
            )}
          </div>

          <form onSubmit={sendMessage} className="p-2.5 border-t border-gray-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-medium disabled:opacity-40"
            >
              Send
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="w-14 h-14 rounded-full bg-slate-900 text-white shadow-xl flex items-center justify-center text-2xl hover:bg-slate-800 transition"
        aria-label="Open chat assistant"
      >
        💬
      </button>
    </div>
  );
}
