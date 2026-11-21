/**
 * ScamShield AI - API Communication Service
 * Handles HTTP requests to Miraj's FastAPI backend strictly following the confirmed API contract:
 * 
 * Endpoint: POST https://madonna-mouth-mandate-cole.trycloudflare.com/api/analyze
 * Request JSON: { "content": "..." } (NO extra fields)
 * 
 * Response fields:
 * - verdict, score, link_only, notice, highlighted_phrases, extracted_urls,
 *   unrolled_urls, signals (label, weight), reason, action, safety_tip
 */

import { getConfig } from "./config.js";

/**
 * Custom error types for distinct UI handling.
 */
export class BackendOfflineError extends Error {
  constructor(message, endpoint) {
    super(message);
    this.name = "BackendOfflineError";
    this.endpoint = endpoint;
  }
}

export class ApiRequestError extends Error {
  constructor(message, statusCode, details = null) {
    super(message);
    this.name = "ApiRequestError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Sends content to FastAPI endpoint (POST /api/analyze).
 * 
 * Request payload strictly adheres to Miraj's contract:
 * { "content": "..." }
 * 
 * @param {string} content - Text message or URL to analyze
 * @param {string} inputType - "message" or "url"
 * @param {boolean} useMock - Force return of simulated mock response
 * @returns {Promise<Object>} DetectionResult
 */
export async function analyzeContent(content, inputType = "message", useMock = false) {
  if (!content || !content.trim()) {
    throw new Error("Cannot analyze empty content.");
  }

  const config = await getConfig();

  // If forced mock mode requested for offline demo
  if (useMock) {
    return generateMockDetection(content, inputType);
  }

  const endpointUrl = `${config.backendUrl.replace(/\/+$/, "")}/${config.apiEndpoint.replace(/^\/+/, "")}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.requestTimeoutMs);

  // EXACT payload required by Miraj's API contract (NO extra fields)
  const payload = {
    content: content.trim()
  };

  try {
    const response = await fetch(endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorBody = "";
      try {
        errorBody = await response.text();
      } catch (_) {}
      throw new ApiRequestError(
        `Backend responded with HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorBody
      );
    }

    let data;
    try {
      data = await response.json();
    } catch (parseErr) {
      throw new ApiRequestError(
        "Backend returned an invalid, non-JSON response.",
        response.status,
        parseErr.message
      );
    }

    return normalizeResponse(data, content, inputType);

  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === "AbortError") {
      throw new Error(`Request timed out after ${config.requestTimeoutMs / 1000} seconds. Backend may be overloaded.`);
    }

    if (
      error instanceof TypeError ||
      (error.message && (error.message.includes("fetch") || error.message.includes("NetworkError")))
    ) {
      throw new BackendOfflineError(
        `Backend server is offline or unreachable at ${config.backendUrl}. Please ensure Miraj's FastAPI service is running.`,
        endpointUrl
      );
    }

    // Never interpret an error as safe - bubble it up
    throw error;
  }
}

/**
 * Normalizes and validates the response against Miraj's confirmed API contract.
 * Never interprets an invalid response or error as SAFE.
 */
function normalizeResponse(raw, fallbackTarget, fallbackType) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid response structure received from backend.");
  }

  // Extract score
  const score = typeof raw.score === "number"
    ? Math.max(0, Math.min(100, Math.round(raw.score)))
    : (typeof raw.risk_score === "number" ? Math.max(0, Math.min(100, Math.round(raw.risk_score))) : null);

  if (score === null && !raw.verdict) {
    throw new Error("Backend response missing essential 'score' or 'verdict' fields.");
  }

  const normalizedScore = score !== null ? score : 0;
  const rawVerdict = (raw.verdict || (normalizedScore > 60 ? "SCAM" : normalizedScore > 30 ? "SUSPICIOUS" : "SAFE")).trim();
  const isSafe = rawVerdict.toUpperCase() === "SAFE";

  // Requirement 6: SAFE must display: "No obvious warning signs found."
  const displayVerdict = isSafe ? "No obvious warning signs found." : rawVerdict;

  const riskLevel = raw.risk_level || (normalizedScore > 60 ? "HIGH" : normalizedScore > 30 ? "MEDIUM" : "LOW");

  // Normalize signals: array of { label, weight }
  let signalsList = [];
  if (Array.isArray(raw.signals)) {
    signalsList = raw.signals.map(s => {
      if (typeof s === "string") return { label: s, weight: 15 };
      return {
        label: s.label || s.title || "Warning Signal",
        weight: typeof s.weight === "number" ? s.weight : 15
      };
    });
  } else if (Array.isArray(raw.detected_indicators)) {
    // Fallback if backend returned indicators
    signalsList = raw.detected_indicators.map(ind => ({
      label: ind.title || ind.code || "Warning Signal",
      weight: ind.severity === "CRITICAL" ? 35 : ind.severity === "HIGH" ? 25 : 15
    }));
  }

  // Normalize actions
  let actionList = [];
  if (raw.action) {
    if (Array.isArray(raw.action)) {
      actionList = raw.action;
    } else {
      actionList = [String(raw.action).trim()];
    }
  } else if (Array.isArray(raw.recommendations)) {
    actionList = raw.recommendations;
  } else {
    actionList = isSafe
      ? ["No immediate action needed. Continue following standard safety practices."]
      : ["Do NOT click suspicious links or share sensitive credentials.", "Verify directly through official channels."];
  }

  return {
    is_simulated_mock: false,
    content: fallbackTarget,
    score: normalizedScore,
    risk_score: normalizedScore,
    risk_level: riskLevel,
    verdict: displayVerdict,
    raw_verdict: rawVerdict,
    is_safe: isSafe,
    link_only: typeof raw.link_only === "boolean" ? raw.link_only : (fallbackType === "url"),
    notice: raw.notice ? String(raw.notice).trim() : null,
    highlighted_phrases: Array.isArray(raw.highlighted_phrases) ? raw.highlighted_phrases : [],
    extracted_urls: Array.isArray(raw.extracted_urls) ? raw.extracted_urls : [],
    unrolled_urls: Array.isArray(raw.unrolled_urls) ? raw.unrolled_urls : [],
    signals: signalsList,
    reason: raw.reason ? String(raw.reason).trim() : (raw.explanation ? String(raw.explanation).trim() : ""),
    action: actionList,
    recommendations: actionList,
    safety_tip: raw.safety_tip ? String(raw.safety_tip).trim() : "Always independently verify unexpected communications.",
    disclaimer: raw.disclaimer || "ScamShield AI utilizes heuristic evidence analysis. Always verify transactions through verified official channels."
  };
}

/**
 * Clearly labelled simulated mock response conforming to Miraj's exact contract.
 * Never presented as real detection.
 */
export function generateMockDetection(content, inputType) {
  const lower = content.toLowerCase();

  const isScam = (
    lower.includes("kyc") ||
    lower.includes("block") ||
    lower.includes("otp") ||
    lower.includes("won") ||
    lower.includes("lottery") ||
    lower.includes("bit.ly") ||
    lower.includes("192.168") ||
    lower.includes("emergency")
  );

  if (isScam) {
    const extracted = [];
    const unrolled = [];
    if (lower.includes("http") || lower.includes("bit.ly")) {
      extracted.push("http://bit.ly/sbi-kyc-update");
      unrolled.push("http://192.168.1.50/sbi-phishing/login.php");
    }

    const phrases = [];
    if (lower.includes("block")) phrases.push("account will be blocked");
    if (lower.includes("kyc")) phrases.push("Complete KYC immediately");
    if (lower.includes("otp")) phrases.push("Share your OTP");
    if (lower.includes("won") || lower.includes("lottery")) phrases.push("won Rs 25,00,000");

    return {
      is_simulated_mock: true,
      mock_notice: "⚠️ DEMO SIMULATION: Real FastAPI backend is offline at https://madonna-mouth-mandate-cole.trycloudflare.com. These results are for UI demonstration only.",
      content: content,
      score: 92,
      risk_score: 92,
      risk_level: "HIGH",
      verdict: "High Risk – Highly suspicious scam or phishing pattern detected (SIMULATION)",
      raw_verdict: "SCAM",
      is_safe: false,
      link_only: inputType === "url",
      notice: "Coercive urgency and credential harvesting patterns detected.",
      highlighted_phrases: phrases.length > 0 ? phrases : ["Immediate action required"],
      extracted_urls: extracted,
      unrolled_urls: unrolled,
      signals: [
        { label: "Coercive Account Suspension Threat", weight: 35 },
        { label: "Unsolicited Identity/KYC Request", weight: 30 },
        { label: "High Urgency Pressure Indicator", weight: 15 }
      ],
      reason: "This message uses manufactured urgency threatening immediate lockout and instructs verification via an unverified channel. Legitimate institutions never threaten immediate account suspension via SMS.",
      action: [
        "Do NOT click on any links provided in the message.",
        "Never enter OTPs, passwords, or banking credentials.",
        "Contact your bank or service provider using their official customer care number."
      ],
      recommendations: [
        "Do NOT click on any links provided in the message.",
        "Never enter OTPs, passwords, or banking credentials.",
        "Contact your bank or service provider using their official customer care number."
      ],
      safety_tip: "Banks never ask for OTPs, PINs, or password updates through SMS or WhatsApp links.",
      disclaimer: "SIMULATED RESULT FOR DEMO ONLY. Real FastAPI backend is currently offline."
    };
  }

  // Safe mock simulation
  return {
    is_simulated_mock: true,
    mock_notice: "⚠️ DEMO SIMULATION: Real FastAPI backend is offline at https://madonna-mouth-mandate-cole.trycloudflare.com. These results are for UI demonstration only.",
    content: content,
    score: 8,
    risk_score: 8,
    risk_level: "LOW",
    verdict: "No obvious warning signs found.",
    raw_verdict: "SAFE",
    is_safe: true,
    link_only: inputType === "url",
    notice: null,
    highlighted_phrases: [],
    extracted_urls: [],
    unrolled_urls: [],
    signals: [],
    reason: "No suspicious scam indicators or deceptive links were detected in this sample content.",
    action: [
      "No immediate action needed. Continue following standard safety practices."
    ],
    recommendations: [
      "No immediate action needed. Continue following standard safety practices."
    ],
    safety_tip: "Always inspect unexpected links and messages before sharing any information.",
    disclaimer: "SIMULATED RESULT FOR DEMO ONLY. Real FastAPI backend is currently offline."
  };
}
