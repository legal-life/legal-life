// search.js

// ========================================
// 定数・状態
// ========================================
const INPUT_ID = "SearchInput"; // HTML の id と完全一致させる

let currentDetailElement = null;
let currentLawsData = [];
let currentSearchTarget = "title"; // タブで切り替わる
const LIMIT = 20;

// ========================================
// 和暦変換
// ========================================
function convertToJapaneseCalendar(dateString) {
  if (!dateString || dateString === "不明") return "不明";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat("ja-JP-u-ca-japanese", {
      era: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  } catch {
    return dateString;
  }
}

// ========================================
// DOM 準備完了後の初期化
// ========================================
document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".search-tab");
  const searchInput = document.getElementById(INPUT_ID);

  // タブ切り替え
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      currentSearchTarget = tab.dataset.target;
      searchInput?.focus();
    });
  });

  // Enter キーで検索（keypress は deprecated のため keydown を使用）
  searchInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") searchLaws();
  });
});

// ========================================
// 検索実行
// ========================================
async function searchLaws(offset) {
  if (typeof offset !== "number") offset = 0;

  // ★ 修正: INPUT_ID を使って確実に取得
  const searchInput = document.getElementById(INPUT_ID);
  const inputValue = searchInput ? searchInput.value.trim() : "";
  const law_type = document.getElementById("law_typeSelect")?.value || "";
  const sortValue = document.getElementById("sortSelect")?.value || "none";

  const button = document.getElementById("searchButton");
  const resultsDiv = document.getElementById("results");
  const loadingDiv = document.getElementById("loadingMessage");
  const errorDiv = document.getElementById("errorMessage");

  if (!inputValue && !law_type) {
    if (errorDiv)
      errorDiv.innerHTML =
        '<div class="lawapi-error">検索ワードを入力してください</div>';
    return;
  }

  errorDiv.innerHTML = "";
  resultsDiv.innerHTML = "";
  loadingDiv.innerHTML = '<div class="lawapi-loading">検索中...</div>';
  if (button) button.disabled = true;

  try {
    let url = `https://laws.e-gov.go.jp/api/2/laws?limit=${LIMIT}&offset=${offset}&response_format=json`;

    if (inputValue) {
      url +=
        currentSearchTarget === "title"
          ? `&law_title=${encodeURIComponent(inputValue)}`
          : `&keyword=${encodeURIComponent(inputValue)}`;
    }
    if (law_type) url += `&law_type=${law_type}`;

    if (sortValue && sortValue !== "none") {
      const sortMapping = {
        amendment_promulgation_data_desc: "amendment_promulgation_date_desc",
        date_desc: "promulgation_date_desc",
        date_asc: "promulgation_date_asc",
        title_asc: "law_title_asc",
      };
      const apiSortValue = sortMapping[sortValue] || sortValue;
      const parts = apiSortValue.split("_");
      const order = parts.pop();
      const key = parts.join("_");
      url += `&sort_key=${key}&sort_order=${order}`;
    }

    const response = await fetch(url);
    if (!response.ok)
      throw new Error(
        `APIリクエストに失敗しました (Status: ${response.status})`,
      );

    const data = await response.json();
    currentLawsData = data.laws || [];
    const totalCount = data.total_count || 0;

    if (currentLawsData.length === 0) {
      resultsDiv.innerHTML =
        '<div class="lawapi-no-results">検索結果が見つかりませんでした</div>';
    } else {
      displayResults(totalCount, offset);
      displayPagination(totalCount, offset);
    }
  } catch (error) {
    if (errorDiv)
      errorDiv.innerHTML = `<div class="lawapi-error">エラーが発生しました: ${error.message}</div>`;
    console.error("検索エラー:", error);
  } finally {
    loadingDiv.innerHTML = "";
    if (button) button.disabled = false;
    document
      .querySelector(".lawapi-search-container")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// ========================================
// ページネーション
// ========================================
function displayPagination(totalCount, currentOffset) {
  const resultsDiv = document.getElementById("results");
  document.querySelectorAll(".lawapi-pagination").forEach((p) => p.remove());

  const hasPrev = currentOffset > 0;
  const hasNext = currentOffset + LIMIT < totalCount;
  const currentPageNum = Math.floor(currentOffset / LIMIT) + 1;
  const lastPageNum = Math.ceil(totalCount / LIMIT);
  const startCount = currentOffset + 1;
  const endCount = Math.min(currentOffset + LIMIT, totalCount);

  const html = `
<div class="lawapi-pagination">
    <button onclick="searchLaws(${currentOffset - LIMIT})" ${!hasPrev ? "disabled" : ""}>◀ 前の20件</button>
    <span>${totalCount.toLocaleString()}件中 ${startCount}〜${endCount}件 (${currentPageNum} / ${lastPageNum} ページ)</span>
    <button onclick="searchLaws(${currentOffset + LIMIT})" ${!hasNext ? "disabled" : ""}>次の20件 ▶</button>
</div>`;

  resultsDiv.insertAdjacentHTML("afterbegin", html);
  resultsDiv.insertAdjacentHTML("beforeend", html);
}

// ========================================
// キーワードハイライト
// ========================================
function highlightKeyword(text) {
  // ★ 修正: INPUT_ID を使って確実に取得
  const keyword = document.getElementById(INPUT_ID)?.value.trim() ?? "";
  if (currentSearchTarget === "keyword" && keyword && text) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return text.replace(new RegExp(`(${escaped})`, "gi"), "<mark>$1</mark>");
  }
  return text;
}

// ========================================
// 法令詳細の表示・非表示
// ========================================
async function viewLawDetail(law_id, law_title, law_num, buttonElement) {
  const detailDiv = document.getElementById(`detail-${law_id}`);

  // 開いている場合は閉じる
  if (detailDiv.style.display === "block") {
    detailDiv.style.display = "none";
    buttonElement.textContent = "詳細を見る";
    buttonElement.classList.remove("active");
    return;
  }

  // 他に開いているものを閉じる
  if (currentDetailElement && currentDetailElement !== detailDiv) {
    currentDetailElement.style.display = "none";
    const prevBtn = currentDetailElement.previousElementSibling;
    if (prevBtn) {
      prevBtn.textContent = "詳細を見る";
      prevBtn.classList.remove("active");
    }
  }

  detailDiv.innerHTML = '<div class="lawapi-loading">読み込み中...</div>';
  detailDiv.style.display = "block";
  buttonElement.textContent = "読み込み中...";
  buttonElement.classList.add("active");
  currentDetailElement = detailDiv;

  try {
    const url = `https://laws.e-gov.go.jp/api/2/law_data/${law_id}?response_format=json`;
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(
        `法令データの取得に失敗しました (Status: ${response.status})`,
      );

    const data = await response.json();
    const content = formatLawContent(data);
    detailDiv.innerHTML = `
<div class="lawapi-law-detail">
    <hr>
    <div class="lawapi-law-content">${content}</div>
</div>`;
    buttonElement.textContent = "閉じる";
  } catch (error) {
    detailDiv.innerHTML = `<div class="lawapi-error">エラー: ${error.message}</div>`;
    buttonElement.textContent = "詳細を見る";
    buttonElement.classList.remove("active");
    console.error("詳細取得エラー:", error);
  }
}

// ========================================
// 法令本文フォーマット
// ========================================
function formatLawContent(data) {
  const lawFullText = data.law_full_text;
  if (!lawFullText) return "<p>法令本文が見つかりません</p>";
  return parseNode(lawFullText) || "<p>法令本文の解析ができませんでした</p>";
}

function parseNode(node, depth = 0) {
  if (!node) return "";
  if (Array.isArray(node))
    return node.map((item) => parseNode(item, depth)).join("");
  if (typeof node === "string") return highlightKeyword(node);

  const tag = node.tag;
  const children = node.children || [];
  let html = "";

  switch (tag) {
    case "law_title":
      html += `<div class="lawapi-article">
                <div class="lawapi-article-title" style="font-size:1.2rem;text-align:center;">${extractText(node)}</div>
            </div>`;
      break;

    case "Chapter": {
      const chapterTitle = findChildByTag(children, "ChapterTitle");
      if (chapterTitle)
        html += `<div class="lawapi-article"><div class="lawapi-article-title">【${extractText(chapterTitle)}】</div></div>`;
      children.forEach((child) => {
        if (child.tag !== "ChapterTitle") html += parseNode(child, depth + 1);
      });
      break;
    }

    case "Section": {
      const sectionTitle = findChildByTag(children, "SectionTitle");
      if (sectionTitle)
        html += `<div class="lawapi-article"><div class="lawapi-article-title">〔${extractText(sectionTitle)}〕</div></div>`;
      children.forEach((child) => {
        if (child.tag !== "SectionTitle") html += parseNode(child, depth + 1);
      });
      break;
    }

    case "Article": {
      html += '<div class="lawapi-article">';
      const articleCaption = findChildByTag(children, "ArticleCaption");
      const articleTitle = findChildByTag(children, "ArticleTitle");
      if (articleCaption)
        html += `<div class="lawapi-article-title">${extractText(articleCaption)}</div>`;
      if (articleTitle)
        html += `<div class="lawapi-article-title">${extractText(articleTitle)}</div>`;

      findChildrenByTag(children, "Paragraph").forEach((para, i) => {
        const paraNum = findChildByTag(para.children, "ParagraphNum");
        const paraSentence = findChildByTag(para.children, "ParagraphSentence");
        if (paraSentence) {
          if (i > 0) html += "<br>";
          html += `<div class="lawapi-article-content">${paraNum ? extractText(paraNum) + " " : ""}${extractText(paraSentence)}</div>`;
        }
        findChildrenByTag(para.children, "Item").forEach((item) => {
          const itemTitle = findChildByTag(item.children, "ItemTitle");
          const itemSentence = findChildByTag(item.children, "ItemSentence");
          if (itemTitle || itemSentence) {
            html += `<div class="lawapi-article-content" style="padding-left:2em;">
                            ${itemTitle ? extractText(itemTitle) : ""}${itemSentence ? extractText(itemSentence) : ""}
                        </div>`;
          }
        });
      });
      html += "</div>";
      break;
    }

    case "SupplProvision": {
      html +=
        '<div class="lawapi-suppl-provision"><div class="lawapi-suppl-provision-title">附　則</div>';
      const supplLabel = findChildByTag(children, "SupplProvisionLabel");
      if (supplLabel)
        html += `<div class="lawapi-suppl-provision-content">${extractText(supplLabel)}</div>`;
      findChildrenByTag(children, "Paragraph").forEach((para, i) => {
        const paraNum = findChildByTag(para.children, "ParagraphNum");
        const paraSentence = findChildByTag(para.children, "ParagraphSentence");
        if (paraSentence) {
          if (i > 0) html += "<br>";
          html += `<div class="lawapi-suppl-provision-content">${paraNum ? extractText(paraNum) + " " : ""}${extractText(paraSentence)}</div>`;
        }
      });
      findChildrenByTag(children, "Article").forEach((article) => {
        html += parseNode(article, depth + 1);
      });
      children.forEach((child) => {
        if (
          !["SupplProvisionLabel", "Paragraph", "Article"].includes(child.tag)
        )
          html += parseNode(child, depth + 1);
      });
      html += "</div>";
      break;
    }

    case "Preamble": {
      html += '<div class="lawapi-preamble">';
      children.forEach((child) => {
        if (child.tag === "Paragraph") {
          const paraSentence = findChildByTag(
            child.children,
            "ParagraphSentence",
          );
          if (paraSentence)
            html += `<div class="lawapi-preamble-content">${extractText(paraSentence)}</div>`;
        } else {
          html += parseNode(child, depth + 1);
        }
      });
      html += "</div>";
      break;
    }

    default:
      if (node.text) {
        html += highlightKeyword(node.text);
      } else {
        children.forEach((child) => {
          html += parseNode(child, depth + 1);
        });
      }
  }

  return html;
}

// ========================================
// ヘルパー関数
// ========================================
function findChildByTag(children, tagName) {
  if (!Array.isArray(children)) return null;
  return children.find((child) => child.tag === tagName) || null;
}

function findChildrenByTag(children, tagName) {
  if (!Array.isArray(children)) return [];
  return children.filter((child) => child.tag === tagName);
}

function extractText(node) {
  if (!node) return "";
  if (typeof node === "string") return highlightKeyword(node);
  if (node.text) return highlightKeyword(node.text);
  if (Array.isArray(node.children))
    return node.children.map((child) => extractText(child)).join("");
  return "";
}

// ========================================
// 検索結果の描画
// ========================================
function displayResults(totalCount, offset) {
  const resultsDiv = document.getElementById("results");

  const typeMapping = {
    Constitution: "憲法",
    Act: "法律",
    CabinetOrder: "政令",
    ImperialOrder: "勅令",
    MinisterialOrdinance: "府省令",
    Rule: "規則",
  };

  const html = currentLawsData
    .map((law) => {
      const info = law.law_info || {};
      const revision = law.revision_info || {};
      const amendDate = convertToJapaneseCalendar(
        revision.amendment_promulgation_date,
      );
      const title = revision.law_title || info.law_title || "名称不明";
      const law_id = info.law_id || "不明";
      const law_num = info.law_num || "不明";
      const date = convertToJapaneseCalendar(info.promulgation_date);
      const typeJa = (info.law_type || "")
        .split(",")
        .map((t) => typeMapping[t.trim()] || t.trim())
        .join(", ");
      const safeTitle = title.replace(/'/g, "\\'");

      return `
<div class="lawapi-result-item">
    <div class="lawapi-law-title">${title}</div>
    <div class="lawapi-law-info">
        <div class="lawapi-law-info-item"><span class="lawapi-law-info-label">法令名</span><span>：${title}</span></div>
        <div class="lawapi-law-info-item"><span class="lawapi-law-info-label">法令ID</span><span>：<a href="https://laws.e-gov.go.jp/law/${law_id}" target="_blank">${law_id}</a></span></div>
        <div class="lawapi-law-info-item"><span class="lawapi-law-info-label">法令番号</span><span>：${law_num}</span></div>
        <div class="lawapi-law-info-item"><span class="lawapi-law-info-label">公布日</span><span>：${date}</span></div>
        <div class="lawapi-law-info-item"><span class="lawapi-law-info-label">最新改正公布日</span><span>：${amendDate !== "不明" ? amendDate : "（改正情報なし）"}</span></div>
        <div class="lawapi-law-info-item"><span class="lawapi-law-info-label">法令種別</span><span>：${typeJa}</span></div>
    </div>
    <button class="lawapi-view-button" onclick="viewLawDetail('${law_id}', '${safeTitle}', '${law_num}', this)">詳細を見る</button>
    <div id="detail-${law_id}" style="display:none;"></div>
</div>`;
    })
    .join("");

  resultsDiv.innerHTML = `<div class="lawapi-results">${html}</div>`;
}
