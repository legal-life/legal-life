// important.js  (認証モーダル廃止・ページ遷移方式に変更した箇所のみ抜粋)
// ─────────────────────────────────────────────────────────────────

import { initializeApp }
    from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getFirestore, doc, setDoc, deleteDoc, serverTimestamp, getDoc, onSnapshot, collection, addDoc }
    from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { getDatabase, ref as rtdbRef, push as rtdbPush, set as rtdbSet, remove as rtdbRemove }
    from "https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js";
import {
    getAuth, onAuthStateChanged, signOut, GoogleAuthProvider, setPersistence, browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { initializeAppCheck, ReCaptchaV3Provider }
    from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app-check.js";

// ========================================
// ヘッダー・フッター キャッシュ付きfetch
// ========================================
const LAYOUT_VERSION = "260520-0000"; // ★ バージョン更新

function fetchWithCache(url) {
    const key = `cache:${url}:v${LAYOUT_VERSION}`;
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const k = sessionStorage.key(i);
        if (k?.startsWith(`cache:${url}`) && k !== key) sessionStorage.removeItem(k);
    }
    const cached = sessionStorage.getItem(key);
    if (cached) return Promise.resolve(cached);
    return fetch(url)
        .then(r => r.ok ? r.text() : "")
        .then(text => { if (text) sessionStorage.setItem(key, text); return text; });
}

const layoutPromise = Promise.all([
    fetchWithCache("/parts/header"),
    fetchWithCache("/parts/footer"),
]);

// ========================================
// Firebase 初期化
// ========================================
let app, db, auth, rtdb;

try {
    const firebaseConfig = __FIREBASE_CONFIG__;
    app  = initializeApp(firebaseConfig);
    db   = getFirestore(app);
    auth = getAuth(app);

    // ★ FIX: 認証状態の永続化を明示設定（ページ遷移でログアウトしない）
    setPersistence(auth, browserLocalPersistence)
        .then(() => console.log("🔒 Auth persistence: LOCAL"))
        .catch(e => console.warn("Auth persistence設定失敗:", e));

    const dbUrl = firebaseConfig.databaseURL ||
        `https://${firebaseConfig.projectId}-default-rtdb.asia-southeast1.firebasedatabase.app`;
    rtdb = getDatabase(app, dbUrl);

    initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider("__RECAPTCHA_SITE_KEY__"),
        isTokenAutoRefreshEnabled: true,
    });
} catch (error) {
    console.error("⚠️ Firebase初期化失敗:", error);
}

// ========================================
// ★ 新: AuthManager (シンプル化・ページ遷移方式)
// ========================================
class AuthManager {
    constructor() {
        this.currentUser = null;
        this._unsubSession = null;
        this._start();
    }

    _start() {
        // ★ キャッシュからUI即時更新（ページ遷移時のフラッシュ防止）
        try {
            const cached = JSON.parse(sessionStorage.getItem("ll_auth_cache") || "null");
            if (cached) {
                this.currentUser = cached;
                setTimeout(() => this._updateHeaderUI(cached), 0);
            }
        } catch (_) {}

        onAuthStateChanged(auth, (user) => {
            this.currentUser = user;

            // キャッシュ更新
            if (user) {
                sessionStorage.setItem("ll_auth_cache", JSON.stringify({
                    uid:           user.uid,
                    displayName:   user.displayName,
                    email:         user.email,
                    photoURL:      user.photoURL,
                    emailVerified: user.emailVerified,
                }));
                // セッション監視（他端末からのリモートログアウト）
                this._watchSession(user);
            } else {
                sessionStorage.removeItem("ll_auth_cache");
                if (this._unsubSession) { this._unsubSession(); this._unsubSession = null; }
            }

            setTimeout(() => this._updateHeaderUI(user), 100);
        });
    }

    // ─── ヘッダーUI更新 ───
    _updateHeaderUI(user) {
        const guestEl  = document.getElementById("menu-guest");
        const userEl   = document.getElementById("menu-user");
        const nameEl   = document.getElementById("header-user-name");
        const avatarEl = document.getElementById("header-user-avatar");

        // DOM がまだ挿入されていない場合はスキップ
        if (!guestEl && !userEl) return;

        if (user) {
            if (guestEl)  guestEl.style.display  = "none";
            if (userEl)   userEl.style.display   = "block";
            if (nameEl)   nameEl.textContent     = user.displayName || user.email || "ユーザー";
            if (avatarEl && user.photoURL) avatarEl.src = user.photoURL;
        } else {
            if (guestEl) guestEl.style.display  = "block";
            if (userEl)  userEl.style.display   = "none";
        }
    }

    // ─── 他端末からのリモートログアウト監視 ───
    _watchSession(user) {
        if (this._unsubSession) { this._unsubSession(); this._unsubSession = null; }
        const sid = localStorage.getItem("legallife_session_id");
        if (!sid) return;
        const ref = doc(db, "users", user.uid, "sessions", sid);
        this._unsubSession = onSnapshot(ref, (snap) => {
            if (snap.exists() && snap.data().shouldLogout === true) {
                console.log("📤 リモートログアウト信号受信");
                localStorage.removeItem("legallife_session_id");
                deleteDoc(ref).catch(() => {}).finally(() => {
                    signOut(auth).then(() => { window.location.replace("/"); });
                });
            }
        });
    }

    // ─── Firestore チャット保存 (chat.js から利用) ───
    async saveToCloud(input, response, category) {
        if (!this.currentUser || !db) return null;
        try {
            const docId   = Date.now().toString();
            const docPath = doc(db, "content", "chat", this.currentUser.uid, docId);
            await setDoc(docPath, {
                userInput: input, aiResponse: response, category,
                timestamp: serverTimestamp(),
            });
            return docId;
        } catch (e) {
            console.error("❌ チャット保存失敗:", e);
            return null;
        }
    }

    async deletechatation(docId) {
        if (!docId || !this.currentUser || !db) return;
        try {
            await deleteDoc(doc(db, "content", "chat", this.currentUser.uid, docId));
        } catch (e) { console.error("❌ 削除失敗:", e); }
    }
}

window.authApp = new AuthManager();

// Realtime Database 公開 (access-log.js 用)
window._firebaseRTDB = { rtdb, ref: rtdbRef, push: rtdbPush, set: rtdbSet, remove: rtdbRemove };
window._firebaseDb   = { db };
window._firebaseModules = { addDoc, collection, serverTimestamp };

// ========================================
// ヘッダー・フッター挿入
// ========================================
layoutPromise.then(([headerData, footerData]) => {
    const headerTarget = document.querySelector("#header");
    const footerTarget = document.querySelector("#footer");
    if (headerTarget && headerData) headerTarget.innerHTML = headerData;
    if (footerTarget && footerData) footerTarget.innerHTML = footerData;

    _initHamburgerMenu();
    _loadCookieScript();

    // ヘッダー挿入後にUI更新
    setTimeout(() => window.authApp?._updateHeaderUI(window.authApp?.currentUser), 0);
    setTimeout(() => window.authApp?._updateHeaderUI(window.authApp?.currentUser), 300);

}).catch(err => console.error("important.js layout error:", err));

function _initHamburgerMenu() {
    const button = document.querySelector(".hamberger-btn");
    const menu   = document.getElementById("main-menu");
    if (!button || !menu) return;

    const overlay = Object.assign(document.createElement("div"), { className: "menu-overlay" });
    document.body.appendChild(overlay);

    const toggleMenu = (open) => {
        menu.classList.toggle("is-active", open);
        button.classList.toggle("is-active", open);
        overlay.classList.toggle("is-active", open);
        button.setAttribute("aria-expanded", String(open));
    };

    button.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleMenu(button.getAttribute("aria-expanded") !== "true");
    });

    document.addEventListener("click", (e) => {
        if (menu.classList.contains("is-active") &&
            !menu.contains(e.target) && !button.contains(e.target)) {
            toggleMenu(false);
        }
    });

    menu.querySelectorAll("a").forEach(link => link.addEventListener("click", () => toggleMenu(false)));
}

function _loadCookieScript() {
    const s = Object.assign(document.createElement("script"), {
        src: "/assets/js/cookie.js",
        onload:  () => console.log("✅ cookie.js: 読み込み完了"),
        onerror: () => console.error("❌ cookie.js: 読み込み失敗"),
    });
    document.body.appendChild(s);
}

// ========================================
// TOPに戻るボタン
// ========================================
document.addEventListener("DOMContentLoaded", () => {
    document.documentElement.style.overflowX = "hidden";
    document.body.style.overflowX = "hidden";

    const isMobile = () => window.innerWidth <= 600;
    const topBtn = Object.assign(document.createElement("button"), {
        id:        "js-scroll-top",
        className: "scroll-top-btn",
        ariaLabel: "トップへ戻る",
        innerHTML: "▲",
    });

    const applySize = () => {
        const m = isMobile();
        Object.assign(topBtn.style, {
            position: "fixed", right: m ? "10px" : "20px", bottom: "20px",
            width: m ? "45px" : "50px", height: m ? "45px" : "50px",
            backgroundColor: "#00C8E9", color: "#fff", border: "none",
            borderRadius: "50%", cursor: "pointer", display: "flex",
            justifyContent: "center", alignItems: "center",
            fontSize: m ? "18px" : "20px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.2)", zIndex: "9999",
            opacity: "0", visibility: "hidden", transform: "translateY(20px)",
            transition: "all 0.3s ease",
        });
    };

    applySize();
    document.body.appendChild(topBtn);

    window.addEventListener("scroll", () => {
        const show = window.scrollY > 300;
        topBtn.style.opacity    = show ? "1" : "0";
        topBtn.style.visibility = show ? "visible" : "hidden";
        topBtn.style.transform  = show ? "translateY(0)" : "translateY(20px)";
    });

    topBtn.addEventListener("click", (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    window.addEventListener("resize", applySize);
});

// ========================================
// 検索バー クリアボタン（共通）
// ========================================
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-search-clear]").forEach(clearBtn => {
        const targetId = clearBtn.dataset.searchClear;
        const input    = document.getElementById(targetId);
        if (!input) return;

        const syncVisibility = () => {
            clearBtn.style.display = input.value.length > 0 ? "flex" : "none";
        };

        syncVisibility();
        input.addEventListener("input", syncVisibility);

        clearBtn.addEventListener("click", () => {
            input.value = "";
            syncVisibility();
            input.focus();
            input.dispatchEvent(new CustomEvent("search:cleared", {
                bubbles: true, detail: { inputId: targetId },
            }));
        });
    });
});

// ========================================
// 開発中ページポップアップ
// ========================================
(function () {
    const TARGET_CLASS = "js-popup-show";
    const MESSAGE = "選択いただいたページは現在メンテナンス中です<br>メンテナンス終了までしばらくお待ちください";

    const overlay = document.createElement("div");
    overlay.className = "custom-popup-overlay";
    overlay.innerHTML = `
        <div class="custom-popup-content">
            <p class="custom-popup-text">${MESSAGE}</p>
            <div class="custom-popup-close-btn">閉じる</div>
        </div>`;
    document.body.appendChild(overlay);

    overlay.querySelector(".custom-popup-close-btn")
        .addEventListener("click", () => overlay.classList.remove("is-visible"));
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) overlay.classList.remove("is-visible");
    });

    const bindPopups = () => {
        document.querySelectorAll(`.${TARGET_CLASS}`).forEach(el => {
            if (!el.dataset.popupBound) {
                el.addEventListener("click", (e) => {
                    e.preventDefault();
                    overlay.classList.add("is-visible");
                });
                el.dataset.popupBound = "true";
            }
        });
    };

    new MutationObserver(bindPopups).observe(document.body, { childList: true, subtree: true });
    bindPopups();
})();

console.log("%c警告!", "color:red;font-size:1.2em;font-weight:bold;",
    "\n不用意なコード実行は避けてください。");