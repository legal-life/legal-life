/**
 * account.js v6.0
 * 修正: 2FA入場制御/削除申請重複防止/profile.emailVerify修正/activity表示改善/device登録強化
 * 修正: デバイスログアウト/2FA/バックアップコード/ロード速度/URL保持
 */
import { getApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  EmailAuthProvider,
  linkWithCredential,
  linkWithPopup,
  unlink,
  reauthenticateWithCredential,
  updatePassword,
  updateEmail,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  addDoc,
  deleteDoc,
  getDocs,
  collection,
  query,
  orderBy,
  limit,
  where,
  Timestamp,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

// ── Firebase ──
let _auth, _db;
async function getFirebase() {
  if (_auth && _db) return { auth: _auth, db: _db };
  const app = await new Promise((r) => {
    const c = () => {
      try {
        r(getApp());
      } catch {
        setTimeout(c, 50);
      }
    };
    c();
  });
  _auth = getAuth(app);
  _db = getFirestore(app);
  await setPersistence(_auth, browserLocalPersistence).catch(() => {});
  return { auth: _auth, db: _db };
}

// ── 定数 ──
// ★ Resend Worker URL (STEP 6 で実際の URL に変更してください)
const MAIL_WORKER_URL = "https://legal-life-mailer.CHANGE-ME.workers.dev";
const OTP_EXPIRE_MIN = 5;
const SESSION_KEY = "legallife_session_id";
const BACKUP_CODE_COUNT = 10;
const CONSENT_INTERVAL = 30 * 24 * 60 * 60 * 1000;

const PAGE = (() => {
  const p = location.pathname.replace(/\/$/, "");
  return (
    {
      "/account/signup": "signup",
      "/account/login": "login",
      "/account/logout": "logout",
      "/account/delete": "delete",
      "/account/settings": "settings",
      "/account/settings/profile": "profile",
      "/account/settings/privacy": "privacy",
      "/account/security": "security",
      "/account/security/activity": "activity",
      "/account/security/device": "device",
      "/account/security/pass": "pass",
      "/account/security/2fa": "twofa",
      "/account/security/2fa/backup-code": "backup",
      "/account/security/methods": "methods",
    }[p] || null
  );
})();

// ── utils ──
const esc = (s) =>
  String(s ?? "").replace(
    /[<>&"']/g,
    (c) =>
      ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
function $(id) {
  return document.getElementById(id);
}
function show(id) {
  const e = $(id);
  if (e) e.style.display = "block";
}
function hide(id) {
  const e = $(id);
  if (e) e.style.display = "none";
}
function setMsg(id, txt, type = "") {
  const e = typeof id === "string" ? $(id) : id;
  if (!e) return;
  e.textContent = txt;
  e.className = `settings-msg ${type}`;
}
function btn(id, txt = null, dis = null) {
  const e = $(id);
  if (!e) return;
  if (txt !== null) e.textContent = txt;
  if (dis !== null) e.disabled = dis;
}
function fmtDate(ts) {
  if (!ts) return "不明";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}
function relDate(ts) {
  if (!ts) return "不明";
  const d = ts.toDate ? ts.toDate() : new Date(ts),
    diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000),
    hr = Math.floor(diff / 3600000),
    day = Math.floor(diff / 86400000);
  if (min < 1) return "たった今";
  if (min < 60) return `${min}分前`;
  if (hr < 24) return `${hr}時間前`;
  if (day < 7) return `${day}日前`;
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
function parseUA() {
  const ua = navigator.userAgent;
  let b = "その他",
    os = "その他";
  if (ua.includes("Edg/")) b = "Edge";
  else if (ua.includes("Chrome/")) b = "Chrome";
  else if (ua.includes("Firefox/")) b = "Firefox";
  else if (ua.includes("Safari/")) b = "Safari";
  if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS X")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  return {
    browser: b,
    os,
    device: /Mobi|Android|iPhone|iPad/i.test(ua)
      ? "スマートフォン/タブレット"
      : "PC",
  };
}
async function fetchLocation() {
  try {
    const r = await fetch("https://ipapi.co/json", {
      signal: AbortSignal.timeout(3000),
    });
    if (r.ok) {
      const d = await r.json();
      if (d?.country_name)
        return [d.city, d.country_name].filter(Boolean).join(", ");
    }
  } catch (_) {}
  try {
    const r = await fetch("https://cloudflare.com/cdn-cgi/trace", {
      signal: AbortSignal.timeout(2000),
    });
    if (r.ok) return (await r.text()).match(/loc=([A-Z]{2})/)?.[1] || "不明";
  } catch (_) {}
  return "不明";
}
function toast(msg, type = "info") {
  const t = Object.assign(document.createElement("div"), {
    className: `toast toast-${type}`,
    textContent: msg,
  });
  document.body.appendChild(t);
  setTimeout(() => t.classList.add("toast-show"), 10);
  setTimeout(() => {
    t.classList.remove("toast-show");
    setTimeout(() => t.remove(), 400);
  }, 3500);
}

// ── URL暗号化 ──
const encR = (url) => {
  try {
    return btoa(unescape(encodeURIComponent(url)));
  } catch {
    return "";
  }
};
const decR = (enc) => {
  try {
    const d = decodeURIComponent(escape(atob(enc)));
    return d.startsWith("/") ? d : null;
  } catch {
    return null;
  }
};
function afterLogin() {
  const r = new URLSearchParams(location.search).get("r");
  window.location.replace((r ? decR(r) : null) || "/account/settings/");
}

// ── アクティビティ (users/{uid}/activity = 3セグメント) ──
async function logAct(uid, type, detail = "") {
  const { db } = await getFirebase();
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
  } catch (_) {}
}

// ── OTP ──
const genOTP = () =>
  String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
async function saveOTP(uid, db, code, purpose) {
  await setDoc(
    doc(db, "users", uid, "security", "twoFactor"),
    {
      otpCode: code,
      otpExpiryMs: Date.now() + OTP_EXPIRE_MIN * 60000,
      otpPurpose: purpose,
    },
    { merge: true },
  );
}
async function verifyOTP(uid, db, input, purpose) {
  const s = await getDoc(doc(db, "users", uid, "security", "twoFactor"));
  if (!s.exists()) return { ok: false, reason: "コードが見つかりません" };
  const { otpCode, otpExpiryMs, otpPurpose } = s.data();
  if (otpPurpose !== purpose)
    return { ok: false, reason: "用途が一致しません" };
  if (Date.now() > otpExpiryMs)
    return { ok: false, reason: "有効期限が切れています" };
  if (otpCode !== input)
    return { ok: false, reason: "コードが正しくありません" };
  return { ok: true };
}
async function clearOTP(uid, db) {
  await setDoc(
    doc(db, "users", uid, "security", "twoFactor"),
    { otpCode: null, otpExpiryMs: null, otpPurpose: null },
    { merge: true },
  );
}
async function sendOTP(user, code, purpose) {
  if (!user?.email) throw new Error("メールアドレスが設定されていません");
  const res = await fetch(MAIL_WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "otp",
      to_email: user.email,
      to_name: user.displayName || "ユーザー",
      otp_code: code,
      expiry_minutes: OTP_EXPIRE_MIN,
      purpose,
    }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || "メール送信に失敗しました");
  }
}
async function is2FA(uid, db) {
  try {
    const s = await getDoc(doc(db, "users", uid, "security", "twoFactor"));
    return s.exists() && (s.data().enabled ?? false);
  } catch {
    return false;
  }
}

// ── バックアップコード ──
async function tryBackup(uid, db, input) {
  if (!input?.trim()) return { ok: false };
  try {
    const s = await getDoc(doc(db, "users", uid, "security", "BackUpCode"));
    if (!s.exists())
      return { ok: false, reason: "バックアップコードが設定されていません" };
    const codes = s.data().codes || [];
    const idx = codes.findIndex(
      (c) => !c.used && c.code === input.toUpperCase().trim(),
    );
    if (idx === -1)
      return { ok: false, reason: "バックアップコードが正しくありません" };
    codes[idx].used = true;
    await setDoc(
      doc(db, "users", uid, "security", "BackUpCode"),
      { codes },
      { merge: true },
    );
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

// ── OTPパネル ──
function showOTPPanel(
  cid,
  {
    title = "認証コードを入力",
    desc = "",
    showBackup = false,
    onVerify,
    onCancel,
  },
) {
  const c = $(cid);
  if (!c) return;
  c.innerHTML = `
<div class="otp-panel">
  <p class="otp-panel-title">${esc(title)}</p>
  <p class="otp-panel-desc">${esc(desc)}</p>
  <input id="_otp" type="text" inputmode="numeric" maxlength="6" placeholder="000000" class="otp-panel-input" autocomplete="one-time-code">
  ${showBackup ? `<p class="otp-panel-or">または バックアップコードを使用</p><input id="_bkp" type="text" maxlength="16" placeholder="XXXXXXXX" class="otp-panel-input otp-panel-backup">` : ""}
  <p id="_err" class="otp-error"></p>
  <div class="otp-panel-btns">
    <button id="_oc" class="btn-secondary-sm">キャンセル</button>
    <button id="_os" class="btn-primary-sm">確認する</button>
  </div>
</div>`;
  c.style.display = "block";
  const inp = c.querySelector("#_otp"),
    bkp = c.querySelector("#_bkp"),
    err = c.querySelector("#_err"),
    sub = c.querySelector("#_os"),
    can = c.querySelector("#_oc");
  const cleanup = () => {
    c.innerHTML = "";
    c.style.display = "none";
  };
  can.onclick = () => {
    cleanup();
    onCancel?.();
  };
  setTimeout(() => inp?.focus(), 50);
  sub.onclick = async () => {
    const code = inp?.value.trim() || "",
      backup = bkp?.value.trim() || "",
      input = code || backup;
    if (!input) {
      err.textContent = "コードを入力してください";
      return;
    }
    sub.disabled = true;
    sub.textContent = "確認中...";
    err.textContent = "";
    const res = await onVerify(input, !!backup && !code);
    if (res.ok) cleanup();
    else {
      err.textContent = res.reason || "コードが正しくありません";
      sub.disabled = false;
      sub.textContent = "確認する";
    }
  };
  if (inp)
    inp.onkeydown = (e) => {
      if (e.key === "Enter") sub.click();
    };
}

function popup(html) {
  const o = Object.assign(document.createElement("div"), {
    className: "popup-overlay",
    innerHTML: `<div class="popup-box">${html}</div>`,
  });
  document.body.appendChild(o);
  o.addEventListener("click", (e) => {
    if (e.target === o) o.remove();
  });
  return o;
}

// ── セッション ──
function getSid() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}
async function regSession(user, db) {
  const sid = getSid(),
    ref = doc(db, "users", user.uid, "sessions", sid),
    ua = parseUA();
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
  } catch (_) {}
}
async function delSession(user, db) {
  try {
    const sid = localStorage.getItem(SESSION_KEY);
    if (sid) {
      await deleteDoc(doc(db, "users", user.uid, "sessions", sid));
      localStorage.removeItem(SESSION_KEY);
    }
  } catch (_) {}
}

// ── 認証要求 ──
async function requireAuth() {
  const { auth } = await getFirebase();
  return new Promise((resolve) => {
    const u = onAuthStateChanged(auth, (user) => {
      u();
      if (!user) {
        window.location.replace(
          `/account/login?r=${encR(location.pathname + location.search)}`,
        );
      } else resolve(user);
    });
  });
}

// ─────────────────────────
// LOGIN
// ─────────────────────────
let _pendingEmail = "",
  _pendingPass = "";
async function initLogin() {
  const { auth, db } = await getFirebase();
  onAuthStateChanged(auth, (u) => {
    if (u) afterLogin();
  });

  // signup リンクに r パラメータを維持
  const r = new URLSearchParams(location.search).get("r");
  const signupLink = document.querySelector("a[href='/account/signup']");
  if (signupLink && r) signupLink.href = `/account/signup?r=${r}`;

  const doGoogle = async () => {
    const p = new GoogleAuthProvider();
    const last = localStorage.getItem("ll_last_consent");
    p.setCustomParameters({
      prompt:
        !last || Date.now() - parseInt(last) > CONSENT_INTERVAL
          ? "consent"
          : "select_account",
    });
    try {
      const res = await signInWithPopup(auth, p);
      localStorage.setItem("ll_last_consent", Date.now().toString());
      await _afterLogin(res.user, "Google", db);
    } catch (e) {
      if (e.code === "auth/popup-blocked") {
        sessionStorage.setItem("ll_redirect_login", "1");
        await signInWithRedirect(auth, p);
      } else {
        setMsg("google-error", e.message, "error");
        $("google-error")?.style.setProperty("display", "block");
      }
    }
  };

  if (sessionStorage.getItem("ll_redirect_login")) {
    sessionStorage.removeItem("ll_redirect_login");
    try {
      btn("google-login-btn", "確認中...", true);
      const res = await getRedirectResult(auth);
      if (res?.user) {
        localStorage.setItem("ll_last_consent", Date.now().toString());
        await _afterLogin(res.user, "Google", db);
        return;
      }
    } catch (e) {
      setMsg("google-error", e.message, "error");
    } finally {
      btn("google-login-btn", "Googleでログイン", false);
    }
  }

  $("google-login-btn")?.addEventListener("click", doGoogle);

  const doEmail = async () => {
    const email = $("login-email")?.value.trim(),
      pass = $("login-password")?.value,
      msgEl = $("login-msg");
    if (!email || !pass)
      return setMsg(
        msgEl,
        "メールアドレスとパスワードを入力してください",
        "error",
      );
    btn("login-submit", "確認中...", true);
    setMsg(msgEl, "", "");
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const enabled = await is2FA(cred.user.uid, db);
      if (enabled && cred.user.email) {
        const code = genOTP();
        await saveOTP(cred.user.uid, db, code, "login_verify");
        await sendOTP(cred.user, code, "ログイン認証");
        await signOut(auth);
        _pendingEmail = email;
        _pendingPass = pass;
        setMsg(
          msgEl,
          `📧 ${cred.user.email} に認証コードを送信しました`,
          "success",
        );
        hide("login-form-section");
        show("twofa-verify-section");
        showOTPPanel("twofa-panel-container", {
          title: "二段階認証",
          desc: "メールに送信された6桁のコードを入力してください",
          showBackup: true,
          onVerify: async (input, isBackup) => {
            // 再サインイン
            let cred2;
            try {
              cred2 = await signInWithEmailAndPassword(
                auth,
                _pendingEmail,
                _pendingPass,
              );
            } catch {
              return { ok: false, reason: "再認証に失敗しました" };
            }
            if (isBackup) {
              const res = await tryBackup(cred2.user.uid, db, input);
              if (!res.ok) {
                await signOut(auth);
                return { ok: false, reason: res.reason };
              }
            } else {
              const res = await verifyOTP(
                cred2.user.uid,
                db,
                input,
                "login_verify",
              );
              if (!res.ok) {
                await signOut(auth);
                return res;
              }
              await clearOTP(cred2.user.uid, db);
            }
            _pendingEmail = "";
            _pendingPass = "";
            await _afterLogin(cred2.user, "メール+2FA", db);
            return { ok: true };
          },
          onCancel: () => {
            _pendingEmail = "";
            _pendingPass = "";
            show("login-form-section");
            hide("twofa-verify-section");
            btn("login-submit", "ログイン", false);
          },
        });
        return;
      }
      await _afterLogin(cred.user, "メール", db);
    } catch (e) {
      const M = {
        "auth/user-not-found": "登録されていません",
        "auth/wrong-password": "パスワードが間違っています",
        "auth/invalid-credential": "メールまたはパスワードが間違っています",
        "auth/too-many-requests": "しばらく後に再試行してください",
      };
      setMsg($("login-msg"), M[e.code] || e.message, "error");
    } finally {
      btn("login-submit", "ログイン", false);
    }
  };

  $("login-submit")?.addEventListener("click", doEmail);
  $("login-password")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") doEmail();
  });
  $("forgot-password-btn")?.addEventListener("click", async () => {
    const email = $("login-email")?.value.trim(),
      msgEl = $("login-msg");
    if (!email)
      return setMsg(msgEl, "メールアドレスを入力してください", "error");
    try {
      await sendPasswordResetEmail(auth, email);
      setMsg(
        msgEl,
        "✅ リセットメールを送信しました。迷惑メールフォルダもご確認ください。",
        "success",
      );
    } catch (e) {
      setMsg(
        msgEl,
        e.code === "auth/user-not-found" ? "登録されていません" : e.message,
        "error",
      );
    }
  });
}
async function _afterLogin(user, method, db) {
  await regSession(user, db);
  await logAct(user.uid, "login", method);
  afterLogin();
}

// ─────────────────────────
// SIGNUP
// ─────────────────────────
async function initSignup() {
  const { auth } = await getFirebase();
  onAuthStateChanged(auth, (u) => {
    if (u) afterLogin();
  });

  // r パラメータ維持
  const r = new URLSearchParams(location.search).get("r");
  const loginLink = document.querySelector("a[href='/account/login']");
  if (loginLink && r) loginLink.href = `/account/login?r=${r}`;

  const doGoogle = async () => {
    const p = new GoogleAuthProvider();
    p.setCustomParameters({ prompt: "consent" });
    localStorage.setItem("ll_last_consent", Date.now().toString());
    try {
      const res = await signInWithPopup(auth, p);
      await logAct(res.user.uid, "signup", "Google");
      afterLogin();
    } catch (e) {
      if (e.code === "auth/popup-blocked") {
        sessionStorage.setItem("ll_redirect_signup", "1");
        await signInWithRedirect(auth, p);
      } else {
        setMsg("google-error", e.message, "error");
        $("google-error")?.style.setProperty("display", "block");
      }
    }
  };
  if (sessionStorage.getItem("ll_redirect_signup")) {
    sessionStorage.removeItem("ll_redirect_signup");
    try {
      const res = await getRedirectResult(auth);
      if (res?.user) {
        await logAct(res.user.uid, "signup", "Google");
        afterLogin();
        return;
      }
    } catch (_) {}
  }
  $("google-signup-btn")?.addEventListener("click", doGoogle);
  $("signup-submit")?.addEventListener("click", async () => {
    const name = $("signup-name")?.value.trim(),
      email = $("signup-email")?.value.trim(),
      pass = $("signup-password")?.value,
      pass2 = $("signup-password-confirm")?.value,
      msgEl = $("signup-msg");
    if (!name) return setMsg(msgEl, "お名前を入力してください", "error");
    if (!email)
      return setMsg(msgEl, "メールアドレスを入力してください", "error");
    if (pass.length < 6) return setMsg(msgEl, "パスワードは6文字以上", "error");
    if (pass !== pass2)
      return setMsg(msgEl, "パスワードが一致しません", "error");
    btn("signup-submit", "作成中...", true);
    setMsg(msgEl, "", "");
    try {
      const c = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(c.user, { displayName: name });
      await sendEmailVerification(c.user).catch(() => {});
      await logAct(c.user.uid, "signup", "メール");
      afterLogin();
    } catch (e) {
      const M = {
        "auth/email-already-in-use": "すでに使用済みです",
        "auth/invalid-email": "形式が正しくありません",
        "auth/weak-password": "6文字以上にしてください",
      };
      setMsg(msgEl, M[e.code] || e.message, "error");
      btn("signup-submit", "作成する", false);
    }
  });
}

// ─────────────────────────
// LOGOUT
// ─────────────────────────
async function initLogout() {
  const { auth, db } = await getFirebase();
  try {
    const u = auth.currentUser;
    if (u) {
      await Promise.allSettled([
        logAct(u.uid, "logout", ""),
        delSession(u, db),
      ]);
    }
    await signOut(auth);
    sessionStorage.removeItem("ll_auth_cache");
    show("logout-success");
    hide("logout-loading");
    setTimeout(() => window.location.replace("/"), 3000);
  } catch {
    window.location.replace("/");
  }
}

// ─────────────────────────
// DELETE
// ─────────────────────────
async function initDelete() {
  const user = await requireAuth();
  const { auth, db } = await getFirebase();

  // ★ 削除申請済みかチェック → 申請済みなら専用バナーを表示してフォームを隠す
  const userSnap = await getDoc(doc(db, "users", user.uid)).catch(() => null);
  if (userSnap?.exists() && userSnap.data().deletionPending) {
    hide("delete-form-wrapper");
    show("deletion-already-banner");
    const d = userSnap.data().scheduledDeletion?.toDate();
    const dEl = $("deletion-date-display");
    if (dEl && d) dEl.textContent = d.toLocaleString("ja-JP");
    $("cancel-delete-from-delete-page")?.addEventListener("click", async () => {
      const msgEl = $("cancel-delete-msg");
      btn("cancel-delete-from-delete-page", "処理中...", true);
      try {
        await setDoc(
          doc(db, "users", user.uid),
          { deletionPending: false, scheduledDeletion: null },
          { merge: true },
        );
        setMsg(msgEl, "✅ 削除申請をキャンセルしました", "success");
        setTimeout(() => window.location.replace("/account/settings/"), 1500);
      } catch (e) {
        setMsg(msgEl, e.message, "error");
        btn(
          "cancel-delete-from-delete-page",
          "削除申請をキャンセルする",
          false,
        );
      }
    });
    return; // フォーム初期化をスキップ
  }

  const cbs = document.querySelectorAll(".deletion-checkbox"),
    execBtn = $("delete-execute-btn");
  const upd = () => {
    if (execBtn) execBtn.disabled = ![...cbs].every((c) => c.checked);
  };
  cbs.forEach((c) => c.addEventListener("change", upd));
  upd();
  execBtn?.addEventListener("click", async () => {
    const msgEl = $("delete-msg");
    btn("delete-execute-btn", "処理中...", true);
    const enabled = await is2FA(user.uid, db);
    if (enabled && user.email) {
      const code = genOTP();
      await saveOTP(user.uid, db, code, "account_delete");
      await sendOTP(user, code, "アカウント削除申請");
      setMsg(msgEl, `📧 ${user.email} に認証コードを送信しました`, "success");
      showOTPPanel("delete-otp-container", {
        title: "本人確認",
        desc: "コードを入力してください",
        onVerify: async (input) => {
          const res = await verifyOTP(user.uid, db, input, "account_delete");
          if (!res.ok) {
            btn("delete-execute-btn", "削除を申請する", false);
            return res;
          }
          await clearOTP(user.uid, db);
          await _execDelete(user, auth, db);
          return { ok: true };
        },
        onCancel: () => btn("delete-execute-btn", "削除を申請する", false),
      });
      return;
    }
    await _execDelete(user, auth, db);
  });
}
async function _execDelete(user, auth, db) {
  await setDoc(
    doc(db, "users", user.uid),
    {
      deletionPending: true,
      scheduledDeletion: Timestamp.fromMillis(Date.now() + 30 * 86400000),
      deletionRequestAt: serverTimestamp(),
    },
    { merge: true },
  );
  await logAct(user.uid, "deletion_request", "30日後削除予定");
  await delSession(user, db);
  await signOut(auth);
  sessionStorage.removeItem("ll_auth_cache");
  hide("delete-form-wrapper");
  show("delete-success");
}

// ─────────────────────────
// SETTINGS
// ─────────────────────────
async function initSettings() {
  const user = await requireAuth();
  const { db } = await getFirebase();
  renderCard(user);
  const snap = await getDoc(doc(db, "users", user.uid)).catch(() => null);
  if (snap?.exists() && snap.data().deletionPending) {
    const d = snap.data().scheduledDeletion?.toDate();
    show("deletion-pending-banner");
    const el = $("deletion-scheduled-date");
    if (el && d) el.textContent = d.toLocaleString("ja-JP");
  }
  $("cancel-deletion-btn")?.addEventListener("click", async () => {
    if (!confirm("キャンセルしますか？")) return;
    await setDoc(
      doc(db, "users", user.uid),
      { deletionPending: false, scheduledDeletion: null },
      { merge: true },
    );
    hide("deletion-pending-banner");
  });
  $("settings-logout-btn")?.addEventListener("click", () => {
    window.location.href = "/account/logout";
  });
}

// ─────────────────────────
// PROFILE (#11 list format)
// ─────────────────────────
async function initProfile() {
  const user = await requireAuth();
  const { auth, db } = await getFirebase();
  renderProfile(user);
  $("edit-displayname-btn")?.addEventListener("click", () => {
    const o = popup(`
<h3 class="popup-title">表示名を変更</h3>
<div class="form-group"><label class="form-label">新しい表示名</label><input id="_ni" type="text" class="form-input" value="${esc(user.displayName || "")}" maxlength="50"></div>
<p id="_nm" class="settings-msg"></p>
<div class="popup-btns"><button id="_nc" class="btn-secondary-sm">キャンセル</button><button id="_ns" class="btn-primary-sm">保存する</button></div>`);
    o.querySelector("#_nc").onclick = () => o.remove();
    o.querySelector("#_ns").onclick = async () => {
      const name = o.querySelector("#_ni")?.value.trim(),
        msgEl = o.querySelector("#_nm");
      if (!name) {
        setMsg(msgEl, "名前を入力してください", "error");
        return;
      }
      o.querySelector("#_ns").disabled = true;
      try {
        await updateProfile(auth.currentUser, { displayName: name });
        await logAct(user.uid, "profile_update", "表示名変更");
        renderProfile(auth.currentUser);
        o.remove();
        toast("表示名を変更しました", "success");
      } catch (e) {
        setMsg(msgEl, e.message, "error");
        o.querySelector("#_ns").disabled = false;
      }
    };
    setTimeout(() => o.querySelector("#_ni")?.focus(), 50);
  });
  $("copy-uuid-btn")?.addEventListener("click", async () => {
    await navigator.clipboard.writeText(user.uid).catch(() => {});
    const b = $("copy-uuid-btn");
    if (b) {
      b.textContent = "✅";
      setTimeout(() => (b.textContent = "コピー"), 2000);
    }
  });
  // ★ reload() で最新のemailVerified状態を取得してからバナー判定
  const cu = auth.currentUser;
  try {
    await cu.reload();
  } catch (_) {}
  const freshUser = auth.currentUser;
  if (freshUser?.email && !freshUser?.emailVerified) {
    show("email-verify-banner");
  }
  $("send-verify-email-btn")?.addEventListener("click", async () => {
    btn("send-verify-email-btn", "送信中...", true);
    setMsg("verify-email-msg", "", "");
    try {
      await sendEmailVerification(auth.currentUser);
      setMsg("verify-email-msg", "✅ 確認メールを送信しました", "success");
    } catch (e) {
      setMsg(
        "verify-email-msg",
        e.code === "auth/too-many-requests"
          ? "しばらく待ってから再試行してください"
          : e.message,
        "error",
      );
    } finally {
      setTimeout(
        () => btn("send-verify-email-btn", "確認メールを再送する", false),
        60000,
      );
    }
  });
}

// ─────────────────────────
// PRIVACY
// ─────────────────────────
const NOTIFS = [
  { key: "login", label: "ログイン通知", desc: "ログイン時にメールを受け取る" },
  {
    key: "passwordChange",
    label: "パスワード変更通知",
    desc: "パスワード変更時にメールを受け取る",
  },
  {
    key: "emailChange",
    label: "メールアドレス変更通知",
    desc: "メール変更時に通知を受け取る",
  },
  {
    key: "otpChange",
    label: "二段階認証変更通知",
    desc: "2FA設定変更時に通知を受け取る",
  },
  {
    key: "deletionRequest",
    label: "アカウント削除通知",
    desc: "削除申請時にメールを受け取る",
  },
  {
    key: "maintenance",
    label: "メンテナンス通知",
    desc: "メンテナンス・障害情報を受け取る",
  },
  {
    key: "newFeature",
    label: "新機能通知",
    desc: "新機能リリース情報を受け取る",
  },
  {
    key: "newsletter",
    label: "ニュースレター",
    desc: "法令関連ニュースを受け取る",
  },
];
async function initPrivacy() {
  const user = await requireAuth();
  const { db } = await getFirebase();
  const container = $("notification-settings");
  if (!container) return;
  container.innerHTML = '<p class="loading-text">読み込み中...</p>';
  try {
    let prefs = {};
    try {
      const s = await getDoc(
        doc(db, "users", user.uid, "settings", "notifications"),
      );
      if (s.exists()) prefs = s.data();
    } catch (_) {}
    container.innerHTML = NOTIFS.map(
      ({ key, label, desc }) => `
<div class="setting-toggle-item">
    <div class="setting-text"><span class="setting-label">${label}</span><p class="setting-description">${desc}</p></div>
    <label class="switch"><input type="checkbox" class="notif-toggle" data-key="${key}" ${prefs[key] !== false ? "checked" : ""} ${!user.emailVerified ? "disabled" : ""}><span class="slider round"></span></label>
</div>`,
    ).join("");
    if (!user.emailVerified)
      container.insertAdjacentHTML(
        "beforeend",
        `<p style="color:#e74c3c;font-size:0.82rem;margin-top:10px;">⚠️ メールアドレス未確認のため通知は届きません。</p>`,
      );
    container.querySelectorAll(".notif-toggle").forEach((t) => {
      t.addEventListener("change", async (e) => {
        try {
          await setDoc(
            doc(db, "users", user.uid, "settings", "notifications"),
            { [e.target.dataset.key]: e.target.checked },
            { merge: true },
          );
        } catch (_) {}
      });
    });
  } catch (e) {
    container.innerHTML = `<p class="error-text">読み込みに失敗: ${esc(e.message)}</p>`;
  }
}

// ─────────────────────────
// SECURITY (並列ロード)
// ─────────────────────────
async function initSecurity() {
  const user = await requireAuth();
  const { db } = await getFirebase();
  const [tfSnap] = await Promise.all([
    getDoc(doc(db, "users", user.uid, "security", "twoFactor")).catch(
      () => null,
    ),
  ]);
  const en = tfSnap?.exists() && (tfSnap.data().enabled ?? false);

  // ★ 2FA有効時はセキュリティセクション入場時にOTP認証を要求
  if (en && user.email) {
    const container = document.querySelector(".account-container");
    if (container) {
      container.innerHTML = `
<h1 class="account-title">セキュリティ</h1>
<p class="account-subtitle">アクセスするには本人確認が必要です</p>
<div class="banner banner-info" style="margin-bottom:16px;">
  <p class="banner-title" style="display:flex;align-items:center;gap:6px;">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
    二段階認証が有効です
  </p>
  <p style="font-size:.83rem;margin-bottom:12px;">セキュリティ設定を表示するには認証コードが必要です。</p>
</div>
<p id="security-otp-msg" class="settings-msg"></p>
<div id="security-otp-panel"></div>
<div class="link-group" style="margin-top:16px;"><a href="/account/settings/" class="link-item">アカウント設定に戻る</a></div>`;
      const code = genOTP();
      await saveOTP(user.uid, db, code, "security_access");
      await sendOTP(user, code, "セキュリティセクションへのアクセス");
      setMsg(
        "security-otp-msg",
        `📧 ${user.email} に認証コードを送信しました`,
        "success",
      );
      showOTPPanel("security-otp-panel", {
        title: "本人確認",
        desc: "認証コードを入力してください",
        showBackup: true,
        onVerify: async (input, isBackup) => {
          if (isBackup) {
            const res = await tryBackup(user.uid, db, input);
            if (!res.ok) return res;
          } else {
            const res = await verifyOTP(user.uid, db, input, "security_access");
            if (!res.ok) return res;
            await clearOTP(user.uid, db);
          }
          window.location.reload(); // 認証後リロードでページ再表示
          return { ok: true };
        },
        onCancel: () => window.location.replace("/account/settings/"),
      });
      return; // OTP確認前はページ内容を表示しない
    }
  }

  const hp = user.providerData.some((p) => p.providerId === "password");
  const b = $("2fa-status-badge");
  if (b) {
    b.textContent = en ? "有効" : "無効";
    b.className = `status-badge ${en ? "enabled" : "disabled"}`;
  }
  const pb = $("password-status-badge");
  if (pb) pb.textContent = hp ? "設定済み" : "未設定";
  const el = $("last-signin-date");
  if (el && user.metadata?.lastSignInTime)
    el.textContent = new Date(user.metadata.lastSignInTime).toLocaleString(
      "ja-JP",
      { timeZone: "Asia/Tokyo" },
    );
}

// ─────────────────────────
// ACTIVITY (SVGアイコン)
// ─────────────────────────
const ACT_SVG = {
  login:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>',
  logout:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
  signup:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  password_change:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
  profile_update:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  twofa_change:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  email_change:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
  method_change:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
  deletion_request:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>',
  _default:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
};
const ACT_LABEL = {
  login: "ログイン",
  logout: "ログアウト",
  signup: "アカウント作成",
  password_change: "パスワード変更",
  profile_update: "プロフィール更新",
  twofa_change: "二段階認証変更",
  email_change: "メールアドレス変更",
  method_change: "ログイン方法変更",
  deletion_request: "アカウント削除申請",
};
async function initActivity() {
  const user = await requireAuth();
  const { db } = await getFirebase();
  const listEl = $("activity-list");
  if (!listEl) return;
  listEl.innerHTML = '<p class="loading-text">読み込み中...</p>';
  try {
    const q = query(
      collection(db, "users", user.uid, "activity"),
      orderBy("timestamp", "desc"),
      limit(50),
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      listEl.innerHTML =
        '<p class="empty-text">アクティビティ履歴はありません</p>';
      return;
    }
    listEl.innerHTML = snap.docs
      .map((d) => {
        const data = d.data(),
          svg = ACT_SVG[data.type] || ACT_SVG._default,
          label = ACT_LABEL[data.type] || data.type,
          ts = data.timestamp;
        const env = [data.browser, data.os].filter(Boolean).join(" / ");
        const detail = data.detail
          ? ` <span style="color:#94a3b8;">— ${esc(data.detail)}</span>`
          : "";
        return `<div class="activity-item">
  <div class="act-icon-wrap">${svg}</div>
  <div class="act-body">
    <div class="act-header">
      <span class="act-label">${esc(label)}</span>
      <span class="act-time">${ts ? relDate(ts) : "不明"}</span>
    </div>
    <div class="act-detail">
      <span class="act-env">${esc(env)}${detail}</span>
      <span class="act-full">${ts ? fmtDate(ts) : ""}</span>
    </div>
  </div>
</div>`;
      })
      .join("");
  } catch (e) {
    listEl.innerHTML = `<p class="error-text">読み込みに失敗: ${esc(e.message)}</p>`;
  }
}

// ─────────────────────────
// DEVICE (セッション削除方式)
// ─────────────────────────
async function initDevice() {
  const user = await requireAuth();
  const { db } = await getFirebase();
  await renderDevices(user, db);
  $("logout-all-others-btn")?.addEventListener("click", () =>
    logoutAllOthers(user, db),
  );
}
async function renderDevices(user, db) {
  const listEl = $("device-list");
  if (!listEl) return;
  listEl.innerHTML = '<p class="loading-text">読み込み中...</p>';
  // ★ セッションが未登録の場合に備え、登録してから取得
  const currentSid = getSid();
  // まだ Firestore に登録されていなければ登録
  await regSession(user, db);
  try {
    const q = query(
      collection(db, "users", user.uid, "sessions"),
      orderBy("lastActive", "desc"),
      limit(10),
    );
    const snap = await getDocs(q);
    // shouldLogout=true のドキュメントを除外して表示
    const activeDocs = snap.docs.filter(
      (d) => !d.data().shouldLogout || d.data().sessionId === currentSid,
    );
    if (activeDocs.length === 0) {
      listEl.innerHTML = '<p class="empty-text">セッション情報がありません</p>';
      hide("logout-all-others-btn");
      return;
    }
    let hasOthers = false;
    listEl.innerHTML = activeDocs
      .map((d) => {
        const data = d.data(),
          isCur = data.sessionId === currentSid;
        if (!isCur) hasOthers = true;
        const icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">${
          (data.device || "").includes("スマートフォン")
            ? '<rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>'
            : '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>'
        }
            </svg>`;
        return `<div class="device-item${isCur ? " current" : ""}" data-sid="${esc(data.sessionId)}">
<div class="device-icon">${icon}</div>
<div class="device-info">
  <div class="device-name">${esc(data.browser || "不明")} / ${esc(data.os || "不明")}${isCur ? '<span class="current-badge">現在の端末</span>' : ""}</div>
  <p class="device-meta">${esc(data.location || "不明")} · ${data.lastActive ? relDate(data.lastActive) : "不明"}</p>
</div>
${!isCur ? `<button class="session-logout-btn" data-sid="${esc(data.sessionId)}">ログアウト</button>` : ""}
</div>`;
      })
      .join("");
    if (hasOthers) show("logout-all-others-btn");
    else hide("logout-all-others-btn");
    listEl.querySelectorAll(".session-logout-btn").forEach((b) => {
      b.addEventListener("click", async () => {
        if (!confirm("この端末からログアウトしますか？")) return;
        b.disabled = true;
        b.textContent = "処理中...";
        const sid = b.dataset.sid;
        try {
          // shouldLogout=true + 即座にUIから削除
          await setDoc(
            doc(db, "users", user.uid, "sessions", sid),
            { shouldLogout: true },
            { merge: true },
          );
          b.closest(".device-item")?.remove();
          if (!listEl.querySelector(".device-item:not(.current)"))
            hide("logout-all-others-btn");
          toast("ログアウト信号を送信しました", "success");
        } catch (e) {
          alert("失敗: " + e.message);
          b.disabled = false;
          b.textContent = "ログアウト";
        }
      });
    });
  } catch (e) {
    listEl.innerHTML = '<p class="error-text">読み込みに失敗しました</p>';
  }
}
async function logoutAllOthers(user, db) {
  const currentSid = localStorage.getItem(SESSION_KEY);
  const others = document.querySelectorAll(".device-item:not(.current)");
  if (!others.length) {
    alert("他にアクティブな端末はありません");
    return;
  }
  if (!confirm(`${others.length}台の端末からログアウトしますか？`)) return;
  const b = $("logout-all-others-btn");
  if (b) {
    b.disabled = true;
    b.textContent = "処理中...";
  }
  try {
    const snap = await getDocs(collection(db, "users", user.uid, "sessions"));
    await Promise.allSettled(
      snap.docs
        .filter((d) => d.data().sessionId !== currentSid)
        .map((d) => setDoc(d.ref, { shouldLogout: true }, { merge: true })),
    );
    others.forEach((el) => el.remove());
    hide("logout-all-others-btn");
    toast("他の端末をログアウトしました", "success");
  } catch (e) {
    alert("失敗: " + e.message);
    if (b) {
      b.disabled = false;
      b.textContent = "他のすべての端末をログアウト";
    }
  }
}

// ─────────────────────────
// PASS
// ─────────────────────────
async function initPass() {
  const user = await requireAuth();
  const { auth, db } = await getFirebase();
  const hp = user.providerData.some((p) => p.providerId === "password");
  const row = $("current-password-row"),
    title = $("pass-card-title"),
    sub = $("pass-submit-btn");
  if (row) row.style.display = hp ? "block" : "none";
  if (title)
    title.textContent = hp
      ? "🔑 パスワードを変更する"
      : "🔑 パスワードを設定する";
  if (sub)
    sub.textContent = hp ? "パスワードを変更する" : "パスワードを設定する";
  sub?.addEventListener("click", async () => {
    const cur = $("current-password")?.value,
      newP = $("new-password")?.value,
      conf = $("confirm-password")?.value,
      msgEl = $("pass-msg");
    if (!newP)
      return setMsg(msgEl, "新しいパスワードを入力してください", "error");
    if (newP.length < 6)
      return setMsg(msgEl, "6文字以上にしてください", "error");
    if (newP !== conf)
      return setMsg(msgEl, "パスワードが一致しません", "error");
    if (hp && !cur)
      return setMsg(msgEl, "現在のパスワードを入力してください", "error");
    btn("pass-submit-btn", "処理中...", true);
    setMsg(msgEl, "", "");
    const en = await is2FA(user.uid, db);
    if (en && user.email) {
      const code = genOTP();
      await saveOTP(user.uid, db, code, "password_change");
      await sendOTP(user, code, "パスワード変更");
      setMsg(msgEl, `📧 ${user.email} に認証コードを送信しました`, "success");
      showOTPPanel("pass-otp-container", {
        title: "本人確認",
        desc: "コードを入力してください",
        onVerify: async (input) => {
          const res = await verifyOTP(user.uid, db, input, "password_change");
          if (!res.ok) {
            btn(
              "pass-submit-btn",
              hp ? "パスワードを変更する" : "パスワードを設定する",
              false,
            );
            return res;
          }
          await clearOTP(user.uid, db);
          await _execPass(auth, db, cur, newP, hp, user, msgEl);
          return { ok: true };
        },
        onCancel: () =>
          btn(
            "pass-submit-btn",
            hp ? "パスワードを変更する" : "パスワードを設定する",
            false,
          ),
      });
      return;
    }
    await _execPass(auth, db, cur, newP, hp, user, msgEl);
  });
}
async function _execPass(auth, db, cur, newP, hp, user, msgEl) {
  try {
    const cu = auth.currentUser;
    if (!cu) throw new Error("再ログインが必要です");
    if (hp) {
      const cred = EmailAuthProvider.credential(cu.email, cur);
      await reauthenticateWithCredential(cu, cred);
      await updatePassword(cu, newP);
    } else {
      const cred = EmailAuthProvider.credential(cu.email, newP);
      await linkWithCredential(cu, cred);
    }
    ["current-password", "new-password", "confirm-password"].forEach((id) => {
      const e = $(id);
      if (e) e.value = "";
    });
    setMsg(msgEl, "✅ 変更しました", "success");
    await logAct(user.uid, "password_change", "");
    toast("パスワードを変更しました", "success");
  } catch (e) {
    const M = {
      "auth/wrong-password": "現在のパスワードが間違っています",
      "auth/invalid-credential": "現在のパスワードが間違っています",
      "auth/requires-recent-login": "再ログインが必要です",
    };
    setMsg(msgEl, M[e.code] || e.message, "error");
  } finally {
    const hp2 = auth.currentUser?.providerData.some(
      (p) => p.providerId === "password",
    );
    btn(
      "pass-submit-btn",
      hp2 ? "パスワードを変更する" : "パスワードを設定する",
      false,
    );
  }
}

// ─────────────────────────
// 2FA (#5 #6 recommend, backup link)
// ─────────────────────────
async function initTwoFA() {
  const user = await requireAuth();
  const { db } = await getFirebase();
  const en = await is2FA(user.uid, db);
  const toggle = $("two-factor-toggle"),
    label = $("two-factor-status-label"),
    badge = $("2fa-status-badge");
  if (toggle) toggle.checked = en;
  if (label) label.textContent = en ? "有効" : "無効";
  if (badge) {
    badge.textContent = en ? "有効" : "無効";
    badge.className = `status-badge ${en ? "enabled" : "disabled"}`;
  }
  setBackupLink(en);
  toggle?.addEventListener("change", async (e) => {
    const newState = e.target.checked,
      purpose = newState ? "2fa_enable" : "2fa_disable",
      msgEl = $("two-factor-msg");
    if (!user.email) {
      setMsg(msgEl, "メールアドレスが必要です", "error");
      toggle.checked = !newState;
      return;
    }
    toggle.disabled = true;
    setMsg(msgEl, "認証コードを送信中...", "");
    try {
      const code = genOTP();
      await saveOTP(user.uid, db, code, purpose);
      await sendOTP(
        user,
        code,
        newState ? "二段階認証の有効化" : "二段階認証の無効化",
      );
      setMsg(msgEl, `📧 ${user.email} に認証コードを送信しました`, "success");
      showOTPPanel("twofa-otp-container", {
        title: "本人確認",
        desc: "コードを入力してください",
        onVerify: async (input) => {
          const res = await verifyOTP(user.uid, db, input, purpose);
          if (!res.ok) {
            toggle.checked = !newState;
            toggle.disabled = false;
            return res;
          }
          await clearOTP(user.uid, db);
          await setDoc(
            doc(db, "users", user.uid, "security", "twoFactor"),
            { enabled: newState },
            { merge: true },
          );
          // 2FA無効化時はバックアップコードを削除
          if (!newState) {
            await deleteDoc(
              doc(db, "users", user.uid, "security", "BackUpCode"),
            ).catch(() => {});
          }
          if (label) label.textContent = newState ? "有効" : "無効";
          if (badge) {
            badge.textContent = newState ? "有効" : "無効";
            badge.className = `status-badge ${newState ? "enabled" : "disabled"}`;
          }
          setMsg(
            msgEl,
            `✅ 二段階認証を${newState ? "有効" : "無効"}にしました`,
            "success",
          );
          await logAct(
            user.uid,
            "twofa_change",
            newState ? "有効化" : "無効化",
          );
          toggle.disabled = false;
          setBackupLink(newState);
          if (newState) showTwoFARecommend();
          return { ok: true };
        },
        onCancel: () => {
          toggle.checked = !newState;
          toggle.disabled = false;
          setMsg(msgEl, "", "");
        },
      });
    } catch {
      toggle.checked = !newState;
      setMsg(msgEl, "送信に失敗しました", "error");
      toggle.disabled = false;
    }
  });
}
function setBackupLink(en) {
  const a = $("backup-code-link");
  if (!a) return;
  if (en) {
    a.style.opacity = "1";
    a.style.pointerEvents = "auto";
    a.setAttribute("href", "/account/security/2fa/backup-code");
    a.classList.remove("disabled-link");
  } else {
    a.style.opacity = "0.4";
    a.style.pointerEvents = "none";
    a.removeAttribute("href");
    a.classList.add("disabled-link");
  }
}
function showTwoFARecommend() {
  const c = $("twofa-recommend");
  if (!c) return;
  c.innerHTML = `<div class="banner banner-info twofa-rec-banner">
<p class="banner-title">✅ 二段階認証を有効にしました！</p>
<p style="font-size:0.83rem;margin-bottom:14px;">さらにセキュリティを強化するために以下の設定もお勧めします。</p>
<div class="twofa-rec-btns">
  <a href="/account/security/2fa/backup-code" class="btn-primary rec-btn">バックアップコードを設定する</a>
  <a href="/account/security/methods" class="btn-secondary rec-btn">ログイン方法を確認する</a>
</div></div>`;
  c.style.display = "block";
}

// ─────────────────────────
// BACKUP CODE (アクセス制御 + クリア)
// ─────────────────────────
function _genCode() {
  const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(
    { length: 8 },
    () => c[Math.floor(Math.random() * c.length)],
  ).join("");
}
async function initBackupCode() {
  const user = await requireAuth();
  const { db } = await getFirebase();
  const gridEl = $("backup-codes-grid");
  if (!gridEl) return;
  // アクセス制御: 2FA無効時はアクセス不可
  const enabled = await is2FA(user.uid, db);
  if (!enabled) {
    gridEl.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:24px;color:var(--text-sub);">
<p style="font-weight:700;margin-bottom:8px;">二段階認証が無効です</p>
<p style="font-size:0.85rem;">バックアップコードを使用するには先に二段階認証を有効にしてください。</p>
<a href="/account/security/2fa" style="display:inline-block;margin-top:12px;color:var(--primary-dark);font-weight:700;">二段階認証の設定へ →</a></div>`;
    const btns = document.querySelectorAll(".backup-action-btn");
    btns.forEach((b) => (b.disabled = true));
    return;
  }
  gridEl.innerHTML =
    '<p class="loading-text" style="grid-column:1/-1;">読み込み中...</p>';
  try {
    const snap = await getDoc(
      doc(db, "users", user.uid, "security", "BackUpCode"),
    );
    let codes = [];
    if (snap.exists() && snap.data().codes?.length > 0) {
      const raw = snap.data().codes;
      codes = raw.map((c) =>
        typeof c === "string" ? { code: c, used: false } : c,
      );
    }
    if (codes.length === 0) codes = await genAndSaveCodes(user.uid, db);
    renderCodes(gridEl, codes);
    $("regenerate-codes-btn")?.addEventListener("click", async () => {
      if (!confirm("現在のコードはすべて無効になります。よろしいですか？"))
        return;
      // ★ バックアップコード再生成は 2FA OTP で本人確認
      const regen = async () => {
        const nc = await genAndSaveCodes(user.uid, db);
        renderCodes(gridEl, nc);
        await logAct(user.uid, "twofa_change", "バックアップコード再生成");
        toast("バックアップコードを再生成しました", "success");
      };
      const isTwoFA = await is2FA(user.uid, db);
      if (isTwoFA && user.email) {
        const code = genOTP();
        await saveOTP(user.uid, db, code, "backup_regen");
        await sendOTP(user, code, "バックアップコード再生成");
        toast("📧 認証コードをメールに送信しました", "info");
        // 簡易 OTP ダイアログ
        const answer = window.prompt(
          "メールに送信された6桁の認証コードを入力してください:",
        );
        if (!answer) {
          toast("キャンセルしました", "info");
          return;
        }
        const res = await verifyOTP(
          user.uid,
          db,
          answer.trim(),
          "backup_regen",
        );
        if (!res.ok) {
          toast(res.reason || "コードが正しくありません", "error");
          return;
        }
        await clearOTP(user.uid, db);
      }
      await regen();
    });
    $("copy-codes-btn")?.addEventListener("click", async () => {
      const text = codes.map((c, i) => `${i + 1}. ${c.code || c}`).join("\n");
      await navigator.clipboard.writeText(text).catch(() => {});
      const b = $("copy-codes-btn");
      if (b) {
        b.textContent = "✅ コピー済み";
        setTimeout(() => (b.textContent = "コードをコピー"), 2000);
      }
    });
  } catch (e) {
    gridEl.innerHTML = `<p class="error-text" style="grid-column:1/-1;">読み込みに失敗: ${esc(e.message)}</p>`;
  }
}
async function genAndSaveCodes(uid, db) {
  const codes = Array.from({ length: BACKUP_CODE_COUNT }, () => ({
    code: _genCode(),
    used: false,
  }));
  await setDoc(doc(db, "users", uid, "security", "BackUpCode"), {
    codes,
    generatedAt: serverTimestamp(),
  });
  return codes;
}
function renderCodes(gridEl, codes) {
  gridEl.innerHTML = codes
    .map(
      ({ code, used }, i) =>
        `<div class="code-item${used ? " code-used" : ""}"><span class="code-num">${i + 1}.</span><span class="code-val">${used ? `<s>${esc(code)}</s>` : esc(code)}</span></div>`,
    )
    .join("");
}

// ─────────────────────────
// METHODS (#7 email display)
// ─────────────────────────
async function initMethods() {
  const user = await requireAuth();
  const { auth, db } = await getFirebase();
  await renderMethods(user, auth, db);
}
async function renderMethods(user, auth, db) {
  const ids = user.providerData.map((p) => p.providerId),
    total = ids.length;
  // パスワード
  const passLinked = ids.includes("password"),
    passData = user.providerData.find((p) => p.providerId === "password");
  const pSt = $("status-password"),
    pBtn = $("btn-password"),
    pEmail = $("method-email-password");
  if (pSt) {
    pSt.textContent = passLinked ? "設定済み" : "未設定";
    pSt.className = `method-status ${passLinked ? "linked" : "unlinked"}`;
  }
  if (pEmail)
    pEmail.textContent = passLinked ? passData?.email || user.email || "" : "";
  if (pBtn) {
    if (passLinked) {
      pBtn.textContent = "解除する";
      pBtn.className = "provider-link-btn unlink-btn";
      pBtn.disabled = total <= 1;
      pBtn.title = total <= 1 ? "最後のログイン方法は解除できません" : "";
      pBtn.onclick = async () => {
        if (!confirm("解除しますか？")) return;
        try {
          await unlink(auth.currentUser, "password");
          await logAct(user.uid, "method_change", "パスワード解除");
          setMsg("provider-msg", "✅解除しました", "success");
          await renderMethods(auth.currentUser, auth, db);
        } catch (e) {
          setMsg("provider-msg", e.message, "error");
        }
      };
    } else {
      pBtn.textContent = "設定する";
      pBtn.className = "provider-link-btn link-btn";
      pBtn.disabled = !user.email;
      pBtn.onclick = () => {
        if (!user.email) return;
        const o = popup(
          `<h3 class="popup-title">パスワードを設定する</h3><div class="form-group"><label class="form-label">パスワード (6文字以上)</label><input id="_pw1" type="password" class="form-input"></div><div class="form-group"><label class="form-label">確認</label><input id="_pw2" type="password" class="form-input"></div><p id="_pm" class="settings-msg"></p><div class="popup-btns"><button id="_pc" class="btn-secondary-sm">キャンセル</button><button id="_ps" class="btn-primary-sm">設定する</button></div>`,
        );
        o.querySelector("#_pc").onclick = () => o.remove();
        o.querySelector("#_ps").onclick = async () => {
          const p1 = o.querySelector("#_pw1")?.value,
            p2 = o.querySelector("#_pw2")?.value,
            m = o.querySelector("#_pm");
          if (!p1 || p1.length < 6)
            return setMsg(m, "6文字以上にしてください", "error");
          if (p1 !== p2) return setMsg(m, "一致しません", "error");
          o.querySelector("#_ps").disabled = true;
          try {
            await linkWithCredential(
              auth.currentUser,
              EmailAuthProvider.credential(auth.currentUser.email, p1),
            );
            await logAct(user.uid, "method_change", "パスワード設定");
            o.remove();
            setMsg("provider-msg", "✅パスワードを設定しました", "success");
            await renderMethods(auth.currentUser, auth, db);
          } catch (e) {
            setMsg(m, e.message, "error");
            o.querySelector("#_ps").disabled = false;
          }
        };
      };
    }
  }
  // Google
  const gLinked = ids.includes("google.com"),
    gData = user.providerData.find((p) => p.providerId === "google.com");
  const gSt = $("status-google"),
    gBtn = $("btn-google"),
    gEmail = $("method-email-google");
  if (gSt) {
    gSt.textContent = gLinked ? "連携済み" : "未連携";
    gSt.className = `method-status ${gLinked ? "linked" : "unlinked"}`;
  }
  if (gEmail) gEmail.textContent = gLinked ? gData?.email || "" : "";
  if (gBtn) {
    if (gLinked) {
      gBtn.textContent = "解除する";
      gBtn.className = "provider-link-btn unlink-btn";
      gBtn.disabled = total <= 1;
      gBtn.onclick = async () => {
        if (!confirm("解除しますか？")) return;
        try {
          await unlink(auth.currentUser, "google.com");
          await logAct(user.uid, "method_change", "Google解除");
          setMsg("provider-msg", "✅解除しました", "success");
          await renderMethods(auth.currentUser, auth, db);
        } catch (e) {
          setMsg("provider-msg", e.message, "error");
        }
      };
    } else {
      gBtn.textContent = "連携する";
      gBtn.className = "provider-link-btn link-btn";
      gBtn.onclick = async () => {
        try {
          await linkWithPopup(auth.currentUser, new GoogleAuthProvider());
          setMsg("provider-msg", "✅連携しました", "success");
          await logAct(user.uid, "method_change", "Google連携");
          await renderMethods(auth.currentUser, auth, db);
        } catch (e) {
          setMsg(
            "provider-msg",
            e.code === "auth/credential-already-in-use"
              ? "このGoogleアカウントは別のユーザーと連携済みです"
              : e.message,
            "error",
          );
        }
      };
    }
  }
  const ec = $("email-setup-card");
  if (ec) ec.style.display = user.email ? "none" : "block";
  $("set-email-btn")?.addEventListener("click", async () => {
    const em = $("set-email-input")?.value.trim(),
      m = $("set-email-msg");
    if (!em || !em.includes("@"))
      return setMsg(m, "正しいメールアドレスを入力してください", "error");
    btn("set-email-btn", "処理中...", true);
    try {
      await updateEmail(auth.currentUser, em);
      await sendEmailVerification(auth.currentUser).catch(() => {});
      setMsg(m, "✅設定しました", "success");
      await logAct(user.uid, "email_change", "");
      await renderMethods(auth.currentUser, auth, db);
    } catch (e) {
      const M = {
        "auth/email-already-in-use": "すでに使用済み",
        "auth/requires-recent-login": "再ログインが必要です",
      };
      setMsg(m, M[e.code] || e.message, "error");
    } finally {
      btn("set-email-btn", "設定する", false);
    }
  });
}

// ─────────────────────────
// 共通: カード描画
// ─────────────────────────
function renderCard(user) {
  const av = $("settings-avatar-wrap");
  if (av)
    av.innerHTML = user.photoURL
      ? `<img src="${esc(user.photoURL)}" class="user-info-avatar" alt="avatar">`
      : `<div class="user-info-avatar-placeholder">👤</div>`;
  const els = {
    "settings-user-name": user.displayName || "名前未設定",
    "settings-user-email": user.email || "（未設定）",
    "settings-user-uuid": user.uid,
  };
  for (const [id, val] of Object.entries(els)) {
    const e = $(id);
    if (e) e.textContent = val;
  }
  const sl = $("settings-last-signin");
  if (sl && user.metadata?.lastSignInTime)
    sl.textContent = new Date(user.metadata.lastSignInTime).toLocaleString(
      "ja-JP",
      { timeZone: "Asia/Tokyo" },
    );
}
function renderProfile(user) {
  const av = $("profile-avatar");
  if (av)
    av.innerHTML = user.photoURL
      ? `<img src="${esc(user.photoURL)}" class="user-info-avatar" alt="avatar">`
      : `<div class="user-info-avatar-placeholder">👤</div>`;
  const m = {
    "profile-name-value": user.displayName || "（未設定）",
    "profile-email-value": user.email || "（未設定）",
    "profile-uuid-value": user.uid
      ? user.uid.substring(0, 8) + "..." + user.uid.slice(-4)
      : "不明",
  };
  for (const [id, val] of Object.entries(m)) {
    const e = $(id);
    if (e) e.textContent = val;
  }
  const l = $("profile-lastlogin-value");
  if (l && user.metadata?.lastSignInTime)
    l.textContent = new Date(user.metadata.lastSignInTime).toLocaleString(
      "ja-JP",
      { timeZone: "Asia/Tokyo" },
    );
}

// ─────────────────────────
// ENTRY
// ─────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  const fn = {
    signup: initSignup,
    login: initLogin,
    logout: initLogout,
    delete: initDelete,
    settings: initSettings,
    profile: initProfile,
    privacy: initPrivacy,
    security: initSecurity,
    activity: initActivity,
    device: initDevice,
    pass: initPass,
    twofa: initTwoFA,
    backup: initBackupCode,
    methods: initMethods,
  };
  if (PAGE && fn[PAGE]) await fn[PAGE]();
});
