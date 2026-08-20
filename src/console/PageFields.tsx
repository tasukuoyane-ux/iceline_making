// ページ単位エディタ：現在プレビュー中ページの編集可能要素を、DOM順に並べて編集する。
import { Content, getValueByPath, setValueByPath } from "./content";
import { Select, TextArea, TextInput } from "./ui";
import { ImageField } from "./ImageField";

export interface PageField {
  path: string;
  kind: "text" | "image" | "select";
  value: string; // ライブDOM上の現在値（未編集時の既定値）
  label: string;
  multiline: boolean;
  options?: { value: string; label: string }[]; // kind === "select" のみ
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

  return (
    <div className="space-y-3">
      <p className="text-[11px] leading-relaxed text-slate-500">
        プレビュー内の見出し・本文・画像をクリックすると、その項目がここで開きます。
        「SPで非表示」「PCで非表示」でその要素を画面幅ごとに隠せます。
      </p>
      {fields.map((f, i) => {
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
              <ImageField label="" value={val(f)} onChange={(url) => onChange(setValueByPath(draft, f.path, url))} />
            ) : f.multiline ? (
              <TextArea
                rows={4}
                value={val(f)}
                onChange={(e) => onChange(setValueByPath(draft, f.path, e.target.value))}
              />
            ) : (
              <TextInput value={val(f)} onChange={(e) => onChange(setValueByPath(draft, f.path, e.target.value))} />
            )}
          </div>
        );
      })}
    </div>
  );
}
