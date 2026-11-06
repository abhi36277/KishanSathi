import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import apiClient from '../services/api';
import {
  Landmark,
  Calendar,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Filter,
  Sparkles,
  Check,
  Search,
  Sprout,
  MapPin,
  Layers,
  Droplets,
  AlertCircle,
  HelpCircle,
  FileText,
  TrendingUp,
  Award
} from 'lucide-react';

export default function SchemesPage() {
  const { farmer, activeCrop } = useApp();

  const [schemes, setSchemes] = useState([]);
  const [recommendedSchemes, setRecommendedSchemes] = useState([]);
  const [farmerContext, setFarmerContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Filters
  const [activeTab, setActiveTab] = useState('recommended'); // 'recommended' | 'all'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Interactive cultivation override
  const [cropOverride, setCropOverride] = useState('');
  const [areaOverride, setAreaOverride] = useState('');

  const fetchSchemes = async (overrideCrop, overrideArea) => {
    try {
      setLoading(true);
      setErrorMsg('');

      const farmerId = farmer?.id || '00000000-0000-0000-0000-000000000001';
      const crop = overrideCrop !== undefined ? overrideCrop : (activeCrop?.crop_name || '');
      const area = overrideArea !== undefined ? overrideArea : (activeCrop?.area_acres || '');

      let url = `/schemes?farmerId=${farmerId}`;
      if (crop) url += `&crop=${encodeURIComponent(crop)}`;
      if (area) url += `&area=${encodeURIComponent(area)}`;

      const res = await apiClient.get(url);
      if (res && res.success && res.data) {
        setSchemes(res.data.schemes || []);
        setRecommendedSchemes(res.data.recommended_schemes || []);
        setFarmerContext(res.data.farmer_context || null);

        if (!cropOverride && res.data.farmer_context?.crop_name) {
          setCropOverride(res.data.farmer_context.crop_name);
        }
        if (!areaOverride && res.data.farmer_context?.area_acres) {
          setAreaOverride(res.data.farmer_context.area_acres);
        }
      } else {
        setErrorMsg(res?.error || 'Failed to load government schemes');
      }
    } catch (err) {
      console.error('Error loading schemes:', err);
      setErrorMsg('Unable to connect to Government Schemes service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, [farmer?.id, activeCrop?.id]);

  const handleApplyOverrides = (e) => {
    e.preventDefault();
    fetchSchemes(cropOverride, areaOverride);
  };

  const categories = [
    'All',
    'Direct Income Support',
    'Crop Insurance',
    'Subsidies & Equipment',
    'Soil & Fertilizer',
    'Credit & Finance',
    'Organic Farming',
    'Pension & Social Security',
    'Mandi & Price Support'
  ];

  // Filter schemes according to tab, category, and search query
  const displayedSchemes = (activeTab === 'recommended' ? recommendedSchemes : schemes).filter(scheme => {
    // Category match
    if (selectedCategory !== 'All' && !scheme.category.toLowerCase().includes(selectedCategory.toLowerCase())) {
      return false;
    }
    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = scheme.name.toLowerCase().includes(q);
      const benefitMatch = scheme.benefits.toLowerCase().includes(q);
      const categoryMatch = scheme.category.toLowerCase().includes(q);
      const cropMatch = (scheme.applicable_crops || []).some(c => c.toLowerCase().includes(q));
      if (!nameMatch && !benefitMatch && !categoryMatch && !cropMatch) return false;
    }
    return true;
  });

  return (
    <div style={{ maxWidth: 1040, margin: '20px auto', padding: '0 16px' }}>
      {/* Page Header */}
      <div className="card" style={{ borderTop: '4px solid #512da8', background: 'linear-gradient(135deg, #ffffff 0%, #f7f4fc 100%)', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#ede7f6', color: '#512da8', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              <Landmark size={14} /> Official Government of India & State Portals
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: '#311b92', display: 'flex', alignItems: 'center', gap: 8 }}>
              Government Agricultural Schemes & Subsidies
            </h1>
            <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '0.9rem' }}>
              Personalized subsidy recommendations based on your crop cultivation, landholding, and soil profile with direct official application portals.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => {
                setActiveTab('recommended');
                fetchSchemes(cropOverride, areaOverride);
              }}
              className={activeTab === 'recommended' ? 'btn-primary' : 'btn-outline'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '0.85rem',
                background: activeTab === 'recommended' ? '#512da8' : 'white',
                borderColor: '#512da8',
                color: activeTab === 'recommended' ? 'white' : '#512da8'
              }}
            >
              <Sparkles size={16} />
              <span>Recommended for You ({recommendedSchemes.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={activeTab === 'all' ? 'btn-primary' : 'btn-outline'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '0.85rem',
                background: activeTab === 'all' ? '#512da8' : 'white',
                borderColor: '#512da8',
                color: activeTab === 'all' ? 'white' : '#512da8'
              }}
            >
              <Award size={16} />
              <span>All Schemes ({schemes.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grounded Farmer Cultivation Profile & Recommendation Context */}
      {farmerContext && (
        <div style={{
          background: 'linear-gradient(135deg, #311b92 0%, #512da8 100%)',
          color: '#ffffff',
          borderRadius: 12,
          padding: '16px 20px',
          marginBottom: 20,
          boxShadow: '0 4px 14px rgba(49, 27, 146, 0.2)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#d1c4e9', fontWeight: 700 }}>
                Recommendation Grounding Engine &bull; {farmerContext.state}
              </span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                Active Crop: <span style={{ color: '#ffeb3b' }}>{farmerContext.crop_name}</span> &bull; {farmerContext.plot_name}
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.18)', borderRadius: 8, padding: '6px 12px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={16} color="#ffeb3b" />
              <span>
                <strong>{recommendedSchemes.length} Schemes</strong> match your cultivation profile
              </span>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            paddingTop: 12,
            borderTop: '1px solid rgba(255,255,255,0.2)',
            fontSize: '0.85rem'
          }}>
            <div>
              <span style={{ color: '#d1c4e9' }}>Farm Landholding:</span>
              <div style={{ fontWeight: 700 }}>
                {farmerContext.area_acres} Acres {farmerContext.is_small_marginal ? '(Small & Marginal < 5 Ac)' : '(Large Farmer)'}
              </div>
            </div>
            <div>
              <span style={{ color: '#d1c4e9' }}>Plot Soil Type:</span>
              <div style={{ fontWeight: 700 }}>{farmerContext.soil_type}</div>
            </div>
            <div>
              <span style={{ color: '#d1c4e9' }}>Irrigation Source:</span>
              <div style={{ fontWeight: 700 }}>{farmerContext.irrigation_type}</div>
            </div>
            <div>
              <span style={{ color: '#d1c4e9' }}>State Jurisdiction:</span>
              <div style={{ fontWeight: 700 }}>{farmerContext.state}</div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Filters, Search & Crop Recalculation Bar */}
      <div className="card" style={{ padding: 18, marginBottom: 20 }}>
        {/* Search & Recalculate */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <Search size={16} color="#888" style={{ position: 'absolute', left: 10, top: 11 }} />
            <input
              type="text"
              placeholder="Search schemes, subsidies, keywords..."
              className="form-input"
              style={{ paddingLeft: 34, fontSize: '0.85rem' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Test other Crop */}
          <div>
            <select
              className="form-select"
              value={cropOverride}
              onChange={(e) => {
                setCropOverride(e.target.value);
                fetchSchemes(e.target.value, areaOverride);
              }}
              style={{ fontSize: '0.85rem' }}
            >
              <option value="Wheat">Test for: Wheat</option>
              <option value="Rice (Paddy)">Test for: Rice (Paddy)</option>
              <option value="Maize (Corn)">Test for: Maize (Corn)</option>
              <option value="Cotton">Test for: Cotton</option>
              <option value="Mustard / Rapeseed">Test for: Mustard / Rapeseed</option>
              <option value="Potato">Test for: Potato</option>
              <option value="Tomato">Test for: Tomato</option>
              <option value="Soybean">Test for: Soybean</option>
              <option value="Onion">Test for: Onion</option>
              <option value="Gram (Chickpea / Chana)">Test for: Gram (Chickpea)</option>
              <option value="Groundnut (Peanut)">Test for: Groundnut</option>
              <option value="Sugarcane">Test for: Sugarcane</option>
            </select>
          </div>

          {/* Test other Land Size */}
          <div>
            <select
              className="form-select"
              value={areaOverride <= 5 ? 'small' : 'large'}
              onChange={(e) => {
                const newArea = e.target.value === 'small' ? '2.5' : '8.0';
                setAreaOverride(newArea);
                fetchSchemes(cropOverride, newArea);
              }}
              style={{ fontSize: '0.85rem' }}
            >
              <option value="small">Land: Small & Marginal (&le; 5 Acres)</option>
              <option value="large">Land: Large Farmer (&gt; 5 Acres)</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                fontSize: '0.8rem',
                padding: '6px 14px',
                borderRadius: 20,
                border: selectedCategory === cat ? '1px solid #512da8' : '1px solid #e0e0e0',
                background: selectedCategory === cat ? '#ede7f6' : '#fff',
                color: selectedCategory === cat ? '#311b92' : '#555',
                cursor: 'pointer',
                fontWeight: selectedCategory === cat ? 700 : 500,
                transition: 'all 0.15s ease'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Schemes Grid */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem', color: '#666' }}>
          <Landmark size={36} color="#512da8" style={{ marginBottom: 12, animation: 'pulse 1.5s infinite' }} />
          <div style={{ fontSize: '1rem', fontWeight: 600 }}>Analyzing and ranking Government Schemes for your farm...</div>
          <div style={{ fontSize: '0.82rem', color: '#888', marginTop: 4 }}>Checking eligibility criteria against official central & state portals</div>
        </div>
      ) : displayedSchemes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
          <AlertCircle size={36} color="#f59e0b" style={{ marginBottom: 8 }} />
          <h3 style={{ fontSize: '1.1rem', margin: '0 0 6px 0', color: '#333' }}>No Schemes Found</h3>
          <p style={{ fontSize: '0.85rem', color: '#666', margin: 0 }}>
            No schemes matched your category or search filter. Try clearing the search or choosing "All".
          </p>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSearchQuery('');
              setActiveTab('all');
            }}
            className="btn-outline"
            style={{ marginTop: 14, fontSize: '0.85rem' }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {displayedSchemes.map(scheme => {
            const isRecommended = scheme.is_recommended;
            const targetUrl = scheme.official_portal || scheme.official_url || 'https://myscheme.gov.in';

            return (
              <div
                key={scheme.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: 22,
                  borderTop: isRecommended ? '4px solid #2e7d32' : '4px solid #512da8',
                  boxShadow: isRecommended ? '0 6px 18px rgba(46, 125, 50, 0.12)' : 'none',
                  background: isRecommended ? '#fcfdfc' : '#ffffff',
                  position: 'relative'
                }}
              >
                <div>
                  {/* Top Badges */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      <span style={{ fontSize: '0.72rem', background: '#ede7f6', color: '#512da8', padding: '3px 8px', borderRadius: 4, fontWeight: 700 }}>
                        {scheme.category}
                      </span>
                      {isRecommended && (
                        <span style={{ fontSize: '0.72rem', background: '#e8f5e9', color: '#1b5e20', padding: '3px 8px', borderRadius: 4, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <Sparkles size={12} /> {scheme.match_score}% RECOMMENDED
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Scheme Title */}
                  <h3 style={{ fontSize: '1.18rem', fontWeight: 800, margin: '0 0 10px 0', color: isRecommended ? '#1b5e20' : '#311b92', lineHeight: 1.3 }}>
                    {scheme.name}
                  </h3>

                  {/* Why it is Recommended (Recommendation Reasons) */}
                  {scheme.recommendation_reasons && scheme.recommendation_reasons.length > 0 && (
                    <div style={{
                      background: '#f1f8e9',
                      borderLeft: '3px solid #4caf50',
                      borderRadius: 6,
                      padding: '8px 12px',
                      marginBottom: 12,
                      fontSize: '0.8rem',
                      color: '#2e7d32'
                    }}>
                      <div style={{ fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle2 size={14} /> Why Recommended For You:
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.4 }}>
                        {scheme.recommendation_reasons.map((reason, idx) => (
                          <li key={idx}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Deadline Notification Badge */}
                  <div style={{
                    background: '#fef3c7',
                    border: '1px solid #fde68a',
                    borderRadius: 8,
                    padding: '6px 10px',
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.8rem',
                    color: '#92400e'
                  }}>
                    <Clock size={15} color="#b45309" style={{ flexShrink: 0 }} />
                    <span><strong>Application Deadline:</strong> {scheme.last_date}</span>
                  </div>

                  {/* Details Body */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', fontSize: '0.84rem' }}>
                    <div>
                      <strong style={{ color: '#222' }}>Financial Benefits & Assistance:</strong>
                      <p style={{ color: '#4b5563', margin: '3px 0 0 0', lineHeight: 1.45 }}>{scheme.benefits}</p>
                    </div>

                    <div>
                      <strong style={{ color: '#222' }}>Eligibility Criteria:</strong>
                      <p style={{ color: '#4b5563', margin: '3px 0 0 0', lineHeight: 1.45 }}>{scheme.eligibility}</p>
                    </div>

                    {scheme.applicable_crops && (
                      <div>
                        <strong style={{ color: '#222' }}>Applicable Crops:</strong>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 3 }}>
                          {scheme.applicable_crops.map((c, i) => (
                            <span key={i} style={{ fontSize: '0.72rem', background: '#f3f4f6', color: '#374151', padding: '2px 6px', borderRadius: 4 }}>
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {scheme.documents_required && scheme.documents_required.length > 0 && (
                      <div>
                        <strong style={{ color: '#222' }}>Required Documents:</strong>
                        <ul style={{ paddingLeft: '1.2rem', margin: '3px 0 0 0', color: '#4b5563', lineHeight: 1.4 }}>
                          {scheme.documents_required.map((doc, i) => (
                            <li key={i}>{doc}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {scheme.apply_steps && (
                      <div style={{ background: '#f9fafb', padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb' }}>
                        <strong style={{ color: '#374151', fontSize: '0.8rem' }}>How to Apply:</strong>
                        <p style={{ color: '#4b5563', margin: '2px 0 0 0', fontSize: '0.8rem', lineHeight: 1.4 }}>
                          {scheme.apply_steps}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Direct Official Portal External Link Button */}
                <div style={{ marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid #f0f0f0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#888', marginBottom: 6, textAlign: 'center' }}>
                    Verified by: {scheme.verified_by || 'Government of India'}
                  </div>
                  <a
                    href={targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      width: '100%',
                      padding: '0.65rem 1rem',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      textDecoration: 'none',
                      boxSizing: 'border-box',
                      borderRadius: '8px',
                      background: isRecommended ? '#1b5e20' : '#512da8',
                      color: 'white',
                      transition: 'background 0.2s ease',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                    }}
                    title={`Open official external portal: ${targetUrl}`}
                  >
                    <span>Apply on Official Portal</span>
                    <ExternalLink size={15} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Official Disclaimer */}
      <div style={{ marginTop: 24, padding: 14, background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb', textAlign: 'center', fontSize: '0.78rem', color: '#6b7280' }}>
        <strong>Notice:</strong> All schemes and direct application links connect exclusively to secure, authorized Central and State Government portals (.gov.in / .nic.in). KisanSathi never charges any fee or collects banking passwords. Apply directly on the official portal.
      </div>
    </div>
  );
}
