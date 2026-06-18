// 認証共通処理（JWT発行・検証、社員アカウントの照合）。
// api/ 配下で _ 始まりのフォルダはVercelのエンドポイントにならず、import専用。
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export interface ConsoleUser {
  username: string;
  name: string;
  passwordHash: string;
}

export interface TokenPayload {
  username: string;
  name: string;
}

function getSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET が未設定です");
  return s;
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
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  return { username: user.username, name: user.name };
}

export function issueToken(payload: TokenPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: "12h" });
}

/** Authorization: Bearer <token> を検証。失敗時は null。 */
export function verifyRequest(req: { headers: Record<string, any> }): TokenPayload | null {
  const header = req.headers["authorization"] || req.headers["Authorization"];
  if (!header || typeof header !== "string") return null;
  const m = header.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  try {
    return jwt.verify(m[1], getSecret()) as TokenPayload;
  } catch {
    return null;
  }
}
