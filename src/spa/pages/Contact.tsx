import { useState, FormEvent } from "react";
import { toast } from "sonner";
import { Section, SectionTitle } from "../components/common/Section";
import { HEAT } from "../data/heatMap";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { ed, txt, EDIT_MODE } from "../lib/editable";
import { RichBody } from "../components/common/RichBody";

const TOPICS = [
  "氷・雪氷・かき氷",
  "業務用資材",
  "ドライアイス",
  "倉庫利用について",
  "その他",
];

// 電話問い合わせ（H3＋本文）の枠数
const TEL_SLOTS = 5;

export function Contact() {
  const [type, setType] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          company: fd.get("company"),
          email: fd.get("email"),
          type,
          message: fd.get("message"),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success("お問い合わせを送信しました。担当者よりご連絡いたします。");
        form.reset();
        setType("");
      } else {
        toast.error(data.error || "送信に失敗しました。時間をおいて再度お試しください。");
      }
    } catch {
      toast.error("送信に失敗しました。通信環境をご確認のうえ再度お試しください。");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
    <Section heat={HEAT.contactForm}>
      <div className="mx-auto max-w-2xl">
        <SectionTitle en="CONTACT" jp="お問い合わせ" align="center" path="sectionEn:contact.main" />
        <p className="mx-auto mt-6 max-w-xl text-center text-muted-foreground" style={{ fontSize: 15, lineHeight: 1.9, whiteSpace: "pre-line" }} {...ed("contact:intro", "導入文", { multiline: true })}>
          {txt("contact:intro", "商品についてのご相談、お取引に関するご質問など、お気軽にお問い合わせください。")}
        </p>

        <form onSubmit={onSubmit} className="mt-12 space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="name">お名前 <span className="text-brand">*</span></Label>
            <Input id="name" name="name" required placeholder="山田 太郎" />
          </div>
          <div className="grid gap-2 tab:grid-cols-2 tab:gap-4">
            <div className="grid gap-2">
              <Label htmlFor="company">会社名</Label>
              <Input id="company" name="company" placeholder="株式会社〇〇" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">メールアドレス <span className="text-brand">*</span></Label>
              <Input id="email" name="email" type="email" required placeholder="example@iceline.co.jp" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>お問い合わせ種別 <span className="text-brand">*</span></Label>
            <Select value={type} onValueChange={setType} required>
              <SelectTrigger>
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                {TOPICS.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="message">お問い合わせ内容 <span className="text-brand">*</span></Label>
            <Textarea id="message" name="message" required rows={6} placeholder="お問い合わせ内容をご記入ください" />
          </div>
          <Button type="submit" disabled={submitting} className="w-full bg-brand text-brand-foreground hover:bg-brand-dark" style={{ height: 52 }} {...ed("contact:submit", "送信ボタン")}>
            {submitting ? "送信中…" : txt("contact:submit", "この内容で送信する")}
          </Button>
          <p className="text-center text-muted-foreground" style={{ fontSize: 12 }} {...ed("contact:note", "注意書き")}>
            {txt("contact:note", "※ ご記入いただいた内容は、お問い合わせ対応の目的にのみ利用します。詳しくはプライバシーポリシーをご覧ください。")}
          </p>
        </form>
      </div>
    </Section>

    {/* お電話でのお問い合わせ（H3＋本文×5。本文が入力された項目だけ公開） */}
    {(Array.from({ length: TEL_SLOTS }, (_, i) => txt(`contact:tel.${i}.body`, "")).some((v) => v !== "") ||
      EDIT_MODE) && (
      <Section heat={HEAT.contactForm}>
        <div className="mx-auto max-w-4xl">
          <SectionTitle en="TEL" jp="お電話でのお問い合わせ" align="center" path="sectionEn:contact.tel" />
          <div className="mt-10 grid gap-5 tab:grid-cols-2">
            {Array.from({ length: TEL_SLOTS }, (_, i) => {
              const body = txt(`contact:tel.${i}.body`, "");
              if (body === "" && !EDIT_MODE) return null;
              return (
                <div key={i} className="rounded-2xl border border-border bg-card p-7">
                  <h3 className="text-brand" style={{ fontSize: 18, fontWeight: 700 }} {...ed(`contact:tel.${i}.title`, `電話問い合わせ${i + 1} 見出し`)}>
                    {txt(`contact:tel.${i}.title`, "（見出し）")}
                  </h3>
                  <RichBody
                    path={`contact:tel.${i}.body`}
                    text={body || "（未入力：電話番号・受付時間などを入力してください）"}
                    label={`電話問い合わせ${i + 1} 内容`}
                    className={`mt-3 ${body ? "text-foreground/80" : "text-muted-foreground"}`}
                    style={{ fontSize: 15, lineHeight: 2 }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </Section>
    )}

    {/* プライバシーポリシー（簡素な1段落。未入力の間は非表示） */}
    {(txt("contact:privacy.body", "") !== "" || EDIT_MODE) && (
      <Section heat={HEAT.contactForm}>
        <div className="mx-auto max-w-2xl">
          <SectionTitle en="PRIVACY POLICY" jp="プライバシーポリシー" align="center" path="sectionEn:contact.privacy" />
          <RichBody
            path="contact:privacy.body"
            text={txt("contact:privacy.body", "") || "（未入力：プライバシーポリシーに関する案内文を入力してください）"}
            label="プライバシーポリシー 本文"
            className={`mt-8 ${txt("contact:privacy.body", "") ? "text-foreground/80" : "text-muted-foreground"}`}
            style={{ fontSize: 14, lineHeight: 2 }}
          />
        </div>
      </Section>
    )}
    </>
  );
}
