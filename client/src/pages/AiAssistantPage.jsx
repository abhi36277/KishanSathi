import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import apiClient from '../services/api';
import VoiceInputButton from '../components/VoiceInputButton';
import { Bot, Send, User, Trash2, ShieldAlert, Sparkles, Volume2, Sprout, Droplets, FlaskConical, Globe } from 'lucide-react';

export default function AiAssistantPage() {
  const { farmer, activeCrop, language, changeLanguage, t } = useApp();
  const location = useLocation();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [lifecycleContext, setLifecycleContext] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Load chat history & lifecycle
  useEffect(() => {
    if (!farmer?.id) return;

    const fetchHistoryAndLifecycle = async () => {
      try {
        const [historyRes, lifecycleRes] = await Promise.allSettled([
          apiClient.get(`/ai/history/${farmer.id}`),
          apiClient.get(`/crop-lifecycle/${farmer.id}`)
        ]);

        if (historyRes.status === 'fulfilled' && historyRes.value?.success && historyRes.value.data?.length > 0) {
          const formatted = historyRes.value.data.map(h => ({
            id: h.id,
            role: h.role,
            text: h.message,
            timestamp: new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            source: h.role === 'assistant' ? 'Grounded Agronomic Engine' : null
          }));
          setMessages(formatted);
        } else {
          // Default Welcome
          const welcomeText = language === 'hi'
            ? `नमस्ते ${farmer.name}! मैं किसान साथी AI हूँ। आपकी ${activeCrop?.crop_name || 'फसल'} और स्थानीय मौसम की जानकारी मेरे पास है। मैं आपकी क्या मदद कर सकता हूँ?`
            : language === 'kn'
            ? `ನಮಸ್ಕಾರ ${farmer.name}! ನಾನು ಕಿಸಾನ್‌ಸಾಥಿ AI. ನಿಮ್ಮ ${activeCrop?.crop_name || 'ಬೆಳೆ'} ಮತ್ತು ಹವಾಮಾನದ ಮಾಹಿತಿ ನನ್ನ ಬಳಿಯಿದೆ. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?`
            : `Hello ${farmer.name}! I am KisanSathi AI. I have your ${activeCrop?.crop_name || 'crop'} and real-time weather in my active context. How can I help your farm today?`;

          setMessages([
            {
              id: 'welcome',
              role: 'assistant',
              text: welcomeText,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              source: 'Grounded Agronomic Context'
            }
          ]);
        }

        if (lifecycleRes.status === 'fulfilled' && lifecycleRes.value?.success && lifecycleRes.value.data?.lifecycle) {
          setLifecycleContext(lifecycleRes.value.data.lifecycle);
        }
      } catch (err) {
        console.warn('Error fetching chat history:', err);
      }
    };

    fetchHistoryAndLifecycle();
  }, [farmer?.id, language]);

  // Handle prefilled question from other pages
  useEffect(() => {
    if (location.state?.prefilledQuestion) {
      sendMessage(location.state.prefilledQuestion);
    }
  }, [location.state]);

  const sendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim() || !farmer?.id) return;

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
        text: `Error: ${err.message || 'Unable to reach AI service. Please check connection.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'Error Handler'
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    if (!farmer?.id) return;
    if (!window.confirm('Are you sure you want to clear your chat history?')) return;
    try {
      await apiClient.delete(`/ai/history/${farmer.id}`);
      setMessages([]);
    } catch (err) {
      console.error('Failed to clear chat:', err);
    }
  };

  const handleSpeechOutput = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#•_-]/g, ' ');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    if (language === 'hi') utterance.lang = 'hi-IN';
    else if (language === 'kn') utterance.lang = 'kn-IN';
    else utterance.lang = 'en-IN';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  const SUGGESTED_QUESTIONS = {
    en: [
      `When should I give the next irrigation for my ${activeCrop?.crop_name || 'crop'}?`,
      'How to identify yellow stem borer damage?',
      'What fertilizer top dressing is due next?',
      'Explain today\'s weather forecast in simple words'
    ],
    hi: [
      `मेरी ${activeCrop?.crop_name || 'फसल'} में अगली सिंचाई कब करनी चाहिए?`,
      'पत्तियों के पीले पड़ने का क्या कारण और उपाय है?',
      'यूरिया खाद की अगली खुराक कब और कैसे दें?',
      'आज के मौसम के अनुसार क्या सावधानी रखनी चाहिए?'
    ],
    kn: [
      `ನನ್ನ ${activeCrop?.crop_name || 'ಬೆಳೆ'}ಗೆ ಮುಂದಿನ ನೀರಾವರಿ ಯಾವಾಗ ನೀಡಬೇಕು?`,
      'ಎಲೆಗಳು ಹಳದಿಯಾಗುತ್ತಿದ್ದರೆ ಏನು ಪರಿಹಾರ?',
      'ಮೇಲುಗೊಬ್ಬರವನ್ನು ಯಾವಾಗ ನೀಡಬೇಕು?',
      'ಇಂದಿನ ಹವಾಮಾನದ ಮುಖ್ಯ ಮುನ್ನೆಚ್ಚರಿಕೆಗಳೇನು?'
    ]
  };

  const currentSuggestions = SUGGESTED_QUESTIONS[language] || SUGGESTED_QUESTIONS.en;

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* Header with active lifecycle memory badge */}
      <div style={{ padding: '0.75rem 1rem', background: '#fff', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--color-primary-light, #e8f5e9)', color: 'var(--primary-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-dark)' }}>
              KisanSathi Multilingual Assistant
            </h2>
            <div style={{ fontSize: '0.75rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
              Active Grounding: {farmer?.name} • {activeCrop?.crop_name} • {farmer?.district}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Trilingual Selector */}
          <div style={{ display: 'flex', background: '#f5f5f5', borderRadius: 8, padding: 2 }}>
            <button
              onClick={() => changeLanguage('en')}
              style={{
                border: 'none',
                background: language === 'en' ? '#2e7d32' : 'transparent',
                color: language === 'en' ? '#fff' : '#444',
                padding: '4px 8px',
                borderRadius: 6,
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              EN
            </button>
            <button
              onClick={() => changeLanguage('hi')}
              style={{
                border: 'none',
                background: language === 'hi' ? '#2e7d32' : 'transparent',
                color: language === 'hi' ? '#fff' : '#444',
                padding: '4px 8px',
                borderRadius: 6,
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              हिंदी
            </button>
            <button
              onClick={() => changeLanguage('kn')}
              style={{
                border: 'none',
                background: language === 'kn' ? '#2e7d32' : 'transparent',
                color: language === 'kn' ? '#fff' : '#444',
                padding: '4px 8px',
                borderRadius: 6,
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              ಕನ್ನಡ
            </button>
          </div>

          <button
            onClick={clearChat}
            className="btn-secondary"
            title="Clear Chat History"
            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
          >
            <Trash2 size={14} /> Clear
          </button>
        </div>
      </div>

      {/* Real-Time Plant Lifecycle Memory Strip */}
      {lifecycleContext && (
        <div style={{
          background: '#f9fbf9',
          borderBottom: '1px solid #e0e0e0',
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          fontSize: '0.78rem',
          color: '#555',
          overflowX: 'auto',
          whiteSpace: 'nowrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Sprout size={14} style={{ color: '#2e7d32' }} />
            <strong>Stage:</strong> {lifecycleContext.current_stage?.name} (Day {lifecycleContext.days_after_sowing})
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Droplets size={14} style={{ color: '#0284c7' }} />
            <strong>Irrigation:</strong> {lifecycleContext.upcoming_milestones?.next_irrigation_due}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <FlaskConical size={14} style={{ color: '#b45309' }} />
            <strong>Fertilizer:</strong> {lifecycleContext.upcoming_milestones?.next_fertilizer_target}
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                gap: '0.6rem',
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '85%'
              }}
            >
              {!isUser && (
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e8f5e9', color: '#2e7d32', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bot size={18} />
                </div>
              )}
              
              <div style={{
                background: isUser ? 'var(--primary-green)' : '#fff',
                color: isUser ? '#fff' : 'var(--text-dark)',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                borderTopRightRadius: isUser ? '2px' : '12px',
                borderTopLeftRadius: isUser ? '12px' : '2px',
                boxShadow: 'var(--shadow-sm)',
                border: isUser ? 'none' : '1px solid var(--border-color)',
                fontSize: '0.92rem',
                lineHeight: 1.5,
                whiteSpace: 'pre-line'
              }}>
                {msg.text}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 6 }}>
                  <div style={{ fontSize: '0.7rem', color: isUser ? '#d1fae5' : '#888' }}>
                    {msg.timestamp} {msg.source && `• ${msg.source}`}
                  </div>

                  {!isUser && (
                    <button
                      type="button"
                      onClick={() => handleSpeechOutput(msg.text)}
                      title="Listen audio"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#2e7d32',
                        cursor: 'pointer',
                        padding: '2px 4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        fontSize: '0.72rem',
                        fontWeight: 600
                      }}
                    >
                      <Volume2 size={14} /> Listen
                    </button>
                  )}
                </div>
              </div>

              {isUser && (
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#d1fae5', color: '#065f46', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User size={18} />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div style={{ display: 'flex', gap: '0.6rem', alignSelf: 'flex-start' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e8f5e9', color: '#2e7d32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={18} />
            </div>
            <div style={{ background: '#fff', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '0.85rem', color: '#666', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={16} className="spin" style={{ color: '#16a34a' }} />
              Grounding response in your crop lifecycle & weather...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      <div style={{ padding: '0.5rem 1rem', background: '#fff', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
          💡 Suggested questions for your {activeCrop?.crop_name || 'crop'}:
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {currentSuggestions.map((q, i) => (
            <button
              key={i}
              type="button"
              onClick={() => sendMessage(q)}
              style={{
                fontSize: '0.78rem',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                padding: '0.35rem 0.65rem',
                borderRadius: '16px',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                color: '#334155'
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input Field with Web Speech Voice Recognition */}
      <div style={{ padding: '0.75rem 1rem', background: '#fff', borderTop: '1px solid var(--border-color)' }}>
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
          style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
        >
          <VoiceInputButton
            onTranscript={(spokenText) => {
              setInputText(spokenText);
              sendMessage(spokenText);
            }}
          />

          <input
            type="text"
            className="form-input"
            style={{ flex: 1, padding: '0.65rem 1rem', borderRadius: '24px' }}
            placeholder={language === 'hi' ? 'अपनी फसल या खाद के बारे में पूछें...' : language === 'kn' ? 'ನಿಮ್ಮ ಬೆಳೆ ಅಥವಾ ಗೊಬ್ಬರದ ಬಗ್ಗೆ ಪ್ರಶ್ನೆ ಕೇಳಿ...' : 'Ask about irrigation, fertilizer, or disease...'}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={loading}
          />

          <button
            type="submit"
            className="btn-primary"
            style={{ borderRadius: '50%', width: 42, height: 42, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            disabled={loading || !inputText.trim()}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
