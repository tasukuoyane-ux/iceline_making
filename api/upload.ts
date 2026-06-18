// POST /api/upload?filename=foo.jpg  (本文 = 画像バイナリ) -> { url }
// Vercel Blob に保存して公開URLを返す。
import { put } from "@vercel/blob";
import { verifyRequest } from "./_lib/auth.js";

// バイナリ本文を取得（@vercel/node が Buffer 化していなければストリームから読む）
async function readBody(req: any): Promise<Buffer> {
  if (req.body && Buffer.isBuffer(req.body)) return req.body;
  if (req.body && typeof req.body === "string") return Buffer.from(req.body, "binary");
  return await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function safeName(name: string): string {
  const cleaned = (name || "image").replace(/[^a-zA-Z0-9._-]/g, "_");
  return `uploads/${cleaned}`;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }
  const auth = await verifyRequest(req);
  if (!auth) {
    res.status(401).json({ error: "認証が必要です。再度ログインしてください。" });
    return;
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    res.status(500).json({ error: "サーバー設定エラー（Vercel Blob 未設定）" });
    return;
  }
  try {
    const filename = (req.query?.filename as string) || "image";
    const contentType = (req.headers["content-type"] as string) || "application/octet-stream";
    const data = await readBody(req);
    if (!data || data.length === 0) {
      res.status(400).json({ error: "ファイルが空です" });
      return;
    }
    const blob = await put(safeName(filename), data, {
      access: "public",
      contentType,
      addRandomSuffix: true,
    });
    res.status(200).json({ url: blob.url });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "アップロードに失敗しました" });
  }
}

// 画像バイナリをそのまま受け取るため、本文の自動JSONパースを無効化
export const config = {
  api: { bodyParser: false },
};
