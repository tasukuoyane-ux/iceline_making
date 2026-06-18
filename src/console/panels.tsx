// /console 各コンテンツ種別の編集パネル。
import { Content, NewsItem, VideoItem, InterviewItem, NEWS_CATEGORIES } from "./content";
import { Field, TextInput, TextArea, Select, Button, Card } from "./ui";
import { ImageField } from "./ImageField";

function genId(prefix: string): string {
  // 時刻に依存しない簡易ユニークID
  return `${prefix}-${Math.floor(performance.now() * 1000).toString(36)}${Math.floor(performance.now()).toString(36)}`;
}

/* ===================== お知らせ ===================== */
export function NewsPanel({ value, onChange }: { value: NewsItem[]; onChange: (v: NewsItem[]) => void }) {
  function update(i: number, patch: Partial<NewsItem>) {
    const next = value.slice();
    next[i] = { ...next[i], ...patch };
    onChange(next);
  }
  function add() {
    const item: NewsItem = { id: genId("n"), date: "2026.01.01", category: "お知らせ", title: "新しいお知らせ", body: "本文を入力してください。" };
    onChange([item, ...value]);
  }
  function remove(i: number) {
    if (!confirm("このお知らせを削除しますか？")) return;
    onChange(value.filter((_, idx) => idx !== i));
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-slate-500">記事は新しいものが上に表示されます。</p>
        <Button variant="primary" onClick={add}>＋ お知らせを追加</Button>
      </div>
      {value.map((n, i) => (
        <div key={n.id} data-focus={n.id}>
          <Card
            title={n.title || "（無題）"}
            action={<Button variant="danger" onClick={() => remove(i)}>削除</Button>}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="日付" hint="例: 2026.06.01">
                <TextInput value={n.date} onChange={(e) => update(i, { date: e.target.value })} />
              </Field>
              <Field label="カテゴリ">
                <Select value={n.category} onChange={(e) => update(i, { category: e.target.value as NewsItem["category"] })}>
                  {NEWS_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="mt-3">
              <Field label="タイトル">
                <TextInput value={n.title} onChange={(e) => update(i, { title: e.target.value })} />
              </Field>
            </div>
            <div className="mt-3">
              <Field label="本文">
                <TextArea rows={4} value={n.body} onChange={(e) => update(i, { body: e.target.value })} />
              </Field>
            </div>
          </Card>
        </div>
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
          <Card title={v.title || "（無題）"} action={<Button variant="danger" onClick={() => remove(i)}>削除</Button>}>
            <Field label="タイトル">
              <TextInput value={v.title} onChange={(e) => update(i, { title: e.target.value })} />
            </Field>
            <div className="mt-3">
              <Field label="動画URL" hint="YouTube・Vimeo の共有URL、または mp4 等の直リンク。空欄なら「準備中」表示。">
                <TextInput value={v.videoUrl} onChange={(e) => update(i, { videoUrl: e.target.value })} placeholder="https://www.youtube.com/watch?v=..." />
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
          </Card>
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
  function updatePara(i: number, pi: number, text: string) {
    const paras = value[i].paragraphs.slice();
    paras[pi] = text;
    update(i, { paragraphs: paras });
  }
  function addPara(i: number) {
    update(i, { paragraphs: [...value[i].paragraphs, ""] });
  }
  function removePara(i: number, pi: number) {
    update(i, { paragraphs: value[i].paragraphs.filter((_, idx) => idx !== pi) });
  }
  function add() {
    onChange([
      ...value,
      { id: genId("iv"), name: "氏名", role: "所属・役職", years: "入社○年", lead: "見出しコピー", paragraphs: ["本文を入力してください。"], image: "" },
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
          <Card title={`${iv.name}（${iv.role}）`} action={<Button variant="danger" onClick={() => remove(i)}>削除</Button>}>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="氏名"><TextInput value={iv.name} onChange={(e) => update(i, { name: e.target.value })} /></Field>
              <Field label="所属・役職"><TextInput value={iv.role} onChange={(e) => update(i, { role: e.target.value })} /></Field>
              <Field label="在籍年数"><TextInput value={iv.years} onChange={(e) => update(i, { years: e.target.value })} /></Field>
            </div>
            <div className="mt-3">
              <Field label="見出しコピー（リード）"><TextInput value={iv.lead} onChange={(e) => update(i, { lead: e.target.value })} /></Field>
            </div>
            <div className="mt-3">
              <ImageField label="メイン画像" value={iv.image} onChange={(url) => update(i, { image: url })} />
            </div>
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[13px] font-medium text-slate-600">本文（段落）</span>
                <Button onClick={() => addPara(i)}>＋ 段落を追加</Button>
              </div>
              <div className="space-y-2">
                {iv.paragraphs.map((p, pi) => (
                  <div key={pi} className="flex gap-2">
                    <TextArea rows={3} value={p} onChange={(e) => updatePara(i, pi, e.target.value)} />
                    <Button variant="ghost" onClick={() => removePara(i, pi)}>×</Button>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      ))}
    </div>
  );
}

/* ===================== 画像 ===================== */
const IMAGE_GROUP_LABELS: Record<string, string> = {
  IMG: "共通画像（トップ・各ページで使用）",
  PRODUCT_IMG: "商品画像",
  INTERVIEW_IMG: "インタビュー画像（旧・互換用）",
};

export function ImagesPanel({ value, onChange }: { value: Content["images"]; onChange: (v: Content["images"]) => void }) {
  function set(group: keyof Content["images"], key: string, url: string) {
    onChange({ ...value, [group]: { ...value[group], [key]: url } });
  }
  return (
    <div className="space-y-6">
      <p className="text-[12px] text-slate-500">
        各画像の「画像をアップロード」からPCの画像に差し替えられます。URLを直接貼り付けることもできます。
      </p>
      {(["IMG", "PRODUCT_IMG", "INTERVIEW_IMG"] as const).map((group) => (
        <div key={group}>
          <h4 className="mb-2 text-[14px] font-semibold text-slate-800">{IMAGE_GROUP_LABELS[group]}</h4>
          <div className="space-y-3">
            {Object.entries(value[group]).map(([key, url]) => (
              <div key={key} data-focus={`${group}.${key}`}>
                <Card>
                  <ImageField label={key} value={url} onChange={(u) => set(group, key, u)} />
                </Card>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ===================== セクション文言 ===================== */
export function SectionsPanel({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  // ドット区切りパスで深い値を更新
  function setPath(path: string, v: string) {
    const next = JSON.parse(JSON.stringify(value));
    const keys = path.split(".");
    let cur = next;
    for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]];
    cur[keys[keys.length - 1]] = v;
    onChange(next);
  }
  const Txt = ({ label, path, area }: { label: string; path: string; area?: boolean }) => {
    const keys = path.split(".");
    let cur: any = value;
    for (const k of keys) cur = cur?.[k];
    return (
      <Field label={label}>
        {area ? (
          <TextArea rows={4} value={cur ?? ""} onChange={(e) => setPath(path, e.target.value)} />
        ) : (
          <TextInput value={cur ?? ""} onChange={(e) => setPath(path, e.target.value)} />
        )}
      </Field>
    );
  };

  return (
    <div className="space-y-4">
      <div data-focus="site">
        <Card title="サイト共通">
          <div className="space-y-3">
            <Txt label="キャッチコピー（トップ大見出し）" path="site.tagline" />
            <Txt label="サブコピー" path="site.subTagline" />
            <Txt label="創業年数ラベル" path="site.yearsLabel" />
          </div>
        </Card>
      </div>
      <div data-focus="videosIntro">
        <Card title="動画ページ 導入文">
          <Txt label="導入文" path="videosIntro" area />
        </Card>
      </div>
      <div data-focus="divisionBiz">
        <Card title="事業概要（食品 / アイス）">
          <div className="space-y-4">
            <div className="rounded-md bg-slate-50 p-3">
              <p className="mb-2 text-[12px] font-semibold text-slate-500">食品事業部</p>
              <div className="space-y-3">
                <Txt label="コピー" path="divisionBiz.food.copy" />
                <Txt label="本文" path="divisionBiz.food.body" area />
              </div>
            </div>
            <div className="rounded-md bg-slate-50 p-3">
              <p className="mb-2 text-[12px] font-semibold text-slate-500">アイス事業部</p>
              <div className="space-y-3">
                <Txt label="コピー" path="divisionBiz.ice.copy" />
                <Txt label="本文" path="divisionBiz.ice.body" area />
              </div>
            </div>
          </div>
        </Card>
      </div>
      <div data-focus="divisionInfo">
        <Card title="選ばれる理由（食品 / アイス）">
          <div className="space-y-4">
            <div className="rounded-md bg-slate-50 p-3">
              <p className="mb-2 text-[12px] font-semibold text-slate-500">食品事業部</p>
              <div className="space-y-3">
                <Txt label="見出し" path="divisionInfo.food.reasonCatch" />
                <Txt label="本文" path="divisionInfo.food.reasonBody" area />
              </div>
            </div>
            <div className="rounded-md bg-slate-50 p-3">
              <p className="mb-2 text-[12px] font-semibold text-slate-500">アイス事業部</p>
              <div className="space-y-3">
                <Txt label="見出し" path="divisionInfo.ice.reasonCatch" />
                <Txt label="本文" path="divisionInfo.ice.reasonBody" area />
              </div>
            </div>
          </div>
        </Card>
      </div>
      <div data-focus="recruitMv">
        <Card title="採用ページ メインビジュアル">
          <div className="space-y-3">
            <Txt label="メインコピー" path="recruitMv.main" />
            <Txt label="サブコピー" path="recruitMv.sub" />
            <Txt label="本文" path="recruitMv.body" area />
          </div>
        </Card>
      </div>
      <div data-focus="recruitApply">
        <Card title="採用ページ 応募セクション">
          <div className="space-y-3">
            <Txt label="コピー" path="recruitApply.copy" />
            <Txt label="本文" path="recruitApply.body" area />
          </div>
        </Card>
      </div>
      <div data-focus="philosophy">
        <Card title="経営理念">
          <Txt label="理念" path="philosophy.body" area />
        </Card>
      </div>
      <div data-focus="ceoMessage">
        <Card title="代表メッセージ">
          <div className="space-y-3">
            <Txt label="タイトル" path="ceoMessage.title" />
            <Txt label="肩書き" path="ceoMessage.name" />
            {(value.ceoMessage?.paragraphs ?? []).map((_: string, i: number) => (
              <Txt key={i} label={`段落 ${i + 1}`} path={`ceoMessage.paragraphs.${i}`} area />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
