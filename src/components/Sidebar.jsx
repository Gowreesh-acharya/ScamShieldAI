import {
  Shield,
  LayoutDashboard,
  MessageSquare,
  Globe,
  Layers,
  History,
  PhoneCall,
  Activity,
  X,
  FileImage,
  Bot,
  LifeBuoy,
  Award,
  FileWarning,
  User,
  Settings as SettingsIcon,
  Home
} from 'lucide-react';

export default function Sidebar({
  activePage,
  setActivePage,
  backendStatus,
  stats,
  mobileOpen,
  setMobileOpen,
  onGoToPublicSite
}) {
  const overviewItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'history', label: 'Scan History', icon: History, count: stats?.totalScans || 0 }
  ];

  const engineItems = [
    { id: 'message', label: 'Message Scanner', icon: MessageSquare, badge: 'Multi' },
    { id: 'url', label: 'URL Intelligence', icon: Globe },
    { id: 'screenshot', label: 'Screenshot Scanner', icon: FileImage, badge: 'OCR' },
    { id: 'combined', label: 'Combined Analysis', icon: Layers },
    { id: 'investigate', label: 'AI Investigation', icon: Bot, badge: 'AI' }
  ];

  const incidentItems = [
    { id: 'emergency', label: 'Emergency Mode', icon: LifeBuoy, urgent: true, badge: '1930' },
    { id: 'demo', label: 'Demo Evaluation', icon: Award, badge: 'Judges' },
    { id: 'report', label: 'Report a Scam', icon: FileWarning }
  ];

  const accountItems = [
    { id: 'feedback', label: 'Feedback', icon: MessageSquare },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: SettingsIcon }
  ];

  const handleNavClick = (id) => {
    setActivePage(id);
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo-icon">
          <Shield size={20} />
        </div>
        <div className="sidebar-brand">
          <h1>
            ScamShield
            <span className="sidebar-brand-badge">AI</span>
          </h1>
          <div className="sidebar-subtext">Enterprise Cyber Defense</div>
        </div>
        {mobileOpen && (
          <button
            type="button"
            className="btn-icon"
            style={{ marginLeft: 'auto', color: 'var(--sidebar-heading)' }}
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation Groups */}
      <nav className="sidebar-nav">
        {/* OVERVIEW */}
        <div className="nav-section-title">Overview</div>
        {overviewItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id)}
            >
              <Icon className="nav-item-icon" />
              <span>{item.label}</span>
              {item.count !== undefined && item.count > 0 && (
                <span className="nav-item-badge">{item.count}</span>
              )}
            </button>
          );
        })}

        {/* DETECTION ENGINES */}
        <div className="nav-section-title">Detection Engines</div>
        {engineItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id)}
            >
              <Icon className="nav-item-icon" />
              <span>{item.label}</span>
              {item.badge && (
                <span className="nav-item-badge" style={{ backgroundColor: 'var(--sidebar-badge-bg)', color: 'var(--sidebar-badge-text)' }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* INCIDENT RESPONSE */}
        <div className="nav-section-title">Incident Response</div>
        {incidentItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id)}
              style={item.urgent ? { color: isActive ? '#ffffff' : 'var(--threat-danger)' } : {}}
            >
              <Icon className="nav-item-icon" style={item.urgent ? { color: 'var(--threat-danger)' } : {}} />
              <span>{item.label}</span>
              {item.badge && (
                <span
                  className="nav-item-badge"
                  style={{
                    backgroundColor: item.urgent ? 'var(--threat-danger-bg)' : 'var(--sidebar-badge-bg)',
                    color: item.urgent ? 'var(--threat-danger)' : 'var(--sidebar-badge-text)',
                    borderColor: item.urgent ? 'var(--threat-danger-border)' : 'transparent'
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* ACCOUNT */}
        <div className="nav-section-title">Account</div>
        {accountItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id)}
            >
              <Icon className="nav-item-icon" />
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* Public Website Shortcut */}
        {onGoToPublicSite && (
          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--sidebar-border)' }}>
            <button
              type="button"
              className="nav-item"
              onClick={onGoToPublicSite}
              style={{ color: 'var(--accent-champagne)' }}
            >
              <Home className="nav-item-icon" style={{ color: 'var(--accent-champagne)' }} />
              <span>Public Landing Site</span>
            </button>
          </div>
        )}
      </nav>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <div className="system-status-box">
          <div className="status-indicator">
            <span
              className={`status-dot ${backendStatus?.online ? 'online' : 'demo'} pulsing`}
            />
            <span style={{ color: backendStatus?.online ? 'var(--threat-safe)' : 'var(--threat-warning)' }}>
              {backendStatus?.online ? 'FastAPI Live' : 'Demo Evaluation'}
            </span>
          </div>
          <Activity size={13} color="var(--sidebar-muted)" />
        </div>

        <div className="cyber-helpline">
          <PhoneCall size={12} color="var(--accent-sky)" />
          <span>Cyber Crime Helpline: <strong>1930</strong></span>
        </div>
      </div>
    </aside>
  );
}
