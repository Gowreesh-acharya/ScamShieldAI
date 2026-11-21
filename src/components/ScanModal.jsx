import { X } from 'lucide-react';
import RiskResultCard from './RiskResultCard';

export default function ScanModal({ scan, onClose, onFeedback, onInvestigate }) {
  if (!scan) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Security Audit Record</h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Audit Ref: {scan.id} &bull; {new Date(scan.timestamp).toLocaleString()}
            </span>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            aria-label="Close audit record"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ marginBottom: '16px', backgroundColor: 'var(--bg-surface-input)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.6px' }}>
              Inspected Target Artifact
            </span>
            <div style={{ wordBreak: 'break-all', marginTop: '4px', fontSize: '13px', color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
              {scan.target}
            </div>
          </div>

          <RiskResultCard
            result={scan}
            onFeedback={onFeedback}
            onInvestigate={(item) => {
              onClose();
              if (onInvestigate) onInvestigate(item);
            }}
          />
        </div>
      </div>
    </div>
  );
}
