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

/** 画像をアップロードして公開URLを返す */
export async function uploadImage(file: File): Promise<{ url: string }> {
  const token = getToken();
  const res = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });
  return parse(res);
}

/** 変更ファイル群をコミットして本番デプロイをトリガーする */
export async function publish(
  files: Record<string, unknown>,
  message: string
): Promise<{ ok: boolean; commit?: string; deploy?: string }> {
  const token = getToken();
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
