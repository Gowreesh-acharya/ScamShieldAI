import { useState } from 'react';
import {
  MessageSquare,
  Star,
  Send,
  CheckCircle2,
  AlertCircle,
  UploadCloud
} from 'lucide-react';
import { saveLocalFeedback } from '../utils/storage';
import { submitFeedbackApi } from '../services/api';

const CATEGORIES = [
  'General Feedback',
  'Bug Report',
  'Feature Request',
  'Detection Accuracy',
  'False Positive',
  'Missed Scam',
  'User Experience',
  'Other'
];

export default function FeedbackPage() {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [fileName, setFileName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setError('Attachment exceeds 10MB limit.');
        return;
      }
      setFileName(file.name);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim()) {
      setError('Please provide feedback comments.');
      return;
    }

    setError(null);
    setSubmitting(true);

    const payload = {
      feedbackType: category,
      rating: `${rating}_stars`,
      comments: message.trim(),
      name: senderName.trim() || 'Anonymous',
      email: senderEmail.trim() || null,
      attachment: fileName || null,
      timestamp: new Date().toISOString()
    };

    saveLocalFeedback(payload);
    await submitFeedbackApi(payload);

    setSubmitting(false);
    setSuccess(true);
    setMessage('');
    setFileName('');
  };

  return (
    <div className="page-content">
      <div style={{ maxWidth: '680px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="scanner-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px', marginBottom: '16px' }}>
            <MessageSquare size={20} color="var(--accent-champagne)" />
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-heading)' }}>
                Security & Platform Feedback
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Report false positives, missed threat patterns, bugs, or feature suggestions
              </p>
            </div>
          </div>

          {success ? (
            <div style={{ padding: '28px', textAlign: 'center', backgroundColor: 'var(--threat-safe-bg)', border: '1px solid var(--threat-safe-border)', borderRadius: 'var(--radius-md)' }}>
              <CheckCircle2 size={36} color="var(--threat-safe)" style={{ margin: '0 auto 12px' }} />
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--threat-safe)', marginBottom: '6px' }}>
                Feedback Submitted Successfully
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 16px' }}>
                Thank you for helping us tune ScamShield\'s detection rules and platform reliability.
              </p>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setSuccess(false)}
                style={{ height: '34px', fontSize: '12px', margin: '0 auto' }}
              >
                Submit Additional Feedback
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    className="cyber-input"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {CATEGORIES.map((cat, idx) => (
                      <option key={idx} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Rating</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '36px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px',
                          color: star <= rating ? 'var(--accent-champagne)' : 'var(--border-medium)'
                        }}
                      >
                        <Star size={16} fill={star <= rating ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Your Feedback / Observations *</label>
                <textarea
                  className="cyber-textarea"
                  rows={5}
                  placeholder="Tell us what worked, what went wrong, or details about a false positive classification..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Name (Optional)</label>
                  <input
                    type="text"
                    className="cyber-input"
                    placeholder="Analyst or User Name"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email (Optional)</label>
                  <input
                    type="email"
                    className="cyber-input"
                    placeholder="analyst@domain.com"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Attachment (Optional, Max 10MB)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <label className="btn-secondary" style={{ cursor: 'pointer', height: '34px', fontSize: '12px' }}>
                    <UploadCloud size={14} />
                    <span>Upload Screenshot or Log</span>
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp,.txt,.json"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {fileName || 'No file chosen'}
                  </span>
                </div>
              </div>

              {error && (
                <div style={{ color: 'var(--threat-danger)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                  style={{ height: '38px', padding: '0 20px', fontSize: '13px' }}
                >
                  <Send size={14} />
                  <span>{submitting ? 'Submitting...' : 'Submit Feedback'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
