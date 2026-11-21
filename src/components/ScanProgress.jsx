import { Cpu } from 'lucide-react';

export default function ScanProgress({ type = 'message' }) {
  const steps = {
    message: [
      'Extracting syntax & linguistic tokenization...',
      'Evaluating social engineering & urgency markers...',
      'Cross-referencing institutional brand impersonation...',
      'Computing contextual risk score...'
    ],
    url: [
      'Parsing protocol, hostname & path structure...',
      'Inspecting top-level domain reputation & SSL certificate...',
      'Detecting typosquatting patterns & DNS anomalies...',
      'Calculating destination vulnerability index...'
    ],
    combined: [
      'Tokenizing message communication pretext...',
      'Evaluating destination URL host & certificates...',
      'Cross-referencing pretext against domain ownership...',
      'Synthesizing compound attack classification...'
    ]
  };

  const currentSteps = steps[type] || steps.message;

  return (
    <div className="scanning-card">
      <div className="radar-spinner">
        <Cpu size={28} />
      </div>

      <div>
        <h4 style={{ color: '#ffffff', fontSize: '15px', fontWeight: 600, marginBottom: '3px' }}>
          Threat Inspection Active
        </h4>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
          Executing Deep Heuristic & Neural Analysis
        </p>
      </div>

      <div className="scanning-steps">
        {currentSteps.map((step, index) => (
          <div
            key={index}
            className={`scanning-step-item ${index <= 1 ? 'active' : ''}`}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: index <= 1 ? 'var(--accent-sky)' : 'var(--text-dim)',
                boxShadow: index <= 1 ? '0 0 6px var(--accent-sky)' : 'none'
              }}
            />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
