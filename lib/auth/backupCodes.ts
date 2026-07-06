import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";

export const BACKUP_CODE_COUNT = 10;

export type BackupCode = { code: string; used: boolean };

function genCode(): string {
  const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => c[Math.floor(Math.random() * c.length)]).join("");
}

export async function genAndSaveCodes(uid: string, db: Firestore): Promise<BackupCode[]> {
  const codes: BackupCode[] = Array.from({ length: BACKUP_CODE_COUNT }, () => ({ code: genCode(), used: false }));
  await setDoc(doc(db, "users", uid, "security", "BackUpCode"), { codes, generatedAt: serverTimestamp() });
  return codes;
}

export async function loadCodes(uid: string, db: Firestore): Promise<BackupCode[]> {
  const snap = await getDoc(doc(db, "users", uid, "security", "BackUpCode"));
  if (snap.exists() && (snap.data().codes?.length ?? 0) > 0) {
    const raw = snap.data().codes as (string | BackupCode)[];
    return raw.map((c) => (typeof c === "string" ? { code: c, used: false } : c));
  }
  return genAndSaveCodes(uid, db);
}
