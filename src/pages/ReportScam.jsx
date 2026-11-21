import { useState } from 'react';
import {
  FileWarning,
  Send,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  PhoneCall,
  ExternalLink,
  UploadCloud
} from 'lucide-react';
import { saveLocalFeedback } from '../utils/storage';

const SCAM_CATEGORIES = [
  'SMS Phishing (Smishing)',
  'WhatsApp Fraudulent Message',
  'Email Phishing',
  'Electricity / Utility Disconnection Threat',
  'Fake Bank KYC / Account Suspension',
  'Part-Time Job / Task Scam',
  'Impersonation / Digital Arrest',
  'Malicious Link / Rogue Website',
  'Suspicious Android APK / App',
  'Other Cyber Threat'
];

export default function ReportScam() {
  const [category, setCategory] = useState(SCAM_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [suspiciousUrl, setSuspiciousUrl] = useState('');
  const [senderContact, setSenderContact] = useState('');
  const [consent, setConsent] = useState(false);
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

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!description.trim()) {
      setError('Please provide a description of the scam attempt.');
      return;
    }

    if (!consent) {
      setError('Please consent to submitting sanitized threat intelligence.');
      return;
    }

    setError(null);
    setSubmitting(true);

    // Save report to local security repository
    saveLocalFeedback({
      reportType: 'COMMUNITY_SCAM_REPORT',
      category,
      description: description.trim(),
      suspiciousUrl: suspiciousUrl.trim() || null,
      senderContact: senderContact.trim() || null,
      attachmentName: fileName || null,
      reportedAt: new Date().toISOString()
    });

    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
      setDescription('');
      setSuspiciousUrl('');
      setSenderContact('');
      setFileName('');
      setConsent(false);
    }, 600);
  };

  return (
    <div className="page-content">
      {/* Official Reporting Disclaimer Banner */}
      <div className="alert-banner warning" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
          <AlertCircle size={16} />
          <span>Local Threat Intelligence Collection Portal</span>
        </div>
        <p style={{ fontSize: '12px', lineHeight: 1.5, margin: 0 }}>
          This form logs threat vectors to ScamShield\'s local heuristic repository to enhance detection models. <strong>This does NOT file an official police complaint.</strong> For financial loss or extortion, you must contact <strong>1930</strong> or register at <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>cybercrime.gov.in</a>.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' }}>
        {/* Main Reporting Form */}
        <div className="scanner-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
            <FileWarning size={20} color="var(--accent-champagne)" />
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-heading)' }}>
                Report a Suspicious Scam Incident
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Contribute observed phishing texts, sender numbers, or malicious domains
              </p>
            </div>
          </div>

          {success ? (
            <div style={{ padding: '24px', textAlign: 'center', backgroundColor: 'var(--threat-safe-bg)', border: '1px solid var(--threat-safe-border)', borderRadius: 'var(--radius-md)' }}>
              <CheckCircle2 size={36} color="var(--threat-safe)" style={{ margin: '0 auto 12px' }} />
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--threat-safe)', marginBottom: '6px' }}>
                Threat Report Recorded Successfully
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 16px' }}>
                Your report has been securely saved to the local security audit log. If you suffered financial harm, please proceed immediately to official emergency channels below.
              </p>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setSuccess(false)}
                style={{ height: '32px', fontSize: '12px', margin: '0 auto' }}
              >
                Submit Another Report
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Scam Category *</label>
                <select
                  className="cyber-input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {SCAM_CATEGORIES.map((cat, idx) => (
                    <option key={idx} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Incident Description / Message Content *</label>
                <textarea
                  className="cyber-textarea"
                  rows={4}
                  placeholder="Paste the suspicious message body or describe the incident (e.g. caller claimed to be police officer, sent link to pay bill)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Suspicious URL / Domain (Optional)</label>
                  <input
                    type="text"
                    className="cyber-input"
                    placeholder="e.g. http://sbi-kyc-verify.xyz"
                    value={suspiciousUrl}
                    onChange={(e) => setSuspiciousUrl(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Sender Phone Number or Email (Optional)</label>
                  <input
                    type="text"
                    className="cyber-input"
                    placeholder="e.g. +91 9876543210 or sender@fake.com"
                    value={senderContact}
                    onChange={(e) => setSenderContact(e.target.value)}
                  />
                </div>
              </div>

              {/* File Attachment */}
              <div className="form-group">
                <label className="form-label">Upload Evidence Screenshot (Optional, Max 10MB)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label className="btn-secondary" style={{ cursor: 'pointer', height: '34px', fontSize: '12px' }}>
                    <UploadCloud size={14} />
                    <span>Choose File</span>
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {fileName || 'No file selected'}
                  </span>
                </div>
              </div>

              {/* Privacy Consent Checkbox */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px', backgroundColor: 'var(--bg-surface-secondary)', borderRadius: 'var(--radius-sm)' }}>
                <input
                  type="checkbox"
                  id="consent-check"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  style={{ marginTop: '2px' }}
                />
                <label htmlFor="consent-check" style={{ fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  I confirm that I have removed personal account numbers or confidential passwords before submitting, and I agree to save this threat intelligence locally.
                </label>
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
                  <span>{submitting ? 'Recording Threat...' : 'Submit Incident Report'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right Column: Emergency Helpline Notice */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="scanner-panel" style={{ padding: '16px', gap: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldAlert size={15} color="var(--threat-danger)" />
              <span>Lost Money or Shared OTP?</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              If you have already sent money or entered a UPI PIN, every minute matters. Contact your bank immediately and dial the national emergency helpline:
            </p>

            <a
              href="tel:1930"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                backgroundColor: 'var(--threat-danger-bg)',
                border: '1px solid var(--threat-danger-border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--threat-danger)',
                fontWeight: 700,
                fontSize: '14px',
                textDecoration: 'none'
              }}
            >
              <PhoneCall size={16} />
              <span>Call Helpline 1930 (Golden Hour)</span>
            </a>

            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Operating 24/7 across all states under the Ministry of Home Affairs.
            </div>
          </div>

          <div className="scanner-panel" style={{ padding: '16px', gap: '10px' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
              Official Reporting Portals
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <a
                href="https://cybercrime.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--accent-sky)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none' }}
              >
                <span>National Cyber Crime Portal</span>
                <ExternalLink size={12} />
              </a>
              <a
                href="https://sancharsaathi.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--accent-sky)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none' }}
              >
                <span>Sanchar Saathi (Chakshu)</span>
                <ExternalLink size={12} />
              </a>
              <a
                href="https://sachet.rbi.org.in"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--accent-sky)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none' }}
              >
                <span>RBI Sachet Portal</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
