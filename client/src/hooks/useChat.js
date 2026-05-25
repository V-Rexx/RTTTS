import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api';

export default function useChat() {
  const { slug } = useParams();
  const citySlug = slug || 'bangalore';
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || loading || streaming) return;

    // 1. Add user message
    const userMsg = {
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      // Create chat history shape
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      
      // Make REST call to our Mock API
      const response = await api.post('/api/chat', {
        message: text,
        citySlug,
        history
      });

      const { responseText } = response.data;

      // 2. Emulate SSE progressive stream (typewriter effect)
      // Set up a blank assistant bubble
      const assistantMsgId = Math.random().toString(36).substr(2, 9);
      const assistantMsg = {
        _id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
      setLoading(false);
      setStreaming(true);

      // Separate action tokens from the human response
      const actionRegex = /ACTION:\s*([a-zA-Z0-9_-]+)(?::([^\r\n]+))?/g;
      const cleanText = responseText.replace(actionRegex, '').trim();
      
      // Extract all actions
      const actions = [];
      let match;
      // Re-run regex to find all actions
      const tempRegex = new RegExp(actionRegex);
      while ((match = tempRegex.exec(responseText)) !== null) {
        actions.push({
          type: match[1],
          value: match[2] ? match[2].trim() : null
        });
      }

      // Stream clean text token by token (or character by character)
      let currentIdx = 0;
      const intervalSpeed = 15; // ms per character
      
      const streamTimer = setInterval(() => {
        if (currentIdx < cleanText.length) {
          const nextChar = cleanText[currentIdx];
          setMessages(prev => 
            prev.map(m => 
              m._id === assistantMsgId 
                ? { ...m, content: m.content + nextChar } 
                : m
            )
          );
          currentIdx++;
        } else {
          clearInterval(streamTimer);
          setStreaming(false);

          // Stream complete! Now execute any parsed map Action Tokens.
          if (actions.length > 0) {
            actions.forEach(action => {
              console.log('Executing AI Map Action:', action);
              // Broadcast the action through window events for the Map/Page to capture
              const event = new CustomEvent('citytrack_map_action', { detail: action });
              window.dispatchEvent(event);
            });
          }
        }
      }, intervalSpeed);

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I am having trouble connecting to my service. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setLoading(false);
      setStreaming(false);
    }
  }, [citySlug, messages, loading, streaming]);

  const clearHistory = useCallback(() => {
    setMessages([]);
    setStreaming(false);
  }, []);

  return { messages, sendMessage, loading, streaming, clearHistory };
}
