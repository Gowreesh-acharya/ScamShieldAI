import { useState } from 'react';
import {
  MessageSquare,
  ShieldAlert,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Languages
} from 'lucide-react';
import { scanMessageApi } from '../services/api';
import { saveScan } from '../utils/storage';
import RiskResultCard from '../components/RiskResultCard';
import ScanProgress from '../components/ScanProgress';

const SAMPLE_MESSAGES = [
  {
    label: 'English: SBI KYC Phishing',
    lang: 'en',
    type: 'danger',
    text: 'Dear Customer, your SBI YONO account will be blocked today. Please update your PAN immediately by visiting http://sbi-kyc-verify.update-portal.xyz/login to avoid suspension.'
  },
  {
    label: 'Hindi: बिजली बिल कटौती चेतावनी',
    lang: 'hi',
    type: 'danger',
    text: 'अति आवश्यक सूचना: आपका बिजली बिल अपडेट न होने के कारण आज रात 9:30 बजे बिजली काट दी जाएगी। तुरंत बिजली अधिकारी से 8912345678 पर संपर्क करें या बिल भरें: http://bijli-bill-pay.xyz'
  },
  {
    label: 'Kannada: ಖಾತೆ ಬ್ಲಾಕ್ ಎಚ್ಚರಿಕೆ',
    lang: 'kn',
    type: 'danger',
    text: 'ಗ್ರಾಹಕರೇ, ನಿಮ್ಮ ಎಸ್‌ಬಿಐ ಬ್ಯಾಂಕ್ ಖಾತೆ ಇಂದು ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ. ನಿಮ್ಮ ಪ್ಯಾನ್ ವಿವರಗಳನ್ನು ತಕ್ಷಣ ನವೀಕರಿಸಿ ಖಾತೆ ಸ್ಥಗಿತಗೊಳ್ಳುವುದನ್ನು ತಪ್ಪಿಸಿ: http://sbi-kannada-portal.xyz'
  },
  {
    label: 'Hinglish: WhatsApp Job Scam',
    lang: 'hinglish',
    type: 'danger',
    text: 'Badhai ho! Aapka selection part-time remote movie rating job ke liye ho gaya hai. Daily roz 4,500 se 8,000 kamayein. Bonus claim karne ke liye WhatsApp par sampark karein.'
  },
  {
    label: 'English: Amazon Delivery (Safe)',
    lang: 'en',
    type: 'safe',
    text: 'Your Amazon package with order #402-981293 has been dispatched and will arrive by 5 PM today. Track live at https://amazon.in/orders.'
  }
];

export default function MessageScanner({ onScanComplete }) {
  const [text, setText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('auto'); // 'auto' | 'en' | 'hi' | 'kn' | 'hinglish'
  const [explanationLang, setExplanationLang] = useState('en'); // 'en' | 'hi' | 'kn'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleAnalyze = async (e) => {
    if (e) e.preventDefault();

    if (!text.trim()) {
      setError('Please enter or paste a message to analyze.');
      return;
    }

    if (text.trim().length < 5) {
      setError('Message is too short for meaningful security analysis (minimum 5 characters).');
      return;
    }

    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const scanResult = await scanMessageApi(text, {
        targetLanguage: selectedLanguage,
        explanationLang
      });
      setResult(scanResult);
      saveScan(scanResult);
      if (onScanComplete) onScanComplete();
    } catch (err) {
      setError(err.message || 'An unexpected error occurred during message inspection.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setText('');
    setError(null);
    setResult(null);
  };

  const handleLoadSample = (sample) => {
    setText(sample.text);
    if (sample.lang) {
      setSelectedLanguage(sample.lang);
      if (['hi', 'kn'].includes(sample.lang)) {
        setExplanationLang(sample.lang);
      } else {
        setExplanationLang('en');
      }
    }
    setError(null);
    setResult(null);
  };

  return (
    <div className="page-content">
      <div className="scanner-grid">
        {/* Left Column: Form & Presets */}
        <div className="scanner-panel">
          <div className="scanner-panel-header">
            <h3>
              <MessageSquare size={16} color="var(--accent-sky)" />
              Multilingual Message Scanner
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              EN / HI / KN / Hinglish
            </span>
          </div>

          {/* Language Selector Controls */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="input-language">
                <span>Message Language</span>
              </label>
              <select
                id="input-language"
                className="cyber-input"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                style={{ padding: '0 10px', height: '36px', fontSize: '12px' }}
              >
                <option value="auto">Auto-Detect Script</option>
                <option value="en">English</option>
                <option value="hi">Hindi (हिंदी)</option>
                <option value="kn">Kannada (ಕನ್ನಡ)</option>
                <option value="hinglish">Hinglish (Hindi in Latin)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="explanation-language">
                <span>Explanation Language</span>
              </label>
              <select
                id="explanation-language"
                className="cyber-input"
                value={explanationLang}
                onChange={(e) => setExplanationLang(e.target.value)}
                style={{ padding: '0 10px', height: '36px', fontSize: '12px' }}
              >
                <option value="en">English</option>
                <option value="hi">Hindi (हिंदी)</option>
                <option value="kn">Kannada (ಕನ್ನಡ)</option>
              </select>
            </div>
          </div>

          {/* Sample Presets */}
          <div className="presets-container">
            <span className="presets-title">Load Multilingual Test Scenarios:</span>
            <div className="presets-list">
              {SAMPLE_MESSAGES.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="preset-chip"
                  onClick={() => handleLoadSample(sample)}
                >
                  <span className={`preset-dot ${sample.type}`} />
                  <span>{sample.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleAnalyze} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="message-input">
                <span>Original Message Content</span>
                <span className="char-counter">{text.length} characters</span>
              </label>

              <textarea
                id="message-input"
                className="cyber-textarea"
                rows={6}
                placeholder="Paste the suspicious SMS, WhatsApp message, or email body in English, Hindi, Kannada, or Hinglish..."
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  if (error) setError(null);
                }}
              />
            </div>

            {/* Error Message Banner */}
            {error && (
              <div className="alert-banner warning">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={15} />
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="form-actions">
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || !text.trim()}
              >
                <ShieldAlert size={15} />
                <span>{loading ? 'Analyzing Linguistics...' : 'Analyze Message'}</span>
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={handleClear}
                disabled={loading || (!text && !result && !error)}
              >
                <Trash2 size={13} />
                <span>Clear</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Progress or Result */}
        <div>
          {loading && <ScanProgress type="message" />}

          {!loading && result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Language Detection Stamp */}
              {result.language && (
                <div style={{ backgroundColor: 'var(--bg-surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Languages size={15} color="var(--accent-sky)" />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff' }}>
                      Detected: {result.language.name}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Confidence: {result.language.confidence}%
                  </span>
                </div>
              )}

              <RiskResultCard result={result} />
            </div>
          )}

          {!loading && !result && (
            <div className="empty-results-box">
              <MessageSquare size={32} color="var(--border-medium)" />
              <h4>Awaiting Multilingual Message</h4>
              <p style={{ maxWidth: '320px', fontSize: '13px' }}>
                Paste communication content in English, Hindi, Kannada, or Hinglish to detect fraud patterns and urgency coercion.
              </p>

              <div className="empty-checklist">
                <div className="empty-checklist-item">
                  <CheckCircle2 size={13} color="var(--accent-sky)" />
                  <span>Supports English, Hindi (हिंदी), Kannada (ಕನ್ನಡ), and Hinglish</span>
                </div>
                <div className="empty-checklist-item">
                  <CheckCircle2 size={13} color="var(--accent-sky)" />
                  <span>Preserves original message text verbatim</span>
                </div>
                <div className="empty-checklist-item">
                  <CheckCircle2 size={13} color="var(--accent-sky)" />
                  <span>Identifies suspicious phrases in original regional scripts</span>
                </div>
                <div className="empty-checklist-item">
                  <CheckCircle2 size={13} color="var(--accent-sky)" />
                  <span>Provides localized explanations in English, Hindi, or Kannada</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
