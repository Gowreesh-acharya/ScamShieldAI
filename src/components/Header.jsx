import { useState } from 'react';
import {
  Menu,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  Sun,
  Moon,
  Laptop,
  Bell,
  User,
  Settings as SettingsIcon,
  Home,
  CheckCircle2
} from 'lucide-react';
import { setApiMode, getApiMode } from '../services/api';

const PAGE_METADATA = {
  dashboard: {
    title: 'Cybersecurity Dashboard',
    subtitle: 'Real-time threat monitoring, detection metrics, and audit log.'
  },
  message: {
    title: 'Multilingual Message Scanner',
    subtitle: 'Detect social engineering across English, Hindi, Kannada, and Hinglish.'
  },
  url: {
    title: 'URL Intelligence',
    subtitle: 'Inspect destination links for high-risk TLDs, typosquatting, raw IPs, and open redirects.'
  },
  screenshot: {
    title: 'Screenshot Scanner',
    subtitle: 'Upload SMS or WhatsApp screenshots and extract text using OCR with verification.'
  },
  combined: {
    title: 'Combined Analysis',
    subtitle: 'Simultaneously cross-correlate message lures and embedded destination domains.'
  },
  investigate: {
    title: 'AI Investigation Assistant',
    subtitle: 'Interactive threat evidence analysis and cyber fraud advisory.'
  },
  emergency: {
    title: 'Fraud Emergency Mode',
    subtitle: 'Immediate incident triage and containment checklist for suspected fraud (1930).'
  },
  history: {
    title: 'Scan History',
    subtitle: 'Comprehensive audit trail of previous scans, risk classifications, and threat records.'
  },
  demo: {
    title: 'Demo Evaluation Mode',
    subtitle: 'Judge-friendly demonstration area with verified real-world test scenarios.'
  },
  report: {
    title: 'Report a Scam',
    subtitle: 'Contribute observed phishing messages, fake links, or fraud vectors to the audit grid.'
  },
  feedback: {
    title: 'Security Feedback',
    subtitle: 'Submit accuracy reports, false positives, or feature enhancement proposals.'
  },
  profile: {
    title: 'Analyst Profile',
    subtitle: 'Security clearance level, session telemetry, and credentials configuration.'
  },
  settings: {
    title: 'Application Settings',
    subtitle: 'Configure theme palette, FastAPI endpoints, and audit trail preferences.'
  }
};

export default function Header({
  activePage,
  backendStatus,
  onRefreshBackend,
  mobileOpen,
  setMobileOpen,
  onModeChange,
  theme,
  onThemeChange,
  onNavigate,
  onGoToPublicSite
}) {
  const meta = PAGE_METADATA[activePage] || PAGE_METADATA.dashboard;
  const currentMode = getApiMode();
  const [showNotifications, setShowNotifications] = useState(false);

  const handleModeSwitch = (mode) => {
    setApiMode(mode);
    if (onModeChange) onModeChange(mode);
    if (onRefreshBackend) onRefreshBackend();
  };

  return (
    <header className="top-header">
      <div className="header-left">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation menu"
        >
          <Menu size={18} />
        </button>

        <div className="header-title-box">
          <h2>{meta.title}</h2>
          <p>{meta.subtitle}</p>
        </div>
      </div>

      <div className="header-right">
        {/* Switch to Public Site */}
        {onGoToPublicSite && (
          <button
            type="button"
            className="btn-secondary"
            onClick={onGoToPublicSite}
            title="Return to Public Landing Page"
            style={{ height: '32px', fontSize: '11px', padding: '0 10px', gap: '5px' }}
          >
            <Home size={13} color="var(--accent-champagne)" />
            <span>Public Site</span>
          </button>
        )}

        {/* Theme Selector (Light, Dark, System) */}
        <div className="mode-toggle-group" title="Theme Mode: Light, Dark, System">
          <button
            type="button"
            className={`mode-toggle-btn ${theme === 'light' ? 'active' : ''}`}
            onClick={() => onThemeChange('light')}
            aria-label="Warm Cream Light Mode"
            title="Light Mode (Warm Cream)"
          >
            <Sun size={12} />
          </button>
          <button
            type="button"
            className={`mode-toggle-btn ${theme === 'dark' ? 'active' : ''}`}
            onClick={() => onThemeChange('dark')}
            aria-label="Espresso Dark Mode"
            title="Dark Mode (Espresso)"
          >
            <Moon size={12} />
          </button>
          <button
            type="button"
            className={`mode-toggle-btn ${theme === 'system' ? 'active' : ''}`}
            onClick={() => onThemeChange('system')}
            aria-label="System Theme"
            title="System Default"
          >
            <Laptop size={12} />
          </button>
        </div>

        {/* Backend Status / Mode Toggle */}
        <div className="mode-toggle-group" title="Backend Engine Mode">
          <button
            type="button"
            className={`mode-toggle-btn ${currentMode === 'AUTO' ? 'active' : ''}`}
            onClick={() => handleModeSwitch('AUTO')}
          >
            Auto
          </button>
          <button
            type="button"
            className={`mode-toggle-btn ${currentMode === 'DEMO' ? 'active' : ''}`}
            onClick={() => handleModeSwitch('DEMO')}
          >
            Demo
          </button>
          <button
            type="button"
            className={`mode-toggle-btn ${currentMode === 'LIVE' ? 'active' : ''}`}
            onClick={() => handleModeSwitch('LIVE')}
          >
            Live
          </button>
        </div>

        {/* Backend Status Action Button */}
        <button
          type="button"
          className="btn-secondary"
          onClick={onRefreshBackend}
          title={backendStatus?.online ? 'Connected to FastAPI backend' : 'Backend offline (Local Heuristic Engine active)'}
          style={{ height: '32px', fontSize: '11px', padding: '0 10px' }}
        >
          {backendStatus?.online ? (
            <>
              <ShieldCheck size={13} color="var(--threat-safe)" />
              <span style={{ color: 'var(--threat-safe)' }}>Live</span>
            </>
          ) : (
            <>
              <AlertCircle size={13} color="var(--threat-warning)" />
              <span style={{ color: 'var(--threat-warning)' }}>Heuristic</span>
            </>
          )}
          <RefreshCw size={11} style={{ marginLeft: '2px', opacity: 0.7 }} />
        </button>

        {/* Notifications Icon with Popover */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className="btn-icon"
            onClick={() => setShowNotifications(!showNotifications)}
            title="Security Notifications"
            style={{ width: '32px', height: '32px' }}
          >
            <Bell size={15} />
            <span
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '7px',
                height: '7px',
                backgroundColor: 'var(--accent-champagne)',
                borderRadius: '50%'
              }}
            />
          </button>

          {showNotifications && (
            <div
              style={{
                position: 'absolute',
                top: '40px',
                right: 0,
                width: '280px',
                backgroundColor: 'var(--bg-surface-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-popover)',
                padding: '12px',
                zIndex: 100
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px', marginBottom: '8px' }}>
                Security Notifications
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <CheckCircle2 size={13} color="var(--threat-safe)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--text-heading)' }}>Defense Grid Active:</span>
                    <p style={{ color: 'var(--text-muted)', marginTop: '2px' }}>Real-world scam heuristics deployed for Build Bengaluru 2.0.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <ShieldCheck size={13} color="var(--accent-sky)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--text-heading)' }}>Helpline 1930 Wired:</span>
                    <p style={{ color: 'var(--text-muted)', marginTop: '2px' }}>Emergency mode ready for instant citizen triage.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Shortcut */}
        {onNavigate && (
          <button
            type="button"
            className="btn-icon"
            onClick={() => onNavigate('profile')}
            title="User Profile"
            style={{ width: '32px', height: '32px' }}
          >
            <User size={15} />
          </button>
        )}

        {/* Settings Shortcut */}
        {onNavigate && (
          <button
            type="button"
            className="btn-icon"
            onClick={() => onNavigate('settings')}
            title="Settings"
            style={{ width: '32px', height: '32px' }}
          >
            <SettingsIcon size={15} />
          </button>
        )}
      </div>
    </header>
  );
}
