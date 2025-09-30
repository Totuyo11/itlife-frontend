// src/firebase.js
import { initializeApp } from "firebase/app";

// 🔎 Analytics (opcional, solo si el navegador lo soporta)
import { getAnalytics, isSupported as analyticsIsSupported } from "firebase/analytics";

import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

// ⚙️ Configuración Firebase (puedes mover a .env.local si prefieres)
const firebaseConfig = {
  apiKey: "AIzaSyCKHP9tTq7qo5X_5rR73xeq64OkxVrxXXM",
  authDomain: "fitlife-fb0e9.firebaseapp.com",
  databaseURL: "https://fitlife-fb0e9-default-rtdb.firebaseio.com",
  projectId: "fitlife-fb0e9",
  storageBucket: "fitlife-fb0e9.firebasestorage.app",
  messagingSenderId: "962962173698",
  appId: "1:962962173698:web:f2669ef890b06adc041c1b",
  measurementId: "G-Y0HMZL1H4T",
};

// 🚀 Inicializa app
export const app = initializeApp(firebaseConfig);

// 📊 Analytics (no rompe si no está disponible)
export let analytics = null;
(async () => {
  try {
    if (typeof window !== "undefined" && (await analyticsIsSupported())) {
      analytics = getAnalytics(app);
    }
  } catch {
    // No pasa nada si falla (modo incógnito, navegador no soportado, etc.)
  }
})();

// 🔐 Auth
export const auth = getAuth(app);
// Mantiene la sesión en recargas (si falla usa memoria)
setPersistence(auth, browserLocalPersistence).catch(() => {});

// 🗃️ Firestore
export const db = getFirestore(app);
enableIndexedDbPersistence(db).catch(() => {
  // Si falla (multi-pestaña o no soportado), sigue funcionando sin cache offline
});

// 🟢 Realtime Database (opcional)
export const rtdb = getDatabase(app);

// 📦 Storage
export const storage = getStorage(app);

/* =============================
   🧪 Emuladores (solo en local)
================================ */
// import { connectAuthEmulator } from "firebase/auth";
// import { connectFirestoreEmulator } from "firebase/firestore";
// import { connectDatabaseEmulator } from "firebase/database";
// import { connectStorageEmulator } from "firebase/storage";

// if (window.location.hostname === "localhost") {
//   connectAuthEmulator(auth, "http://localhost:9099");
//   connectFirestoreEmulator(db, "localhost", 8080);
//   connectDatabaseEmulator(rtdb, "localhost", 9000);
//   connectStorageEmulator(storage, "localhost", 9199);
// }
