// POST /api/login  { username, password } -> { token, user }
import { verifyCredentials, issueToken, getUsers } from "../_lib/auth";

export async function POST(req: Request): Promise<Response> {
  try {
    if (!process.env.JWT_SECRET) {
      return Response.json({ error: "サーバー設定エラー（JWT_SECRET 未設定）" }, { status: 500 });
    }
    if (getUsers().length === 0) {
      return Response.json({ error: "サーバー設定エラー（社員アカウント未登録）" }, { status: 500 });
    }
    const body = await req.json().catch(() => ({}));
    const { username, password } = body || {};
    if (!username || !password) {
      return Response.json({ error: "社員IDとパスワードを入力してください" }, { status: 400 });
    }
    const user = await verifyCredentials(String(username), String(password));
    if (!user) {
      return Response.json({ error: "社員IDまたはパスワードが正しくありません" }, { status: 401 });
    }
    const token = await issueToken(user);
    return Response.json({ token, user: { username: user.username, name: user.name } });
  } catch (err: any) {
    return Response.json({ error: err?.message || "ログイン処理でエラーが発生しました" }, { status: 500 });
  }
}
