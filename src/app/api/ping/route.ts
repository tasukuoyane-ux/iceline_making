// 診断用: import を一切持たない最小ルート。ランタイム自体の動作確認。
export function GET(): Response {
  return Response.json({ ok: true, pong: true, node: process.version });
}
