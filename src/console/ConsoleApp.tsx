// /console ルート：認証状態に応じてログイン or エディタを表示。
import { useState } from "react";
import { AuthUser, clearAuth, getToken, getUser, isTokenExpired } from "./api";
import { Login } from "./Login";
import { Editor } from "./Editor";

export function ConsoleApp() {
  // 失効したトークンが localStorage に残っていると「ログイン中に見えるのに
  // アップロード・公開だけが失敗する」状態になる。起動時に破棄してログイン画面へ戻す。
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (!getToken()) return null;
    if (isTokenExpired()) {
      clearAuth();
      return null;
    }
    return getUser();
  });

  if (!user) {
    return <Login onSuccess={setUser} />;
  }
  return <Editor user={user} onLogout={() => setUser(null)} />;
}
