# ScamShield AI 🛡️
### Real-World Cybersecurity & Scam Detection Platform | Build Bengaluru 2.0 Hackathon

ScamShield AI is a cybersecurity SaaS frontend engineered to protect citizens and organizations from modern social engineering, SMS phishing (smishing), deceptive WhatsApp job/lottery scams, electricity power disconnection fraud, and malicious URL vectors.

---

## 🚀 Key Features

1. **Threat Telemetry Dashboard**:
   - Real-time audit metrics: Total Scans, Threats Detected, Safe Scans, and Suspicious Scans.
   - Quick launchpad to all security inspection modules.
   - Audit trail of recent scans with risk classifications.

2. **Message Scanner (SMS / WhatsApp / Email)**:
   - Deep linguistic analysis for fraud patterns, coercive deadlines, and institutional impersonation (e.g., SBI, BESCOM, India Post).
   - Instant sample test cases for demonstration.
   - Evidence-based risk score (0–100) and actionable safety advice.

3. **URL & Phishing Scanner**:
   - Evaluates domain reputation, suspicious TLDs (`.xyz`, `.top`, `.online`), raw IP addressing, brand typosquatting, and missing SSL/TLS encryption.
   - Real-time feedback and threat breakdown.

4. **Combined Attack Analysis**:
   - Simultaneously cross-references suspicious communications with their associated destination URLs.
   - Includes one-click automatic URL extraction from message text.
   - Highlights contextual compounding (e.g., urgency SMS paired with unverified domain).

5. **Scan History & Audit Trail**:
   - Persistent scan logging backed by `localStorage`.
   - Filter by scan type (Message, URL, Combined) and threat classification (Safe, Suspicious, Dangerous).
   - Full text search and one-click JSON export for audit reporting.

6. **FastAPI Backend Integration Ready with Demo Evaluation Fallback**:
   - Easily connects to any FastAPI backend via `VITE_API_BASE_URL`.
   - Includes a deterministic, transparent Heuristic Evaluation Engine for offline demonstration mode.

---

## 🛠️ Tech Stack

- **Framework**: React 19 + Vite
- **Language**: JavaScript (ES Modules)
- **Styling**: Cyber SaaS dark theme CSS (Navy `#050811`, `#090e1a` & Electric Cyan `#00f0ff`, Blue `#38bdf8`)
- **Icons**: Lucide React
- **Storage**: Browser LocalStorage with pre-seeded hackathon scenarios

---

## 🔌 FastAPI Backend Integration Contract

The API client is located in [`src/services/api.js`](src/services/api.js). To connect your FastAPI backend:

1. Create a `.env` file (see `.env.example`):
   ```env
   VITE_API_BASE_URL=http://localhost:8000
   ```

2. Implement the following endpoints in your FastAPI application:

### `GET /api/health`
```json
{
  "status": "ok",
  "version": "1.0.0"
}
```

### `POST /api/scan/message`
**Request Body**:
```json
{
  "text": "Dear Customer, your SBI account will be blocked today..."
}
```
**Response Body**:
```json
{
  "risk_score": 92,
  "classification": "DANGEROUS",
  "indicators": {
    "suspicious_phrases": ["account will be blocked today"],
    "urgency_indicators": ["threat of account closure today"],
    "impersonation": ["State Bank of India (SBI)"],
    "url_characteristics": []
  },
  "explanation": "High scam probability detected due to coercive account suspension threat.",
  "recommendation": "Do NOT click links or share credentials. Report to cybercrime.gov.in."
}
```

### `POST /api/scan/url`
**Request Body**:
```json
{
  "url": "http://sbi-kyc-verify.update-portal.xyz/login"
}
```

### `POST /api/scan/combined`
**Request Body**:
```json
{
  "text": "Your BESCOM power will be disconnected...",
  "url": "http://bescom-bill-desk.online/pay"
}
```

---

## 💻 Running the Application

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Build for Production
```bash
npm run build
```

---

*Engineered for Build Bengaluru 2.0 Hackathon.*
