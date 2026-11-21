"""Pattern catalogs, brand lists, regular expressions, and Hinglish phrases
for the ScamShield AI detection engine.
"""

import re
from typing import Any, Dict, List, Set

# ==========================================
# 1. KNOWN URL SHORTENERS & SUSPICIOUS TLDS
# ==========================================

URL_SHORTENERS: Set[str] = {
    "bit.ly", "tinyurl.com", "is.gd", "t.co", "cutt.ly", "rb.gy",
    "shorturl.at", "ow.ly", "buff.ly", "goo.gl", "rebrand.ly",
    "bl.ink", "v.gd", "t.me", "wa.me", "soo.gd", "s.id", "trib.al"
}

SUSPICIOUS_TLDS: Set[str] = {
    "xyz", "top", "tk", "ml", "ga", "cf", "gq", "buzz", "work",
    "rest", "click", "icu", "fit", "monster", "gdn", "vip", "kim",
    "country", "stream", "download", "racing", "quest", "link", "live"
}

# ==========================================
# 2. LEGITIMATE INDIAN BRANDS & DOMAINS
# ==========================================

LEGITIMATE_BRANDS: Dict[str, List[str]] = {
    "sbi": ["sbi.co.in", "onlinesbi.sbi", "onlinesbi.com", "statebankofindia.com"],
    "hdfc": ["hdfcbank.com", "hdfc.com"],
    "icici": ["icicibank.com", "icicidirect.com"],
    "axis": ["axisbank.com"],
    "pnb": ["pnbindia.in"],
    "bob": ["bankofbaroda.in", "bankofbaroda.com"],
    "kotak": ["kotak.com", "kotakcherry.com"],
    "paytm": ["paytm.com", "paytmbank.com"],
    "phonepe": ["phonepe.com"],
    "gpay": ["google.com", "pay.google.com"],
    "bhim": ["bhimupi.org.in", "npci.org.in"],
    "aadhaar": ["uidai.gov.in"],
    "incometax": ["incometax.gov.in", "incometaxindiaefiling.gov.in"],
    "indiapost": ["indiapost.gov.in"],
    "amazon": ["amazon.in", "amazon.com"],
    "flipkart": ["flipkart.com"]
}

# Generic brand names to watch for typosquatting / spoofing in subdomains or URLs
WATCHLIST_BRANDS: Set[str] = {
    "sbi", "onlinesbi", "hdfc", "hdfcbank", "icici", "icicibank",
    "axisbank", "pnb", "pnbbank", "bankofbaroda", "kotak", "paytm",
    "phonepe", "bhim", "uidai", "aadhaar", "incometax", "bescom",
    "jio", "airtel", "vi", "bsnl", "indiapost", "irctc"
}

# ==========================================
# 3. DEFENSIVE PATTERNS (LEGITIMATE SAFEGUARDS)
# ==========================================
# When messages explicitly warn users NOT to share secrets, it's strong evidence
# of a legitimate alert rather than a credential-stealing attempt.

DEFENSIVE_DISCLAIMER_PATTERNS: List[re.Pattern] = [
    re.compile(r"(never|do not|don'?t)\s+(share|disclose|give)\s+(your\s+)?(otp|pin|password|cvv)", re.I),
    re.compile(r"bank\s+never\s+asks\s+for\s+(otp|password|pin|details)", re.I),
    re.compile(r"otp\s+(kisi\s+se|kisi\s+ko)\s+(bhi\s+)?(share\s+na\s+karein|na\s+batayein)", re.I),
    re.compile(r"if\s+not\s+(requested|done|initiated)\s+by\s+you,?\s+(call|report|sms)", re.I),
    re.compile(r"neither\s+bank\s+nor\s+any\s+official\s+will\s+call\s+for\s+otp", re.I),
]

LEGITIMATE_TRANSACTION_PATTERNS: List[re.Pattern] = [
    re.compile(r"(credited|debited)\s+(by|with)?\s*(rs\.?|inr|₹)\s*[\d,]+(\.\d{1,2})?", re.I),
    re.compile(r"a/c\s*(no\.?|\*+[\d]+)\s*(is\s+)?(debited|credited)", re.I),
    re.compile(r"avl\s+bal(ance)?\s*:\s*(rs\.?|inr|₹)?\s*[\d,]+", re.I),
    re.compile(r"txn\s+id\s*:\s*[\w\d]+", re.I),
    re.compile(r"shipped\s+with\s+(tracking|awb)\s+id", re.I),
    re.compile(r"out\s+for\s+delivery", re.I),
]

# ==========================================
# 4. SCAM INDICATOR PATTERNS (15 CATEGORIES)
# ==========================================

SCAM_PATTERNS: Dict[str, Dict[str, Any]] = {
    # 1. Fake KYC verification
    "FAKE_KYC": {
        "title": "Fake KYC Verification Alert",
        "category": "Identity & Account Impersonation",
        "severity": "CRITICAL",
        "patterns": [
            re.compile(r"(complete|update|verify|renew)\s+(your\s+)?(kyc|pan\s+card|aadhaar)", re.I),
            re.compile(r"kyc\s+(is\s+)?(pending|suspended|expired|unverified|mandatory)", re.I),
            re.compile(r"pan\s+card\s+not\s+updated", re.I),
            re.compile(r"(turant|jaldi)\s+kyc\s+update\s+kare[in]?", re.I), # Hinglish
            re.compile(r"kyc\s+nahi\s+karwaya\s+toh", re.I), # Hinglish
        ],
        "explanation": "Requests urgent KYC or document updates via unofficial links or messages, which legitimate institutions never do.",
    },

    # 2. Account Blocking / Suspension Threat
    "ACCOUNT_SUSPENSION_THREAT": {
        "title": "Coercive Account Suspension Threat",
        "category": "Urgency & Intimidation",
        "severity": "HIGH",
        "patterns": [
            re.compile(r"(account|debit\s+card|net\s*banking)\s+(will\s+be|has\s+been)\s+(blocked|suspended|deactivated|closed|frozen)", re.I),
            re.compile(r"(within|in)\s+(\d{1,2}\s*(hours?|hrs?)|today|immediately)", re.I),
            re.compile(r"account\s+block\s+ho\s+jayega", re.I), # Hinglish
            re.compile(r"aaj\s+hi\s+block\s+kar\s+diya\s+jayega", re.I), # Hinglish
            re.compile(r"last\s+warning\s*:\s*account", re.I),
        ],
        "explanation": "Creates high panic and urgency by threatening immediate account lockout or forfeiture.",
    },

    # 3. Bank Impersonation
    "BANK_IMPERSONATION": {
        "title": "Bank Name Impersonation",
        "category": "Identity & Account Impersonation",
        "severity": "HIGH",
        "patterns": [
            re.compile(r"\b(sbi|state\s+bank|hdfc|icici|axis\s+bank|pnb|punjab\s+national|bank\s+of\s+baroda|kotak)\b", re.I),
            re.compile(r"\b(dear\s+customer|dear\s+sbi\s+user|dear\s+hdfc\s+user)\b", re.I),
            re.compile(r"bank\s+officer|bank\s+manager|rbi\s+guidelines?", re.I),
        ],
        "explanation": "Claims to represent a recognized financial institution to build false trust.",
    },

    # 4. SIM Card Deactivation / 5G Upgrade Threat
    "SIM_DEACTIVATION": {
        "title": "SIM Card Deactivation Threat",
        "category": "Telecommunication Fraud",
        "severity": "CRITICAL",
        "patterns": [
            re.compile(r"(sim\s+card|sim)\s+(will\s+be\s+)?(deactivated|blocked|disconnected)", re.I),
            re.compile(r"(upgrade|convert)\s+(to\s+)?5g\s+sim", re.I),
            re.compile(r"trai|department\s+of\s+telecom|dot\s+verification", re.I),
            re.compile(r"sim\s+band\s+ho\s+jayegi", re.I), # Hinglish
            re.compile(r"sim\s+band\s+kar\s+diya\s+jayega", re.I), # Hinglish
        ],
        "explanation": "Pressures users with threats of cellular line disconnection to elicit remote access or APK installations.",
    },

    # 5. Government / Utility Authority Impersonation (Electricity, Police, Tax)
    "GOVT_UTILITY_IMPERSONATION": {
        "title": "Government / Utility Disconnection Threat",
        "category": "Authority Impersonation",
        "severity": "CRITICAL",
        "patterns": [
            re.compile(r"(electricity|power|light)\s+(bill\s+unpaid|will\s+be\s+disconnected|cut\s*off\s*tonight)", re.I),
            re.compile(r"bijli\s+(kat\s+di\s+jayegi|connection\s+kat)", re.I), # Hinglish
            re.compile(r"income\s+tax\s+refund\s+of\s+(rs\.?|inr|₹)", re.I),
            re.compile(r"(police|cbi|customs|cyber\s+crime)\s+(department|arrest\s+warrant|parcel\s+seized)", re.I),
            re.compile(r"digital\s+arrest", re.I),
        ],
        "explanation": "Threatens immediate power cut or impersonates law enforcement to extort urgent payment.",
    },

    # 6. Sensitive Credential Harvesting (OTP/PIN/CVV/Password)
    "CREDENTIAL_THEFT_REQUEST": {
        "title": "Credential / Secret Harvesting Request",
        "category": "Phishing & Harvesting",
        "severity": "CRITICAL",
        "patterns": [
            re.compile(r"(share|send|forward|tell|submit|enter)\s+(your\s+)?(otp|pin|cvv|password|mpin)", re.I),
            re.compile(r"otp\s+(share\s+karein|batayein|bhejein)", re.I), # Hinglish
            re.compile(r"enter\s+(atm\s+pin|upi\s+pin)\s+to\s+(receive|claim|accept)", re.I),
            re.compile(r"fill\s+(up\s+)?this\s+form\s+with\s+(card\s+number|cvv)", re.I),
        ],
        "explanation": "Explicitly requests secret authorization codes (OTP, PIN, CVV) which are only used to initiate or authorize outgoing transactions.",
    },

    # 7. Lottery & Unrealistic Prize Scam
    "LOTTERY_PRIZE_SCAM": {
        "title": "Lottery / Bogus Prize Award",
        "category": "Advance Fee & Lottery",
        "severity": "CRITICAL",
        "patterns": [
            re.compile(r"(congratulations|congrats)!?\s+(you\s+have\s+)?won\s+(rs\.?|inr|₹|\$)\s*[\d,]+", re.I),
            re.compile(r"kbc\s+(lottery|lucky\s+draw|head\s+office)", re.I),
            re.compile(r"lottery\s+(number|ticket|winner)", re.I),
            re.compile(r"claim\s+(your\s+)?(cash\s+prize|reward|gift\s+voucher)", re.I),
            re.compile(r"lottery\s+lagi\s+hai", re.I), # Hinglish
            re.compile(r"inam\s+mila\s+hai", re.I), # Hinglish
        ],
        "explanation": "Promises unrealistic or unprompted wealth to lure victims into paying 'processing fees' or surrendering details.",
    },

    # 8. Fake Rewards & Expiring Points
    "FAKE_REWARD_POINTS": {
        "title": "Unsolicited Reward Points Redemption",
        "category": "Phishing & Harvesting",
        "severity": "MEDIUM",
        "patterns": [
            re.compile(r"(reward\s+points?|cashback)\s+worth\s+(rs\.?|₹|inr)?\s*[\d,]+\s*(are\s+expiring|can\s+be\s+converted)", re.I),
            re.compile(r"redeem\s+(your\s+)?(points?|cashback)\s+(now|today|before\s+expiry)", re.I),
            re.compile(r"unclaimed\s+(bonus|cashback|refund)", re.I),
        ],
        "explanation": "Induces false time-sensitivity over artificial reward points to drive clicks to phishing portals.",
    },

    # 9. UPI & QR Code Fraud
    "UPI_QR_FRAUD": {
        "title": "UPI / QR Code Reversal Trap",
        "category": "Payment Fraud",
        "severity": "CRITICAL",
        "patterns": [
            re.compile(r"scan\s+(this\s+)?qr\s+(code\s+)?to\s+(receive|get)\s+money", re.I),
            re.compile(r"send\s+(rs\.?|re\.?|₹)\s*1\s+to\s+(verify|receive|get)", re.I),
            re.compile(r"approve\s+collect\s+request\s+to\s+receive", re.I),
            re.compile(r"enter\s+(upi\s+)?pin\s+to\s+get\s+(cashback|refund|money)", re.I),
        ],
        "explanation": "Deceives users into entering their UPI PIN or scanning a merchant QR to 'receive' money, which actually deducts funds.",
    },

    # 10. Fake Job & Work-from-Home Offers
    "FAKE_JOB_OFFER": {
        "title": "Predatory Task / Part-Time Job Scam",
        "category": "Employment Fraud",
        "severity": "CRITICAL",
        "patterns": [
            re.compile(r"(part\s*time|work\s+from\s+home)\s+job", re.I),
            re.compile(r"earn\s+(rs\.?|inr|₹)?\s*(\d{3,5})\s*-\s*(\d{3,5})\s*(daily|per\s+day)", re.I),
            re.compile(r"(like|subscribe)\s+(youtube|instagram)\s+(videos|channels)\s+and\s+earn", re.I),
            re.compile(r"telegram\s+(task|review)\s+job", re.I),
            re.compile(r"ghar\s+baithe\s+(kamayein|paise\s+kamaye)", re.I), # Hinglish
            re.compile(r"daily\s+payment\s+guaranteed", re.I),
        ],
        "explanation": "Offers unrealistic earnings for trivial tasks (liking videos, typing) before demanding deposit fees to unlock fake balances.",
    },

    # 11. Investment & Cryptocurrency Schemes
    "INVESTMENT_CRYPTO_FRAUD": {
        "title": "High-Yield Investment / Crypto Scam",
        "category": "Financial Fraud",
        "severity": "CRITICAL",
        "patterns": [
            re.compile(r"guaranteed\s+(return|profit)\s+of\s+\d+%", re.I),
            re.compile(r"double\s+your\s+(money|investment)\s+in\s+\d+\s*(days|hours)", re.I),
            re.compile(r"crypto\s+(mining|giveaway|doubler|signals)", re.I),
            re.compile(r"forex\s+trading\s+robot|insider\s+trading\s+tips", re.I),
            re.compile(r"paisa\s+double\s+hoga", re.I), # Hinglish
        ],
        "explanation": "Guarantees impossible high-yield returns with zero risk to solicit cryptocurrency or illicit bank deposits.",
    },

    # 12. Family Impersonation / "New Number" Scam
    "FAMILY_IMPERSONATION": {
        "title": "Family Impersonation / Emergency Scam",
        "category": "Social Engineering",
        "severity": "CRITICAL",
        "patterns": [
            re.compile(r"\b(hi\s+mom|hello\s+dad|hey\s+papa|hey\s+mummy|dear\s+papa|dear\s+mom|papa|mummy|maa)\b.*(phone|number|paise|emergency)", re.I),
            re.compile(r"(lost|dropped|broke|broken|stolen)\s+my\s+phone.*(this\s+is\s+my\s+new\s+number|friend'?s\s+phone|urgent)", re.I),
            re.compile(r"urgent\s+help\s+needed.*(pay|send|transfer|money)", re.I),
            re.compile(r"phone\s+(kho\s+gaya|kharab\s+ho\s+gaya|chori\s+ho\s+gaya)", re.I),
            re.compile(r"(naya\s+number|dost\s+ka\s+number|friend'?s\s+number).*(emergency|paise|money)", re.I),
            re.compile(r"emergency\s+hai.*(paise\s+bhejo|transfer\s+karo|\d{3,5}\s*bhejo)", re.I),
        ],
        "explanation": "Impersonates a relative who supposedly lost their phone and urgently needs money for a fabricated crisis.",
    },

    # 13. Fake Customer Support & Malicious APK
    "FAKE_SUPPORT_APK": {
        "title": "Remote Access / Fake Support APK Solicitation",
        "category": "Malware & Remote Access",
        "severity": "CRITICAL",
        "patterns": [
            re.compile(r"(call|dial)\s+(customer\s+care|helpline|support)\s+at\s+[\d\-\+]{10,14}", re.I),
            re.compile(r"download\s+our\s+(support\s+app|\.apk|app\s+link)", re.I),
            re.compile(r"(install|download)\s+(anydesk|teamviewer|rustdesk|quicksupport)", re.I),
            re.compile(r"sbi\s+support\s+apk|bank\s+update\s+apk", re.I),
        ],
        "explanation": "Directs users to call bogus mobile numbers or download screen-sharing tools (AnyDesk, TeamViewer) or malicious APKs.",
    },

    # 14. Phishing Action Links
    "PHISHING_ACTION_PROMPT": {
        "title": "Urgent Call-To-Action Link Prompt",
        "category": "Phishing & Harvesting",
        "severity": "MEDIUM",
        "patterns": [
            re.compile(r"(click\s+here|visit\s+link|tap\s+below|follow\s+this\s+link)\s*(to|for)?\s*(verify|update|claim|restore)", re.I),
            re.compile(r"login\s+to\s+your\s+account\s+via\s+https?://", re.I),
            re.compile(r"is\s+link\s+par\s+click\s+karein", re.I), # Hinglish
            re.compile(r"link\s+kholkar\s+update\s+kare", re.I), # Hinglish
        ],
        "explanation": "Pressures recipients to click an unsolicited link to resolve a manufactured problem.",
    },

    # 15. Urgent Coercive Language
    "EXTREME_URGENCY": {
        "title": "Manufactured High Urgency",
        "category": "Psychological Manipulation",
        "severity": "LOW",
        "patterns": [
            re.compile(r"\b(immediately|urgent|urgently|right\s+now|action\s+required|critical\s+alert)\b", re.I),
            re.compile(r"\b(turant|abhi\s+ke\s+abhi|jaldi)\b", re.I), # Hinglish
            re.compile(r"failure\s+to\s+(do\s+so|comply)\s+will\s+result", re.I),
        ],
        "explanation": "Employs psychological pressure to force hasty decisions before the user can verify authenticity.",
    }
}
