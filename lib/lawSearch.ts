export const LIMIT = 20;

export const LAW_TYPE_LABELS: Record<string, string> = {
  Constitution: "憲法",
  Act: "法律",
  CabinetOrder: "政令",
  ImperialOrder: "勅令",
  MinisterialOrdinance: "府省令",
  Rule: "規則",
};

const SORT_MAPPING: Record<string, string> = {
  amendment_promulgation_data_desc: "amendment_promulgation_date_desc",
  date_desc: "promulgation_date_desc",
  date_asc: "promulgation_date_asc",
  title_asc: "law_title_asc",
};

export function convertToJapaneseCalendar(dateString?: string): string {
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

export type LawSummary = {
  law_info?: { law_id?: string; law_num?: string; law_title?: string; promulgation_date?: string; law_type?: string };
  revision_info?: { law_title?: string; amendment_promulgation_date?: string };
};

export async function searchLaws(params: {
  query: string;
  searchTarget: "title" | "keyword";
  lawType: string;
  sort: string;
  offset: number;
}): Promise<{ laws: LawSummary[]; totalCount: number }> {
  let url = `https://laws.e-gov.go.jp/api/2/laws?limit=${LIMIT}&offset=${params.offset}&response_format=json`;
  if (params.query) {
    url +=
      params.searchTarget === "title"
        ? `&law_title=${encodeURIComponent(params.query)}`
        : `&keyword=${encodeURIComponent(params.query)}`;
  }
  if (params.lawType) url += `&law_type=${params.lawType}`;
  if (params.sort && params.sort !== "none") {
    const apiSortValue = SORT_MAPPING[params.sort] || params.sort;
    const parts = apiSortValue.split("_");
    const order = parts.pop();
    const key = parts.join("_");
    url += `&sort_key=${key}&sort_order=${order}`;
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`APIリクエストに失敗しました (Status: ${res.status})`);
  const data = await res.json();
  return { laws: data.laws || [], totalCount: data.total_count || 0 };
}

export async function fetchLawDetail(lawId: string) {
  const res = await fetch(`https://laws.e-gov.go.jp/api/2/law_data/${lawId}?response_format=json`);
  if (!res.ok) throw new Error(`法令データの取得に失敗しました (Status: ${res.status})`);
  return res.json();
}

// ── 法令本文ノードのパース(元 search.js の parseNode 相当。文字列HTMLを生成する) ──
type LawNodeObj = { tag?: string; text?: string; children?: LawNode[] };
type LawNode = LawNodeObj | string;

function findChildByTag(children: LawNode[] | undefined, tag: string): LawNodeObj | null {
  if (!Array.isArray(children)) return null;
  return (children.find((c) => typeof c !== "string" && c.tag === tag) as LawNodeObj) || null;
}
function findChildrenByTag(children: LawNode[] | undefined, tag: string): LawNodeObj[] {
  if (!Array.isArray(children)) return [];
  return children.filter((c) => typeof c !== "string" && c.tag === tag) as LawNodeObj[];
}
function extractText(node: LawNode | null, highlight: (s: string) => string): string {
  if (!node) return "";
  if (typeof node === "string") return highlight(node);
  if (node.text) return highlight(node.text);
  if (Array.isArray(node.children)) return node.children.map((c) => extractText(c, highlight)).join("");
  return "";
}

export function parseLawNode(node: LawNode | undefined, highlight: (s: string) => string): string {
  if (!node) return "";
  if (Array.isArray(node)) return (node as LawNode[]).map((n) => parseLawNode(n, highlight)).join("");
  if (typeof node === "string") return highlight(node);

  const tag = node.tag;
  const children = node.children || [];
  let html = "";

  switch (tag) {
    case "law_title":
      html += `<div class="lawapi-article"><div class="lawapi-article-title" style="font-size:1.2rem;text-align:center;">${extractText(node, highlight)}</div></div>`;
      break;
    case "Chapter": {
      const chapterTitle = findChildByTag(children, "ChapterTitle");
      if (chapterTitle) html += `<div class="lawapi-article"><div class="lawapi-article-title">【${extractText(chapterTitle, highlight)}】</div></div>`;
      children.forEach((child) => {
        if (typeof child === "string" || child.tag !== "ChapterTitle") html += parseLawNode(child, highlight);
      });
      break;
    }
    case "Section": {
      const sectionTitle = findChildByTag(children, "SectionTitle");
      if (sectionTitle) html += `<div class="lawapi-article"><div class="lawapi-article-title">〔${extractText(sectionTitle, highlight)}〕</div></div>`;
      children.forEach((child) => {
        if (typeof child === "string" || child.tag !== "SectionTitle") html += parseLawNode(child, highlight);
      });
      break;
    }
    case "Article": {
      html += '<div class="lawapi-article">';
      const articleCaption = findChildByTag(children, "ArticleCaption");
      const articleTitle = findChildByTag(children, "ArticleTitle");
      if (articleCaption) html += `<div class="lawapi-article-title">${extractText(articleCaption, highlight)}</div>`;
      if (articleTitle) html += `<div class="lawapi-article-title">${extractText(articleTitle, highlight)}</div>`;
      findChildrenByTag(children, "Paragraph").forEach((para, i) => {
        const paraNum = findChildByTag(para.children, "ParagraphNum");
        const paraSentence = findChildByTag(para.children, "ParagraphSentence");
        if (paraSentence) {
          if (i > 0) html += "<br>";
          html += `<div class="lawapi-article-content">${paraNum ? extractText(paraNum, highlight) + " " : ""}${extractText(paraSentence, highlight)}</div>`;
        }
        findChildrenByTag(para.children, "Item").forEach((item) => {
          const itemTitle = findChildByTag(item.children, "ItemTitle");
          const itemSentence = findChildByTag(item.children, "ItemSentence");
          if (itemTitle || itemSentence) {
            html += `<div class="lawapi-article-content" style="padding-left:2em;">${itemTitle ? extractText(itemTitle, highlight) : ""}${itemSentence ? extractText(itemSentence, highlight) : ""}</div>`;
          }
        });
      });
      html += "</div>";
      break;
    }
    case "SupplProvision": {
      html += '<div class="lawapi-suppl-provision"><div class="lawapi-suppl-provision-title">附　則</div>';
      const supplLabel = findChildByTag(children, "SupplProvisionLabel");
      if (supplLabel) html += `<div class="lawapi-suppl-provision-content">${extractText(supplLabel, highlight)}</div>`;
      findChildrenByTag(children, "Paragraph").forEach((para, i) => {
        const paraNum = findChildByTag(para.children, "ParagraphNum");
        const paraSentence = findChildByTag(para.children, "ParagraphSentence");
        if (paraSentence) {
          if (i > 0) html += "<br>";
          html += `<div class="lawapi-suppl-provision-content">${paraNum ? extractText(paraNum, highlight) + " " : ""}${extractText(paraSentence, highlight)}</div>`;
        }
      });
      findChildrenByTag(children, "Article").forEach((article) => {
        html += parseLawNode(article, highlight);
      });
      children.forEach((child) => {
        if (typeof child !== "string" && !["SupplProvisionLabel", "Paragraph", "Article"].includes(child.tag || "")) {
          html += parseLawNode(child, highlight);
        }
      });
      html += "</div>";
      break;
    }
    case "Preamble": {
      html += '<div class="lawapi-preamble">';
      children.forEach((child) => {
        if (typeof child !== "string" && child.tag === "Paragraph") {
          const paraSentence = findChildByTag(child.children, "ParagraphSentence");
          if (paraSentence) html += `<div class="lawapi-preamble-content">${extractText(paraSentence, highlight)}</div>`;
        } else {
          html += parseLawNode(child, highlight);
        }
      });
      html += "</div>";
      break;
    }
    default:
      if (node.text) {
        html += highlight(node.text);
      } else {
        children.forEach((child) => {
          html += parseLawNode(child, highlight);
        });
      }
  }
  return html;
}
