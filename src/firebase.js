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
 * 🛡️ App Check (reCAPTCHA v3)
 *
 * - En localhost:
 *    - usa token DEBUG sin necesidad de clave
 * - En producción:
 *    - SOLO se activa si tienes VITE_RECAPTCHA_KEY / REACT_APP_RECAPTCHA_KEY
 *    - Si no hay clave → AppCheck se desactiva silenciosamente.
 * ========================================== */
const isBrowser = typeof window !== "undefined";
const isLocalhost =
  isBrowser &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

// Lee clave desde env (Vite o CRA)
const RECAPTCHA_KEY =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_RECAPTCHA_KEY) ||
  (typeof process !== "undefined" &&
    process.env &&
    process.env.REACT_APP_RECAPTCHA_KEY) ||
  "";

let appCheck = null;

if (isBrowser) {
  // 🔹 Token debug SOLO en localhost (para poder probar sin clave real)
  if (isLocalhost) {
    const g = typeof globalThis !== "undefined" ? globalThis : window;
    // eslint-disable-next-line no-restricted-globals
    g.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }

  // 🔹 Producción con clave → AppCheck real
  // 🔹 Localhost sin clave → modo "debug"
  // 🔹 Producción sin clave → AppCheck DESACTIVADO (sin errores)
  if (RECAPTCHA_KEY) {
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(RECAPTCHA_KEY),
      isTokenAutoRefreshEnabled: true,
    });
  } else if (isLocalhost) {
    // localhost sin clave → debug
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider("debug"),
      isTokenAutoRefreshEnabled: true,
    });
  } else {
    // Producción sin clave: no inicializamos AppCheck
    // Para no ensuciar la consola en Vercel, solo logeamos en dev
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.info(
        "[AppCheck] Sin RECAPTCHA_KEY en este entorno. App Check desactivado."
      );
    }
  }

  // Exponer instancia SOLO para debug manual si la necesitas
  if (appCheck && isLocalhost) {
    // @ts-ignore
    window.FIREBASE_APPCHECK_INSTANCE = appCheck;
    // eslint-disable-next-line no-underscore-dangle
    window.__testAppCheck = async () => {
      try {
        const { getToken } = await import("firebase/app-check");
        const t = await getToken(appCheck, true);
        // eslint-disable-next-line no-console
        console.log("[AppCheck] appCheckToken:", t.token);
        return t;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("[AppCheck] getToken error:", e);
        throw e;
      }
    };
  }
}

export { appCheck };

/* ============================================
 * 📊 Analytics (opcional, no rompe en incógnito)
 * ========================================== */
export let analytics = null;
(async () => {
  try {
    if (isBrowser && (await analyticsIsSupported())) {
      analytics = getAnalytics(app);
    }
  } catch {
    // Ignorar si el entorno no soporta analytics (p. ej. incógnito)
  }
})();

/* ============================================
 * 🔐 Auth con persistencia local
 * ========================================== */
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(() => {});

/* ============================================
 * 🗃️ Firestore (mejor compatibilidad en redes)
 * ========================================== */
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
  experimentalAutoDetectLongPolling: true,
});

enableIndexedDbPersistence(db).catch(() => {});

/* ============================================
 * 🟢 RTDB (opcional) y 📦 Storage
 * ========================================== */
export const rtdb = getDatabase(app);
export const storage = getStorage(app);
