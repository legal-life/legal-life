import ErrorPage from "@/components/ErrorPage";

export default function NotFound() {
  return (
    <ErrorPage
      code="404 Not Found"
      title="お探しのページは見つかりませんでした"
      desc={
        "申し訳ありませんが、指定されたURLのページは削除、変更されたか、現在利用することが出来ない可能性があります。\nお手数をおかけしますが、ご希望のページをお探しいただきますようお願いします。"
      }
    />
  );
}
