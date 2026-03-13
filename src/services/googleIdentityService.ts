const GOOGLE_GSI_SCRIPT_URL = "https://accounts.google.com/gsi/client";
let scriptPromise: Promise<void> | null = null;

type GoogleCredentialResponse = {
  credential?: string;
};

type GooglePromptMoment = {
  isNotDisplayed?: () => boolean;
  getNotDisplayedReason?: () => string;
  isSkippedMoment?: () => boolean;
  getSkippedReason?: () => string;
  isDismissedMoment?: () => boolean;
  getDismissedReason?: () => string;
};

type GoogleIdentityApi = {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    use_fedcm_for_prompt?: boolean;
  }) => void;
  prompt: (listener?: (moment: GooglePromptMoment) => void) => void;
  cancel?: () => void;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleIdentityApi;
      };
    };
  }
}

function readGoogleClientId() {
  return String(import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();
}

function getIdentityApi() {
  return window.google?.accounts?.id;
}

async function loadGoogleScript() {
  if (typeof window === "undefined") {
    throw new Error("google_requires_browser");
  }
  if (getIdentityApi()) return;
  if (scriptPromise) {
    await scriptPromise;
    return;
  }
  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GOOGLE_GSI_SCRIPT_URL}"]`);
    if (existing) {
      if (getIdentityApi()) {
        resolve();
        return;
      }
      let done = false;
      const finish = (ok: boolean) => {
        if (done) return;
        done = true;
        if (ok) resolve();
        else reject(new Error("google_script_load_failed"));
      };
      existing.addEventListener("load", () => finish(true), { once: true });
      existing.addEventListener("error", () => finish(false), { once: true });
      window.setTimeout(() => {
        finish(Boolean(getIdentityApi()));
      }, 3000);
      return;
    }
    const script = document.createElement("script");
    script.src = GOOGLE_GSI_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("google_script_load_failed"));
    document.head.appendChild(script);
  });
  await scriptPromise;
}

export function isGoogleIdentityConfigured() {
  return readGoogleClientId().length > 0;
}

export async function requestGoogleCredential(timeoutMs = 60000): Promise<string> {
  const clientId = readGoogleClientId();
  if (!clientId) throw new Error("google_client_id_missing");

  await loadGoogleScript();
  const identity = getIdentityApi();
  if (!identity) throw new Error("google_identity_unavailable");

  return await new Promise<string>((resolve, reject) => {
    let finished = false;
    const timeout = window.setTimeout(() => {
      if (finished) return;
      finished = true;
      reject(new Error("google_prompt_timeout"));
    }, timeoutMs);

    const finalize = (result: { credential?: string; error?: string }) => {
      if (finished) return;
      finished = true;
      window.clearTimeout(timeout);
      if (result.credential) {
        resolve(result.credential);
        return;
      }
      reject(new Error(result.error || "google_sign_in_failed"));
    };

    identity.initialize({
      client_id: clientId,
      auto_select: false,
      cancel_on_tap_outside: true,
      use_fedcm_for_prompt: true,
      callback: (response) => {
        const credential = String(response?.credential || "").trim();
        if (!credential) {
          finalize({ error: "google_credential_missing" });
          return;
        }
        finalize({ credential });
      }
    });

    identity.prompt((moment) => {
      if (finished) return;
      if (typeof moment?.isNotDisplayed === "function" && moment.isNotDisplayed()) {
        const reason = moment.getNotDisplayedReason?.() || "unknown";
        finalize({ error: `google_prompt_not_displayed:${reason}` });
        return;
      }
      if (typeof moment?.isSkippedMoment === "function" && moment.isSkippedMoment()) {
        const reason = moment.getSkippedReason?.() || "unknown";
        finalize({ error: `google_prompt_skipped:${reason}` });
        return;
      }
      if (typeof moment?.isDismissedMoment === "function" && moment.isDismissedMoment()) {
        const reason = moment.getDismissedReason?.() || "unknown";
        finalize({ error: `google_prompt_dismissed:${reason}` });
      }
    });
  });
}
