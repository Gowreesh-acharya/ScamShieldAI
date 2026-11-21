import { useState } from 'react';
import {
  PhoneCall,
  ExternalLink,
  ShieldAlert,
  Lock,
  Smartphone,
  CreditCard,
  KeyRound,
  FileWarning,
  CheckSquare,
  Square,
  AlertTriangle
} from 'lucide-react';

const INCIDENTS = [
  {
    id: 'otp',
    title: 'Shared One-Time Password (OTP)',
    icon: KeyRound,
    desc: 'Disclosed an SMS/WhatsApp OTP code to an unverified caller or entered it on an unknown webpage'
  },
  {
    id: 'upi_pin',
    title: 'Shared UPI PIN or Banking Password',
    icon: CreditCard,
    desc: 'Entered UPI PIN on a payment request, or shared netbanking password/ATM PIN'
  },
  {
    id: 'payment',
    title: 'Sent Money to Fraudster / Made Suspicious Payment',
    icon: FileWarning,
    desc: 'Transferred funds via UPI, QR code, IMPS, or bank transfer under fraudulent pretext'
  },
  {
    id: 'phishing_link',
    title: 'Clicked a Suspicious Phishing Link',
    icon: ExternalLink,
    desc: 'Opened an unverified link from an SMS, email, or WhatsApp message and navigated to a landing page'
  },
  {
    id: 'rogue_app',
    title: 'Installed a Suspicious Application / APK',
    icon: Smartphone,
    desc: 'Installed remote access software (AnyDesk, TeamViewer) or downloaded an unknown APK file'
  },
  {
    id: 'personal_info',
    title: 'Shared Personal Documents (PAN / Aadhaar)',
    icon: Lock,
    desc: 'Provided photos or numbers of government IDs, date of birth, or sensitive KYC records'
  },
  {
    id: 'other',
    title: 'Other Cyber Security Incident',
    icon: AlertTriangle,
    desc: 'Experienced another form of suspicious communication, extortion, or unauthorized activity'
  }
];

const GUIDANCE_DATA = {
  otp: {
    urgentActions: [
      'Immediately contact your bank or payment app to request a temporary debit freeze on your accounts.',
      'Log into your official netbanking portal from a secure device and change your netbanking login password.',
      'Check recent account transactions and statement logs for unauthorized fund debits.',
      'If the OTP was related to SIM swap, contact your telecom provider (Jio, Airtel, Vi) immediately to verify SIM status.'
    ],
    explanation: 'OTPs are the second factor authorizing transactions or password resets. Compromised OTPs can allow immediate unauthorized debits or account takeovers.'
  },
  upi_pin: {
    urgentActions: [
      'Open your UPI app (PhonePe, Google Pay, Paytm) immediately and change your UPI PIN.',
      'Call your bank\'s 24x7 emergency helpline to block your debit card and block UPI services on your account.',
      'Report the fraudulent transaction to 1930 (National Cyber Crime Helpline) within the golden hour to freeze payment gateways.',
      'Never approve incoming "Collect" requests on UPI apps to receive refunds; receiving money never requires entering a UPI PIN.'
    ],
    explanation: 'UPI PINs authorize instant debit of funds. Scammers frequently trick victims into entering PINs under the guise of "receiving payment" or "claiming cashback".'
  },
  payment: {
    urgentActions: [
      'Call 1930 IMMEDIATELY. The Citizen Financial Cyber Fraud Reporting System operates a Golden Hour mechanism to freeze funds in the beneficiary account.',
      'Record the UPI Transaction Reference ID (UTR / 12-digit reference number), sender account, and recipient VPA/account number.',
      'File an official dispute in your banking or UPI app under "Fraudulent Transaction".',
      'Register a formal complaint on the National Cyber Crime Reporting Portal at https://cybercrime.gov.in/.'
    ],
    explanation: 'Time is the most critical factor. Reporting within the first 1–2 hours allows law enforcement to place debit holds on the recipient\'s bank or wallet account.'
  },
  phishing_link: {
    urgentActions: [
      'Close all browser tabs that opened from the link immediately.',
      'Clear your browser cache and cookies to invalidate any active session tracking.',
      'If you submitted any passwords or account IDs, change those passwords immediately on the official website.',
      'Check your downloads folder to ensure no automatic background APK or installer was downloaded.'
    ],
    explanation: 'Phishing websites clone authentic portals to harvest login credentials and session tokens. Merely closing the tab without submitting data significantly limits exposure.'
  },
  rogue_app: {
    urgentActions: [
      'Turn on AIRPLANE MODE immediately or disconnect from Wi-Fi and mobile data to cut off the attacker\'s remote connection.',
      'Do not open any mobile banking or financial applications on the compromised phone.',
      'Boot your phone into Safe Mode and uninstall the rogue application or remote access tool (e.g., AnyDesk, QuickSupport, TeamViewer).',
      'Check "Device Administrators" under Phone Settings and revoke permissions for any unknown apps.',
      'From a separate clean device, change your banking and email passwords.'
    ],
    explanation: 'Malicious apps and remote desktop tools grant attackers full control of your screen and keyboard, allowing them to read OTPs and authorize transactions silently.'
  },
  personal_info: {
    urgentActions: [
      'Lock your Aadhaar biometrics using the official mAadhaar application or UIDAI portal.',
      'Monitor your credit score (CIBIL / Experian) over the next 3 months for unauthorized loan inquiries or credit accounts.',
      'Enable two-factor authentication (2FA) via authenticator app (Google Authenticator) instead of SMS on critical email accounts.',
      'Lodge an information report with the Cyber Crime Cell regarding compromised identity documents.'
    ],
    explanation: 'Compromised identity documents (PAN, Aadhaar) are often used by syndicates for synthetic identity creation, mule bank account openings, and unauthorized credit applications.'
  },
  other: {
    urgentActions: [
      'Discontinue all communication with the suspicious party immediately; do not argue or negotiate.',
      'Dial the National Cyber Crime Helpline at 1930 for incident-specific legal and technical guidance.',
      'Capture and safely archive screenshots, phone numbers, email headers, and payment receipts.',
      'File a formal report on https://cybercrime.gov.in/.'
    ],
    explanation: 'Documenting evidence and ceasing communication prevents escalation while official cyber cells investigate.'
  }
};

export default function EmergencyMode() {
  const [selectedIncident, setSelectedIncident] = useState('otp');
  const [checklist, setChecklist] = useState({
    screenshots: false,
    transactionId: false,
    phoneNumbers: false,
    urlsSaved: false,
    bankContacted: false,
    cybercrimeComplaint: false
  });

  const guidance = GUIDANCE_DATA[selectedIncident] || GUIDANCE_DATA.otp;

  const toggleChecklist = (key) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const completedCount = Object.values(checklist).filter(Boolean).length;
  const totalTasks = Object.keys(checklist).length;
  const progressPct = Math.round((completedCount / totalTasks) * 100);

  return (
    <div className="page-content">
      {/* Critical Legal & Safety Notice */}
      <div className="alert-banner warning">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={18} color="var(--threat-danger)" />
          <div>
            <strong style={{ color: '#ffffff' }}>Emergency Guidance Only:</strong> ScamShield AI is an advisory platform, not an emergency response authority. Never enter passwords, PINs, or card numbers into this portal. If financial loss has occurred, call <strong>1930</strong> immediately.
          </div>
        </div>
      </div>

      {/* Step 1: Select Incident Type */}
      <section>
        <div style={{ marginBottom: '12px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff' }}>
            Step 1: Select Your Security Incident
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Choose the category that matches what happened to generate customized mitigation steps
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
          {INCIDENTS.map((inc) => {
            const Icon = inc.icon;
            const isSelected = selectedIncident === inc.id;
            return (
              <div
                key={inc.id}
                onClick={() => setSelectedIncident(inc.id)}
                style={{
                  backgroundColor: isSelected ? 'var(--bg-surface-3)' : 'var(--bg-surface-card)',
                  border: isSelected ? '2px solid var(--accent-blue)' : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  gap: '12px',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', backgroundColor: isSelected ? 'var(--accent-subtle)' : 'var(--bg-surface-input)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isSelected ? 'var(--accent-sky)' : 'var(--text-muted)', flexShrink: 0 }}>
                  <Icon size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
                    {inc.title}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: '1.35' }}>
                    {inc.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Step 2: Immediate Guidance & Step 3: Evidence Checklist (2-Column) */}
      <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Immediate Guidance */}
        <div className="scanner-panel">
          <div className="scanner-panel-header">
            <h3>
              <ShieldAlert size={16} color="var(--threat-danger)" />
              Step 2: Immediate Mitigation Actions
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Priority Protocol
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {guidance.urgentActions.map((action, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: 'var(--bg-surface-input)',
                  borderLeft: '3px solid var(--threat-danger)',
                  border: '1px solid var(--border-subtle)',
                  borderLeftWidth: '3px',
                  borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                  padding: '12px 14px',
                  display: 'flex',
                  gap: '10px'
                }}
              >
                <span style={{ fontWeight: 700, color: 'var(--threat-danger)', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
                  {idx + 1}.
                </span>
                <span style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.45' }}>
                  {action}
                </span>
              </div>
            ))}
          </div>

          <div style={{ backgroundColor: 'var(--bg-surface-input)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--accent-sky)' }}>Technical Analysis:</strong> {guidance.explanation}
          </div>
        </div>

        {/* Evidence & Action Checklist */}
        <div className="scanner-panel">
          <div className="scanner-panel-header">
            <h3>
              <CheckSquare size={16} color="var(--accent-sky)" />
              Step 3: Evidence Checklist
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {completedCount} of {totalTasks} Completed
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ width: '100%', height: '5px', backgroundColor: 'var(--bg-surface-input)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${progressPct}%`, height: '100%', backgroundColor: progressPct === 100 ? 'var(--threat-safe)' : 'var(--accent-blue)', transition: 'width 0.3s ease' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { key: 'screenshots', label: 'Screenshots of messages & payment screens saved' },
              { key: 'transactionId', label: 'Transaction UTR / Reference IDs documented' },
              { key: 'phoneNumbers', label: 'Suspicious caller phone numbers / handles recorded' },
              { key: 'urlsSaved', label: 'Fraudulent URLs & domain links copied' },
              { key: 'bankContacted', label: 'Bank / payment app contacted to freeze account' },
              { key: 'cybercrimeComplaint', label: 'Formal report lodged at 1930 / cybercrime.gov.in' }
            ].map((item) => {
              const isChecked = checklist[item.key];
              return (
                <div
                  key={item.key}
                  onClick={() => toggleChecklist(item.key)}
                  style={{
                    backgroundColor: isChecked ? 'var(--threat-safe-bg)' : 'var(--bg-surface-input)',
                    border: isChecked ? '1px solid var(--threat-safe-border)' : '1px solid var(--border-subtle)',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  {isChecked ? (
                    <CheckSquare size={16} color="var(--threat-safe)" />
                  ) : (
                    <Square size={16} color="var(--text-muted)" />
                  )}
                  <span style={{ fontSize: '12px', color: isChecked ? 'var(--text-primary)' : 'var(--text-secondary)', textDecoration: isChecked ? 'line-through' : 'none' }}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Step 4: Official Emergency Links & Helplines */}
      <section>
        <div style={{ marginBottom: '12px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff' }}>
            Step 4: Official Indian Cyber Crime Helplines & Portals
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Authoritative contact channels operated by the Ministry of Home Affairs and Reserve Bank of India
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          {/* 1930 Helpline */}
          <div style={{ backgroundColor: 'var(--bg-surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--threat-danger)', fontWeight: 700, fontSize: '13px' }}>
                <PhoneCall size={16} />
                <span>National Cyber Helpline (Toll-Free)</span>
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)', margin: '6px 0 2px' }}>
                1930
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Citizen Financial Cyber Fraud Reporting System. Call immediately to freeze funds before withdrawal.
              </p>
            </div>
            <a
              href="tel:1930"
              className="btn-primary"
              style={{ height: '34px', fontSize: '12px', textDecoration: 'none', backgroundColor: 'var(--threat-danger)' }}
            >
              <PhoneCall size={14} />
              <span>Call 1930 Now</span>
            </a>
          </div>

          {/* National Cybercrime Portal */}
          <div style={{ backgroundColor: 'var(--bg-surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-sky)', fontWeight: 700, fontSize: '13px' }}>
                <ExternalLink size={16} />
                <span>National Cyber Crime Portal</span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', fontFamily: 'var(--font-mono)', margin: '8px 0 4px' }}>
                cybercrime.gov.in
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Official portal under Ministry of Home Affairs to lodge cyber financial fraud & cyber crime complaints.
              </p>
            </div>
            <a
              href="https://cybercrime.gov.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
              style={{ height: '34px', fontSize: '12px', textDecoration: 'none', justifyContent: 'center' }}
            >
              <ExternalLink size={14} />
              <span>Open cybercrime.gov.in</span>
            </a>
          </div>

          {/* RBI Sachet */}
          <div style={{ backgroundColor: 'var(--bg-surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--threat-warning)', fontWeight: 700, fontSize: '13px' }}>
                <ExternalLink size={16} />
                <span>RBI Sachet Portal</span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', fontFamily: 'var(--font-mono)', margin: '8px 0 4px' }}>
                sachet.rbi.org.in
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Reserve Bank of India portal to report illegal deposit collection, unauthorized loan apps, and fraudulent banking.
              </p>
            </div>
            <a
              href="https://sachet.rbi.org.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
              style={{ height: '34px', fontSize: '12px', textDecoration: 'none', justifyContent: 'center' }}
            >
              <ExternalLink size={14} />
              <span>Open RBI Sachet</span>
            </a>
          </div>

          {/* Sanchar Saathi / Chakshu */}
          <div style={{ backgroundColor: 'var(--bg-surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--threat-safe)', fontWeight: 700, fontSize: '13px' }}>
                <ExternalLink size={16} />
                <span>Chakshu / Sanchar Saathi</span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', fontFamily: 'var(--font-mono)', margin: '8px 0 4px' }}>
                sancharsaathi.gov.in
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Department of Telecommunications facility to report suspected fraud communications via SMS, call, or WhatsApp.
              </p>
            </div>
            <a
              href="https://sancharsaathi.gov.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
              style={{ height: '34px', fontSize: '12px', textDecoration: 'none', justifyContent: 'center' }}
            >
              <ExternalLink size={14} />
              <span>Open Sanchar Saathi</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
