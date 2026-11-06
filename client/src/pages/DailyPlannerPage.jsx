import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import apiClient from '../services/api';
import {
  Calendar, CheckCircle2, Clock, AlertTriangle, Droplets,
  Sprout, Sparkles, Plus, History, ArrowRight, ShieldCheck,
  RefreshCw, CloudRain, Thermometer, Layers, Edit3, X,
  CheckCircle, ListChecks, Activity, TrendingUp, HelpCircle,
  MapPin, Check
} from 'lucide-react';

export default function DailyPlannerPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { farmer, activeCrop, switchActiveCrop } = useApp();

  const [loading, setLoading] = useState(true);
  const [plannerData, setPlannerData] = useState(null);
  const [activeTab, setActiveTab] = useState('planner'); // 'planner' | 'checker' | 'tracker'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Modal for editing context (crop, stage, soil, area)
  const [showEditContext, setShowEditContext] = useState(false);
  const [editCrop, setEditCrop] = useState(activeCrop?.crop_name || 'Rice');
  const [editStage, setEditStage] = useState('');
  const [editSoil, setEditSoil] = useState('');
  const [editArea, setEditArea] = useState(2.5);
  const [editSowingDate, setEditSowingDate] = useState('');
  const [updatingContext, setUpdatingContext] = useState(false);

  // Modal for logging custom activity
  const [showLogModal, setShowLogModal] = useState(false);
  const [logTitle, setLogTitle] = useState('');
  const [logType, setLogType] = useState('Crop Care');
  const [logNotes, setLogNotes] = useState('');
  const [loggingActivity, setLoggingActivity] = useState(false);

  const farmerId = farmer?.id || '00000000-0000-0000-0000-000000000001';
  const urlCropId = searchParams.get('cropId');

  const fetchPlanner = async (targetCropId = urlCropId) => {
    try {
      setLoading(true);
      setActionError('');
      const queryParam = targetCropId ? `?cropId=${targetCropId}` : '';
      const res = await apiClient.get(`/planner/${farmerId}${queryParam}`);
      if (res && res.success && res.data) {
        setPlannerData(res.data);
        const ctx = res.data.farmer_context;
        setEditCrop(ctx.crop_name || 'Rice');
        setEditStage(ctx.growth_stage || '');
        setEditSoil(ctx.soil_type || '');
        setEditArea(ctx.area_acres || 2.5);
        setEditSowingDate(ctx.sowing_date || '');
      } else {
        setActionError(res?.error || 'Unable to load daily planner.');
      }
    } catch (err) {
      console.error('Planner load error:', err);
      setActionError('Error connecting to planner telemetry service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanner(urlCropId);
  }, [farmerId, urlCropId]);

  const handleSwitchCrop = async (targetId) => {
    setSearchParams({ cropId: targetId });
    if (switchActiveCrop) {
      switchActiveCrop(targetId);
    }
    fetchPlanner(targetId);
  };

  // Toggle checker task
  const handleToggleTask = async (task) => {
    try {
      setActionError('');
      const newStatus = !task.completed;
      const res = await apiClient.post('/planner/task/check', {
        farmerId,
        taskId: task.id,
        completed: newStatus,
        notes: task.notes || 'Marked from interactive checker'
      });

      if (res && res.success) {
        setActionSuccess(`Task marked as ${newStatus ? 'Completed' : 'Pending'}!`);
        setTimeout(() => setActionSuccess(''), 3000);
        fetchPlanner();
      }
    } catch (err) {
      setActionError('Could not update task status: ' + err.message);
    }
  };

  // Submit Context Update
  const handleUpdateContext = async (e) => {
    e.preventDefault();
    try {
      setUpdatingContext(true);
      setActionError('');
      const res = await apiClient.patch(`/planner/context/${farmerId}`, {
        crop_name: editCrop,
        growth_stage: editStage,
        soil_type: editSoil,
        area_acres: parseFloat(editArea),
        sowing_date: editSowingDate
      });

      if (res && res.success) {
        setShowEditContext(false);
        setActionSuccess('Farm & Crop context updated! Advisory and harvesting re-calculated.');
        setTimeout(() => setActionSuccess(''), 4000);
        fetchPlanner();
      }
    } catch (err) {
      setActionError('Failed to update context: ' + err.message);
    } finally {
      setUpdatingContext(false);
    }
  };

  // Submit Custom Activity Log
  const handleLogActivity = async (e) => {
    e.preventDefault();
    if (!logTitle.trim()) return;

    try {
      setLoggingActivity(true);
      setActionError('');
      const res = await apiClient.post('/planner/activity/log', {
        farmerId,
        title: logTitle,
        activity_type: logType,
        details: logNotes,
        date: new Date().toISOString().split('T')[0]
      });

      if (res && res.success) {
        setShowLogModal(false);
        setLogTitle('');
        setLogNotes('');
        setActionSuccess('Activity recorded in permanent farm history!');
        setTimeout(() => setActionSuccess(''), 4000);
        fetchPlanner();
      }
    } catch (err) {
      setActionError('Failed to record activity: ' + err.message);
    } finally {
      setLoggingActivity(false);
    }
  };

  const context = plannerData?.farmer_context;
  const weather = plannerData?.weather_telemetry;
  const harvest = plannerData?.harvest_forecast;
  const situation = plannerData?.current_situation;
  const tasks = plannerData?.daily_planner_tasks || [];
  const history = plannerData?.completed_history || [];

  const filteredTasks = selectedCategory === 'all'
    ? tasks
    : tasks.filter(t => t.category.toLowerCase().includes(selectedCategory.toLowerCase()));

  const completedCount = tasks.filter(t => t.completed).length;
  const progressPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div style={{ maxWidth: 1040, margin: '20px auto', padding: '0 16px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              background: '#e8f5e9',
              color: '#2e7d32',
              padding: '6px 10px',
              borderRadius: 8,
              display: 'inline-flex'
            }}>
              <Calendar size={22} />
            </span>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: '#1b5e20' }}>
              Daily Planner, Tracker & Checker
            </h1>
          </div>
          <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '0.9rem' }}>
            Personalized agronomic schedules grounded in Crop, Stage, Soil, Area, Weather API & Harvest Timelines
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/crops')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#fff',
              border: '1px solid #c8e6c9',
              color: '#2e7d32',
              padding: '8px 14px',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            <Sprout size={15} /> All Enrolled Plots ({plannerData?.all_crops?.length || 1})
          </button>
          <button
            onClick={() => setShowEditContext(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#fff',
              border: '1px solid #c8e6c9',
              color: '#2e7d32',
              padding: '8px 14px',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            <Edit3 size={15} /> Edit Farm Context
          </button>
          <button
            onClick={() => setShowLogModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#2e7d32',
              color: '#fff',
              border: 'none',
              padding: '8px 14px',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            <Plus size={15} /> Log Field Action
          </button>
        </div>
      </div>

      {/* Grounded Farmer Context Bar */}
      {context && (
        <div style={{
          background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)',
          color: '#fff',
          borderRadius: 12,
          padding: '16px 20px',
          marginBottom: 20,
          boxShadow: '0 4px 14px rgba(27,94,32,0.18)'
        }}>
          {/* Active Plot Switcher Dropdown */}
          {plannerData?.all_crops && plannerData.all_crops.length > 1 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 8,
              background: 'rgba(0,0,0,0.2)',
              padding: '8px 12px',
              borderRadius: 8,
              marginBottom: 12
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#a5d6a7', textTransform: 'uppercase' }}>
                  Active Plot Protocol:
                </span>
                <select
                  value={context.crop_id || ''}
                  onChange={(e) => handleSwitchCrop(e.target.value)}
                  style={{
                    background: '#ffffff',
                    color: '#1b5e20',
                    border: 'none',
                    borderRadius: 6,
                    padding: '5px 10px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    maxWidth: '100%'
                  }}
                >
                  {plannerData.all_crops.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.crop_name} - {c.plot_name || 'Plot'} ({c.area_acres || 2.5} Acres, {c.soil_type || 'Loam'})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => navigate('/crops')}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.4)',
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                + Add / Manage Crops
              </button>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.85, fontWeight: 700 }}>
                Grounded Farm Context &bull; {context.location} &bull; {context.plot_name || 'Main Plot'}
              </span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                {context.crop_name} ({context.variety}) &bull; <span style={{ color: '#a5d6a7' }}>{context.growth_stage}</span> (Day {context.das})
              </div>
            </div>

            {weather && (
              <div style={{
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(4px)',
                borderRadius: 8,
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                fontSize: '0.82rem'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Thermometer size={14} color="#ffcc80" /> {weather.temperature_c}&deg;C
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Droplets size={14} color="#90caf9" /> {weather.humidity_pct}% Hum
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CloudRain size={14} color="#80deea" /> {weather.rain_chance_pct}% Rain ({weather.condition})
                </span>
              </div>
            )}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: 10,
            paddingTop: 12,
            borderTop: '1px solid rgba(255,255,255,0.2)',
            fontSize: '0.82rem'
          }}>
            <div>
              <span style={{ opacity: 0.75 }}>Soil Type:</span>
              <div style={{ fontWeight: 700, color: '#fff' }}>{context.soil_type}</div>
            </div>
            <div>
              <span style={{ opacity: 0.75 }}>Farm Area:</span>
              <div style={{ fontWeight: 700, color: '#fff' }}>{context.area_acres} Acres (Active Plot)</div>
            </div>
            <div>
              <span style={{ opacity: 0.75 }}>Expected Harvest:</span>
              <div style={{ fontWeight: 700, color: '#fff59d' }}>
                {harvest?.days_until_harvest ?? '--'} Days Left &bull; {harvest?.expected_harvest_window || 'Calculating...'}
              </div>
            </div>
            <div>
              <span style={{ opacity: 0.75 }}>Current Health:</span>
              <div style={{ fontWeight: 700, color: '#c8e6c9' }}>
                {situation?.health_score ?? 88}/100 &bull; {situation?.soil_moisture_status || 'Adequate'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      {actionSuccess && (
        <div style={{
          background: '#e8f5e9',
          color: '#1b5e20',
          border: '1px solid #a5d6a7',
          padding: '10px 14px',
          borderRadius: 8,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: '0.88rem'
        }}>
          <CheckCircle size={18} /> {actionSuccess}
        </div>
      )}
      {actionError && (
        <div style={{
          background: '#ffebee',
          color: '#c62828',
          border: '1px solid #ffcdd2',
          padding: '10px 14px',
          borderRadius: 8,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: '0.88rem'
        }}>
          <AlertTriangle size={18} /> {actionError}
        </div>
      )}

      {/* Tab Switcher */}
      <div style={{
        display: 'flex',
        borderBottom: '2px solid #e0e0e0',
        marginBottom: 20,
        gap: 8
      }}>
        <button
          onClick={() => setActiveTab('planner')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: 'none',
            fontWeight: 700,
            fontSize: '0.95rem',
            color: activeTab === 'planner' ? '#1b5e20' : '#666',
            borderBottom: activeTab === 'planner' ? '3px solid #1b5e20' : '3px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer'
          }}
        >
          <Calendar size={18} /> Daily Planner
          <span style={{
            background: activeTab === 'planner' ? '#1b5e20' : '#e0e0e0',
            color: activeTab === 'planner' ? '#fff' : '#444',
            fontSize: '0.75rem',
            padding: '2px 7px',
            borderRadius: 12
          }}>
            {tasks.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('checker')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: 'none',
            fontWeight: 700,
            fontSize: '0.95rem',
            color: activeTab === 'checker' ? '#1b5e20' : '#666',
            borderBottom: activeTab === 'checker' ? '3px solid #1b5e20' : '3px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer'
          }}
        >
          <ListChecks size={18} /> Interactive Checker
          <span style={{
            background: completedCount === tasks.length && tasks.length > 0 ? '#2e7d32' : '#ff9800',
            color: '#fff',
            fontSize: '0.75rem',
            padding: '2px 7px',
            borderRadius: 12
          }}>
            {completedCount}/{tasks.length} Done
          </span>
        </button>

        <button
          onClick={() => setActiveTab('tracker')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: 'none',
            fontWeight: 700,
            fontSize: '0.95rem',
            color: activeTab === 'tracker' ? '#1b5e20' : '#666',
            borderBottom: activeTab === 'tracker' ? '3px solid #1b5e20' : '3px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer'
          }}
        >
          <TrendingUp size={18} /> Tracker & Persistent History
          <span style={{
            background: '#e0e0e0',
            color: '#444',
            fontSize: '0.75rem',
            padding: '2px 7px',
            borderRadius: 12
          }}>
            {history.length} Logs
          </span>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
          <RefreshCw className="animate-spin" size={32} style={{ margin: '0 auto 12px auto', color: '#2e7d32' }} />
          <div>Synthesizing personalized daily tasks for {context?.crop_name || 'your crop'}...</div>
        </div>
      ) : (
        <>
          {/* TAB 1: DAILY PLANNER */}
          {activeTab === 'planner' && (
            <div>
              {/* Category Filter */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                {['all', 'irrigation', 'nutrition', 'protection', 'cultural'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 20,
                      border: '1px solid',
                      borderColor: selectedCategory === cat ? '#1b5e20' : '#ddd',
                      background: selectedCategory === cat ? '#e8f5e9' : '#fff',
                      color: selectedCategory === cat ? '#1b5e20' : '#555',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textTransform: 'capitalize'
                    }}
                  >
                    {cat === 'all' ? 'All Tasks' : cat}
                  </button>
                ))}
              </div>

              {filteredTasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, background: '#fafafa', borderRadius: 10 }}>
                  <ShieldCheck size={36} color="#81c784" style={{ margin: '0 auto 10px auto' }} />
                  <div style={{ fontWeight: 600 }}>No specific tasks found in this category for today.</div>
                  <p style={{ color: '#666', fontSize: '0.85rem' }}>Your crop is well-maintained according to current DAS and weather.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {filteredTasks.map(task => (
                    <div
                      key={task.id}
                      style={{
                        background: '#fff',
                        borderRadius: 10,
                        border: '1px solid #e0e0e0',
                        borderLeft: `5px solid ${task.priority === 'High' ? '#d32f2f' : task.priority === 'Medium' ? '#f57c00' : '#388e3c'}`,
                        padding: '16px 18px',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: task.priority === 'High' ? '#ffebee' : '#fff3e0',
                            color: task.priority === 'High' ? '#c62828' : '#e65100'
                          }}>
                            {task.priority} Priority
                          </span>
                          <span style={{ fontSize: '0.8rem', color: '#666', fontWeight: 600 }}>
                            {task.category} &bull; Est. {task.time_estimate}
                          </span>
                        </div>

                        <span style={{
                          fontSize: '0.78rem',
                          background: '#f1f8e9',
                          color: '#33691e',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 6
                        }}>
                          Grounded: {task.area_application}
                        </span>
                      </div>

                      <h3 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', fontWeight: 700, color: '#212121' }}>
                        {task.title}
                      </h3>

                      <p style={{ margin: '0 0 10px 0', color: '#424242', fontSize: '0.9rem', lineHeight: 1.5 }}>
                        {task.instructions}
                      </p>

                      {/* Soil & Weather Grounding Badges */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                        gap: 8,
                        background: '#fafafa',
                        borderRadius: 8,
                        padding: '10px 12px',
                        marginBottom: 10,
                        fontSize: '0.82rem'
                      }}>
                        <div>
                          <strong style={{ color: '#5d4037' }}>Soil Adaptation ({context?.soil_type}):</strong>
                          <div style={{ color: '#616161', marginTop: 2 }}>{task.soil_impact}</div>
                        </div>
                        {task.weather_alert && (
                          <div>
                            <strong style={{ color: '#0d47a1' }}>Live Weather Reason:</strong>
                            <div style={{ color: '#616161', marginTop: 2 }}>{task.weather_alert}</div>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleToggleTask(task)}
                          style={{
                            background: task.completed ? '#e8f5e9' : '#2e7d32',
                            color: task.completed ? '#2e7d32' : '#fff',
                            border: task.completed ? '1px solid #81c784' : 'none',
                            padding: '6px 14px',
                            borderRadius: 6,
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            cursor: 'pointer'
                          }}
                        >
                          <CheckCircle2 size={16} />
                          {task.completed ? 'Marked Completed' : 'Mark as Done Today'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: INTERACTIVE CHECKER */}
          {activeTab === 'checker' && (
            <div>
              {/* Progress Summary Card */}
              <div style={{
                background: '#fff',
                borderRadius: 10,
                border: '1px solid #e0e0e0',
                padding: '16px 20px',
                marginBottom: 20
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1b5e20' }}>
                    Today's Task Completion Progress
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: progressPct === 100 ? '#2e7d32' : '#f57c00' }}>
                    {progressPct}% ({completedCount}/{tasks.length})
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ width: '100%', height: 10, background: '#e0e0e0', borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{
                    width: `${progressPct}%`,
                    height: '100%',
                    background: progressPct === 100 ? '#2e7d32' : 'linear-gradient(90deg, #43a047, #66bb6a)',
                    transition: 'width 0.4s ease'
                  }} />
                </div>
                <div style={{ fontSize: '0.8rem', color: '#666', marginTop: 6 }}>
                  Checked items are permanently saved to your farm timeline and persist across logouts.
                </div>
              </div>

              {/* Checklist items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {tasks.map(task => (
                  <div
                    key={task.id}
                    onClick={() => handleToggleTask(task)}
                    style={{
                      background: task.completed ? '#f1f8e9' : '#fff',
                      border: task.completed ? '1px solid #a5d6a7' : '1px solid #e0e0e0',
                      borderRadius: 8,
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(task.completed)}
                      onChange={() => {}} // handled by row click
                      style={{
                        marginTop: 4,
                        width: 18,
                        height: 18,
                        cursor: 'pointer',
                        accentColor: '#2e7d32'
                      }}
                    />

                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontWeight: 700,
                        fontSize: '0.98rem',
                        color: task.completed ? '#2e7d32' : '#212121',
                        textDecoration: task.completed ? 'line-through' : 'none'
                      }}>
                        {task.title}
                      </div>

                      <div style={{ fontSize: '0.85rem', color: '#555', marginTop: 4 }}>
                        {task.instructions}
                      </div>

                      <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: '0.78rem', color: '#777' }}>
                        <span><strong>Dose:</strong> {task.area_application}</span>
                        <span><strong>Category:</strong> {task.category}</span>
                        {task.completed_at && (
                          <span style={{ color: '#2e7d32', fontWeight: 600 }}>
                            &bull; Completed {new Date(task.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: TRACKER & PERSISTENT HISTORY */}
          {activeTab === 'tracker' && (
            <div>
              {/* Crop Stage Timeline Tracker */}
              <div style={{
                background: '#fff',
                borderRadius: 10,
                border: '1px solid #e0e0e0',
                padding: '18px 20px',
                marginBottom: 20
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#1b5e20' }}>
                      Crop Lifecycle & Harvesting Tracker
                    </h3>
                    <p style={{ margin: '2px 0 0 0', color: '#666', fontSize: '0.85rem' }}>
                      Current: {context?.growth_stage} &bull; Sown: {context?.sowing_date || 'N/A'} (Day {context?.das})
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#2e7d32' }}>
                      {harvest?.days_until_harvest ?? '--'} Days
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#666' }}>Until Harvesting Window</div>
                  </div>
                </div>

                {/* Progress Track */}
                <div style={{ width: '100%', height: 12, background: '#e0e0e0', borderRadius: 6, overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{
                    width: `${harvest?.overall_progress_pct || 25}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #81c784 0%, #2e7d32 100%)'
                  }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#777' }}>
                  <span>Day 1 (Sowing)</span>
                  <span style={{ fontWeight: 700, color: '#2e7d32' }}>
                    Day {context?.das} ({harvest?.overall_progress_pct || 25}% Completed)
                  </span>
                  <span>Harvest Window: {harvest?.expected_harvest_window}</span>
                </div>

                <div style={{
                  background: '#f9fbe7',
                  borderLeft: '4px solid #cddc39',
                  padding: '8px 12px',
                  borderRadius: 6,
                  marginTop: 12,
                  fontSize: '0.82rem',
                  color: '#33691e'
                }}>
                  <strong>Agronomist Advisory:</strong> {harvest?.harvest_recommendation}
                </div>
              </div>

              {/* Current Situation Dashboard */}
              <div style={{
                background: '#fff',
                borderRadius: 10,
                border: '1px solid #e0e0e0',
                padding: '16px 20px',
                marginBottom: 20
              }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', fontWeight: 800, color: '#333' }}>
                  Current Situation & Field Telemetry
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 12,
                  fontSize: '0.85rem'
                }}>
                  <div style={{ background: '#f5f5f5', padding: '10px 14px', borderRadius: 8 }}>
                    <div style={{ color: '#757575', fontSize: '0.75rem', fontWeight: 700 }}>SOIL MOISTURE STATUS</div>
                    <div style={{ fontWeight: 700, marginTop: 4, color: '#0d47a1' }}>{situation?.soil_moisture_status}</div>
                  </div>
                  <div style={{ background: '#f5f5f5', padding: '10px 14px', borderRadius: 8 }}>
                    <div style={{ color: '#757575', fontSize: '0.75rem', fontWeight: 700 }}>ACTIVE WEATHER RISK</div>
                    <div style={{ fontWeight: 700, marginTop: 4, color: '#b71c1c' }}>{situation?.active_threat}</div>
                  </div>
                  <div style={{ background: '#f5f5f5', padding: '10px 14px', borderRadius: 8 }}>
                    <div style={{ color: '#757575', fontSize: '0.75rem', fontWeight: 700 }}>FIELD HEALTH INDEX</div>
                    <div style={{ fontWeight: 700, marginTop: 4, color: '#2e7d32' }}>{situation?.health_score}/100 (Optimal)</div>
                  </div>
                </div>
              </div>

              {/* What Has Been Done: Permanent History Log */}
              <div style={{
                background: '#fff',
                borderRadius: 10,
                border: '1px solid #e0e0e0',
                padding: '18px 20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#1b5e20' }}>
                      What Has Been Done (Permanent History)
                    </h3>
                    <div style={{ fontSize: '0.82rem', color: '#666' }}>
                      Logged field activities and completed checker tasks are saved persistently across logouts
                    </div>
                  </div>
                  <button
                    onClick={() => setShowLogModal(true)}
                    style={{
                      background: '#e8f5e9',
                      color: '#2e7d32',
                      border: '1px solid #a5d6a7',
                      padding: '6px 12px',
                      borderRadius: 6,
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <Plus size={14} /> Log Action
                  </button>
                </div>

                {history.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 30, color: '#888', fontSize: '0.9rem' }}>
                    No field actions logged yet. Check off items in the Checker or click "+ Log Action" to record your history.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {history.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        style={{
                          borderLeft: '3px solid #2e7d32',
                          background: '#fafafa',
                          borderRadius: '0 8px 8px 0',
                          padding: '10px 14px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: 12
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#212121' }}>
                              {item.title}
                            </span>
                            <span style={{
                              fontSize: '0.72rem',
                              background: '#e8f5e9',
                              color: '#2e7d32',
                              padding: '2px 6px',
                              borderRadius: 4,
                              fontWeight: 600
                            }}>
                              {item.activity_type || 'Field Task'}
                            </span>
                          </div>
                          {item.details && (
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: '#555' }}>
                              {item.details}
                            </p>
                          )}
                        </div>

                        <div style={{ fontSize: '0.78rem', color: '#888', whiteSpace: 'nowrap' }}>
                          {item.date || (item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL: EDIT FARM CONTEXT */}
      {showEditContext && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: 16
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: '22px 24px',
            width: '100%',
            maxWidth: 480,
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#1b5e20' }}>
                Update Grounded Farm Context
              </h3>
              <button
                onClick={() => setShowEditContext(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateContext}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>
                  Crop Type
                </label>
                <select
                  value={editCrop}
                  onChange={(e) => setEditCrop(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ccc' }}
                >
                  <option value="Rice">Rice / Paddy</option>
                  <option value="Wheat">Wheat</option>
                  <option value="Maize">Maize / Corn</option>
                  <option value="Potato">Potato</option>
                  <option value="Tomatoes">Tomatoes</option>
                  <option value="Chillies">Chillies</option>
                  <option value="Cotton">Cotton</option>
                  <option value="Mustard">Mustard</option>
                  <option value="Bean">Beans / Pulses</option>
                </select>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>
                  Growth Stage
                </label>
                <input
                  type="text"
                  value={editStage}
                  onChange={(e) => setEditStage(e.target.value)}
                  placeholder="e.g. Active Tillering, Flowering, Booting..."
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ccc' }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>
                  Soil Type
                </label>
                <select
                  value={editSoil}
                  onChange={(e) => setEditSoil(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ccc' }}
                >
                  <option value="Red Sandy Loam">Red Sandy Loam</option>
                  <option value="Black Cotton Soil">Black Cotton Soil (Heavy Clay)</option>
                  <option value="Alluvial Loam">Alluvial Loam</option>
                  <option value="Clayey Loam">Clayey Loam</option>
                  <option value="Laterite Soil">Laterite Soil</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>
                    Farm Area (Acres)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={editArea}
                    onChange={(e) => setEditArea(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ccc' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>
                    Sowing Date
                  </label>
                  <input
                    type="date"
                    value={editSowingDate}
                    onChange={(e) => setEditSowingDate(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ccc' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowEditContext(false)}
                  style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingContext}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#1b5e20',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {updatingContext ? 'Saving...' : 'Recalibrate Advice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LOG FIELD ACTION */}
      {showLogModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: 16
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: '22px 24px',
            width: '100%',
            maxWidth: 480,
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#1b5e20' }}>
                Log Completed Field Action
              </h3>
              <button
                onClick={() => setShowLogModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleLogActivity}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>
                  Action Title *
                </label>
                <input
                  type="text"
                  required
                  value={logTitle}
                  onChange={(e) => setLogTitle(e.target.value)}
                  placeholder="e.g. Applied 25kg Urea split, Sprayed Neem oil, Weeded north plot..."
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ccc' }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>
                  Category
                </label>
                <select
                  value={logType}
                  onChange={(e) => setLogType(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ccc' }}
                >
                  <option value="Crop Care">Crop Care & Maintenance</option>
                  <option value="Fertilizer">Fertilizer Application</option>
                  <option value="Irrigation">Irrigation Run</option>
                  <option value="Pest Control">Pest Control / Spray</option>
                  <option value="Harvesting">Harvesting / Intercultural</option>
                </select>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>
                  Observations & Dosage Notes
                </label>
                <textarea
                  rows={3}
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  placeholder="e.g. Applied in moist soil during afternoon hours. Canopy look healthy."
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ccc', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loggingActivity}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#1b5e20',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {loggingActivity ? 'Saving...' : 'Save into Permanent History'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
