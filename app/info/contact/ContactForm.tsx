"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collectDeviceInfo } from "@/lib/deviceInfo";

const AGE_OPTIONS = ["10代", "20代", "30代", "40代", "50代", "60代", "70代", "80代", "90代"];
const GENDER_OPTIONS = ["男性", "女性", "その他"];
const INQUIRY_TYPES = [
  { value: "コメント", label: "💬 コメント" },
  { value: "質問", label: "❓ 質問" },
  { value: "バグや不具合の報告", label: "🐛 バグや不具合の報告" },
  { value: "機能のリクエスト", label: "✨ 機能のリクエスト" },
  { value: "その他のお問い合わせ", label: "📝 その他のお問い合わせ" },
];
const CATEGORY_OPTIONS = [
  "サイト全般について",
  "法令学習コンテンツについて",
  "チャットコンテンツについて",
  "法令検索コンテンツについて",
  "ニュースコンテンツについて",
  "アカウント機能について",
  "法的文章について(プライバシーポリシー・利用規約・免責事項・クッキーポリシー)",
  "その他の分野・ページ",
];

const STORAGE_KEY = "contact_form_draft";
const CONSENT_KEY = "contact_form_consent";
const EXPIRE_DAYS = 30;

type Draft = {
  name: string;
  gender: string;
  age: string;
  email: string;
  type: string;
  content: string;
  category: string;
  timestamp: number;
};

export default function ContactForm() {
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [email, setEmail] = useState("");
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [storageConsent, setStorageConsent] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(true);

  // 下書きの読み込みと同意状態の反映(旧contact.jsのloadDraft/applyConsentUIに相当)
  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY) === "granted";
    setStorageConsent(consent);

    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const draft: Draft = JSON.parse(raw);
        if (Date.now() - draft.timestamp <= EXPIRE_DAYS * 24 * 60 * 60 * 1000) {
          setName(draft.name || "");
          setGender(draft.gender || "");
          setAge(draft.age || "");
          setEmail(draft.email || "");
          setType(draft.type || "");
          setCategory(draft.category || "");
          setContent(draft.content || "");
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        /* ignore */
      }
    }
    setLoadingDraft(false);
  }, []);

  // 入力変更のたびに下書き保存(同意時のみ、読み込み完了後のみ)
  useEffect(() => {
    if (loadingDraft || !storageConsent) return;
    if (!name && !email && !type) return;
    const draft: Draft = { name, gender, age, email, type, category, content, timestamp: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [name, gender, age, email, type, category, content, storageConsent, loadingDraft]);

  const toggleStorageConsent = (checked: boolean) => {
    setStorageConsent(checked);
    if (checked) {
      localStorage.setItem(CONSENT_KEY, "granted");
    } else {
      localStorage.removeItem(CONSENT_KEY);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const clearForm = () => {
    if (!confirm("入力内容をすべて消去しますか?")) return;
    setName("");
    setGender("");
    setAge("");
    setEmail("");
    setType("");
    setCategory("");
    setContent("");
    localStorage.removeItem(STORAGE_KEY);
  };

  const needsCategory = type === "質問" || type === "バグや不具合の報告" || type === "機能のリクエスト";

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "お名前を入力してください";
    if (!gender) e.gender = "性別を選択してください";
    if (!age) e.age = "年代を選択してください";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "正しいメールアドレスの形式で入力してください";
    if (!type) e.type = "お問い合わせの種類を選択してください";
    if (needsCategory && !category) e.category = "分野を選択してください";
    if (!content.trim()) e.content = "お問い合わせ内容を入力してください";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const deviceInfo = await collectDeviceInfo();
      const res = await fetch("/api/mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "contact",
          from_name: name,
          gender,
          age_group: age,
          reply_email: email || undefined,
          inquiry_type: type,
          category: needsCategory ? category : undefined,
          content,
          ...deviceInfo,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "送信に失敗しました");
      }
      localStorage.removeItem(STORAGE_KEY);
      setSuccess(true);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
        <p className="font-bold text-lg mb-3">送信が完了しました</p>
        <p className="text-sm text-gray-600 leading-relaxed">
          お問い合わせフォームでの入力が正常に送信されました。
          <br />
          メールアドレスを入力された方につきましては、後日担当者から返信がありますので、今しばらくお待ちください。
          <br />
          <br />
          また、今回お問い合わせしていただき誠にありがとうございます。
          <br />
          当サイトは利用者からのお問い合わせを基に、サイトの改善・更新をしております。
          <br />
          今後ともlegal&amp;lifeをよろしくお願いいたします。
        </p>
        <Link href="/" className="inline-block mt-5 text-primary-dark font-semibold text-sm">ホームへ戻る</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="font-bold text-sm">入力内容の一時保存</p>
          <p className="text-xs text-gray-500">利便性向上のため、入力内容をブラウザに30日間保存できます。</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={storageConsent}
            onChange={(e) => toggleStorageConsent(e.target.checked)}
          />
          <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-primary transition-colors" />
          <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
        </label>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <p className="text-xs font-bold text-gray-400">基本情報</p>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">
            お名前<span className="text-red-500 ml-1">＊必須</span>
          </label>
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="例: 山田 太郎"
            maxLength={50}
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">
            性別<span className="text-red-500 ml-1">＊必須</span>
          </label>
          <div className="flex gap-4 text-sm">
            {GENDER_OPTIONS.map((g) => (
              <label key={g} className="flex items-center gap-1">
                <input type="radio" name="gender" checked={gender === g} onChange={() => setGender(g)} /> {g}
              </label>
            ))}
          </div>
          {errors.gender && <p className="text-xs text-red-600 mt-1">{errors.gender}</p>}
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">
            年代<span className="text-red-500 ml-1">＊必須</span>
          </label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          >
            <option value="" disabled hidden>選択してください</option>
            {AGE_OPTIONS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          {errors.age && <p className="text-xs text-red-600 mt-1">{errors.age}</p>}
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">
            返信用メールアドレス<span className="text-gray-400 ml-1">(任意)</span>
          </label>
          <input
            type="email"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="example@email.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">
            お問い合わせの種類<span className="text-red-500 ml-1">＊必須</span>
          </label>
          <div className="flex flex-col gap-2 text-sm">
            {INQUIRY_TYPES.map((t) => (
              <label key={t.value} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="inquiry_type"
                  checked={type === t.value}
                  onChange={() => {
                    setType(t.value);
                    setCategory("");
                  }}
                />{" "}
                {t.label}
              </label>
            ))}
          </div>
          {errors.type && <p className="text-xs text-red-600 mt-1">{errors.type}</p>}
        </div>
      </div>

      {type && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <p className="text-xs font-bold text-gray-400">
            {type === "コメント" && "コメント内容"}
            {type === "質問" && "質問内容"}
            {type === "バグや不具合の報告" && "バグ・不具合の報告"}
            {type === "機能のリクエスト" && "新機能のリクエスト"}
            {type === "その他のお問い合わせ" && "その他のお問い合わせ"}
          </p>

          {needsCategory && (
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">
                {type === "質問" && "質問はどの分野が該当しますか?"}
                {type === "バグや不具合の報告" && "バグや不具合はどの分野が該当しますか?"}
                {type === "機能のリクエスト" && "新機能のリクエストはどの分野が該当しますか?"}
                <span className="text-red-500 ml-1">＊必須</span>
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="" disabled hidden>選択してください</option>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errors.category && <p className="text-xs text-red-600 mt-1">{errors.category}</p>}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">
              お問い合わせ内容<span className="text-red-500 ml-1">＊必須</span>
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[120px]"
              placeholder={
                type === "コメント"
                  ? "コメントをご自由にお書きください"
                  : type === "バグや不具合の報告"
                    ? "発生したバグや不具合の内容を詳しくお書きください(発生手順・使用ブラウザなども記載いただけると助かります)"
                    : "お問い合わせ内容をできるだけ詳しくお書きください"
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">※ 個人情報(住所・電話番号等)は記入しないでください</p>
            {errors.content && <p className="text-xs text-red-600 mt-1">{errors.content}</p>}
          </div>
        </div>
      )}

      {submitError && (
        <p className="text-sm text-red-600">
          ⚠️ 送信に失敗しました。{submitError}
        </p>
      )}

      <div className="text-center space-y-3">
        <button
          className="w-full bg-primary hover:bg-primary-dark text-white font-bold rounded-lg py-2.5 text-sm disabled:opacity-60"
          disabled={submitting}
          onClick={handleSubmit}
        >
          {submitting ? "送信中..." : "送信する"}
        </button>
        <button className="text-sm text-gray-500 underline" onClick={clearForm}>入力をクリア</button>
        <p className="text-xs text-gray-400">
          送信することで <Link href="/law/privacy" className="underline">プライバシーポリシー</Link> および{" "}
          <Link href="/law/terms" className="underline">利用規約</Link> に同意したものとみなされます。
        </p>
      </div>
    </div>
  );
}
