import { useState } from 'react';
import {
  Award,
  Zap,
  Play,
  ArrowRight,
  CheckCircle2,
  Globe,
  FileImage,
  MessageSquare
} from 'lucide-react';
import { analyzeMessage, analyzeUrl } from '../utils/demoAnalyzer';

const DEMO_SCENARIOS = [
  {
    id: 'sbi_kyc',
    title: 'Bank KYC Account Suspension',
    category: 'Banking Phishing',
    type: 'message',
    icon: MessageSquare,
    badge: 'High Danger',
    threatLevel: 'DANGEROUS',
    input: 'Dear Customer, your SBI YONO account will be blocked today. Please update your PAN immediately by visiting http://sbi-kyc-verify.update-portal.xyz/login to avoid suspension.',
    expectedScore: 92,
    context: 'Threat actor mimics the State Bank of India with an urgent countdown to provoke panic and steal netbanking credentials.',
    evidenceItems: [
      'Deceptive brand keyword compounding: "sbi-kyc-verify"',
      'High-abuse .xyz Top-Level Domain registry',
      'Artificial deadline coercion: "blocked today"',
      'Demand for sensitive PAN and banking credentials'
    ],
    recommendedAction: 'Do NOT open the link or submit PAN. Bank KYC is never handled over third-party web portals. Report to 1930.'
  },
  {
    id: 'bescom_bill',
    title: 'BESCOM Power Disconnection Threat',
    category: 'Utility Scam',
    type: 'message',
    icon: MessageSquare,
    badge: 'Critical',
    threatLevel: 'DANGEROUS',
    input: 'URGENT BESCOM ALERT: Your electricity connection will be disconnected tonight at 09:30 PM due to previous month bill update failure. Call bill officer immediately at 8912345678 or pay here: http://bescom-bill-desk.online/pay',
    expectedScore: 96,
    context: 'Widespread fraud targeting Bengaluru residents impersonating BESCOM electricity officers with imminent power cutoffs.',
    evidenceItems: [
      'Unsolicited utility notice from personal mobile number',
      'Severe urgency constraint (disconnection at 9:30 PM tonight)',
      'Unofficial payment domain: bescom-bill-desk.online (Official: bescom.karnataka.gov.in)',
      'Social engineering lure prompting victim to call personal mobile contact'
    ],
    recommendedAction: 'Verify pending bills only via official BESCOM portal or electricity bill copy. Never transfer money to personal mobile contacts.'
  },
  {
    id: 'whatsapp_task',
    title: 'WhatsApp Movie Rating / Task Scam',
    category: 'Advance-Fee Job Scam',
    type: 'message',
    icon: MessageSquare,
    badge: 'High Danger',
    threatLevel: 'DANGEROUS',
    input: 'Badhai ho! Congratulations! You have been selected for part-time remote movie rating job. Earn Rs. 4,500 to Rs. 8,000 daily from home. Contact HR on WhatsApp +91-9876543210 to claim bonus.',
    expectedScore: 78,
    context: 'Classic task fraud offering unrealistic daily compensation for trivial tasks, leading to Telegram investment extortion.',
    evidenceItems: [
      'Exorbitant daily pay guarantee (₹4,500–₹8,000) with zero qualifications',
      'Unsolicited WhatsApp HR recruitment lure',
      'Bonus claim incentive used to initiate direct contact',
      'Advance-fee investment conversion funnel pattern'
    ],
    recommendedAction: 'Block and report the sender on WhatsApp. Legitimate employers never charge deposits or conduct recruitment via anonymous WhatsApp numbers.'
  },
  {
    id: 'shortened_redirect',
    title: 'Masked URL Shortener with Open Redirect',
    category: 'Evasion Vector',
    type: 'url',
    icon: Globe,
    badge: 'Suspicious',
    threatLevel: 'SUSPICIOUS',
    input: 'http://bit.ly/claim-tax-refund?redirect=http://malicious-login-portal.top/auth',
    expectedScore: 65,
    context: 'Attacker leverages legitimate URL shortener intermediaries to bypass enterprise email security filters.',
    evidenceItems: [
      'URL shortening intermediary (bit.ly) disguising true destination host',
      'Open redirection query parameter detected ("redirect=")',
      'Underlying destination targets abusive .top TLD registry',
      'Plaintext HTTP protocol used in secondary destination'
    ],
    recommendedAction: 'Do not click shortened links in unsolicited emails. Use URL expansion security tools before navigating.'
  },
  {
    id: 'support_impersonation',
    title: 'Fake Customer Support Desk',
    category: 'Tech Support Fraud',
    type: 'message',
    icon: MessageSquare,
    badge: 'High Danger',
    threatLevel: 'DANGEROUS',
    input: 'Dear User, suspicious activity detected on your Paytm wallet. Your account has been temporarily restricted. Call toll-free helpdesk 1800-FAKE-DESK immediately to restore access.',
    expectedScore: 84,
    context: 'Phishing lure tricking victims into calling fake support lines where remote access tools (AnyDesk, TeamViewer) are installed.',
    evidenceItems: [
      'False account restriction intimidation',
      'Brand impersonation of major payment provider (Paytm)',
      'Psychological pressure to call unverified support line',
      'Remote desktop access acquisition precursor'
    ],
    recommendedAction: 'Reach customer service only via verified in-app help centers. Never install remote access tools on your phone.'
  },
  {
    id: 'screenshot_banking',
    title: 'Screenshot: Mobile Banking Alert',
    category: 'Multimodal Fraud',
    type: 'screenshot',
    icon: FileImage,
    badge: 'High Danger',
    threatLevel: 'DANGEROUS',
    input: '[Screenshot Extracted Text] "ALERT: Income Tax Refund of Rs 24,500 approved. Update your bank account details in 24 hours to receive direct deposit: http://incometax-refund-gov.xyz"',
    expectedScore: 90,
    context: 'Image sent via WhatsApp/SMS to evade text filtering. Extracted via OCR and parsed by linguistic heuristics.',
    evidenceItems: [
      'Deceptive financial refund lure (₹24,500)',
      'Phishing domain spoofing government infrastructure (incometax-refund-gov.xyz)',
      'Time-based deadline urgency (24 hours)',
      'High-risk non-governmental .xyz TLD registry'
    ],
    recommendedAction: 'Income tax refunds are processed directly into pre-validated bank accounts via the official incometax.gov.in portal.'
  }
];

export default function DemoEvaluation({ onNavigateToScanner }) {
  const [activeScenario, setActiveScenario] = useState(DEMO_SCENARIOS[0]);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);

  const handleRunEvaluation = (scenario) => {
    setActiveScenario(scenario);
    setEvaluating(true);
    setEvaluationResult(null);

    setTimeout(() => {
      let res;
      if (scenario.type === 'url') {
        res = analyzeUrl(scenario.input);
      } else {
        res = analyzeMessage(scenario.input);
      }
      setEvaluationResult(res);
      setEvaluating(false);
    }, 400);
  };

  return (
    <div className="page-content">
      {/* Judge & Evaluator Header Banner */}
      <div className="alert-banner info" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Award size={18} color="var(--accent-champagne)" />
          <div>
            <strong>Judge Evaluation Suite:</strong> Pre-calibrated real-world test scenarios across multilingual Indian phishing, electricity extortion, and masked redirection.
          </div>
        </div>
        <span className="scan-type-tag" style={{ color: 'var(--accent-champagne)', borderColor: 'var(--accent-champagne)' }}>
          DEMO ENVIRONMENT
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Left Column: Scenario Selector */}
        <div className="scanner-panel" style={{ padding: '16px', gap: '10px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.6px' }}>
            Select Test Scenario ({DEMO_SCENARIOS.length})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {DEMO_SCENARIOS.map((item) => {
              const isSelected = activeScenario.id === item.id;
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => handleRunEvaluation(item)}
                  style={{
                    backgroundColor: isSelected ? 'var(--bg-surface-secondary)' : 'var(--bg-surface-input)',
                    border: isSelected ? '1px solid var(--accent-champagne)' : '1px solid var(--border-subtle)',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icon size={14} color="var(--accent-champagne)" />
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-heading)' }}>
                        {item.title}
                      </span>
                    </div>
                    <span
                      className={`classification-badge ${item.threatLevel}`}
                      style={{ fontSize: '9px', padding: '1px 5px' }}
                    >
                      {item.badge}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {item.category}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Scenario Details & Live Inspection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Active Scenario Card */}
          <div className="scanner-panel" style={{ padding: '20px', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-heading)' }}>
                  {activeScenario.title}
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Category: {activeScenario.category} &bull; Expected Threat Severity: {activeScenario.threatLevel}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => handleRunEvaluation(activeScenario)}
                  disabled={evaluating}
                  style={{ height: '32px', fontSize: '12px', padding: '0 12px' }}
                >
                  <Play size={13} />
                  <span>{evaluating ? 'Running Heuristic Scan...' : 'Execute Evaluation'}</span>
                </button>

                {onNavigateToScanner && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => onNavigateToScanner(activeScenario.type === 'url' ? 'url' : 'message')}
                    style={{ height: '32px', fontSize: '12px', padding: '0 12px' }}
                  >
                    <span>Open in Scanner</span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Input Artifact View */}
            <div className="form-group">
              <label className="form-label">Test Input Artifact (Simulated Transmission):</label>
              <div
                style={{
                  backgroundColor: 'var(--bg-surface-input)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 14px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  lineHeight: 1.5,
                  color: 'var(--text-primary)'
                }}
              >
                {activeScenario.input}
              </div>
            </div>

            {/* Analytical Context */}
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <strong>Attack Context:</strong> {activeScenario.context}
            </div>

            {/* Observable Evidence Flags */}
            <div style={{ backgroundColor: 'var(--bg-surface-secondary)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-heading)', fontWeight: 700, marginBottom: '6px' }}>
                Key Threat Signatures & Observable Evidence:
              </div>
              <ul style={{ paddingLeft: '18px', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {activeScenario.evidenceItems.map((e, idx) => (
                  <li key={idx}>{e}</li>
                ))}
              </ul>
            </div>

            {/* Recommended Safety Protocol */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--threat-safe)' }}>
              <CheckCircle2 size={16} flexShrink={0} />
              <span><strong>Advisory:</strong> {activeScenario.recommendedAction}</span>
            </div>
          </div>

          {/* Dynamic Evaluation Output */}
          {evaluationResult && (
            <div className="scanner-panel" style={{ padding: '16px', gap: '12px', border: '1px solid var(--accent-champagne)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={16} color="var(--accent-champagne)" />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-heading)' }}>
                    Heuristic Engine Output
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`classification-badge ${evaluationResult.classification}`}>
                    {evaluationResult.classification}
                  </span>
                  <span className="font-mono" style={{ fontWeight: 700, fontSize: '13px' }}>
                    Score: {evaluationResult.riskScore}/100
                  </span>
                </div>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {evaluationResult.explanation}
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Engine: <code>{evaluationResult.source}</code> &bull; Timestamp: {evaluationResult.analyzedAt}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
