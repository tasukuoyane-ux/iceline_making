import { useEffect, useState } from "react";
import { Link } from "react-router";

const KEY = "iceline-cookie-consent";

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      /* localStorage 不可の環境では非表示 */
    }
  }, []);

  function accept() {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* noop */
    }
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] border-t border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] flex-col items-center gap-3 px-5 py-3 pc:flex-row pc:px-8">
        <p className="text-muted-foreground" style={{ fontSize: 12, lineHeight: 1.7 }}>
          当サイトでは利便性向上のためCookieを使用します。詳しくは
          <Link to="/privacy" className="text-brand underline-offset-2 hover:underline">プライバシーポリシー</Link>
          をご覧ください。
        </p>
        <button
          type="button"
          onClick={accept}
          className="shrink-0 rounded-full bg-brand px-6 py-1.5 text-brand-foreground transition-colors hover:bg-brand-dark pc:ml-auto"
          style={{ fontSize: 12, fontWeight: 700 }}
        >
          同意する
        </button>
      </div>
    </div>
  );
}
