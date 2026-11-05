import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import apiClient from '../services/api';
import { Camera, Upload, AlertTriangle, ShieldCheck, PhoneCall, Volume2, CheckCircle2, Leaf, RefreshCw } from 'lucide-react';

export default function DiseaseIdentificationPage() {
  const { farmer, activeCrop, language } = useApp();

  const [cropName, setCropName] = useState(activeCrop?.crop_name || 'Rice (Paddy)');
  const [symptoms, setSymptoms] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const COMMON_SYMPTOM_TAGS = [
    'Yellowing leaves (Chlorosis)',
    'Brown spindle spots with grey center',
    'Deadhearts in central shoot',
    'White powdery patches on leaves',
    'Curled puckered leaves (Leaf Curl)',
    'Downward curling & bronze underside (Mites)',
    'Upward boat-shaped curl (Thrips)',
    'Ragged leaf holes & whorl frass (Fall Armyworm)',
    'Water-soaked dark lesions (Late Blight)',
    'Black sunken spots on fruit (Anthracnose)',
    'Linear yellow stripes (Stripe Rust)',
    'Wilting shoots & fruit borer holes'
  ];

  const handleToggleSymptom = (tag) => {
    setSelectedSymptoms(prev => {
      const updated = prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag];
      setSymptoms(updated.join(', '));
      return updated;
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setError('Please choose an image under 8MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
      setImageBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!symptoms && !imageBase64) {
      setError('Please provide either a photo or select/describe the symptoms observed.');
      return;
    }

    try {
      setAnalyzing(true);
      const res = await apiClient.post('/disease/identify', {
        farmerId: farmer?.id,
        crop_name: cropName,
        symptoms: symptoms,
        image_base64: imageBase64
      });

      if (res.success && res.data?.diagnosis) {
        setResult(res.data);
      } else {
        setError(res.error || 'Diagnostic analysis failed');
      }
    } catch (err) {
      setError(err.message || 'Diagnostic analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSpeak = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (language === 'hi') utterance.lang = 'hi-IN';
    else if (language === 'kn') utterance.lang = 'kn-IN';
    else utterance.lang = 'en-IN';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div style={{ maxWidth: 880, margin: '20px auto', padding: '0 16px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{
            background: '#e8f5e9',
            color: '#2e7d32',
            padding: '6px 10px',
            borderRadius: 8,
            display: 'inline-flex'
          }}>
            <Leaf size={22} />
          </span>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: '#1b5e20' }}>
            AI Crop Disease Identification
          </h1>
        </div>
        <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
          Separate ML Pathology Model: Instant diagnosis, organic control, cultural practices & KVK assistance
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* Input Panel */}
        <div className="card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 16px 0', color: '#333' }}>
            Submit Crop Symptoms or Photo
          </h2>

          {error && (
            <div style={{ padding: '10px 14px', background: '#ffebee', color: '#c62828', borderRadius: 8, marginBottom: 16, fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleAnalyze}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
                Crop Name
              </label>
              <select
                value={cropName}
                onChange={(e) => setCropName(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #ccc' }}
              >
                <option value="Rice (Paddy)">Rice / Paddy (ಭತ್ತ / धान)</option>
                <option value="Wheat">Wheat (ಗೋಧಿ / गेहूं)</option>
                <option value="Maize">Maize (ಮೆಕ್ಕೆಜೋಳ / मक्का)</option>
                <option value="Tomatoes">Tomatoes (ಟೊಮ್ಯಾಟೊ / टमाटर)</option>
                <option value="Chillies">Chillies (ಮೆಣಸಿನಕಾಯಿ / मिर्च)</option>
                <option value="Potato">Potato (ಆಲೂಗಡ್ಡೆ / आलू)</option>
                <option value="Brinjal">Brinjal / Eggplant (ಬದನೆಕಾಯಿ / बैंगन)</option>
                <option value="Cotton">Cotton (ಹತ್ತಿ / कपास)</option>
                <option value="Mustard">Mustard (ಸಾಸಿವೆ / सरसों)</option>
                <option value="Bean">Beans / Pulses (ಹುರುಳಿ / दाल / फलियां)</option>
              </select>
            </div>

            {/* Photo Upload Box */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
                Upload Leaf / Crop Photo (Optional)
              </label>
              <div style={{
                border: '2px dashed #81c784',
                borderRadius: 10,
                padding: '20px 14px',
                textAlign: 'center',
                background: '#f9fbf9',
                cursor: 'pointer',
                position: 'relative'
              }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer'
                  }}
                />
                {imagePreview ? (
                  <div>
                    <img
                      src={imagePreview}
                      alt="Crop specimen"
                      style={{ maxHeight: 180, maxWidth: '100%', borderRadius: 8, objectFit: 'contain' }}
                    />
                    <div style={{ fontSize: '0.78rem', color: '#2e7d32', marginTop: 8, fontWeight: 600 }}>
                      ✓ Image loaded. Click to replace.
                    </div>
                  </div>
                ) : (
                  <div>
                    <Camera size={36} style={{ color: '#2e7d32', marginBottom: 8 }} />
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#333' }}>
                      Take photo or tap to browse
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#888', marginTop: 4 }}>
                      JPEG or PNG (up to 8MB)
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Common Symptom Quick Chips */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
                Select Common Symptoms
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {COMMON_SYMPTOM_TAGS.map(tag => {
                  const isSelected = selectedSymptoms.includes(tag);
                  return (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => handleToggleSymptom(tag)}
                      style={{
                        fontSize: '0.78rem',
                        padding: '5px 9px',
                        borderRadius: 16,
                        border: isSelected ? '1px solid #2e7d32' : '1px solid #ddd',
                        background: isSelected ? '#e8f5e9' : '#fff',
                        color: isSelected ? '#1b5e20' : '#444',
                        cursor: 'pointer',
                        fontWeight: isSelected ? 600 : 400
                      }}
                    >
                      {isSelected ? '✓ ' : '+ '} {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Text description */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
                Describe Symptoms in Detail
              </label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                rows={3}
                placeholder="e.g. Spindle shaped spots with brown margin on leaves, spreading rapidly after recent rain..."
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid #ccc',
                  fontSize: '0.88rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={analyzing}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '1rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              {analyzing ? (
                <>
                  <RefreshCw size={18} className="spin" /> Running ML Diagnostic Engine...
                </>
              ) : (
                <>
                  <ShieldCheck size={18} /> Diagnose Crop Issue
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Panel */}
        <div>
          {result?.diagnosis ? (
            <div className="card" style={{ padding: 22, borderTop: '4px solid #2e7d32' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <span style={{
                    fontSize: '0.72rem',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 4,
                    background: result.diagnosis.severity === 'Severe' || result.diagnosis.severity === 'Critical' ? '#ffebee' : '#fff3e0',
                    color: result.diagnosis.severity === 'Severe' || result.diagnosis.severity === 'Critical' ? '#c62828' : '#e65100'
                  }}>
                    {result.diagnosis.severity} Threat
                  </span>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '8px 0 2px 0', color: '#1b5e20' }}>
                    {result.diagnosis.disease_name}
                  </h3>
                  <div style={{ fontSize: '0.82rem', color: '#555' }}>
                    Type: <strong>{result.diagnosis.pathogen_type}</strong> | AI Confidence: <strong>{result.diagnosis.confidence}%</strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSpeak(`${result.diagnosis.disease_name}. ${result.diagnosis.organic_treatment}. ${result.diagnosis.cultural_practices}`)}
                  title="Listen in your language"
                  style={{
                    background: '#e8f5e9',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: 8,
                    color: '#2e7d32',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.82rem',
                    fontWeight: 600
                  }}
                >
                  <Volume2 size={16} /> Listen
                </button>
              </div>

              {/* Symptoms Identified */}
              <div style={{ marginBottom: 14, background: '#fafafa', padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#333', marginBottom: 4 }}>
                  Identified Symptoms:
                </div>
                <div style={{ fontSize: '0.85rem', color: '#555' }}>
                  {result.diagnosis.symptoms_identified}
                </div>
              </div>

              {/* Organic Treatment */}
              <div style={{ marginBottom: 14, background: '#f1f8e9', padding: 12, borderRadius: 8, borderLeft: '3px solid #689f38' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#33691e', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={16} /> Immediate Organic / Cultural Remedies:
                </div>
                <div style={{ fontSize: '0.85rem', color: '#33691e' }}>
                  {result.diagnosis.organic_treatment}
                </div>
              </div>

              {/* Cultural Practices */}
              <div style={{ marginBottom: 14, background: '#fffde7', padding: 12, borderRadius: 8, borderLeft: '3px solid #fbc02d' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f57f17', marginBottom: 4 }}>
                  🌾 Field Cultural Adjustments:
                </div>
                <div style={{ fontSize: '0.85rem', color: '#5d4037' }}>
                  {result.diagnosis.cultural_practices}
                </div>
              </div>

              {/* Chemical Guidelines with Strict Statutory Warning */}
              <div style={{ marginBottom: 16, background: '#fafafa', padding: 12, borderRadius: 8, border: '1px solid #e0e0e0' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#424242', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={15} style={{ color: '#f57c00' }} /> Chemical Treatment Guidance (Advisory Only):
                </div>
                <div style={{ fontSize: '0.84rem', color: '#424242' }}>
                  {result.diagnosis.chemical_guidelines}
                </div>
              </div>

              {/* KVK Hotline */}
              <div style={{
                background: '#e3f2fd',
                padding: '12px 14px',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <PhoneCall size={20} style={{ color: '#1565c0' }} />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0d47a1' }}>
                      Kisan Call Center Toll-Free Helpline
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#1565c0' }}>
                      1800-180-1551 (6 AM - 10 PM, All Indian Languages)
                    </div>
                  </div>
                </div>
                <a
                  href="tel:18001801551"
                  className="btn"
                  style={{
                    background: '#1565c0',
                    color: '#fff',
                    padding: '6px 12px',
                    borderRadius: 6,
                    fontSize: '0.8rem',
                    textDecoration: 'none',
                    fontWeight: 600
                  }}
                >
                  Call Now
                </a>
              </div>

              <div style={{ fontSize: '0.72rem', color: '#888', marginTop: 12, textAlign: 'center' }}>
                Model: {result.model_used}
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: 36, textAlign: 'center', color: '#777' }}>
              <Leaf size={48} style={{ color: '#a5d6a7', marginBottom: 12 }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#333', margin: '0 0 8px 0' }}>
                No Diagnosis Generated Yet
              </h3>
              <p style={{ fontSize: '0.88rem', margin: 0, maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' }}>
                Upload a crop photo or choose symptoms on the left to run our specialized plant pathology ML model.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
