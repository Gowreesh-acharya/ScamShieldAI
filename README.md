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
   - Checks URL structure, brand and domain mismatches, and known link shorteners.
   - Displays extracted URLs and any first redirect destinations returned by the backend.

4. **Combined Attack Analysis**:
   - Simultaneously cross-references suspicious communications with their associated destination URLs.
   - Includes one-click automatic URL extraction from message text.
   - Highlights contextual compounding (e.g., urgency SMS paired with unverified domain).

5. **Scan History & Audit Trail**:
   - Persistent scan logging backed by `localStorage`.
   - Filter by scan type (Message, URL, Combined) and threat classification (Safe, Suspicious, Dangerous).
   - Full text search and one-click JSON export for audit reporting.

6. **FastAPI integration and explicit Demo mode**:
   - Message, URL, and Combined scans connect to the ScamShield FastAPI backend through `VITE_API_BASE_URL`.
   - Auto and Live report request failures. Select Demo to run the browser heuristics.

---

## 🛠️ Tech Stack

- **Framework**: React 19 + Vite
- **Language**: JavaScript (ES Modules)
- **Styling**: Cyber SaaS dark theme CSS (Navy `#050811`, `#090e1a` & Electric Cyan `#00f0ff`, Blue `#38bdf8`)
- **Icons**: Lucide React
- **Storage**: Browser LocalStorage with pre-seeded hackathon scenarios

---

## 🔌 FastAPI Backend Integration Contract

The three scanners send one `content` string to `POST /api/analyze`. Combined Scan joins the provided message and URL with a newline. The connection check runs the same endpoint with a fixed greeting and skips scan history.

```json
{ "content": "Reply with your OTP" }
```

The example returns `HIGH_RISK` with score `75`. Live scan history retains the backend verdict and uses `DANGEROUS` as the display label for `HIGH_RISK`. The response fields are `verdict`, `score`, `link_only`, `notice`, `highlighted_phrases`, `extracted_urls`, `unrolled_urls`, `signals`, `reason`, `action`, and `safety_tip`.

Failed requests leave scan history untouched. Older records affected by the previous default score or automatic fallback are marked **Rescan required**.

The default API base URL is `http://localhost:8000`. Set `VITE_API_BASE_URL` in a local `.env` file if the backend runs at another address and restart Vite.

---

## 💻 Running the Application

### Backend in a PowerShell terminal

From the workspace root, set up a local Python environment and launch the API.

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
.\.venv\Scripts\python.exe -m uvicorn main:app --app-dir backend --port 8000
```

### Frontend in a second PowerShell terminal

```powershell
npm.cmd ci
npm.cmd run dev -- --port 5173 --strictPort
```

Open `http://localhost:5173`. The backend development configuration allows Vite on port 5173.

### Regression checks

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s backend -v
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

---

*Engineered for Build Bengaluru 2.0 Hackathon.*
