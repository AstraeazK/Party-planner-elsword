const GAS_URL = "https://script.google.com/macros/s/AKfycbyW8uGJl81QiNo4siO0opnKXqom-tSYdh4DkPehgoTVe5RVFIVjeJ6HwStJNpvmU6ds/exec";
const QUEUE_STORAGE_KEY = "party_planner_analytics_queue";
const SESSION_STORAGE_KEY = "party_planner_analytics_session";

function getSafeStorage() {
  try {
    return window.localStorage;
  } catch (error) {
    return null;
  }
}

function createSessionId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readJsonStorage(key) {
  const storage = getSafeStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function writeJsonStorage(key, value) {
  const storage = getSafeStorage();
  if (!storage) return;

  try {
    storage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Ignore storage failures so the app keeps working normally.
  }
}

function toSafeText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function getBrowserName() {
  const userAgent = navigator.userAgent || "";
  if (/edg\//i.test(userAgent)) return "Edge";
  if (/chrome|crios/i.test(userAgent)) return "Chrome";
  if (/firefox/i.test(userAgent)) return "Firefox";
  if (/safari/i.test(userAgent)) return "Safari";
  if (/opr\//i.test(userAgent)) return "Opera";
  return "Unknown";
}

function getDeviceType() {
  const userAgent = navigator.userAgent || "";
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) return "tablet";
  if (/mobile|android|iphone|ipod/i.test(userAgent)) return "mobile";
  return "desktop";
}

function getOperatingSystem() {
  const userAgent = navigator.userAgent || "";
  if (/windows/i.test(userAgent)) return "Windows";
  if (/macintosh|mac os x/i.test(userAgent)) return "macOS";
  if (/linux/i.test(userAgent)) return "Linux";
  if (/android/i.test(userAgent)) return "Android";
  if (/iphone|ipad|ipod/i.test(userAgent)) return "iOS";
  return "Unknown";
}

function getScreenSize() {
  return `${window.screen?.width || 0}x${window.screen?.height || 0}`;
}

function getPageUrl() {
  return window.location.href;
}

function getReferrer() {
  return document.referrer || "";
}

function getPerformanceMetrics() {
  const navigationEntry = performance.getEntriesByType("navigation")[0];
  const resourceEntries = performance.getEntriesByType("resource") || [];
  const imageEntries = resourceEntries.filter((entry) => entry.initiatorType === "img");
  const scriptEntries = resourceEntries.filter((entry) => entry.initiatorType === "script");
  const jsonEntry = scriptEntries.find((entry) => /charData|charData\.js/i.test(entry.name));

  const pageLoadMs = navigationEntry ? Math.round(navigationEntry.loadEventEnd - navigationEntry.startTime) : 0;
  const jsonLoadMs = jsonEntry ? Math.round(jsonEntry.responseEnd - jsonEntry.startTime) : 0;
  const imageLoadMs = imageEntries.reduce((sum, entry) => sum + Math.max(0, Math.round(entry.responseEnd - entry.startTime)), 0);
  const timeToInteractiveMs = navigationEntry ? Math.round(navigationEntry.domContentLoadedEventEnd - navigationEntry.startTime) : 0;

  return {
    page_load_ms: pageLoadMs,
    json_load_ms: jsonLoadMs,
    image_load_ms: imageLoadMs,
    time_to_interactive_ms: timeToInteractiveMs,
  };
}

async function measureFps() {
  return new Promise((resolve) => {
    const sampleDurationMs = 1200;
    let frameCount = 0;
    let startTime = performance.now();

    function tick(now) {
      frameCount += 1;
      if (now - startTime < sampleDurationMs) {
        requestAnimationFrame(tick);
        return;
      }

      const elapsedMs = now - startTime;
      const averageFps = elapsedMs > 0 ? Math.round((frameCount / elapsedMs) * 1000) : 0;
      const dropFrames = Math.max(0, Math.round(sampleDurationMs / 1000 * averageFps - frameCount));
      resolve({ average_fps: averageFps, drop_frames: dropFrames });
    }

    requestAnimationFrame(tick);
  });
}

function normalizeEventDetails(details = {}) {
  return {
    category: details.category || "ui",
    action: details.action || "click",
    value: details.value || "",
    character: details.character || "",
    slot: details.slot || "",
    target_character: details.targetCharacter || details.target_character || "",
    page: details.page || window.location.pathname,
  };
}

function buildSessionRow() {
  return {
    session_id: Analytics.sessionId,
    date: new Date().toISOString(),
    enter_time: new Date(Analytics.sessionStart || Date.now()).toISOString(),
    leave_time: "",
    duration_sec: 0,
    device_type: getDeviceType(),
    screen_size: getScreenSize(),
    language: navigator.language || "",
    browser: getBrowserName(),
    os: getOperatingSystem(),
    referrer: getReferrer(),
    page_url: getPageUrl(),
  };
}

export const Analytics = {
  sessionId: null,
  sessionStart: null,
  isInitialized: false,
  queue: [],
  sessionEnded: false,
  pendingPerformance: null,

  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    this.sessionId = createSessionId();
    this.sessionStart = Date.now();
    this.queue = readJsonStorage(QUEUE_STORAGE_KEY) || [];

    const previousSession = readJsonStorage(SESSION_STORAGE_KEY);
    if (previousSession && previousSession.session_id) {
      this.sessionId = previousSession.session_id;
    }

    writeJsonStorage(SESSION_STORAGE_KEY, { session_id: this.sessionId, started_at: this.sessionStart });

    window.addEventListener("online", () => {
      this.flushQueue();
    });

    document.addEventListener("click", (event) => {
      const buttonTarget = event.target;
      if (!buttonTarget) return;

      const buttonEl = buttonTarget.closest("button, a, input, select, textarea");
      if (!buttonEl) return;

      const id = buttonEl.id || buttonEl.getAttribute("data-theme") || buttonEl.getAttribute("data-lang") || buttonEl.getAttribute("aria-label") || buttonEl.textContent || "button";
      const isThemeOption = buttonEl.classList.contains("theme-option");
      const isLanguageOption = buttonEl.classList.contains("language-option");
      const isHelpOpen = buttonEl.id === "help-btn";
      const isHelpClose = buttonEl.id === "help-close";
      const isClearTeam = buttonEl.classList.contains("clear-btn");

      if (isThemeOption) {
        this.trackEvent("theme_change", { value: buttonEl.getAttribute("data-theme") || id, category: "ui", action: "theme_change" });
        return;
      }

      if (isLanguageOption) {
        this.trackEvent("button_click", { value: buttonEl.getAttribute("data-lang") || id, category: "ui", action: "language_select" });
        return;
      }

      if (isHelpOpen) {
        this.trackEvent("help_open", { value: id, category: "help", action: "open" });
        return;
      }

      if (isHelpClose) {
        this.trackEvent("help_close", { value: id, category: "help", action: "close" });
        return;
      }

      if (isClearTeam) {
        this.trackEvent("clear_team", { value: id, category: "team", action: "clear" });
        return;
      }

      this.trackButton(buttonEl, { value: id });
    }, true);

    document.addEventListener("contextmenu", (event) => {
      const target = event.target;
      if (!target) return;

      const slot = target.closest("[data-slot]");
      if (!slot) return;

      const img = slot.querySelector("img");
      if (!img) return;

      this.trackEvent("remove_character", {
        category: "character",
        action: "remove",
        character: this.extractCharacterName(img),
        slot: slot.getAttribute("data-slot") || "",
      });
    }, true);

    window.addEventListener("load", () => {
      this.trackPerformance();
      this.flushQueue();
    });

    window.addEventListener("beforeunload", () => {
      this.endSession();
    });

    window.addEventListener("pagehide", () => {
      this.endSession();
    });

    this.send({
      sheet: "Sessions",
      row: buildSessionRow(),
    });
  },

  extractCharacterName(imgElement) {
    if (!imgElement) return "";
    const src = imgElement.getAttribute("src") || imgElement.src || "";
    return this.extractCharacterNameFromSource(src);
  },

  extractCharacterNameFromSource(source) {
    if (!source) return "";

    // Try to resolve via the application's `charData` mapping if available.
    try {
      const srcStr = String(source || "");
      if (window && window.charData && typeof window.charData === 'object') {
        const keys = Object.keys(window.charData);
        for (const key of keys) {
          if (!key) continue;
          // match if the provided source ends with the stored key or filename
          if (srcStr.endsWith(key) || srcStr.endsWith(key.split('/').pop())) {
            // derive a friendly name from the key's filename part
            const filename = key.split('/').pop() || key;
            const base = filename.replace(/\.[^.]+$/, "").replace(/^Icon_-_/i, "");
            return base.replace(/_/g, ' ').trim();
          }
        }
      }
    } catch (e) {
      // ignore and fallback to filename parsing
    }

    // Fallback: parse last path segment and strip extension / optional prefix.
    const normalized = source.split("/").pop() || source;
    const withoutExtension = normalized.replace(/\.[^.]+$/, "");
    const match = withoutExtension.match(/(?:Icon_-_)?(.+)$/i);
    return match ? match[1].replace(/_/g, ' ').trim() : withoutExtension.replace(/_/g, ' ').trim();
  },

  trackEvent(eventType, details = {}) {
    const normalized = normalizeEventDetails(details);
    const payload = {
      sheet: "Events",
      row: {
        timestamp: new Date().toISOString(),
        session_id: this.sessionId,
        event_type: eventType,
        category: normalized.category,
        action: normalized.action,
        value: normalized.value,
        character: normalized.character,
        slot: normalized.slot,
        target_character: normalized.target_character,
        page: normalized.page,
      },
    };

    return this.send(payload);
  },

  trackButton(buttonElement, details = {}) {
    const buttonText = toSafeText(buttonElement?.textContent || "");
    const buttonValue = toSafeText(buttonElement?.value || "");
    const label = buttonText || buttonValue || buttonElement?.id || "button";
    return this.trackEvent("button_click", { ...details, value: label, category: "ui", action: "click" });
  },

  trackCharacter(character, details = {}) {
    const safeCharacter = toSafeText(character);
    const payload = {
      sheet: "Character Ranking",
      row: {
        character: safeCharacter,
        select_count: 1,
      },
    };
    this.send(payload);
    return this.trackEvent("select_character", { ...details, character: safeCharacter, category: "character", action: "select" });
  },

  trackReplace(character, targetCharacter, details = {}) {
    const safeCharacter = toSafeText(character);
    const safeTarget = toSafeText(targetCharacter);
    return this.trackEvent("replace_character", {
      ...details,
      character: safeCharacter,
      target_character: safeTarget,
      category: "character",
      action: "replace",
    });
  },

  async trackPerformance() {
    const metrics = getPerformanceMetrics();
    const fpsData = await measureFps();
    const payload = {
      sheet: "Performance",
      row: {
        session_id: this.sessionId,
        page_load_ms: metrics.page_load_ms,
        json_load_ms: metrics.json_load_ms,
        image_load_ms: metrics.image_load_ms,
        time_to_interactive_ms: metrics.time_to_interactive_ms,
        average_fps: fpsData.average_fps,
        drop_frames: fpsData.drop_frames,
      },
    };

    this.pendingPerformance = payload;
    return this.send(payload);
  },

  endSession() {
    if (this.sessionEnded) return Promise.resolve(false);
    this.sessionEnded = true;

    const durationSec = Math.max(0, Math.round((Date.now() - (this.sessionStart || Date.now())) / 1000));
    const payload = {
      sheet: "Sessions",
      row: {
        session_id: this.sessionId,
        date: new Date().toISOString(),
        enter_time: "",
        leave_time: new Date().toISOString(),
        duration_sec: durationSec,
        device_type: getDeviceType(),
        screen_size: getScreenSize(),
        language: navigator.language || "",
        browser: getBrowserName(),
        os: getOperatingSystem(),
        referrer: getReferrer(),
        page_url: getPageUrl(),
      },
    };

    return this.send(payload);
  },

  flushQueue() {
    if (!this.queue.length) return Promise.resolve(true);

    const queueSnapshot = [...this.queue];
    this.queue = [];
    writeJsonStorage(QUEUE_STORAGE_KEY, this.queue);

    return Promise.all(queueSnapshot.map((item) => this.send(item, { skipQueue: true })))
      .then(() => true)
      .catch(() => false);
  },

  async send(payload, options = {}) {
    if (!payload || !payload.sheet) return false;

    const body = {
      ...payload,
      timestamp: payload.timestamp || new Date().toISOString(),
    };

    if (!navigator.onLine && !options.skipQueue) {
      this.queue.push(body);
      writeJsonStorage(QUEUE_STORAGE_KEY, this.queue);
      return false;
    }

    try {
      const response = await fetch(GAS_URL, {
        method: "POST",
        body: JSON.stringify(body),
        keepalive: true,
      });

      if (!response.ok) {
        throw new Error(`Analytics request failed with status ${response.status}`);
      }

      return true;
    } catch (error) {
      // If a CORS/preflight failure happens (common with Google Apps Script endpoints),
      // attempt a JSONP GET fallback before queueing the item. This requires the
      // Apps Script web app to support a `callback` and `payload` query parameters
      // (server should parse `payload` and call the provided `callback`).
      if (navigator.onLine && !options.skipQueue) {
        try {
          const jsonpOk = await this.sendJsonp(body);
          if (jsonpOk) return true;
        } catch (e) {
          // fall through to queueing
        }
      }

      if (!options.skipQueue) {
        this.queue.push(body);
        writeJsonStorage(QUEUE_STORAGE_KEY, this.queue);
      }
      return false;
    }
  },

  sendJsonp(body, timeoutMs = 6000) {
    return new Promise((resolve) => {
      if (typeof document === "undefined" || typeof window === "undefined") return resolve(false);

      const callbackName = `__pp_analytics_cb_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      const script = document.createElement("script");

      let completed = false;

      window[callbackName] = function (resp) {
        if (completed) return;
        completed = true;
        try {
          resolve(true);
        } finally {
          try {
            delete window[callbackName];
          } catch (e) {}
          if (script.parentNode) script.parentNode.removeChild(script);
        }
      };

      script.async = true;
      // Send the payload as a URL-encoded `payload` parameter.
      const payloadParam = encodeURIComponent(JSON.stringify(body));
      script.src = `${GAS_URL}?callback=${callbackName}&payload=${payloadParam}`;

      script.onerror = function () {
        if (completed) return;
        completed = true;
        try {
          delete window[callbackName];
        } catch (e) {}
        if (script.parentNode) script.parentNode.removeChild(script);
        resolve(false);
      };

      document.head.appendChild(script);

      setTimeout(() => {
        if (completed) return;
        completed = true;
        try {
          delete window[callbackName];
        } catch (e) {}
        if (script.parentNode) script.parentNode.removeChild(script);
        resolve(false);
      }, timeoutMs);
    });
  },
};

window.Analytics = Analytics;
