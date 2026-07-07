import type { Metadata } from "next";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "お問い合わせ",
  description:
    "このページはlegal&lifeのお問い合わせページです。当ページではサイト利用者から当サイトに対するご質問やご意見をお送りください。サイト改善のための貴重なご指摘をお待ちしています。当サイトは法令知識の普及と法知識不足による不利益を生まないことを目指しているサイトです。",
};

export default function ContactPage() {
  return (
    <div className="max-w-[760px] mx-auto px-5 pt-10 pb-20">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-[#333] mb-3">お問い合わせ</h1>
        <p className="max-w-[560px] mx-auto text-sm text-[#555] leading-relaxed">
          ご質問・ご意見・バグ報告など、お気軽にお送りください。
          <br />
          メールアドレスをご入力いただいた場合、担当者より後日ご返信いたします。
        </p>
      </div>
      <ContactForm />
    </div>
  );
}
