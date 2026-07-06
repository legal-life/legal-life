import { addDoc, collection, deleteDoc, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import type { User } from "firebase/auth";
import { fetchLocation, getSid, parseUA, SESSION_KEY } from "./utils";

export async function logAct(uid: string, db: Firestore, type: string, detail = "") {
  const ua = parseUA();
  try {
    await addDoc(collection(db, "users", uid, "activity"), {
      type,
      detail,
      timestamp: serverTimestamp(),
      browser: ua.browser,
      os: ua.os,
      device: ua.device,
    });
  } catch {
    /* ignore */
  }
}

export async function regSession(user: User, db: Firestore) {
  const sid = getSid();
  const ref = doc(db, "users", user.uid, "sessions", sid);
  const ua = parseUA();
  try {
    const s = await getDoc(ref);
    if (!s.exists()) {
      const loc = await fetchLocation();
      await setDoc(ref, {
        sessionId: sid,
        browser: ua.browser,
        os: ua.os,
        device: ua.device,
        location: loc,
        loginAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        shouldLogout: false,
      });
    } else {
      await setDoc(ref, { lastActive: serverTimestamp() }, { merge: true });
    }
  } catch {
    /* ignore */
  }
}

export async function delSession(user: User, db: Firestore) {
  try {
    const sid = localStorage.getItem(SESSION_KEY);
    if (sid) {
      await deleteDoc(doc(db, "users", user.uid, "sessions", sid));
      localStorage.removeItem(SESSION_KEY);
    }
  } catch {
    /* ignore */
  }
}
