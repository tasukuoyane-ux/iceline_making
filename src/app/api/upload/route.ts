// POST /api/upload —— コンソールからの画像アップロード（2026-09 改修）。
//
// 以前は Vercel Blob へ保存していたが、Blob の利用上限超過でストアがブロックされると
// サイト全体の画像が消える事故が起きたため、画像はリポジトリの public/uploads/ へ
// GitHub 経由でコミットする方式に変更した（同名ファイルは上書き）。
//  - 本文はファイルのバイナリそのもの（Content-Type = 画像の MIME、x-file-name = ファイル名）
//  - Vercel の関数はリクエスト本文が約4.5MBまでのため、1枚あたり 4MB を上限にする
//  - コミットメッセージに [vercel skip] を付け、アップロードのたびにデプロイが走らないようにする
//    （vercel.json の ignoreCommand 参照）。「更新（本番へ公開）」のデプロイで画像も一緒に公開される
//  - 動画はサイズ的にこの経路では扱えないため受け付けない（public/videos/ へ手動配置）
import { verifyRequest } from "../_lib/auth";
import { commitFiles } from "../_lib/github";

// （Route ファイルは POST 等以外を export できないため、定数・ヘルパーはモジュール内に留める）
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

/** 保存用のファイル名に整える（日本語は残し、URL・パスとして危険な文字だけ置換） */
function sanitizeFileName(raw: string): string {
  const name = (raw || "file").normalize("NFC").replace(/[\u0000-\u001f\u007f]/g, "");
  const dot = name.lastIndexOf(".");
  let base = dot > 0 ? name.slice(0, dot) : name;
  let ext = dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
  base = base.replace(/[\\/:*?"<>|#%&+\s]+/g, "_").replace(/^\.+/, "").slice(0, 80) || "file";
  ext = ext.replace(/[^a-z0-9]/g, "").slice(0, 8);
  return ext ? `${base}.${ext}` : base;
}

export async function POST(req: Request): Promise<Response> {
  const auth = await verifyRequest(req);
  if (!auth) {
    return Response.json({ error: "認証が必要です。再度ログインしてください。" }, { status: 401 });
  }
  try {
    const type = (req.headers.get("content-type") || "").split(";")[0].trim();
    if (!/^image\//.test(type)) {
      return Response.json(
        {
          error:
            "アップロードできるのは画像のみです。動画ファイルは public/videos/ に配置し（エンジニアに依頼）、URL欄に /videos/ファイル名.mp4 を入力してください。",
        },
        { status: 400 }
      );
    }
    const rawName = decodeURIComponent(req.headers.get("x-file-name") || "");
    const name = sanitizeFileName(rawName);
    if (!/\.(jpe?g|png|gif|webp|avif|svg)$/i.test(name)) {
      return Response.json({ error: "対応している画像形式は JPG / PNG / GIF / WebP / AVIF / SVG です。" }, { status: 400 });
    }
    const buf = Buffer.from(await req.arrayBuffer());
    if (buf.length === 0) return Response.json({ error: "ファイルが空です" }, { status: 400 });
    if (buf.length > MAX_UPLOAD_BYTES) {
      return Response.json(
        { error: `画像は1枚 4MB までです（${(buf.length / 1024 / 1024).toFixed(1)}MB）。縮小してからアップロードしてください。` },
        { status: 413 }
      );
    }

    const path = `public/uploads/${name}`;
    const { sha } = await commitFiles(
      [{ path, content: buf.toString("base64"), encoding: "base64" }],
      `画像アップロード: ${name}（${auth.name}） [vercel skip]\n\nvia 管理コンソール (${auth.username})`
    );
    // ?v=<コミット> を付けて、同名で上書きしたときにブラウザ・CDN のキャッシュが残らないようにする
    return Response.json({ url: `/uploads/${encodeURIComponent(name)}?v=${sha.slice(0, 7)}`, path });
  } catch (err: any) {
    return Response.json({ error: err?.message || "アップロードに失敗しました" }, { status: 500 });
  }
}
