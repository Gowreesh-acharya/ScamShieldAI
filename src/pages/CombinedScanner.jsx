import { useState } from 'react';
import { Layers, ShieldAlert, Trash2, AlertCircle, Link2, Sparkles, MessageSquare, Globe, CheckCircle2 } from 'lucide-react';
import { scanCombinedApi } from '../services/api';
import { saveScan } from '../utils/storage';
import RiskResultCard from '../components/RiskResultCard';
import ScanProgress from '../components/ScanProgress';

const SAMPLE_COMBINED = [
  {
    label: 'BESCOM Power Cutoff + Fake Portal',
    type: 'danger',
    text: 'URGENT BESCOM ALERT: Your electricity connection will be disconnected tonight at 09:30 PM due to previous month bill update failure. Call bill officer immediately at 8912345678 or pay here.',
    url: 'http://bescom-bill-desk.online/pay'
  },
  {
    label: 'SBI YONO KYC Warning + Phishing Link',
    type: 'danger',
    text: 'Dear Customer, your SBI account will be blocked today. Update your PAN card immediately to avoid suspension.',
    url: 'http://sbi-kyc-verify.update-portal.xyz/login'
  },
  {
    label: 'Swiggy Delivery + Official App (Safe)',
    type: 'safe',
    text: 'Your Swiggy delivery partner is on the way with your order #92831. Track live delivery in real time.',
    url: 'https://swiggy.com/order-status/92831'
  }
];

export default function CombinedScanner({ onScanComplete }) {
  const [message, setMessage] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleExtractUrl = () => {
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const matches = message.match(urlRegex);
    if (matches && matches.length > 0) {
      setUrl(matches[0]);
      setError(null);
    } else {
      setError('No URL link (http:// or https://) was found inside the message text.');
    }
  };

  const handleAnalyze = async (e) => {
    if (e) e.preventDefault();

    if (!message.trim() && !url.trim()) {
      setError('Please provide at least a message or a URL for combined analysis.');
      return;
    }

    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const scanResult = await scanCombinedApi(message, url);
      setResult(scanResult);
      saveScan(scanResult);
      if (onScanComplete) onScanComplete();
    } catch (err) {
      setError(err.message || 'An error occurred during combined threat analysis.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessage('');
    setUrl('');
    setError(null);
    setResult(null);
  };

  const handleLoadSample = (sample) => {
    setMessage(sample.text);
    setUrl(sample.url);
    setError(null);
    setResult(null);
  };

  return (
    <div className="page-content">
      <div className="scanner-grid">
        {/* Left Column: Form & Presets */}
        <div className="scanner-panel">
          <div className="scanner-panel-header">
            <h3>
              <Layers size={16} color="var(--accent-sky)" />
              Combined Vector Correlation Engine
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Cross-Vector Correlation
            </span>
          </div>

          {/* Sample Presets */}
          <div className="presets-container">
            <span className="presets-title">Load Target Scenario:</span>
            <div className="presets-list">
              {SAMPLE_COMBINED.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="preset-chip"
                  onClick={() => handleLoadSample(sample)}
                >
                  <span className={`preset-dot ${sample.type}`} />
                  <span>{sample.label}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleAnalyze} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Message input */}
            <div className="form-group">
              <div className="form-label">
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MessageSquare size={13} color="var(--accent-sky)" />
                  Message / Communication Text
                </span>
                <span className="char-counter">{message.length} chars</span>
              </div>
              <textarea
                className="cyber-textarea"
                rows={4}
                placeholder="Paste the SMS or message body here..."
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (error) setError(null);
                }}
              />
            </div>

            {/* Quick Auto-extract button */}
            {message && message.includes('http') && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleExtractUrl}
                  style={{ height: '28px', fontSize: '11px', padding: '0 8px', color: 'var(--accent-sky)' }}
                >
                  <Sparkles size={11} />
                  <span>Auto-Extract Link from Text</span>
                </button>
              </div>
            )}

            {/* URL input */}
            <div className="form-group">
              <div className="form-label">
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Globe size={13} color="var(--accent-sky)" />
                  Associated Target Destination Link
                </span>
              </div>
              <div className="input-with-icon">
                <Link2 className="input-icon-prefix" size={16} />
                <input
                  type="text"
                  className="cyber-input"
                  placeholder="https://example.com/payment or landing portal..."
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    if (error) setError(null);
                  }}
                />
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="alert-banner warning">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={15} />
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="form-actions">
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || (!message.trim() && !url.trim())}
              >
                <ShieldAlert size={15} />
                <span>{loading ? 'Correlating Vectors...' : 'Run Combined Audit'}</span>
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={handleClear}
                disabled={loading || (!message && !url && !result && !error)}
              >
                <Trash2 size={13} />
                <span>Clear</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Progress or Result */}
        <div>
          {loading && <ScanProgress type="combined" />}

          {!loading && result && (
            <div>
              {/* Sub-analysis score strip */}
              {(result.messageSubAnalysis || result.urlSubAnalysis) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ backgroundColor: 'var(--bg-surface-card)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Message Sub-Score
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: '2px', color: result.messageSubAnalysis?.score >= 70 ? 'var(--threat-danger)' : (result.messageSubAnalysis?.score >= 30 ? 'var(--threat-warning)' : 'var(--threat-safe)') }}>
                      {result.messageSubAnalysis?.score ?? 0} <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>/ 100</span>
                    </div>
                  </div>
                  <div style={{ backgroundColor: 'var(--bg-surface-card)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      URL Sub-Score
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: '2px', color: result.urlSubAnalysis?.score >= 70 ? 'var(--threat-danger)' : (result.urlSubAnalysis?.score >= 30 ? 'var(--threat-warning)' : 'var(--threat-safe)') }}>
                      {result.urlSubAnalysis ? result.urlSubAnalysis.score : 'N/A'} <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>{result.urlSubAnalysis ? '/ 100' : ''}</span>
                    </div>
                  </div>
                </div>
              )}

              <RiskResultCard result={result} />
            </div>
          )}

          {!loading && !result && (
            <div className="empty-results-box">
              <Layers size={32} color="var(--border-medium)" />
              <h4>Awaiting Combined Attack Input</h4>
              <p style={{ maxWidth: '320px', fontSize: '13px' }}>
                Inspect a message lure and its associated link simultaneously to detect compound social engineering attacks and destination mismatches.
              </p>

              <div className="empty-checklist">
                <div className="empty-checklist-item">
                  <CheckCircle2 size={13} color="var(--accent-sky)" />
                  <span>Cross-references message identity against domain ownership</span>
                </div>
                <div className="empty-checklist-item">
                  <CheckCircle2 size={13} color="var(--accent-sky)" />
                  <span>Calculates compounded risk when urgency meets suspicious URLs</span>
                </div>
                <div className="empty-checklist-item">
                  <CheckCircle2 size={13} color="var(--accent-sky)" />
                  <span>Provides unified remediation protocol for the entire vector</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
