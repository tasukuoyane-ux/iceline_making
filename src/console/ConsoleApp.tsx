// /console ルート：認証状態に応じてログイン or エディタを表示。
import { useState } from "react";
import { AuthUser, getToken, getUser } from "./api";
import { Login } from "./Login";
import { Editor } from "./Editor";

export function ConsoleApp() {
  const [user, setUser] = useState<AuthUser | null>(() => (getToken() ? getUser() : null));

  if (!user) {
    return <Login onSuccess={setUser} />;
  }
  return <Editor user={user} onLogout={() => setUser(null)} />;
}
