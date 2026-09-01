// 採用記事（社員インタビュー等）の取得層（サーバ専用）。
// Payload（Neon Postgres）から公開記事を取得し、公開サイトが従来使ってきた
// Interview 形（src/spa/data/recruit.ts と同じ）へ変換して返す。
// DB 未設定（POSTGRES_URL なし）や記事0件のときは、移行元の interviews.json に
// フォールバックする（Payload 移行前後で表示が欠けないための保険）。
import config from '@payload-config'
import { getPayload } from 'payload'
import interviewsJson from '../content/interviews.json'
import { Block, toBlocks } from '../spa/data/blocks'
import { toBlock } from './newsData'

export interface InterviewItemData {
  id: string
  name: string
  role: string
  years: string
  lead: string
  subtitle: string
  /** 自己紹介（アイキャッチ内に表示・任意） */
  intro: string
  /** 趣味（アイキャッチ内に表示・任意） */
  hobby: string
  image: string
  /** アイキャッチ動画のURL（アップロードファイル or 外部URL。空なら動画なし） */
  video: string
  category: string
  blocks: Block[]
}

export function toInterviewItem(doc: any): InterviewItemData {
  const media = typeof doc.image === 'object' && doc.image ? doc.image : null
  const vmedia = typeof doc.video === 'object' && doc.video ? doc.video : null
  return {
    id: String(doc.slug ?? doc.id),
    name: String(doc.name ?? ''),
    role: String(doc.role ?? ''),
    years: String(doc.years ?? ''),
    lead: String(doc.lead ?? ''),
    subtitle: String(doc.subtitle ?? ''),
    intro: String(doc.intro ?? ''),
    hobby: String(doc.hobby ?? ''),
    image: String(media?.url || doc.imageSrc || ''),
    video: String(vmedia?.url || doc.videoSrc || ''),
    category: String(doc.category ?? '社員インタビュー'),
    blocks: (Array.isArray(doc.blocks) ? doc.blocks : [])
      .map(toBlock)
      .filter(Boolean) as Block[],
  }
}

/** 移行元 interviews.json（旧CMSのデータ）を Interview 形で返す。 */
export function fallbackInterviews(): InterviewItemData[] {
  return (interviewsJson as any[]).map((iv) => ({
    id: String(iv.id),
    name: String(iv.name ?? ''),
    role: String(iv.role ?? ''),
    years: String(iv.years ?? ''),
    lead: String(iv.lead ?? ''),
    subtitle: String(iv.subtitle ?? ''),
    intro: String(iv.intro ?? ''),
    hobby: String(iv.hobby ?? ''),
    image: String(iv.image ?? ''),
    video: String(iv.video ?? ''),
    category: '社員インタビュー',
    blocks: toBlocks(iv.blocks ?? iv.paragraphs),
  }))
}

/** DB 未設定のときは null（ビルドを落とさない）。 */
async function getPayloadSafe() {
  if (!process.env.POSTGRES_URL) return null
  try {
    return await getPayload({ config })
  } catch {
    return null
  }
}

/**
 * 公開済みの採用記事一覧（表示順 order の小さい順）。
 * DB 接続済みで記事が1件でもあれば Payload が正、それ以外は interviews.json。
 */
export async function fetchPublishedInterviews(): Promise<InterviewItemData[]> {
  const payload = await getPayloadSafe()
  if (!payload) return fallbackInterviews()
  const res = await payload.find({
    collection: 'interviews',
    where: { _status: { equals: 'published' } },
    sort: ['order', 'createdAt'],
    limit: 100,
    depth: 1,
    draft: false,
  })
  if (res.docs.length === 0) return fallbackInterviews()
  return res.docs.map(toInterviewItem)
}
