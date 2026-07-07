import { getDatabase, type Database } from "firebase/database";
import { getFirebaseApp } from "./client";

let rtdb: Database | undefined;

export function getRtdb() {
  if (!rtdb) rtdb = getDatabase(getFirebaseApp());
  return rtdb;
}
