import { useState } from 'react';
import {
  Shield,
  FileImage,
  Globe,
  Bot,
  Languages,
  LifeBuoy,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Lock,
  ChevronDown,
  CheckCircle2,
  Sparkles,
  PhoneCall,
  ExternalLink,
  Info,
  Send,
  Star,
  Zap,
  Eye
} from 'lucide-react';
import { analyzeMessage } from '../utils/demoAnalyzer';
import { saveLocalFeedback } from '../utils/storage';

const FAQ_ITEMS = [
  {
    q: 'How does ScamShield AI detect scams and phishing attacks?',
    a: 'ScamShield AI utilizes a multi-tiered inspection architecture. It combines real-time linguistic pattern recognition across English, Hindi, Kannada, and Hinglish with deep URL intelligence (typosquatting detection, raw IP hosting, high-risk TLD filters, and open redirect scanning) and optical character recognition (OCR) for screenshots.'
  },
  {
    q: 'Is my scanned data kept private and confidential?',
    a: 'Yes. ScamShield AI is engineered with a privacy-first mandate. Scans are processed locally or via encrypted, ephemeral API calls without logging sensitive personal credentials. No passwords, UPI PINs, or bank account numbers are ever permanently retained or shared.'
  },
  {
    q: 'What languages does the Message Scanner support?',
    a: 'The scanner natively supports English, Hindi (हिंदी), Kannada (ಕನ್ನಡ), and Hinglish (Hindi written in the Latin alphabet). It preserves the original dialect verbatim and extracts regional scam keywords commonly deployed in Indian fraud campaigns.'
  },
  {
    q: 'What should I do if I have already sent money or shared an OTP?',
    a: 'Navigate immediately to Fraud Emergency Mode in ScamShield AI. It provides situation-specific containment checklists and direct links to India\'s official National Cyber Crime Reporting Portal (cybercrime.gov.in) and the 1930 emergency financial fraud helpline.'
  },
  {
    q: 'Does ScamShield work when the backend API is offline?',
    a: 'Yes. ScamShield features an automated failover engine with an offline heuristic analyzer that inspects URL syntax, domain anomalies, and high-risk urgency language without external dependencies, ensuring continuous protection.'
  },
  {
    q: 'How is ScamShield AI different from generic antivirus tools?',
    a: 'Generic antivirus targets malware files. ScamShield AI specializes in social engineering, psychological urgency coercion, digital arrest intimidation, utility disconnection threats, and credential harvesting—the modern vectors of real-world financial fraud.'
  }
];

const SECURITY_TIPS = [
  {
    id: 1,
    title: 'The Golden Hour Protocol (1930)',
    category: 'Financial Protection',
    desc: 'If you fall victim to unauthorized UPI or bank fund transfers, calling 1930 within the first 2 hours activates an automatic inter-bank freeze on the recipient account.',
    icon: PhoneCall
  },
  {
    id: 2,
    title: 'UPI PINs Are Only for Debits',
    category: 'UPI Hygiene',
    desc: 'Receiving refunds, cashback, lottery prizes, or buyer payments NEVER requires entering your UPI PIN. Entering a PIN always authorizes an immediate debit from your account.',
    icon: Lock
  },
  {
    id: 3,
    title: 'Inspect Hostname Suffixes',
    category: 'URL Safety',
    desc: 'Scammers create subdomains like sbi-kyc.update-portal.xyz to trick users. Always verify the true root domain before entering any login credentials.',
    icon: Globe
  },
  {
    id: 4,
    title: 'Beware of "Digital Arrest" Threats',
    category: 'Legal Impersonation',
    desc: 'No law enforcement agency, CBI officer, or customs department conducts arrests or demands asset verification over WhatsApp video calls or Skype.',
    icon: ShieldAlert
  }
];

export default function LandingPage({
  onLaunchApp,
  theme,
  onThemeChange
}) {
  const [openFaq, setOpenFaq] = useState(0);
  const [previewInput, setPreviewInput] = useState('');
  const [previewResult, setPreviewResult] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'about' | 'awareness' | 'contact' | 'privacy' | 'terms' | 'disclaimer'

  // Public Feedback State
  const [feedbackCategory, setFeedbackCategory] = useState('General Feedback');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const handleTestPreview = (sampleText) => {
    const textToScan = sampleText || previewInput;
    if (!textToScan.trim()) return;

    setPreviewLoading(true);
    setTimeout(() => {
      try {
        const res = analyzeMessage(textToScan, { targetLanguage: 'auto', explanationLang: 'en' });
        setPreviewResult(res);
      } catch (err) {
        console.error(err);
      } finally {
        setPreviewLoading(false);
      }
    }, 450);
  };

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    if (!feedbackMsg.trim()) return;

    saveLocalFeedback({
      feedbackType: feedbackCategory,
      rating: `${feedbackRating}_stars`,
      comments: feedbackMsg,
      source: 'public_landing_page'
    });

    setFeedbackSubmitted(true);
    setFeedbackMsg('');
    setTimeout(() => {
      setFeedbackSubmitted(false);
    }, 4000);
  };

  return (
    <div className="landing-container">
      {/* ======================================================================
          1. Public Top Navigation Bar
          ====================================================================== */}
      <header className="landing-navbar">
        <div className="landing-nav-inner">
          <div className="landing-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="landing-logo-box">
              <Shield size={22} />
            </div>
            <div>
              <div className="landing-brand-title">
                ScamShield <span className="landing-brand-badge">AI</span>
              </div>
              <div className="landing-brand-sub">Enterprise Cyber Defense</div>
            </div>
          </div>

          <nav className="landing-nav-links">
            <a href="#hero">Home</a>
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#scam-awareness" onClick={(e) => { e.preventDefault(); setActiveModal('awareness'); }}>Scam Awareness</a>
            <a href="#about" onClick={(e) => { e.preventDefault(); setActiveModal('about'); }}>About Us</a>
            <a href="#faq">FAQ</a>
            <a href="#contact" onClick={(e) => { e.preventDefault(); setActiveModal('contact'); }}>Contact</a>
          </nav>

          <div className="landing-nav-actions">
            {/* Theme Toggle Button */}
            <button
              type="button"
              className="theme-pill-btn"
              onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
              aria-label="Toggle Theme"
            >
              <span className="theme-pill-text">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
            </button>

            {/* Launch App CTA */}
            <button
              type="button"
              className="btn-primary landing-cta-btn"
              onClick={() => onLaunchApp('dashboard')}
            >
              <span>Scan Now</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* ======================================================================
          2. Hero Section
          ====================================================================== */}
      <section id="hero" className="landing-hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={13} color="var(--accent-champagne)" />
            <span>Build Bengaluru 2.0 &bull; Real-World Cyber Defense</span>
          </div>

          <h1 className="hero-headline">
            Detect. Protect. <span className="highlight-text">Trust.</span>
          </h1>

          <h2 className="hero-subtitle">
            Your Ultimate Phishing and Scam Detection Platform
          </h2>

          <p className="hero-description">
            Stay one step ahead of cybercriminals with AI-powered detection. Scan messages, URLs and screenshots to identify scams, phishing attempts and online threats.
          </p>

          <div className="hero-cta-group">
            <button
              type="button"
              className="btn-primary hero-btn-main"
              onClick={() => onLaunchApp('message')}
            >
              <Zap size={16} />
              <span>Scan Now</span>
            </button>

            <button
              type="button"
              className="btn-secondary hero-btn-secondary"
              onClick={() => onLaunchApp('demo')}
            >
              <Eye size={16} />
              <span>Watch Demo / Test Scenarios</span>
            </button>
          </div>

          <div className="hero-trust-strip">
            <div className="trust-item">
              <CheckCircle2 size={14} color="var(--threat-safe)" />
              <span>Zero Credential Retention</span>
            </div>
            <div className="trust-item">
              <CheckCircle2 size={14} color="var(--threat-safe)" />
              <span>Multi-Script Indian Dialects</span>
            </div>
            <div className="trust-item">
              <CheckCircle2 size={14} color="var(--threat-safe)" />
              <span>Direct 1930 Emergency Triage</span>
            </div>
          </div>
        </div>

        {/* Hero Cybersecurity Visual Illustration */}
        <div className="hero-visual-wrapper">
          <div className="cyber-laptop-mockup">
            <div className="laptop-header">
              <div className="laptop-dots">
                <span className="dot red" />
                <span className="dot yellow" />
                <span className="dot green" />
              </div>
              <div className="laptop-url-bar">
                <Lock size={10} color="var(--threat-safe)" />
                <span>scamshield.ai/defense-grid</span>
              </div>
            </div>

            <div className="laptop-screen-body">
              <div className="laptop-grid-header">
                <div className="laptop-metric">
                  <span className="metric-label">DEFENSE STATUS</span>
                  <span className="metric-val active">ACTIVE MONITORING</span>
                </div>
                <div className="laptop-metric">
                  <span className="metric-label">ACCURACY</span>
                  <span className="metric-val">99.4% VERIFIED</span>
                </div>
              </div>

              {/* Central Glowing Shield with Fingerprint Icon */}
              <div className="central-shield-emblem">
                <div className="shield-glow-ring" />
                <div className="shield-core-icon">
                  <Shield size={44} color="#00e5ff" />
                </div>
              </div>

              <div className="laptop-status-text">
                Heuristic Neural Grid Active &bull; Real-Time Threat Analysis
              </div>
            </div>
          </div>

          {/* Floating Security Warning Badges */}
          <div className="floating-warning-badge badge-top">
            <ShieldAlert size={16} color="var(--threat-danger)" />
            <div>
              <div className="warning-title">Phishing Email Warning</div>
              <div className="warning-sub">Fake SBI KYC portal blocked</div>
            </div>
          </div>

          <div className="floating-warning-badge badge-mid">
            <AlertTriangle size={16} color="var(--threat-warning)" />
            <div>
              <div className="warning-title">Suspicious URL Warning</div>
              <div className="warning-sub">bescom-bill-desk.online flagged</div>
            </div>
          </div>

          <div className="floating-warning-badge badge-bot">
            <ShieldCheck size={16} color="var(--threat-safe)" />
            <div>
              <div className="warning-title">Fraudulent Message Stopped</div>
              <div className="warning-sub">UPI PIN extortion thwarted</div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================================
          3. Five Core Feature Cards
          ====================================================================== */}
      <section id="features" className="landing-section">
        <div className="section-header">
          <span className="section-eyebrow">Enterprise Detection Engines</span>
          <h2 className="section-title">Specialized Protection Across Every Attack Vector</h2>
          <p className="section-desc">
            Deploy precision intelligence engines designed to detect social engineering, malicious domains, and fraudulent mobile communications.
          </p>
        </div>

        <div className="five-features-grid">
          {/* 1. Screenshot Scanner */}
          <div className="feature-card" onClick={() => onLaunchApp('screenshot')}>
            <div className="feature-icon-box" style={{ background: 'rgba(2, 132, 199, 0.12)', color: 'var(--accent-sky)' }}>
              <FileImage size={24} />
            </div>
            <h3 className="feature-card-title">Screenshot Scanner</h3>
            <p className="feature-card-desc">
              Check suspicious images instantly. Upload screenshots of SMS or WhatsApp chats with automated OCR extraction and manual verification.
            </p>
            <div className="feature-card-action">
              <span>Scan Screenshot</span>
              <ArrowRight size={14} />
            </div>
          </div>

          {/* 2. URL Intelligence */}
          <div className="feature-card" onClick={() => onLaunchApp('url')}>
            <div className="feature-icon-box" style={{ background: 'rgba(196, 154, 88, 0.15)', color: 'var(--accent-champagne)' }}>
              <Globe size={24} />
            </div>
            <h3 className="feature-card-title">URL Intelligence</h3>
            <p className="feature-card-desc">
              Analyze links for potential threats. Inspect destination domains for abusive TLDs, typosquatting, raw IP hosting, and open redirects.
            </p>
            <div className="feature-card-action">
              <span>Analyze URL</span>
              <ArrowRight size={14} />
            </div>
          </div>

          {/* 3. AI Investigation */}
          <div className="feature-card" onClick={() => onLaunchApp('investigate')}>
            <div className="feature-icon-box" style={{ background: 'rgba(56, 189, 248, 0.12)', color: 'var(--accent-cyan)' }}>
              <Bot size={24} />
            </div>
            <h3 className="feature-card-title">AI Investigation</h3>
            <p className="feature-card-desc">
              Get expert insights and recommendations. Chat interactively with the cyber assistant to understand technical findings in plain language.
            </p>
            <div className="feature-card-action">
              <span>Investigate Scam</span>
              <ArrowRight size={14} />
            </div>
          </div>

          {/* 4. Multilingual Detection */}
          <div className="feature-card" onClick={() => onLaunchApp('message')}>
            <div className="feature-icon-box" style={{ background: 'rgba(138, 155, 121, 0.18)', color: 'var(--accent-sage)' }}>
              <Languages size={24} />
            </div>
            <h3 className="feature-card-title">Multilingual Detection</h3>
            <p className="feature-card-desc">
              Detect scams in multiple languages. Native comprehension of English, Hindi, Kannada, and Hinglish with localized security explanations.
            </p>
            <div className="feature-card-action">
              <span>Scan Message</span>
              <ArrowRight size={14} />
            </div>
          </div>

          {/* 5. Emergency Mode */}
          <div className="feature-card emergency-card" onClick={() => onLaunchApp('emergency')}>
            <div className="feature-icon-box" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--threat-danger)' }}>
              <LifeBuoy size={24} />
            </div>
            <h3 className="feature-card-title" style={{ color: 'var(--threat-danger)' }}>Emergency Mode</h3>
            <p className="feature-card-desc">
              Get instant help in fraud situations. Rapid incident triage for compromised OTPs, stolen UPI PINs, with direct Indian helpline 1930 integration.
            </p>
            <div className="feature-card-action" style={{ color: 'var(--threat-danger)' }}>
              <span>Emergency Triage</span>
              <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================================
          4. Interactive Scanner Preview Widget
          ====================================================================== */}
      <section className="landing-section preview-section">
        <div className="section-header">
          <span className="section-eyebrow">Try It Live</span>
          <h2 className="section-title">Instant Security Analysis Preview</h2>
          <p className="section-desc">
            Test a suspicious message below or pick a pre-configured sample to experience ScamShield's threat detection engine in real time.
          </p>
        </div>

        <div className="preview-widget-container">
          <div className="preview-input-box">
            <div className="preview-samples-bar">
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Quick Scenarios:</span>
              <button
                type="button"
                className="preview-chip"
                onClick={() => {
                  const t = 'Dear Customer, your SBI account will be blocked today. Update PAN immediately: http://sbi-kyc-verify.xyz/login';
                  setPreviewInput(t);
                  handleTestPreview(t);
                }}
              >
                SBI KYC Phishing
              </button>
              <button
                type="button"
                className="preview-chip"
                onClick={() => {
                  const t = 'ಅತಿ ತುರ್ತು: ನಿಮ್ಮ ವಿದ್ಯುತ್ ಬಿಲ್ ಪಾವತಿಸದ ಕಾರಣ ಇಂದು ರಾತ್ರಿ ವಿದ್ಯುತ್ ಸಂಪರ್ಕ ಕಡಿತಗೊಳಿಸಲಾಗುವುದು. ಕರೆ ಮಾಡಿ 9876543210';
                  setPreviewInput(t);
                  handleTestPreview(t);
                }}
              >
                BESCOM Kannada Threat
              </button>
              <button
                type="button"
                className="preview-chip"
                onClick={() => {
                  const t = 'Your package #49281 has been delivered to your front porch. Track at https://amazon.in/orders';
                  setPreviewInput(t);
                  handleTestPreview(t);
                }}
              >
                Legitimate Delivery (Safe)
              </button>
            </div>

            <textarea
              className="cyber-textarea preview-textarea"
              rows={4}
              placeholder="Paste any suspicious SMS, WhatsApp message, email excerpt or URL here..."
              value={previewInput}
              onChange={(e) => setPreviewInput(e.target.value)}
            />

            <div className="preview-action-bar">
              <button
                type="button"
                className="btn-primary"
                onClick={() => handleTestPreview()}
                disabled={previewLoading || !previewInput.trim()}
              >
                <Zap size={14} />
                <span>{previewLoading ? 'Analyzing threat indicators...' : 'Run Quick Analysis'}</span>
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => onLaunchApp('message')}
              >
                <span>Open Full Scanner Suite</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Preview Result Card */}
          {previewResult && (
            <div className="preview-result-card">
              <div className="preview-result-header">
                <span className={`classification-badge ${previewResult.classification}`}>
                  {previewResult.classification}
                </span>
                <span className="preview-score-val">
                  Risk Score: {previewResult.riskScore}/100
                </span>
              </div>
              <div className="preview-result-summary">
                {previewResult.summary}
              </div>
              <div className="preview-result-recom">
                <strong>Action:</strong> {previewResult.recommendation}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ======================================================================
          5. How ScamShield Works
          ====================================================================== */}
      <section id="how-it-works" className="landing-section">
        <div className="section-header">
          <span className="section-eyebrow">Detection Pipeline</span>
          <h2 className="section-title">How ScamShield AI Protects You</h2>
          <p className="section-desc">
            A 4-step pipeline that ingests raw artifacts, executes heuristics and neural models, and generates grounded advisories.
          </p>
        </div>

        <div className="how-it-works-grid">
          <div className="step-card">
            <div className="step-number">01</div>
            <h3 className="step-title">Ingest & OCR Extraction</h3>
            <p className="step-desc">
              Submit text, destination URLs, or mobile screenshots. Screenshots undergo automated optical character extraction with user verification.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">02</div>
            <h3 className="step-title">Linguistic & Syntax Analysis</h3>
            <p className="step-desc">
              Our engines parse psychological urgency coercion, brand impersonation, deceptive homographs, and high-abuse domain infrastructure.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">03</div>
            <h3 className="step-title">Threat Classification</h3>
            <p className="step-desc">
              Scores artifacts from 0 to 100 with clear evidence categories: Safe, Suspicious, or Dangerous, without fabricating intelligence.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">04</div>
            <h3 className="step-title">Instant Incident Triage</h3>
            <p className="step-desc">
              If fraud has occurred, users receive step-by-step mitigation checklists and direct links to India\'s 1930 helpline and cybercrime portal.
            </p>
          </div>
        </div>
      </section>

      {/* ======================================================================
          6. Latest Security Tips
          ====================================================================== */}
      <section className="landing-section">
        <div className="section-header">
          <span className="section-eyebrow">Cyber Hygiene & Intelligence</span>
          <h2 className="section-title">Latest Security Advisories</h2>
          <p className="section-desc">
            Essential cyber hygiene rules vetted by security analysts to defend against modern social engineering tactics.
          </p>
        </div>

        <div className="tips-grid">
          {SECURITY_TIPS.map((tip) => {
            const Icon = tip.icon;
            return (
              <div key={tip.id} className="tip-card">
                <div className="tip-icon-header">
                  <div className="tip-icon-badge">
                    <Icon size={18} color="var(--accent-champagne)" />
                  </div>
                  <span className="tip-category">{tip.category}</span>
                </div>
                <h4 className="tip-title">{tip.title}</h4>
                <p className="tip-desc">{tip.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ======================================================================
          7. Why Choose ScamShield AI
          ====================================================================== */}
      <section className="landing-section why-choose-section">
        <div className="section-header">
          <span className="section-eyebrow">The ScamShield Advantage</span>
          <h2 className="section-title">Engineered for Real-World Cybersecurity</h2>
        </div>

        <div className="why-grid">
          <div className="why-card">
            <CheckCircle2 size={20} color="var(--threat-safe)" />
            <div>
              <h4>Zero Data Fabrication</h4>
              <p>We never claim a threat exists without observable syntax or linguistic proof. Threat intel sources are clearly cited.</p>
            </div>
          </div>

          <div className="why-card">
            <CheckCircle2 size={20} color="var(--threat-safe)" />
            <div>
              <h4>Indian Context Specialization</h4>
              <p>Optimized for prevalent fraud vectors: electricity bill scams, SBI/YONO KYC freezes, part-time rating scams, and digital arrests.</p>
            </div>
          </div>

          <div className="why-card">
            <CheckCircle2 size={20} color="var(--threat-safe)" />
            <div>
              <h4>Failover Heuristic Engine</h4>
              <p>Reliable offline heuristics guarantee seamless scam detection even when disconnected from cloud backend APIs.</p>
            </div>
          </div>

          <div className="why-card">
            <CheckCircle2 size={20} color="var(--threat-safe)" />
            <div>
              <h4>Golden Hour 1930 Integration</h4>
              <p>Built directly into the incident response loop to help victims freeze stolen funds before fraudsters cash out.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================================
          8. Frequently Asked Questions
          ====================================================================== */}
      <section id="faq" className="landing-section">
        <div className="section-header">
          <span className="section-eyebrow">Got Questions?</span>
          <h2 className="section-title">Frequently Asked Questions</h2>
        </div>

        <div className="faq-container">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className={`faq-card ${isOpen ? 'open' : ''}`}>
                <button
                  type="button"
                  className="faq-question-btn"
                  onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    size={16}
                    style={{
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform var(--transition-fast)'
                    }}
                  />
                </button>
                {isOpen && (
                  <div className="faq-answer">
                    <p>{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ======================================================================
          9. Public Feedback Section
          ====================================================================== */}
      <section className="landing-section feedback-section">
        <div className="section-header">
          <span className="section-eyebrow">Community & Threat Intelligence</span>
          <h2 className="section-title">Help Improve Our Detection Models</h2>
          <p className="section-desc">
            Encountered a novel scam vector or false positive? Submit feedback to strengthen the defense community.
          </p>
        </div>

        <div className="feedback-form-card">
          {feedbackSubmitted ? (
            <div className="feedback-success-banner">
              <CheckCircle2 size={24} color="var(--threat-safe)" />
              <div>
                <h4>Thank you for your submission!</h4>
                <p>Your feedback has been logged to the local security audit repository.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleFeedbackSubmit}>
              <div className="feedback-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Feedback Category</label>
                  <select
                    className="cyber-input"
                    value={feedbackCategory}
                    onChange={(e) => setFeedbackCategory(e.target.value)}
                  >
                    <option value="General Feedback">General Feedback</option>
                    <option value="Detection Accuracy">Detection Accuracy</option>
                    <option value="False Positive">False Positive Report</option>
                    <option value="Missed Scam">Missed Scam Technique</option>
                    <option value="Feature Request">Feature Request</option>
                  </select>
                </div>

                <div className="form-group" style={{ width: '160px' }}>
                  <label className="form-label">Rating</label>
                  <div className="star-rating-row">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className="star-btn"
                        onClick={() => setFeedbackRating(star)}
                        style={{ color: star <= feedbackRating ? 'var(--accent-champagne)' : 'var(--border-medium)' }}
                      >
                        <Star size={16} fill={star <= feedbackRating ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Your Observations or Details</label>
                <textarea
                  className="cyber-textarea"
                  rows={3}
                  placeholder="Describe your detection experience or paste details of an emerging scam format..."
                  value={feedbackMsg}
                  onChange={(e) => setFeedbackMsg(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="submit" className="btn-primary" style={{ height: '36px', padding: '0 18px' }}>
                  <Send size={14} />
                  <span>Submit Security Feedback</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* ======================================================================
          10. Public Footer
          ====================================================================== */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-col-brand">
            <div className="landing-brand">
              <div className="landing-logo-box">
                <Shield size={20} />
              </div>
              <div className="landing-brand-title">
                ScamShield <span className="landing-brand-badge">AI</span>
              </div>
            </div>
            <p className="footer-tagline">
              Autonomous cybersecurity defense and social engineering triage platform for Build Bengaluru 2.0.
            </p>
            <div className="footer-helpline-chip">
              <PhoneCall size={13} color="var(--accent-sky)" />
              <span>National Cyber Crime Helpline: <strong>1930</strong></span>
            </div>
          </div>

          <div className="footer-links-grid">
            <div className="footer-col">
              <h5>Detection Engines</h5>
              <a href="#features" onClick={() => onLaunchApp('message')}>Message Scanner</a>
              <a href="#features" onClick={() => onLaunchApp('url')}>URL Intelligence</a>
              <a href="#features" onClick={() => onLaunchApp('screenshot')}>Screenshot OCR</a>
              <a href="#features" onClick={() => onLaunchApp('combined')}>Combined Vectors</a>
              <a href="#features" onClick={() => onLaunchApp('investigate')}>AI Assistant</a>
            </div>

            <div className="footer-col">
              <h5>Public Resources</h5>
              <a href="#scam-awareness" onClick={(e) => { e.preventDefault(); setActiveModal('awareness'); }}>Scam Awareness Guide</a>
              <a href="#about" onClick={(e) => { e.preventDefault(); setActiveModal('about'); }}>About ScamShield</a>
              <a href="#contact" onClick={(e) => { e.preventDefault(); setActiveModal('contact'); }}>Emergency Helplines</a>
              <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer">
                <span>Cybercrime.gov.in</span>
                <ExternalLink size={10} style={{ marginLeft: '4px' }} />
              </a>
              <a href="https://sancharsaathi.gov.in" target="_blank" rel="noopener noreferrer">
                <span>Sanchar Saathi</span>
                <ExternalLink size={10} style={{ marginLeft: '4px' }} />
              </a>
            </div>

            <div className="footer-col">
              <h5>Legal & Compliance</h5>
              <a href="#privacy" onClick={(e) => { e.preventDefault(); setActiveModal('privacy'); }}>Privacy Policy</a>
              <a href="#terms" onClick={(e) => { e.preventDefault(); setActiveModal('terms'); }}>Terms of Service</a>
              <a href="#disclaimer" onClick={(e) => { e.preventDefault(); setActiveModal('disclaimer'); }}>Security Disclaimer</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <div>&copy; {new Date().getFullYear()} ScamShield AI Defense Grid. All rights reserved.</div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span>Build Bengaluru 2.0 Hackathon Submission</span>
            <span>&bull;</span>
            <span>Zero Credentials Retained</span>
          </div>
        </div>
      </footer>

      {/* ======================================================================
          11. Public Informational Modals (About, Awareness, Contact, Privacy, Terms, Disclaimer)
          ====================================================================== */}
      {activeModal && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Info size={16} color="var(--accent-champagne)" />
                <h3 style={{ textTransform: 'capitalize' }}>
                  {activeModal === 'awareness' && 'Indian Scam Awareness Guide'}
                  {activeModal === 'about' && 'About ScamShield AI'}
                  {activeModal === 'contact' && 'Cyber Defense Contact & Helplines'}
                  {activeModal === 'privacy' && 'Privacy Policy & Zero-Retention Mandate'}
                  {activeModal === 'terms' && 'Terms and Conditions'}
                  {activeModal === 'disclaimer' && 'Security Advisory & Legal Disclaimer'}
                </h3>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setActiveModal(null)}
                aria-label="Close dialog"
              >
                &times;
              </button>
            </div>

            <div className="modal-body" style={{ lineHeight: 1.6, fontSize: '13px' }}>
              {activeModal === 'awareness' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <p>Cyber fraud in India has evolved rapidly with high-pressure social engineering tactics. Learn how to identify the top active attack vectors:</p>
                  <div style={{ padding: '10px 14px', backgroundColor: 'var(--bg-surface-secondary)', borderRadius: 'var(--radius-sm)' }}>
                    <strong style={{ color: 'var(--threat-danger)' }}>1. BESCOM Electricity Cutoff Threat:</strong>
                    <p style={{ marginTop: '4px' }}>SMS claims power will be cut off tonight at 9:30 PM due to unpaid bills. Official utility providers never send cutoff notices via random personal mobile numbers.</p>
                  </div>
                  <div style={{ padding: '10px 14px', backgroundColor: 'var(--bg-surface-secondary)', borderRadius: 'var(--radius-sm)' }}>
                    <strong style={{ color: 'var(--threat-danger)' }}>2. SBI / YONO Account Suspension:</strong>
                    <p style={{ marginTop: '4px' }}>Phishing links like sbi-kyc-verify.xyz mimic the bank to capture netbanking passwords and OTPs. Banks never ask for KYC over unverified web links.</p>
                  </div>
                  <div style={{ padding: '10px 14px', backgroundColor: 'var(--bg-surface-secondary)', borderRadius: 'var(--radius-sm)' }}>
                    <strong style={{ color: 'var(--threat-danger)' }}>3. Part-Time Telegram Task Scams:</strong>
                    <p style={{ marginTop: '4px' }}>Promises ₹5,000–₹8,000 daily for liking YouTube videos or rating movies. Victims are lured into investing in fake cryptocurrency wallets.</p>
                  </div>
                  <div style={{ padding: '10px 14px', backgroundColor: 'var(--bg-surface-secondary)', borderRadius: 'var(--radius-sm)' }}>
                    <strong style={{ color: 'var(--threat-danger)' }}>4. Digital Arrest Extortion:</strong>
                    <p style={{ marginTop: '4px' }}>Imposters claiming to be CBI, Police, or Customs officers demand video calls and asset transfers. Indian law enforcement does not conduct digital arrests.</p>
                  </div>
                </div>
              )}

              {activeModal === 'about' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p><strong>ScamShield AI</strong> is a next-generation cybersecurity platform developed for the <strong>Build Bengaluru 2.0</strong> hackathon. Our mission is to shield citizens, developers, and institutions from the epidemic of financial cyber fraud.</p>
                  <p>Unlike generic tools that only detect malware files, ScamShield addresses the human factor—decoding deceptive psychological urgency, cross-referencing multilingual phrasing in regional dialects, and safely deconstructing predatory URLs before harm occurs.</p>
                  <div style={{ padding: '12px', backgroundColor: 'var(--bg-surface-secondary)', borderRadius: 'var(--radius-sm)' }}>
                    <strong>Key Architecture Pillars:</strong>
                    <ul style={{ paddingLeft: '18px', marginTop: '6px' }}>
                      <li>Multilingual Indian dialect analysis (English, Hindi, Kannada, Hinglish)</li>
                      <li>Advanced URL structure decomposition (subdomains, open redirects, raw IP hosts)</li>
                      <li>Automated Screenshot OCR with transparent manual review fallback</li>
                      <li>Emergency response protocol wired to national 1930 helplines</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeModal === 'contact' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p>For urgent financial fraud incidents or to report cyber threats, utilize these official channels:</p>
                  <div style={{ padding: '12px', border: '1px solid var(--threat-danger-border)', backgroundColor: 'var(--threat-danger-bg)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--threat-danger)', fontWeight: 600 }}>
                      <PhoneCall size={16} />
                      <span>National Cyber Crime Helpline: 1930</span>
                    </div>
                    <p style={{ marginTop: '4px', fontSize: '12px' }}>
                      Operates 24x7 across all Indian states. Call within the Golden Hour to freeze fraudulent transactions.
                    </p>
                  </div>
                  <div style={{ padding: '10px 14px', backgroundColor: 'var(--bg-surface-secondary)', borderRadius: 'var(--radius-sm)' }}>
                    <strong>Online Portals:</strong>
                    <ul style={{ paddingLeft: '18px', marginTop: '6px', fontSize: '12px' }}>
                      <li>National Cyber Crime Reporting Portal: <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer">cybercrime.gov.in</a></li>
                      <li>RBI Sachet Financial Complaint Portal: <a href="https://sachet.rbi.org.in" target="_blank" rel="noopener noreferrer">sachet.rbi.org.in</a></li>
                      <li>Sanchar Saathi Mobile Disconnection: <a href="https://sancharsaathi.gov.in" target="_blank" rel="noopener noreferrer">sancharsaathi.gov.in</a></li>
                    </ul>
                  </div>
                </div>
              )}

              {activeModal === 'privacy' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p><strong>Privacy Commitment:</strong> ScamShield AI operates on a strict zero-retention privacy policy.</p>
                  <ul style={{ paddingLeft: '18px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <li><strong>No Credential Storing:</strong> Scanned text, URLs, and screenshots are processed in memory and never indexed with personally identifiable identity.</li>
                    <li><strong>Local Audit Trail:</strong> Your scan history is stored strictly in your browser\'s local storage (`localStorage`). You have complete authority to clear this data at any time.</li>
                    <li><strong>No Third-Party Tracking:</strong> We do not sell, rent, or distribute analytical telemetry to advertisers or data brokers.</li>
                  </ul>
                </div>
              )}

              {activeModal === 'terms' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p><strong>Terms of Service:</strong></p>
                  <p style={{ fontSize: '12px' }}>
                    1. ScamShield AI provides heuristic risk evaluations designed to assist users in making informed cyber hygiene decisions.
                  </p>
                  <p style={{ fontSize: '12px' }}>
                    2. Risk scores are advisory in nature. Users must independently verify critical communications with the issuing institution before taking financial or legal action.
                  </p>
                  <p style={{ fontSize: '12px' }}>
                    3. Users agree not to utilize this platform to test or validate hostile malware or exploit chains against third-party systems.
                  </p>
                </div>
              )}

              {activeModal === 'disclaimer' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--threat-warning)', fontWeight: 600 }}>
                    <AlertTriangle size={16} />
                    <span>Independent Cyber Intelligence Advisory</span>
                  </div>
                  <p style={{ fontSize: '12px' }}>
                    ScamShield AI is an independent cybersecurity technology initiative. While our platform provides verified safety guidance aligned with the Ministry of Home Affairs (MHA) Indian Cyber Crime Coordination Centre (I4C), ScamShield AI is not a government agency.
                  </p>
                  <p style={{ fontSize: '12px' }}>
                    In the event of an active financial theft, victims must register an official FIR at their local cyber police station or report immediately via <strong>1930</strong> or <strong>https://cybercrime.gov.in/</strong>.
                  </p>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setActiveModal(null)}
                style={{ height: '32px', fontSize: '12px', padding: '0 14px' }}
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
