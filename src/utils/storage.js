// Storage utility for ScamShield AI scan history & user preferences (localStorage)

const STORAGE_KEY = 'scamshield_scan_history_v1';
const THEME_KEY = 'scamshield_theme_preference';
const FEEDBACK_KEY = 'scamshield_user_feedback_v1';

// Initial seed data so the dashboard is vibrant and informative out-of-the-box
const SEED_SCANS = [
  {
    id: 'scan-1700000001',
    type: 'message',
    target: 'Dear Customer, your SBI YONO account will be blocked today. Please update your PAN immediately by clicking http://sbi-kyc-verify.update-portal.xyz/login to avoid suspension.',
    riskScore: 92,
    classification: 'DANGEROUS',
    summary: 'SBI KYC account suspension phishing attempt with suspicious domain',
    indicators: {
      suspiciousPhrases: ['account will be blocked today', 'update your pan immediately', 'avoid suspension'],
      urgencyIndicators: ['immediate action demanded', 'threat of account closure today'],
      impersonation: ['State Bank of India (SBI) / YONO impersonation detected'],
      urlCharacteristics: ['Insecure HTTP protocol', 'Suspicious .xyz TLD', 'Subdomain brand typosquatting (sbi-kyc-verify)']
    },
    explanation: 'The message creates artificial panic by threatening immediate bank account blockage and requests sensitive credentials via an unverified third-party domain.',
    recommendation: 'Do NOT open the link or enter PAN details. SBI never asks for KYC updates via SMS with third-party links. Report immediately to cybercrime.gov.in or call 1930.',
    source: 'DEMO_ENGINE',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString() // 18 mins ago
  },
  {
    id: 'scan-1700000002',
    type: 'url',
    target: 'http://192.168.1.104/bescom-bill-payment-gateway/recharge.php',
    riskScore: 88,
    classification: 'DANGEROUS',
    summary: 'Raw IP address hosting fake BESCOM utility bill payment portal',
    indicators: {
      suspiciousPhrases: [],
      urgencyIndicators: [],
      impersonation: ['BESCOM (Bangalore Electricity Supply Company) impersonation in URL path'],
      urlCharacteristics: ['Direct IP address used instead of valid registered domain', 'Missing SSL/TLS encryption (plaintext HTTP)', 'Deceptive keyword stuffing in path']
    },
    explanation: 'Legitimate utility boards like BESCOM never serve payment gateways on raw unencrypted IP addresses. This is a credential and banking card harvester.',
    recommendation: 'Block this IP immediately. Never enter debit/credit card or UPI PINs on raw IP addresses. Use official BESCOM portal or verified app.',
    source: 'DEMO_ENGINE',
    timestamp: new Date(Date.now() - 1000 * 60 * 52).toISOString() // 52 mins ago
  },
  {
    id: 'scan-1700000003',
    type: 'message',
    target: 'Congratulations! You have been selected for part-time remote movie rating job. Earn Rs. 4,500 to Rs. 8,000 daily from home. Contact HR on WhatsApp +91-9876543210 to claim bonus.',
    riskScore: 78,
    classification: 'DANGEROUS',
    summary: 'Part-time remote job task scam with unrealistic daily earnings',
    indicators: {
      suspiciousPhrases: ['congratulations', 'part-time remote movie rating job', 'earn rs. 4,500 to rs. 8,000 daily', 'claim bonus'],
      urgencyIndicators: ['incentivized instant contact to claim bonus'],
      impersonation: ['Generic HR recruitment impersonation'],
      urlCharacteristics: []
    },
    explanation: 'Classic advance-fee task fraud promising exorbitant daily pay for simple rating tasks, typically leading to investment demands in fraudulent Telegram crypto wallets.',
    recommendation: 'Do not message the phone number. Block and report the sender on WhatsApp. Never pay any security deposit or processing fee for job offers.',
    source: 'DEMO_ENGINE',
    timestamp: new Date(Date.now() - 1000 * 60 * 140).toISOString() // 2.3 hours ago
  },
  {
    id: 'scan-1700000004',
    type: 'combined',
    target: 'URGENT BESCOM ALERT: Your electricity connection will be disconnected tonight at 09:30 PM due to previous month bill update failure. Call bill officer immediately at 8912345678 or pay here: http://bescom-bill-desk.online/pay',
    riskScore: 96,
    classification: 'DANGEROUS',
    summary: 'High-urgency electricity disconnection scam with deceptive domain',
    indicators: {
      suspiciousPhrases: ['electricity connection will be disconnected', 'tonight at 09:30 pm', 'bill update failure', 'call bill officer immediately'],
      urgencyIndicators: ['Specific deadline (tonight at 09:30 PM)', 'Immediate disconnection threat'],
      impersonation: ['BESCOM government utility provider impersonation'],
      urlCharacteristics: ['Insecure HTTP', 'Unverified non-governmental .online TLD', 'Domain mismatch with official bescom.karnataka.gov.in']
    },
    explanation: 'Widespread utility fraud targeting Bengaluru residents. Fraudsters impersonate BESCOM officers and intimidate victims with imminent power cutoff to extract UPI payments.',
    recommendation: 'Do not call the mobile number or visit the link. BESCOM issues official notices on electricity bills and never dispatches individual disconnection threats via random mobile numbers.',
    source: 'DEMO_ENGINE',
    timestamp: new Date(Date.now() - 1000 * 60 * 320).toISOString() // 5.3 hours ago
  },
  {
    id: 'scan-1700000005',
    type: 'url',
    target: 'https://onlinesbi.sbi/sbijava/osbi_online_security.html',
    riskScore: 4,
    classification: 'SAFE',
    summary: 'Verified official State Bank of India security advisory page',
    indicators: {
      suspiciousPhrases: [],
      urgencyIndicators: [],
      impersonation: [],
      urlCharacteristics: ['Valid official bank TLD (.sbi)', 'Valid HTTPS TLS certificate', 'Authentic host identity']
    },
    explanation: 'The URL matches the officially verified proprietary Top-Level Domain (.sbi) owned and operated by the State Bank of India.',
    recommendation: 'Safe to browse. Ensure the browser padlock remains active and the domain suffix ends in .sbi.',
    source: 'DEMO_ENGINE',
    timestamp: new Date(Date.now() - 1000 * 60 * 480).toISOString() // 8 hours ago
  },
  {
    id: 'scan-1700000006',
    type: 'message',
    target: 'Your Swiggy delivery partner has arrived at your location with order #SW-98214. Please collect your order. Enjoy your meal!',
    riskScore: 2,
    classification: 'SAFE',
    summary: 'Standard legitimate delivery notification without sensitive requests',
    indicators: {
      suspiciousPhrases: [],
      urgencyIndicators: [],
      impersonation: [],
      urlCharacteristics: []
    },
    explanation: 'Routine transactional delivery notification. Contains no financial demands, OTP requests, or external links.',
    recommendation: 'No threat detected. Standard safe communication.',
    source: 'DEMO_ENGINE',
    timestamp: new Date(Date.now() - 1000 * 60 * 720).toISOString() // 12 hours ago
  },
  {
    id: 'scan-1700000007',
    type: 'message',
    target: 'Dear user, your Netflix subscription renewal failed. Update your payment method within 48 hours to prevent account cancellation.',
    riskScore: 54,
    classification: 'SUSPICIOUS',
    summary: 'Potential subscription billing phishing notice requiring independent verification',
    indicators: {
      suspiciousPhrases: ['subscription renewal failed', 'prevent account cancellation'],
      urgencyIndicators: ['48 hour deadline specified'],
      impersonation: ['Netflix brand reference'],
      urlCharacteristics: []
    },
    explanation: 'Contains urgency language regarding subscription cancellation. While renewal notices can be legitimate, fraudsters frequently mimic subscription failures.',
    recommendation: 'Do not follow links in such messages. Log directly into your Netflix account via the official app or netflix.com to verify billing status.',
    source: 'DEMO_ENGINE',
    timestamp: new Date(Date.now() - 1000 * 60 * 1100).toISOString() // 18 hours ago
  }
];

export function getScanHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_SCANS));
      return SEED_SCANS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_SCANS;
  } catch (err) {
    console.error('Failed to read scan history from localStorage:', err);
    return SEED_SCANS;
  }
}

export function getLatestScan() {
  const history = getScanHistory();
  return history.length > 0 ? history[0] : null;
}

export function saveScan(scanData) {
  try {
    const history = getScanHistory();
    const newScan = {
      id: scanData.id || `scan-${Date.now()}`,
      timestamp: scanData.timestamp || new Date().toISOString(),
      ...scanData
    };
    const updated = [newScan, ...history].slice(0, 100);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newScan;
  } catch (err) {
    console.error('Failed to save scan to localStorage:', err);
    return scanData;
  }
}

export async function saveCompletedScan(pendingScan) {
  return saveScan(await pendingScan);
}

export function getScanClassification(scan) {
  const { classification, riskScore, source, verdict, fallbackNotice } = scan ?? {};
  // The previous adapter could save a live default of SAFE/0 without a backend verdict.
  const legacyDefault = source === 'FASTAPI_LIVE_MODEL' && !verdict && classification === 'SAFE' && riskScore === 0;
  if (legacyDefault || fallbackNotice || !Number.isInteger(riskScore) || riskScore < 0 || riskScore > 100) {
    return null;
  }
  return ['SAFE', 'SUSPICIOUS', 'DANGEROUS'].includes(classification) ? classification : null;
}

export function clearScanHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  } catch (err) {
    console.error('Failed to clear scan history:', err);
    return [];
  }
}

export function getScanStats() {
  const history = getScanHistory();
  let threats = 0;
  let safe = 0;
  let suspicious = 0;

  history.forEach(scan => {
    const classification = getScanClassification(scan);
    if (classification === 'DANGEROUS') threats++;
    else if (classification === 'SAFE') safe++;
    else if (classification === 'SUSPICIOUS') suspicious++;
  });
  const total = threats + safe + suspicious;

  return {
    totalScans: total,
    threatsDetected: threats,
    safeScans: safe,
    suspiciousScans: suspicious,
    threatPercentage: total > 0 ? Math.round((threats / total) * 100) : 0,
    safePercentage: total > 0 ? Math.round((safe / total) * 100) : 0
  };
}

// User theme preferences ('system' | 'dark' | 'light')
export function getStoredTheme() {
  try {
    return localStorage.getItem(THEME_KEY) || 'system';
  } catch {
    return 'system';
  }
}

export function setStoredTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (err) {
    console.error('Failed to save theme preference:', err);
  }
}

// User feedback storage
export function saveLocalFeedback(feedback) {
  try {
    const raw = localStorage.getItem(FEEDBACK_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    const item = {
      id: `feedback-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...feedback
    };
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify([item, ...existing]));
    return item;
  } catch (err) {
    console.error('Failed to save local feedback:', err);
    return feedback;
  }
}
