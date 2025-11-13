/* eslint-disable no-undef */
// src/firebase.js
import { initializeApp } from "firebase/app";

// Analytics (opcional)
import { getAnalytics, isSupported as analyticsIsSupported } from "firebase/analytics";

// Auth
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";

// Firestore
import { initializeFirestore, enableIndexedDbPersistence } from "firebase/firestore";

// RTDB y Storage
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

// App Check (reCAPTCHA v3)
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

/* ============================================
 * ⚙️ Configuración Firebase (tu proyecto)
 * ========================================== */
const firebaseConfig = {
  apiKey: "AIzaSyCKHP9tTq7qo5X_5rR73xeq64OkxVrxXXM",
  authDomain: "fitlife-fb0e9.firebaseapp.com",
  databaseURL: "https://fitlife-fb0e9-default-rtdb.firebaseio.com",
  projectId: "fitlife-fb0e9",
  storageBucket: "fitlife-fb0e9.appspot.com",
  messagingSenderId: "962962173698",
  appId: "1:962962173698:web:f2669ef890b06adc041c1b",
  measurementId: "G-Y0HMZL1H4T",
};

/* ============================================
 * 🚀 Inicializa app base
 * ========================================== */
export const app = initializeApp(firebaseConfig);

/* ============================================
 * 🛡️ App Check (reCAPTCHA v3) + Debug en local
 * ========================================== */
const isBrowser = typeof window !== "undefined";
const isLocalhost =
  isBrowser &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

// Detecta claves posibles (Vite o CRA)
const viteKey =
  typeof import.meta !== "undefined" &&
  import.meta.env &&
  import.meta.env.VITE_RECAPTCHA_KEY;

const craKey =
  typeof process !== "undefined" &&
  process.env &&
  process.env.REACT_APP_RECAPTCHA_KEY;

const RECAPTCHA_KEY = viteKey || craKey || "";

// Activa token DEBUG **antes** de initializeAppCheck (solo en local)
if (isLocalhost && isBrowser) {
  const g = typeof globalThis !== "undefined" ? globalThis : window;
  g.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

let appCheck = null;

if (isBrowser) {
  if (!RECAPTCHA_KEY && !isLocalhost) {
    console.error(
      "[AppCheck] Falta REACT_APP_RECAPTCHA_KEY/VITE_RECAPTCHA_KEY en producción. " +
        "App Check podría fallar (403)."
    );
  }

  // Solo inicializamos si hay clave o estamos en localhost (modo debug)
  if (RECAPTCHA_KEY || isLocalhost) {
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(RECAPTCHA_KEY || (isLocalhost ? "debug" : "")),
      isTokenAutoRefreshEnabled: true,
    });

    // Exponer para depuración opcional
    // @ts-ignore
    window.FIREBASE_APPCHECK_INSTANCE = appCheck;

    // Helper: await window.__testAppCheck()
    // eslint-disable-next-line no-underscore-dangle
    window.__testAppCheck = async () => {
      try {
        const { getToken } = await import("firebase/app-check");
        const t = await getToken(appCheck, /* forceRefresh */ true);
        console.log("[AppCheck] appCheckToken:", t.token);
        return t;
      } catch (e) {
        console.error("[AppCheck] getToken error:", e);
        throw e;
      }
    };
  }
}

export { appCheck };

/* ============================================
 * 📊 Analytics (opcional)
 * ========================================== */
export let analytics = null;
(async () => {
  try {
    if (isBrowser && (await analyticsIsSupported())) {
      analytics = getAnalytics(app);
    }
  } catch {
    // Ignorar si falla
  }
})();

/* ============================================
 * 🔐 Auth con persistencia local
 * ========================================== */
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(() => {});

/* ============================================
 * 🗃️ Firestore
 * ========================================== */
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
  experimentalAutoDetectLongPolling: true,
});

enableIndexedDbPersistence(db).catch(() => {});

/* ============================================
 * 🟢 RTDB y 📦 Storage
 * ========================================== */
export const rtdb = getDatabase(app);
export const storage = getStorage(app);
