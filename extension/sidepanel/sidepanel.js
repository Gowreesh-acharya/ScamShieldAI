/**
 * ScamShield AI - Commercial Security Extension Controller
 * Handles user interactions, state transitions, Protection Center capabilities,
 * and renders detection reports strictly adhering to Miraj's confirmed API contract:
 * 
 * Response fields:
 * - verdict ("No obvious warning signs found." if SAFE)
 * - score (0-100)
 * - link_only (boolean)
 * - notice (advisory text)
 * - highlighted_phrases (evidence)
 * - extracted_urls (non-clickable)
 * - unrolled_urls (non-clickable)
 * - signals (label, weight)
 * - reason (explanation)
 * - action (recommended steps)
 * - safety_tip (defensive advice)
 */

import { analyzeContent, BackendOfflineError } from "../services/api.js";
import { getConfig, saveConfig, DEFAULT_CONFIG } from "../services/config.js";

// DOM Element References - Scanner View
const contentInput = document.getElementById("contentInput");
const contentTypeBadge = document.getElementById("contentTypeBadge");
const linkOnlyBadge = document.getElementById("linkOnlyBadge");
const contentSourceInfo = document.getElementById("contentSourceInfo");
const scanBtn = document.getElementById("scanBtn");
const clearBtn = document.getElementById("clearBtn");

const loadingState = document.getElementById("loadingState");
const emptyState = document.getElementById("emptyState");
const errorState = document.getElementById("errorState");
const errorTitle = document.getElementById("errorTitle");
const errorMessage = document.getElementById("errorMessage");
const retryScanBtn = document.getElementById("retryScanBtn");
const simulateMockBtn = document.getElementById("simulateMockBtn");

// Results Elements
const resultState = document.getElementById("resultState");
const mockNoticeBanner = document.getElementById("mockNoticeBanner");
const apiNoticeCard = document.getElementById("apiNoticeCard");
const apiNoticeText = document.getElementById("apiNoticeText");

const scoreCard = document.getElementById("scoreCard");
const riskScoreNumber = document.getElementById("riskScoreNumber");
const riskScoreBar = document.getElementById("riskScoreBar");
const riskCircleMeter = document.getElementById("riskCircleMeter");
const riskLevelBadge = document.getElementById("riskLevelBadge");
const resultVerdict = document.getElementById("resultVerdict");
const scamCategoryTag = document.getElementById("scamCategoryTag");

const indicatorCountBadge = document.getElementById("indicatorCountBadge");
const indicatorsList = document.getElementById("indicatorsList");

const highlightedPhrasesCard = document.getElementById("highlightedPhrasesCard");
const highlightedPhrasesList = document.getElementById("highlightedPhrasesList");

const urlsSectionCard = document.getElementById("urlsSectionCard");
const urlsList = document.getElementById("urlsList");

const explanationCard = document.getElementById("explanationCard");
const explanationText = document.getElementById("explanationText");

const recommendationsCard = document.getElementById("recommendationsCard");
const recommendationsList = document.getElementById("recommendationsList");

const safetyTipCard = document.getElementById("safetyTipCard");
const safetyTipText = document.getElementById("safetyTipText");

const disclaimerText = document.getElementById("disclaimerText");

// Settings Elements
const settingsToggleBtn = document.getElementById("settingsToggleBtn");
const settingsPanel = document.getElementById("settingsPanel");
const closeSettingsBtn = document.getElementById("closeSettingsBtn");
const cfgBackendUrl = document.getElementById("cfgBackendUrl");
const cfgApiEndpoint = document.getElementById("cfgApiEndpoint");
const cfgMockFallback = document.getElementById("cfgMockFallback");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");
const resetSettingsBtn = document.getElementById("resetSettingsBtn");
const settingsFeedback = document.getElementById("settingsFeedback");

// Navigation Tabs
const navTabs = document.querySelectorAll(".nav-tab");
const tabPanes = document.querySelectorAll(".tab-pane");

// State
let currentInputType = "message";

// ==========================================
// 1. INITIALIZATION & SESSION RESTORE
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
  console.log("[ScamShield SidePanel] Initialized DOM.");
  initNavigationTabs();
  initProtectionCenterFeatures();
  await loadSettingsUI();
  await checkPendingScan();

  // Listen for real-time messages from background service worker
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "CONTENT_CAPTURED" && message.payload) {
      console.log("[ScamShield SidePanel] Received message CONTENT_CAPTURED:", message.payload);
      applyCapturedContent(message.payload);
    }
  });

  // Listen for session storage changes if message arrived before listener attached
  if (chrome.storage && chrome.storage.session && chrome.storage.session.onChanged) {
    chrome.storage.session.onChanged.addListener((changes) => {
      if (changes.pendingScan && changes.pendingScan.newValue) {
        console.log("[ScamShield SidePanel] Received storage.session update:", changes.pendingScan.newValue);
        applyCapturedContent(changes.pendingScan.newValue);
      }
    });
  }
});

// Navigation Tab Management
function initNavigationTabs() {
  navTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const targetId = tab.dataset.tab;
      switchTab(targetId);
    });
  });

  const openEmergencyBtn = document.getElementById("openEmergencyTabBtn");
  if (openEmergencyBtn) {
    openEmergencyBtn.addEventListener("click", () => switchTab("tabEmergency"));
  }
}

function switchTab(tabId) {
  navTabs.forEach((t) => t.classList.toggle("active", t.dataset.tab === tabId));
  tabPanes.forEach((p) => p.classList.toggle("active", p.id === tabId));
}

async function checkPendingScan() {
  try {
    const sessionData = await chrome.storage.session.get("pendingScan");
    if (sessionData && sessionData.pendingScan) {
      applyCapturedContent(sessionData.pendingScan);
    }
  } catch (err) {
    console.warn("[SidePanel] Could not read pendingScan from session storage:", err);
  }
}

function applyCapturedContent(payload) {
  // Ensure we are viewing the primary Scanner tab
  switchTab("tabScanner");

  contentInput.value = payload.content || "";
  currentInputType = payload.inputType || "message";

  contentTypeBadge.textContent = currentInputType === "url" ? "LINK / URL" : "TEXT MESSAGE";
  if (linkOnlyBadge) {
    if (currentInputType === "url") {
      linkOnlyBadge.classList.remove("hidden");
    } else {
      linkOnlyBadge.classList.add("hidden");
    }
  }

  if (payload.pageTitle || payload.pageUrl) {
    contentSourceInfo.textContent = `Source: ${payload.pageTitle || payload.pageUrl}`;
    contentSourceInfo.title = payload.pageUrl;
  } else {
    contentSourceInfo.textContent = "Captured from page";
  }

  // Show captured content and invite user to confirm with Scan button
  hideAllStates();
  scanBtn.focus();
}

// ==========================================
// 2. SCANNING & API WORKFLOW
// ==========================================
scanBtn.addEventListener("click", () => triggerScan(false));
retryScanBtn.addEventListener("click", () => triggerScan(false));
simulateMockBtn.addEventListener("click", () => triggerScan(true));

// Allow Ctrl+Enter or Cmd+Enter to quickly trigger scan
contentInput.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    triggerScan(false);
  }
});

async function triggerScan(forceMock = false) {
  const content = contentInput.value.trim();

  if (!content) {
    showError("Empty Content", "Please select text on a webpage or type/paste content into the box above.");
    return;
  }

  // Prevent accidental double submissions
  scanBtn.disabled = true;

  // Auto-detect if user edited the box to be a single URL
  if (content.startsWith("http://") || content.startsWith("https://") || (content.includes(".") && !content.includes(" "))) {
    currentInputType = "url";
    contentTypeBadge.textContent = "LINK / URL";
  } else {
    currentInputType = "message";
    contentTypeBadge.textContent = "TEXT MESSAGE";
  }

  // Show Loading State
  hideAllStates();
  loadingState.classList.remove("hidden");

  try {
    const result = await analyzeContent(content, currentInputType, forceMock);
    hideAllStates();
    renderResults(result);
  } catch (error) {
    hideAllStates();
    if (error instanceof BackendOfflineError) {
      showError(
        "Backend Offline",
        `FastAPI service is unreachable at ${error.endpoint}. Start Miraj's backend or try the simulated demo below.`
      );
    } else {
      showError("Analysis Failed", error.message || "An unexpected error occurred during analysis.");
    }
  } finally {
    scanBtn.disabled = false;
  }
}

// ==========================================
// 3. RESULT RENDERING (MIRAJ'S API CONTRACT)
// ==========================================
function renderResults(data) {
  resultState.classList.remove("hidden");

  // Mock notice banner
  if (data.is_simulated_mock) {
    mockNoticeBanner.classList.remove("hidden");
  } else {
    mockNoticeBanner.classList.add("hidden");
  }

  // Backend Notice (if present)
  if (data.notice && String(data.notice).trim()) {
    apiNoticeText.textContent = data.notice;
    apiNoticeCard.classList.remove("hidden");
  } else {
    apiNoticeCard.classList.add("hidden");
  }

  // Link-only badge
  if (data.link_only) {
    linkOnlyBadge.classList.remove("hidden");
  } else {
    linkOnlyBadge.classList.add("hidden");
  }

  const score = Math.max(0, Math.min(100, data.score !== undefined ? data.score : (data.risk_score || 0)));
  riskScoreNumber.textContent = score;
  riskScoreBar.style.width = `${score}%`;

  // Circular Gauge update
  const circleMeter = document.getElementById("riskCircleMeter");
  if (circleMeter) {
    const circumference = 2 * Math.PI * 42; // ≈ 263.89
    circleMeter.style.strokeDasharray = `${circumference}`;
    const offset = circumference - (score / 100) * circumference;
    circleMeter.style.strokeDashoffset = `${offset}`;
  }

  // Classification is driven exclusively by the backend verdict via data.risk_level.
  // The numerical score is informational only — it must NOT override the verdict label or badge.
  const level = (data.risk_level || "LOW").toUpperCase();
  scoreCard.className = "card score-card";
  riskScoreBar.className = "progress-bar-fill";
  riskLevelBadge.className = "risk-pill";

  if (level === "HIGH") {
    scoreCard.style.borderTopColor = "var(--risk-high)";
    if (circleMeter) circleMeter.style.stroke = "var(--risk-high)";
    riskScoreBar.classList.add("bar-high");
    riskLevelBadge.classList.add("risk-high");
    riskLevelBadge.textContent = "HIGH RISK";
  } else if (level === "MEDIUM") {
    scoreCard.style.borderTopColor = "var(--risk-medium)";
    if (circleMeter) circleMeter.style.stroke = "var(--risk-medium)";
    riskScoreBar.classList.add("bar-medium");
    riskLevelBadge.classList.add("risk-medium");
    riskLevelBadge.textContent = "MEDIUM RISK";
  } else {
    scoreCard.style.borderTopColor = "var(--risk-low)";
    if (circleMeter) circleMeter.style.stroke = "var(--risk-low)";
    riskScoreBar.classList.add("bar-low");
    riskLevelBadge.classList.add("risk-low");
    riskLevelBadge.textContent = "LOW RISK";
  }

  // Requirement: SAFE must display: "No obvious warning signs found."
  if (data.is_safe || data.raw_verdict === "SAFE" || (data.verdict && data.verdict.toUpperCase().includes("SAFE"))) {
    resultVerdict.textContent = "No obvious warning signs found.";
  } else {
    resultVerdict.textContent = data.verdict || "Threat Analysis Complete";
  }

  // Category Tag (if provided)
  if (data.scam_category) {
    scamCategoryTag.textContent = data.scam_category;
    scamCategoryTag.classList.remove("hidden");
  } else {
    scamCategoryTag.classList.add("hidden");
  }

  // Signals (label, weight)
  indicatorsList.innerHTML = "";
  const signals = data.signals || [];
  indicatorCountBadge.textContent = signals.length;

  if (signals.length === 0) {
    const cleanItem = document.createElement("div");
    cleanItem.className = "signal-item";
    cleanItem.style.borderLeftColor = "var(--risk-low)";
    cleanItem.innerHTML = `
      <span class="signal-label">No overt scam or malicious URL patterns identified.</span>
      <span class="signal-weight-badge">+0</span>
    `;
    indicatorsList.appendChild(cleanItem);
  } else {
    signals.forEach((sig) => {
      const item = document.createElement("div");
      item.className = "signal-item";

      const weight = typeof sig.weight === "number" ? sig.weight : 15;
      let weightClass = "signal-weight-low";
      if (weight >= 30) {
        item.style.borderLeftColor = "var(--risk-high)";
        weightClass = "signal-weight-high";
      } else if (weight >= 15) {
        item.style.borderLeftColor = "var(--risk-medium)";
        weightClass = "signal-weight-med";
      } else {
        item.style.borderLeftColor = "var(--secondary-cyan)";
      }

      item.innerHTML = `
        <span class="signal-label">${escapeHtml(sig.label || "Warning Signal")}</span>
        <span class="signal-weight-badge ${weightClass}">+${weight}</span>
      `;
      indicatorsList.appendChild(item);
    });
  }

  // Highlighted Evidence Phrases
  const phrases = data.highlighted_phrases || [];
  if (phrases.length > 0) {
    highlightedPhrasesList.innerHTML = "";
    phrases.forEach((phrase) => {
      const pill = document.createElement("span");
      pill.className = "phrase-pill";
      pill.textContent = `"${phrase}"`;
      highlightedPhrasesList.appendChild(pill);
    });
    highlightedPhrasesCard.classList.remove("hidden");
  } else {
    highlightedPhrasesCard.classList.add("hidden");
  }

  // Extracted & Unrolled URLs (STRICTLY NON-CLICKABLE)
  const extractedUrls = data.extracted_urls || [];
  const unrolledUrls = data.unrolled_urls || [];
  if (extractedUrls.length > 0 || unrolledUrls.length > 0) {
    urlsList.innerHTML = "";

    if (unrolledUrls.length > 0) {
      unrolledUrls.forEach((uItem, index) => {
        const itemBox = document.createElement("div");
        itemBox.className = "url-item-box";

        if (typeof uItem === "object" && uItem.original && uItem.unrolled) {
          itemBox.innerHTML = `
            <div class="unrolled-pair">
              <div>Detected: <code>${escapeHtml(uItem.original)}</code></div>
              <div class="unrolled-arrow">➔ Destination:</div>
              <div class="unrolled-dest"><code>${escapeHtml(uItem.unrolled)}</code></div>
            </div>
          `;
        } else if (extractedUrls[index] && extractedUrls[index] !== uItem) {
          itemBox.innerHTML = `
            <div class="unrolled-pair">
              <div>Detected: <code>${escapeHtml(extractedUrls[index])}</code></div>
              <div class="unrolled-arrow">➔ Destination:</div>
              <div class="unrolled-dest"><code>${escapeHtml(String(uItem))}</code></div>
            </div>
          `;
        } else {
          itemBox.innerHTML = `<div>Destination: <code>${escapeHtml(String(uItem))}</code></div>`;
        }
        urlsList.appendChild(itemBox);
      });
    } else {
      extractedUrls.forEach((u) => {
        const itemBox = document.createElement("div");
        itemBox.className = "url-item-box";
        itemBox.innerHTML = `<div>Detected: <code>${escapeHtml(u)}</code></div>`;
        urlsList.appendChild(itemBox);
      });
    }
    urlsSectionCard.classList.remove("hidden");
  } else {
    urlsSectionCard.classList.add("hidden");
  }

  // Reason (Analysis Explanation)
  if (data.reason && String(data.reason).trim()) {
    explanationText.textContent = data.reason;
    explanationCard.classList.remove("hidden");
  } else {
    explanationCard.classList.add("hidden");
  }

  // Action (Recommended Next Steps)
  recommendationsList.innerHTML = "";
  const actions = (data.action && data.action.length > 0)
    ? (Array.isArray(data.action) ? data.action : [data.action])
    : (data.recommendations || ["No immediate action needed. Continue following standard safety practices."]);

  actions.forEach((act) => {
    const li = document.createElement("li");
    li.textContent = act;
    recommendationsList.appendChild(li);
  });

  // Safety Tip
  if (data.safety_tip && String(data.safety_tip).trim()) {
    safetyTipText.textContent = data.safety_tip;
    safetyTipCard.classList.remove("hidden");
  } else {
    safetyTipCard.classList.add("hidden");
  }

  // Disclaimer
  disclaimerText.textContent = data.disclaimer || "ScamShield AI utilizes heuristic evidence analysis.";
}

// ==========================================
// 4. CLEAR & RESET
// ==========================================
clearBtn.addEventListener("click", async () => {
  contentInput.value = "";
  contentTypeBadge.textContent = "TEXT MESSAGE";
  if (linkOnlyBadge) linkOnlyBadge.classList.add("hidden");
  contentSourceInfo.textContent = "Manual Input";
  hideAllStates();
  emptyState.classList.remove("hidden");
  try {
    await chrome.storage.session.remove("pendingScan");
  } catch (_) {}
});

function showError(title, message) {
  errorTitle.textContent = title;
  errorMessage.textContent = message;
  errorState.classList.remove("hidden");
}

function hideAllStates() {
  loadingState.classList.add("hidden");
  emptyState.classList.add("hidden");
  errorState.classList.add("hidden");
  resultState.classList.add("hidden");
}

// ==========================================
// 5. CONFIGURATION & SETTINGS
// ==========================================
settingsToggleBtn.addEventListener("click", () => {
  settingsPanel.classList.toggle("hidden");
});

closeSettingsBtn.addEventListener("click", () => {
  settingsPanel.classList.add("hidden");
});

async function loadSettingsUI() {
  const cfg = await getConfig();
  cfgBackendUrl.value = cfg.backendUrl;
  cfgApiEndpoint.value = cfg.apiEndpoint;
  cfgMockFallback.checked = cfg.enableMockFallback !== false;
}

saveSettingsBtn.addEventListener("click", async () => {
  try {
    await saveConfig({
      backendUrl: cfgBackendUrl.value.trim(),
      apiEndpoint: cfgApiEndpoint.value.trim(),
      enableMockFallback: cfgMockFallback.checked
    });
    settingsFeedback.style.color = "var(--risk-low)";
    settingsFeedback.textContent = "Settings saved successfully!";
    setTimeout(() => {
      settingsFeedback.textContent = "";
      settingsPanel.classList.add("hidden");
    }, 1200);
  } catch (err) {
    settingsFeedback.style.color = "var(--risk-high)";
    settingsFeedback.textContent = "Failed to save settings.";
  }
});

resetSettingsBtn.addEventListener("click", async () => {
  await saveConfig(DEFAULT_CONFIG);
  await loadSettingsUI();
  settingsFeedback.style.color = "var(--secondary-cyan)";
  settingsFeedback.textContent = "Reset to default settings.";
  setTimeout(() => { settingsFeedback.textContent = ""; }, 1200);
});

// ==========================================
// 6. PROTECTION CENTER INTERACTIVITY
// ==========================================
function initProtectionCenterFeatures() {
  // Feature 1: Screenshot Scam Detection
  const dropZone = document.getElementById("screenshotDropZone");
  const fileInput = document.getElementById("screenshotFileInput");
  const previewBox = document.getElementById("screenshotPreviewContainer");
  const thumb = document.getElementById("screenshotThumbnail");
  const fileNameLabel = document.getElementById("screenshotFileName");
  const sendOcrBtn = document.getElementById("sendScreenshotToScanBtn");

  if (dropZone && fileInput) {
    dropZone.addEventListener("click", () => fileInput.click());
    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.classList.add("dragover");
    });
    dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));
    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZone.classList.remove("dragover");
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleScreenshotFile(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleScreenshotFile(e.target.files[0]);
      }
    });
  }

  let lastSimulatedOcr = "";
  function handleScreenshotFile(file) {
    if (!file.type.startsWith("image/")) return;
    fileNameLabel.textContent = file.name;

    const reader = new FileReader();
    reader.onload = (ev) => {
      thumb.src = ev.target.result;
      previewBox.classList.remove("hidden");
      // Simulated client OCR sample for demonstration workflow
      lastSimulatedOcr = `URGENT: Your SBI account number XX3892 will be suspended today due to pending KYC update. Click http://sbi-verification-update.in to complete verification immediately.`;
    };
    reader.readAsDataURL(file);
  }

  if (sendOcrBtn) {
    sendOcrBtn.addEventListener("click", () => {
      if (lastSimulatedOcr) {
        contentInput.value = lastSimulatedOcr;
        contentTypeBadge.textContent = "TEXT MESSAGE";
        contentSourceInfo.textContent = `Screenshot OCR: ${fileNameLabel.textContent}`;
        switchTab("tabScanner");
        hideAllStates();
        scanBtn.focus();
      }
    });
  }

  // Feature 2: Advanced URL Intelligence
  const urlIntelInput = document.getElementById("urlIntelInput");
  const urlIntelBtn = document.getElementById("urlIntelBtn");
  const urlIntelResult = document.getElementById("urlIntelResult");
  const metricStructure = document.getElementById("intelMetricStructure");
  const metricRedirect = document.getElementById("intelMetricRedirect");
  const metricTyposquat = document.getElementById("intelMetricTyposquat");

  if (urlIntelBtn && urlIntelInput) {
    urlIntelBtn.addEventListener("click", () => {
      const targetUrl = urlIntelInput.value.trim();
      if (!targetUrl) return;

      urlIntelResult.classList.remove("hidden");
      
      // Real client-side heuristic inspection
      const isIp = /^https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/i.test(targetUrl);
      const isShortener = /(bit\.ly|tinyurl\.com|t\.co|is\.gd|cutt\.ly|ow\.ly)/i.test(targetUrl);
      const isBankTyposquat = /(sbi|hdfc|icici|axis|punjab|bob)[^.\s/]*\.(com|in|org|net|xyz|top|live)/i.test(targetUrl);

      if (isIp) {
        metricStructure.textContent = "Raw IP Host (High Risk)";
        metricStructure.style.color = "var(--risk-high)";
      } else if (isShortener) {
        metricStructure.textContent = "Shortened URL (Obfuscated)";
        metricStructure.style.color = "var(--risk-medium)";
      } else {
        metricStructure.textContent = "Standard Domain";
        metricStructure.style.color = "var(--risk-low)";
      }

      metricRedirect.textContent = isShortener ? "Multiple Hops Expected" : "Direct Link";
      metricRedirect.style.color = isShortener ? "var(--risk-medium)" : "var(--text-secondary)";

      if (isBankTyposquat) {
        metricTyposquat.textContent = "Suspected Brand Mimicry";
        metricTyposquat.style.color = "var(--risk-high)";
      } else {
        metricTyposquat.textContent = "None Detected";
        metricTyposquat.style.color = "var(--risk-low)";
      }
    });
  }

  // Feature 3: AI Investigation Assistant Queries
  const chips = document.querySelectorAll(".assistant-chip");
  const assistantBox = document.getElementById("assistantResponseBox");
  const assistantText = document.getElementById("assistantResponseText");

  const answers = {
    kyc: "Scammers create artificial panic claiming your account will be frozen within 24 hours. Legitimate Indian banks (SBI, HDFC, ICICI) never mandate immediate KYC verification via SMS hyperlinks or WhatsApp links. Real KYC updates are handled only at branch counters or through official net banking apps.",
    apk: "Installing third-party Android APK files allows attackers to bypass Google Play Protect. Malicious APKs request accessibility permissions, read incoming SMS OTPs, and forward credentials to the attacker's server.",
    lottery: "Lottery and KBC scams tell victims they have won millions, but demand an 'advance tax' or 'clearance fee' via UPI. In genuine lotteries, fees are deducted from winnings; legitimate organizers never demand money upfront to release prizes."
  };

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const queryType = chip.dataset.query;
      if (answers[queryType]) {
        assistantText.textContent = answers[queryType];
        assistantBox.classList.remove("hidden");
      }
    });
  });

  // Feature 5: Emergency Helpline Copy Button
  const copyBtn = document.getElementById("copyHelplineBtn");
  const copyFeedback = document.getElementById("copyHelplineFeedback");
  if (copyBtn && copyFeedback) {
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText("1930").then(() => {
        copyFeedback.textContent = "Helpline 1930 copied to clipboard!";
        setTimeout(() => { copyFeedback.textContent = ""; }, 2000);
      }).catch(() => {
        copyFeedback.textContent = "Helpline: 1930";
      });
    });
  }
}

// Security / XSS prevention helper
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
