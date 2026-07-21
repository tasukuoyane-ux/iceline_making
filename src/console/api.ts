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

/**
 * 画像・動画をアップロードして公開URLを返す。
 * Vercel Blob の「クライアント直接アップロード」を使い、ファイル本体はブラウザから
 * Blob へ直接送る。これにより関数のリクエストボディ上限（約4.5MB）に縛られず、
 * 大きな動画もアップロードできる（認証は clientPayload のトークンで行う）。
 */
export async function uploadImage(file: File): Promise<{ url: string }> {
  const token = getToken();
  // 失効トークンで送ると @vercel/blob 側の汎用エラーになり原因が分からなくなるため、手前で弾く
  if (isTokenExpired(token)) throw new Error(EXPIRED_MSG);
  const { upload } = await import("@vercel/blob/client");
  const clean = (file.name || "file").replace(/[^a-zA-Z0-9._-]/g, "_");
  try {
    const blob = await upload(`uploads/${clean}`, file, {
      access: "public",
      handleUploadUrl: "/api/upload",
      contentType: file.type || undefined,
      clientPayload: token, // サーバの onBeforeGenerateToken で検証
      multipart: file.size > 20 * 1024 * 1024, // 大きいファイルは分割アップロード
    });
    return { url: blob.url };
  } catch (err: any) {
    // @vercel/blob/client は /api/upload が返したエラー本文を捨て、
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
