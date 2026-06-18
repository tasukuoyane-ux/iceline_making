// POST /api/login  { username, password } -> { token, user }
import { verifyCredentials, issueToken, getUsers } from "./_lib/auth.js";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }
  try {
    if (!process.env.JWT_SECRET) {
      res.status(500).json({ error: "サーバー設定エラー（JWT_SECRET 未設定）" });
      return;
    }
    if (getUsers().length === 0) {
      res.status(500).json({ error: "サーバー設定エラー（社員アカウント未登録）" });
      return;
    }
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const { username, password } = body;
    if (!username || !password) {
      res.status(400).json({ error: "社員IDとパスワードを入力してください" });
      return;
    }
    const user = await verifyCredentials(String(username), String(password));
    if (!user) {
      res.status(401).json({ error: "社員IDまたはパスワードが正しくありません" });
      return;
    }
    const token = await issueToken(user);
    res.status(200).json({ token, user: { username: user.username, name: user.name } });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "ログイン処理でエラーが発生しました" });
  }
}
