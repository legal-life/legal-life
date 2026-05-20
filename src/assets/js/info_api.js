/**
 * デバッグ機能付き：お知らせ取得関数
 */
async function fetchRecentInformation(url) {
  const container = document.getElementById("info-container");
  if (!container) return;

  try {
    console.log("Fetching from:", url); // ブラウザのコンソールにパスを表示
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTPエラー! ステータス: ${response.status}`);
    }

    const htmlText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, "text/html");

    // お知らせページ内の id="source-info" を探す
    const sourceElement = doc.getElementById("source-info");

    if (!sourceElement) {
      console.error("ID 'source-info' が見つかりませんでした。");
      container.innerHTML =
        '<p class="no-info-msg">データの抽出に失敗しました（ID未設定）</p>';
      return;
    }

    const allItems = Array.from(
      sourceElement.getElementsByClassName("home_info_item"),
    );
    console.log("取得できたアイテム数:", allItems.length);

    if (allItems.length > 0) {
      const recentItems = allItems.slice(0, 5);
      container.innerHTML = "";
      recentItems.forEach((item) => {
        container.appendChild(item.cloneNode(true));
      });
    } else {
      container.innerHTML =
        '<p class="no-info-msg">最新のお知らせはありません</p>';
    }
  } catch (error) {
    console.error("取得エラーの内容:", error);
    container.innerHTML = `<p class="no-info-msg">お知らせを読み込めませんでした（${error.message}）</p>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // あなたの環境に合わせてここを調整してください
  // 1. もしルート直下の info フォルダなら: '/info/index.html'
  // 2. もし同じフォルダ内なら: './info/index.html'
  fetchRecentInformation("/info");
});
