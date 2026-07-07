"use client";

import { useState } from "react";
import {
  convertToJapaneseCalendar,
  fetchLawDetail,
  LAW_TYPE_LABELS,
  LIMIT,
  parseLawNode,
  searchLaws,
  type LawSummary,
} from "@/lib/lawSearch";

function escapeHtml(s: string): string {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

export default function SearchApp() {
  const [target, setTarget] = useState<"title" | "keyword">("title");
  const [input, setInput] = useState("");
  const [lawType, setLawType] = useState("");
  const [sort, setSort] = useState("none");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [laws, setLaws] = useState<LawSummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [openDetailId, setOpenDetailId] = useState<string | null>(null);
  const [detailHtml, setDetailHtml] = useState<Record<string, string>>({});
  const [detailLoading, setDetailLoading] = useState<string | null>(null);

  const highlight = (text: string) => {
    if (target === "keyword" && input.trim()) {
      const escaped = input.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return escapeHtml(text).replace(new RegExp(`(${escaped})`, "gi"), "<mark>$1</mark>");
    }
    return escapeHtml(text);
  };

  const runSearch = async (nextOffset = 0) => {
    if (!input.trim() && !lawType) {
      setError("検索ワードを入力してください");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { laws: results, totalCount: total } = await searchLaws({
        query: input.trim(),
        searchTarget: target,
        lawType,
        sort,
        offset: nextOffset,
      });
      setLaws(results);
      setTotalCount(total);
      setOffset(nextOffset);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const toggleDetail = async (lawId: string) => {
    if (openDetailId === lawId) {
      setOpenDetailId(null);
      return;
    }
    setOpenDetailId(lawId);
    if (detailHtml[lawId]) return;
    setDetailLoading(lawId);
    try {
      const data = await fetchLawDetail(lawId);
      const html = data.law_full_text ? parseLawNode(data.law_full_text, highlight) : "<p>法令本文が見つかりません</p>";
      setDetailHtml((prev) => ({ ...prev, [lawId]: html }));
    } catch (e) {
      setDetailHtml((prev) => ({ ...prev, [lawId]: `<div class="text-red-600">エラー: ${e instanceof Error ? e.message : String(e)}</div>` }));
    } finally {
      setDetailLoading(null);
    }
  };

  const hasPrev = offset > 0;
  const hasNext = offset + LIMIT < totalCount;
  const currentPageNum = Math.floor(offset / LIMIT) + 1;
  const lastPageNum = Math.ceil(totalCount / LIMIT);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">e-gov法令API Version2 法令検索システム</h1>
        <span className="inline-block mt-2 text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200 rounded px-2 py-0.5">
          テスト中の機能
        </span>
        <p className="text-sm text-gray-500 mt-2">
          e-gov法令API Version2を利用して法令検索機能を作成しています
          <br />
          <small>
            出典: e-Govポータル (
            <a href="https://www.e-gov.go.jp/" target="_blank" rel="noreferrer" className="underline">
              https://www.e-gov.go.jp
            </a>
            )
          </small>
        </p>
      </div>

      <div className="max-w-[800px] mx-auto bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.1)] overflow-hidden">
        <div className="flex">
          <button
            className={`flex-1 px-5 py-3.5 font-bold tracking-wide transition-colors border-r border-black/[0.08] ${
              target === "title" ? "bg-[#00bcd4] text-white" : "bg-[#b2dfdb] text-[#00695c] hover:bg-[#80cbc4] hover:text-white"
            }`}
            onClick={() => setTarget("title")}
          >
            法令名で検索
          </button>
          <button
            className={`flex-1 px-5 py-3.5 font-bold tracking-wide transition-colors ${
              target === "keyword" ? "bg-[#00bcd4] text-white" : "bg-[#b2dfdb] text-[#00695c] hover:bg-[#80cbc4] hover:text-white"
            }`}
            onClick={() => setTarget("keyword")}
          >
            キーワードで検索
          </button>
        </div>

        <div className="px-5 sm:px-6 pt-5 pb-6">
          <div className="relative mb-4">
            <span className="absolute left-4 top-1/2 -translate-y-1/2">🔍</span>
            <input
              type="text"
              className="w-full border-2 border-[#e0e0e0] rounded-lg pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-[#00bcd4] focus:ring-4 focus:ring-[#00bcd4]/10"
              placeholder="ここに入力して検索"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch(0)}
            />
            {input && (
              <button
                type="button"
                aria-label="入力をクリア"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-xl leading-none"
                onClick={() => setInput("")}
              >
                &times;
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-4 mb-4 text-sm">
            <label className="flex items-center gap-2 font-bold text-[#546e7a]">
              絞り込み(法令種別):
              <select
                className="flex-1 border-2 border-[#e0e0e0] rounded-lg px-3 py-1.5 font-bold text-[#212121]"
                value={lawType}
                onChange={(e) => setLawType(e.target.value)}
              >
                <option value="">すべて</option>
                {Object.entries(LAW_TYPE_LABELS).map(([v, label]) => (
                  <option key={v} value={v}>{label}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 font-bold text-[#546e7a]">
              並び替え:
              <select
                className="flex-1 border-2 border-[#e0e0e0] rounded-lg px-3 py-1.5 font-bold text-[#212121]"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="none">指定なし</option>
                <option value="amendment_promulgation_data_desc">最新の改定順</option>
                <option value="date_desc">公布日が新しい順</option>
                <option value="date_asc">公布日が古い順</option>
                <option value="title_asc">法令名順(あいうえお)</option>
              </select>
            </label>
          </div>

          <button
            id="searchButton"
            className="w-full py-3.5 rounded-lg font-bold tracking-wide text-white transition-all disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #00bcd4 0%, #0097a7 100%)", boxShadow: "0 3px 10px rgba(0,188,212,0.3)" }}
            disabled={loading}
            onClick={() => runSearch(0)}
          >
            検索
          </button>
        </div>
      </div>

      {error && <div className="text-red-600 text-sm mt-4">{error}</div>}
      {loading && <div className="text-gray-500 text-sm mt-4">検索中...</div>}

      {!loading && laws.length > 0 && (
        <>
          <Pagination
            totalCount={totalCount}
            offset={offset}
            hasPrev={hasPrev}
            hasNext={hasNext}
            currentPageNum={currentPageNum}
            lastPageNum={lastPageNum}
            onPage={runSearch}
          />
          <div className="space-y-4 mt-4">
            {laws.map((law) => {
              const info = law.law_info || {};
              const revision = law.revision_info || {};
              const title = revision.law_title || info.law_title || "名称不明";
              const lawId = info.law_id || "不明";
              const typeJa = (info.law_type || "").split(",").map((t) => LAW_TYPE_LABELS[t.trim()] || t.trim()).join(", ");
              return (
                <div key={lawId} className="bg-white border border-gray-200 rounded-xl p-4">
                  <p className="font-bold mb-2">{title}</p>
                  <div className="text-sm text-gray-600 space-y-1 mb-3">
                    <p>法令ID: <a href={`https://laws.e-gov.go.jp/law/${lawId}`} target="_blank" rel="noreferrer" className="text-primary-dark underline">{lawId}</a></p>
                    <p>法令番号: {info.law_num || "不明"}</p>
                    <p>公布日: {convertToJapaneseCalendar(info.promulgation_date)}</p>
                    <p>最新改正公布日: {convertToJapaneseCalendar(revision.amendment_promulgation_date) !== "不明" ? convertToJapaneseCalendar(revision.amendment_promulgation_date) : "(改正情報なし)"}</p>
                    <p>法令種別: {typeJa}</p>
                  </div>
                  <button
                    className="text-sm border border-gray-300 rounded-lg px-4 py-2 font-semibold"
                    onClick={() => toggleDetail(lawId)}
                  >
                    {openDetailId === lawId ? "閉じる" : "詳細を見る"}
                  </button>
                  {openDetailId === lawId && (
                    <div className="mt-3 pt-3 border-t text-sm leading-relaxed">
                      {detailLoading === lawId ? (
                        <p className="text-gray-400">読み込み中...</p>
                      ) : (
                        <div dangerouslySetInnerHTML={{ __html: detailHtml[lawId] || "" }} />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <Pagination
            totalCount={totalCount}
            offset={offset}
            hasPrev={hasPrev}
            hasNext={hasNext}
            currentPageNum={currentPageNum}
            lastPageNum={lastPageNum}
            onPage={runSearch}
          />
        </>
      )}
    </div>
  );
}

function Pagination({
  totalCount,
  offset,
  hasPrev,
  hasNext,
  currentPageNum,
  lastPageNum,
  onPage,
}: {
  totalCount: number;
  offset: number;
  hasPrev: boolean;
  hasNext: boolean;
  currentPageNum: number;
  lastPageNum: number;
  onPage: (offset: number) => void;
}) {
  const start = offset + 1;
  const end = Math.min(offset + LIMIT, totalCount);
  return (
    <div className="flex items-center justify-between text-sm my-3">
      <button className="border border-gray-300 rounded-lg px-3 py-1.5 disabled:opacity-40" disabled={!hasPrev} onClick={() => onPage(offset - LIMIT)}>
        ◀ 前の20件
      </button>
      <span className="text-gray-500">
        {totalCount.toLocaleString()}件中 {start}〜{end}件 ({currentPageNum} / {lastPageNum} ページ)
      </span>
      <button className="border border-gray-300 rounded-lg px-3 py-1.5 disabled:opacity-40" disabled={!hasNext} onClick={() => onPage(offset + LIMIT)}>
        次の20件 ▶
      </button>
    </div>
  );
}
