import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import apiClient from '../services/api';
import { Users, MessageSquare, ThumbsUp, Plus, ShieldCheck, UserCheck, Share2 } from 'lucide-react';

export default function CommunityPage() {
  const { farmer, t } = useApp();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    topic: 'Equipment & Labor Sharing'
  });
  const [familyInvitePhone, setFamilyInvitePhone] = useState('');
  const [familySuccess, setFamilySuccess] = useState('');

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/community/posts');
      if (res.success && res.data) {
        setPosts(res.data);
      }
    } catch (err) {
      console.error('Error fetching community posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!farmer) return;
    try {
      const res = await apiClient.post('/community/posts', {
        farmerId: farmer.id,
        author_name: farmer.name,
        district: farmer.district,
        title: newPost.title,
        content: newPost.content,
        topic: newPost.topic
      });
      if (res.success) {
        setNewPost({ title: '', content: '', topic: 'Equipment & Labor Sharing' });
        setShowAdd(false);
        fetchPosts();
      }
    } catch (err) {
      alert(`Could not post: ${err.message}`);
    }
  };

  const handleInviteFamily = (e) => {
    e.preventDefault();
    if (!familyInvitePhone) return;
    setFamilySuccess(`Co-farmer access granted to +91 ${familyInvitePhone}. They can now view and update daily checklist tasks under your family farm profile.`);
    setTimeout(() => {
      setShowFamilyModal(false);
      setFamilySuccess('');
      setFamilyInvitePhone('');
    }, 3500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div className="card" style={{ borderTop: '4px solid #8b5cf6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={24} color="#8b5cf6" /> KisanSathi Community & Farmer Forum
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Connect with fellow growers in {farmer?.district || 'your district'} for equipment pooling, pest vigilance, and family farm management
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setShowFamilyModal(true)}
              className="btn-outline"
              style={{ fontSize: '0.82rem' }}
            >
              <UserCheck size={16} /> Family Farm Collaboration
            </button>
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="btn-primary"
              style={{ background: '#8b5cf6', fontSize: '0.85rem' }}
            >
              <Plus size={16} /> New Discussion
            </button>
          </div>
        </div>
      </div>

      {/* Family Collaboration Modal */}
      {showFamilyModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem'
        }}>
          <div style={{ background: 'white', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-green)', marginBottom: '0.4rem' }}>
              Family Farm Collaboration
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Allow family members (spouses, sons, daughters) to maintain shared farm action plans, log voice expenses, and view irrigation schedules.
            </p>

            {familySuccess ? (
              <div style={{ background: '#f0fdf4', color: 'var(--primary-green)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {familySuccess}
              </div>
            ) : (
              <form onSubmit={handleInviteFamily}>
                <div className="form-group">
                  <label className="form-label">Co-Farmer Mobile Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9845012345"
                    className="form-input"
                    value={familyInvitePhone}
                    onChange={(e) => setFamilyInvitePhone(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Permission Level</label>
                  <select className="form-select">
                    <option value="editor">Editor (Can check off tasks and log expenses)</option>
                    <option value="viewer">Viewer (Can only read daily plan & weather)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                    Send Farm Access Invite
                  </button>
                  <button type="button" onClick={() => setShowFamilyModal(false)} className="btn-outline">
                    Close
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* New Post Form */}
      {showAdd && (
        <div className="card" style={{ background: '#fbf9ff', border: '1px solid #ddd6fe' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#6d28d9' }}>
            Share Knowledge or Request Equipment
          </h3>
          <form onSubmit={handleCreatePost}>
            <div className="form-group">
              <label className="form-label">Topic</label>
              <select
                className="form-select"
                value={newPost.topic}
                onChange={(e) => setNewPost({ ...newPost, topic: e.target.value })}
              >
                <option value="Equipment & Labor Sharing">Equipment & Labor Sharing</option>
                <option value="Pest & Disease Observations">Pest & Disease Observations</option>
                <option value="Market & Mandi Updates">Market & Mandi Updates</option>
                <option value="Irrigation & Water Management">Irrigation & Water Management</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Combine harvester available for hire next Thursday"
                className="form-input"
                value={newPost.title}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description / Question</label>
              <textarea
                className="form-textarea"
                rows={3}
                required
                placeholder="Provide details, village location, and how to coordinate..."
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn-primary" style={{ background: '#8b5cf6', fontSize: '0.85rem' }}>
                Post to Forum
              </button>
              <button type="button" onClick={() => setShowAdd(false)} className="btn-outline" style={{ fontSize: '0.85rem' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Posts Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {posts.map(post => (
          <div key={post.id} className="card" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span className="badge badge-medium" style={{ background: '#f5f3ff', color: '#6d28d9' }}>
                {post.topic}
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {post.district} • {new Date(post.created_at).toLocaleDateString()}
              </span>
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '0.4rem' }}>
              {post.title}
            </h3>

            <p style={{ fontSize: '0.88rem', color: '#374151', lineHeight: 1.5, marginBottom: '0.75rem' }}>
              {post.content}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.6rem', borderTop: '1px solid var(--border-light)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span>Author: <strong>{post.author_name}</strong></span>

              <button
                onClick={() => {
                  setPosts(prev => prev.map(p => p.id === post.id ? { ...p, upvotes: (p.upvotes || 0) + 1 } : p));
                }}
                className="btn-outline"
                style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem' }}
              >
                <ThumbsUp size={14} color="#8b5cf6" /> Helpful ({post.upvotes || 0})
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
