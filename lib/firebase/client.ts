import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider, type AppCheck } from "firebase/app-check";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG || "{}");

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let appCheck: AppCheck | undefined;

export function getFirebaseApp() {
  if (!app) {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirebaseAuth() {
  if (!auth) auth = getAuth(getFirebaseApp());
  return auth;
}

export function getFirebaseDb() {
  if (!db) db = getFirestore(getFirebaseApp());
  return db;
}

export function initAppCheck() {
  if (typeof window === "undefined" || appCheck) return appCheck;
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!siteKey) return undefined;
  appCheck = initializeAppCheck(getFirebaseApp(), {
    provider: new ReCaptchaV3Provider(siteKey),
    isTokenAutoRefreshEnabled: true,
  });
  return appCheck;
}
