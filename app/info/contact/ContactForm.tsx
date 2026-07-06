"use client";

import { useState } from "react";
import { collectDeviceInfo } from "@/lib/deviceInfo";

const INQUIRY_TYPES = [
  { value: "コメント", label: "コメント" },
  { value: "質問", label: "質問" },
  { value: "バグや不具合の報告", label: "バグや不具合の報告" },
  { value: "機能のリクエスト", label: "機能のリクエスト" },
  { value: "その他のお問い合わせ", label: "その他のお問い合わせ" },
];

export default function ContactForm() {
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [email, setEmail] = useState("");
  const [type, setType] = useState("");
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "お名前を入力してください";
    if (!gender) e.gender = "性別を選択してください";
    if (!age) e.age = "年代を選択してください";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "正しいメールアドレスの形式で入力してください";
    if (!type) e.type = "お問い合わせの種類を選択してください";
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
          content,
          ...deviceInfo,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "送信に失敗しました");
      }
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
        <p className="font-bold text-lg mb-2">送信しました</p>
        <p className="text-sm text-gray-500">お問い合わせいただきありがとうございます。担当者より順次ご返信いたします。</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <div>
        <label className="block text-xs font-bold text-gray-600 mb-1">お名前</label>
        <input
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-600 mb-1">性別</label>
        <div className="flex gap-4 text-sm">
          {["男性", "女性", "回答しない"].map((g) => (
            <label key={g} className="flex items-center gap-1">
              <input type="radio" name="gender" checked={gender === g} onChange={() => setGender(g)} /> {g}
            </label>
          ))}
        </div>
        {errors.gender && <p className="text-xs text-red-600 mt-1">{errors.gender}</p>}
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-600 mb-1">年代</label>
        <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={age} onChange={(e) => setAge(e.target.value)}>
          <option value="">選択してください</option>
          {["10代", "20代", "30代", "40代", "50代", "60代以上"].map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        {errors.age && <p className="text-xs text-red-600 mt-1">{errors.age}</p>}
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-600 mb-1">メールアドレス(任意・返信を希望する場合)</label>
        <input
          type="email"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-600 mb-1">お問い合わせの種類</label>
        <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">選択してください</option>
          {INQUIRY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        {errors.type && <p className="text-xs text-red-600 mt-1">{errors.type}</p>}
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-600 mb-1">お問い合わせ内容</label>
        <textarea
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[120px]"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        {errors.content && <p className="text-xs text-red-600 mt-1">{errors.content}</p>}
      </div>

      {submitError && <p className="text-sm text-red-600">{submitError}</p>}

      <button
        className="w-full bg-primary hover:bg-primary-dark text-white font-bold rounded-lg py-2.5 text-sm disabled:opacity-60"
        disabled={submitting}
        onClick={handleSubmit}
      >
        {submitting ? "送信中..." : "送信する"}
      </button>
    </div>
  );
}
