import { analyzeMessage, analyzeUrl, analyzeCombined, generateInvestigationResponse } from '../utils/demoAnalyzer.js';

const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '');

export const ENDPOINTS = {
  ANALYZE: `${API_BASE_URL}/api/analyze`,
  SCAN_SCREENSHOT: `${API_BASE_URL}/api/scan/screenshot`,
  INVESTIGATE: `${API_BASE_URL}/api/investigate`,
  FEEDBACK: `${API_BASE_URL}/api/feedback`
};

const classifications = new Map([
  ['HIGH_RISK', 'DANGEROUS'],
  ['SUSPICIOUS', 'SUSPICIOUS'],
  ['SAFE', 'SAFE']
]);

const isStringList = (value) => Array.isArray(value) && value.every(item => typeof item === 'string');

// AUTO and LIVE both require a backend result. DEMO is the only local scan mode.
let activeMode = 'AUTO';

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

function validateAnalysis(data) {
  if (
    !data || typeof data !== 'object' || Object.keys(data).length !== 11 ||
    !classifications.has(data.verdict) ||
    !Number.isInteger(data.score) || data.score < 0 || data.score > 100 ||
    typeof data.link_only !== 'boolean' ||
    (data.notice !== null && typeof data.notice !== 'string') ||
    !isStringList(data.highlighted_phrases) ||
    !isStringList(data.extracted_urls) ||
    !isStringList(data.unrolled_urls) ||
    !Array.isArray(data.signals) ||
    !data.signals.every(signal => signal && typeof signal.label === 'string' && Number.isInteger(signal.weight)) ||
    typeof data.reason !== 'string' ||
    typeof data.action !== 'string' ||
    typeof data.safety_tip !== 'string'
  ) {
    throw new Error('The scan server returned an invalid result. Please try again.');
  }
  return data;
}

async function requestAnalysis(content, timeoutMs = 4000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(ENDPOINTS.ANALYZE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
      signal: controller.signal
    }).catch(cause => {
      throw new Error('Could not connect to the scan server. Check the backend connection and try again.', { cause });
    });

    if (response.status === 422) {
      throw new Error('The scan server rejected the input (HTTP 422). Enter between 1 and 5,000 characters.');
    }
    if (!response.ok) {
      throw new Error(`The scan server returned HTTP ${response.status}. Please try again.`);
    }

    const data = await response.json().catch(cause => {
      throw new Error('The scan server response was not valid JSON. Please try again.', { cause });
    });
    return validateAnalysis(data);
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error('The scan server request timed out. Please try again.', { cause: error });
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function checkBackendStatus() {
  if (activeMode === 'DEMO') {
    return { online: false, demo: true, reason: 'Demo mode is active.' };
  }
  try {
    await requestAnalysis('Hello', 2000);
    return { online: true, url: API_BASE_URL };
  } catch (error) {
    return { online: false, reason: error.message };
  }
}

async function scanLive(content, type, target = content) {
  const data = await requestAnalysis(content);
  if (type === 'url' && (!data.link_only || data.extracted_urls.length === 0)) {
    throw new Error('The scan server could not analyze this input as a web address. Enter a URL beginning with http:// or https://.');
  }
  return {
    ...data,
    id: `scan-${Date.now()}`,
    type,
    target,
    classification: classifications.get(data.verdict),
    riskScore: data.score,
    summary: data.reason,
    indicators: { suspiciousPhrases: data.highlighted_phrases },
    explanation: data.reason,
    recommendation: data.action,
    source: 'FASTAPI_ANALYZE',
    isLive: true,
    analyzedAt: new Date().toISOString()
  };
}

export async function scanMessageApi(text, options = {}) {
  if (!text?.trim()) {
    throw new Error('Please enter a message to scan.');
  }
  if (activeMode === 'DEMO') {
    return { ...analyzeMessage(text, options), isLive: false };
  }
  return scanLive(text, 'message');
}

export async function scanUrlApi(url) {
  if (!url?.trim()) {
    throw new Error('Please enter a URL to scan.');
  }
  if (activeMode === 'DEMO') {
    return { ...analyzeUrl(url), isLive: false };
  }
  return scanLive(url, 'url');
}

export async function scanCombinedApi(text = '', url = '') {
  const parts = [text, url].filter(part => part?.trim());
  if (!parts.length) {
    throw new Error('Please provide at least a message or a URL for combined analysis.');
  }
  if (activeMode === 'DEMO') {
    return { ...analyzeCombined(text ?? '', url ?? ''), isLive: false };
  }
  return scanLive(parts.join('\n'), 'combined', parts.join(' | '));
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
        ocrConfidence: data.ocr_confidence ?? 90
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
