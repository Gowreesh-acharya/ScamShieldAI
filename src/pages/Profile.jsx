import { useState } from 'react';
import {
  User,
  Shield,
  Database,
  Download,
  CheckCircle2,
  Award
} from 'lucide-react';
import { getScanHistory, getScanStats } from '../utils/storage';

export default function Profile() {
  const [stats] = useState(() => getScanStats());
  const [analystName, setAnalystName] = useState('Cyber Defense Analyst');
  const [organization, setOrganization] = useState('Build Bengaluru Security Ops');
  const [apiKey, setApiKey] = useState('scamshield-gemini-live-session');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleExportData = () => {
    const history = getScanHistory();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `scamshield-audit-export-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="page-content">
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Left Column: Analyst Identity Card */}
        <div className="scanner-panel" style={{ padding: '24px', textAlign: 'center' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-surface-secondary)',
              border: '2px solid var(--accent-champagne)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
              color: 'var(--accent-champagne)'
            }}
          >
            <User size={36} />
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '4px' }}>
            {analystName}
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
            {organization}
          </p>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', backgroundColor: 'var(--bg-surface-secondary)', borderRadius: '12px', fontSize: '11px', color: 'var(--accent-champagne)', border: '1px solid var(--border-subtle)', marginBottom: '20px' }}>
            <Award size={13} />
            <span>Tier 1 Security Clearance</span>
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Audits:</span>
              <span className="font-mono" style={{ fontWeight: 700 }}>{stats.totalScans}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Threats Intercepted:</span>
              <span className="font-mono" style={{ fontWeight: 700, color: 'var(--threat-danger)' }}>{stats.threatsDetected}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Session Security:</span>
              <span style={{ color: 'var(--threat-safe)', fontWeight: 600 }}>End-to-End Ephemeral</span>
            </div>
          </div>
        </div>

        {/* Right Column: Profile Preferences & Key Management */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Identity & Org Form */}
          <div className="scanner-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', marginBottom: '16px' }}>
              <Shield size={16} color="var(--accent-champagne)" />
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-heading)' }}>
                Analyst Identity & Organization
              </h4>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Analyst Display Name</label>
                  <input
                    type="text"
                    className="cyber-input"
                    value={analystName}
                    onChange={(e) => setAnalystName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Organization / Hackathon Team</label>
                  <input
                    type="text"
                    className="cyber-input"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">FastAPI Model Secret Key / API Token</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="password"
                    className="cyber-input"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button type="submit" className="btn-primary" style={{ height: '36px', padding: '0 16px' }}>
                    Save Profile
                  </button>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Stored safely in browser session memory. Never sent to unverified remote servers.
                </span>
              </div>

              {savedSuccess && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--threat-safe)', fontSize: '12px' }}>
                  <CheckCircle2 size={14} />
                  <span>Profile updated successfully.</span>
                </div>
              )}
            </form>
          </div>

          {/* Audit History & Privacy Operations */}
          <div className="scanner-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', marginBottom: '14px' }}>
              <Database size={16} color="var(--accent-champagne)" />
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-heading)' }}>
                Audit Data Management
              </h4>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
              All scans, OCR extractions, and threat indicators are stored in your browser\'s local storage. You can export complete telemetry for incident reporting or review.
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleExportData}
                style={{ height: '34px', fontSize: '12px', padding: '0 14px' }}
              >
                <Download size={14} />
                <span>Export Audit Log (JSON)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
