import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCKHP9tTq7qo5X_5rR73xeq64OkxVrxXXM",
  authDomain: "fitlife-fb0e9.firebaseapp.com",
  databaseURL: "https://fitlife-fb0e9-default-rtdb.firebaseio.com",
  projectId: "fitlife-fb0e9",
  storageBucket: "fitlife-fb0e9.firebasestorage.app",
  messagingSenderId: "962962173698",
  appId: "1:962962173698:web:f2669ef890b06adc041c1b",
  measurementId: "G-Y0HMZL1H4T"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth    = getAuth(app);
export const db      = getFirestore(app);
export const rtdb    = getDatabase(app);
export const storage = getStorage(app);
