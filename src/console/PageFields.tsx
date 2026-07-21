// ページ単位エディタ：現在プレビュー中ページの編集可能要素を、DOM順に並べて編集する。
import { Content, getValueByPath, setValueByPath } from "./content";
import { Field, TextInput, TextArea, Select } from "./ui";
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
  onChange,
  selectedPath,
  onFocusField,
}: {
  fields: PageField[];
  draft: Content;
  onChange: (next: Content) => void;
  selectedPath: string | null;
  onFocusField: (path: string) => void;
}) {
  if (fields.length === 0) {
    return (
      <div className="p-6 text-center text-[13px] text-slate-400">
        このページには編集できる要素が見つかりませんでした。
        <br />
        左のプレビューで別のページを選ぶか、少し待ってから再度お試しください。
      </div>
    );
  }

  function val(f: PageField): string {
    const v = getValueByPath(draft, f.path);
    return v !== undefined ? v : f.value;
  }

  return (
    <div className="space-y-3">
      {fields.map((f, i) => {
        const active = selectedPath === f.path;
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
