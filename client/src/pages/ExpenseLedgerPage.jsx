import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import apiClient from '../services/api';
import VoiceInputButton from '../components/VoiceInputButton';
import { Wallet, Plus, TrendingDown, Tag, Calendar, Mic } from 'lucide-react';

export default function ExpenseLedgerPage() {
  const { farmer, t } = useApp();
  const [expenses, setExpenses] = useState([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [categoryTotals, setCategoryTotals] = useState({});
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchExpenses = async () => {
    if (!farmer) return;
    try {
      setLoading(true);
      const res = await apiClient.get(`/expenses/${farmer.id}`);
      if (res.success && res.data) {
        setExpenses(res.data.expenses || []);
        setTotalSpent(res.data.totalSpent || 0);
        setCategoryTotals(res.data.categoryTotals || {});
      }
    } catch (err) {
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [farmer]);

  const handleAddExpense = async (transcriptText) => {
    const text = transcriptText || inputText;
    if (!text.trim() || !farmer) return;

    try {
      setSubmitting(true);
      const res = await apiClient.post('/expenses', {
        farmerId: farmer.id,
        transcript: text
      });
      if (res.success && res.data) {
        setInputText('');
        fetchExpenses();
      }
    } catch (err) {
      alert(`Could not log expense: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVoice = (transcript) => {
    setInputText(transcript);
    handleAddExpense(transcript);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div className="card" style={{ borderTop: '4px solid #b45309' }}>
        <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Wallet size={24} color="#b45309" /> {t.expenses.title}
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {t.expenses.subtitle}
        </p>

        {/* Voice & Text Expense Input */}
        <div style={{
          marginTop: '1.25rem',
          background: '#fffbeb',
          padding: '1rem',
          borderRadius: '12px',
          border: '1px solid #fde68a'
        }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <VoiceInputButton onTranscript={handleVoice} />

            <input
              type="text"
              className="form-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t.expenses.typePlaceholder}
              style={{ flex: 1 }}
            />

            <button
              onClick={() => handleAddExpense()}
              disabled={!inputText.trim() || submitting}
              className="btn-primary"
              style={{ background: '#b45309', padding: '0.65rem 1.25rem' }}
            >
              {submitting ? 'Parsing...' : t.expenses.addBtn}
            </button>
          </div>

          <div style={{ fontSize: '0.75rem', color: '#92400e', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Mic size={13} />
            <span>Try speaking: "bought 2 bags of urea for 850 rupees" or "paid 600 rupees for weeding labor"</span>
          </div>
        </div>
      </div>

      {/* Expense Summary Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ background: '#fef2f2', borderColor: '#fecaca', marginBottom: 0 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#991b1b' }}>
            {t.expenses.totalSpent}
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#991b1b', marginTop: '0.3rem' }}>
            ₹{totalSpent.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Recorded production investments
          </div>
        </div>

        {/* Category Breakdown Cards */}
        {Object.entries(categoryTotals).map(([cat, amount]) => (
          <div key={cat} className="card" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                {cat}
              </span>
              <Tag size={15} color="var(--primary-green)" />
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-dark)', marginTop: '0.3rem' }}>
              ₹{amount.toLocaleString('en-IN')}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Expense History */}
      <div className="card">
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.75rem' }}>
          {t.expenses.recentExpenses}
        </h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
            Loading ledger...
          </div>
        ) : expenses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
            No expenses recorded yet. Speak or type above to add.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {expenses.map(item => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  border: '1px solid var(--border-light)',
                  borderRadius: '8px',
                  background: 'white'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                    {item.description}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '0.75rem', marginTop: '2px' }}>
                    <span className="badge badge-medium" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>{item.category}</span>
                    <span>📅 {item.expense_date}</span>
                    {item.voice_transcript && <span>🎙️ Spoken: "{item.voice_transcript}"</span>}
                  </div>
                </div>

                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#991b1b' }}>
                  ₹{parseFloat(item.amount).toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
