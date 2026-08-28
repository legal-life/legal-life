import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent";
const MAX_INPUT_LEN = 1000;

function buildPrompt(q: string): string {
  return `
あなたは日本の法令に関する一般的な情報を提供するAIアシスタントです。
法令に関係のない質問はプレーンテキストを無視し、「関係のない質問には回答できません」と明記する。
ご質問が不明である場合の回答形式を生成しないでください。
民法、商法、刑法、行政法、労働法、会社法、憲法など幅広い法令の一般的な仕組み・制度について説明します。
ただし、個別具体的な事案に対する法的判断や結論、相手方との交渉指示、文書作成支援等の法律事務は行いません。
句構造文法を用いて自然な日本語にして。

質問: ${q}

以下の形式でプレーンテキストで回答してください。
例外として法令に関係のないことの質問は以下のプレーンテキストを生成しない。また、「関係のない質問には回答できません」と明記する。

回答の一番最初の行に、必ず次の形式で質問が最も関係する法令分野を1つだけ出力すること(利用統計の集計にのみ使用し、ユーザーには表示しない):
CATEGORY: <法分野名。例: 民法/刑法/商法/会社法/労働法/行政法/憲法/消費者法/知的財産法/その他>
そのすぐ次の行は空行にし、その後に通常の回答本文を続けること。

【1. 結論・ポイント(一般論)】
質問に関連する法分野について、一般的な考え方を2-3文で簡潔に説明する。
※ 個別具体的な判断・結論・違法性判断は行わない。
※ ご質問が不明である場合の回答形式を生成しない。

【2. 相談の目安(専門家への橋渡し)】
・ この分野ではどの専門家に相談するのが一般的かを案内
・ 利用できる公的相談窓口を紹介
※ 手続きの具体的指示、文書作成指示、交渉アドバイスは行わない。
※ ご質問が不明である場合の回答形式を生成しない。

【3. 関連する法的根拠(一般論)】
関連し得る法令・条文を一般的に紹介する。
※ 特定の事実に当てはめた解釈は行わない。
※ ご質問が不明である場合の回答形式を生成しない。

【4. 詳細説明(一般的知識)】
・ 法令の趣旨・目的
・ 条文の一般的な解釈
・ 典型的な要件と効果
・ 一般的な適用範囲
・ 例外規定
・ 一般的な具体例
※ 個別事案の判断は行わない。
※ ご質問が不明である場合の回答形式を生成しない。

【5. 判例・学説(一般論)】
・ 重要な判例の一般的な考え方
・ 通説・有力説
※ 個別事案に判例を当てはめて結論づけない。
※ ご質問が不明である場合の回答形式を生成しない。

【6. 注意点・リスク(一般論)】
・ 法制度上の一般的な注意事項
・ よくある誤解
・ 例外ケース
・ 期間制限の一般的情報
※ 特定の状況への判断は行わない。
※ ご質問が不明である場合の回答形式を生成しない。

【重要(厳守)】
・ 法令に関係のないことの質問はプレーンテキストを無視し、「関係のない質問には回答できません」と明記する。
・ ご質問が不明である場合の回答形式を生成しないで。
・ 個別具体的な事案の判断、法的助言、違法性判断、勝敗予測、交渉指示、文書作成支援などの法律事務は行わない。
・ 回答は一般的な法情報の提供に限定する。
・ 具体的な判断が必要な場合は「弁護士等の専門家へ相談してください」と明記する。
・ 日本の現行法に基づき正確な情報を案内するが、専門家による最終確認を促す。
・ 回答は日本語で行う。
・ 読みやすく論理的に説明する。
・ 専門用語には平易な説明を付す。
・ 具体例は一般的・典型的なものに限る。
・ 最新の法改正・判例は一般論として反映する。
・ 日本の法令に違反しない範囲で情報提供を行う。
・ アスタリスク記号を使用しない。
・ 条文番号は正確に記載する。
・ 句構造文法を用いて自然な日本語にして。
`;
}

// Gemini API呼び出し。旧chat.jsはクライアント側でAPIキーを直接埋め込んで呼んでいたため、
// サーバー側Route経由に変更しキーをブラウザに一切渡さないようにする。
export async function POST(req: NextRequest) {
  let body: { question?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const question = body.question?.trim();
  if (!question) return NextResponse.json({ error: "質問を入力してください" }, { status: 400 });
  if (question.length > MAX_INPUT_LEN) {
    return NextResponse.json({ error: `質問は${MAX_INPUT_LEN}文字以内で入力してください。` }, { status: 400 });
  }

  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(question) }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2000 },
      }),
    });
    if (!res.ok) throw new Error("APIリクエストに失敗しました");
    const data = await res.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!answer) throw new Error("AIから有効な回答が得られませんでした");

    if (answer.includes("関係のない質問には回答できません")) {
      return NextResponse.json({ ignored: true });
    }

    const categoryMatch = answer.match(/^CATEGORY:\s*(.+?)\s*$/m);
    const category = categoryMatch?.[1]?.trim() || null;
    const answerBody = categoryMatch
      ? answer.slice(categoryMatch.index! + categoryMatch[0].length).replace(/^\s*\n/, "")
      : answer;

    const fullAnswer =
      answerBody +
      "\n\n━━━━━━━━━━━━━━━━━━━━━━━━\n" +
      "免責事項 : 本回答はAIによる一般的な法令情報です。\n" +
      "個別の法的判断が必要な場合は、必ず弁護士等の専門家にご相談ください。";

    return NextResponse.json({ answer: fullAnswer, category });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
