/**
 * ScamShield AI - Configuration Service
 * Provides centralized, user-editable settings for backend endpoints.
 * Never stores API keys or secrets.
 */

export const DEFAULT_CONFIG = {
  backendUrl: "http://127.0.0.1:8000",
  apiEndpoint: "/api/analyze",
  requestTimeoutMs: 10000,
  enableMockFallback: true // Allows simulated demo results when backend is offline
};

const STORAGE_KEY = "scamshield_config";

/**
 * Retrieves the current configuration from local storage, falling back to defaults.
 */
export async function getConfig() {
  try {
    const data = await chrome.storage.local.get(STORAGE_KEY);
    return { ...DEFAULT_CONFIG, ...(data[STORAGE_KEY] || {}) };
  } catch (error) {
    console.warn("[Config] Failed to read storage, using defaults:", error);
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Saves updated configuration options to local storage.
 */
export async function saveConfig(newConfig) {
  try {
    const current = await getConfig();
    const updated = { ...current, ...newConfig };
    await chrome.storage.local.set({ [STORAGE_KEY]: updated });
    return updated;
  } catch (error) {
    console.error("[Config] Failed to save configuration:", error);
    throw error;
  }
}
