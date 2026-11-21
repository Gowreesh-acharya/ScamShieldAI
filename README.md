# ScamShield AI – AI Detection Engine
### Build Bengaluru 2.0 Hackathon | Module: AI Detection, Risk Assessment & Explainability

Engine Architect & AI Engineer: **Santhosh (Team Member 3)**  
Teammate Integration: **Mohammed Meraj Khan (FastAPI Backend)** & **Gowreesh (React Frontend)**

---

## 1. Overview

The **ScamShield AI Detection Engine** is an evidence-based, explainable heuristic fraud detection system built to analyze suspicious messages (SMS, WhatsApp, Email) and web links (URLs). It detects phishing attempts, imposter scams, credential harvesting, extortion threats, and predatory financial schemes in both English and common Hinglish.

### Key Highlights
- **100% Zero-Dependency Core:** Built using standard Python 3.12 (`urllib.parse`, `ipaddress`, `re`, `dataclasses`, `json`). Starts up in < 5ms with zero package conflicts.
- **Explainable AI (XAI):** Does not just give a black-box score. Generates plain-language reasoning, triggered textual/URL evidence spans, and concrete safety actions.
- **Context-Aware False Positive Protection:** Differentiates between defensive bank advice (*"Bank never asks for OTP"*) and malicious credential theft (*"Share your OTP to avoid suspension"*).
- **Safe Static URL Inspection:** Never makes network requests to malicious links; parses domain structures, IP hosts, URL shorteners, and Indian bank typosquatting locally.

---

## 2. Directory Structure

```text
ScamShield-AI/
├── ai_engine/
│   ├── __init__.py                  # Exposes analyze_message, analyze_url, analyze_input
│   ├── engine.py                    # Master orchestrator combining message, url, scoring & explainability
│   ├── models.py                    # Data Models: RiskLevel, Indicator, DetectionResult
│   ├── analyzers/
│   │   ├── __init__.py
│   │   ├── message_analyzer.py      # Regex & heuristic detection for 15 scam patterns (English & Hinglish)
│   │   ├── url_analyzer.py          # urllib.parse-based heuristic analysis (IP, subdomains, typosquatting, shorteners)
│   │   └── patterns.py              # Pattern catalogs: banks, keywords, regexes, Hinglish, TLDs, shorteners
│   ├── scoring/
│   │   ├── __init__.py
│   │   └── risk_scorer.py           # Weighted, non-double-counting scoring algorithm (0-100)
│   └── explainability/
│       ├── __init__.py
│       └── explainer.py             # Human-readable explanation & actionable recommendations generator
├── tests/
│   ├── __init__.py
│   ├── test_safe_messages.py        # Normal bank alerts, OTP receipts, delivery, conversations
│   ├── test_suspicious_messages.py  # Moderate urgency, unknown offers, borderline messages
│   ├── test_scam_messages.py        # All scam types (KYC, electricity bill, OTP theft, lottery, job, etc.)
│   ├── test_urls.py                 # Normal, typosquatting, IP-based, shortened, long URLs
│   ├── test_scoring.py              # Score boundaries (0-30, 31-60, 61-100), edge cases, deduplication
│   └── run_all_tests.py             # Standalone test runner that executes all test suites and prints report
├── demo_cli.py                      # Interactive terminal CLI to test any text or link on the fly
├── requirements.txt                 # Project dependencies note
└── README.md                        # Documentation & integration guide
```

---

## 3. How to Run & Verify

### Running the Full Test Suite
The test runner includes 31 automated test scenarios covering safe alerts, borderline notifications, high-risk scam patterns, and typosquatted URLs:

```bash
python tests/run_all_tests.py
```

### Running the Interactive CLI
You can test any message or URL on the fly:

```bash
# Interactive mode
python demo_cli.py

# Direct message check
python demo_cli.py --message "Your SBI account is blocked. Update KYC at http://bit.ly/sbi-kyc"

# Direct URL check
python demo_cli.py --url "http://192.168.1.50/sbi/login.php"

# JSON output
python demo_cli.py --message "Aapka account block ho jayega. Turant KYC update karein" --json
```

---

## 4. Integration Guide for Mohammed (FastAPI Backend)

The detection engine is pre-configured to be consumed by FastAPI with a single import.

### Step 1: Import Functions
In your FastAPI router file (e.g., `routers/scanner.py` or `main.py`):

```python
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List, Union

from ai_engine import analyze_input, analyze_message, analyze_url

router = APIRouter(prefix="/api", tags=["Scam Detection"])

class ScanRequest(BaseModel):
    text: Optional[str] = None
    url: Optional[str] = None
    input_type: Optional[str] = "auto"  # 'auto', 'message', or 'url'

@router.post("/scan")
async def scan_endpoint(payload: ScanRequest):
    if payload.input_type == "url" and payload.url:
        return analyze_url(payload.url)
    elif payload.input_type == "message" and payload.text:
        return analyze_message(payload.text)
    else:
        # Auto-routes based on presence of URL or text
        return analyze_input(message=payload.text, urls=payload.url)
```

---

## 5. API Response Schema Contract

Every function returns a JSON-serializable dictionary with the following schema:

```json
{
  "input_type": "message",
  "analyzed_target": "Dear SBI user, your account will be blocked today. Complete KYC immediately at http://bit.ly/sbi-kyc",
  "risk_score": 100,
  "risk_level": "HIGH",
  "verdict": "High Risk – Highly suspicious scam or phishing pattern detected",
  "scam_category": "Fake KYC Verification Alert",
  "detected_indicators": [
    {
      "code": "FAKE_KYC",
      "title": "Fake KYC Verification Alert",
      "severity": "CRITICAL",
      "matched_text": "Complete KYC",
      "description": "Requests urgent KYC or document updates via unofficial links or messages, which legitimate institutions never do.",
      "category": "Identity & Account Impersonation"
    },
    {
      "code": "ACCOUNT_SUSPENSION_THREAT",
      "title": "Coercive Account Suspension Threat",
      "severity": "HIGH",
      "matched_text": "account will be blocked",
      "description": "Creates high panic and urgency by threatening immediate account lockout or forfeiture.",
      "category": "Urgency & Intimidation"
    },
    {
      "code": "URL_SHORTENER",
      "title": "Shortened URL Service",
      "severity": "MEDIUM",
      "matched_text": "bit.ly",
      "description": "The link uses a URL shortener service that obscures the ultimate destination domain.",
      "category": "URL Obfuscation"
    }
  ],
  "explanation": "Caution: This content exhibits strong indicators of a fraudulent scam attempt. It matches behavioral traits of a 'Fake KYC Verification Alert'. It uses coercive urgency or intimidation to rush you into acting before verifying. It solicits sensitive identity or authorization details.",
  "recommendations": [
    "Do NOT click on any links provided in the message.",
    "Never enter your OTP, UPI PIN, password, or card CVV on any external web form.",
    "If you have already shared credentials or transferred money, immediately contact the National Cyber Crime Helpline at 1930 or visit cybercrime.gov.in."
  ],
  "urls_found": [
    "http://bit.ly/sbi-kyc"
  ],
  "url_details": [
    {
      "url": "http://bit.ly/sbi-kyc",
      "domain": "bit.ly",
      "scheme": "http",
      "is_ip_address": false,
      "is_shortener": true,
      "is_suspicious_tld": false,
      "has_typosquatting": false,
      "target_brand_mimicked": null,
      "has_excessive_subdomains": false,
      "suspicious_keywords_in_path": ["kyc"],
      "has_at_symbol": false,
      "is_unusually_long": false
    }
  ],
  "disclaimer": "ScamShield AI utilizes evidence-based heuristic analysis. Always verify independently through verified official channels."
}
```

---

## 6. Risk Scoring Model

- **Score Range:** `0 – 100`
- **Tiers:**
  - `0 – 30`: **LOW RISK** (Safe routine messages, delivery updates, legitimate banking alerts with OTP warnings).
  - `31 – 60`: **MEDIUM RISK** (Warning signals such as lone URL shorteners, reward points expiring, or unverified promotional links).
  - `61 – 100`: **HIGH RISK** (Confirmed fraud patterns, credential harvesting, electricity cutoff threats, family impersonation, brand typosquatting).

### Heuristic Weights
- `CRITICAL` (+65): Direct extortion, OTP theft, lottery scam, fake task job, crypto doubler, brand spoofing.
- `HIGH` (+40): Raw IP address host, account suspension threat.
- `MEDIUM` (+35): Known URL shorteners, high-risk TLDs, unsolicited reward points.
- `LOW` (+10): Minor formatting flags (excessive hyphens, unusual length, HTTP).
- `Synergistic Multipliers`: Threat + Link + Credential harvesting triggers confidence escalation.
- `Mitigating Safeguard`: Explicit safety warnings (`"Bank never asks for OTP"`) paired with standard transaction alerts dampen scores by -35, eliminating false positives on routine notifications.
