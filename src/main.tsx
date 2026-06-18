
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";
  import { initEditBridge } from "./app/lib/editBridge";

  createRoot(document.getElementById("root")!).render(<App />);

  // /console の iframe 内（?__edit=1）でのみ編集ブリッジを有効化
  initEditBridge();
