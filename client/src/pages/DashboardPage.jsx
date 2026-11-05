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
  ShieldAlert,
  ShieldCheck,
  DollarSign,
  Radar,
  Truck,
  FileText
} from 'lucide-react';

export default function DashboardPage() {
  const { farmer, activeCrop, t, loadingFarmer } = useApp();
  const navigate = useNavigate();

  const [weather, setWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [stageInfo, setStageInfo] = useState(null);
  const [pestAlerts, setPestAlerts] = useState([]);
  const [selectedMissedTask, setSelectedMissedTask] = useState(null);

  // If not logged in and not loading, redirect to login
  useEffect(() => {
    if (!loadingFarmer && !farmer) {
      navigate('/login');
    }
  }, [farmer, loadingFarmer, navigate]);

  // Load weather, plan, and pest alerts
  useEffect(() => {
    if (!farmer?.id) return;

    // 1. Weather
    const loadWeather = async () => {
      try {
        setLoadingWeather(true);
        const lat = farmer.latitude || 12.5238;
        const lon = farmer.longitude || 76.8967;
        const res = await apiClient.get(`/weather?lat=${lat}&lon=${lon}`);
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
        const res = await apiClient.get(`/pest-alerts?district=${farmer.district || ''}`);
        if (res.success) setPestAlerts(res.data || []);
      } catch (e) {
        console.error('Pest alert error:', e);
      }
    };

    loadWeather();
    loadPlan();
    loadPests();
  }, [farmer?.id]);

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

  if (loadingFarmer) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: '#666' }}>
        Loading farm profile...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 1040, margin: '0 auto', padding: '0 16px' }}>
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
              {t.dashboard.welcome}, {farmer?.name || 'Farmer'}
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '0.2rem' }}>
              {farmer?.village ? `${farmer.village}, ` : ''}{farmer?.district}, {farmer?.state}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem', fontSize: '0.88rem', color: '#e8f5e9', flexWrap: 'wrap' }}>
              <span>🌱 Main Crop: <strong>{activeCrop?.crop_name || 'Rice (Paddy)'}</strong></span>
              <span>🌾 Farm Area: <strong>{farmer?.farms?.[0]?.area_acres || 2.5} Acres</strong></span>
              <span>📅 Sowing Date: <strong>{activeCrop?.sowing_date || 'N/A'}</strong> (Day {daysAfterSowing})</span>
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
            <span>Chat in Your Language</span>
          </Link>
        </div>
      </div>

      {/* 2. Quick Action Hub for 4 New ML Modules */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
        <Link
          to="/disease-identification"
          className="card"
          style={{ padding: 14, textDecoration: 'none', color: 'inherit', borderLeft: '4px solid #c62828', display: 'flex', alignItems: 'center', gap: 12 }}
        >
          <div style={{ background: '#ffebee', color: '#c62828', padding: 8, borderRadius: 8 }}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#b71c1c' }}>Disease Identification</div>
            <div style={{ fontSize: '0.75rem', color: '#666' }}>Scan leaf or symptoms</div>
          </div>
        </Link>

        <Link
          to="/market-prices"
          className="card"
          style={{ padding: 14, textDecoration: 'none', color: 'inherit', borderLeft: '4px solid #2e7d32', display: 'flex', alignItems: 'center', gap: 12 }}
        >
          <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: 8, borderRadius: 8 }}>
            <DollarSign size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1b5e20' }}>Mandi Prices & Trends</div>
            <div style={{ fontSize: '0.75rem', color: '#666' }}>7-day ARIMA price forecast</div>
          </div>
        </Link>

        <Link
          to="/crop-lifecycle"
          className="card"
          style={{ padding: 14, textDecoration: 'none', color: 'inherit', borderLeft: '4px solid #0284c7', display: 'flex', alignItems: 'center', gap: 12 }}
        >
          <div style={{ background: '#e0f2fe', color: '#0284c7', padding: 8, borderRadius: 8 }}>
            <Sprout size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0369a1' }}>Full Crop Lifecycle</div>
            <div style={{ fontSize: '0.75rem', color: '#666' }}>Sowing, irrigation & fertilizer</div>
          </div>
        </Link>

        <Link
          to="/pest-radar"
          className="card"
          style={{ padding: 14, textDecoration: 'none', color: 'inherit', borderLeft: '4px solid #e65100', display: 'flex', alignItems: 'center', gap: 12 }}
        >
          <div style={{ background: '#fff3e0', color: '#e65100', padding: 8, borderRadius: 8 }}>
            <Radar size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#e65100' }}>Nearby Pest Radar</div>
            <div style={{ fontSize: '0.75rem', color: '#666' }}>GPS outbreak alerts map</div>
          </div>
        </Link>
      </div>

      {/* 3. Regional Pest Alerts (if any in district) */}
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
              Pest Alert in {farmer?.district}: {pestAlerts[0].pest_or_disease} on {pestAlerts[0].crop_affected}
            </strong>
            <p style={{ fontSize: '0.82rem', color: '#881337', marginTop: '2px', margin: 0 }}>
              {pestAlerts[0].alert_message}
            </p>
          </div>
          <Link to="/pest-radar" className="btn-outline" style={{ fontSize: '0.75rem', padding: '4px 8px', flexShrink: 0 }}>
            View Radar
          </Link>
        </div>
      )}

      {/* 4. Top Row: Growth Stage Progress & Weather Card */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {/* Crop Growth Stage Progress Bar */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Current Growth Stage
              </span>
              <span className="badge badge-success">Day {daysAfterSowing} of 130</span>
            </div>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary-green)', marginBottom: '0.3rem' }}>
              {stageInfo?.stageName || activeCrop?.growth_stage || 'Active Field Stage'}
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Source: ICAR Agronomic Package of Practices
            </p>

            {/* Interactive Progress Bar */}
            <div style={{ marginTop: '1.25rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '0.3rem' }}>
                <span>Lifecycle Progress</span>
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
              Detailed Day-by-day Irrigation & Fertilizer Schedules
            </span>
            <Link to="/crop-lifecycle" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary-green)', display: 'flex', alignItems: 'center', gap: '2px', textDecoration: 'none' }}>
              Full Timeline <ChevronRight size={15} />
            </Link>
          </div>
        </div>

        {/* Hyperlocal Weather Card */}
        <WeatherCard weather={weather} loading={loadingWeather} />
      </div>

      {/* 5. Signature Feature: Today's Action Plan Checklist */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>
              Today's Farming Action Plan
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Personalized checklist based on crop stage & real-time weather telemetry
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="badge badge-success" style={{ fontSize: '0.8rem' }}>
              {completedCount} / {tasks.length} Completed
            </span>
            <Link to="/planner" className="btn-outline" style={{ fontSize: '0.82rem', padding: '0.4rem 0.8rem', textDecoration: 'none' }}>
              Open Daily Planner & Tracker <ArrowRight size={15} />
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
                    border: 'none',
                    color: task.completed ? 'var(--primary-green)' : '#9ca3af',
                    marginTop: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer'
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
                    Missed Task?
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
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
