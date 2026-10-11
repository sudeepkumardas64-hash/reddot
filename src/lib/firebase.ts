import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator, indexedDBLocalPersistence, initializeAuth, browserLocalPersistence } from "firebase/auth";
import { initializeFirestore, connectFirestoreEmulator, persistentLocalCache } from "firebase/firestore";
import { Capacitor } from "@capacitor/core";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(config.apiKey && config.projectId);

export const app = initializeApp(firebaseConfigured ? config : { apiKey: "demo", projectId: "demo-reddot", appId: "demo" });

// Inside the Android WebView, indexedDB persistence is required (popup/redirect resolvers are not used there).
export const auth = Capacitor.isNativePlatform()
  ? initializeAuth(app, { persistence: indexedDBLocalPersistence })
  : (() => {
      const a = getAuth(app);
      a.setPersistence(browserLocalPersistence).catch(() => {});
      return a;
    })();

export const db = initializeFirestore(app, { localCache: persistentLocalCache() });

if (import.meta.env.VITE_USE_EMULATOR === "true") {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}
