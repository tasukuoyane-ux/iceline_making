// 認証共通処理（JWT発行・検証、社員アカウントの照合）。
// api/ 配下で _ 始まりのフォルダはVercelのエンドポイントにならず、import専用。
//
// 重要: jose / bcryptjs は「動的import」で読み込む。
// 静的importにすると Vercel(esbuild) が関数バンドルに同梱し、bcryptjs内部の
// require('crypto') が ESM環境で「Dynamic require is not supported」となって
// 関数ロード時にクラッシュ（FUNCTION_INVOCATION_FAILED）する。
// 動的importなら外部化＋ファイルトレースで同梱され、実行時に正しく解決される。

export interface ConsoleUser {
  username: string;
  name: string;
  passwordHash: string;
}

export interface TokenPayload {
  username: string;
  name: string;
}

function secretKey(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET が未設定です");
  return new TextEncoder().encode(s);
}

/**
 * 社員アカウント一覧を環境変数 CONSOLE_USERS から取得。
 * 形式: JSON配列 [{ "username": "...", "name": "...", "passwordHash": "<bcryptハッシュ>" }]
 */
export function getUsers(): ConsoleUser[] {
  const raw = process.env.CONSOLE_USERS;
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export async function verifyCredentials(username: string, password: string): Promise<TokenPayload | null> {
  const user = getUsers().find((u) => u.username === username);
  if (!user) return null;
  const bcrypt = (await import("bcryptjs")).default;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  return { username: user.username, name: user.name };
}

export async function issueToken(payload: TokenPayload): Promise<string> {
  const { SignJWT } = await import("jose");
  return await new SignJWT({ name: payload.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.username)
    .setExpirationTime("12h")
    .sign(secretKey());
}

/** Authorization: Bearer <token> を検証。失敗時は null。 */
export async function verifyRequest(req: { headers: Record<string, any> }): Promise<TokenPayload | null> {
  const header = req.headers["authorization"] || req.headers["Authorization"];
  if (!header || typeof header !== "string") return null;
  const m = header.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  try {
    const { jwtVerify } = await import("jose");
    const { payload } = await jwtVerify(m[1], secretKey());
    return { username: String(payload.sub), name: String((payload as any).name ?? "") };
  } catch {
    return null;
  }
}
