/**
 * ScamShield AI - Backend Integration Service
 * 
 * Target Backend: FastAPI (Python)
 * Configurable via environment variable: VITE_API_BASE_URL
 * 
 * ============================================================================
 * EXPECTED FASTAPI CONTRACT (FOR BACKEND TEAM):
 * ============================================================================
 * 
 * 1. Health Check:
 *    GET /api/health
 *    Response: { "status": "ok", "version": "1.0.0", "model": "scamshield-gemini" }
 * 
 * 2. Scan Message / Multilingual:
 *    POST /api/scan/message
 *    Request Body:  { "text": "...", "language": "auto" | "en" | "hi" | "kn" | "hinglish" }
 *    Response Body: {
 *      "risk_score": 92,
 *      "classification": "DANGEROUS",
 *      "indicators": {
 *        "suspicious_phrases": ["..."],
 *        "urgency_indicators": ["..."],
 *        "impersonation": ["..."],
 *        "url_characteristics": ["..."]
 *      },
 *      "language": { "code": "hi", "name": "Hindi", "confidence": 95 },
 *      "explanation": "...",
 *      "recommendation": "..."
 *    }
 * 
 * 3. Scan URL / Advanced Intelligence:
 *    POST /api/scan/url
 *    Request Body:  { "url": "..." }
 *    Response Body: {
 *      "risk_score": 88,
 *      "classification": "DANGEROUS",
 *      "domain_details": { "hostname": "...", "protocol": "...", "tld": "..." },
 *      "indicators": { ... },
 *      "advanced_intelligence": {
 *        "observed_traits": ["..."],
 *        "heuristic_indicators": ["..."],
 *        "threat_intel_status": "..."
 *      }
 *    }
 * 
 * 4. Combined Scan:
 *    POST /api/scan/combined
 *    Request Body:  { "text": "...", "url": "..." }
 * 
 * 5. Screenshot OCR & Scan:
 *    POST /api/scan/screenshot
 *    Request Body:  FormData with multipart 'file'
 *    Response Body: {
 *      "extracted_text": "...",
 *      "ocr_confidence": 92,
 *      "risk_score": 90,
 *      "classification": "DANGEROUS",
 *      ...
 *    }
 * 
 * 6. AI Investigation Assistant:
 *    POST /api/investigate
 *    Request Body:  { "query": "...", "scan_context": { ... } }
 *    Response Body: { "response": "..." }
 * 
 * 7. Feedback & Threat Intel:
 *    POST /api/feedback
 *    Request Body:  { "scan_id": "...", "type": "...", "comments": "..." }
 * ============================================================================
 */

import { analyzeMessage, analyzeUrl, analyzeCombined, generateInvestigationResponse } from '../utils/demoAnalyzer';

// Configurable backend base URL (from .env or default localhost:8000)
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '');

// Endpoints map
export const ENDPOINTS = {
  HEALTH: `${API_BASE_URL}/api/health`,
  HEALTH_ALT: `${API_BASE_URL}/health`,
  SCAN_MESSAGE: `${API_BASE_URL}/api/scan/message`,
  SCAN_URL: `${API_BASE_URL}/api/scan/url`,
  SCAN_COMBINED: `${API_BASE_URL}/api/scan/combined`,
  SCAN_SCREENSHOT: `${API_BASE_URL}/api/scan/screenshot`,
  INVESTIGATE: `${API_BASE_URL}/api/investigate`,
  FEEDBACK: `${API_BASE_URL}/api/feedback`
};

// Mode storage (allows manual toggle between AUTO, DEMO ONLY, and LIVE ONLY)
let activeMode = 'AUTO'; // 'AUTO' | 'DEMO' | 'LIVE'

export function setApiMode(mode) {
  if (['AUTO', 'DEMO', 'LIVE'].includes(mode)) {
    activeMode = mode;
  }
}

export function getApiMode() {
  return activeMode;
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}

/**
 * Checks if the FastAPI backend is currently online and reachable.
 */
export async function checkBackendStatus() {
  if (activeMode === 'DEMO') {
    return { online: false, reason: 'Manually set to Demo Mode' };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

  try {
    let response;
    try {
      response = await fetch(ENDPOINTS.HEALTH, { signal: controller.signal });
    } catch {
      response = await fetch(ENDPOINTS.HEALTH_ALT, { signal: controller.signal });
    }
    clearTimeout(timeoutId);

    if (response && response.ok) {
      const data = await response.json().catch(() => ({}));
      return { online: true, url: API_BASE_URL, data };
    }
    return { online: false, reason: `Server returned status ${response?.status}` };
  } catch (err) {
    clearTimeout(timeoutId);
    return { online: false, reason: err.name === 'AbortError' ? 'Connection timed out' : 'Backend offline or unreachable' };
  }
}

/**
 * Normalizes FastAPI snake_case response to frontend camelCase contract
 */
function normalizeBackendResponse(data, fallbackType, target) {
  return {
    id: data.id || `scan-${Date.now()}`,
    type: fallbackType,
    target: target,
    riskScore: data.risk_score ?? data.riskScore ?? 0,
    classification: (data.classification || 'SAFE').toUpperCase(),
    summary: data.summary || `Scan completed via live model`,
    indicators: {
      suspiciousPhrases: data.indicators?.suspicious_phrases || data.indicators?.suspiciousPhrases || [],
      urgencyIndicators: data.indicators?.urgency_indicators || data.indicators?.urgencyIndicators || [],
      impersonation: data.indicators?.impersonation || [],
      urlCharacteristics: data.indicators?.url_characteristics || data.indicators?.urlCharacteristics || []
    },
    advancedIntelligence: data.advanced_intelligence || null,
    domainDetails: data.domain_details || null,
    language: data.language || null,
    explanation: data.explanation || 'Analyzed by live backend inference model.',
    recommendation: data.recommendation || 'Follow standard cyber safety hygiene.',
    source: 'FASTAPI_LIVE_MODEL',
    isLive: true,
    analyzedAt: new Date().toISOString()
  };
}

/**
 * Scan a message text with optional language preference.
 */
export async function scanMessageApi(text, options = {}) {
  if (!text || !text.trim()) {
    throw new Error('Please enter a message to scan.');
  }

  if (activeMode === 'DEMO') {
    await new Promise(r => setTimeout(r, 550));
    return { ...analyzeMessage(text, options), isLive: false };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(ENDPOINTS.SCAN_MESSAGE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, ...options }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`FastAPI responded with HTTP ${response.status}`);
    }

    const json = await response.json();
    return normalizeBackendResponse(json, 'message', text);
  } catch (err) {
    console.warn(`[ScamShield] FastAPI backend unreachable at ${ENDPOINTS.SCAN_MESSAGE}. Using local Demo Heuristic Engine. Reason:`, err.message);

    if (activeMode === 'LIVE') {
      throw new Error(`Failed to reach FastAPI backend at ${API_BASE_URL}. Ensure your backend server is running.`, { cause: err });
    }

    await new Promise(r => setTimeout(r, 550));
    return {
      ...analyzeMessage(text, options),
      isLive: false,
      fallbackNotice: `Backend offline (${err.message}). Evaluated using ScamShield Local Heuristic Engine.`
    };
  }
}

/**
 * Scan a URL string with Advanced Intelligence.
 */
export async function scanUrlApi(url) {
  if (!url || !url.trim()) {
    throw new Error('Please enter a URL to scan.');
  }

  if (activeMode === 'DEMO') {
    await new Promise(r => setTimeout(r, 550));
    return { ...analyzeUrl(url), isLive: false };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(ENDPOINTS.SCAN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`FastAPI responded with HTTP ${response.status}`);
    }

    const json = await response.json();
    return normalizeBackendResponse(json, 'url', url);
  } catch (err) {
    console.warn(`[ScamShield] FastAPI backend unreachable at ${ENDPOINTS.SCAN_URL}. Using local Demo Heuristic Engine. Reason:`, err.message);

    if (activeMode === 'LIVE') {
      throw new Error(`Failed to reach FastAPI backend at ${API_BASE_URL}. Ensure your backend server is running.`, { cause: err });
    }

    await new Promise(r => setTimeout(r, 550));
    return {
      ...analyzeUrl(url),
      isLive: false,
      fallbackNotice: `Backend offline (${err.message}). Evaluated using ScamShield Local Heuristic Engine.`
    };
  }
}

/**
 * Scan a message and its associated URL together.
 */
export async function scanCombinedApi(text, url) {
  if (!text?.trim() && !url?.trim()) {
    throw new Error('Please provide at least a message or a URL for combined analysis.');
  }

  if (activeMode === 'DEMO') {
    await new Promise(r => setTimeout(r, 650));
    return { ...analyzeCombined(text, url), isLive: false };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(ENDPOINTS.SCAN_COMBINED, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, url }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`FastAPI responded with HTTP ${response.status}`);
    }

    const json = await response.json();
    return normalizeBackendResponse(json, 'combined', `${text.slice(0, 80)}... | ${url}`);
  } catch (err) {
    console.warn(`[ScamShield] FastAPI backend unreachable at ${ENDPOINTS.SCAN_COMBINED}. Using local Demo Heuristic Engine. Reason:`, err.message);

    if (activeMode === 'LIVE') {
      throw new Error(`Failed to reach FastAPI backend at ${API_BASE_URL}. Ensure your backend server is running.`, { cause: err });
    }

    await new Promise(r => setTimeout(r, 650));
    return {
      ...analyzeCombined(text, url),
      isLive: false,
      fallbackNotice: `Backend offline (${err.message}). Evaluated using ScamShield Local Heuristic Engine.`
    };
  }
}

/**
 * Upload and extract text from a screenshot file.
 */
export async function scanScreenshotApi(file) {
  if (!file) {
    throw new Error('Please provide an image file.');
  }

  if (activeMode === 'DEMO') {
    // Demo mode: Return fallback indicator so user can review/edit text manually
    return { success: false, fallback: true, message: 'Running in Demo Mode. Please review the image and verify or enter the text manually.' };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(ENDPOINTS.SCAN_SCREENSHOT, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        extractedText: data.extracted_text || '',
        ocrConfidence: data.ocr_confidence ?? 90,
        scanResult: data.risk_score !== undefined ? normalizeBackendResponse(data, 'screenshot', file.name) : null
      };
    }
    return { success: false, fallback: true, message: `FastAPI OCR returned HTTP ${response.status}. Using manual text input fallback.` };
  } catch {
    return { success: false, fallback: true, message: 'FastAPI OCR endpoint offline. Please enter or verify the message text from your screenshot below.' };
  }
}

/**
 * Query the AI Investigation Assistant.
 */
export async function queryInvestigationAi(query, scanContext) {
  if (!query?.trim()) {
    throw new Error('Please enter a question.');
  }

  if (activeMode === 'DEMO') {
    await new Promise(r => setTimeout(r, 600));
    return {
      response: generateInvestigationResponse(query, scanContext),
      isLive: false,
      source: 'DEMO_HEURISTIC_ADVISORY'
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(ENDPOINTS.INVESTIGATE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, scan_context: scanContext }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      return {
        response: data.response || data.answer || '',
        isLive: true,
        source: 'FASTAPI_LLM'
      };
    }
    throw new Error(`Investigation API returned HTTP ${response.status}`);
  } catch (err) {
    console.warn(`[ScamShield] Investigation endpoint unavailable. Falling back to local advisory engine. Reason:`, err.message);
    await new Promise(r => setTimeout(r, 600));
    return {
      response: generateInvestigationResponse(query, scanContext),
      isLive: false,
      source: 'DEMO_HEURISTIC_ADVISORY'
    };
  }
}

/**
 * Submit feedback on scan accuracy or false positives.
 */
export async function submitFeedbackApi(feedback) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(ENDPOINTS.FEEDBACK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedback),
      signal: controller.signal
    });
    clearTimeout(timeout);
    return response.ok;
  } catch {
    // If backend is offline, feedback is recorded locally in localStorage
    return false;
  }
}
