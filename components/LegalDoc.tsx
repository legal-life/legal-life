import type { LawDoc } from "@/data/law";

// bodyHtml内の <h2 id="..."> を目次として抽出する
function extractToc(html: string): { id: string; label: string }[] {
  const matches = [...html.matchAll(/<h2 id="([^"]+)">([^<]*)<\/h2>/g)];
  return matches.map((m) => ({ id: m[1], label: m[2] }));
}

export default function LegalDoc({ doc }: { doc: LawDoc }) {
  const toc = extractToc(doc.bodyHtml);

  return (
    <div className="max-w-[850px] mx-auto my-10 mx-2.5 sm:mx-auto bg-white rounded-lg shadow-[0_4px_15px_rgba(0,0,0,0.05)] px-5 sm:px-12 py-8 sm:py-14 box-border">
      <h1 className="text-2xl sm:text-3xl font-bold text-center border-b-[3px] border-primary pb-4">{doc.title}</h1>
      <p className="text-right text-sm text-gray-500 mt-6 mb-10">{doc.dateLabel}</p>

      {toc.length > 0 && (
        <nav className="bg-[#f9f9f9] border border-[#eee] rounded-md p-5 mb-10">
          <p className="text-center font-bold text-[#333] mb-2.5">目次</p>
          <ul className="text-sm space-y-2 list-none p-0 m-0">
            {toc.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="text-[#007bff] hover:underline">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <div
        className="text-gray-700 scroll-smooth [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[#333] [&_h2]:bg-[#f8fbfc] [&_h2]:border-l-[5px] [&_h2]:border-primary [&_h2]:px-4 [&_h2]:py-2.5 [&_h2]:mt-10 [&_h2]:mb-5 [&_h2]:scroll-mt-6 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-[#444] [&_h3]:mt-7 [&_h3]:mb-3 [&_h3]:pb-1 [&_h3]:border-b [&_h3]:border-[#ddd] [&_h4]:font-semibold [&_h4]:text-[#555] [&_h4]:mt-6 [&_h4]:mb-2 [&_p]:mb-3 [&_p]:leading-loose [&_a]:text-primary-dark [&_a]:underline [&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_th]:border [&_th]:border-gray-200 [&_th]:p-2 [&_th]:bg-gray-50 [&_td]:border [&_td]:border-gray-200 [&_td]:p-2"
        dangerouslySetInnerHTML={{ __html: doc.bodyHtml }}
      />
    </div>
  );
}
