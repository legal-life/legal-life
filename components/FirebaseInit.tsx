"use client";

import { useEffect } from "react";
import { initAppCheck } from "@/lib/firebase/client";

// 旧important.jsのFirebase App Check初期化に相当。定義済みだが未呼び出しだったため追加。
export default function FirebaseInit() {
  useEffect(() => {
    initAppCheck();
  }, []);
  return null;
}
