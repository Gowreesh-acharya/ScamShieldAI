import { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Activity,
  MessageSquare,
  Globe,
  Layers,
  ArrowRight,
  Clock,
  Shield,
  FileImage,
  Bot,
  LifeBuoy,
  X
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { getScanClassification } from '../utils/storage';

export default function Dashboard({ stats, history, onNavigate, onInspectScan }) {
  const [safetyBannerDismissed, setSafetyBannerDismissed] = useState(false);

  const recentScans = (history || []).slice(0, 5);

  const totalScans = stats?.totalScans || 0;
  const threatsDetected = stats?.threatsDetected || 0;
  const suspiciousScans = stats?.suspiciousScans || 0;
  const safeScans = stats?.safeScans || 0;

  const threatPct = totalScans > 0 ? Math.round((threatsDetected / totalScans) * 100) : 0;
  const suspPct = totalScans > 0 ? Math.round((suspiciousScans / totalScans) * 100) : 0;
  const safePct = totalScans > 0 ? Math.round((safeScans / totalScans) * 100) : 0;

  return (
    <div className="page-content">
      {/* Dismissible Safety Banner */}
      {!safetyBannerDismissed && (
        <div
          className="safety-banner"
          style={{
            backgroundColor: 'var(--bg-surface-secondary)',
            border: '1px solid var(--border-accent)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            marginBottom: '4px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--accent-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-champagne)',
                flexShrink: 0
              }}
            >
              <Shield size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>
                Your digital safety is our priority
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Scan messages, links and files to stay protected from online scams and fraud.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn-icon"
            onClick={() => setSafetyBannerDismissed(true)}
            aria-label="Dismiss banner"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Top 4 Key Statistics Cards */}
      <section className="stats-grid">
        <StatCard
          title="Total Scans"
          value={totalScans}
          subtitle={totalScans === 0 ? "No scans recorded yet" : "All-time platform inspections"}
          icon={Activity}
          variant="cyan"
          percentage={totalScans > 0 ? 100 : 0}
        />
        <StatCard
          title="Threats Detected"
          value={threatsDetected}
          subtitle={totalScans === 0 ? "0% threat baseline" : `${threatPct}% classified as high risk`}
          icon={ShieldAlert}
          variant="danger"
          percentage={threatPct}
        />
        <StatCard
          title="Suspicious Scans"
          value={suspiciousScans}
          subtitle={totalScans === 0 ? "0% flagged" : `${suspPct}% flagged for manual review`}
          icon={AlertTriangle}
          variant="warning"
          percentage={suspPct}
        />
        <StatCard
          title="Safe Scans"
          value={safeScans}
          subtitle={totalScans === 0 ? "0% safe baseline" : `${safePct}% verified clean`}
          icon={ShieldCheck}
          variant="safe"
          percentage={safePct}
        />
      </section>

      {/* Security Analysis Launchpad (Four Prominent Cards) */}
      <section>
        <div style={{ marginBottom: '14px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-heading)' }}>
            Security Analysis Launchpad
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Deploy specialized cybersecurity engines to evaluate messages, links, screenshots, or run combined vector scans
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {/* 1. Message Scanner */}
          <div className="action-card" onClick={() => onNavigate('message')}>
            <div>
              <div className="action-card-header">
                <div className="action-card-icon" style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent-champagne)' }}>
                  <MessageSquare size={18} />
                </div>
                <h3>Message Scanner</h3>
              </div>
              <p style={{ marginTop: '10px' }}>
                Detect social engineering across English, Hindi, Kannada and Hinglish, with localized explanations.
              </p>
            </div>
            <div className="action-card-btn">
              <span>Launch Message Scanner</span>
              <ArrowRight size={14} />
            </div>
          </div>

          {/* 2. URL Intelligence */}
          <div className="action-card" onClick={() => onNavigate('url')}>
            <div>
              <div className="action-card-header">
                <div className="action-card-icon" style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent-champagne)' }}>
                  <Globe size={18} />
                </div>
                <h3>URL Intelligence</h3>
              </div>
              <p style={{ marginTop: '10px' }}>
                Inspect destination links for high-risk TLDs, typosquatting, raw IP hosting and open redirects.
              </p>
            </div>
            <div className="action-card-btn">
              <span>Inspect Destination Link</span>
              <ArrowRight size={14} />
            </div>
          </div>

          {/* 3. Screenshot Scanner */}
          <div className="action-card" onClick={() => onNavigate('screenshot')}>
            <div>
              <div className="action-card-header">
                <div className="action-card-icon" style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent-champagne)' }}>
                  <FileImage size={18} />
                </div>
                <h3>Screenshot Scanner</h3>
              </div>
              <p style={{ marginTop: '10px' }}>
                Upload SMS or WhatsApp screenshots and extract text using OCR, with review and verification controls.
              </p>
            </div>
            <div className="action-card-btn">
              <span>Upload Screenshot</span>
              <ArrowRight size={14} />
            </div>
          </div>

          {/* 4. Combined Analysis */}
          <div className="action-card" onClick={() => onNavigate('combined')}>
            <div>
              <div className="action-card-header">
                <div className="action-card-icon" style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent-champagne)' }}>
                  <Layers size={18} />
                </div>
                <h3>Combined Analysis</h3>
              </div>
              <p style={{ marginTop: '10px' }}>
                Combine multiple available checks for a comprehensive security analysis.
              </p>
            </div>
            <div className="action-card-btn">
              <span>Run Combined Audit</span>
              <ArrowRight size={14} />
            </div>
          </div>

          {/* AI Investigation Assistant Quick Card */}
          <div className="action-card" onClick={() => onNavigate('investigate')}>
            <div>
              <div className="action-card-header">
                <div className="action-card-icon" style={{ backgroundColor: 'rgba(56, 189, 248, 0.12)', color: 'var(--accent-cyan)' }}>
                  <Bot size={18} />
                </div>
                <h3>AI Investigation Assistant</h3>
              </div>
              <p style={{ marginTop: '10px' }}>
                Chat with an interactive security assistant to clarify why content was flagged and get practical safety steps.
              </p>
            </div>
            <div className="action-card-btn">
              <span>Start Investigation</span>
              <ArrowRight size={14} />
            </div>
          </div>

          {/* Fraud Emergency Mode Quick Card */}
          <div className="action-card" onClick={() => onNavigate('emergency')} style={{ borderColor: 'var(--threat-danger-border)' }}>
            <div>
              <div className="action-card-header">
                <div className="action-card-icon" style={{ backgroundColor: 'var(--threat-danger-bg)', color: 'var(--threat-danger)' }}>
                  <LifeBuoy size={18} />
                </div>
                <h3 style={{ color: 'var(--threat-danger)' }}>Fraud Emergency Mode</h3>
              </div>
              <p style={{ marginTop: '10px' }}>
                Immediate situation-specific triage for victims of compromised OTPs, stolen UPI PINs, and phishing clicks.
              </p>
            </div>
            <div className="action-card-btn" style={{ color: 'var(--threat-danger)' }}>
              <span>Emergency Triage (1930)</span>
              <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </section>

      {/* Recent Telemetry Activity Table */}
      <section className="history-table-container">
        <div className="history-toolbar">
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)' }}>
              Recent Telemetry Activity
            </h4>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Latest inspected threats across all active modules ({totalScans} total audits recorded)
            </span>
          </div>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => onNavigate('history')}
            style={{ height: '30px', fontSize: '11px', padding: '0 10px' }}
          >
            <span>View All Records</span>
            <ArrowRight size={12} />
          </button>
        </div>

        <table className="cyber-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Target Artifact / Subject</th>
              <th>Risk Score</th>
              <th>Classification</th>
              <th>Timestamp</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {recentScans.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  No scans recorded yet. Run your first security audit using the launchpad above.
                </td>
              </tr>
            ) : (
              recentScans.map((scan) => {
                const classification = getScanClassification(scan);
                return (
                  <tr key={scan.id}>
                    <td>
                      <span className="scan-type-pill">
                        {scan.type === 'message' && <MessageSquare size={11} />}
                        {scan.type === 'url' && <Globe size={11} />}
                        {scan.type === 'screenshot' && <FileImage size={11} />}
                        {scan.type === 'combined' && <Layers size={11} />}
                        {scan.type}
                      </span>
                    </td>
                    <td>
                      <div className="target-snippet" title={scan.target}>
                        {scan.target}
                      </div>
                    </td>
                    <td>
                      <span
                        className="font-mono"
                        style={{
                          fontWeight: 700,
                          color:
                            classification === 'DANGEROUS'
                              ? 'var(--threat-danger)'
                              : classification === 'SUSPICIOUS'
                              ? 'var(--threat-warning)'
                              : classification === 'SAFE' ? 'var(--threat-safe)' : 'var(--text-muted)'
                        }}
                      >
                        {classification ? `${scan.riskScore}/100` : '—'}
                      </span>
                    </td>
                    <td>
                      <span className={`classification-badge ${classification || ''}`} style={{ fontSize: '10px', padding: '2px 7px' }}>
                        {classification || 'Rescan required'}
                      </span>
                      {classification && scan.source?.startsWith('DEMO_') && <small> Demo</small>}
                    </td>
                    <td style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={11} />
                        {new Date(scan.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => onInspectScan(scan)}
                        style={{ height: '26px', padding: '0 8px', fontSize: '11px' }}
                      >
                        Audit
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
