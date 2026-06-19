// /console エディタ本体：左にライブプレビュー(iframe)、右に「そのページの編集要素一覧」、上部に更新ボタン。
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AuthUser, clearAuth, publish } from "./api";
import { Content, baseline, buildOverrides, changedFiles, clone, normalizeContent } from "./content";
import { Button } from "./ui";
import { PageFields, PageField } from "./PageFields";
import { NewsPanel, VideosPanel, InterviewsPanel, ProfileSlidesPanel, ContactSettingsPanel } from "./panels";

const DRAFT_KEY = "iceline-console-draft";

const PAGES: { label: string; path: string }[] = [
  { label: "トップ", path: "/" },
  { label: "食品事業部", path: "/food" },
  { label: "アイス事業部", path: "/ice" },
  { label: "商品: ドライアイス", path: "/food/products/dry-ice" },
  { label: "お知らせ一覧", path: "/news" },
  { label: "動画で知る", path: "/videos" },
  { label: "採用情報", path: "/recruit" },
  { label: "会社情報", path: "/company" },
  { label: "お問い合わせ", path: "/contact" },
];

function loadDraft(): Content {
  const raw = localStorage.getItem(DRAFT_KEY);
  if (raw) {
    try {
      return normalizeContent(JSON.parse(raw));
    } catch {
      /* fallthrough */
    }
  }
  return baseline();
}

type ManageTab = "news" | "videos" | "interviews" | "profileSlides" | "contact";

export function Editor({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const [draft, setDraft] = useState<Content>(loadDraft);
  const [base, setBase] = useState<Content>(baseline);
  const [previewPath, setPreviewPath] = useState("/");
  const [publishing, setPublishing] = useState(false);
  const [fields, setFields] = useState<PageField[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [manage, setManage] = useState<ManageTab | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // プレビュー / 編集パネルの幅比率（％）。仕切りのドラッグで変更可能。
  const splitRef = useRef<HTMLDivElement>(null);
  const [leftPct, setLeftPct] = useState(50);
  const [dragging, setDragging] = useState(false);

  function startDrag(e: React.MouseEvent) {
    e.preventDefault();
    setDragging(true);
    const onMove = (ev: MouseEvent) => {
      const rect = splitRef.current?.getBoundingClientRect();
      if (!rect) return;
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setLeftPct(Math.min(80, Math.max(20, pct)));
    };
    const onUp = () => {
      setDragging(false);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  const changes = useMemo(() => changedFiles(draft, base), [draft, base]);
  const changeCount = Object.keys(changes).length;

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [draft]);

  const postToFrame = useCallback((msg: any) => {
    iframeRef.current?.contentWindow?.postMessage({ source: "iceline-console", ...msg }, "*");
  }, []);

  const sendOverrides = useCallback(() => {
    postToFrame({ type: "draft", overrides: buildOverrides(draft) });
  }, [draft, postToFrame]);

  useEffect(() => {
    sendOverrides();
  }, [sendOverrides]);

  // iframeからのメッセージ
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      const msg = e.data;
      if (!msg || msg.source !== "iceline-live") return;
      if (msg.type === "ready") {
        sendOverrides();
        postToFrame({ type: "request-fields" });
      } else if (msg.type === "page-fields") {
        setFields(msg.fields || []);
      } else if (msg.type === "select") {
        setSelectedPath(msg.path);
        setTimeout(() => {
          const el = document.querySelector(`#fields-scroll [data-fieldpath="${cssEscape(msg.path)}"]`);
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 60);
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [sendOverrides, postToFrame]);

  function onFocusField(path: string) {
    setSelectedPath(path);
    postToFrame({ type: "scroll-to", path });
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
        setBase(clone(draft));
        toast.success("公開しました。本番反映まで数十秒〜1分ほどお待ちください。");
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
  const currentPageLabel = PAGES.find((p) => p.path === previewPath)?.label || previewPath;

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
          <Button onClick={() => setManage("news")}>コンテンツ管理</Button>
          <Button onClick={discard} disabled={changeCount === 0}>変更を破棄</Button>
          <Button variant="primary" onClick={onPublish} disabled={publishing || changeCount === 0}>
            {publishing ? "公開中…" : "更新（本番へ公開）"}
          </Button>
          <Button variant="ghost" onClick={logout}>ログアウト</Button>
        </div>
      </header>

      {/* 本体：左プレビュー / 右エディタ（仕切りをドラッグで幅調整） */}
      <div ref={splitRef} className="relative flex min-h-0 flex-1">
        {/* 左：ライブプレビュー */}
        <div style={{ width: `${leftPct}%` }} className="flex min-w-0 flex-col border-r border-slate-200 bg-white">
          <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 px-3 py-2">
            <span className="text-[12px] text-slate-500">プレビュー：</span>
            <select
              value={previewPath}
              onChange={(e) => {
                setPreviewPath(e.target.value);
                setFields([]);
                setSelectedPath(null);
              }}
              className="rounded border border-slate-300 bg-white px-2 py-1 text-[13px] outline-none"
            >
              {PAGES.map((p) => (
                <option key={p.path} value={p.path}>{p.label}</option>
              ))}
            </select>
            <span className="ml-auto text-[11px] text-slate-400">要素をクリックすると右で編集できます</span>
          </div>
          <iframe
            ref={iframeRef}
            key={previewPath}
            src={previewSrc}
            title="ライブプレビュー"
            className="min-h-0 flex-1 bg-white"
            onLoad={() => {
              sendOverrides();
              postToFrame({ type: "request-fields" });
            }}
          />
        </div>

        {/* ドラッグ可能な仕切り */}
        <div
          onMouseDown={startDrag}
          title="ドラッグして幅を調整"
          className={`relative z-20 w-1.5 shrink-0 cursor-col-resize transition-colors ${dragging ? "bg-emerald-500" : "bg-slate-200 hover:bg-emerald-400"}`}
        >
          <span className="pointer-events-none absolute inset-y-0 -left-1.5 -right-1.5" />
        </div>

        {/* 右：ページ単位エディタ */}
        <div className="flex min-w-0 flex-1 flex-col bg-slate-50">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-2">
            <div>
              <p className="text-[13px] font-semibold text-slate-800">{currentPageLabel} の編集</p>
              <p className="text-[11px] text-slate-400">このページに表示される要素が上から順に並んでいます</p>
            </div>
            <span className="text-[11px] text-slate-400">{fields.length} 項目</span>
          </div>
          <div id="fields-scroll" className="min-h-0 flex-1 overflow-y-auto p-4">
            <PageFields
              fields={fields}
              draft={draft}
              onChange={setDraft}
              selectedPath={selectedPath}
              onFocusField={onFocusField}
            />
          </div>
        </div>

        {/* ドラッグ中は iframe 上でもマウス追従できるよう全面オーバーレイ */}
        {dragging && <div className="absolute inset-0 z-30 cursor-col-resize" />}
      </div>

      {/* コンテンツ管理（追加・削除）オーバーレイ */}
      {manage && (
        <ManageOverlay
          tab={manage}
          setTab={setManage}
          draft={draft}
          setSlice={setSlice}
          onClose={() => setManage(null)}
        />
      )}
    </div>
  );
}

function ManageOverlay({
  tab,
  setTab,
  draft,
  setSlice,
  onClose,
}: {
  tab: ManageTab;
  setTab: (t: ManageTab) => void;
  draft: Content;
  setSlice: <K extends keyof Content>(key: K, value: Content[K]) => void;
  onClose: () => void;
}) {
  const TABS: { key: ManageTab; label: string }[] = [
    { key: "news", label: "お知らせ" },
    { key: "videos", label: "動画" },
    { key: "interviews", label: "社員インタビュー" },
    { key: "profileSlides", label: "会社紹介資料" },
    { key: "contact", label: "お問い合わせ設定" },
  ];
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div className="flex h-full w-full max-w-2xl flex-col bg-slate-50 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-bold text-slate-800">コンテンツ管理</span>
            <span className="text-[11px] text-slate-400">記事・動画・インタビューの追加／削除</span>
          </div>
          <Button variant="ghost" onClick={onClose}>閉じる</Button>
        </div>
        <div className="flex shrink-0 gap-1 border-b border-slate-200 bg-white px-3 py-1.5">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={
                "rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors " +
                (tab === t.key ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-100")
              }
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {tab === "news" && <NewsPanel value={draft.news} onChange={(v) => setSlice("news", v)} />}
          {tab === "videos" && <VideosPanel value={draft.videos} onChange={(v) => setSlice("videos", v)} />}
          {tab === "interviews" && <InterviewsPanel value={draft.interviews} onChange={(v) => setSlice("interviews", v)} />}
          {tab === "profileSlides" && <ProfileSlidesPanel value={draft.profileSlides} onChange={(v) => setSlice("profileSlides", v)} />}
          {tab === "contact" && <ContactSettingsPanel value={draft.contact} onChange={(v) => setSlice("contact", v)} />}
        </div>
      </div>
    </div>
  );
}

function cssEscape(s: string): string {
  return s.replace(/["\\]/g, "\\$&");
}
