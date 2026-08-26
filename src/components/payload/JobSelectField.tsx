'use client'
// Payload 管理画面用のカスタムフィールド：求人エントリーリンクの「職種」。
// /console の「採用」タブで登録されている職種（recruit.json）をドロップダウンで
// 選択できるようにする（DB上は text 型のまま。職種の追加・変更は次のデプロイで
// 選択肢に反映される）。
import type { TextFieldClientComponent } from 'payload'
import { FieldLabel, SelectInput, useField } from '@payloadcms/ui'
import recruitJson from '../../content/recruit.json'

const OPTIONS: { value: string; label: string }[] = ((recruitJson as any).jobs ?? []).map(
  (j: { id: string; title: string; dept: string }) => ({
    value: j.id,
    label: `${j.title}（${j.dept}）`,
  }),
)

export const JobSelectField: TextFieldClientComponent = ({ field, path }) => {
  const { value, setValue } = useField<string>({ path })
  // 保存済みの値が現在の職種一覧に無い場合（職種の削除・ID変更後など）も
  // 値を失わないよう、選択肢に含めて表示する
  const options =
    value && !OPTIONS.some((o) => o.value === value)
      ? [...OPTIONS, { value, label: `${value}（現在は未登録の職種ID）` }]
      : OPTIONS
  return (
    <div className="field-type">
      <FieldLabel htmlFor={`field-${path}`} label={field?.label} required={field?.required} />
      <SelectInput
        path={path}
        name={path}
        options={options}
        value={value}
        onChange={(option) => {
          const v = Array.isArray(option) ? option[0]?.value : option?.value
          setValue(typeof v === 'string' ? v : '')
        }}
      />
      {field?.admin?.description ? (
        <p className="field-description">{String(field.admin.description)}</p>
      ) : null}
    </div>
  )
}
