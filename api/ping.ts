// 診断用: import を一切持たない最小関数。関数ランタイム自体の動作確認。
export default function handler(_req: any, res: any) {
  res.status(200).json({ ok: true, pong: true, node: process.version });
}
