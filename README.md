# ScamShield AI 🛡️

## Build Bengaluru 2.0 Hackathon
**Module:** AI Detection, Risk Assessment & Explainability

ScamShield AI is a real-world cybersecurity platform designed to detect suspicious messages, scam attempts, and malicious URLs.

## Key Features
- AI-powered scam detection
- Risk score and threat classification
- Suspicious phrase highlighting
- URL extraction and analysis
- Explainable detection results
- Recommended safety actions

## Project Structure

- `ai_engine/` – AI detection engine
- `tests/` – Automated tests
- `extension/` – Chrome Extension
- `demo_cli.py` – Command-line demonstration
- `requirements.txt` – Python dependencies

## Technology Stack
- Python
- FastAPI
- React
- JavaScript
- Chrome Extension Manifest V3

## Backend API

**Endpoint:** `POST /api/analyze`

Request:

```json
{
  "content": "Reply with your OTP"
}