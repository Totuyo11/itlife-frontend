// src/firebase.js
import { initializeApp } from "firebase/app";

// 🔎 Analytics solo si el entorno lo soporta (evita errores en SSR/build)
import { getAnalytics, isSupported as analyticsIsSupported } from "firebase/analytics";

import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";
import { 
  getFirestore, 
  enableIndexedDbPersistence 
} from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

// ⚙️ Tu config
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

// 🚀 Inicializa
export const app = initializeApp(firebaseConfig);

// 📈 Analytics (opcional, protegido)
export let analytics = null;
(async () => {
  try {
    if (typeof window !== "undefined" && await analyticsIsSupported()) {
      analytics = getAnalytics(app);
    }
  } catch (e) {
    // No pasa nada si falla (navegador no soportado, modo privado, etc.)
    // console.warn("Analytics no disponible:", e);
  }
})();

// 🔐 Auth
export const auth = getAuth(app);
// Persitencia local (permite mantener sesión en recargas)
setPersistence(auth, browserLocalPersistence).catch(() => {
  // Si falla, Auth usa la persistencia por defecto (in-memory)
});

// 🗃️ Firestore
export const db = getFirestore(app);

// Habilita cache offline (opcional pero recomendado)
enableIndexedDbPersistence(db).catch((err) => {
  // Si hay varias pestañas abiertas, puede fallar con code "failed-precondition"
  // o si el navegador no soporta IndexedDB ("unimplemented").
  // No es crítico; simplemente no habrá cache offline.
  // console.warn("Firestore offline no habilitado:", err.code || err);
});

// 🟢 Realtime Database (si lo usas)
export const rtdb = getDatabase(app);

// 📦 Storage
export const storage = getStorage(app);

/* =============================
   🧪 Emuladores (opcional)
   Descomenta esto cuando desarrolles en local
================================ */
// import { connectAuthEmulator } from "firebase/auth";
// import { connectFirestoreEmulator } from "firebase/firestore";
// import { connectDatabaseEmulator } from "firebase/database";
// import { connectStorageEmulator } from "firebase/storage";

// if (typeof window !== "undefined" && window.location.hostname === "localhost") {
//   try {
//     connectAuthEmulator(auth, "http://localhost:9099");
//     connectFirestoreEmulator(db, "localhost", 8080);
//     connectDatabaseEmulator(rtdb, "localhost", 9000);
//     connectStorageEmulator(storage, "localhost", 9199);
//   } catch (e) {
//     // Evita reconectar si ya estaban conectados
//   }
// }
