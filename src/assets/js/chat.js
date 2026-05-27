// chat.js

// ========================================
// ユーティリティ
// ========================================

/** HTML エスケープ（XSS 対策 / モーダルプレビュー共用） */
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

// ========================================
// 設定
// ========================================
const CONFIG = {
  GEMINI_API_KEY: "'__GEMINI_API_KEY__'",
  GEMINI_API_URL:
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent",
  STORAGE_KEY: "legalChatHistory",
  MAX_HISTORY: 50,
  MAX_INPUT_LEN: 1000,
  API_TIMEOUT: 60000,
};

// ========================================
// カスタム確認モーダル
// ========================================
function showConfirm(message, icon = "⚠️", preview = null) {
  return new Promise((resolve) => {
    const previewHtml = preview
      ? `
            <div class="modal-preview">
                <div class="modal-preview-label">質問</div>
                <div class="modal-preview-text">${escapeHtml(preview.question)}</div>
                <div class="modal-preview-label modal-preview-label--answer">回答</div>
                <div class="modal-preview-text">${escapeHtml(preview.answer).replace(/\n/g, "<br>")}</div>
            </div>`
      : "";

    const overlay = Object.assign(document.createElement("div"), {
      className: "modal-overlay",
      innerHTML: `
                <div class="modal-box${preview ? " modal-box--wide" : ""}" role="dialog" aria-modal="true">
                    <div class="modal-icon">${icon}</div>
                    <p class="modal-message">${message}</p>
                    ${previewHtml}
                    <div class="modal-actions">
                        <button class="modal-btn modal-btn-cancel" id="modalCancel">キャンセル</button>
                        <button class="modal-btn modal-btn-confirm" id="modalOk">削除する</button>
                    </div>
                </div>`,
    });

    document.body.appendChild(overlay);
    overlay.querySelector("#modalOk").focus();

    const close = (result) => {
      overlay.style.animation =
        "modalOverlayIn 0.15s ease-out reverse forwards";
      setTimeout(() => {
        document.body.removeChild(overlay);
        resolve(result);
      }, 140);
    };

    overlay.querySelector("#modalOk").onclick = () => close(true);
    overlay.querySelector("#modalCancel").onclick = () => close(false);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close(false);
    });

    const onKeydown = (e) => {
      if (e.key === "Escape") {
        document.removeEventListener("keydown", onKeydown);
        close(false);
      }
    };
    document.addEventListener("keydown", onKeydown);
  });
}

// ========================================
// LegalChatApp
// ========================================
class LegalChatApp {
  constructor() {
    this.history = [];
    this.isGenerating = false;

    // DOM キャッシュ
    this.el = {
      responseArea: document.getElementById("responseArea"),
      userInput: document.getElementById("userInput"),
      sendButton: document.getElementById("sendButton"),
      clearAllButton: document.getElementById("clearAllButton"),
    };
  }

  // ========================================
  // 初期化
  // ========================================
  init() {
    const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
    this.history = saved ? JSON.parse(saved) : [];

    this.render();
    this._setupEventListeners();
    this._scrollToBottom();

    window.chatApp = this;
    console.log("⚖️ Legal Chat App Initialized.");
  }

  // ========================================
  // イベントリスナー
  // ========================================
  _setupEventListeners() {
    this.el.sendButton.onclick = () => this.handleSend();
    this.el.clearAllButton.onclick = () => this.handleClearAll();

    this.el.userInput.onkeydown = (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    };

    this.el.userInput.oninput = (e) => {
      e.target.style.height = "auto";
      e.target.style.height = Math.min(e.target.scrollHeight, 150) + "px";
    };
  }

  // ========================================
  // 描画
  // ========================================
  render() {
    if (this.history.length === 0) {
      this.el.responseArea.innerHTML = `
<div class="chat-ai-container">
    <img src="/assets/images/chat_logo.png" class="chat-ai-icon"
         onerror="this.src='https://ui-avatars.com/api/?name=AI&background=0D8ABC&color=fff'">
    <div class="chat-message chat-ai-message">こんにちは！日本の法令に関する一般的な仕組みや制度について、AIがお答えします。何かお困りですか？</div>
</div>`;
      return;
    }

    this.el.responseArea.innerHTML = this.history
      .map(
        (item) => `
<div class="chat-user-container">
    <button class="chat-delete-btn" onclick="chatApp.deleteItem('${item.id}')">🗑️</button>
    <div class="chat-message chat-user-message">${escapeHtml(item.question)}</div>
</div>
<div class="chat-ai-container">
    <img src="/assets/images/chat_logo.png" class="chat-ai-icon"
         onerror="this.src='https://ui-avatars.com/api/?name=AI&background=0D8ABC&color=fff'">
    <div class="chat-message chat-ai-message">${escapeHtml(item.answer).trim().replace(/\n/g, "<br>")}</div>
</div>`,
      )
      .join("");
  }

  // ========================================
  // 送信
  // ========================================
  async handleSend() {
    const question = this.el.userInput.value.trim();
    if (!question || this.isGenerating) return;

    if (question.length > CONFIG.MAX_INPUT_LEN) {
      alert(`質問は${CONFIG.MAX_INPUT_LEN}文字以内で入力してください。`);
      return;
    }

    this.isGenerating = true;

    const tempId = "temp-" + Date.now();
    this._appendUserMessage(question, tempId);
    this.el.userInput.value = "";
    this.el.userInput.style.height = "auto";

    this._setLoadingState(true);

    try {
      const answer = await this._callGeminiAPI(this._buildPrompt(question));

      const IGNORE_PHRASE = "関係のない質問には回答できません";
      if (answer.includes(IGNORE_PHRASE)) {
        this._showError(
          "法令に関する質問ではないため、回答・保存をスキップしました。",
        );
        document.querySelector(`[data-temp-id="${tempId}"]`)?.remove();
        return;
      }

      const fullAnswer =
        answer +
        "\n\n━━━━━━━━━━━━━━━━━━━━━━━━\n" +
        "⚠️免責事項 : 本回答はAIによる一般的な法令情報です。\n" +
        "個別の法的判断が必要な場合は、必ず弁護士等の専門家にご相談ください。";

      const newItem = {
        id: Date.now().toString(),
        question,
        answer: fullAnswer,
        docId: null,
      };

      if (window.authApp?.currentUser) {
        try {
          newItem.docId = await window.authApp.saveToCloud(
            question,
            fullAnswer,
            "法令相談",
          );
          if (newItem.docId) {
            console.log("✅ チャット履歴をクラウドに保存:", newItem.docId);
          } else {
            console.warn(
              "⚠️ クラウド保存がnullを返しました（Firestoreルールまたは認証を確認）",
            );
          }
        } catch (saveErr) {
          console.error("❌ クラウド保存エラー:", saveErr);
        }
      } else {
        console.log("📝 未ログイン: ローカルのみに保存");
      }

      this.history.push(newItem);
      this._saveAndRender();
      this._scrollToLastUserMessage();
    } catch (error) {
      console.error(error);
      this._showError("エラーが発生しました: " + error.message);
    } finally {
      this.isGenerating = false;
      this._setLoadingState(false);
    }
  }

  // ========================================
  // ユーザーメッセージの即時挿入
  // ========================================
  _appendUserMessage(text, tempId) {
    this.el.responseArea.insertAdjacentHTML(
      "beforeend",
      `
<div class="chat-user-container" data-temp-id="${tempId}">
    <button class="chat-delete-btn" style="visibility:hidden;">🗑️</button>
    <div class="chat-message chat-user-message">${escapeHtml(text)}</div>
</div>`,
    );

    document
      .querySelector(`[data-temp-id="${tempId}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ========================================
  // Gemini API 呼び出し
  // ========================================
  async _callGeminiAPI(prompt) {
    const response = await fetch(
      `${CONFIG.GEMINI_API_URL}?key=${CONFIG.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2000 },
        }),
      },
    );

    if (!response.ok) throw new Error("APIリクエストに失敗しました");

    const data = await response.json();
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!result) throw new Error("AIから有効な回答が得られませんでした");

    return result;
  }

  // ========================================
  // 個別削除
  // ========================================
  async deleteItem(id) {
    const item = this.history.find((i) => i.id === id);
    const confirmed = await showConfirm(
      "このメッセージを削除しますか？",
      "⚠️",
      item ? { question: item.question, answer: item.answer } : null,
    );
    if (!confirmed) return;

    if (item?.docId && window.authApp) {
      await window.authApp.deletechatation(item.docId);
    }

    this.history = this.history.filter((i) => i.id !== id);
    this._saveAndRender();
  }

  // ========================================
  // 全削除
  // ========================================
  async handleClearAll() {
    if (this.history.length === 0) return;

    const confirmed = await showConfirm(
      `${this.history.length}件の履歴をすべて削除しますか？`,
      "⚠️",
    );
    if (!confirmed) return;

    if (window.authApp?.currentUser) {
      const deletePromises = this.history
        .filter((item) => item.docId)
        .map((item) => window.authApp.deletechatation(item.docId));
      await Promise.allSettled(deletePromises);
    }

    this.history = [];
    this._saveAndRender();
  }

  // ========================================
  // プロンプト構築
  // ========================================
  _buildPrompt(q) {
    return `
あなたは日本の法令に関する一般的な情報を提供するAIアシスタントです。
法令に関係のない質問はプレーンテキストを無視し、「関係のない質問には回答できません」と明記する。
ご質問が不明である場合の回答形式を生成しないでください。
民法、商法、刑法、行政法、労働法、会社法、憲法など幅広い法令の一般的な仕組み・制度について説明します。  
ただし、個別具体的な事案に対する法的判断や結論、相手方との交渉指示、文書作成支援等の法律事務は行いません。
句構造文法を用いて自然な日本語にして。

質問: ${q}

以下の形式でプレーンテキストで回答してください。
例外として法令に関係のないことの質問は以下のプレーンテキストを生成しない。また、「関係のない質問には回答できません」と明記する。

【1. 結論・ポイント(一般論)】
質問に関連する法分野について、一般的な考え方を2-3文で簡潔に説明する。  
※ 個別具体的な判断・結論・違法性判断は行わない。
※ ご質問が不明である場合の回答形式を生成しない。

【2. 相談の目安(専門家への橋渡し)】
・ この分野ではどの専門家に相談するのが一般的かを案内  
・ 利用できる公的相談窓口を紹介  
※ 手続きの具体的指示、文書作成指示、交渉アドバイスは行わない。
※ ご質問が不明である場合の回答形式を生成しない。

【3. 関連する法的根拠(一般論)】
関連し得る法令・条文を一般的に紹介する。  
※ 特定の事実に当てはめた解釈は行わない。
※ ご質問が不明である場合の回答形式を生成しない。

【4. 詳細説明(一般的知識)】
・ 法令の趣旨・目的  
・ 条文の一般的な解釈  
・ 典型的な要件と効果  
・ 一般的な適用範囲  
・ 例外規定  
・ 一般的な具体例  
※ 個別事案の判断は行わない。
※ ご質問が不明である場合の回答形式を生成しない。

【5. 判例・学説(一般論)】
・ 重要な判例の一般的な考え方  
・ 通説・有力説  
※ 個別事案に判例を当てはめて結論づけない。
※ ご質問が不明である場合の回答形式を生成しない。

【6. 注意点・リスク(一般論)】
・ 法制度上の一般的な注意事項  
・ よくある誤解  
・ 例外ケース  
・ 期間制限の一般的情報  
※ 特定の状況への判断は行わない。
※ ご質問が不明である場合の回答形式を生成しない。

【重要(厳守)】
・ 法令に関係のないことの質問はプレーンテキストを無視し、「関係のない質問には回答できません」と明記する。
・ ご質問が不明である場合の回答形式を生成しないで。
・ 個別具体的な事案の判断、法的助言、違法性判断、勝敗予測、交渉指示、文書作成支援などの法律事務は行わない。  
・ 回答は一般的な法情報の提供に限定する。  
・ 具体的な判断が必要な場合は「弁護士等の専門家へ相談してください」と明記する。  
・ 日本の現行法に基づき正確な情報を案内するが、専門家による最終確認を促す。  
・ 回答は日本語で行う。  
・ 読みやすく論理的に説明する。  
・ 専門用語には平易な説明を付す。  
・ 具体例は一般的・典型的なものに限る。  
・ 最新の法改正・判例は一般論として反映する。  
・ 日本の法令に違反しない範囲で情報提供を行う。  
・ アスタリスク記号を使用しない。  
・ 条文番号は正確に記載する。
・ 句構造文法を用いて自然な日本語にして。
`;
  }

  // ========================================
  // 共通処理
  // ========================================
  _saveAndRender() {
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(this.history));
    this.render();
  }

  _setLoadingState(isLoading) {
    this.el.sendButton.disabled = isLoading;
    this.el.sendButton.innerHTML = isLoading
      ? '<span class="sending-dots"><span>.</span><span>.</span><span>.</span></span>'
      : "送信";

    if (isLoading) {
      this.el.responseArea.insertAdjacentHTML(
        "beforeend",
        `
<div id="loading-bubble" class="chat-ai-container">
    <img src="/assets/images/chat_logo.png" class="chat-ai-icon">
    <div class="chat-message chat-ai-message">
        <div class="chat-loading-dots">考え中...</div>
    </div>
</div>`,
      );
    } else {
      document.getElementById("loading-bubble")?.remove();
    }
  }

  _showError(msg) {
    this.el.responseArea.insertAdjacentHTML(
      "beforeend",
      `
<div class="chat-ai-container">
    <img src="/assets/images/chat_logo.png" class="chat-ai-icon">
    <div class="chat-message chat-ai-message" style="color:red; border-color:red;">⚠️ ${msg}</div>
</div>`,
    );
  }

  _scrollToBottom() {
    this.el.responseArea.scrollTop = this.el.responseArea.scrollHeight;
  }

  _scrollToLastUserMessage() {
    const all = this.el.responseArea.querySelectorAll(".chat-user-container");
    all[all.length - 1]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// ========================================
// 起動
// ========================================
document.addEventListener("DOMContentLoaded", () => {
  new LegalChatApp().init();
});
