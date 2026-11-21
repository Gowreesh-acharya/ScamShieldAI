import { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  Info,
  CheckCircle2,
  AlertOctagon,
  Cpu,
  Server,
  MessageSquare,
  Bot
} from 'lucide-react';
import { getScanClassification } from '../utils/storage';

export default function RiskResultCard({ result, onFeedback, onInvestigate }) {
  const [copied, setCopied] = useState(false);

  if (!result) return null;

  const classification = getScanClassification(result);
  if (!classification) {
    return <div className="alert-banner warning" role="alert">This scan result is unavailable. Please run a new scan.</div>;
  }

  const {
    riskScore,
    indicators = {},
    explanation = '',
    recommendation = '',
    isLive = false,
    verdict,
    notice,
    signals = [],
    extracted_urls: extractedUrls = [],
    unrolled_urls: unrolledUrls = [],
    safety_tip: safetyTip
  } = result;

  const {
    suspiciousPhrases = [],
    urgencyIndicators = [],
    impersonation = [],
    urlCharacteristics = []
  } = indicators;

  // Visual Gauge Calculation
  const radius = 30;
  const circumference = 2 * Math.PI * radius; // ~188.495
  const strokeDashoffset = circumference - (circumference * Math.min(100, Math.max(0, riskScore))) / 100;

  // Severity styling
  let severityColor = 'var(--threat-safe)';
  let Icon = ShieldCheck;

  if (classification === 'DANGEROUS' || riskScore >= 70) {
    severityColor = 'var(--threat-danger)';
    Icon = ShieldAlert;
  } else if (classification === 'SUSPICIOUS' || riskScore >= 30) {
    severityColor = 'var(--threat-warning)';
    Icon = AlertTriangle;
  }

  const handleCopyReport = () => {
    const report = `[ScamShield AI Audit Report]
Risk Score: ${riskScore}/100 (${verdict || classification})
Source: ${isLive ? 'FastAPI scan' : 'Demo Heuristic Engine'}
Executive Summary: ${explanation}
Recommended Protocol: ${recommendation}
Flagged Phrases: ${suspiciousPhrases.join(', ') || 'None'}
Urgency Cues: ${urgencyIndicators.join(', ') || 'None'}
Entity Impersonation: ${impersonation.join(', ') || 'None'}
URL Attributes: ${urlCharacteristics.join(', ') || 'None'}
${[
  notice,
  signals.length > 0 && `Signals: ${signals.map(({ label, weight }) => `${label} (+${weight})`).join(', ')}`,
  extractedUrls.length > 0 && `Extracted URLs: ${extractedUrls.join(', ')}`,
  unrolledUrls.length > 0 && `Redirect destinations: ${unrolledUrls.join(', ')}`,
  safetyTip && `Safety tip: ${safetyTip}`
].filter(Boolean).map(line => `${line}\n`).join('')}Timestamp: ${new Date().toLocaleString()}`;

    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const backendEvidence = [
    { label: 'Scoring signals', entries: signals.map(({ label, weight }) => `${label} (+${weight})`) },
    { label: 'Extracted URLs', entries: extractedUrls },
    { label: 'First redirect destinations', entries: unrolledUrls }
  ].filter(({ entries }) => entries.length > 0);
  const hasAnyIndicators =
    suspiciousPhrases.length > 0 ||
    urgencyIndicators.length > 0 ||
    impersonation.length > 0 ||
    urlCharacteristics.length > 0 ||
    backendEvidence.length > 0;

  return (
    <div className={`risk-result-card classification-${classification}`}>
      {notice && (
        <div className="alert-banner warning">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Info size={15} />
            <span>{notice}</span>
          </div>
        </div>
      )}

      {/* Header Row: Radial Gauge & Classification */}
      <div className="result-header-row">
        <div className="gauge-and-score">
          {/* SVG Circular Gauge */}
          <div className="svg-gauge-box">
            <svg className="svg-gauge" viewBox="0 0 76 76">
              <circle
                className="gauge-track"
                cx="38"
                cy="38"
                r={radius}
              />
              <circle
                className="gauge-meter"
                cx="38"
                cy="38"
                r={radius}
                stroke={severityColor}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
            </svg>
            <div className="gauge-center-text">
              <span className="score-number">{riskScore}</span>
              <span className="score-label">Risk</span>
            </div>
          </div>

          <div className="classification-info">
            <span className={`classification-badge ${classification}`}>
              <Icon size={14} />
              {classification}
            </span>
            <span className="source-stamp">
              {isLive ? (
                <>
                  <Server size={11} color="var(--accent-sky)" />
                  <span>FastAPI Live Scan</span>
                </>
              ) : (
                <>
                  <Cpu size={11} color="var(--threat-warning)" />
                  <span>Demo Heuristic Engine</span>
                </>
              )}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {onInvestigate && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => onInvestigate(result)}
              title="Open AI Investigation Assistant for this scan"
              style={{ height: '32px', fontSize: '11px', padding: '0 10px', color: 'var(--accent-sky)' }}
            >
              <Bot size={13} />
              <span>Investigate</span>
            </button>
          )}

          <button
            type="button"
            className="btn-secondary"
            onClick={handleCopyReport}
            title="Copy formatted security audit to clipboard"
            style={{ height: '32px', fontSize: '11px', padding: '0 10px' }}
          >
            {copied ? (
              <>
                <Check size={13} color="var(--threat-safe)" />
                <span style={{ color: 'var(--threat-safe)' }}>Copied</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span>Copy Audit</span>
              </>
            )}
          </button>

          {onFeedback && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => onFeedback(result)}
              title="Report accuracy feedback or false positive"
              style={{ height: '32px', fontSize: '11px', padding: '0 8px' }}
            >
              <MessageSquare size={12} />
              <span>Feedback</span>
            </button>
          )}
        </div>
      </div>

      {/* Executive Threat Findings */}
      {explanation && (
        <div className="analysis-explanation">
          <strong style={{ display: 'block', color: 'var(--accent-sky)', marginBottom: '3px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Executive Threat Intelligence Findings
          </strong>
          {explanation}
        </div>
      )}

      {/* Verified Indicators Breakdown */}
      {hasAnyIndicators && (
        <div className="indicators-grid">
          {/* Flagged Suspicious Phrases */}
          {suspiciousPhrases.length > 0 && (
            <div className="indicator-block">
              <span className="indicator-title">
                <AlertOctagon size={13} color="var(--threat-danger)" />
                Flagged Suspicious Phrases ({suspiciousPhrases.length})
              </span>
              <div className="tags-cluster">
                {suspiciousPhrases.map((phrase, idx) => (
                  <span key={idx} className="indicator-chip phrase">
                    "{phrase}"
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Urgency Cues */}
          {urgencyIndicators.length > 0 && (
            <div className="indicator-block">
              <span className="indicator-title">
                <AlertTriangle size={13} color="var(--threat-warning)" />
                Urgency & Pressure Tactics ({urgencyIndicators.length})
              </span>
              <div className="tags-cluster">
                {urgencyIndicators.map((urg, idx) => (
                  <span key={idx} className="indicator-chip urgency">
                    {urg}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Impersonation Warnings */}
          {impersonation.length > 0 && (
            <div className="indicator-block">
              <span className="indicator-title">
                <ShieldAlert size={13} color="#c084fc" />
                Impersonation Markers ({impersonation.length})
              </span>
              <div className="tags-cluster">
                {impersonation.map((imp, idx) => (
                  <span key={idx} className="indicator-chip impersonation">
                    {imp}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* URL & Infrastructure Characteristics */}
          {urlCharacteristics.length > 0 && (
            <div className="indicator-block">
              <span className="indicator-title">
                <ExternalLink size={13} color="var(--accent-sky)" />
                URL & Infrastructure Traits ({urlCharacteristics.length})
              </span>
              <div className="tags-cluster">
                {urlCharacteristics.map((trait, idx) => (
                  <span key={idx} className="indicator-chip url-trait">
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          )}
          {backendEvidence.map(({ label, entries }) => (
            <div className="indicator-block" key={label}>
              <span className="indicator-title">
                <Info size={13} color="var(--accent-sky)" />
                {label}
              </span>
              <div className="tags-cluster">
                {entries.map(entry => (
                  <span key={entry} className="indicator-chip url-trait" style={{ overflowWrap: 'anywhere' }}>
                    {entry}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recommended Safety Action */}
      {(recommendation || safetyTip) && (
        <div className="safety-action-box">
          <div className="safety-action-title">
            <CheckCircle2 size={14} />
            Recommended Safety Action Protocol
          </div>
          {recommendation && <p className="safety-action-text">{recommendation}</p>}
          {safetyTip && <p className="safety-action-text">{safetyTip}</p>}
        </div>
      )}
    </div>
  );
}
