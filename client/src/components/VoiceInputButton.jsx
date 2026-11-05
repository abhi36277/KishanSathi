import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Mic, MicOff } from 'lucide-react';

export default function VoiceInputButton({ onTranscript, style = {} }) {
  const { language } = useApp();
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setSupported(false);
    }
  }, []);

  const toggleListening = () => {
    if (!supported) {
      alert('Voice input is not supported in this browser. Please type your message.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    // Set correct locale based on active language
    const langCodeMap = {
      en: 'en-IN',
      hi: 'hi-IN',
      kn: 'kn-IN'
    };
    recognition.lang = langCodeMap[language] || 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      return;
    }

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (onTranscript) {
        onTranscript(transcript);
      }
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (e) {
      console.error('Speech recognition start error:', e);
      setIsListening(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleListening}
      className={isListening ? 'btn-primary' : 'btn-outline'}
      style={{
        borderRadius: '50%',
        width: '42px',
        height: '42px',
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isListening ? '#dc2626' : undefined,
        borderColor: isListening ? '#dc2626' : undefined,
        color: isListening ? 'white' : undefined,
        ...style
      }}
      title={isListening ? 'Listening...' : 'Voice Input (en/hi/kn)'}
      aria-label="Voice input button"
    >
      {isListening ? <MicOff size={20} /> : <Mic size={20} />}
    </button>
  );
}
