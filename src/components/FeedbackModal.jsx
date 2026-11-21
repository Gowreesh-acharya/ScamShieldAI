import { useState } from 'react';
import { X, MessageSquare, Check, ThumbsUp, ThumbsDown, Send } from 'lucide-react';
import { submitFeedbackApi } from '../services/api';
import { saveLocalFeedback } from '../utils/storage';

export default function FeedbackModal({ scan, onClose }) {
  const [feedbackType, setFeedbackType] = useState('false_positive'); // 'false_positive' | 'missed_threat' | 'threat_intel'
  const [rating, setRating] = useState('accurate'); // 'accurate' | 'inaccurate'
  const [comments, setComments] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      scanId: scan?.id || 'general',
      scanTarget: scan?.target || 'general',
      feedbackType,
      rating,
      comments: comments.trim()
    };

    // Save locally
    saveLocalFeedback(payload);

    // Call API if available
    await submitFeedbackApi(payload);

    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 1800);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={16} color="var(--accent-sky)" />
            <h3>Submit Security Feedback</h3>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            aria-label="Close feedback dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'var(--threat-safe-bg)', border: '1px solid var(--threat-safe-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--threat-safe)' }}>
                <Check size={24} />
              </div>
              <h4 style={{ fontSize: '15px', color: '#ffffff', fontWeight: 600 }}>Thank You!</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '300px' }}>
                Your feedback has been logged to refine ScamShield's threat detection models and heuristic parameters.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {scan && (
                <div style={{ backgroundColor: 'var(--bg-surface-input)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span style={{ textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '2px' }}>Referenced Scan:</span>
                  <div style={{ color: '#ffffff', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {scan.target}
                  </div>
                </div>
              )}

              {/* Feedback Category */}
              <div className="form-group">
                <label className="form-label">Category</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {[
                    { id: 'false_positive', label: 'False Positive' },
                    { id: 'missed_threat', label: 'Missed Scam' },
                    { id: 'threat_intel', label: 'Threat Intel' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`filter-btn ${feedbackType === cat.id ? 'active' : ''}`}
                      onClick={() => setFeedbackType(cat.id)}
                      style={{ height: '34px', fontSize: '11px' }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accuracy Assessment */}
              <div className="form-group">
                <label className="form-label">Classification Accuracy</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className={`btn-secondary ${rating === 'accurate' ? 'active' : ''}`}
                    onClick={() => setRating('accurate')}
                    style={{ flex: 1, height: '34px', fontSize: '12px', justifyContent: 'center' }}
                  >
                    <ThumbsUp size={13} color="var(--threat-safe)" />
                    <span>Accurate</span>
                  </button>
                  <button
                    type="button"
                    className={`btn-secondary ${rating === 'inaccurate' ? 'active' : ''}`}
                    onClick={() => setRating('inaccurate')}
                    style={{ flex: 1, height: '34px', fontSize: '12px', justifyContent: 'center' }}
                  >
                    <ThumbsDown size={13} color="var(--threat-danger)" />
                    <span>Inaccurate</span>
                  </button>
                </div>
              </div>

              {/* Comments */}
              <div className="form-group">
                <label className="form-label" htmlFor="feedback-comments">
                  <span>Comments or Threat Evidence</span>
                </label>
                <textarea
                  id="feedback-comments"
                  className="cyber-textarea"
                  rows={4}
                  placeholder="Explain why this content was misclassified or provide additional threat intelligence..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  style={{ minHeight: '90px' }}
                />
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  <Send size={14} />
                  <span>{submitting ? 'Submitting...' : 'Submit Feedback'}</span>
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={onClose}
                  disabled={submitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
