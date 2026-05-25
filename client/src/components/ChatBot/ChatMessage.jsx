import React from 'react';

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';

  // Basic regex parser to handle bold formatting (**text**) and newlines in mock AI replies
  const renderFormattedText = (rawText) => {
    if (!rawText) return null;
    
    return rawText.split('\n').map((line, idx) => {
      const parts = [];
      const boldRegex = /\*\*(.*?)\*\*/g;
      let lastIndex = 0;
      let match;

      while ((match = boldRegex.exec(line)) !== null) {
        // Add preceding normal text
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }
        // Add bolded text
        parts.push(<strong key={match.index} className="font-extrabold text-white">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }

      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }

      return (
        <p key={idx} className={idx > 0 ? 'mt-1.5' : ''}>
          {parts}
        </p>
      );
    });
  };

  return (
    <div className={`flex flex-col max-w-[85%] gap-1 select-none animate-fade-in ${isUser ? 'self-end items-end' : 'self-start items-start'}`}>
      {/* Sender Label */}
      <span className="text-[9px] uppercase tracking-widest font-bold text-slate-500 font-mono px-1">
        {isUser ? 'Passenger' : 'CityTrack AI'}
      </span>

      {/* Bubble Box */}
      <div
        className={`px-4 py-3 rounded-2xl text-xs font-semibold leading-relaxed shadow-md border ${
          isUser
            ? 'bg-indigo-600 border-indigo-500 text-white rounded-tr-none shadow-indigo-600/5'
            : 'bg-slate-800 border-slate-700/80 text-slate-200 rounded-tl-none shadow-slate-900/10'
        }`}
      >
        {renderFormattedText(message.content)}
      </div>

      {/* Timestamp */}
      <span className="text-[8px] text-slate-500 font-mono px-1.5">{message.timestamp}</span>
    </div>
  );
}
