// POST /api/contact  { name, company, email, type, message }
// お問い合わせ内容を、設定された送信先メールアドレスへ Resend 経由で送信する。
// 送信先は /console で設定（src/content/contact.json）。空欄なら環境変数 CONTACT_RECIPIENT を使用。
import contactSettings from "../src/content/contact.json";

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const company = String(body.company || "").trim();
    const type = String(body.type || "").trim();
    const message = String(body.message || "").trim();

    if (!name || !email || !message) {
      res.status(400).json({ error: "お名前・メールアドレス・お問い合わせ内容は必須です。" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: "メールアドレスの形式が正しくありません。" });
      return;
    }

    const recipient = (contactSettings?.recipient || process.env.CONTACT_RECIPIENT || "").trim();
    if (!recipient) {
      res.status(500).json({ error: "送信先メールアドレスが未設定です。管理コンソールの「お問い合わせ設定」から設定してください。" });
      return;
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "メール送信の設定が未完了です（RESEND_API_KEY 未設定）。" });
      return;
    }
    const from = process.env.CONTACT_FROM || "お問い合わせ <onboarding@resend.dev>";

    const lines = [
      `お名前：${name}`,
      `会社名：${company || "（未記入）"}`,
      `メールアドレス：${email}`,
      `お問い合わせ種別：${type || "（未選択）"}`,
      "",
      "お問い合わせ内容：",
      message,
    ];
    const text = lines.join("\n");
    const html =
      `<div style="font-family:sans-serif;font-size:14px;line-height:1.8">` +
      lines.map((l) => (l === "" ? "<br>" : `<div>${escapeHtml(l)}</div>`)).join("") +
      `</div>`;

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [recipient],
        reply_to: email,
        subject: `【お問い合わせ】${type || "ご連絡"}（${name} 様）`,
        text,
        html,
      }),
    });

    if (!resp.ok) {
      const detail = await resp.text();
      res.status(502).json({ error: "メール送信に失敗しました。時間をおいて再度お試しください。", detail });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "送信処理でエラーが発生しました。" });
  }
}
