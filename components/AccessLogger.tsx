"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

// 独自アクセスログ収集。access_logsテーブルにページビュー・スクロール・滞在時間・クリックを記録する。
// 90日以上前のデータの削除はクライアントには書き込み権限がないため、Supabase側のスケジュールジョブで行う。
const VISITOR_KEY = "ll_visitor";
const SESSION_KEY = "ll_session";
const SCROLL_MILESTONES = [25, 50, 75, 100];

function getVisitorInfo() {
  const now = Date.now();
  const isNewVisitor = !localStorage.getItem(VISITOR_KEY);
  if (isNewVisitor) localStorage.setItem(VISITOR_KEY, String(now));
  const isNewSession = !sessionStorage.getItem(SESSION_KEY);
  if (isNewSession) sessionStorage.setItem(SESSION_KEY, String(now));
  return { isNewVisitor, isNewSession };
}

function parseUA() {
  const ua = navigator.userAgent;
  let browser = "Other";
  if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("OPR/") || ua.includes("Opera")) browser = "Opera";
  else if (ua.includes("Chrome/")) browser = "Chrome";
  else if (ua.includes("Firefox/")) browser = "Firefox";
  else if (ua.includes("Safari/")) browser = "Safari";

  let os = "Other";
  if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS X")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";

  const device = /Mobi|Android|iPhone|iPad/i.test(ua) ? "Mobile" : "Desktop";
  return { browser, os, device };
}

async function fetchLocation() {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3000);
    const res = await fetch("https://ipapi.co/json", { signal: ctrl.signal });
    clearTimeout(timer);
    if (res.ok) {
      const d = await res.json();
      if (d?.country_name) {
        return { country: d.country_name || "不明", region: d.region || "不明", city: d.city || "不明" };
      }
    }
  } catch {
    /* fallback */
  }
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2000);
    const res = await fetch("https://cloudflare.com/cdn-cgi/trace", { signal: ctrl.signal });
    clearTimeout(timer);
    if (res.ok) {
      const text = await res.text();
      const loc = text.match(/loc=([A-Z]{2})/)?.[1];
      if (loc) return { country: loc, region: "不明", city: "不明" };
    }
  } catch {
    /* both failed */
  }
  return { country: "不明", region: "不明", city: "不明" };
}

export default function AccessLogger() {
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const session = getVisitorInfo();
      const ua = parseUA();
      const loc = await fetchLocation();
      if (cancelled) return;

      const logEvent = (type: string, extra: Record<string, string | number | boolean | null> = {}) => {
        supabase
          .from("access_logs")
          .insert({
            event_type: type,
            path: location.pathname,
            browser: ua.browser,
            os: ua.os,
            device: ua.device,
            screen: `${window.innerWidth}x${window.innerHeight}`,
            lang: navigator.language,
            theme: window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
            country: loc.country,
            region: loc.region,
            city: loc.city,
            extra,
          })
          .then(() => {});
      };

      logEvent("page_view", {
        title: document.title || null,
        referrer: document.referrer || "直接アクセス",
        isNewVisitor: session.isNewVisitor,
        isNewSession: session.isNewSession,
      });

      // スクロール深度
      const reached = new Set<number>();
      const onScroll = () => {
        const scrolled = window.scrollY + window.innerHeight;
        const total = document.documentElement.scrollHeight;
        if (!total) return;
        const pct = Math.round((scrolled / total) * 100);
        SCROLL_MILESTONES.forEach((m) => {
          if (pct >= m && !reached.has(m)) {
            reached.add(m);
            logEvent("scroll", { depth: m });
          }
        });
      };
      window.addEventListener("scroll", onScroll, { passive: true });

      // 滞在時間
      const start = Date.now();
      const sendEngagement = () => {
        const ms = Date.now() - start;
        if (ms < 2000) return;
        logEvent("engagement", { ms, sec: Math.round(ms / 1000) });
      };
      window.addEventListener("beforeunload", sendEngagement);
      const onVisibility = () => {
        if (document.visibilityState === "hidden") sendEngagement();
      };
      document.addEventListener("visibilitychange", onVisibility);

      // クリック計測
      const targets = [
        { sel: ".chat-send-btn", label: "chat_send" },
        { sel: "#clearAllButton", label: "chat_clear" },
        { sel: "#searchButton", label: "law_search" },
        { sel: ".siteindex_btn_link", label: "top_cta" },
        { sel: ".hamberger-btn", label: "menu_open" },
        { sel: "#cookie-accept", label: "cookie_accept" },
        { sel: "#cookie-reject", label: "cookie_reject" },
        { sel: "#auth-google-btn", label: "login_google" },
        { sel: "#auth-submit-btn", label: "login_email" },
        { sel: ".lawapi-view-button", label: "law_detail_open" },
      ];
      const onClick = (e: MouseEvent) => {
        for (const { sel, label } of targets) {
          if ((e.target as HTMLElement).closest?.(sel)) {
            logEvent("click", { element: label });
            break;
          }
        }
      };
      document.addEventListener("click", onClick, { passive: true });

      return () => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("beforeunload", sendEngagement);
        document.removeEventListener("visibilitychange", onVisibility);
        document.removeEventListener("click", onClick);
      };
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
