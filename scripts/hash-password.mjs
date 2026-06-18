// 社員アカウント用の bcrypt ハッシュ生成ヘルパー。
//
// 使い方:
//   node scripts/hash-password.mjs <社員ID> <表示名> <パスワード>
// 例:
//   node scripts/hash-password.mjs tanaka 田中太郎 mypassword123
//
// 出力された JSON オブジェクトを、環境変数 CONSOLE_USERS の配列に追加してください。
// 複数人ぶんをまとめて配列 [ {...}, {...} ] にして登録します。

import bcrypt from "bcryptjs";

const [, , username, name, password] = process.argv;

if (!username || !name || !password) {
  console.error("使い方: node scripts/hash-password.mjs <社員ID> <表示名> <パスワード>");
  process.exit(1);
}

const passwordHash = bcrypt.hashSync(password, 10);
const entry = { username, name, passwordHash };

console.log("\nCONSOLE_USERS に追加するエントリ:\n");
console.log(JSON.stringify(entry, null, 2));
console.log("\n複数人ぶんは配列にまとめてください。例:");
console.log(JSON.stringify([entry], null, 0));
console.log("");
