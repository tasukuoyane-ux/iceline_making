// 「採用」タブ：募集職種（採用3ページに表示）と諸条件・福利厚生・FAQ の管理。
//  - 募集中の職種: ON/OFF・追加・編集・削除・並べ替え
//  - 各職種: 業務内容 / 1日の流れ / キャリアパス / 職種別メッセージ
//  - 諸条件・福利厚生: 表の行（項目名＋内容）を編集
//  - よくある質問: sections.json の recruitFaq を編集（旧採用ページと共通データ）
// 変更は左のプレビュー（採用3）へ即時反映され、「更新（本番へ公開）」で確定する。
import { Content, RecruitData, RecruitJob, RecruitRow, RecruitStep, RecruitTimeline, clone, DEFAULT_RECRUIT_FLOW } from "./content";
import { Field, TextInput, TextArea, Button, Card, Collapsible } from "./ui";
import { ImageField } from "./ImageField";
import { genId } from "./panels";

/* ---------- 小さな共通部品 ---------- */

function MoveDelete({ onUp, onDown, onDelete, upDisabled, downDisabled }: { onUp: () => void; onDown: () => void; onDelete: () => void; upDisabled: boolean; downDisabled: boolean }) {
  return (
    <div className="flex gap-1">
      <Button onClick={onUp} disabled={upDisabled}>↑</Button>
      <Button onClick={onDown} disabled={downDisabled}>↓</Button>
      <Button variant="danger" onClick={onDelete}>削除</Button>
    </div>
  );
}

function moveItem<T>(arr: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return arr;
  const next = arr.slice();
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

/** 時刻/時期 ＋ 内容 のステップ一覧エディタ（1日の流れ・キャリアパス共用） */
function StepsEditor({ value, onChange, timeLabel, addLabel }: { value: RecruitStep[]; onChange: (v: RecruitStep[]) => void; timeLabel: string; addLabel: string }) {
  const update = (i: number, patch: Partial<RecruitStep>) => {
    const next = value.slice();
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };
  return (
    <div className="space-y-2">
      {value.map((s, i) => (
        <div key={i} className="flex items-start gap-2">
          <TextInput value={s.time} onChange={(e) => update(i, { time: e.target.value })} placeholder={timeLabel} className="max-w-[110px]" />
          <TextInput value={s.task} onChange={(e) => update(i, { task: e.target.value })} placeholder="内容" />
          <div className="flex shrink-0 gap-1">
            <Button onClick={() => onChange(moveItem(value, i, -1))} disabled={i === 0}>↑</Button>
            <Button onClick={() => onChange(moveItem(value, i, 1))} disabled={i === value.length - 1}>↓</Button>
            <Button variant="danger" onClick={() => onChange(value.filter((_, x) => x !== i))}>×</Button>
          </div>
        </div>
      ))}
      <Button onClick={() => onChange([...value, { time: "", task: "" }])}>＋ {addLabel}</Button>
    </div>
  );
}

/** 1日の流れ／キャリアパスのタイムラインエディタ */
function TimelineEditor({ value, onChange, noteLabel, timeLabel, imageLabel }: { value: RecruitTimeline; onChange: (v: RecruitTimeline) => void; noteLabel: string; timeLabel: string; imageLabel: string }) {
  return (
    <div className="space-y-3">
      <Field label={noteLabel} hint="例: 食品事業部 営業職のある1日">
        <TextInput value={value.note} onChange={(e) => onChange({ ...value, note: e.target.value })} />
      </Field>
      <Field label="ステップ">
        <StepsEditor value={value.steps} onChange={(steps) => onChange({ ...value, steps })} timeLabel={timeLabel} addLabel="ステップを追加" />
      </Field>
      <ImageField label={imageLabel} value={value.image} onChange={(url) => onChange({ ...value, image: url })} />
    </div>
  );
}

/** 項目名＋内容 の表エディタ（諸条件・福利厚生共用） */
function RowsEditor({ value, onChange, addLabel }: { value: RecruitRow[]; onChange: (v: RecruitRow[]) => void; addLabel: string }) {
  const update = (i: number, patch: Partial<RecruitRow>) => {
    const next = value.slice();
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };
  return (
    <div className="space-y-2">
      {value.map((r, i) => (
        <div key={i} className="flex items-start gap-2">
          <TextInput value={r.label} onChange={(e) => update(i, { label: e.target.value })} placeholder="項目名" className="max-w-[140px]" />
          <TextArea rows={2} value={r.value} onChange={(e) => update(i, { value: e.target.value })} placeholder="内容" />
          <div className="flex shrink-0 gap-1">
            <Button onClick={() => onChange(moveItem(value, i, -1))} disabled={i === 0}>↑</Button>
            <Button onClick={() => onChange(moveItem(value, i, 1))} disabled={i === value.length - 1}>↓</Button>
            <Button variant="danger" onClick={() => onChange(value.filter((_, x) => x !== i))}>×</Button>
          </div>
        </div>
      ))}
      <Button onClick={() => onChange([...value, { label: "", value: "" }])}>＋ {addLabel}</Button>
    </div>
  );
}

/* ---------- 職種1件のエディタ ---------- */

function JobEditor({ job, onChange }: { job: RecruitJob; onChange: (j: RecruitJob) => void }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="職種名"><TextInput value={job.title} onChange={(e) => onChange({ ...job, title: e.target.value })} /></Field>
        <Field label="部門名" hint="例: 食品事業部"><TextInput value={job.dept} onChange={(e) => onChange({ ...job, dept: e.target.value })} /></Field>
      </div>

      <Card title="業務内容">
        <div className="space-y-3">
          <Field label="本文">
            <TextArea rows={5} value={job.body} onChange={(e) => onChange({ ...job, body: e.target.value })} />
          </Field>
          <ImageField label="業務画像" value={job.image} onChange={(url) => onChange({ ...job, image: url })} />
        </div>
      </Card>

      <Card title="1日の流れ">
        <TimelineEditor
          value={job.day}
          onChange={(day) => onChange({ ...job, day })}
          noteLabel="メモ（時計アイコンの横に表示）"
          timeLabel="時刻"
          imageLabel="1日の流れ 画像"
        />
      </Card>

      <Card title="キャリアパス">
        <TimelineEditor
          value={job.career}
          onChange={(career) => onChange({ ...job, career })}
          noteLabel="メモ（時計アイコンの横に表示）"
          timeLabel="時期"
          imageLabel="キャリアパス 画像"
        />
      </Card>

      <Card title="選考の流れ（1日の流れと同じタイムライン形式）">
        <TimelineEditor
          value={job.flow}
          onChange={(flow) => onChange({ ...job, flow })}
          noteLabel="メモ（時計アイコンの横に表示・任意）"
          timeLabel="ステップ"
          imageLabel="選考の流れ 画像（任意）"
        />
      </Card>

      <Card title="職種別メッセージ">
        <Field label="メッセージ" hint="短い文を改行で区切って入力します。大きな黒文字で表示されます。">
          <TextArea rows={4} value={job.message} onChange={(e) => onChange({ ...job, message: e.target.value })} />
        </Field>
      </Card>

      <Card title="諸条件（この職種）">
        <RowsEditor value={job.conditions} onChange={(conditions) => onChange({ ...job, conditions })} addLabel="行を追加" />
      </Card>

      <Card title="福利厚生（この職種・諸条件の色違いで表示）">
        <RowsEditor value={job.benefits} onChange={(benefits) => onChange({ ...job, benefits })} addLabel="行を追加" />
      </Card>
    </div>
  );
}

/* ---------- 「採用」タブ本体 ---------- */

export function RecruitPanel({
  draft,
  setSlice,
}: {
  draft: Content;
  setSlice: <K extends keyof Content>(key: K, value: Content[K]) => void;
}) {
  const recruit = draft.recruit;
  const set = (patch: Partial<RecruitData>) => setSlice("recruit", { ...recruit, ...patch });

  const updateJob = (i: number, j: RecruitJob) => {
    const jobs = recruit.jobs.slice();
    jobs[i] = j;
    set({ jobs });
  };
  const addJob = () => {
    const job: RecruitJob = {
      id: genId("job"),
      title: "新しい職種",
      dept: "部門名",
      active: false,
      body: "業務内容を入力してください。",
      image: "",
      day: { note: "", image: "", steps: [{ time: "始業", task: "出社" }] },
      career: { note: "", image: "", steps: [{ time: "1年目", task: "基礎を習得" }] },
      message: "",
      flow: { note: "", image: "", steps: DEFAULT_RECRUIT_FLOW.map((s, i) => ({ time: `STEP${i + 1}`, task: s })) },
      // 諸条件・福利厚生はテンプレート（既定の共通内容）から複製して開始する
      conditions: clone(recruit.conditions),
      benefits: clone(recruit.benefits),
    };
    set({ jobs: [...recruit.jobs, job] });
  };
  const removeJob = (i: number) => {
    if (!confirm(`職種「${recruit.jobs[i].title}」を削除しますか？（募集を止めるだけなら「募集中」をOFFにしてください）`)) return;
    set({ jobs: recruit.jobs.filter((_, x) => x !== i) });
  };

  // よくある質問（sections.json の recruitFaq を編集。旧採用ページ /recruit と共通）
  const faqItems: { q: string; a: string }[] = Array.isArray(draft.sections?.recruitFaq?.items)
    ? draft.sections.recruitFaq.items
    : [];
  const setFaq = (items: { q: string; a: string }[]) => {
    const sections = clone(draft.sections);
    if (!sections.recruitFaq || typeof sections.recruitFaq !== "object") sections.recruitFaq = {};
    sections.recruitFaq.items = items;
    setSlice("sections", sections);
  };
  const updateFaq = (i: number, patch: Partial<{ q: string; a: string }>) => {
    const next = faqItems.slice();
    next[i] = { ...next[i], ...patch };
    setFaq(next);
  };

  return (
    <div className="space-y-5">
      <p className="text-[11px] leading-relaxed text-slate-500">
        採用3ページ（/recruit3）の「募集職種一覧」と、職種をクリックしたときに開く詳細を管理します。
        業務内容・1日の流れ・キャリアパス・メッセージ・諸条件・福利厚生は職種ごとに、
        よくある質問は全職種共通で設定します。変更は左のプレビューに反映され、「更新（本番へ公開）」で本番に公開されます。
      </p>

      {/* ── 募集中の職種 ── */}
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-slate-800">募集中の職種</p>
        <Button variant="primary" onClick={addJob}>＋ 職種を追加</Button>
      </div>
      {recruit.jobs.length === 0 && (
        <p className="rounded-md border border-dashed border-slate-300 p-6 text-center text-[12px] text-slate-400">
          職種がありません。「＋ 職種を追加」から登録してください。
        </p>
      )}
      <div className="space-y-2">
        {recruit.jobs.map((j, i) => (
          <Collapsible
            key={j.id}
            title={
              <span className="inline-flex items-center gap-2">
                <span>{j.title || "（無題）"}</span>
                <span className="text-[11px] font-normal text-slate-400">{j.dept}</span>
                {!j.active && <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">募集停止中</span>}
              </span>
            }
            action={
              <div className="flex items-center gap-2">
                {/* 募集中 ON/OFF（OFFでも編集内容は残る） */}
                <label className="flex cursor-pointer items-center gap-1.5 text-[12px] text-slate-600">
                  <input
                    type="checkbox"
                    checked={j.active}
                    onChange={(e) => updateJob(i, { ...j, active: e.target.checked })}
                    className="h-4 w-4 accent-emerald-600"
                  />
                  募集中
                </label>
                <MoveDelete
                  onUp={() => set({ jobs: moveItem(recruit.jobs, i, -1) })}
                  onDown={() => set({ jobs: moveItem(recruit.jobs, i, 1) })}
                  onDelete={() => removeJob(i)}
                  upDisabled={i === 0}
                  downDisabled={i === recruit.jobs.length - 1}
                />
              </div>
            }
          >
            <JobEditor job={j} onChange={(next) => updateJob(i, next)} />
          </Collapsible>
        ))}
      </div>

      {/* ── よくある質問 ── */}
      <Collapsible title="よくある質問（全職種共通・/recruit と共通データ）">
        <div className="space-y-3">
          {faqItems.map((f, i) => (
            <Card key={i} title={`Q${i + 1}`} action={
              <div className="flex gap-1">
                <Button onClick={() => setFaq(moveItem(faqItems, i, -1))} disabled={i === 0}>↑</Button>
                <Button onClick={() => setFaq(moveItem(faqItems, i, 1))} disabled={i === faqItems.length - 1}>↓</Button>
                <Button variant="danger" onClick={() => { if (confirm("この質問を削除しますか？")) setFaq(faqItems.filter((_, x) => x !== i)); }}>削除</Button>
              </div>
            }>
              <div className="space-y-3">
                <Field label="質問"><TextInput value={f.q} onChange={(e) => updateFaq(i, { q: e.target.value })} /></Field>
                <Field label="回答"><TextArea rows={3} value={f.a} onChange={(e) => updateFaq(i, { a: e.target.value })} /></Field>
              </div>
            </Card>
          ))}
          <Button onClick={() => setFaq([...faqItems, { q: "新しい質問", a: "回答を入力してください。" }])}>＋ 質問を追加</Button>
        </div>
      </Collapsible>

      {/* ── エントリーフォーム ── */}
      <Collapsible title="エントリーフォーム">
        <p className="text-[12px] leading-relaxed text-slate-500">
          エントリーフォーム（お名前・メールアドレス・電話番号・メッセージ）は職種詳細の最後に表示されます。
          フォームの項目は固定のため、ここでの設定はありません。
        </p>
      </Collapsible>
    </div>
  );
}
