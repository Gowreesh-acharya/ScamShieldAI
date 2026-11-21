import { useState } from 'react';
import {
  Sun,
  Moon,
  Laptop,
  Globe,
  Bell,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Server
} from 'lucide-react';
import { checkBackendStatus, getApiBaseUrl } from '../services/api';
import { clearScanHistory } from '../utils/storage';

export default function Settings({ theme, onThemeChange, onRefreshHistory }) {
  const [testingBackend, setTestingBackend] = useState(false);
  const [backendTestStatus, setBackendTestStatus] = useState(null);
  const [notifications, setNotifications] = useState(true);
  const [defaultLang, setDefaultLang] = useState('auto');
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [clearedMessage, setClearedMessage] = useState(false);

  const handleTestBackend = async () => {
    setTestingBackend(true);
    setBackendTestStatus(null);
    try {
      const status = await checkBackendStatus();
      setBackendTestStatus(status);
    } catch {
      setBackendTestStatus({ online: false, error: 'Connection failed' });
    } finally {
      setTestingBackend(false);
    }
  };

  const handleClearHistory = () => {
    clearScanHistory();
    setConfirmClearOpen(false);
    setClearedMessage(true);
    if (onRefreshHistory) onRefreshHistory();
    setTimeout(() => setClearedMessage(false), 3000);
  };

  return (
    <div className="page-content">
      <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Appearance Settings */}
        <div className="scanner-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', marginBottom: '16px' }}>
            <Sun size={16} color="var(--accent-champagne)" />
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-heading)' }}>
              Appearance & Theme Palette
            </h4>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            Choose between Warm Cream & Coffee (Light), Deep Espresso & Charcoal (Dark), or automatically sync with your Operating System preferences.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <button
              type="button"
              className={`theme-card-option ${theme === 'light' ? 'selected' : ''}`}
              onClick={() => onThemeChange('light')}
              style={{
                backgroundColor: theme === 'light' ? 'var(--bg-surface-secondary)' : 'var(--bg-surface-input)',
                border: theme === 'light' ? '2px solid var(--accent-champagne)' : '1px solid var(--border-subtle)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <Sun size={20} color="var(--accent-champagne)" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-heading)' }}>Light Mode</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Warm Cream & Coffee</div>
            </button>

            <button
              type="button"
              className={`theme-card-option ${theme === 'dark' ? 'selected' : ''}`}
              onClick={() => onThemeChange('dark')}
              style={{
                backgroundColor: theme === 'dark' ? 'var(--bg-surface-secondary)' : 'var(--bg-surface-input)',
                border: theme === 'dark' ? '2px solid var(--accent-champagne)' : '1px solid var(--border-subtle)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <Moon size={20} color="var(--accent-champagne)" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-heading)' }}>Dark Mode</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Espresso & Charcoal</div>
            </button>

            <button
              type="button"
              className={`theme-card-option ${theme === 'system' ? 'selected' : ''}`}
              onClick={() => onThemeChange('system')}
              style={{
                backgroundColor: theme === 'system' ? 'var(--bg-surface-secondary)' : 'var(--bg-surface-input)',
                border: theme === 'system' ? '2px solid var(--accent-champagne)' : '1px solid var(--border-subtle)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <Laptop size={20} color="var(--accent-champagne)" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-heading)' }}>System Default</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Follow OS Setting</div>
            </button>
          </div>
        </div>

        {/* Backend Endpoint Diagnostics */}
        <div className="scanner-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', marginBottom: '16px' }}>
            <Server size={16} color="var(--accent-champagne)" />
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-heading)' }}>
              FastAPI Server Diagnostics
            </h4>
          </div>

          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label" htmlFor="backend-url">FastAPI Base Service URL</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                id="backend-url"
                type="text"
                className="cyber-input"
                value={getApiBaseUrl()}
                readOnly
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="btn-primary"
                onClick={handleTestBackend}
                disabled={testingBackend}
                style={{ height: '36px', padding: '0 16px' }}
              >
                <RefreshCw size={13} className={testingBackend ? 'spinning' : ''} />
                <span>{testingBackend ? 'Probing...' : 'Test connection'}</span>
              </button>
            </div>
          </div>

          {backendTestStatus && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: backendTestStatus.online ? 'var(--threat-safe-bg)' : 'var(--threat-warning-bg)',
                border: backendTestStatus.online ? '1px solid var(--threat-safe-border)' : '1px solid var(--threat-warning-border)',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {backendTestStatus.online ? (
                <>
                  <CheckCircle2 size={16} color="var(--threat-safe)" />
                  <span style={{ color: 'var(--threat-safe)' }}>
                    FastAPI scanner is online.
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle size={16} color="var(--threat-warning)" />
                  <span style={{ color: 'var(--threat-warning)' }}>
                    {backendTestStatus.reason || backendTestStatus.error}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Linguistic Preferences */}
        <div className="scanner-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', marginBottom: '16px' }}>
            <Globe size={16} color="var(--accent-champagne)" />
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-heading)' }}>
              Language & Regional Presets
            </h4>
          </div>

          <div className="form-group" style={{ maxWidth: '340px' }}>
            <label className="form-label">Default Message Scanner Language</label>
            <select
              className="cyber-input"
              value={defaultLang}
              onChange={(e) => setDefaultLang(e.target.value)}
            >
              <option value="auto">Auto-Detect Script (Devanagari, Kannada, Latin)</option>
              <option value="en">English</option>
              <option value="hi">Hindi (हिंदी)</option>
              <option value="kn">Kannada (ಕನ್ನಡ)</option>
              <option value="hinglish">Hinglish</option>
            </select>
          </div>
        </div>

        {/* Security Alert Notifications */}
        <div className="scanner-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', marginBottom: '16px' }}>
            <Bell size={16} color="var(--accent-champagne)" />
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-heading)' }}>
              Notification Alerts
            </h4>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-heading)' }}>High-Risk Threat Alerts</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Display immediate in-app badges whenever a scanned artifact scores &ge; 70</div>
            </div>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setNotifications(!notifications)}
              style={{ height: '30px', fontSize: '11px', padding: '0 12px' }}
            >
              {notifications ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </div>

        {/* Destructive Data Actions */}
        <div className="scanner-panel" style={{ padding: '20px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', marginBottom: '14px' }}>
            <Trash2 size={16} color="var(--threat-danger)" />
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--threat-danger)' }}>
              Clear Audit Log
            </h4>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            Permanently delete all previous scan records and threat classifications from browser local storage.
          </p>

          {confirmClearOpen ? (
            <div style={{ padding: '12px', backgroundColor: 'var(--threat-danger-bg)', border: '1px solid var(--threat-danger-border)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: 'var(--threat-danger)', fontWeight: 600 }}>
                Are you sure? This cannot be undone.
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleClearHistory}
                  style={{ height: '30px', fontSize: '11px', backgroundColor: 'var(--threat-danger)', borderColor: 'var(--threat-danger)' }}
                >
                  Confirm Delete
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setConfirmClearOpen(false)}
                  style={{ height: '30px', fontSize: '11px' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setConfirmClearOpen(true)}
              style={{ height: '34px', fontSize: '12px', color: 'var(--threat-danger)' }}
            >
              <Trash2 size={13} />
              <span>Clear Scan History</span>
            </button>
          )}

          {clearedMessage && (
            <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--threat-safe)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={14} />
              <span>Scan history wiped successfully.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
