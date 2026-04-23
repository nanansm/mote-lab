import type { PlasmoCSConfig } from "plasmo";

export const config: PlasmoCSConfig = {
  matches: ["https://lab.motekreatif.com/*", "http://localhost:3003/*"],
  run_at: "document_idle",
};

// Relay window.postMessage from the auth page → background service worker.
// The web app posts { type: "MOTE_LAB_AUTH_TOKEN", token, user } after generating a token.
window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (event.data?.type !== "MOTE_LAB_AUTH_TOKEN") return;
  if (!event.data.token) return;

  chrome.runtime.sendMessage(
    { type: "MOTE_LAB_AUTH_TOKEN", token: event.data.token, user: event.data.user },
    (response) => {
      if (chrome.runtime.lastError) return; // extension not ready
      window.postMessage({ type: "MOTE_LAB_AUTH_RESPONSE", ...response }, "*");
    },
  );
});
