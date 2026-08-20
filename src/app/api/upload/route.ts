// POST /api/upload  —— Vercel Blob の「クライアント直接アップロード」用トークン発行 & 完了通知。
//
// ファイル本体はブラウザから Blob へ直接アップロードし、この関数は
//  1) 認証済みクライアントへ短命トークンを発行（onBeforeGenerateToken）
//  2) アップロード完了通知の受け取り（onUploadCompleted）
// のみを担当するため、関数のボディ上限（約4.5MB）に一切影響されない。
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { verifyToken } from "../_lib/auth";

export async function POST(req: Request): Promise<Response> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json({ error: "サーバー設定エラー（Vercel Blob 未設定）" }, { status: 500 });
  }
  try {
    const body = (await req.json()) as HandleUploadBody;
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        // clientPayload にコンソールのログイントークンを載せて認証する
        const auth = await verifyToken(clientPayload);
        if (!auth) throw new Error("認証が必要です。再度ログインしてください。");
        return {
          allowedContentTypes: ["image/*", "video/*"],
          addRandomSuffix: true,
          maximumSizeInBytes: 512 * 1024 * 1024, // 512MB まで許可
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
