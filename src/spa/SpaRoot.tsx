"use client";

// 旧 `src/main.tsx` の役割を引き継ぐクライアント側エントリ。
// Next.js の catch-all ルート（SpaClient）から ssr:false で読み込まれ、
// react-router ベースの SPA 全体をそのまま描画する。
import { useEffect } from "react";
import App from "./App";
import { initEditBridge } from "./lib/editBridge";

export default function SpaRoot() {
  // /console の iframe 内（?__edit=1）でのみ編集ブリッジを有効化
  useEffect(() => {
    initEditBridge();
  }, []);
  return <App />;
}
