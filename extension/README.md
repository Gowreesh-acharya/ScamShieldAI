# ScamShield AI – Chrome Extension (Manifest V3)
### Build Bengaluru 2.0 Hackathon | Module: Chrome Extension & AI Integration

Engineered by: **Santhosh**  
Backend Lead: **Mohammed Meraj Khan (FastAPI)**  
Frontend Lead: **Gowreesh (React App)**

---

## 1. Confirmed Backend API Integration Contract

The extension communicates with Miraj's FastAPI backend using the following contract:

### Endpoint
- **Method:** `POST`
- **Path:** `/api/analyze`
- **Default Base URL:** `http://127.0.0.1:8000`
- **Full Endpoint:** `http://127.0.0.1:8000/api/analyze`

### Exact Request JSON Payload
```json
{
  "content": "user's selected text or link"
}
```
*(No extra or extraneous fields are sent).*

### Response JSON Fields
| Field | Type | Description |
| :--- | :--- | :--- |
| `verdict` | `string` | Classification (e.g. `"SCAM"`, `"SUSPICIOUS"`, or `"SAFE"`). When SAFE, the UI displays *"No obvious warning signs found."* |
| `score` | `number` | Risk score from `0` to `100` (rendered in SVG circular gauge & segmented scale). |
| `link_only` | `boolean` | Indicates whether content was evaluated as a link only. |
| `notice` | `string` | Optional advisory/system notice (or null). |
| `highlighted_phrases` | `string[]` | Specific quoted phrases flagged as evidence. |
| `extracted_urls` | `string[]` | Suspicious URLs identified in content (**strictly non-clickable** for user protection). |
| `unrolled_urls` | `string[]` / `object[]` | Expanded destination destinations from shorteners (**strictly non-clickable**). |
| `signals` | `{ label, weight }[]` | List of triggered warning signals with numeric risk penalty weights. |
| `reason` | `string` | Plain-language AI explanation of why content is flagged. |
| `action` | `string[]` / `string` | Concrete recommended steps the user should take immediately. |
| `safety_tip` | `string` | Defensive cybersecurity advisory. |

---

## 2. Installation Instructions (Chrome)

1. Open **Google Chrome**.
2. In the address bar, navigate to:
   ```text
   chrome://extensions
   ```
3. Enable **Developer mode** using the toggle switch in the top-right corner.
4. Click the **Load unpacked** button in the top-left corner.
5. In the folder picker, select the `extension` directory inside your workspace:
   ```text
   C:\Users\DELL\Documents\ScamShield-AI\extension
   ```
6. **ScamShield AI** will now appear in your active extensions list!
7. *(Recommended)* Click the puzzle piece (Extensions) icon in Chrome's toolbar and **pin** ScamShield AI for quick access.

---

## 3. How to Test the Extension

### Test 1: Context Menu on Selected Text
1. Open any webpage (e.g., news article or email client).
2. Highlight a suspicious message:
   > *"Dear SBI user, your account will be blocked today. Complete KYC immediately at http://bit.ly/sbi-kyc"*
3. Right-click the highlighted text and select **"Check with ScamShield"**.
4. The Chrome Side Panel will open on the right, displaying the captured text.
5. Click **"Scan with ScamShield"** (or press <kbd>Ctrl</kbd> + <kbd>Enter</kbd>).

### Test 2: Context Menu on Links
1. Right-click any hyperlink on a webpage (e.g., `http://192.168.1.50/sbi-login.php`).
2. Select **"Check with ScamShield"**.
3. The side panel automatically captures the destination link (`linkUrl`) and tags it with a **`LINK / URL`** badge.
4. Click **"Scan with ScamShield"**.

### Test 3: Simulated Demo Mode (When Backend is Offline)
1. If Miraj's FastAPI server is not currently running, clicking **Scan** will show the **Backend Offline** diagnostic.
2. Click **"Run Simulated Demo"** to preview the full risk assessment report with:
   - High-contrast amber demo banner clearly marking results as simulated.
   - Circular SVG gauge & segmented risk bar.
   - Signals list with risk weights (`+35`, `+30`, `+15`).
   - Non-clickable intercepted URLs.
   - Reason narrative, recommended action, and defensive safety tip.

---

## 4. Backend Configuration & Troubleshooting

Click the **Settings (gear)** icon in the side panel header:
- **FastAPI Host URL:** Default `http://127.0.0.1:8000` (can be changed to `http://localhost:8000` or a remote server URL).
- **Analysis Endpoint Path:** Default `/api/analyze`.
- **Demo Fallback Toggle:** Enable or disable simulated demo fallback when backend is offline.
