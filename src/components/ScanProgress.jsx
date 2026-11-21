import { Cpu } from 'lucide-react';

export default function ScanProgress({ type = 'message' }) {
  const steps = {
    message: [
      'Checking for requests for sensitive information...',
      'Looking for pressure and threats...',
      'Checking addresses mentioned in the message...',
      'Computing the risk score...'
    ],
    url: [
      'Parsing the address...',
      'Checking for misleading hostname information...',
      'Comparing brand names with reference domains...',
      'Computing the risk score...'
    ],
    combined: [
      'Checking the message for scam indicators...',
      'Inspecting the link structure...',
      'Comparing brand names with reference domains...',
      'Computing a combined risk score...'
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
          Checking for scam indicators
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
