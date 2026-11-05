import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import apiClient from '../services/api';
import VoiceInputButton from '../components/VoiceInputButton';
import { Bot, Send, User, Trash2, ShieldAlert, Sparkles, Clock, Globe } from 'lucide-react';

export default function AiAssistantPage() {
  const { farmer, activeCrop, language, changeLanguage, t } = useApp();
  const location = useLocation();

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: `${t.dashboard.welcome}! I am KisanSathi AI. I have your ${activeCrop?.crop_name || 'Rice'} crop and local weather loaded in my context. How may I assist you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'KisanSathi Grounded Context'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Handle prefilled question from Dashboard navigation
  useEffect(() => {
    if (location.state?.prefilledQuestion) {
      sendMessage(location.state.prefilledQuestion);
    }
  }, [location.state]);

  // Load existing chat history from server
  useEffect(() => {
    if (!farmer) return;
    const fetchHistory = async () => {
      try {
        const res = await apiClient.get(`/ai/history/${farmer.id}`);
        if (res.success && res.data && res.data.length > 0) {
          const formatted = res.data.map(h => ({
            id: h.id,
            role: h.role,
            text: h.message,
            timestamp: new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            source: h.role === 'assistant' ? 'Grounded Knowledge' : null
          }));
          setMessages(formatted);
        }
      } catch (err) {
        console.warn('Could not load chat history:', err);
      }
    };
    fetchHistory();
  }, [farmer]);

  const sendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim() || !farmer) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const res = await apiClient.post('/ai/chat', {
        farmerId: farmer.id,
        message: text,
        language
      });

      if (res.success && res.data) {
        const aiMsg = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: res.data.reply,
          timestamp: new Date(res.data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          source: res.data.source
        };
        setMessages(prev => [...prev, aiMsg]);
      }
    } catch (err) {
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: `Error: ${err.message || 'Unable to connect to AI server. Please check connection.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'System'
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceTranscript = (transcript) => {
    setInputText(transcript);
    sendMessage(transcript);
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        text: 'Chat history cleared. How may I help you with your crop today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'KisanSathi Grounded Context'
      }
    ]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 160px)', minHeight: '520px' }}>
      {/* Header with Safety Banner and Language Selector */}
      <div className="card" style={{ marginBottom: '0.75rem', padding: '0.9rem 1.25rem', borderTop: '4px solid var(--primary-green)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-green)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bot size={22} /> {t.ai.title}
            </h1>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Context: {activeCrop?.crop_name || 'Rice'} ({farmer?.district || 'Karnataka'}) • Grounded in ICAR/UASB packages
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#eef5ef', borderRadius: '8px', padding: '2px 8px' }}>
              <Globe size={14} style={{ marginRight: '4px', color: 'var(--primary-green)' }} />
              <select
                value={language}
                onChange={(e) => changeLanguage(e.target.value)}
                style={{ background: 'transparent', border: 'none', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}
              >
                <option value="en">English</option>
                <option value="hi">हिंदी (Hindi)</option>
                <option value="kn">ಕನ್ನಡ (Kannada)</option>
              </select>
            </div>

            <button
              onClick={clearChat}
              className="btn-outline"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
              title="Clear chat"
            >
              <Trash2 size={14} /> Clear
            </button>
          </div>
        </div>

        {/* Safety Guardrail Banner */}
        <div style={{
          marginTop: '0.6rem',
          background: '#fffbeb',
          border: '1px solid #fef3c7',
          borderRadius: '8px',
          padding: '0.45rem 0.75rem',
          fontSize: '0.75rem',
          color: '#92400e',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem'
        }}>
          <ShieldAlert size={14} style={{ flexShrink: 0 }} />
          <span>{t.ai.safetyBanner}</span>
        </div>
      </div>

      {/* Chat Messages Container */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        background: 'white',
        borderRadius: '16px',
        border: '1px solid var(--border-light)',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.9rem'
      }}>
        {messages.map(msg => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div style={{
              maxWidth: '82%',
              background: msg.role === 'user' ? 'var(--primary-green)' : '#f4faf5',
              color: msg.role === 'user' ? 'white' : 'var(--text-dark)',
              padding: '0.85rem 1.1rem',
              borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              border: msg.role === 'user' ? 'none' : '1px solid #d4ebd6',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              fontSize: '0.92rem',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap'
            }}>
              {msg.text}
            </div>

            {/* Metadata / Source & Time Attribution */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '3px', padding: '0 4px' }}>
              <span>{msg.timestamp}</span>
              {msg.source && (
                <>
                  <span>•</span>
                  <span>{msg.source}</span>
                </>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '0.5rem' }}>
            <Sparkles size={16} className="animate-spin" color="var(--primary-green)" />
            <span>Consulting agronomic knowledge & weather model...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Questions */}
      <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', padding: '0.5rem 0', scrollbarWidth: 'none' }}>
        {t.ai.suggestedQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => sendMessage(q)}
            style={{
              background: '#f0f5f0',
              border: '1px solid #d0e0d2',
              borderRadius: '16px',
              padding: '0.35rem 0.75rem',
              fontSize: '0.76rem',
              color: 'var(--primary-green)',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Input Bar with Voice Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
        style={{
          display: 'flex',
          gap: '0.5rem',
          background: 'white',
          padding: '0.5rem',
          borderRadius: '12px',
          border: '1px solid var(--border-light)',
          alignItems: 'center'
        }}
      >
        <VoiceInputButton onTranscript={handleVoiceTranscript} />

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={t.ai.placeholder}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: '0.92rem',
            padding: '0.4rem 0.6rem'
          }}
        />

        <button
          type="submit"
          disabled={!inputText.trim() || loading}
          className="btn-primary"
          style={{ borderRadius: '8px', padding: '0.6rem 1rem' }}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
