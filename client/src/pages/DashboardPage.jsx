import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import apiClient from '../services/api';
import WeatherCard from '../components/WeatherCard';
import MissedTaskModal from '../components/MissedTaskModal';
import { 
  Sprout, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  Circle, 
  AlertTriangle, 
  Bot, 
  ArrowRight, 
  Clock, 
  Layers,
  ChevronRight,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';

export default function DashboardPage() {
  const { farmer, activeCrop, t, isDemo } = useApp();
  const navigate = useNavigate();

  const [weather, setWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [stageInfo, setStageInfo] = useState(null);
  const [pestAlerts, setPestAlerts] = useState([]);
  const [selectedMissedTask, setSelectedMissedTask] = useState(null);

  // Load weather, plan, and pest alerts
  useEffect(() => {
    if (!farmer) return;

    // 1. Weather
    const loadWeather = async () => {
      try {
        setLoadingWeather(true);
        const res = await apiClient.get(`/weather?lat=${farmer.latitude}&lon=${farmer.longitude}`);
        if (res.success) setWeather(res.data);
      } catch (err) {
        console.error('Weather error:', err);
      } finally {
        setLoadingWeather(false);
      }
    };

    // 2. Action Plan
    const loadPlan = async () => {
      try {
        setLoadingTasks(true);
        const res = await apiClient.get(`/action-plan/${farmer.id}`);
        if (res.success && res.data) {
          setTasks(res.data.tasks || []);
          if (res.data.growth_stage) {
            setStageInfo({ stageName: res.data.growth_stage });
          }
        }
      } catch (err) {
        console.error('Plan error:', err);
      } finally {
        setLoadingTasks(false);
      }
    };

    // 3. Pest Alerts
    const loadPests = async () => {
      try {
        const res = await apiClient.get(`/pest-alerts?district=${farmer.district}`);
        if (res.success) setPestAlerts(res.data || []);
      } catch (e) {
        console.error('Pest alert error:', e);
      }
    };

    loadWeather();
    loadPlan();
    loadPests();
  }, [farmer]);

  const toggleTask = async (taskId, currentStatus) => {
    try {
      const res = await apiClient.patch(`/action-plan/${taskId}`, {
        completed: !currentStatus
      });
      if (res.success) {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !currentStatus } : t));
      }
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const handleTaskRescheduled = (decision) => {
    if (decision?.newDueDate) {
      setTasks(prev => prev.map(t => t.id === decision.taskId ? { ...t, due_date: decision.newDueDate, reason: `${t.reason} (Rescheduled)` } : t));
    }
  };

  // Calculate Progress & Days After Sowing (DAS)
  let daysAfterSowing = 0;
  let progressPercent = 35;
  if (activeCrop?.sowing_date) {
    const diff = Date.now() - new Date(activeCrop.sowing_date).getTime();
    daysAfterSowing = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
    progressPercent = Math.min(100, Math.round((daysAfterSowing / 130) * 100));
  }

  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. Farmer Welcome Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)',
        color: 'white',
        border: 'none',
        padding: '1.5rem',
        borderRadius: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#c8e6c9', fontWeight: 600 }}>
              {t.dashboard.welcome}, {farmer?.name || 'Farmer Partner'}
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '0.2rem' }}>
              {farmer?.village ? `${farmer.village}, ` : ''}{farmer?.district}, {farmer?.state}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem', fontSize: '0.88rem', color: '#e8f5e9', flexWrap: 'wrap' }}>
              <span>🌱 Active Crop: <strong>{activeCrop?.crop_name || 'Rice'}</strong> ({activeCrop?.variety || 'Local Standard'})</span>
              <span>🌾 Farm Size: <strong>{farmer?.farms?.[0]?.area_acres || 2.5} {t.dashboard.acres}</strong></span>
              <span>📅 {t.dashboard.sowingDate}: <strong>{activeCrop?.sowing_date || 'N/A'}</strong> ({daysAfterSowing} days ago)</span>
            </div>
          </div>

          <Link
            to="/ai-chat"
            className="btn-secondary"
            style={{
              background: 'white',
              color: 'var(--primary-green)',
              fontWeight: 700,
              fontSize: '0.85rem',
              padding: '0.6rem 1rem'
            }}
          >
            <Bot size={18} />
            <span>{t.dashboard.quickChat}</span>
          </Link>
        </div>
      </div>

      {/* 2. Regional Pest Alerts (if any in district) */}
      {pestAlerts.length > 0 && (
        <div style={{
          background: '#fff1f2',
          borderLeft: '4px solid #e11d48',
          borderRadius: '10px',
          padding: '0.9rem 1.2rem',
          display: 'flex',
          gap: '0.8rem',
          alignItems: 'center'
        }}>
          <ShieldAlert size={22} color="#e11d48" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <strong style={{ color: '#9f1239', fontSize: '0.9rem' }}>
              {t.dashboard.pestAlerts}: {pestAlerts[0].pest_or_disease} on {pestAlerts[0].crop_affected}
            </strong>
            <p style={{ fontSize: '0.82rem', color: '#881337', marginTop: '2px' }}>
              {pestAlerts[0].alert_message}
            </p>
          </div>
        </div>
      )}

      {/* 3. Top Row: Growth Stage Progress & Weather Card */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {/* Crop Growth Stage Progress Bar */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                {t.dashboard.currentStage}
              </span>
              <span className="badge badge-success">Day {daysAfterSowing} of 130</span>
            </div>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary-green)', marginBottom: '0.3rem' }}>
              {stageInfo?.stageName || activeCrop?.growth_stage || 'Tillering Stage'}
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Source: UAS Bangalore / ICAR Package of Practices
            </p>

            {/* Interactive Progress Bar */}
            <div style={{ marginTop: '1.25rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '0.3rem' }}>
                <span>{t.dashboard.progress}</span>
                <span>{progressPercent}% Complete</span>
              </div>
              <div style={{ height: '10px', background: '#e2ece3', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${progressPercent}%`,
                  background: 'linear-gradient(90deg, #4caf50, #1b5e20)',
                  borderRadius: '999px',
                  transition: 'width 0.5s ease'
                }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Key Focus: Shallow water maintenance & nutrient uptake
            </span>
            <Link to="/crops" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary-green)', display: 'flex', alignItems: 'center', gap: '2px' }}>
              Details <ChevronRight size={15} />
            </Link>
          </div>
        </div>

        {/* Hyperlocal Weather Card */}
        <WeatherCard weather={weather} loading={loadingWeather} />
      </div>

      {/* 4. Signature Feature: Today's Action Plan Checklist */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-dark)' }}>
              {t.dashboard.todayPlan}
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Deterministic daily agronomic rules based on current crop stage & real-time weather
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="badge badge-success" style={{ fontSize: '0.8rem' }}>
              {completedCount} / {tasks.length} {t.dashboard.completed}
            </span>
            <Link to="/action-plan" className="btn-outline" style={{ fontSize: '0.82rem', padding: '0.4rem 0.8rem' }}>
              {t.dashboard.viewAllTasks} <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        {loadingTasks ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            Generating today's agronomic action plan...
          </div>
        ) : tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            No tasks registered for today.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {tasks.map(task => (
              <div
                key={task.id}
                style={{
                  background: task.completed ? '#f9fcf9' : 'white',
                  border: `1px solid ${task.completed ? '#d1e7d4' : 'var(--border-light)'}`,
                  borderRadius: '12px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.9rem',
                  opacity: task.completed ? 0.75 : 1
                }}
              >
                {/* Complete Checkbox */}
                <button
                  onClick={() => toggleTask(task.id, task.completed)}
                  style={{
                    background: 'none',
                    color: task.completed ? 'var(--primary-green)' : '#9ca3af',
                    marginTop: '2px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title={task.completed ? 'Mark pending' : 'Mark completed'}
                >
                  {task.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                </button>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                    <span className={`badge badge-${task.priority}`}>
                      {task.priority} priority
                    </span>
                    <strong style={{
                      fontSize: '0.98rem',
                      color: task.completed ? 'var(--text-muted)' : 'var(--text-dark)',
                      textDecoration: task.completed ? 'line-through' : 'none'
                    }}>
                      {task.task_title}
                    </strong>
                  </div>

                  <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '0.4rem' }}>
                    {task.task_description}
                  </p>

                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <span><strong>Why:</strong> {task.reason}</span>
                    <span><strong>Basis:</strong> {task.source}</span>
                  </div>
                </div>

                {/* Adaptive Recalculation Button for Missed Tasks */}
                {!task.completed && (
                  <button
                    onClick={() => setSelectedMissedTask(task)}
                    className="btn-outline"
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', flexShrink: 0 }}
                  >
                    {t.actionPlan.missedBtn}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Quick AI Agronomy Prompts */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
          <Bot size={22} color="var(--primary-green)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-dark)' }}>
            {t.dashboard.quickChat}
          </h3>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
          Ask in Kannada, Hindi, or English. Replies are automatically grounded in your {activeCrop?.crop_name} crop and today's weather.
        </p>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {t.ai.suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => navigate('/ai-chat', { state: { prefilledQuestion: q } })}
              style={{
                background: '#f4faf5',
                border: '1px solid #d4ebd6',
                borderRadius: '20px',
                padding: '0.45rem 0.85rem',
                fontSize: '0.82rem',
                color: 'var(--primary-green)',
                fontWeight: 600,
                textAlign: 'left'
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Missed Task Adaptive Recovery Modal */}
      {selectedMissedTask && (
        <MissedTaskModal
          task={selectedMissedTask}
          isOpen={Boolean(selectedMissedTask)}
          onClose={() => setSelectedMissedTask(null)}
          onTaskUpdated={handleTaskRescheduled}
        />
      )}
    </div>
  );
}
