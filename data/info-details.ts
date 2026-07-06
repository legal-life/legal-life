export type InfoDetail = {
  slug: string;
  date: string;
  title: string;
};

// info/details配下の各ページの一覧データ。ホームページの「お知らせ」抜粋・/infoのお知らせ一覧が共通で参照する。
// TODO(info/lawページ移植タスクで対応): 0001〜0018の残りのエントリは、各詳細ページの本文を実際に読んだ上で追加する。
// ここでは header.html に実際に記載されていた最新2件のみを暫定的に登録している。
export const infoDetails: InfoDetail[] = [
  { slug: "9999", date: "2026/05/11", title: "現在のサイトステータスと正式リリースについて" },
  { slug: "0013", date: "2026/05/20", title: "アカウントシステム刷新の全貌と、リリース延期に伴う影響について" },
];
