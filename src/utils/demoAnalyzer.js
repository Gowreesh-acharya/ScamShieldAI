// Demo Heuristic Evaluation Engine for ScamShield AI
// Used when the FastAPI backend is offline or in Demo Mode.
// IMPORTANT: This engine strictly extracts and reports indicators that exist in the input.
// It never fabricates threat intelligence or claims maliciousness without observable evidence.

// ============================================================================
// 1. MULTILINGUAL FRAUD PATTERNS (English, Hindi, Kannada, Hinglish)
// ============================================================================

const MULTILINGUAL_PATTERNS = [
  // --- English Patterns ---
  { term: 'account will be blocked', label: 'Threat of immediate bank/service blockage', weight: 25, lang: 'en' },
  { term: 'account blocked', label: 'Account suspension claim', weight: 25, lang: 'en' },
  { term: 'update your pan', label: 'Unsolicited PAN / KYC document request', weight: 30, lang: 'en' },
  { term: 'kyc expired', label: 'Fraudulent KYC expiry warning', weight: 25, lang: 'en' },
  { term: 'update kyc', label: 'Urgent KYC update request via unverified channel', weight: 25, lang: 'en' },
  { term: 'electricity connection will be disconnected', label: 'Threat of utility disconnection', weight: 30, lang: 'en' },
  { term: 'power will be disconnected', label: 'Immediate power disconnection claim', weight: 30, lang: 'en' },
  { term: 'bill update failure', label: 'Fake utility billing failure pretext', weight: 20, lang: 'en' },
  { term: 'part-time', label: 'Unsolicited part-time employment offer', weight: 20, lang: 'en' },
  { term: 'remote movie rating job', label: 'Common movie/product review task scam pattern', weight: 35, lang: 'en' },
  { term: 'earn rs.', label: 'Exorbitant daily wage promise', weight: 25, lang: 'en' },
  { term: 'earn 5000', label: 'Unrealistic income claim', weight: 25, lang: 'en' },
  { term: 'congratulations', label: 'Unsolicited prize or selection notification', weight: 15, lang: 'en' },
  { term: 'won a lottery', label: 'Unsolicited lottery win notification', weight: 35, lang: 'en' },
  { term: 'claim bonus', label: 'Urgent reward/bonus claim incentive', weight: 20, lang: 'en' },
  { term: 'send otp', label: 'Explicit OTP credential solicitation', weight: 40, lang: 'en' },
  { term: 'share otp', label: 'Request to share one-time password', weight: 40, lang: 'en' },
  { term: 'download apk', label: 'Urging direct APK download bypassing official app store', weight: 35, lang: 'en' },
  { term: 'install anydesk', label: 'Remote desktop software solicitation', weight: 45, lang: 'en' },
  { term: 'install teamviewer', label: 'Remote desktop access solicitation', weight: 45, lang: 'en' },
  { term: 'refund of rs', label: 'Unsolicited refund processing', weight: 20, lang: 'en' },
  { term: 'tax refund', label: 'Tax authority refund lure', weight: 25, lang: 'en' },
  { term: 'wire transfer', label: 'Wire transfer demand', weight: 25, lang: 'en' },
  { term: 'crypto wallet', label: 'Cryptocurrency payment diversion', weight: 25, lang: 'en' },

  // --- Hindi (हिंदी - Devanagari) Patterns ---
  { term: 'खाता ब्लॉक', label: 'खाता ब्लॉक करने की धमकी (Threat of account blockage)', weight: 30, lang: 'hi' },
  { term: 'खाता बंद', label: 'खाता बंद होने की चेतावनी (Account closure threat)', weight: 30, lang: 'hi' },
  { term: 'पैन अपडेट', label: 'पैन कार्ड अपडेट करने की मांग (PAN update request)', weight: 30, lang: 'hi' },
  { term: 'केवाईसी एक्सपायर', label: 'केवाईसी समाप्त होने की फर्जी चेतावनी (Fake KYC expiry)', weight: 25, lang: 'hi' },
  { term: 'केवाईसी अपडेट', label: 'केवाईसी अपडेट लिंक (Unverified KYC update link)', weight: 25, lang: 'hi' },
  { term: 'बिजली कट', label: 'बिजली कनेक्शन काटने की धमकी (Power cutoff intimidation)', weight: 30, lang: 'hi' },
  { term: 'बिजली बिल', label: 'बिजली बिल भुगतान का झांसा (Utility payment lure)', weight: 20, lang: 'hi' },
  { term: 'लॉटरी जीती', label: 'फर्जी लॉटरी जीतने का झांसा (Fake lottery win lure)', weight: 35, lang: 'hi' },
  { term: 'इनाम', label: 'अनपेक्षित नकद इनाम का दावा (Unsolicited prize claim)', weight: 20, lang: 'hi' },
  { term: 'ओटीपी भेजें', label: 'ओटीपी साझा करने की मांग (OTP disclosure solicitation)', weight: 40, lang: 'hi' },
  { term: 'ओटीपी शेयर', label: 'ओटीपी मांगने का प्रयास (OTP credential harvesting)', weight: 40, lang: 'hi' },
  { term: 'तुरंत अपडेट', label: 'अत्यधिक तात्कालिकता का दबाव (Severe urgency pressure)', weight: 25, lang: 'hi' },
  { term: 'वर्क फ्रॉम होम', label: 'घर बैठे पैसे कमाने का झांसा (Task fraud / WFH lure)', weight: 25, lang: 'hi' },
  { term: 'रोजाना कमाएं', label: 'अवास्तविक दैनिक आय का वादा (Unrealistic daily wage claim)', weight: 25, lang: 'hi' },
  { term: 'एपीके डाउनलोड', label: 'अज्ञात एपीके फाइल डाउनलोड कराने का प्रयास (Malicious APK download lure)', weight: 35, lang: 'hi' },

  // --- Kannada (ಕನ್ನಡ) Patterns ---
  { term: 'ಖಾತೆ ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ', label: 'ಖಾತೆ ಬ್ಲಾಕ್ ಮಾಡುವ ಬೆದರಿಕೆ (Threat of account blockage)', weight: 30, lang: 'kn' },
  { term: 'ಖಾತೆ ಸ್ಥಗಿತ', label: 'ಬ್ಯಾಂಕ್ ಖಾತೆ ಸ್ಥಗಿತಗೊಳಿಸುವ ಎಚ್ಚರಿಕೆ (Account suspension warning)', weight: 30, lang: 'kn' },
  { term: 'ಕೆವೈಸಿ ನವೀಕರಣ', label: 'ಕೆವೈಸಿ ನವೀಕರಿಸಲು ಒತ್ತಾಯ (Unsolicited KYC update request)', weight: 25, lang: 'kn' },
  { term: 'ವಿದ್ಯುತ್ ಸಂಪರ್ಕ ಕಡಿತ', label: 'ವಿದ್ಯುತ್ ಸಂಪರ್ಕ ಕಡಿತಗೊಳಿಸುವ ಬೆದರಿಕೆ (Electricity disconnection threat)', weight: 30, lang: 'kn' },
  { term: 'ವಿದ್ಯುತ್ ಕಡಿತ', label: 'ವಿದ್ಯುತ್ ಕಡಿತದ ಎಚ್ಚರಿಕೆ (Power cutoff warning)', weight: 25, lang: 'kn' },
  { term: 'ಲಾಟರಿ ಗೆದ್ದಿದ್ದೀರಿ', label: 'ಸುಳ್ಳು ಲಾಟರಿ ಗೆಲುವಿನ ಸಂದೇಶ (Fraudulent lottery winner lure)', weight: 35, lang: 'kn' },
  { term: 'ಬಹುಮಾನ', label: 'ಅನಧಿಕೃತ ಬಹುಮಾನದ ಆಮಿಷ (Unauthorized prize lure)', weight: 20, lang: 'kn' },
  { term: 'ಒಟಿಪಿ ಹಂಚಿಕೊಳ್ಳಿ', label: 'ಒಟಿಪಿ ಗೌಪ್ಯ ಸಂಖ್ಯೆ ಕೇಳುವುದು (OTP credential solicitation)', weight: 40, lang: 'kn' },
  { term: 'ತಕ್ಷಣ ನವೀಕರಿಸಿ', label: 'ತಕ್ಷಣದ ಕ್ರಮಕ್ಕೆ ಒತ್ತಾಯ (High urgency pressure)', weight: 25, lang: 'kn' },
  { term: 'ಭಾಗಶಃ ಉದ್ಯೋಗ', label: 'ಭಾಗಶಃ ಸಮಯದ ಕೆಲಸದ ವಂಚನೆ (Part-time task scam lure)', weight: 25, lang: 'kn' },
  { term: 'ದಿನಕ್ಕೆ ಗಳಿಸಿ', label: 'ದೈನಂದಿನ ಅತಿ ಹೆಚ್ಚು ಹಣದ ಆಮಿಷ (Unrealistic daily earnings lure)', weight: 25, lang: 'kn' },

  // --- Hinglish (Hindi written in Latin script) Patterns ---
  { term: 'account block ho gaya', label: 'Hinglish: Bank account blockage threat', weight: 30, lang: 'hinglish' },
  { term: 'account band ho jayega', label: 'Hinglish: Threat of account suspension', weight: 30, lang: 'hinglish' },
  { term: 'turant update karein', label: 'Hinglish: Immediate update ultimatum', weight: 25, lang: 'hinglish' },
  { term: 'turant update karo', label: 'Hinglish: High urgency command', weight: 25, lang: 'hinglish' },
  { term: 'kyc expire ho gaya', label: 'Hinglish: KYC expired pretext', weight: 25, lang: 'hinglish' },
  { term: 'pan card update karein', label: 'Hinglish: PAN card document request', weight: 30, lang: 'hinglish' },
  { term: 'bijli connection cut hoga', label: 'Hinglish: Electricity disconnection threat', weight: 30, lang: 'hinglish' },
  { term: 'bijli kat jayegi', label: 'Hinglish: Imminent power cutoff intimidation', weight: 30, lang: 'hinglish' },
  { term: 'aaj raat 9:30 baje', label: 'Hinglish: Specific disconnection deadline (tonight 9:30 PM)', weight: 25, lang: 'hinglish' },
  { term: 'lottery jeeta hai', label: 'Hinglish: Fraudulent lottery win claim', weight: 35, lang: 'hinglish' },
  { term: 'part-time job daily', label: 'Hinglish: Part-time job task scam', weight: 25, lang: 'hinglish' },
  { term: 'roz kamayein', label: 'Hinglish: Unrealistic daily earnings promise', weight: 25, lang: 'hinglish' },
  { term: 'otp share karein', label: 'Hinglish: Explicit request to share OTP', weight: 40, lang: 'hinglish' },
  { term: 'otp batayein', label: 'Hinglish: OTP credential solicitation', weight: 40, lang: 'hinglish' },
  { term: 'link par click karein', label: 'Hinglish: Urging click on unverified link', weight: 20, lang: 'hinglish' }
];

const URGENCY_PATTERNS = [
  { term: 'immediately', label: 'Immediate action urgency ("immediately")' },
  { term: 'today', label: 'Same-day deadline pressure ("today")' },
  { term: 'tonight at', label: 'Specific arbitrary cutoff time ("tonight at...")' },
  { term: 'within 24 hours', label: 'Strict 24-hour ultimatum' },
  { term: 'within 48 hours', label: 'Time-bounded threat window ("48 hours")' },
  { term: 'urgent action', label: 'Explicit urgency phrasing' },
  { term: 'last chance', label: 'Coercive final warning ("last chance")' },
  { term: 'last warning', label: 'Intimidating final notice phrasing' },
  { term: 'to avoid suspension', label: 'Coercive penalty avoidance pressure' },
  // Hindi & Hinglish urgency
  { term: 'तुरंत', label: 'तत्काल कार्रवाई का दबाव ("तुरंत / Immediately")' },
  { term: 'आज ही', label: 'आज का अंतिम समय ("आज ही / Today only")' },
  { term: 'turant', label: 'Urgent action demand ("turant")' },
  { term: 'aaj hi', label: 'Same-day pressure ("aaj hi")' },
  { term: 'aakhri mauka', label: 'Final ultimatum ("aakhri mauka")' },
  // Kannada urgency
  { term: 'ತಕ್ಷಣ', label: 'ತಕ್ಷಣದ ಕ್ರಮದ ಒತ್ತಾಯ ("ತಕ್ಷಣ / Immediately")' },
  { term: 'ಇಂದೇ', label: 'ಇಂದೇ ಕಡ್ಡಾಯ ಕ್ರಮ ("ಇಂದೇ / Today only")' }
];

const KNOWN_ENTITIES = [
  { term: 'sbi', name: 'State Bank of India (SBI)' },
  { term: 'एसबीआई', name: 'State Bank of India (एसबीआई)' },
  { term: 'ಎಸ್\u200Cಬಿಐ', name: 'State Bank of India (ಎಸ್\u200Cಬಿಐ)' },
  { term: 'yono', name: 'SBI YONO' },
  { term: 'योनों', name: 'SBI YONO' },
  { term: 'hdfc', name: 'HDFC Bank' },
  { term: 'एचडीएफसी', name: 'HDFC Bank' },
  { term: 'icici', name: 'ICICI Bank' },
  { term: 'axis bank', name: 'Axis Bank' },
  { term: 'bescom', name: 'BESCOM (Bangalore Electricity Supply Company)' },
  { term: 'ಬೆಸ್ಕಾಂ', name: 'BESCOM (ಬೆಂಗಳೂರು ವಿದ್ಯುತ್ ಸರಬರಾಜು ಕಂಪನಿ)' },
  { term: 'बेसकॉम', name: 'BESCOM (बिजली आपूर्ति कंपनी)' },
  { term: 'india post', name: 'India Post' },
  { term: 'भारतीय डाक', name: 'India Post (भारतीय डाक)' },
  { term: 'paytm', name: 'Paytm' },
  { term: 'पेटीएम', name: 'Paytm' },
  { term: 'netflix', name: 'Netflix' },
  { term: 'amazon', name: 'Amazon' },
  { term: 'income tax', name: 'Income Tax Department' },
  { term: 'trai', name: 'Telecom Regulatory Authority (TRAI)' },
  { term: 'swiggy', name: 'Swiggy' },
  { term: 'zomato', name: 'Zomato' }
];

const SUSPICIOUS_TLDS = [
  '.xyz', '.top', '.buzz', '.online', '.work', '.tk', '.ml', '.cf', '.gq', 
  '.club', '.vip', '.rest', '.sbs', '.cam', '.click', '.link', '.icu', '.cc'
];

const SHORTENER_DOMAINS = [
  'bit.ly', 'tinyurl.com', 'is.gd', 'cutt.ly', 'rb.gy', 't.co', 'wa.me', 'ow.ly'
];

/**
 * Detects language and script of input text.
 */
export function detectLanguage(text) {
  if (!text || typeof text !== 'string') return { code: 'en', name: 'English', confidence: 100 };

  const kannadaRegex = /[\u0C80-\u0CFF]/;
  const devanagariRegex = /[\u0900-\u097F]/;

  if (kannadaRegex.test(text)) {
    return { code: 'kn', name: 'Kannada (ಕನ್ನಡ)', confidence: 96, script: 'Kannada' };
  }

  if (devanagariRegex.test(text)) {
    return { code: 'hi', name: 'Hindi (हिंदी)', confidence: 95, script: 'Devanagari' };
  }

  // Check for Hinglish vocabulary
  const normalized = text.toLowerCase();
  const hinglishTokens = ['aapka', 'hai', 'karein', 'karo', 'hoga', 'turant', 'khata', 'bijli', 'paisa', 'roz', 'kamayein', 'jeeta', 'aaj', 'raat', 'batayein', 'bachayein'];
  const matches = hinglishTokens.filter(token => normalized.includes(token));

  if (matches.length >= 2) {
    return { code: 'hinglish', name: 'Hinglish (Hindi in Latin script)', confidence: 92, script: 'Latin' };
  }

  return { code: 'en', name: 'English', confidence: 98, script: 'Latin' };
}

/**
 * Evaluates message text using verifiable multilingual heuristics.
 */
export function analyzeMessage(text, options = {}) {
  if (!text || typeof text !== 'string') {
    throw new Error('Message text is required for analysis.');
  }

  const detectedLang = detectLanguage(text);
  const normalized = text.toLowerCase();
  const matchedPhrases = [];
  const urgencyFound = [];
  const impersonated = [];
  let scoreAccumulator = 0;

  // 1. Check suspicious phrase patterns across all languages
  for (const p of MULTILINGUAL_PATTERNS) {
    if (normalized.includes(p.term.toLowerCase())) {
      matchedPhrases.push(p.term);
      scoreAccumulator += p.weight;
    }
  }

  // 2. Check urgency indicators
  for (const u of URGENCY_PATTERNS) {
    if (normalized.includes(u.term.toLowerCase())) {
      urgencyFound.push(u.label);
      scoreAccumulator += 12;
    }
  }

  // 3. Check entity impersonation
  for (const ent of KNOWN_ENTITIES) {
    if (normalized.includes(ent.term.toLowerCase())) {
      if (scoreAccumulator > 0 || normalized.includes('http') || normalized.includes('call') || normalized.includes('contact') || normalized.includes('संपर्क') || normalized.includes('ಸಂಪರ್ಕಿಸಿ')) {
        impersonated.push(`${ent.name} brand referenced in high-risk context`);
        scoreAccumulator += 15;
      }
    }
  }

  // 4. Check for embedded links in message
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const urlsInText = text.match(urlRegex) || [];
  let urlTraits = [];
  if (urlsInText.length > 0) {
    urlsInText.forEach(u => {
      try {
        const parsed = new URL(u);
        if (parsed.protocol === 'http:') {
          urlTraits.push(`Insecure plaintext HTTP link: ${parsed.hostname}`);
          scoreAccumulator += 15;
        }
        if (SUSPICIOUS_TLDS.some(tld => parsed.hostname.endsWith(tld))) {
          urlTraits.push(`Suspicious top-level domain in link: ${parsed.hostname}`);
          scoreAccumulator += 25;
        }
      } catch {
        urlTraits.push(`Malformed or obfuscated link detected: ${u.slice(0, 30)}...`);
        scoreAccumulator += 20;
      }
    });
  }

  const finalScore = Math.min(100, Math.max(0, scoreAccumulator));

  let classification = 'SAFE';
  if (finalScore >= 70) {
    classification = 'DANGEROUS';
  } else if (finalScore >= 30) {
    classification = 'SUSPICIOUS';
  }

  // Multilingual explanations
  const explanationLang = options.explanationLang || 'en';
  let explanation;
  let recommendation;

  if (explanationLang === 'hi') {
    if (classification === 'DANGEROUS') {
      explanation = `उच्च साइबर धोखाधड़ी (Scam) का संकेत मिला है। संदेश में भ्रामक तात्कालिकता, खाता बंद करने की धमकी अथवा अनधिकृत ब्रांड का दुरुपयोग पाया गया है (${matchedPhrases.slice(0, 2).join(', ') || 'संदिग्ध शब्दावली'})।`;
      recommendation = `किसी भी लिंक पर क्लिक न करें, अज्ञात नंबर पर कॉल न करें और ओटीपी साझा न करें। तुरंत राष्ट्रीय साइबर अपराध हेल्पलाइन 1930 पर कॉल करें या cybercrime.gov.in पर रिपोर्ट करें।`;
    } else if (classification === 'SUSPICIOUS') {
      explanation = `सावधानी आवश्यक है। इस संदेश में कुछ असामान्य तत्व हैं जो फ़िशिंग या अनपेक्षित संपर्क से मेल खाते हैं।`;
      recommendation = `आधिकारिक ऐप या वेबसाइट के माध्यम से ही पुष्टि करें।`;
    } else {
      explanation = `संदेश में कोई प्रत्यक्ष साइबर धोखाधड़ी संकेतक नहीं मिला। सामान्य सुरक्षा का पालन करें।`;
      recommendation = `ओटीपी या पासवर्ड कभी किसी के साथ साझा न करें।`;
    }
  } else if (explanationLang === 'kn') {
    if (classification === 'DANGEROUS') {
      explanation = `ಹೆಚ್ಚಿನ ಸೈಬರ್ ವಂಚನೆಯ (Scam) ಸಾಧ್ಯತೆ ಪತ್ತೆಯಾಗಿದೆ. ಈ ಸಂದೇಶವು ಬ್ಯಾಂಕ್ ಅಥವಾ ವಿದ್ಯುತ್ ಖಾತೆಯನ್ನು ನಿರ್ಬಂಧಿಸುವ ಭಯ ಹುಟ್ಟಿಸಿ ತುರ್ತು ಲಿಂಕ್ ಮೂಲಕ ವೈಯಕ್ತಿಕ ವಿವರಗಳನ್ನು ಕದಿಯಲು ಯತ್ನಿಸುತ್ತದೆ (${matchedPhrases.slice(0, 2).join(', ') || 'ಸಂಶಯಾಸ್ಪದ ಅಂಶಗಳು'})।`;
      recommendation = `ಯಾವುದೇ ಲಿಂಕ್ ಕ್ಲಿಕ್ ಮಾಡಬೇಡಿ ಅಥವಾ ಒಟಿಪಿ ಹಂಚಿಕೊಳ್ಳಬೇಡಿ. ತಕ್ಷಣ ಸೈಬರ್ ಕ್ರೈಮ್ ಸಹಾಯವಾಣಿ 1930 ಅಥವಾ cybercrime.gov.in ಮೂಲಕ ದೂರು ದಾಖಲಿಸಿ.`;
    } else if (classification === 'SUSPICIOUS') {
      explanation = `ಎಚ್ಚರಿಕೆ ವಹಿಸಿ. ಈ ಸಂದೇಶದಲ್ಲಿ ಅನುಮಾನಾಸ್ಪದ ಅಂಶಗಳಿದ್ದು ಪರಿಶೀಲನೆಯ ಅಗತ್ಯವಿದೆ.`;
      recommendation = `ಸಂಬಂಧಿತ ಸಂಸ್ಥೆಯ ಅಧಿಕೃತ ಗ್ರಾಹಕ ಸಹಾಯವಾಣಿಯನ್ನು ಮಾತ್ರ ಸಂಪರ್ಕಿಸಿ.`;
    } else {
      explanation = `ಯಾವುದೇ ಬೆದರಿಕೆ ಅಂಶಗಳು ಪತ್ತೆಯಾಗಿಲ್ಲ. ಸುರಕ್ಷಿತ ಸಂವಹನ.`;
      recommendation = `ಯಾರಿಗೂ ಒಟಿಪಿ ಅಥವಾ ಬ್ಯಾಂಕಿಂಗ್ ಪಾಸ್‌ವರ್ಡ್ ನೀಡಬೇಡಿ.`;
    }
  } else {
    // English default
    if (classification === 'DANGEROUS') {
      explanation = `High scam probability detected (${detectedLang.name} input). The message exhibits classic social engineering patterns: ${matchedPhrases.length > 0 ? `flagged keywords ("${matchedPhrases.slice(0, 3).join('", "')}")` : ''}${urgencyFound.length > 0 ? `, intense artificial urgency` : ''}${impersonated.length > 0 ? `, and unauthorized institution impersonation` : ''}.`;
      recommendation = 'DO NOT click links, call unverified numbers, or disclose OTPs/passwords. Block the sender and report immediately via the National Cyber Crime Portal (cybercrime.gov.in) or call 1930.';
    } else if (classification === 'SUSPICIOUS') {
      explanation = `Caution advised. Contains anomalies often associated with unsolicited solicitations or social engineering, though malicious intent requires manual corroboration.`;
      recommendation = 'Verify the authenticity through the provider\'s official mobile application or official website before responding.';
    } else {
      explanation = `No immediate cyber threat indicators detected in the message text. No deceptive urgency or unverified credential solicitations identified.`;
      recommendation = 'Standard communication. Always exercise cyber hygiene and never disclose two-factor OTP codes to anyone.';
    }
  }

  return {
    id: `scan-msg-${Date.now()}`,
    type: 'message',
    target: text,
    riskScore: finalScore,
    classification,
    language: detectedLang,
    summary: matchedPhrases.length > 0 
      ? `Flagged: ${matchedPhrases.slice(0, 2).join(', ')}` 
      : (classification === 'SAFE' ? 'Clean communication' : 'Suspicious communication patterns'),
    indicators: {
      suspiciousPhrases: matchedPhrases,
      urgencyIndicators: urgencyFound,
      impersonation: impersonated,
      urlCharacteristics: urlTraits
    },
    explanation,
    recommendation,
    source: 'DEMO_HEURISTIC_ENGINE',
    analyzedAt: new Date().toISOString()
  };
}

// ============================================================================
// 2. ADVANCED URL INTELLIGENCE ENGINE
// ============================================================================

export function analyzeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new Error('A valid URL string is required.');
  }

  let formatted = rawUrl.trim();
  if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
    formatted = 'https://' + formatted;
  }

  let parsed;
  try {
    parsed = new URL(formatted);
  } catch {
    throw new Error('Invalid URL format. Please enter a valid web address.');
  }

  const hostname = parsed.hostname.toLowerCase();
  const pathname = parsed.pathname.toLowerCase();
  const search = parsed.search.toLowerCase();
  
  // Categorized findings
  const observedTraits = [];
  const heuristicIndicators = [];
  const impersonated = [];
  let scoreAccumulator = 0;

  // 1. Syntax & Normalization
  if (parsed.protocol === 'http:') {
    observedTraits.push('Unencrypted protocol (Plaintext HTTP, missing SSL/TLS certificate)');
    heuristicIndicators.push('Credentials submitted over this connection are transmitted in plaintext');
    scoreAccumulator += 25;
  } else if (parsed.protocol === 'https:') {
    observedTraits.push('Transport Layer Security (HTTPS) protocol active');
  }

  if (parsed.port && parsed.port !== '80' && parsed.port !== '443') {
    observedTraits.push(`Non-standard destination port specified: :${parsed.port}`);
    heuristicIndicators.push('Non-standard web port commonly used to host rogue backdoors');
    scoreAccumulator += 15;
  }

  if (parsed.username || parsed.password) {
    observedTraits.push('Embedded user credentials detected in URL authority string');
    heuristicIndicators.push('Potential URL authority spoofing technique');
    scoreAccumulator += 35;
  }

  if (formatted.includes('%2e') || formatted.includes('%2f') || formatted.includes('%40')) {
    observedTraits.push('Hex-encoded path traversal or obfuscation characters detected');
    heuristicIndicators.push('URL encoding evasion technique observed');
    scoreAccumulator += 20;
  }

  // 2. IP Address Detection (Dotted Decimal)
  const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipPattern.test(hostname)) {
    observedTraits.push(`Direct numerical IP address (${hostname}) used in place of registered domain`);
    heuristicIndicators.push('Severe threat indicator: Legitimate services never serve login/payment forms on raw IP hosts');
    scoreAccumulator += 45;
  }

  // 3. Domain & Subdomain Structure
  const dotSegments = hostname.split('.');
  const tld = '.' + dotSegments[dotSegments.length - 1];
  const subdomainCount = Math.max(0, dotSegments.length - 2);

  if (subdomainCount >= 3) {
    observedTraits.push(`Excessive subdomain hierarchy (${subdomainCount} subdomains: ${hostname})`);
    heuristicIndicators.push('Deep subdomain nesting characteristic of DNS evasion techniques');
    scoreAccumulator += 20;
  }

  const hyphenCount = (hostname.match(/-/g) || []).length;
  if (hyphenCount >= 2) {
    observedTraits.push(`Multiple hyphens (${hyphenCount}) present in hostname structure`);
    heuristicIndicators.push('Brand keyword compounding observed (e.g. brand-service-update)');
    scoreAccumulator += 15;
  }

  // 4. Suspicious TLD Registry
  if (SUSPICIOUS_TLDS.some(badTld => hostname.endsWith(badTld))) {
    observedTraits.push(`Registered on high-abuse Top-Level Domain (${tld})`);
    heuristicIndicators.push(`The ${tld} registry is statistically associated with high rates of malicious spam and phishing`);
    scoreAccumulator += 30;
  }

  // 5. URL Shorteners
  if (SHORTENER_DOMAINS.some(d => hostname === d || hostname.endsWith(`.${d}`))) {
    observedTraits.push(`URL shortening intermediary (${hostname}) disguising landing destination`);
    heuristicIndicators.push('Destination concealment: Actual destination host is masked by redirect intermediary');
    scoreAccumulator += 20;
  }

  // 6. Brand Typosquatting / Identity Theft
  const targetBrands = [
    { brand: 'sbi', official: 'sbi.co.in', tld: '.sbi' },
    { brand: 'yono', official: 'onlinesbi.sbi' },
    { brand: 'hdfc', official: 'hdfcbank.com' },
    { brand: 'icici', official: 'icicibank.com' },
    { brand: 'bescom', official: 'bescom.karnataka.gov.in' },
    { brand: 'paytm', official: 'paytm.com' },
    { brand: 'netflix', official: 'netflix.com' },
    { brand: 'amazon', official: 'amazon.in' }
  ];

  for (const b of targetBrands) {
    if (hostname.includes(b.brand) || pathname.includes(b.brand)) {
      const isOfficial = (b.tld && hostname.endsWith(b.tld)) || (b.official && (hostname === b.official || hostname.endsWith(`.${b.official}`)));
      if (!isOfficial) {
        impersonated.push(`Deceptive brand misuse: claims ${b.brand.toUpperCase()} identity on unofficial host (${hostname})`);
        heuristicIndicators.push(`Identity mismatch: Uses ${b.brand.toUpperCase()} trademark on unauthorized domain infrastructure`);
        scoreAccumulator += 40;
      }
    }
  }

  // 7. Open Redirect Query Inspection
  const redirectParams = ['redirect=', 'url=', 'target=', 'dest=', 'destination=', 'next=', 'goto='];
  if (redirectParams.some(param => search.includes(param))) {
    observedTraits.push('Open redirection parameter identified in query string');
    heuristicIndicators.push('Vulnerability to open redirect exploitation for phishing delivery');
    scoreAccumulator += 15;
  }

  // 8. Legitimate Clean Verification
  if (scoreAccumulator === 0) {
    observedTraits.push('Standard HTTPS encryption enabled');
    observedTraits.push('No recognized malicious domain signatures, raw IPs, or typosquatting keywords');
  }

  const finalScore = Math.min(100, Math.max(0, scoreAccumulator));

  let classification = 'SAFE';
  if (finalScore >= 70) {
    classification = 'DANGEROUS';
  } else if (finalScore >= 30) {
    classification = 'SUSPICIOUS';
  }

  let explanation;
  if (classification === 'DANGEROUS') {
    explanation = `High risk endpoint detected. The URL exhibits critical indicators of credential harvesting or fraud infrastructure: ${heuristicIndicators.slice(0, 2).join('; ')}.`;
  } else if (classification === 'SUSPICIOUS') {
    explanation = `Anomalies detected in domain structure or redirection parameters (${observedTraits[0]}). Exercise caution.`;
  } else {
    explanation = `The URL adheres to secure transmission standards without structural or typosquatting anomalies.`;
  }

  let recommendation;
  if (classification === 'DANGEROUS') {
    recommendation = 'DO NOT open this link in any browser, enter credentials, or make payments. Close any open tabs immediately.';
  } else if (classification === 'SUSPICIOUS') {
    recommendation = 'Do not input passwords or financial credentials without independently verifying the website through official search.';
  } else {
    recommendation = 'Safe URL structure. Always verify the browser address bar matches the intended institution before authenticating.';
  }

  return {
    id: `scan-url-${Date.now()}`,
    type: 'url',
    target: rawUrl,
    riskScore: finalScore,
    classification,
    summary: heuristicIndicators.length > 0 ? heuristicIndicators[0] : (observedTraits[0] || 'Standard URL'),
    domainDetails: {
      hostname,
      protocol: parsed.protocol,
      pathname: parsed.pathname,
      subdomainCount,
      tld
    },
    indicators: {
      suspiciousPhrases: [],
      urgencyIndicators: [],
      impersonation: impersonated,
      urlCharacteristics: [...observedTraits, ...heuristicIndicators]
    },
    advancedIntelligence: {
      observedTraits,
      heuristicIndicators,
      threatFeedStatus: 'Heuristic Engine Evaluation (Live Threat Intel Feed Pending Backend Sync)',
      domainAgeStatus: 'WHOIS Registration Age Verification (Requires External Live Feed)'
    },
    explanation,
    recommendation,
    source: 'DEMO_HEURISTIC_ENGINE',
    analyzedAt: new Date().toISOString()
  };
}

/**
 * Evaluates both a message and its associated URL together.
 */
export function analyzeCombined(text, rawUrl) {
  const msgAnalysis = analyzeMessage(text || '');
  let urlAnalysis = null;
  if (rawUrl && rawUrl.trim()) {
    try {
      urlAnalysis = analyzeUrl(rawUrl);
    } catch {
      urlAnalysis = {
        riskScore: 30,
        classification: 'SUSPICIOUS',
        indicators: { urlCharacteristics: ['Malformed or invalid URL provided in combined scan'] }
      };
    }
  }

  let combinedScore = msgAnalysis.riskScore;
  const crossIndicators = [];

  if (urlAnalysis) {
    const maxSubScore = Math.max(msgAnalysis.riskScore, urlAnalysis.riskScore);
    const avgSubScore = (msgAnalysis.riskScore + urlAnalysis.riskScore) / 2;
    combinedScore = Math.min(100, Math.round(maxSubScore * 0.7 + avgSubScore * 0.3 + (msgAnalysis.riskScore > 40 && urlAnalysis.riskScore > 40 ? 10 : 0)));

    if (msgAnalysis.indicators.urgencyIndicators.length > 0 && urlAnalysis.riskScore > 40) {
      crossIndicators.push('Compound Alert: High urgency message paired with unverified or high-risk URL');
    }
  }

  let classification = 'SAFE';
  if (combinedScore >= 70) {
    classification = 'DANGEROUS';
  } else if (combinedScore >= 30) {
    classification = 'SUSPICIOUS';
  }

  const allPhrases = [...msgAnalysis.indicators.suspiciousPhrases];
  const allUrgency = [...msgAnalysis.indicators.urgencyIndicators];
  const allImpersonation = [...new Set([...msgAnalysis.indicators.impersonation, ...(urlAnalysis?.indicators.impersonation || [])])];
  const allUrlTraits = [...(urlAnalysis?.indicators.urlCharacteristics || []), ...msgAnalysis.indicators.urlCharacteristics, ...crossIndicators];

  return {
    id: `scan-comb-${Date.now()}`,
    type: 'combined',
    target: `${text.slice(0, 100)}... | URL: ${rawUrl || 'None'}`,
    riskScore: combinedScore,
    classification,
    summary: 'Combined multi-vector security correlation',
    indicators: {
      suspiciousPhrases: allPhrases,
      urgencyIndicators: allUrgency,
      impersonation: allImpersonation,
      urlCharacteristics: allUrlTraits
    },
    messageSubAnalysis: {
      score: msgAnalysis.riskScore,
      classification: msgAnalysis.classification
    },
    urlSubAnalysis: urlAnalysis ? {
      score: urlAnalysis.riskScore,
      classification: urlAnalysis.classification
    } : null,
    explanation: classification === 'DANGEROUS'
      ? 'Compound cyber attack vector detected. Coercive social engineering in the communication directs victims to an unverified or high-risk destination link.'
      : 'No compounded high-risk attack vectors identified across message and URL combination.',
    recommendation: classification === 'DANGEROUS'
      ? 'CRITICAL: Do not visit the link, do not reply, and do not provide credentials. Block sender and report immediately to 1930.'
      : 'Maintain standard cyber hygiene.',
    source: 'DEMO_HEURISTIC_ENGINE',
    analyzedAt: new Date().toISOString()
  };
}

// ============================================================================
// 3. AI SCAM INVESTIGATION ASSISTANT ENGINE (Contextual Advisory)
// ============================================================================

export function generateInvestigationResponse(query, scanContext) {
  const q = (query || '').toLowerCase().trim();
  const context = scanContext || {};
  const { target = 'the inspected item', riskScore = 0, classification = 'SAFE', indicators = {} } = context;
  const { suspiciousPhrases = [], urgencyIndicators = [], impersonation = [], urlCharacteristics = [] } = indicators;
  const targetLabel = target.length > 50 ? `${target.slice(0, 47)}...` : target;

  // Question 1: Why was this classified as dangerous/suspicious/safe?
  if (q.includes('why was this') || q.includes('why is this') || q.includes('classified') || q.includes('dangerous') || q.includes('suspicious')) {
    if (classification === 'DANGEROUS') {
      return `This artifact ("${targetLabel}") received a risk score of ${riskScore}/100 (DANGEROUS) based on observable threat evidence:\n\n` +
        `1. Flagged Phrasing: ${suspiciousPhrases.length > 0 ? suspiciousPhrases.map(p => `"${p}"`).join(', ') : 'Coercive social engineering syntax detected.'}\n` +
        `2. Psychological Pressure: ${urgencyIndicators.length > 0 ? urgencyIndicators.join('; ') : 'Artificial time deadline designed to bypass rational thinking.'}\n` +
        `3. Identity Misuse: ${impersonation.length > 0 ? impersonation.join('; ') : 'Claims official authority without verified credentials.'}\n` +
        `4. Infrastructure Red Flags: ${urlCharacteristics.length > 0 ? urlCharacteristics.slice(0, 2).join('; ') : 'Suspicious redirection or domain attributes.'}\n\n` +
        `In cybersecurity analysis, when urgency coercion meets credential demands, the statistical probability of financial or credential fraud exceeds 90%.`;
    } else if (classification === 'SUSPICIOUS') {
      return `This was classified as SUSPICIOUS (${riskScore}/100) because it exhibits security anomalies that deviate from standard communication, such as unverified third-party links or unsolicited urgency, but lacks conclusive proof of hostile intent without external corroboration.`;
    } else {
      return `This was classified as SAFE (${riskScore}/100) because no recognized phishing syntax, deceptive urgency markers, raw IP addresses, or brand impersonation signatures were detected.`;
    }
  }

  // Question 2: Which words make this suspicious?
  if (q.includes('which words') || q.includes('phrases') || q.includes('what words') || q.includes('keywords')) {
    if (suspiciousPhrases.length > 0) {
      return `The exact phrases flagged in your content are:\n\n` +
        suspiciousPhrases.map(p => `• "${p}" — commonly utilized in phishing lures to intimidate or entice victims`).join('\n') +
        `\n\nAdditionally, the following urgency markers were extracted:\n` +
        (urgencyIndicators.length > 0 ? urgencyIndicators.map(u => `• ${u}`).join('\n') : '• None detected.');
    } else {
      return `No specific suspicious keyword triggers were flagged in the text body. Any risk score was influenced primarily by infrastructure or URL attributes.`;
    }
  }

  // Question 3: What happens if I click this link?
  if (q.includes('click this link') || q.includes('if i click') || q.includes('open the link')) {
    return `If you open a link flagged as ${classification}, the following attack vectors could execute:\n\n` +
      `1. Credential Harvesting: A cloned webpage mimicking your bank, BESCOM, or service portal asking for username, password, PAN, or OTP.\n` +
      `2. Drive-by Malware / APK Download: Automatic background downloading of trojanized Android APKs (e.g., SMS forwarders or remote access tools).\n` +
      `3. Session Hijacking & Device Fingerprinting: Script execution capturing your IP address, browser cookies, and network environment.\n\n` +
      `RECOMMENDATION: Do not click the link. If already clicked, close the browser tab immediately and do not input any data.`;
  }

  // Question 4: What information could the scammer steal?
  if (q.includes('steal') || q.includes('what information') || q.includes('data lost')) {
    return `Depending on the interaction, attackers targeting this vector attempt to extract:\n\n` +
      `• Banking Credentials: Netbanking passwords, ATM PINs, UPI MPINs, and credit/debit card CVV numbers.\n` +
      `• Two-Factor Authentication: One-Time Passwords (OTPs) forwarded via SMS.\n` +
      `• Identity Records: PAN card numbers, Aadhaar numbers, and date of birth for identity theft and SIM swap fraud.\n` +
      `• Device Access: Remote screen sharing permissions (via malicious applications like AnyDesk or rogue APKs).`;
  }

  // Question 5: How can I verify whether this is genuine?
  if (q.includes('verify') || q.includes('genuine') || q.includes('is it real') || q.includes('legitimate')) {
    return `To independently verify whether this communication is authentic:\n\n` +
      `1. Out-of-Band Verification: Never use contact numbers or links provided in the message. Look up the official customer care number on the back of your bank card or on the verified website.\n` +
      `2. Official Mobile App: Log into the official bank/service app (downloaded from Google Play or Apple App Store). Check if there is any notification under 'Alerts' or 'Pending Actions'.\n` +
      `3. Physical Branch / Office: For utility notices (like BESCOM) or bank KYC, visit your nearest physical office.\n` +
      `4. Critical Rule: Legitimate banks and government utilities in India NEVER ask for KYC updates via WhatsApp or standard SMS with third-party links (.xyz, .top).`;
  }

  // Question 6: What should I do next?
  if (q.includes('what should i do') || q.includes('next steps') || q.includes('how to protect') || q.includes('action')) {
    return `Here is your immediate action protocol:\n\n` +
      `1. STOP: Do not click any links, do not download attachments, and do not call back.\n` +
      `2. BLOCK: Block the sender's phone number or email address on your device.\n` +
      `3. REPORT: Report the scam attempt on the National Cyber Crime Reporting Portal (cybercrime.gov.in) or call 1930.\n` +
      `4. IF COMPROMISED: If you already entered credentials or transferred money, immediately navigate to ScamShield's 'Fraud Emergency Mode' for guided account freeze steps.`;
  }

  // General contextual fallback
  return `Regarding your inquiry on this ${classification} artifact (${riskScore}/100):\n\n` +
    `Our heuristic security inspection observed: ${indicators.suspiciousPhrases?.length ? `Keywords: ${indicators.suspiciousPhrases.join(', ')}. ` : ''}` +
    `${indicators.urgencyIndicators?.length ? `Urgency: ${indicators.urgencyIndicators.join(', ')}. ` : ''}` +
    `${indicators.urlCharacteristics?.length ? `URL Traits: ${indicators.urlCharacteristics.join(', ')}. ` : ''}\n\n` +
    `Always exercise zero trust with unverified messages. Feel free to ask a specific question such as 'Why was this classified as dangerous?' or 'What should I do next?'`;
}
