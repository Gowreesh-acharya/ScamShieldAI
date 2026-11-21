import { useState } from 'react';
import {
  Globe,
  ShieldAlert,
  Trash2,
  AlertCircle,
  Link2,
  CheckCircle2,
  Server,
  Layers,
  Info
} from 'lucide-react';
import { scanUrlApi } from '../services/api';
import { saveScan } from '../utils/storage';
import RiskResultCard from '../components/RiskResultCard';
import ScanProgress from '../components/ScanProgress';

const SAMPLE_URLS = [
  {
    label: 'Fake SBI KYC Portal (.xyz)',
    type: 'danger',
    url: 'http://sbi-kyc-verify.update-portal.xyz/login'
  },
  {
    label: 'Fake BESCOM Portal (Raw IP)',
    type: 'danger',
    url: 'http://192.168.1.104/bescom-bill-payment-gateway/recharge.php'
  },
  {
    label: 'URL Shortener with Open Redirect',
    type: 'warning',
    url: 'http://bit.ly/claim-bonus?redirect=http://malicious-landing.tk'
  },
  {
    label: 'Official SBI Domain (Safe)',
    type: 'safe',
    url: 'https://onlinesbi.sbi/sbijava/osbi_online_security.html'
  },
  {
    label: 'Official Google Portal (Safe)',
    type: 'safe',
    url: 'https://www.google.com'
  }
];

export default function UrlScanner({ onScanComplete }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const validateUrl = (input) => {
    if (!input || !input.trim()) {
      return 'Please enter a URL to scan.';
    }
    const trimmed = input.trim();
    if (!trimmed.includes('.') || trimmed.length < 4) {
      return 'Please enter a valid web address or domain (e.g., example.com or http://...).';
    }
    return null;
  };

  const handleScan = async (e) => {
    if (e) e.preventDefault();

    const validationErr = validateUrl(url);
    if (validationErr) {
      setError(validationErr);
      return;
    }

    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const scanResult = await scanUrlApi(url);
      setResult(scanResult);
      saveScan(scanResult);
      if (onScanComplete) onScanComplete();
    } catch (err) {
      setError(err.message || 'An error occurred during URL evaluation.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setUrl('');
    setError(null);
    setResult(null);
  };

  const handleLoadSample = (sampleUrl) => {
    setUrl(sampleUrl);
    setError(null);
    setResult(null);
  };

  const intel = result?.advancedIntelligence;
  const domain = result?.domainDetails;

  return (
    <div className="page-content">
      <div className="scanner-grid">
        {/* Left Column: Form & Presets */}
        <div className="scanner-panel">
          <div className="scanner-panel-header">
            <h3>
              <Globe size={16} color="var(--accent-sky)" />
              Advanced URL Intelligence Engine
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              DNS / SSL / Typosquatting / Rep
            </span>
          </div>

          {/* Sample Presets */}
          <div className="presets-container">
            <span className="presets-title">Load Target Scenario:</span>
            <div className="presets-list">
              {SAMPLE_URLS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="preset-chip"
                  onClick={() => handleLoadSample(sample.url)}
                >
                  <span className={`preset-dot ${sample.type}`} />
                  <span>{sample.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleScan} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="url-input">
                <span>Target Web Address (URL)</span>
                <span className="char-counter">Normalizes syntax, host & parameters</span>
              </label>

              <div className="input-with-icon">
                <Link2 className="input-icon-prefix" size={16} />
                <input
                  id="url-input"
                  type="text"
                  className="cyber-input"
                  placeholder="https://example.com or http://192.168.1.1/..."
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
                disabled={loading || !url.trim()}
              >
                <ShieldAlert size={15} />
                <span>{loading ? 'Executing Intelligence Analysis...' : 'Inspect URL'}</span>
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={handleClear}
                disabled={loading || (!url && !result && !error)}
              >
                <Trash2 size={13} />
                <span>Clear</span>
              </button>
            </div>
          </form>

          {/* Critical Security Notice */}
          <div style={{ backgroundColor: 'var(--bg-surface-input)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ffffff', fontWeight: 600, marginBottom: '3px' }}>
              <Info size={13} color="var(--accent-sky)" />
              <span>Safe Server-Side Inspection Protocol</span>
            </div>
            <span>Never visit suspicious URLs directly in a browser. ScamShield inspects structural anomalies and syntax safely without executing hostile client-side scripts.</span>
          </div>
        </div>

        {/* Right Column: Progress or Result */}
        <div>
          {loading && <ScanProgress type="url" />}

          {!loading && result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Domain Breakdown Strip */}
              {domain && (
                <div style={{ backgroundColor: 'var(--bg-surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '14px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div>
                    <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Protocol & Scheme</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: domain.protocol === 'https:' ? 'var(--threat-safe)' : 'var(--threat-danger)', fontFamily: 'var(--font-mono)' }}>
                      {domain.protocol || 'http:'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Target Hostname</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={domain.hostname}>
                      {domain.hostname}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Top-Level Domain</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-sky)', fontFamily: 'var(--font-mono)' }}>
                      {domain.tld || 'N/A'}
                    </div>
                  </div>
                </div>
              )}

              {/* Advanced Categorized Security Intelligence */}
              {intel && (
                <div style={{ backgroundColor: 'var(--bg-surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layers size={14} color="var(--accent-sky)" />
                    <span>Intelligence Category Breakdown</span>
                  </div>

                  {/* 1. Observed URL Characteristics */}
                  <div style={{ backgroundColor: 'var(--bg-surface-input)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-sky)', marginBottom: '4px' }}>
                      Observed URL Characteristics (Factual Syntax)
                    </div>
                    {intel.observedTraits?.length > 0 ? (
                      <ul style={{ paddingLeft: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {intel.observedTraits.map((trait, idx) => (
                          <li key={idx} style={{ marginTop: '2px' }}>{trait}</li>
                        ))}
                      </ul>
                    ) : (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Standard web address format.</div>
                    )}
                  </div>

                  {/* 2. Heuristic Risk Indicators */}
                  <div style={{ backgroundColor: 'var(--bg-surface-input)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--threat-warning)', marginBottom: '4px' }}>
                      Heuristic Risk Indicators (Calculated Probability)
                    </div>
                    {intel.heuristicIndicators?.length > 0 ? (
                      <ul style={{ paddingLeft: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {intel.heuristicIndicators.map((ind, idx) => (
                          <li key={idx} style={{ marginTop: '2px' }}>{ind}</li>
                        ))}
                      </ul>
                    ) : (
                      <div style={{ fontSize: '12px', color: 'var(--threat-safe)' }}>No structural anomalies detected.</div>
                    )}
                  </div>

                  {/* 3. External Threat Feed Status */}
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Server size={12} />
                    <span>{intel.threatFeedStatus}</span>
                  </div>
                </div>
              )}

              {/* Master Risk Result Card */}
              <RiskResultCard result={result} />
            </div>
          )}

          {!loading && !result && (
            <div className="empty-results-box">
              <Globe size={32} color="var(--border-medium)" />
              <h4>Awaiting URL Input</h4>
              <p style={{ maxWidth: '320px', fontSize: '13px' }}>
                Enter a target domain or choose a test scenario to inspect SSL certificates, brand impersonation, and DNS anomalies.
              </p>

              <div className="empty-checklist">
                <div className="empty-checklist-item">
                  <CheckCircle2 size={13} color="var(--accent-sky)" />
                  <span>Flags unencrypted plaintext HTTP transmissions</span>
                </div>
                <div className="empty-checklist-item">
                  <CheckCircle2 size={13} color="var(--accent-sky)" />
                  <span>Detects deceptive brand keywords in subdomains</span>
                </div>
                <div className="empty-checklist-item">
                  <CheckCircle2 size={13} color="var(--accent-sky)" />
                  <span>Identifies raw IP hosting and high-risk TLDs</span>
                </div>
                <div className="empty-checklist-item">
                  <CheckCircle2 size={13} color="var(--accent-sky)" />
                  <span>Inspects open redirect parameters in query strings</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
