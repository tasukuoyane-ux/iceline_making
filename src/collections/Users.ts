import type { CollectionConfig } from 'payload'

/** 記事管理画面（/admin）にログインできるアカウント。
 * 管理コンソール（/console）のアカウント（環境変数 CONSOLE_USERS）とは別管理。 */
export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: '管理ユーザー', plural: '管理ユーザー' },
  auth: true,
  admin: {
    useAsTitle: 'name',
    description: '記事管理画面（/admin）にログインできるメンバー。',
  },
  fields: [{ name: 'name', type: 'text', required: true, label: '名前' }],
}
