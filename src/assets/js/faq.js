// faq.js
// 役割: FAQのフィルタリングとアコーディオン開閉のみを担当。
// クリアボタンの表示制御はimportant.jsで実施。

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("SearchInput"); // ← 'faq-search'から修正
  const tabBtns = document.querySelectorAll(".faq_tab_btn");
  const faqItems = document.querySelectorAll(".faq_item");
  const emptyMessage = document.getElementById("faq-empty-message");

  // ---- FAQフィルタリング（FAQ固有のロジック）----
  function filterFAQ() {
    const searchTerm = searchInput.value.toLowerCase();
    const activeCategory = document.querySelector(".faq_tab_btn.active").dataset
      .category;
    let visibleCount = 0;

    faqItems.forEach((item) => {
      const text = item.textContent.toLowerCase();
      const category = item.dataset.category;
      const matchesSearch = text.includes(searchTerm);
      const matchesCategory =
        activeCategory === "all" || category === activeCategory;

      item.style.display = matchesSearch && matchesCategory ? "block" : "none";
      if (matchesSearch && matchesCategory) visibleCount++;
    });

    emptyMessage.style.display = visibleCount === 0 ? "block" : "none";
  }

  // ---- イベントリスナー ----

  // 通常の文字入力時
  searchInput.addEventListener("input", filterFAQ);

  // important.js からクリアイベントを受け取ったとき、フィルターをリセット
  searchInput.addEventListener("search:cleared", filterFAQ);

  // タブ切り替え時
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      filterFAQ();
    });
  });

  // アコーディオン開閉
  faqItems.forEach((item) => {
    item.querySelector(".faq_question").addEventListener("click", () => {
      item.classList.toggle("is-active");
    });
  });
});
