import Link from "next/link";

export default function ErrorPage({ code, title, desc }: { code: string; title: string; desc: string }) {
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <h1 className="text-3xl font-bold mb-2">{code}</h1>
      <h2 className="text-lg font-bold mb-4">{title}</h2>
      <p className="text-sm text-gray-500 leading-relaxed mb-6" style={{ whiteSpace: "pre-line" }}>
        {desc}
      </p>
      <Link href="/" className="inline-block bg-primary text-white font-bold rounded-lg px-6 py-2.5 text-sm">
        ホームページに戻る
      </Link>
    </div>
  );
}
