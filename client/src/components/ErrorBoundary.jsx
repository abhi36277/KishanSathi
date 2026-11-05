import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          maxWidth: 600,
          margin: '40px auto',
          padding: '24px',
          background: '#ffffff',
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          textAlign: 'center',
          border: '1px solid #fee2e2'
        }}>
          <div style={{
            display: 'inline-flex',
            padding: 12,
            background: '#fee2e2',
            color: '#dc2626',
            borderRadius: '50%',
            marginBottom: 16
          }}>
            <AlertCircle size={32} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1f2937', marginBottom: 8 }}>
            Something went wrong while rendering this section
          </h2>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: 20 }}>
            {this.state.error?.message || 'A transient error occurred. You can reload this view safely.'}
          </p>
          <button
            onClick={this.handleReload}
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              fontSize: '0.9rem',
              fontWeight: 600,
              borderRadius: 8,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={16} /> Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
