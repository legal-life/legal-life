// access-log.js v3 — Realtime Database 版アクセスログ
// ================================================================
// 保存構造:
//   analytics/
//     {YYYY-MM-DD}/          ← 日付キー
//       summary/             ← その日の集計（累積カウント）
//         page_views: N
//         unique_sessions: N
//         events: N
//       logs/                ← 個別イベントログ
//         {pushId}/
//           type, path, ts, browser, os, device, ...
//
// 自動クリーンアップ:
//   - クライアント起動時に90日以上前のデータを削除
//   - RTDB Spark プランの 1GB 上限に対する安全弁
// ================================================================

(function () {
  "use strict";

  const VISITOR_KEY = "ll_visitor";
  const SESSION_KEY = "ll_session";
  const SCROLL_MILESTONES = [25, 50, 75, 100];
  const RETENTION_DAYS = 90; // 保持する日数

  // ========================================
  // 日付ユーティリティ
  // ========================================
  const toDateKey = (d) => d.toISOString().slice(0, 10); // "2026-04-28"

  function getDateKeysBefore(days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return toDateKey(cutoff); // この日付より古いものを削除
  }

  // ========================================
  // セッション・訪問者判定
  // ========================================
  function getVisitorInfo() {
    const now = Date.now();
    const isNewVisitor = !localStorage.getItem(VISITOR_KEY);
    if (isNewVisitor) localStorage.setItem(VISITOR_KEY, String(now));
    const isNewSession = !sessionStorage.getItem(SESSION_KEY);
    if (isNewSession) sessionStorage.setItem(SESSION_KEY, String(now));
    return { isNewVisitor, isNewSession };
  }

  // ========================================
  // UA パーサー
  // ========================================
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

  // ========================================
  // IP ジオロケーション
  //   プライマリ:  ipapi.co    (無料・CORS対応・制限なし)
  //   フォールバック: Cloudflare /cdn-cgi/trace (国のみ取得可)
  // ========================================
  async function fetchLocation() {
    // ---- プライマリ: ipapi.co ----
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 3000);
      const res = await fetch("https://ipapi.co/json", {
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const d = await res.json();
        if (d && d.country_name) {
          return {
            country: d.country_name || "不明",
            region: d.region || "不明",
            city: d.city || "不明",
          };
        }
      }
    } catch (_) {
      /* フォールバックへ */
    }

    // ---- フォールバック: Cloudflare trace（国コードのみ）----
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 2000);
      const res = await fetch("https://cloudflare.com/cdn-cgi/trace", {
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const text = await res.text();
        const loc = text.match(/loc=([A-Z]{2})/)?.[1];
        if (loc) return { country: loc, region: "不明", city: "不明" };
      }
    } catch (_) {
      /* 両方失敗 */
    }

    return { country: "不明", region: "不明", city: "不明" };
  }

  // ========================================
  // 古いデータの自動クリーンアップ
  // ========================================
  async function cleanupOldData(rtdb, ref, remove) {
    // 週1回だけ実行（localStorageで管理）
    const CLEANUP_KEY = "ll_cleanup";
    const lastCleanup = localStorage.getItem(CLEANUP_KEY);
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    if (lastCleanup && Number(lastCleanup) > weekAgo) return;

    try {
      localStorage.setItem(CLEANUP_KEY, String(Date.now()));
      const cutoffKey = getDateKeysBefore(RETENTION_DAYS);
      const rootRef = ref(rtdb, "analytics");

      // RTDB から日付一覧を取得して古いものを削除
      const { get } =
        await import("https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js");
      const snap = await get(rootRef);
      if (!snap.exists()) return;

      const dates = Object.keys(snap.val() || {});
      const oldDates = dates.filter((d) => d < cutoffKey);

      for (const d of oldDates) {
        await remove(ref(rtdb, `analytics/${d}`));
        console.log(`🗑️ access-log: 古いデータを削除 (${d})`);
      }
      if (oldDates.length > 0) {
        console.log(
          `✅ access-log: ${oldDates.length}件の古いデータを削除しました`,
        );
      }
    } catch (e) {
      console.warn("access-log: クリーンアップ失敗:", e.message);
    }
  }

  // ========================================
  // スクロール深度トラッキング
  // ========================================
  function setupScrollTracking(logEvent) {
    const reached = new Set();
    window.addEventListener(
      "scroll",
      () => {
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
      },
      { passive: true },
    );
  }

  // ========================================
  // 滞在時間トラッキング
  // ========================================
  function setupTimeTracking(logEvent) {
    const start = Date.now();
    const send = () => {
      const ms = Date.now() - start;
      if (ms < 2000) return;
      logEvent("engagement", { ms, sec: Math.round(ms / 1000) });
    };
    window.addEventListener("beforeunload", send);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") send();
    });
  }

  // ========================================
  // クリックトラッキング
  // ========================================
  function setupClickTracking(logEvent) {
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
    document.addEventListener(
      "click",
      (e) => {
        for (const { sel, label } of targets) {
          if (e.target.closest(sel)) {
            logEvent("click", { element: label });
            break;
          }
        }
      },
      { passive: true },
    );
  }

  // ========================================
  // メイン処理
  // ========================================
  async function init(rtdb, ref, push, set, remove) {
    const today = toDateKey(new Date());
    const session = getVisitorInfo();
    const ua = parseUA();
    const loc = await fetchLocation();

    // ---- ログ書き込みヘルパー ----
    const logEvent = (type, extra = {}) => {
      try {
        // logs/ 配下に個別イベントを追記
        const logRef = push(ref(rtdb, `analytics/${today}/logs`));
        set(logRef, {
          type,
          path: location.pathname,
          ts: Date.now(),
          // デバイス情報
          browser: ua.browser,
          os: ua.os,
          device: ua.device,
          // 表示環境
          screen: `${window.innerWidth}x${window.innerHeight}`,
          lang: navigator.language,
          theme: window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light",
          // 地域情報
          country: loc.country,
          region: loc.region,
          city: loc.city,
          // 追加データ
          ...extra,
        });
      } catch (_) {
        /* ログ失敗は無視 */
      }
    };

    // ---- ページビュー ----
    logEvent("page_view", {
      title: document.title || null,
      referrer: document.referrer || "直接アクセス",
      isNewVisitor: session.isNewVisitor,
      isNewSession: session.isNewSession,
    });

    // ---- 行動イベント ----
    setupScrollTracking(logEvent);
    setupTimeTracking(logEvent);
    setupClickTracking(logEvent);

    // ---- 古いデータのクリーンアップ（バックグラウンド）----
    cleanupOldData(rtdb, ref, remove).catch(() => {});
  }

  // ========================================
  // Firebase RTDB 初期化を待って起動
  // ========================================
  async function waitAndInit(attempt = 0) {
    if (window._firebaseRTDB?.rtdb) {
      const { rtdb, ref, push, set } = window._firebaseRTDB;
      // remove は動的インポート
      const { remove } =
        await import("https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js");
      init(rtdb, ref, push, set, remove);
    } else if (attempt < 50) {
      setTimeout(() => waitAndInit(attempt + 1), 100);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => waitAndInit());
  } else {
    waitAndInit();
  }
})();
