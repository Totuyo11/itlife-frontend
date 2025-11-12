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
 *  - Requiere VITE_RECAPTCHA_KEY en .env.local para prod
 *  - En localhost habilita token de depuración
 * ========================================== */
const isBrowser = typeof window !== "undefined";
const isLocalhost =
  isBrowser &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

// Lee la clave desde variables de entorno (Vite/CRA)
const RECAPTCHA_KEY =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_RECAPTCHA_KEY) ||
  (typeof process !== "undefined" && process.env && process.env.REACT_APP_RECAPTCHA_KEY) ||
  "";

// Activa token DEBUG **antes** de initializeAppCheck (solo en local)
if (isLocalhost && isBrowser) {
  const g = typeof globalThis !== "undefined" ? globalThis : window;
  // eslint-disable-next-line no-restricted-globals
  g.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  // console.log("[AppCheck] modo DEBUG activo en localhost ✅");
}

let appCheck = null;
if (isBrowser) {
  if (!RECAPTCHA_KEY && !isLocalhost) {
    console.error(
      "[AppCheck] Falta VITE_RECAPTCHA_KEY / REACT_APP_RECAPTCHA_KEY en producción. App Check podría fallar (403)."
    );
  }

  appCheck = initializeAppCheck(app, {
    // En prod usa la clave real; en local, si no hay clave, usa "debug"
    provider: new ReCaptchaV3Provider(RECAPTCHA_KEY || (isLocalhost ? "debug" : "")),
    isTokenAutoRefreshEnabled: true,
  });

  // Exponer instancia para depuración opcional
  // @ts-ignore
  window.FIREBASE_APPCHECK_INSTANCE = appCheck;

  // Helper de verificación rápida desde consola:
  //   await window.__testAppCheck()
  // Deberías ver "[AppCheck] appCheckToken: <token>"
  // Si falla, verás el error exacto (útil para 403/429).
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
 *  - experimentalAutoDetectLongPolling reduce 400/403
 * ========================================== */
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
  experimentalAutoDetectLongPolling: true,
  // useFetchStreams: false, // si tu red rompe fetch streams, prueba descomentar
});

// Cache offline (si falla por multi-pestaña, seguimos online)
enableIndexedDbPersistence(db).catch(() => {});

/* ============================================
 * 🟢 RTDB (opcional) y 📦 Storage
 * ========================================== */
export const rtdb = getDatabase(app);
export const storage = getStorage(app);

/* ============================================
 * 🧪 Emuladores (solo en local) — descomentarlos si los usas
 * ========================================== */
// import { connectAuthEmulator } from "firebase/auth";
// import { connectFirestoreEmulator } from "firebase/firestore";
// import { connectDatabaseEmulator } from "firebase/database";
// import { connectStorageEmulator } from "firebase/storage";
// if (isLocalhost) {
//   connectAuthEmulator(auth, "http://localhost:9099");
//   connectFirestoreEmulator(db, "localhost", 8080);
//   connectDatabaseEmulator(rtdb, "localhost", 9000);
//   connectStorageEmulator(storage, "localhost", 9199);
// }
