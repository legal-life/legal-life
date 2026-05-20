// contact.js — カスタムお問い合わせフォーム（EmailJS送信 + 端末情報収集）

(function () {
  "use strict";

  const SERVICE_ID = "service_glirsis";
  const TEMPLATE_ID = "template_85b3ffx";
  const PUBLIC_KEY = "eG7KMS7F3Fh0PziYy";
  const STORAGE_KEY = "contact_form_draft";
  const CONSENT_KEY = "contact_form_consent";
  const EXPIRE_DAYS = 30;
  const SECTION_MAP = {
    コメント: "section-comment",
    質問: "section-question",
    バグや不具合の報告: "section-bug",
    機能のリクエスト: "section-feature",
    その他のお問い合わせ: "section-other",
  };

  let isLoading = false;

  // UA パーサー（access-log.js と同じロジック）
  function parseUA() {
    const ua = navigator.userAgent;
    let browser = "その他";
    if (ua.includes("Edg/")) browser = "Microsoft Edge";
    else if (ua.includes("OPR/") || ua.includes("Opera")) browser = "Opera";
    else if (ua.includes("Chrome/")) browser = "Google Chrome";
    else if (ua.includes("Firefox/")) browser = "Mozilla Firefox";
    else if (ua.includes("Safari/")) browser = "Safari";

    let os = "その他";
    if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Mac OS X")) os = "macOS";
    else if (ua.includes("Linux")) os = "Linux";

    const device = /Mobi|Android|iPhone|iPad/i.test(ua)
      ? "スマートフォン/タブレット"
      : "PC";
    return { browser, os, device };
  }

  // IPジオロケーション（access-log.js と同じロジック）
  async function fetchLocation() {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 3000);
      const res = await fetch("https://ipapi.co/json", {
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const d = await res.json();
        if (d?.country_name) {
          return {
            country: d.country_name || "不明",
            region: d.region || "不明",
            city: d.city || "不明",
            ip: d.ip || "不明",
          };
        }
      }
    } catch (_) {}

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
        const ip = text.match(/ip=([^\n]+)/)?.[1];
        if (loc)
          return {
            country: loc,
            region: "不明",
            city: "不明",
            ip: ip || "不明",
          };
      }
    } catch (_) {}

    return { country: "不明", region: "不明", city: "不明", ip: "不明" };
  }

  // 端末情報収集（collect-data.js + access-log.js の統合）
  async function collectDeviceInfo() {
    const ua = parseUA();
    const loc = await fetchLocation();

    const conn = navigator.connection;
    const networkType = conn
      ? `${conn.effectiveType ?? "不明"}${conn.downlink ? ` (${conn.downlink}Mbps)` : ""}`
      : "取得不可";

    let storageUsage = "取得不可";
    try {
      storageUsage = `${(encodeURI(JSON.stringify(localStorage)).length / 1024).toFixed(2)} KB`;
    } catch (_) {}

    let memoryUsage = "取得不可 (Chrome以外)";
    if (performance.memory) {
      memoryUsage = `${Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)} MB`;
    }

    return {
      device_browser: ua.browser,
      device_os: ua.os,
      device_type: ua.device,
      device_ua: navigator.userAgent,
      device_screen: `${window.screen.width}x${window.screen.height}`,
      device_viewport: `${window.innerWidth}x${window.innerHeight}`,
      device_theme: window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "ダークモード"
        : "ライトモード",
      device_language: navigator.language,
      device_timezone:
        Intl.DateTimeFormat().resolvedOptions().timeZone || "不明",
      device_network: networkType,
      device_country: loc.country,
      device_region: loc.region,
      device_city: loc.city,
      device_ip: loc.ip,
      device_storage: storageUsage,
      device_memory: memoryUsage,
      page_url: location.href,
      page_referrer: document.referrer || "直接アクセス / ブックマーク",
      sent_at: new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }),
    };
  }

  function init() {
    if (typeof emailjs === "undefined") {
      console.error("❌ EmailJSが読み込まれていません");
      return;
    }
    emailjs.init(PUBLIC_KEY);
    document
      .querySelectorAll('input[name="inquiry_type"]')
      .forEach((r) => r.addEventListener("change", handleTypeChange));
    document
      .getElementById("contact-submit")
      ?.addEventListener("click", handleSubmit);
    // トグルスイッチのイベント
    const toggle = document.getElementById("storage-consent-toggle");
    toggle?.addEventListener("change", (e) => setConsent(e.target.checked));

    // クリアボタンのイベント
    document
      .getElementById("contact-clear")
      ?.addEventListener("click", clearFormAndStorage);

    // 【追加】テンプレートから選択肢を流し込む
        const template = document.getElementById('category-options-template');
        const targets = document.querySelectorAll('.js-category-select');

        if (template && targets.length > 0) {
            targets.forEach(select => {
                // テンプレートの中身をコピーして追加
                select.appendChild(template.content.cloneNode(true));
            });
        }

    // 入力変更時に自動保存（isLoadingがfalseの時だけ動くようにする）
    const formInputs = document.querySelectorAll("#contact-form-wrapper input, #contact-form-wrapper select, #contact-form-wrapper textarea");
    formInputs.forEach(input => {
        input.addEventListener("input", () => { if(!isLoading) saveDraft(); });
        input.addEventListener("change", () => { if(!isLoading) saveDraft(); });
    });

    // 初期表示の反映
    applyConsentUI();
    loadDraft();
  }

  // --- 追加: 同意管理 ---
  function setConsent(isAgreed) {
    if (isAgreed) {
      localStorage.setItem(CONSENT_KEY, "granted");
      saveDraft(); // 同意した瞬間に現在の内容を保存
    } else {
      localStorage.removeItem(CONSENT_KEY);
      localStorage.removeItem(STORAGE_KEY);
    }
    applyConsentUI();
  }

  function applyConsentUI() {
    const isAgreed = localStorage.getItem(CONSENT_KEY) === "granted";
    const toggle = document.getElementById("storage-consent-toggle");
    const statusText = document.getElementById("storage-status-text");
    const banner = document.getElementById("storage-consent-banner");

    if (toggle) toggle.checked = isAgreed;
    if (statusText) statusText.textContent = isAgreed ? "有効" : "無効";

    // 有効時はバナーの色を少し変える演出
    if (isAgreed) {
      banner?.classList.add("is-active");
    } else {
      banner?.classList.remove("is-active");
    }
  }

  // --- 追加: 保存ロジック ---
  function saveDraft() {
    if (localStorage.getItem(CONSENT_KEY) !== "granted" || isLoading) return;

    const name = getVal("field-name");
    const email = getVal("field-email");
    const type = document.querySelector('input[name="inquiry_type"]:checked')?.value || "";
    
    // 【重要】すべての主要項目が空なら保存しない（リロード時の事故防止）
    if (!name && !email && !type) return;

    const draft = {
        name: name,
        gender: document.querySelector('input[name="gender"]:checked')?.value || "",
        age: getVal("field-age"),
        email: email,
        type: type,
        comment: getVal("comment-content"),
        q_cat: getVal("question-category"),
        q_con: getVal("question-content"),
        b_cat: getVal("bug-category"),
        b_con: getVal("bug-content"),
        f_cat: getVal("feature-category"),
        f_con: getVal("feature-content"),
        o_con: getVal("other-content"),
        timestamp: new Date().getTime()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }

  function loadDraft() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const draft = JSON.parse(raw);
    const now = new Date().getTime();
    if (now - draft.timestamp > EXPIRE_DAYS * 24 * 60 * 60 * 1000) {
        localStorage.removeItem(STORAGE_KEY);
        return;
    }

    // 【重要】読み込み開始時にフラグを立てる
    isLoading = true;

    setVal("field-name", draft.name);
    if (draft.gender) {
        const rb = document.querySelector(`input[name="gender"][value="${draft.gender}"]`);
        if (rb) rb.checked = true;
    }
    setVal("field-age", draft.age);
    setVal("field-email", draft.email);
    
    if (draft.type) {
        const rb = document.querySelector(`input[name="inquiry_type"][value="${draft.type}"]`);
        if (rb) {
            rb.checked = true;
            // ラジオボタンの変更イベントを発火させてセクションを表示
            rb.dispatchEvent(new Event('change'));
        }
    }

    setVal("comment-content", draft.comment);
    setVal("question-category", draft.q_cat);
    setVal("question-content", draft.q_con);
    setVal("bug-category", draft.b_cat);
    setVal("bug-content", draft.b_con);
    setVal("feature-category", draft.f_cat);
    setVal("feature-content", draft.f_con);
    setVal("other-content", draft.o_con);

    // 【重要】少し遅らせて読み込みフラグを解除（DOMの反映待ち）
    setTimeout(() => {
        isLoading = false;
    }, 100);
  }

  function setVal(id, val) {
    const el = document.getElementById(id);
    if (el && val) el.value = val;
  }

  // --- 追加: クリア機能 ---
  function clearFormAndStorage() {
    if (!confirm("入力内容をすべて消去しますか？")) return;

    // フォームのリセット
    document
      .querySelectorAll(
        "input[type='text'], input[type='email'], textarea, select",
      )
      .forEach((el) => (el.value = ""));
    document
      .querySelectorAll("input[type='radio']")
      .forEach((el) => (el.checked = false));

    // 表示セクションの初期化
    document.querySelectorAll(".conditional-section").forEach((s) => {
      s.classList.add("hidden");
      s.classList.remove("visible");
    });

    // ストレージの削除
    localStorage.removeItem(STORAGE_KEY);
    alert("内容をクリアしました。");
  }

  function handleTypeChange(e) {
    document.querySelectorAll(".conditional-section").forEach((s) => {
      s.classList.add("hidden");
      s.classList.remove("visible");
    });
    const target = document.getElementById(SECTION_MAP[e.target.value]);
    if (!target) return;
    target.classList.remove("hidden");
    requestAnimationFrame(() => {
      target.classList.add("visible");
      setTimeout(
        () => target.scrollIntoView({ behavior: "smooth", block: "start" }),
        80,
      );
    });
  }

  function validateForm() {
    let isValid = true;
    document
      .querySelectorAll(".field-error")
      .forEach((el) => (el.textContent = ""));
    document
      .querySelectorAll(".form-field.has-error")
      .forEach((el) => el.classList.remove("has-error"));

    if (!getVal("field-name")) {
      setError("field-name", "お名前を入力してください");
      isValid = false;
    }
    if (!document.querySelector('input[name="gender"]:checked')) {
      setError("gender-group", "性別を選択してください");
      isValid = false;
    }
    if (!getVal("field-age")) {
      setError("field-age", "年代を選択してください");
      isValid = false;
    }

    const email = getVal("field-email");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("field-email", "正しいメールアドレスの形式で入力してください");
      isValid = false;
    }
    if (!document.querySelector('input[name="inquiry_type"]:checked')) {
      setError("inquiry-type-group", "お問い合わせの種類を選択してください");
      isValid = false;
    }

    const visibleSection = document.querySelector(
      ".conditional-section.visible",
    );
    if (visibleSection) {
      visibleSection.querySelectorAll("select[required]").forEach((sel) => {
        if (!sel.value) {
          setError(sel.id, "分野を選択してください");
          isValid = false;
        }
      });
      visibleSection.querySelectorAll("textarea[required]").forEach((ta) => {
        if (!ta.value.trim()) {
          setError(ta.id, "お問い合わせ内容を入力してください");
          isValid = false;
        }
      });
    }
    return isValid;
  }

  function getVal(id) {
    return document.getElementById(id)?.value.trim() || "";
  }

  function setError(id, message) {
    document
      .getElementById(id)
      ?.closest(".form-field")
      ?.classList.add("has-error");
    const el = document.getElementById(id + "-error");
    if (el) el.textContent = message;
  }

  async function handleSubmit() {
    if (!validateForm()) {
      document
        .querySelector(".form-field.has-error")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const submitBtn = document.getElementById("contact-submit");
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="btn-spinner"></span>送信中...';
    document.getElementById("submit-error")?.setAttribute("hidden", "");

    const inquiryType =
      document.querySelector('input[name="inquiry_type"]:checked')?.value || "";
    const visibleSection = document.querySelector(
      ".conditional-section.visible",
    );
    const category = visibleSection?.querySelector("select")?.value || "";
    const content =
      visibleSection?.querySelector("textarea")?.value.trim() || "";

    const deviceInfo = await collectDeviceInfo();

    const params = {
      from_name: getVal("field-name"),
      gender:
        document.querySelector('input[name="gender"]:checked')?.value || "",
      age_group: getVal("field-age"),
      reply_email: getVal("field-email") || "（未入力）",
      inquiry_type: inquiryType,
      category: category || "（なし）",
      content: content,
      ...deviceInfo,
    };

    console.groupCollapsed("📤 [Contact] 送信データ");
    console.table(params);
    console.groupEnd();

    try {
      await emailjs.send(SERVICE_ID, TEMPLATE_ID, params);
      showSuccess();
    } catch (err) {
      console.error("❌ 送信失敗:", err);
      const errBanner = document.getElementById("submit-error");
      if (errBanner) {
        errBanner.removeAttribute("hidden");
        errBanner.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      submitBtn.disabled = false;
      submitBtn.innerHTML = "送信する";
    }
  }

  function showSuccess() {
    localStorage.removeItem(STORAGE_KEY); // 送信完了したら下書きを消す
    document.getElementById("contact-form-wrapper").style.display = "none";
    const success = document.getElementById("contact-success");
    success.removeAttribute("hidden");
    success.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
