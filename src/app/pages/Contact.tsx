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
import { ed, txt } from "../lib/editable";

const TOPICS = ["商品について", "お取引について", "採用について", "その他"];

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
    <Section heat={HEAT.contactForm}>
      <div className="mx-auto max-w-2xl">
        <SectionTitle en="CONTACT" jp="お問い合わせ" align="center" />
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
  );
}
