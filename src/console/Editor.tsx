// /console エディタ本体：左にライブプレビュー(iframe)、右に編集パネル、上部に更新ボタン。
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AuthUser, clearAuth, publish } from "./api";
import {
  Content,
  baseline,
  buildOverrides,
  changedFiles,
  clone,
} from "./content";
import { Button } from "./ui";
import { NewsPanel, VideosPanel, InterviewsPanel, ImagesPanel, SectionsPanel } from "./panels";

const DRAFT_KEY = "iceline-console-draft";

type TabKey = "news" | "videos" | "interviews" | "images" | "sections";
const TABS: { key: TabKey; label: string }[] = [
  { key: "news", label: "お知らせ" },
  { key: "videos", label: "動画" },
  { key: "interviews", label: "社員インタビュー" },
  { key: "images", label: "画像" },
  { key: "sections", label: "セクション文言" },
];

const PAGES: { label: string; path: string }[] = [
  { label: "トップ", path: "/" },
  { label: "食品事業部", path: "/food" },
  { label: "アイス事業部", path: "/ice" },
  { label: "お知らせ一覧", path: "/news" },
  { label: "動画で知る", path: "/videos" },
  { label: "採用情報", path: "/recruit" },
  { label: "会社情報", path: "/company" },
];

function loadDraft(): Content {
  const raw = localStorage.getItem(DRAFT_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as Content;
    } catch {
      /* fallthrough */
    }
  }
  return baseline();
}

export function Editor({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const [draft, setDraft] = useState<Content>(loadDraft);
  // 公開済みスナップショット（公開後はこれを基準に差分を取る）
  const [base, setBase] = useState<Content>(baseline);
  const [tab, setTab] = useState<TabKey>("news");
  const [previewPath, setPreviewPath] = useState("/");
  const [publishing, setPublishing] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const changes = useMemo(() => changedFiles(draft, base), [draft, base]);
  const changeCount = Object.keys(changes).length;

  // 下書きをlocalStorageへ自動保存
  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [draft]);

  // iframeへプレビュー用オーバーライドを送信
  const sendOverrides = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage(
      { source: "iceline-console", type: "draft", overrides: buildOverrides(draft) },
      "*"
    );
  }, [draft]);

  useEffect(() => {
    sendOverrides();
  }, [sendOverrides]);

  // iframeからのメッセージ（編集対象クリック / 準備完了）
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      const msg = e.data;
      if (!msg) return;
      if (msg.source === "iceline-live" && msg.type === "ready") {
        sendOverrides();
      }
      if (msg.source === "iceline-console" && msg.type === "select") {
        focusByPath(msg.path as string);
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [sendOverrides]);

  function focusByPath(path: string) {
    const colon = path.indexOf(":");
    const kind = path.slice(0, colon);
    const rest = path.slice(colon + 1);
    let nextTab: TabKey = "sections";
    let focusKey = "";
    if (kind === "news") {
      nextTab = "news";
      focusKey = rest.split(":")[0];
    } else if (kind === "videos") {
      nextTab = "videos";
      focusKey = rest.split(":")[0];
    } else if (kind === "interviews") {
      nextTab = "interviews";
      focusKey = rest.split(":")[0];
    } else if (kind === "images") {
      nextTab = "images";
      focusKey = rest; // 例: IMG.iceMacro
    } else if (kind === "sections") {
      nextTab = "sections";
      focusKey = rest.split(".")[0];
    }
    setTab(nextTab);
    setTimeout(() => {
      const el = document.querySelector(`#console-panel [data-focus="${cssEscape(focusKey)}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-emerald-500", "rounded-lg");
        setTimeout(() => el.classList.remove("ring-2", "ring-emerald-500", "rounded-lg"), 1600);
      }
    }, 120);
  }

  function setSlice<K extends keyof Content>(key: K, value: Content[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function discard() {
    if (!confirm("未公開の変更をすべて破棄して、最後に公開した状態に戻しますか？")) return;
    setDraft(clone(base));
    toast.info("変更を破棄しました");
  }

  async function onPublish() {
    if (changeCount === 0) {
      toast.info("公開する変更はありません");
      return;
    }
    if (!confirm(`${changeCount}件のファイルを本番サイトへ公開します。よろしいですか？`)) return;
    setPublishing(true);
    try {
      const res = await publish(changes, `コンテンツ更新（${user.name}）`);
      if (res.ok) {
        setBase(clone(draft)); // 以後はこの状態を基準に差分計算
        toast.success("公開しました。本番サイトへの反映まで数十秒〜1分ほどお待ちください。");
      } else {
        toast.error("公開に失敗しました");
      }
    } catch (err: any) {
      toast.error(err.message || "公開に失敗しました");
    } finally {
      setPublishing(false);
    }
  }

  function logout() {
    clearAuth();
    onLogout();
  }

  const previewSrc = `${previewPath}${previewPath.includes("?") ? "&" : "?"}__edit=1`;

  return (
    <div className="flex h-screen flex-col bg-slate-100">
      {/* 上部バー */}
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-3">
          <span className="text-[15px] font-bold text-slate-800">アイスライン 管理コンソール</span>
          {changeCount > 0 && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[12px] font-medium text-amber-700">
              未公開の変更 {changeCount}件
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-[13px] text-slate-500 sm:inline">{user.name} さん</span>
          <Button onClick={discard} disabled={changeCount === 0}>変更を破棄</Button>
          <Button variant="primary" onClick={onPublish} disabled={publishing || changeCount === 0}>
            {publishing ? "公開中…" : "更新（本番へ公開）"}
          </Button>
          <Button variant="ghost" onClick={logout}>ログアウト</Button>
        </div>
      </header>

      {/* 本体：左プレビュー / 右エディタ */}
      <div className="flex min-h-0 flex-1">
        {/* 左：ライブプレビュー */}
        <div className="flex w-1/2 min-w-0 flex-col border-r border-slate-200 bg-white">
          <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 px-3 py-2">
            <span className="text-[12px] text-slate-500">プレビュー：</span>
            <select
              value={previewPath}
              onChange={(e) => setPreviewPath(e.target.value)}
              className="rounded border border-slate-300 bg-white px-2 py-1 text-[13px] outline-none"
            >
              {PAGES.map((p) => (
                <option key={p.path} value={p.path}>{p.label}</option>
              ))}
            </select>
            <span className="ml-auto text-[11px] text-slate-400">要素をクリックすると右側で編集できます</span>
          </div>
          <iframe
            ref={iframeRef}
            key={previewPath}
            src={previewSrc}
            title="ライブプレビュー"
            className="min-h-0 flex-1 bg-white"
            onLoad={sendOverrides}
          />
        </div>

        {/* 右：エディタ */}
        <div className="flex w-1/2 min-w-0 flex-col bg-slate-50">
          <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-200 bg-white px-2 py-1.5">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={
                  "shrink-0 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors " +
                  (tab === t.key ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-100")
                }
              >
                {t.label}
              </button>
            ))}
          </div>
          <div id="console-panel" className="min-h-0 flex-1 overflow-y-auto p-4">
            {tab === "news" && <NewsPanel value={draft.news} onChange={(v) => setSlice("news", v)} />}
            {tab === "videos" && <VideosPanel value={draft.videos} onChange={(v) => setSlice("videos", v)} />}
            {tab === "interviews" && <InterviewsPanel value={draft.interviews} onChange={(v) => setSlice("interviews", v)} />}
            {tab === "images" && <ImagesPanel value={draft.images} onChange={(v) => setSlice("images", v)} />}
            {tab === "sections" && <SectionsPanel value={draft.sections} onChange={(v) => setSlice("sections", v)} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function cssEscape(s: string): string {
  return s.replace(/["\\]/g, "\\$&");
}
