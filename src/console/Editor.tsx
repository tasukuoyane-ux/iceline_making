// /console エディタ本体。
// ヘッダー: タブ（ページ編集 / SEO）・ページ選択・SP/PC切替・公開ボタン等。
// 本体: 左にライブプレビュー(iframe)、右にタブごとの編集パネル。
//  - ページ編集: プレビュー中ページの編集要素一覧（+ ページに応じた構造化マネージャ）
//  - SEO: サイト全域のメタ情報（site:seo.*、overrides.json に保存）
// お知らせ記事は Payload CMS（/admin）で管理する（ヘッダーの「お知らせ管理」から）。
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { AuthUser, clearAuth, publish } from "./api";
import { Content, baseline, baselineSig, buildOverrides, changedFiles, clone, getValueByPath, healDraft, setValueByPath } from "./content";
import { Button, Collapsible } from "./ui";
import { ImageField } from "./ImageField";
import { PageFields, PageField } from "./PageFields";
import { RecruitPanel } from "./RecruitPanel";
import { VideosPanel, InterviewsPanel, ContactSettingsPanel, Recruit3BgPanel } from "./panels";

const DRAFT_KEY = "iceline-console-draft";
const VIEWPORT_KEY = "iceline-console-viewport";

// 編集の対象タブ
const TABS = [
  { id: "pages", label: "ページ編集" },
  { id: "recruit", label: "採用" },
  { id: "seo", label: "SEO" },
] as const;
type TabId = (typeof TABS)[number]["id"];

// プレビューの表示幅。SPは実機で多い390〜430pxの中間、PCはブレークポイント
// （--breakpoint-pc: 1025px）を確実に超える一般的なデスクトップ幅で描画する。
// ペインが狭いときは transform: scale で縮小表示する（レイアウト自体は指定幅で組まれる）。
const VIEWPORTS = [
  { id: "sp", label: "SP", width: 400, note: "スマホ表示（400px）" },
  { id: "pc", label: "PC", width: 1280, note: "パソコン表示（1280px）" },
] as const;
type ViewportId = (typeof VIEWPORTS)[number]["id"];

function loadViewport(): ViewportId {
  const raw = localStorage.getItem(VIEWPORT_KEY);
  return VIEWPORTS.some((v) => v.id === raw) ? (raw as ViewportId) : "pc";
}

const PAGES: { label: string; path: string }[] = [
  { label: "トップ", path: "/" },
  { label: "氷・氷菓の製造販売", path: "/ice" },
  { label: "業務用食材の販売", path: "/food" },
  { label: "倉庫事業", path: "/warehouse" },
  { label: "ドライアイスの販売", path: "/dryice" },
  { label: "商品: ドライアイス", path: "/food/products/dry-ice" },
  { label: "パッケージ: 居酒屋開業", path: "/food/packages/izakaya-starter" },
  { label: "パッケージ: カフェ開業", path: "/food/packages/cafe-sweets" },
  { label: "パッケージ: 宴会シーズン", path: "/food/packages/banquet-season" },
  { label: "お知らせ一覧", path: "/news" },
  { label: "動画で知る", path: "/videos" },
  { label: "採用情報", path: "/recruit" },
  { label: "会社情報", path: "/company" },
  { label: "お問い合わせ", path: "/contact" },
];

// 下書きが破棄されたかを画面側に伝えるためのフラグ（読込後にトーストで通知）。
export let draftDiscarded = false;

function loadDraft(): Content {
  const raw = localStorage.getItem(DRAFT_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      // 新形式 { sig, content } のみ復元対象。署名が現在の本番（ベースライン）と一致する
      // ＝この下書きは現在の公開状態から派生したもの、とみなして復元する。
      // 署名が違う（デプロイで本番が更新された）／旧形式（署名なし）の下書きは
      // 古いデータで本番を巻き戻す恐れがあるため破棄し、現在の本番状態から編集を始める。
      if (parsed && typeof parsed === "object" && parsed.sig === baselineSig() && parsed.content) {
        return healDraft(parsed.content);
      }
      draftDiscarded = true;
    } catch {
      /* fallthrough */
    }
  }
  return baseline();
}

export function Editor({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const [tab, setTab] = useState<TabId>("pages");
  const [draft, setDraft] = useState<Content>(loadDraft);
  const [base, setBase] = useState<Content>(baseline);
  const [previewPath, setPreviewPath] = useState("/");
  const [publishing, setPublishing] = useState(false);
  const [fields, setFields] = useState<PageField[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  // プレビューを強制再読み込みするためのキー（破棄後の巻き戻し表示などに使う）
  const [frameKey, setFrameKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // プレビュー / 編集パネルの幅比率（％）。仕切りのドラッグで変更可能。
  const splitRef = useRef<HTMLDivElement>(null);
  const [leftPct, setLeftPct] = useState(50);
  const [dragging, setDragging] = useState(false);
  // SP / PC のプレビュー切替。iframe を指定幅で描画し、ペインに収まらない分は縮小表示する。
  const [viewport, setViewport] = useState<ViewportId>(loadViewport);
  const previewBoxRef = useRef<HTMLDivElement>(null);
  const [boxSize, setBoxSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    localStorage.setItem(VIEWPORT_KEY, viewport);
  }, [viewport]);

  // プレビュー枠の実寸を監視（仕切りドラッグ・ウィンドウリサイズに追従して縮尺を再計算する）。
  useEffect(() => {
    const el = previewBoxRef.current;
    if (!el) return;
    const update = () => setBoxSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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
    // 下書きには現在の本番署名を添えて保存する（次回読込時の鮮度判定に使う）。
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ sig: baselineSig(), content: draft }));
  }, [draft]);

  // 起動時、本番更新により古い下書きを破棄した場合は一度だけ通知する。
  useEffect(() => {
    if (draftDiscarded) {
      draftDiscarded = false;
      toast.info("本番が更新されていたため、未公開の古い下書きは破棄し、最新の公開状態を読み込みました。");
    }
  }, []);

  const postToFrame = useCallback((msg: any) => {
    iframeRef.current?.contentWindow?.postMessage({ source: "iceline-console", ...msg }, "*");
  }, []);

  const sendOverrides = useCallback(() => {
    postToFrame({ type: "draft", overrides: buildOverrides(draft) });
    // 採用（募集職種）の下書き。件数・並び順が変わるためページ側は React 再描画で反映する
    postToFrame({
      type: "recruit",
      recruit: {
        ...draft.recruit,
        faq: Array.isArray(draft.sections?.recruitFaq?.items) ? draft.sections.recruitFaq.items : [],
      },
    });
  }, [draft, postToFrame]);

  useEffect(() => {
    sendOverrides();
  }, [sendOverrides]);

  // SP/PC切替でiframe内のコンポーネントが再描画されると、下書きのDOMパッチが
  // 消えることがあるため、切替直後に少し遅らせて下書きを再送する。
  useEffect(() => {
    const t = setTimeout(sendOverrides, 400);
    return () => clearTimeout(t);
  }, [viewport, sendOverrides]);

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

  // 汎用パス（data-edit パス / site:seo.* / hide:*）への読み書き
  const setValue = useCallback((path: string, value: string) => {
    setDraft((d) => setValueByPath(d, path, value));
  }, []);

  function discard() {
    if (!confirm("未公開の変更をすべて破棄して、最後に公開した状態に戻しますか？")) return;
    setDraft(clone(base));
    setFrameKey((k) => k + 1); // プレビューを再読み込みして下書きパッチを消す
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

  // プレビューの縮尺計算：指定幅がペインに収まらないときだけ縮小（拡大はしない）。
  const vpWidth = VIEWPORTS.find((v) => v.id === viewport)!.width;
  const scale = boxSize.w > 0 ? Math.min(1, boxSize.w / vpWidth) : 1;

  return (
    <div className="flex h-screen flex-col bg-slate-100">
      {/* ヘッダー */}
      <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-4 py-2">
        <span className="text-[14px] font-bold text-slate-800">アイスライン 管理コンソール</span>

        {/* 編集の対象タブ */}
        <div role="group" aria-label="編集の対象" className="flex overflow-hidden rounded-md border border-slate-300">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                // 採用タブは採用ページ（/recruit）の内容を編集するため、プレビューも合わせる
                if (t.id === "recruit" && previewPath !== "/recruit") {
                  setPreviewPath("/recruit");
                  setFields([]);
                  setSelectedPath(null);
                }
              }}
              aria-pressed={tab === t.id}
              className={
                "px-3 py-1 text-[12px] font-medium transition-colors " +
                (tab === t.id ? "bg-emerald-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50")
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        <select
          value={previewPath}
          onChange={(e) => {
            setPreviewPath(e.target.value);
            setFields([]);
            setSelectedPath(null);
          }}
          aria-label="プレビューするページ"
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[12px] text-slate-700 outline-none"
        >
          {PAGES.map((p) => (
            <option key={p.path} value={p.path}>{p.label}</option>
          ))}
        </select>

        <div role="group" aria-label="プレビューの表示幅" className="flex overflow-hidden rounded-md border border-slate-300">
          {VIEWPORTS.map((v) => (
            <button
              key={v.id}
              type="button"
              title={v.note}
              aria-pressed={viewport === v.id}
              onClick={() => setViewport(v.id)}
              className={
                "px-2.5 py-1 text-[12px] font-medium transition-colors " +
                (viewport === v.id ? "bg-slate-800 text-white" : "bg-white text-slate-600 hover:bg-slate-100")
              }
            >
              {v.label}
            </button>
          ))}
        </div>

        <Button type="button" onClick={() => setFrameKey((k) => k + 1)}>プレビュー再読み込み</Button>

        {/* 公開前チェックリストの自動検査（/console/check）。編集中の状態を失わないよう別タブで開く。 */}
        <a
          href="/console/check"
          target="_blank"
          rel="noreferrer"
          title="公開前チェックリストの自動検査（別タブで開く）"
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          セルフチェック
        </a>

        {/* お知らせ記事は Payload の管理画面（/admin）で編集する */}
        <a
          href="/admin"
          target="_blank"
          rel="noreferrer"
          title="お知らせ記事の管理画面（別タブで開く）"
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          お知らせ管理
        </a>

        <span className="ml-auto text-[12px] text-slate-500">
          {changeCount > 0 ? `未公開の変更 ${changeCount}件` : "変更なし"}
        </span>
        <Button onClick={discard} disabled={changeCount === 0}>変更を破棄</Button>
        <Button variant="primary" onClick={onPublish} disabled={publishing || changeCount === 0}>
          {publishing ? "公開中…" : "更新（本番へ公開）"}
        </Button>
        <span className="text-[12px] text-slate-400">{user.name} さん</span>
        <Button variant="ghost" onClick={logout}>ログアウト</Button>
      </header>

      {/* 本体：左プレビュー / 右エディタ（仕切りをドラッグで幅調整） */}
      <div ref={splitRef} className="relative flex min-h-0 flex-1">
        {/* 左：ライブプレビュー */}
        <div style={{ width: `${leftPct}%` }} className="flex min-w-0 flex-col border-r border-slate-200 bg-white">
          <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 px-3 py-1.5">
            <span className="text-[12px] text-slate-500">プレビュー：{currentPageLabel}</span>
            {scale < 1 && (
              <span className="text-[11px] text-slate-400">{Math.round(scale * 100)}%表示</span>
            )}
            <span className="ml-auto text-[11px] text-slate-400">要素をクリックすると右で編集できます</span>
          </div>
          {/* 指定幅（SP=400px / PC=1280px）でページを描画し、ペインに収まらない分は縮小表示。
              iframe を再マウントしない（key は frameKey と previewPath のみ）ため、SP/PC切替時に再読込は発生しない。 */}
          <div ref={previewBoxRef} className="min-h-0 flex-1 overflow-hidden bg-slate-200">
            <div className="mx-auto h-full" style={{ width: vpWidth * scale }}>
              <iframe
                ref={iframeRef}
                key={`${frameKey}:${previewPath}`}
                src={previewSrc}
                title="ライブプレビュー"
                className="bg-white"
                style={{
                  width: vpWidth,
                  height: boxSize.h > 0 ? boxSize.h / scale : "100%",
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                }}
                onLoad={() => {
                  sendOverrides();
                  postToFrame({ type: "request-fields" });
                }}
              />
            </div>
          </div>
        </div>

        {/* ドラッグ可能な仕切り */}
        <div
          onMouseDown={startDrag}
          title="ドラッグして幅を調整"
          className={`relative z-20 w-1.5 shrink-0 cursor-col-resize transition-colors ${dragging ? "bg-emerald-500" : "bg-slate-200 hover:bg-emerald-400"}`}
        >
          <span className="pointer-events-none absolute inset-y-0 -left-1.5 -right-1.5" />
        </div>

        {/* 右：タブごとの編集パネル */}
        <div className="flex min-w-0 flex-1 flex-col bg-slate-50">
          {tab === "pages" && (
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-2">
              <div>
                <p className="text-[13px] font-semibold text-slate-800">{currentPageLabel} の編集</p>
                <p className="text-[11px] text-slate-400">このページに表示される要素が上から順に並んでいます</p>
              </div>
              <span className="text-[11px] text-slate-400">{fields.length} 項目</span>
            </div>
          )}
          <div id="fields-scroll" className="min-h-0 flex-1 overflow-y-auto p-4">
            {tab === "seo" ? (
              <SeoPanel draft={draft} setValue={setValue} />
            ) : tab === "recruit" ? (
              <RecruitPanel draft={draft} setSlice={setSlice} />
            ) : (
              <>
                {/* プレビュー中のページに応じた構造化マネージャ（追加・削除・並べ替え） */}
                <PageManagers route={previewPath} draft={draft} setSlice={setSlice} />
                <PageFields
                  fields={fields}
                  draft={draft}
                  base={base}
                  onChange={setDraft}
                  selectedPath={selectedPath}
                  onFocusField={onFocusField}
                />
              </>
            )}
          </div>
        </div>

        {/* ドラッグ中は iframe 上でもマウス追従できるよう全面オーバーレイ */}
        {dragging && <div className="absolute inset-0 z-30 cursor-col-resize" />}
      </div>
    </div>
  );
}

/**
 * プレビュー中のページに応じて右パネル上部へ差し込む構造化マネージャ。
 * （参考プロジェクトの MembersManager 方式。旧「コンテンツ管理」オーバーレイの再配置先）
 * 追加・削除・並べ替えはプレビューへ即時反映されない点は従来どおり
 * （文言・画像の変更のみ DOM パッチで即時反映される）。
 */
function PageManagers({
  route,
  draft,
  setSlice,
}: {
  route: string;
  draft: Content;
  setSlice: <K extends keyof Content>(key: K, value: Content[K]) => void;
}) {
  const items: { title: string; node: ReactNode }[] = [];

  if (route === "/videos") {
    items.push({
      title: "動画の管理（追加・削除）",
      node: <VideosPanel value={draft.videos} onChange={(v) => setSlice("videos", v)} />,
    });
  }
  // 採用ページ（/recruit＝旧採用3）：背景動画とインタビューの管理
  if (route === "/recruit") {
    items.push({
      title: "採用 背景動画",
      node: <Recruit3BgPanel value={draft.sections} onChange={(v) => setSlice("sections", v)} />,
    });
    items.push({
      title: "社員インタビュー（追加・削除）",
      node: <InterviewsPanel value={draft.interviews} onChange={(v) => setSlice("interviews", v)} />,
    });
  }
  if (route === "/contact") {
    items.push({
      title: "お問い合わせ設定（送信先）",
      node: <ContactSettingsPanel value={draft.contact} onChange={(v) => setSlice("contact", v)} />,
    });
  }

  if (route === "/news" || route.startsWith("/news/")) {
    return (
      <div className="mb-3 rounded-lg border border-sky-200 bg-sky-50 p-3">
        <p className="text-[13px] font-semibold text-slate-800">お知らせ記事の編集について</p>
        <p className="mt-1 text-[12px] leading-relaxed text-slate-600">
          お知らせの記事（追加・編集・削除）は記事管理画面で行います。
          日付・カテゴリ・タイトル・本文の編集、下書き保存と公開ができます。
        </p>
        <a
          href="/admin"
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block rounded-md bg-sky-600 px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-sky-700"
        >
          記事管理画面（/admin）を開く
        </a>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="mb-3 space-y-2">
      {items.map((m) => (
        <Collapsible key={m.title} title={m.title}>
          {m.node}
        </Collapsible>
      ))}
    </div>
  );
}

/**
 * 「SEO」タブ。サイト全域のメタ情報を設定する。
 *  - OGP画像（SNSでシェアされたときのサムネイル。推奨 1200×630px）
 *  - メタディスクリプション（検索結果の説明文）
 *  - キーワード（読点・カンマ区切り）
 * 値は文言と同じ overrides（site:seo.*）に保存され、「更新（本番へ公開）」→
 * デプロイ完了で全ページの <head> に反映される。head のメタ情報のため
 * 左のプレビュー画面には現れない。
 */
/** パスワードを SHA-256（16進）にハッシュ化する。平文は保存しない */
async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function SeoPanel({
  draft,
  setValue,
}: {
  draft: Content;
  setValue: (path: string, value: string) => void;
}) {
  const get = (path: string) => getValueByPath(draft, path) ?? "";
  const desc = get("site:seo.description");
  // サイト閲覧パスワードの入力欄（保存されるのはハッシュのみ）
  const [protectPw, setProtectPw] = useState("");
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[13px] font-bold text-slate-800">SEO設定</h2>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
          サイト全域の検索・シェア向けメタ情報です。「更新（本番へ公開）」の
          あと、デプロイ完了（数分）で全ページに反映されます。メタ情報のため
          左のプレビューには表示されません。
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <span className="text-[12px] font-bold text-slate-700">OGPイメージ</span>
        <p className="mt-0.5 mb-2 text-[11px] leading-relaxed text-slate-500">
          SNS（X・Facebook・LINE等）でシェアされたときに出るサムネイル。
          推奨サイズは 1200×630px です。
        </p>
        <ImageField label="" value={get("site:seo.ogImage")} onChange={(url) => setValue("site:seo.ogImage", url)} />
      </div>

      <label className="block rounded-lg border border-slate-200 bg-white p-3">
        <span className="text-[12px] font-bold text-slate-700">メタディスクリプション</span>
        <p className="mt-0.5 mb-2 text-[11px] leading-relaxed text-slate-500">
          検索結果に出るサイトの説明文。全角80〜120字程度が目安です
          （現在 {desc.length} 字）。空にするとコード側の既定文に戻ります。
        </p>
        <textarea
          value={desc}
          onChange={(e) => setValue("site:seo.description", e.target.value)}
          rows={4}
          placeholder="アイスライン株式会社 — 氷・氷菓の製造販売、業務用食材の販売、倉庫事業。"
          className="w-full rounded border border-slate-300 p-2 text-[12px] leading-relaxed text-slate-800"
        />
      </label>

      <label className="block rounded-lg border border-slate-200 bg-white p-3">
        <span className="text-[12px] font-bold text-slate-700">キーワード</span>
        <p className="mt-0.5 mb-2 text-[11px] leading-relaxed text-slate-500">
          サイト全域のキーワード。読点（、）またはカンマ（,）区切りで入力します。
          例: 業務用食材、氷、ドライアイス
        </p>
        <input
          type="text"
          value={get("site:seo.keywords")}
          onChange={(e) => setValue("site:seo.keywords", e.target.value)}
          placeholder="業務用食材、氷、ドライアイス"
          className="w-full rounded border border-slate-300 p-2 text-[12px] text-slate-800"
        />
      </label>

      {/* サイト閲覧パスワード（サイト全体の閲覧保護） */}
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <span className="text-[12px] font-bold text-slate-700">サイト閲覧パスワード</span>
        <p className="mt-0.5 mb-2 text-[11px] leading-relaxed text-slate-500">
          有効にして公開すると、サイト全体の閲覧にパスワードが必要になります
          （/console と /admin は対象外なので、忘れてもここから変更・解除できます）。
          パスワードはハッシュ化して保存され、平文は残りません。
          変更すると閲覧済みブラウザでも再入力が必要になります。
        </p>
        <label className="flex items-center gap-2 text-[12px] font-medium text-slate-700">
          <input
            type="checkbox"
            checked={get("site:protect.enabled") === "1"}
            onChange={(e) => setValue("site:protect.enabled", e.target.checked ? "1" : "")}
          />
          閲覧パスワードを有効にする
        </label>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="text"
            value={protectPw}
            onChange={(e) => setProtectPw(e.target.value)}
            placeholder="新しい閲覧パスワード"
            className="min-w-0 flex-1 rounded border border-slate-300 p-2 text-[12px] text-slate-800"
          />
          <button
            type="button"
            disabled={protectPw === ""}
            onClick={async () => {
              setValue("site:protect.hash", await sha256Hex(protectPw));
              setProtectPw("");
            }}
            className="shrink-0 rounded bg-slate-800 px-3 py-2 text-[12px] font-medium text-white transition-colors hover:bg-slate-700 disabled:opacity-40"
          >
            設定
          </button>
        </div>
        <p className="mt-1.5 text-[11px] text-slate-500">
          {get("site:protect.hash")
            ? "パスワード：設定済み（変更するには新しいパスワードを入力して「設定」）"
            : "パスワード：未設定（未設定の間は有効にしても保護されません）"}
        </p>
      </div>
    </div>
  );
}

function cssEscape(s: string): string {
  return s.replace(/["\\]/g, "\\$&");
}
