// /console から呼び出すバックエンドAPIクライアント。

const TOKEN_KEY = "iceline-console-token";
const USER_KEY = "iceline-console-user";

export interface AuthUser {
  username: string;
  name: string;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setAuth(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * 保存済みトークン（JWT）の有効期限を確認する。
 * ログイン用トークンは12時間で失効するが、localStorage には残り続けるため、
 * 「ログイン中に見えるのに全ての操作が失敗する」状態になりうる。
 * 失効を手前で検知して、利用者に分かるメッセージを出すために使う。
 */
export function isTokenExpired(token: string | null = getToken()): boolean {
  if (!token) return true;
  try {
    const part = token.split(".")[1];
    if (!part) return true;
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    const exp = JSON.parse(json)?.exp;
    if (typeof exp !== "number") return false; // exp が無ければ判定しない
    return Date.now() >= exp * 1000;
  } catch {
    return true; // 壊れたトークンは失効扱い
  }
}

const EXPIRED_MSG = "ログインの有効期限が切れました。一度ログアウトして、再度ログインしてください。";

async function parse(res: Response) {
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { error: text };
  }
  if (!res.ok) {
    throw new Error(data?.error || `通信エラー (${res.status})`);
  }
  return data;
}

export async function login(username: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return parse(res);
}

/** 画像1枚の上限（Vercel の関数のリクエスト本文上限 約4.5MB に合わせる。サーバ側と同値） */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

// アップロード直後の画像はデプロイ完了まで本番URL（/uploads/…）が 404 のため、
// このセッションの間はブラウザ内の object URL でプレビューする（本番URL → object URL）
const previews = new Map<string, string>();

/** プレビュー用URL（未デプロイのアップロード画像なら object URL、それ以外はそのまま） */
export function previewUrl(v: string): string {
  return previews.get(v) ?? v;
}

/** オブジェクト・配列の中の文字列を previewUrl で置き換えたコピーを返す（採用データ等のプレビュー用） */
export function mapPreviewDeep<T>(v: T): T {
  if (typeof v === "string") return previewUrl(v) as unknown as T;
  if (Array.isArray(v)) return v.map(mapPreviewDeep) as unknown as T;
  if (v && typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) out[k] = mapPreviewDeep(x);
    return out as T;
  }
  return v;
}

/**
 * 画像をアップロードして公開URL（/uploads/ファイル名?v=…）を返す。
 * 2026-09 改修：保存先を Vercel Blob からリポジトリの public/uploads/ に変更
 * （/api/upload が GitHub へコミットする。同名ファイルは上書き）。
 * 本番URLは「更新（本番へ公開）」→ デプロイ完了後に有効になる。
 * 動画はこの経路では扱えない（public/videos/ へ手動配置し、URL欄にパスを入力）。
 */
export async function uploadImage(file: File): Promise<{ url: string }> {
  const token = getToken();
  if (isTokenExpired(token)) throw new Error(EXPIRED_MSG);
  if (!file.type.startsWith("image/")) {
    throw new Error("アップロードできるのは画像のみです。動画は public/videos/ に配置してURL欄にパスを入力してください。");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`画像は1枚 4MB までです（${(file.size / 1024 / 1024).toFixed(1)}MB）。縮小してからアップロードしてください。`);
  }
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": file.type,
      "x-file-name": encodeURIComponent(file.name || "image"),
    },
    body: file,
  });
  const data = (await parse(res)) as { url: string };
  try {
    previews.set(data.url, URL.createObjectURL(file));
  } catch {
    /* プレビューは補助機能。失敗しても本番URLは返す */
  }
  return data;
}

/**
 * 動画をアップロードして公開URL（Vercel Blob）を返す（2026-09-03 復活・Pro 化に伴う）。
 * ファイル本体はブラウザから Blob へ直接送るため、関数の本文上限（約4.5MB）に縛られず
 * 大きな動画もアップロードできる。認証は clientPayload に載せたログイントークンで行う
 * （/api/upload-video）。URL は即時有効（デプロイ不要）。
 */
export async function uploadVideo(file: File, onProgress?: (percent: number) => void): Promise<{ url: string }> {
  const token = getToken();
  // 失効トークンで送ると @vercel/blob 側の汎用エラーになり原因が分からなくなるため、手前で弾く
  if (isTokenExpired(token)) throw new Error(EXPIRED_MSG);
  if (!file.type.startsWith("video/")) {
    throw new Error("アップロードできるのは動画ファイル（mp4 / webm / mov 等）のみです。画像は「画像をアップロード」から。");
  }
  const { upload } = await import("@vercel/blob/client");
  const clean = (file.name || "video").replace(/[^a-zA-Z0-9._-]/g, "_");
  try {
    const blob = await upload(`videos/${clean}`, file, {
      access: "public",
      handleUploadUrl: "/api/upload-video",
      contentType: file.type || undefined,
      clientPayload: token, // サーバの onBeforeGenerateToken で検証
      multipart: file.size > 20 * 1024 * 1024, // 大きいファイルは分割アップロード
      onUploadProgress: onProgress ? ({ percentage }) => onProgress(Math.round(percentage)) : undefined,
    });
    return { url: blob.url };
  } catch (err: any) {
    // @vercel/blob/client は /api/upload-video が返したエラー本文を捨て、
    // "Failed to retrieve the client token" という汎用文言だけを投げる。
    // 実際の原因はほぼ認証切れなので、利用者に伝わる文言へ置き換える。
    const msg = String(err?.message || "");
    if (/client token/i.test(msg)) {
      throw new Error(`${EXPIRED_MSG}（アップロードの認証を取得できませんでした）`);
    }
    throw err;
  }
}

/** 変更ファイル群をコミットして本番デプロイをトリガーする */
export async function publish(
  files: Record<string, unknown>,
  message: string
): Promise<{ ok: boolean; commit?: string; deploy?: string }> {
  const token = getToken();
  if (isTokenExpired(token)) throw new Error(EXPIRED_MSG);
  const res = await fetch("/api/publish", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ files, message }),
  });
  return parse(res);
}
