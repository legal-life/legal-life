import type { LawDoc } from "@/data/law";

// bodyHtml内の <h2 id="..."> を目次として抽出する
function extractToc(html: string): { id: string; label: string }[] {
  const matches = [...html.matchAll(/<h2 id="([^"]+)">([^<]*)<\/h2>/g)];
  return matches.map((m) => ({ id: m[1], label: m[2] }));
}

export default function LegalDoc({ doc }: { doc: LawDoc }) {
  const toc = extractToc(doc.bodyHtml);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-center">{doc.title}</h1>
      <p className="text-center text-xs text-gray-400 mt-1 mb-6">{doc.dateLabel}</p>

      {toc.length > 0 && (
        <nav className="bg-gray-50 rounded-xl p-4 mb-6">
          <p className="text-xs font-bold text-gray-500 mb-2">目次</p>
          <ul className="text-sm space-y-1">
            {toc.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="text-primary-dark underline">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <div
        className="prose prose-sm max-w-none text-gray-700 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:scroll-mt-20 [&_h3]:font-bold [&_h3]:mt-4 [&_h3]:mb-2 [&_h4]:font-semibold [&_h4]:mt-3 [&_h4]:mb-1 [&_p]:mb-2 [&_p]:leading-relaxed [&_a]:text-primary-dark [&_a]:underline [&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_th]:border [&_th]:border-gray-200 [&_th]:p-2 [&_th]:bg-gray-50 [&_td]:border [&_td]:border-gray-200 [&_td]:p-2"
        dangerouslySetInnerHTML={{ __html: doc.bodyHtml }}
      />
    </div>
  );
}
