import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import apiClient from '../services/api';
import { RefreshCw, AlertTriangle, CheckCircle, HelpCircle, X, Calendar } from 'lucide-react';

export default function MissedTaskModal({ task, isOpen, onClose, onTaskUpdated }) {
  const { t, farmer } = useApp();
  const [selectedReason, setSelectedReason] = useState(t.missedModal.reasonOptions[0]);
  const [customReason, setCustomReason] = useState('');
  const [postponeDays, setPostponeDays] = useState(2);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen || !task) return null;

  const handleRecalculate = async () => {
    try {
      setLoading(true);
      setError(null);
      const finalReason = customReason.trim() ? `${selectedReason} - ${customReason}` : selectedReason;

      const res = await apiClient.post('/action-plan/recover-missed', {
        farmerId: farmer?.id,
        taskId: task.id,
        reason: finalReason,
        postponeDays: parseInt(postponeDays, 10)
      });

      if (res.success && res.data) {
        setResult(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to recalculate adaptive schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (onTaskUpdated) {
      onTaskUpdated(result);
    }
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        maxWidth: '540px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '1.5rem',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
      }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-green)' }}>
              {t.missedModal.title}
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {t.missedModal.subtitle}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Selected Task Summary */}
        <div style={{ background: '#f4faf5', padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1.25rem', borderLeft: '3px solid var(--primary-green)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            {t.missedModal.taskLabel}
          </div>
          <div style={{ fontWeight: 700, color: 'var(--text-dark)', marginTop: '2px' }}>
            {task.task_title}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {task.task_description}
          </div>
        </div>

        {!result ? (
          <div>
            {/* Reason Selection */}
            <div className="form-group">
              <label className="form-label">{t.missedModal.reasonLabel}</label>
              <select
                className="form-select"
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
              >
                {t.missedModal.reasonOptions.map((opt, i) => (
                  <option key={i} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Custom Notes */}
            <div className="form-group">
              <textarea
                className="form-textarea"
                rows={2}
                placeholder={t.missedModal.customReasonPlaceholder}
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
              />
            </div>

            {/* Postpone Slider / Select */}
            <div className="form-group">
              <label className="form-label">{t.missedModal.postponeDaysLabel}: <strong>{postponeDays} days</strong></label>
              <input
                type="range"
                min="1"
                max="7"
                value={postponeDays}
                onChange={(e) => setPostponeDays(e.target.value)}
                style={{ width: '100%', accentColor: 'var(--primary-green)' }}
              />
            </div>

            {error && (
              <div style={{ color: 'var(--danger-red)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            <button
              onClick={handleRecalculate}
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', padding: '0.75rem' }}
            >
              {loading ? (
                <span>Checking Weather & Agronomic Rules...</span>
              ) : (
                <>
                  <RefreshCw size={16} />
                  <span>{t.missedModal.submit}</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* Result Card */
          <div>
            <div style={{
              background: result.action === 'REFER_TO_EXPERT' ? '#fef2f2' : result.action === 'MODIFY' ? '#fffbeb' : '#f0fdf4',
              border: `1px solid ${result.action === 'REFER_TO_EXPERT' ? '#f87171' : result.action === 'MODIFY' ? '#fbbf24' : '#86efac'}`,
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.25rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {result.action === 'REFER_TO_EXPERT' ? (
                  <AlertTriangle size={20} color="#dc2626" />
                ) : (
                  <CheckCircle size={20} color="var(--primary-green)" />
                )}
                <span style={{
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  color: result.action === 'REFER_TO_EXPERT' ? '#991b1b' : 'var(--primary-green)'
                }}>
                  {result.action}: {result.stageGrounded} Stage Evaluation
                </span>
              </div>

              <p style={{ fontSize: '0.88rem', color: '#1f2937', marginBottom: '0.75rem' }}>
                {result.explanation}
              </p>

              {result.alternativeSuggestion && (
                <div style={{ fontSize: '0.82rem', background: 'rgba(255,255,255,0.7)', padding: '0.5rem', borderRadius: '6px', marginBottom: '0.5rem' }}>
                  <strong>{t.missedModal.alternative}:</strong> {result.alternativeSuggestion}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <Calendar size={14} />
                <span>{t.missedModal.newDate}: <strong>{result.newDueDate}</strong></span>
              </div>
            </div>

            <button
              onClick={handleApply}
              className="btn-primary"
              style={{ width: '100%', padding: '0.75rem' }}
            >
              {t.missedModal.close}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
