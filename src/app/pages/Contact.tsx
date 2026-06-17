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

const TOPICS = ["商品について", "お取引について", "採用について", "その他"];

export function Contact() {
  const [type, setType] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    // モック送信：実際のNext.js実装ではAPI Route / Supabaseへ送信
    toast.success("お問い合わせを受け付けました。担当者よりご連絡いたします。");
    (e.target as HTMLFormElement).reset();
    setType("");
  };

  return (
    <Section heat={HEAT.contactForm}>
      <div className="mx-auto max-w-2xl">
        <SectionTitle en="CONTACT" jp="お問い合わせ" align="center" />
        <p className="mx-auto mt-6 max-w-xl text-center text-muted-foreground" style={{ fontSize: 15, lineHeight: 1.9 }}>
          商品についてのご相談、お取引に関するご質問など、お気軽にお問い合わせください。
        </p>

        <form onSubmit={onSubmit} className="mt-12 space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="name">お名前 <span className="text-brand">*</span></Label>
            <Input id="name" required placeholder="山田 太郎" />
          </div>
          <div className="grid gap-2 tab:grid-cols-2 tab:gap-4">
            <div className="grid gap-2">
              <Label htmlFor="company">会社名</Label>
              <Input id="company" placeholder="株式会社〇〇" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">メールアドレス <span className="text-brand">*</span></Label>
              <Input id="email" type="email" required placeholder="example@iceline.co.jp" />
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
            <Textarea id="message" required rows={6} placeholder="お問い合わせ内容をご記入ください" />
          </div>
          <Button type="submit" className="w-full bg-brand text-brand-foreground hover:bg-brand-dark" style={{ height: 52 }}>
            この内容で送信する
          </Button>
          <p className="text-center text-muted-foreground" style={{ fontSize: 12 }}>
            ※ これはプロトタイプです。送信内容は保存されません。
          </p>
        </form>
      </div>
    </Section>
  );
}
