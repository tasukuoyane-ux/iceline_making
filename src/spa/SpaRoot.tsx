"use client";

// 旧 `src/main.tsx` の役割を引き継ぐクライアント側エントリ。
// Next.js の catch-all ルート（SpaClient）から ssr:false で読み込まれ、
// react-router ベースの SPA 全体をそのまま描画する。
import { useEffect, useLayoutEffect } from "react";
import App from "./App";
import { initEditBridge } from "./lib/editBridge";

export default function SpaRoot() {
  // サーバ先行描画のファーストビュー（TopShell の #top-shell）を、
  // SPA の初回描画がブラウザに表示される前（useLayoutEffect）に取り除く。
  // これにより二重表示や描画のちらつきなしで SPA 側の表示へ切り替わる。
  useLayoutEffect(() => {
    document.getElementById("top-shell")?.remove();
  }, []);
  // /console の iframe 内（?__edit=1）でのみ編集ブリッジを有効化
  useEffect(() => {
    initEditBridge();
  }, []);
  return <App />;
}
