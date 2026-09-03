// POST /api/upload-video —— コンソールからの動画アップロード（Vercel Blob のクライアント直接アップロード）。
//
// 動画は容量が大きく、Vercel の関数の本文上限（約4.5MB）を通せないため、ファイル本体は
// ブラウザから Blob へ直接送る（@vercel/blob/client の upload）。この関数は
//  1) 認証済みクライアントへ短命トークンを発行（onBeforeGenerateToken）
//  2) アップロード完了通知の受け取り（onUploadCompleted）
// だけを担当する。2026-09-03 に Vercel Pro 化に伴い復活（Hobby 時代は Blob の上限超過で
// ストアがブロックされたため一度廃止し、動画は public/videos/ に手動配置していた）。
// 画像は従来どおり /api/upload → public/uploads/（GitHub コミット）。
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { verifyToken } from "../_lib/auth";

/** Blob の read-write トークン（Vercel はストア名により `<名前>_READ_WRITE_TOKEN` で注入することがある） */
function blobToken(): string | undefined {
  const direct = process.env.BLOB_READ_WRITE_TOKEN;
  if (direct?.startsWith("vercel_blob_rw_")) return direct;
  for (const [key, value] of Object.entries(process.env)) {
    if (/READ_WRITE_TOKEN$/.test(key) && value?.startsWith("vercel_blob_rw_")) return value;
  }
  return undefined;
}

export async function POST(req: Request): Promise<Response> {
  const token = blobToken();
  if (!token) {
    return Response.json({ error: "サーバー設定エラー（Vercel Blob のトークンが未設定）" }, { status: 500 });
  }
  try {
    const body = (await req.json()) as HandleUploadBody;
    const jsonResponse = await handleUpload({
      body,
      request: req,
      token,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        // clientPayload にコンソールのログイントークン（JWT）を載せて認証する
        const auth = await verifyToken(clientPayload);
        if (!auth) throw new Error("認証が必要です。再度ログインしてください。");
        return {
          allowedContentTypes: ["video/*"],
          addRandomSuffix: true, // 同名でも上書きせず別URLにする（キャッシュ事故防止）
          maximumSizeInBytes: 512 * 1024 * 1024, // 512MB まで
          tokenPayload: JSON.stringify({ username: auth.username }),
        };
      },
      // 完了通知（Blob 側から署名付きで呼ばれる）。特に処理は不要。
      onUploadCompleted: async () => {
        /* no-op */
      },
    });
    return Response.json(jsonResponse);
  } catch (err: any) {
    return Response.json({ error: err?.message || "アップロードに失敗しました" }, { status: 400 });
  }
}
