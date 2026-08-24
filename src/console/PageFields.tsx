// ページ単位エディタ：現在プレビュー中ページの編集可能要素を、
// セクションごとのアコーディオン（既定は閉じた状態）で表示して編集する。
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Content, getValueByPath, setValueByPath } from "./content";
import { Select, TextArea, TextInput } from "./ui";
import { ImageField } from "./ImageField";
import { uploadImage } from "./api";

/** 動画ファイルのアップロードボタン（動画URLフィールド用。Blobへ保存してURLを反映） */
function VideoUploadButton({ onDone }: { onDone: (url: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="mt-1.5 flex items-center gap-2">
      <input
        ref={ref}
        type="file"
        accept="video/*,.webm,.mp4,.mov,.m4v,.ogv"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setErr(null);
          setBusy(true);
          try {
            const { url } = await uploadImage(file); // 任意のファイル種別に対応（Blobへ保存）
            onDone(url);
          } catch (x: any) {
            setErr(x?.message || "アップロードに失敗しました");
          } finally {
            setBusy(false);
            if (ref.current) ref.current.value = "";
          }
        }}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => ref.current?.click()}
        className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
      >
        {busy ? "アップロード中…" : "動画ファイルをアップロード"}
      </button>
      {err && <span className="text-[11px] text-red-600">{err}</span>}
    </div>
  );
}

// アニメーションの選択肢（値は "種類|開始オフセットpx|移動量px" で overrides の anim:<パス> に保存）
const ANIM_OPTS: { value: string; label: string }[] = [
  { value: "", label: "アニメなし" },
  { value: "fade-b", label: "フェードイン（下から）" },
  { value: "fade-t", label: "フェードイン（上から）" },
  { value: "fade-l", label: "フェードイン（左から）" },
  { value: "fade-r", label: "フェードイン（右から）" },
  { value: "slide-b", label: "スライドイン（下から）" },
  { value: "slide-t", label: "スライドイン（上から）" },
  { value: "slide-l", label: "スライドイン（左から）" },
  { value: "slide-r", label: "スライドイン（右から）" },
];

/** アニメーション設定コントロール（種類select＋オフセット・移動量入力）。
 * 要素単体（anim:<編集パス>）にも横並びグループ全体（anim:<比率パス>）にも使う。 */
function AnimControls({
  draft,
  animKey,
  onChange,
  ariaLabel = "アニメーション",
}: {
  draft: Content;
  animKey: string;
  onChange: (next: Content) => void;
  ariaLabel?: string;
}) {
  const [type = "", offset = "0", amount = "40"] = (getValueByPath(draft, animKey) || "").split("|");
  const set = (t: string, o: string, a: string) =>
    onChange(setValueByPath(draft, animKey, t ? `${t}|${o || "0"}|${a || "40"}` : ""));
  return (
    <>
      <select
        value={type}
        onChange={(e) => set(e.target.value, offset, amount)}
        aria-label={ariaLabel}
        className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] text-slate-600 outline-none"
      >
        {ANIM_OPTS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {type && (
        <>
          <label className="flex items-center gap-1 text-[10px] text-slate-500">
            開始オフセット
            <input
              type="number"
              min={0}
              step={10}
              value={offset}
              onChange={(e) => set(type, e.target.value, amount)}
              className="w-14 rounded border border-slate-300 px-1 py-0.5 text-[10px] outline-none"
            />
            px
          </label>
          <label className="flex items-center gap-1 text-[10px] text-slate-500">
            移動量
            <input
              type="number"
              min={0}
              step={10}
              value={amount}
              onChange={(e) => set(type, offset, e.target.value)}
              className="w-14 rounded border border-slate-300 px-1 py-0.5 text-[10px] outline-none"
            />
            px
          </label>
        </>
      )}
    </>
  );
}

export interface PageField {
  path: string;
  kind: "text" | "image" | "select";
  value: string; // ライブDOM上の現在値（未編集時の既定値）
  label: string;
  multiline: boolean;
  options?: { value: string; label: string }[]; // kind === "select" のみ
  /** 画像フィールドが「画像と文章の横並びグリッド」内にある場合の比率設定（editBridgeが紐付け） */
  ratio?: { path: string; def: number; first: boolean };
  /** 所属セクションの表示名（アコーディオングルーピング用・editBridgeが付与） */
  section?: string;
  /** true なら動画URLフィールド（動画ファイルのアップロードボタンを表示） */
  video?: boolean;
  /** 繰り返しセクションの「項目数」フィールドのメタ情報（追加・削除ボタン用） */
  repeat?: { prefix: string; max: number };
}

/** 繰り返しセクション：パスから項目番号を求める（項目でなければ null） */
function repeatIndexOf(path: string, prefix: string): number | null {
  if (!prefix || !path.startsWith(prefix)) return null;
  const seg = path.slice(prefix.length).split(".")[0];
  return /^\d+$/.test(seg) ? parseInt(seg, 10) : null;
}

interface FieldGroup {
  label: string;
  fields: PageField[];
  /** 通し番号の開始値（ページ全体でのフィールド番号を維持するため） */
  start: number;
}

/** DOM順のフィールド一覧を、連続する同一セクションごとのグループにまとめる */
function groupFields(fields: PageField[]): FieldGroup[] {
  const groups: FieldGroup[] = [];
  let n = 0;
  for (const f of fields) {
    const label = f.section || "その他";
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.fields.push(f);
    else groups.push({ label, fields: [f], start: n });
    n++;
  }
  return groups;
}

export function PageFields({
  fields,
  draft,
  base,
  onChange,
  selectedPath,
  onFocusField,
}: {
  fields: PageField[];
  draft: Content;
  base: Content;
  onChange: (next: Content) => void;
  selectedPath: string | null;
  onFocusField: (path: string) => void;
}) {
  // 開いているグループ（既定はすべて閉じた状態）
  const [open, setOpen] = useState<Set<number>>(new Set());
  const groups = groupFields(fields);

  // プレビューで要素をクリックしたら、そのフィールドが属するグループを開いてスクロール
  useEffect(() => {
    if (!selectedPath) return;
    const gi = groupFields(fields).findIndex((g) => g.fields.some((f) => f.path === selectedPath));
    if (gi < 0) return;
    setOpen((prev) => (prev.has(gi) ? prev : new Set(prev).add(gi)));
    const t = setTimeout(() => {
      document
        .querySelector(`[data-fieldpath="${selectedPath.replace(/["\\]/g, "\\$&")}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
    return () => clearTimeout(t);
  }, [selectedPath, fields]);

  if (fields.length === 0) {
    return (
      <div className="p-6 text-center text-[13px] text-slate-400">
        このページには編集できる要素が見つかりませんでした。
        <br />
        別のページを選ぶか、「プレビュー再読み込み」を押してください。
      </div>
    );
  }

  function val(f: PageField): string {
    const v = getValueByPath(draft, f.path);
    return v !== undefined ? v : f.value;
  }

  function renderField(f: PageField, i: number) {
    const active = selectedPath === f.path;
    // 未公開バッジ: 下書きの値が公開済み（base）と異なるとき
    const dirty = (getValueByPath(draft, f.path) ?? "") !== (getValueByPath(base, f.path) ?? "");
    // 画面幅ごとの非表示設定（overrides の `hide:<パス>` に 'sp' | 'pc' | 'sp,pc'）
    const hideKey = `hide:${f.path}`;
    const hideVal = getValueByPath(draft, hideKey) || "";
    const toggleHide = (which: "sp" | "pc") => {
      const parts = new Set(hideVal.split(",").filter(Boolean));
      if (parts.has(which)) parts.delete(which);
      else parts.add(which);
      onChange(setValueByPath(draft, hideKey, [...parts].join(",")));
    };
    // 文字色（overrides の `color:<パス>` に #rrggbb。空＝既定色）
    const colorKey = `color:${f.path}`;
    const colorVal = getValueByPath(draft, colorKey) || "";
    return (
      <div
        key={f.path}
        data-fieldpath={f.path}
        onMouseDown={() => onFocusField(f.path)}
        className={
          "rounded-lg border bg-white p-3 shadow-sm transition-colors " +
          (active ? "border-emerald-500 ring-1 ring-emerald-500" : "border-slate-200")
        }
      >
        <div className="mb-1 flex items-center gap-2">
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-400">{i + 1}</span>
          <span className="text-[12px] font-medium text-slate-500">{f.label}</span>
          <span className="ml-auto text-[10px] text-slate-300">
            {f.kind === "image" ? "画像" : f.kind === "select" ? "設定" : f.multiline ? "文章" : "テキスト"}
          </span>
          {dirty && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700">未公開</span>
          )}
        </div>

        {/* 画面幅ごとの非表示トグル */}
        <div className="mb-1.5 flex items-center gap-1.5">
          {(
            [
              ["sp", "SPで非表示"],
              ["pc", "PCで非表示"],
            ] as const
          ).map(([which, label]) => {
            const onNow = hideVal.includes(which);
            return (
              <button
                key={which}
                type="button"
                aria-pressed={onNow}
                onClick={() => toggleHide(which)}
                className={
                  "rounded border px-1.5 py-0.5 text-[10px] font-medium transition-colors " +
                  (onNow
                    ? "border-rose-500 bg-rose-500 text-white"
                    : "border-slate-300 bg-white text-slate-500 hover:bg-slate-50")
                }
              >
                {label}
              </button>
            );
          })}
          {hideVal && (
            <span className="text-[10px] text-slate-400">
              {hideVal === "sp,pc" || hideVal === "pc,sp"
                ? "SP・PCとも非表示"
                : hideVal === "sp"
                  ? "SPでは表示されません"
                  : "PCでは表示されません"}
            </span>
          )}
        </div>

        {/* スクロール連動アニメーション（この要素単体） */}
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
          <AnimControls draft={draft} animKey={`anim:${f.path}`} onChange={onChange} />
        </div>

        {/* 文字色（テキスト要素のみ。既定は各デザインの色＝ピッカーの初期表示は黒） */}
        {f.kind === "text" && (
          <div className="mb-1.5 flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500">文字色</span>
            <input
              type="color"
              value={colorVal || "#000000"}
              onChange={(e) => onChange(setValueByPath(draft, colorKey, e.target.value))}
              aria-label="文字色"
              className="h-5 w-8 cursor-pointer rounded border border-slate-300 bg-white p-0"
            />
            {colorVal ? (
              <>
                <span className="text-[10px] tabular-nums text-slate-500">{colorVal}</span>
                <button
                  type="button"
                  onClick={() => onChange(setValueByPath(draft, colorKey, ""))}
                  className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] text-slate-500 transition-colors hover:bg-slate-50"
                >
                  既定に戻す
                </button>
              </>
            ) : (
              <span className="text-[10px] text-slate-400">既定色のまま</span>
            )}
          </div>
        )}

        {f.kind === "select" ? (
          <Select
            value={val(f)}
            onChange={(e) => onChange(setValueByPath(draft, f.path, e.target.value))}
          >
            {(f.options ?? []).map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        ) : f.kind === "image" ? (
          <>
            <ImageField label="" value={val(f)} onChange={(url) => onChange(setValueByPath(draft, f.path, url))} />
            {/* 画像と文章の横並びグリッド内の画像には、幅の比率スライダーを統合表示。
                ドラッグ中の値は左のプレビューへ即時反映される（editBridge が --ratio を更新） */}
            {f.ratio && (() => {
              const raw = parseInt(getValueByPath(draft, f.ratio!.path) ?? "", 10);
              const cur = Math.min(70, Math.max(30, Number.isNaN(raw) ? f.ratio!.def : raw));
              return (
                <div className="mt-2 flex items-center gap-2">
                  <span className="shrink-0 text-[11px] font-medium text-slate-500">画像の幅</span>
                  <input
                    type="range"
                    min={30}
                    max={70}
                    step={1}
                    value={cur}
                    onChange={(e) => onChange(setValueByPath(draft, f.ratio!.path, e.target.value))}
                    className="min-w-0 flex-1 accent-emerald-600"
                  />
                  <span className="w-20 shrink-0 text-right text-[11px] tabular-nums text-slate-600">
                    {cur}% : {100 - cur}%
                  </span>
                </div>
              );
            })()}
            {/* 横並びグリッド（画像＋文章）を1つのまとまりとしてアニメーションさせる設定 */}
            {f.ratio && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5 rounded-md bg-slate-50 px-2 py-1.5">
                <span className="shrink-0 text-[11px] font-medium text-slate-500">横並び全体（画像＋文章まとめて）</span>
                <AnimControls
                  draft={draft}
                  animKey={`anim:${f.ratio.path}`}
                  onChange={onChange}
                  ariaLabel="横並び全体のアニメーション"
                />
              </div>
            )}
          </>
        ) : f.multiline ? (
          <TextArea
            rows={4}
            value={val(f)}
            onChange={(e) => onChange(setValueByPath(draft, f.path, e.target.value))}
          />
        ) : (
          <TextInput value={val(f)} onChange={(e) => onChange(setValueByPath(draft, f.path, e.target.value))} />
        )}
        {/* 動画URLフィールド：ファイルの直接アップロードにも対応 */}
        {f.kind === "text" && f.video && (
          <VideoUploadButton onDone={(url) => onChange(setValueByPath(draft, f.path, url))} />
        )}
      </div>
    );
  }

  /** グループ内フィールドの描画。繰り返しセクション（項目数フィールドを含む）は
   * フロントエンドに表示されている項目だけを「項目n」ごとに区切って表示し、
   * 「追加」「削除」ボタンで項目数を操作できるようにする。 */
  function renderGroupFields(g: FieldGroup): ReactNode {
    const rf = g.fields.find((f) => f.repeat);
    if (!rf || !rf.repeat) return g.fields.map((f, fi) => renderField(f, g.start + fi));
    const { prefix, max } = rf.repeat;
    const countRaw = parseInt(getValueByPath(draft, rf.path) ?? rf.value, 10);
    const count = Math.min(max, Math.max(1, Number.isNaN(countRaw) ? 1 : countRaw));

    // 項目番号ごとに振り分け（項目数フィールド自体はボタンで操作するため非表示）
    const baseFields: PageField[] = [];
    const items = new Map<number, PageField[]>();
    for (const f of g.fields) {
      if (f.path === rf.path) continue;
      const idx = repeatIndexOf(f.path, prefix);
      if (idx === null) baseFields.push(f);
      else {
        if (!items.has(idx)) items.set(idx, []);
        items.get(idx)!.push(f);
      }
    }

    // 値と付随設定（非表示・アニメ・色・比率）をまとめて書き換えるヘルパー
    const auxPrefixes = ["hide:", "anim:", "color:"] as const;
    const clearItem = (next: Content, fs: PageField[]): Content => {
      for (const f of fs) {
        next = setValueByPath(next, f.path, "");
        for (const pre of auxPrefixes) next = setValueByPath(next, pre + f.path, "");
        if (f.ratio) {
          next = setValueByPath(next, f.ratio.path, "");
          next = setValueByPath(next, "anim:" + f.ratio.path, "");
        }
      }
      return next;
    };

    const removeItem = (idx: number) => {
      if (!confirm(`項目${idx + 1}を削除しますか？（後ろの項目が繰り上がります）`)) return;
      let next = draft;
      // idx 以降へ、次の項目の内容（表示中の実効値）と付随設定を繰り上げコピー
      for (let n = idx; n < count - 1; n++) {
        for (const f of items.get(n + 1) ?? []) {
          const toP = f.path.replace(prefix + (n + 1) + ".", prefix + n + ".");
          next = setValueByPath(next, toP, (getValueByPath(next, f.path) ?? f.value) ?? "");
          for (const pre of auxPrefixes) {
            next = setValueByPath(next, pre + toP, getValueByPath(next, pre + f.path) ?? "");
          }
          if (f.ratio) {
            const rTo = f.ratio.path.replace(prefix + (n + 1) + ".", prefix + n + ".");
            next = setValueByPath(next, rTo, getValueByPath(next, f.ratio.path) ?? "");
            next = setValueByPath(next, "anim:" + rTo, getValueByPath(next, "anim:" + f.ratio.path) ?? "");
          }
        }
      }
      // 末尾の項目は初期状態に戻し、項目数を1減らす
      next = clearItem(next, items.get(count - 1) ?? []);
      next = setValueByPath(next, rf.path, String(count - 1));
      onChange(next);
    };

    const addItem = () => {
      // 新しく表示する枠は初期状態（以前の入力の残りをクリア）で始める
      let next = clearItem(draft, items.get(count) ?? []);
      next = setValueByPath(next, rf.path, String(count + 1));
      onChange(next);
    };

    let n = g.start;
    const out: ReactNode[] = baseFields.map((f) => renderField(f, n++));
    const sortedIdx = [...items.keys()].sort((a, b) => a - b).filter((i) => i < count);
    for (const idx of sortedIdx) {
      out.push(
        <div key={`hdr-${idx}`} className="flex items-center justify-between pt-1">
          <span className="text-[11px] font-bold text-slate-500">項目 {idx + 1}</span>
          <button
            type="button"
            onClick={() => removeItem(idx)}
            disabled={count <= 1}
            className="rounded border border-rose-300 bg-white px-2 py-0.5 text-[10px] font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-40"
          >
            削除
          </button>
        </div>
      );
      for (const f of items.get(idx)!) out.push(renderField(f, n++));
    }
    out.push(
      <button
        key="add-item"
        type="button"
        onClick={addItem}
        disabled={count >= max}
        className="w-full rounded border border-dashed border-slate-300 bg-white py-2 text-[11px] font-medium text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-40"
      >
        ＋ 項目を追加（{count}/{max}）
      </button>
    );
    return out;
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] leading-relaxed text-slate-500">
        セクションをクリックすると中の項目が開きます。プレビュー内の見出し・本文・
        画像をクリックしても該当項目が開きます。「SPで非表示」「PCで非表示」で
        画面幅ごとに隠せます。本文では行頭に「・」を付けるとその行がリスト
        （箇条書き）になり、[[red:文字]] や [[#0000ff:文字]] と書くと
        その部分だけ文字色を変えられます。
      </p>
      {groups.map((g, gi) => {
        const isOpen = open.has(gi);
        // グループ内の未公開（下書きが公開値と異なる）件数
        const dirtyCount = g.fields.filter(
          (f) => (getValueByPath(draft, f.path) ?? "") !== (getValueByPath(base, f.path) ?? "")
        ).length;
        // セクションごとの表示/非表示（overrides の hidesec:<先頭フィールドのパス>）
        const secKey = `hidesec:${g.fields[0].path}`;
        const secHidden = (getValueByPath(draft, secKey) || "") === "1";
        return (
          <div key={`${gi}:${g.label}`} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex w-full items-center gap-2 px-3 py-2 transition-colors hover:bg-slate-50">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() =>
                  setOpen((prev) => {
                    const next = new Set(prev);
                    if (next.has(gi)) next.delete(gi);
                    else next.add(gi);
                    return next;
                  })
                }
                className="flex min-w-0 flex-1 items-center gap-2 py-0.5 text-left"
              >
                <span
                  className={"text-[10px] text-slate-400 transition-transform " + (isOpen ? "rotate-90" : "")}
                  aria-hidden
                >
                  ▶
                </span>
                <span className={"min-w-0 flex-1 truncate text-[12px] font-bold " + (secHidden ? "text-slate-400 line-through" : "text-slate-700")}>
                  {g.label}
                </span>
              </button>
              {dirtyCount > 0 && (
                <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700">未公開 {dirtyCount}</span>
              )}
              <span className="shrink-0 text-[10px] text-slate-400">{g.fields.length}項目</span>
              {/* セクションごとの表示/非表示トグル */}
              <button
                type="button"
                aria-pressed={secHidden}
                title={secHidden ? "このセクションを表示する" : "このセクションを非表示にする"}
                onClick={() => onChange(setValueByPath(draft, secKey, secHidden ? "" : "1"))}
                className={
                  "shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium transition-colors " +
                  (secHidden
                    ? "border-rose-500 bg-rose-500 text-white"
                    : "border-slate-300 bg-white text-slate-500 hover:bg-slate-50")
                }
              >
                {secHidden ? "非表示中" : "表示中"}
              </button>
            </div>
            {isOpen && (
              <div className="space-y-3 border-t border-slate-100 bg-slate-50/60 p-2.5">
                {secHidden && (
                  <p className="rounded bg-rose-50 px-2 py-1 text-[11px] text-rose-600">
                    このセクションは公開ページで非表示になっています（「非表示中」を押すと戻せます）。
                  </p>
                )}
                {renderGroupFields(g)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
