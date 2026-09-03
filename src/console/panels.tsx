// /console 各コンテンツ種別の編集パネル。
// ページ編集タブで、プレビュー中のページに応じて右パネルへ差し込まれる
// 「構造化マネージャ」（追加・削除・並べ替えを伴う編集）の実装。
// ※ お知らせ（旧 NewsPanel）は Payload CMS（/admin）へ移行済み。
import { VideoItem, InterviewItem } from "./content";
import { Field, TextInput, Button, Card, Collapsible, VideoPathHint } from "./ui";
import { ImageField } from "./ImageField";
import { VideoUploadButton } from "./VideoUploadButton";
import { BlockEditor } from "./BlockEditor";

// 動画ファイルのアップロードボタンは VideoUploadButton.tsx（2026-09-03 復活・Vercel Blob へ直接アップロード）。
// 案内文は ui.tsx の VideoPathHint。

export function genId(prefix: string): string {
  // 時刻に依存しない簡易ユニークID
  return `${prefix}-${Math.floor(performance.now() * 1000).toString(36)}${Math.floor(performance.now()).toString(36)}`;
}

/* ===================== セクション動画（汎用） ===================== */
// sections.json 直下の「動画URL 1本」を編集する汎用パネル。
//  - recruitIntroVideo: 採用ページ ヒーローメッセージと事業紹介の間の紹介動画
//  - recruit2Video:     採用2「人を知る」の紹介動画
// 空欄ならページ側でセクション自体を非表示にする。
export function SectionVideoPanel({
  value,
  onChange,
  sectionKey,
  title,
}: {
  value: any;
  onChange: (v: any) => void;
  sectionKey: string;
  title: string;
}) {
  const url: string = value?.[sectionKey] ?? "";
  const setUrl = (v: string) => onChange({ ...value, [sectionKey]: v });
  return (
    <div className="space-y-4">
      <Card title={title}>
        <Field
          label="動画URL"
          hint="YouTube・Vimeo の共有URL、または mp4・webm 等の直リンク。下のボタンから動画ファイルを直接アップロードもできます。空欄ならセクション自体を非表示。"
        >
          <div className="space-y-2">
            <TextInput
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://… または /videos/xxx.mp4"
            />
            <VideoUploadButton onUploaded={setUrl} />
            <VideoPathHint />
          </div>
        </Field>
      </Card>
    </div>
  );
}

/* ===================== 採用3 背景動画 ===================== */
// 採用3ページのメインビジュアル以下の背景に敷く動画（最大5本）を設定する。
// 値は sections.json の recruit3Bg に保存: { videos: string[] }。
// 動画は素の色のまま描画され、上に淡いブルー〜白の薄いベールを重ねてコンテンツの背面に敷かれる。
// ページ側はスクロール量に応じて 1本目の先頭フレーム 〜 最終本の最終フレームを再生位置として割り当てる。
export const R3_BG_MAX = 5;

type R3Bg = { videos: string[] };

/** sections から採用3背景動画の設定を安全に取り出す（キー欠落・型違いに耐える） */
export function readR3Bg(sections: any): R3Bg {
  const raw = sections?.recruit3Bg ?? {};
  const videos = (Array.isArray(raw.videos) ? raw.videos : [])
    .filter((v: any) => typeof v === "string")
    .slice(0, R3_BG_MAX);
  return { videos };
}

export function Recruit3BgPanel({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  const cfg = readR3Bg(value);
  const set = (patch: Partial<R3Bg>) =>
    onChange({ ...value, recruit3Bg: { ...cfg, ...patch } });
  const setVideo = (i: number, url: string) => {
    const next = cfg.videos.slice();
    next[i] = url;
    set({ videos: next });
  };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= cfg.videos.length) return;
    const next = cfg.videos.slice();
    [next[i], next[j]] = [next[j], next[i]];
    set({ videos: next });
  };
  const remove = (i: number) => {
    if (!confirm(`背景動画 ${i + 1} を削除しますか？`)) return;
    set({ videos: cfg.videos.filter((_, idx) => idx !== i) });
  };

  return (
    <div className="space-y-4">
      <p className="text-[12px] text-slate-500">
        採用3ページのメインビジュアル以下の背景に敷く動画です（最大 {R3_BG_MAX} 本）。
        MV直下が1本目の先頭フレーム、ページ最下端が最終本の最終フレームになるよう、
        スクロールに追随して再生位置が変わります。上から順に再生されます。
        動画の上には淡いブルー〜白の薄いベールがかかり、コンテンツは常に動画の前面に表示されます。
        設定はプレビューには即時反映されません（「更新（本番へ公開）」後に反映されます）。
      </p>

      <div className="flex items-center justify-between">
        <p className="text-[12px] text-slate-500">{cfg.videos.length} / {R3_BG_MAX} 本</p>
        <Button
          variant="primary"
          onClick={() => set({ videos: [...cfg.videos, ""] })}
          disabled={cfg.videos.length >= R3_BG_MAX}
        >
          ＋ 背景動画を追加
        </Button>
      </div>

      {cfg.videos.length === 0 && (
        <p className="rounded-md border border-dashed border-slate-300 p-6 text-center text-[12px] text-slate-400">
          背景動画がありません。「＋ 背景動画を追加」から登録してください。
          （0本の場合、背景は採用2と同じパララックス背景になります）
        </p>
      )}

      {cfg.videos.map((url, i) => (
        <Card
          key={i}
          title={`背景動画 ${i + 1}`}
          action={
            <div className="flex gap-1">
              <Button onClick={() => move(i, -1)} disabled={i === 0}>↑</Button>
              <Button onClick={() => move(i, 1)} disabled={i === cfg.videos.length - 1}>↓</Button>
              <Button variant="danger" onClick={() => remove(i)}>削除</Button>
            </div>
          }
        >
          <Field
            label="動画URL"
            hint="mp4・webm 等の直リンク（下のボタンでアップロード、または public/videos/ のパス）。YouTube・Vimeo の共有URLはスクロール追随できないため使用できません。"
          >
            <div className="space-y-2">
              <TextInput
                value={url}
                onChange={(e) => setVideo(i, e.target.value)}
                placeholder="/videos/xxx.mp4"
              />
              <VideoUploadButton onUploaded={(u) => setVideo(i, u)} />
              <VideoPathHint />
            </div>
          </Field>
        </Card>
      ))}
    </div>
  );
}

/* ===================== 動画 ===================== */
export function VideosPanel({ value, onChange }: { value: VideoItem[]; onChange: (v: VideoItem[]) => void }) {
  function update(i: number, patch: Partial<VideoItem>) {
    const next = value.slice();
    next[i] = { ...next[i], ...patch };
    onChange(next);
  }
  function add() {
    onChange([...value, { id: genId("v"), title: "新しい動画", duration: "00:00", thumb: "", videoUrl: "" }]);
  }
  function remove(i: number) {
    if (!confirm("この動画を削除しますか？")) return;
    onChange(value.filter((_, idx) => idx !== i));
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-slate-500">「動画で知るアイスライン」ページに表示されます。</p>
        <Button variant="primary" onClick={add}>＋ 動画を追加</Button>
      </div>
      {value.map((v, i) => (
        <div key={v.id} data-focus={v.id}>
          <Collapsible title={v.title || "（無題）"} action={<Button variant="danger" onClick={() => remove(i)}>削除</Button>}>
            <Field label="タイトル">
              <TextInput value={v.title} onChange={(e) => update(i, { title: e.target.value })} />
            </Field>
            <div className="mt-3">
              <Field label="動画URL" hint="YouTube・Vimeo の共有URL、または mp4・webm 等の直リンク。下のボタンから動画ファイルを直接アップロードもできます。空欄なら「準備中」表示。">
                <div className="space-y-2">
                  <TextInput value={v.videoUrl} onChange={(e) => update(i, { videoUrl: e.target.value })} placeholder="https://www.youtube.com/watch?v=... または /videos/xxx.mp4" />
                  <VideoUploadButton onUploaded={(url) => update(i, { videoUrl: url })} />
                  <VideoPathHint />
                </div>
              </Field>
            </div>
            <div className="mt-3">
              <Field label="再生時間（表示用）" hint="例: 03:24">
                <TextInput value={v.duration} onChange={(e) => update(i, { duration: e.target.value })} className="max-w-[140px]" />
              </Field>
            </div>
            <div className="mt-3">
              <ImageField label="サムネイル画像" value={v.thumb} onChange={(url) => update(i, { thumb: url })} />
            </div>
          </Collapsible>
        </div>
      ))}
    </div>
  );
}

/* ===================== 社員インタビュー ===================== */
export function InterviewsPanel({ value, onChange }: { value: InterviewItem[]; onChange: (v: InterviewItem[]) => void }) {
  function update(i: number, patch: Partial<InterviewItem>) {
    const next = value.slice();
    next[i] = { ...next[i], ...patch };
    onChange(next);
  }
  function add() {
    onChange([
      ...value,
      {
        id: genId("iv"),
        name: "氏名",
        role: "所属・役職",
        years: "入社○年",
        lead: "見出しコピー",
        subtitle: "サブタイトル",
        blocks: [{ type: "paragraph", text: "本文を入力してください。" }],
        image: "",
      },
    ]);
  }
  function remove(i: number) {
    if (!confirm("このインタビューを削除しますか？")) return;
    onChange(value.filter((_, idx) => idx !== i));
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-slate-500">採用ページ「人を知る」に表示されます。</p>
        <Button variant="primary" onClick={add}>＋ インタビューを追加</Button>
      </div>
      {value.map((iv, i) => (
        <div key={iv.id} data-focus={iv.id}>
          <Collapsible title={`${iv.name}（${iv.role}）`} action={<Button variant="danger" onClick={() => remove(i)}>削除</Button>}>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="氏名"><TextInput value={iv.name} onChange={(e) => update(i, { name: e.target.value })} /></Field>
              <Field label="所属・役職"><TextInput value={iv.role} onChange={(e) => update(i, { role: e.target.value })} /></Field>
              <Field label="在籍年数"><TextInput value={iv.years} onChange={(e) => update(i, { years: e.target.value })} /></Field>
            </div>
            <div className="mt-3">
              <Field label="見出しコピー（リード）"><TextInput value={iv.lead} onChange={(e) => update(i, { lead: e.target.value })} /></Field>
            </div>
            <div className="mt-3">
              <Field label="サブタイトル"><TextInput value={iv.subtitle} onChange={(e) => update(i, { subtitle: e.target.value })} /></Field>
            </div>
            <div className="mt-3">
              <ImageField label="メイン画像" value={iv.image} onChange={(url) => update(i, { image: url })} />
            </div>
            <div className="mt-3">
              <span className="mb-1 block text-[13px] font-medium text-slate-600">本文</span>
              <BlockEditor value={iv.blocks} onChange={(blocks) => update(i, { blocks })} />
            </div>
          </Collapsible>
        </div>
      ))}
    </div>
  );
}

/* ===================== 会社紹介資料（採用ページ COMPANY PROFILE） ===================== */
export function ProfileSlidesPanel({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  function update(i: number, url: string) {
    const next = value.slice();
    next[i] = url;
    onChange(next);
  }
  function add() {
    onChange([...value, ""]);
  }
  function remove(i: number) {
    if (!confirm("このスライドを削除しますか？")) return;
    onChange(value.filter((_, idx) => idx !== i));
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-slate-500">採用ページ「会社紹介資料」に横スクロールで表示されます（16:9 推奨）。</p>
        <Button variant="primary" onClick={add}>＋ スライドを追加</Button>
      </div>
      {value.length === 0 && (
        <p className="rounded-md border border-dashed border-slate-300 p-6 text-center text-[12px] text-slate-400">
          スライドがありません。「＋ スライドを追加」から登録してください。
        </p>
      )}
      {value.map((url, i) => (
        <Card key={i} title={`スライド ${i + 1}`} action={<Button variant="danger" onClick={() => remove(i)}>削除</Button>}>
          <ImageField label="スライド画像" value={url} onChange={(u) => update(i, u)} hint="PowerPointのページを画像（PNG/JPG）にして登録してください。" />
        </Card>
      ))}
    </div>
  );
}

/* ===================== お問い合わせ設定 ===================== */
export function ContactSettingsPanel({ value, onChange }: { value: { recipient: string }; onChange: (v: { recipient: string }) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-[12px] text-slate-500">
        お問い合わせフォームから送信された内容の通知先メールアドレスを設定します。「更新（本番へ公開）」後に反映されます。
      </p>
      <Card title="お問い合わせメール送信先">
        <Field label="送信先メールアドレス" hint="例: info@iceline.co.jp。空欄の場合はサーバー設定（環境変数）が使用されます。">
          <TextInput
            value={value.recipient}
            onChange={(e) => onChange({ ...value, recipient: e.target.value })}
            placeholder="info@example.com"
          />
        </Field>
      </Card>
    </div>
  );
}
