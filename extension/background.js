/**
 * ScamShield AI - Chrome Extension Background Service Worker (Manifest V3)
 * Handles context menus, capturing selected text/links, and launching the Chrome Side Panel.
 */

const CONTEXT_MENU_ID = "scamshield-check";

// 1. Create Context Menu on Installation / Startup
chrome.runtime.onInstalled.addListener(() => {
  console.log("[ScamShield AI] Extension installed/updated. Initializing context menus and side panel...");

  // Remove any existing menus first to prevent duplicate-ID runtime errors on reload
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: CONTEXT_MENU_ID,
      title: "Check with ScamShield",
      contexts: ["selection", "link", "page"]
    }, () => {
      if (chrome.runtime.lastError) {
        console.error("[ScamShield] Context menu creation error:", chrome.runtime.lastError.message);
      } else {
        console.log("[ScamShield] Context menu created successfully.");
      }
    });
  });

  // Configure default global side panel options
  if (chrome.sidePanel && chrome.sidePanel.setOptions) {
    chrome.sidePanel.setOptions({
      path: "sidepanel/sidepanel.html",
      enabled: true
    }).catch((err) => {
      console.warn("[ScamShield] sidePanel.setOptions warning:", err);
    });
  }

  // Enable side panel to open when user clicks the extension action toolbar button
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((err) => {
      console.warn("[ScamShield] setPanelBehavior error:", err);
    });
  }
});

// Fallback toolbar action click listener
if (chrome.action && chrome.action.onClicked) {
  chrome.action.onClicked.addListener((tab) => {
    if (chrome.sidePanel && chrome.sidePanel.open) {
      if (tab?.windowId) {
        chrome.sidePanel.open({ windowId: tab.windowId }).catch((err) => {
          console.warn("[ScamShield] action click open error (windowId):", err);
          if (tab?.id) chrome.sidePanel.open({ tabId: tab.id }).catch(() => {});
        });
      } else if (tab?.id) {
        chrome.sidePanel.open({ tabId: tab.id }).catch(() => {});
      }
    }
  });
}

// 2. Handle Context Menu Click Events
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID) return;

  console.log("[ScamShield] Context menu clicked. Tab ID:", tab?.id, "Window ID:", tab?.windowId);

  /**
   * CRITICAL FIX FOR CHROME MANIFEST V3:
   * chrome.sidePanel.open() MUST be executed SYNCHRONOUSLY within this user-gesture event handler!
   * Any preceding `await` or asynchronous call (such as awaiting storage) breaks the execution
   * context and causes Chrome to revoke the transient user-activation token with the error:
   * "Error: sidePanel.open() may only be called in response to a user gesture."
   */
  if (chrome.sidePanel && chrome.sidePanel.open) {
    if (tab && tab.windowId) {
      chrome.sidePanel.open({ windowId: tab.windowId })
        .then(() => {
          console.log("[ScamShield] Side panel opened successfully via windowId:", tab.windowId);
        })
        .catch((err) => {
          console.warn("[ScamShield] Failed to open side panel via windowId, attempting tabId fallback:", err);
          if (tab && tab.id) {
            chrome.sidePanel.open({ tabId: tab.id })
              .then(() => {
                console.log("[ScamShield] Side panel opened via fallback tabId:", tab.id);
              })
              .catch((err2) => {
                console.error("[ScamShield] Failed to open side panel via tabId fallback:", err2);
              });
          }
        });
    } else if (tab && tab.id) {
      chrome.sidePanel.open({ tabId: tab.id })
        .then(() => {
          console.log("[ScamShield] Side panel opened successfully via tabId:", tab.id);
        })
        .catch((err) => {
          console.error("[ScamShield] Failed to open side panel via tabId:", err);
        });
    } else {
      console.error("[ScamShield] Neither tab.windowId nor tab.id was available to open the side panel.");
    }
  } else {
    console.error("[ScamShield] chrome.sidePanel.open API is not supported in this Chrome version (requires Chrome 116+).");
  }

  // Synchronously extract target text or link URL
  let targetContent = "";
  let inputType = "message";

  if (info.linkUrl) {
    targetContent = info.linkUrl.trim();
    inputType = "url";
  } else if (info.selectionText) {
    targetContent = info.selectionText.trim();
    inputType = "message";
  } else if (info.pageUrl) {
    targetContent = info.pageUrl.trim();
    inputType = "url";
  }

  if (!targetContent) {
    console.warn("[ScamShield] No text or link was captured from context menu.");
    return;
  }

  const capturedPayload = {
    content: targetContent,
    inputType: inputType,
    pageUrl: tab?.url || "",
    pageTitle: tab?.title || "",
    timestamp: Date.now()
  };

  console.log("[ScamShield] Captured payload:", capturedPayload);

  // Store in session storage so the side panel reads it when it finishes loading
  chrome.storage.session.set({ pendingScan: capturedPayload })
    .then(() => {
      console.log("[ScamShield] Captured content stored in session storage.");
    })
    .catch((err) => {
      console.error("[ScamShield] Error saving to storage.session:", err);
    });

  // Broadcast runtime message in case the side panel is already open
  chrome.runtime.sendMessage({
    action: "CONTENT_CAPTURED",
    payload: capturedPayload
  }).catch(() => {
    // Normal: side panel is likely opening right now and will read from storage on mount
  });
});
