/**
 * legal-life DevTool 統合スクリプト
 */
(function () {
  // 設定定数
  const COOKIE_NAME = "dev_access_allowed";
  const COOKIE_PATH = "/z[dev--tool]"; // パスをこのディレクトリ以下に統一
  const REDIRECT_PATH = "/z[dev--tool]/dev";
  const LOGIN_PATH = "/z[dev--tool]";
  const DEV_PATH = "devtool-legallife-develop";

  // --- 共通ユーティリティ ---
  const hasDevAccess = () =>
    document.cookie
      .split("; ")
      .some((row) => row.startsWith(COOKIE_NAME + "=true"));

  // ========================================
  // 1. ログイン/アクセス制御ロジック
  // ========================================
  const initAccessControl = () => {
    const passInput = document.getElementById("passInput");
    const submitBtn = document.getElementById("submit");
    const toggleBtn = document.getElementById("togglePass");

    // A. すでにログイン済みで、ログインページにいる場合はリダイレクト
    if (hasDevAccess() && window.location.pathname === LOGIN_PATH) {
      window.location.replace(REDIRECT_PATH);
      return;
    }

    // B. 未ログインで、ログインページ以外（dev配下）にいる場合はログインへ
    if (!hasDevAccess() && window.location.pathname.startsWith(REDIRECT_PATH)) {
      window.location.replace(LOGIN_PATH);
      return;
    }

    // C. ログインフォームの制御 (要素がある場合のみ)
    if (passInput && submitBtn) {
      const attemptLogin = () => {
        if (passInput.value === DEV_PATH) {
          document.cookie = `${COOKIE_NAME}=true; path=${COOKIE_PATH}; SameSite=Lax`;
          window.location.replace(REDIRECT_PATH);
        } else {
          alert("パスワードが正しくありません。");
          window.location.replace("/");
        }
      };

      submitBtn.addEventListener("click", attemptLogin);
      passInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") attemptLogin();
      });

      if (toggleBtn) {
        toggleBtn.addEventListener("click", () => {
          const isPass = passInput.type === "password";
          passInput.type = isPass ? "text" : "password";
          toggleBtn.textContent = isPass ? "隠す" : "表示";
        });
      }
    }
  };

  // ========================================
  // 2. ヘッダー読み込み & UI制御
  // ========================================
  const initInterface = () => {
    // ヘッダー読み込み
    const headerTarget = document.querySelector("#header");
    if (headerTarget) {
      fetch("/z[dev--tool]/header")
        .then((r) => (r.ok ? r.text() : ""))
        .then((data) => {
          headerTarget.innerHTML = data;
          setupHamburgerMenu(); // ヘッダー読み込み後にメニュー設定
        })
        .catch((err) => console.error("dev-header-load-err", err));
    }

    // ログアウト処理 (イベント委譲で全ページ対応)
    document.addEventListener("click", (e) => {
      if (e.target && e.target.id === "logoutBtn") {
        document.cookie = `${COOKIE_NAME}=; path=${COOKIE_PATH}; max-age=0; SameSite=Lax`;
        window.location.replace(LOGIN_PATH);
      }
    });

    // TOPに戻るボタンの作成
    setupScrollTopBtn();
  };

  // --- ヘルパー関数: ハンバーガーメニュー ---
  function setupHamburgerMenu() {
    const button = document.querySelector(".hamberger-btn");
    const menu = document.getElementById("main-menu");
    if (!button || !menu) return;

    const overlay = document.createElement("div");
    overlay.className = "menu-overlay";
    document.body.appendChild(overlay);

    const toggleMenu = (open) => {
      [menu, button, overlay].forEach((el) =>
        el.classList.toggle("is-active", open),
      );
      button.setAttribute("aria-expanded", open);
    };

    button.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleMenu(button.getAttribute("aria-expanded") !== "true");
    });

    document.addEventListener("click", (e) => {
      if (
        menu.classList.contains("is-active") &&
        !menu.contains(e.target) &&
        !button.contains(e.target)
      ) {
        toggleMenu(false);
      }
    });
  }

  // --- ヘルパー関数: ScrollTop ---
  function setupScrollTopBtn() {
    const topBtn = Object.assign(document.createElement("button"), {
      id: "js-scroll-top",
      className: "scroll-top-btn",
      innerHTML: "▲",
    });

    // 簡易スタイル適用
    Object.assign(topBtn.style, {
      position: "fixed",
      right: "20px",
      bottom: "20px",
      width: "50px",
      height: "50px",
      backgroundColor: "#00C8E9",
      color: "#fff",
      border: "none",
      borderRadius: "50%",
      cursor: "pointer",
      zIndex: "9999",
      opacity: "0",
      transition: "0.3s",
      visibility: "hidden",
    });

    document.body.appendChild(topBtn);
    window.addEventListener("scroll", () => {
      const show = window.scrollY > 300;
      topBtn.style.opacity = show ? "1" : "0";
      topBtn.style.visibility = show ? "visible" : "hidden";
    });
    topBtn.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: "smooth" }),
    );
  }

  // --- 実行開始 ---
  initAccessControl();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initInterface);
  } else {
    initInterface();
  }

  // initInterface関数内、または末尾の(function(){...})内に追加
  const NomalBackBtn = document.getElementById("backToHome");
  if (NomalBackBtn) {
    NomalBackBtn.addEventListener("click", () => {
      // replaceを使うことで、現在の「ログイン画面」の履歴を「ホーム」で上書きします
      window.location.replace("/");
    });
  }
  // ===== 履歴を残さない遷移処理 =====
  document.addEventListener("click", (e) => {
    // クリックされた要素、またはその親要素が 'js-replace-link' クラスを持っているか確認
    const target = e.target.closest(".js-replace-link");
    
    if (target) {
      e.preventDefault(); // 通常のリンク動作（履歴追加）をキャンセル
      
      // aタグならhref属性、それ以外ならdata-href属性などから遷移先を取得
      const url = target.getAttribute("href") || target.dataset.href;
      
      if (url) {
        window.location.replace(url); // 履歴を上書きして遷移
      }
    }
  });
  

  console.log("%cDevTool Active", "color: #00C8E9; font-weight: bold;");
})();
