// /console ログイン画面（社員アカウント）。
import { useState } from "react";
import { AuthUser, login, setAuth } from "./api";
import { Field, TextInput, Button } from "./ui";

export function Login({ onSuccess }: { onSuccess: (user: AuthUser) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token, user } = await login(username.trim(), password);
      setAuth(token, user);
      onSuccess(user);
    } catch (err: any) {
      setError(err.message || "ログインに失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-[18px] font-bold text-slate-800">アイスライン 管理コンソール</h1>
        <p className="mt-1 text-[13px] text-slate-500">社員専用のログインページです。</p>
        <div className="mt-6 space-y-4">
          <Field label="社員ID">
            <TextInput value={username} onChange={(e) => setUsername(e.target.value)} autoFocus autoComplete="username" />
          </Field>
          <Field label="パスワード">
            <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </Field>
        </div>
        {error && <p className="mt-3 text-[13px] text-red-600">{error}</p>}
        <Button variant="primary" type="submit" disabled={loading} className="mt-6 w-full py-2.5">
          {loading ? "ログイン中…" : "ログイン"}
        </Button>
      </form>
    </div>
  );
}
