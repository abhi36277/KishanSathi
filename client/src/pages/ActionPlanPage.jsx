import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import apiClient from '../services/api';
import MissedTaskModal from '../components/MissedTaskModal';
import { 
  ClipboardList, 
  CheckCircle2, 
  Circle, 
  Calendar, 
  CloudSun, 
  RefreshCw, 
  ShieldAlert, 
  BookOpen, 
  Filter 
} from 'lucide-react';

export default function ActionPlanPage() {
  const { farmer, activeCrop, t } = useApp();
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [tasks, setTasks] = useState([]);
  const [weatherAttribution, setWeatherAttribution] = useState('');
  const [growthStage, setGrowthStage] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [missedTask, setMissedTask] = useState(null);

  const loadPlanForDate = async (dateStr) => {
    if (!farmer) return;
    try {
      setLoading(true);
      const res = await apiClient.get(`/action-plan/${farmer.id}?date=${dateStr}`);
      if (res.success && res.data) {
        setTasks(res.data.tasks || []);
        setWeatherAttribution(res.data.weather_attribution || '');
        setGrowthStage(res.data.growth_stage || activeCrop?.growth_stage || '');
      }
    } catch (err) {
      console.error('Error loading action plan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlanForDate(selectedDate);
  }, [farmer, selectedDate]);

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
      setTasks(prev => prev.map(t => t.id === decision.taskId ? { ...t, due_date: decision.newDueDate, reason: `${t.reason} | Rescheduled: ${decision.explanation}` } : t));
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header with Date Picker & Weather Note */}
      <div className="card" style={{ borderTop: '4px solid var(--primary-green)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--primary-green)' }}>
              {t.actionPlan.title}
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {t.actionPlan.subtitle}
            </p>
          </div>

          {/* Date Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f4faf5', padding: '0.4rem 0.8rem', borderRadius: '8px' }}>
            <Calendar size={16} color="var(--primary-green)" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontWeight: 600, color: 'var(--text-dark)', cursor: 'pointer', outline: 'none' }}
            />
          </div>
        </div>

        {/* Dynamic Context Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', background: '#f9fcf9', padding: '0.75rem 1rem', borderRadius: '10px' }}>
          <div style={{ fontSize: '0.85rem' }}>
            <span>Crop: <strong>{activeCrop?.crop_name || 'Rice'}</strong></span>
            <span style={{ margin: '0 0.5rem' }}>•</span>
            <span>Stage: <strong>{growthStage || 'Tillering'}</strong></span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            ☁️ {weatherAttribution || 'Open-Meteo live feed'}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={() => setFilter('all')}
          className={filter === 'all' ? 'btn-primary' : 'btn-outline'}
          style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
        >
          All Tasks ({tasks.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={filter === 'pending' ? 'btn-primary' : 'btn-outline'}
          style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
        >
          Pending ({tasks.filter(t => !t.completed).length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={filter === 'completed' ? 'btn-primary' : 'btn-outline'}
          style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
        >
          Completed ({tasks.filter(t => t.completed).length})
        </button>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
          Loading daily action checklist...
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
          No tasks found for the selected filter.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {filteredTasks.map(task => (
            <div
              key={task.id}
              className="card"
              style={{
                borderLeft: `5px solid ${task.priority === 'high' ? 'var(--danger-red)' : task.priority === 'medium' ? 'var(--warning-amber)' : 'var(--info-blue)'}`,
                opacity: task.completed ? 0.75 : 1,
                background: task.completed ? '#f9fcf9' : 'white',
                marginBottom: 0
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
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
                  {task.completed ? <CheckCircle2 size={26} /> : <Circle size={26} />}
                </button>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                    <span className={`badge badge-${task.priority}`}>
                      {task.priority} Priority
                    </span>
                    <h3 style={{
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      color: 'var(--text-dark)',
                      textDecoration: task.completed ? 'line-through' : 'none'
                    }}>
                      {task.task_title}
                    </h3>
                  </div>

                  <p style={{ fontSize: '0.9rem', color: '#374151', lineHeight: 1.5, marginBottom: '0.6rem' }}>
                    {task.task_description}
                  </p>

                  <div style={{
                    background: '#f8faf8',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.3rem',
                    fontSize: '0.82rem'
                  }}>
                    <div>
                      <strong style={{ color: 'var(--primary-green)' }}>{t.actionPlan.reason}:</strong> {task.reason}
                    </div>
                    <div>
                      <strong style={{ color: 'var(--text-muted)' }}>{t.actionPlan.sourceBasis}:</strong> {task.source}
                    </div>
                  </div>
                </div>

                {!task.completed && (
                  <button
                    onClick={() => setMissedTask(task)}
                    className="btn-outline"
                    style={{ fontSize: '0.75rem', padding: '0.4rem 0.7rem', flexShrink: 0 }}
                  >
                    {t.actionPlan.missedBtn}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Missed Task Modal */}
      {missedTask && (
        <MissedTaskModal
          task={missedTask}
          isOpen={Boolean(missedTask)}
          onClose={() => setMissedTask(null)}
          onTaskUpdated={handleTaskRescheduled}
        />
      )}
    </div>
  );
}
