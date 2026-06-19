// /console 用の小さな共通フォーム部品（サイト本体のUIとは独立、依存を最小化）。
import React from "react";

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[13px] font-medium text-slate-600">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-slate-400">{hint}</span>}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={
        "w-full rounded-md border border-slate-300 px-3 py-2 text-[14px] outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 " +
        (props.className || "")
      }
    />
  );
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function TextArea(props, ref) {
    return (
      <textarea
        ref={ref}
        {...props}
        className={
          "w-full rounded-md border border-slate-300 px-3 py-2 text-[14px] leading-relaxed outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 " +
          (props.className || "")
        }
      />
    );
  }
);

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={
        "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-[14px] outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 " +
        (props.className || "")
      }
    />
  );
}

export function Button({
  variant = "default",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "primary" | "danger" | "ghost" }) {
  const styles: Record<string, string> = {
    default: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
    primary: "bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50",
    danger: "border border-red-200 bg-white text-red-600 hover:bg-red-50",
    ghost: "text-slate-500 hover:bg-slate-100",
  };
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3.5 py-2 text-[13px] font-medium transition-colors disabled:cursor-not-allowed ${styles[variant]} ${className}`}
    />
  );
}

/** 折りたたみ可能なカード（既定は閉。記事が増えても一覧しやすいように） */
export function Collapsible({
  title,
  action,
  defaultOpen = false,
  children,
}: {
  title: React.ReactNode;
  action?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex flex-1 items-center gap-2 text-left"
          aria-expanded={open}
        >
          <span className={"text-[11px] text-slate-400 transition-transform " + (open ? "rotate-90" : "")}>▶</span>
          <span className="text-[14px] font-semibold text-slate-800">{title}</span>
        </button>
        {action}
      </div>
      {open && <div className="border-t border-slate-100 p-4">{children}</div>}
    </div>
  );
}

export function Card({ title, children, action }: { title?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div id={undefined} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between">
          {title && <h4 className="text-[14px] font-semibold text-slate-800">{title}</h4>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
