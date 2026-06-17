// トンマナ表（______v3.pdf）の各セクション評価をそのまま定数化。
// 順序: layout(規則性), emotion, subject(主語), cohesion(統合), background, roundness
import { heat, HeatProfile } from "../lib/heat";

export const HEAT: Record<string, HeatProfile> = {
  // ---- TOP ----
  topMv: heat("B", "A", "A", "A", "A", "A"), // 1 メインビジュアル
  topHero: heat("B", "A", "A", "A", "A", "A"), // 2 ヒーロー
  topNews: heat("A", "A", "A", "A", "A", "A"), // 3 新着情報
  topStrength: heat("B", "B", "D", "A", "A", "C"), // 4 当社の強み(TOPピーク)
  topGenre: heat("A", "A", "A", "A", "A", "B"), // 5 商品ジャンル一覧

  // ---- 食品事業部 ----
  foodMv: heat("B", "B", "C", "A", "A", "C"), // 6
  foodBiz: heat("C", "C", "C", "D", "B", "C"), // 6.5 事業紹介
  foodReason: heat("A", "B", "D", "A", "A", "C"), // 7 選ばれる理由
  foodList: heat("A", "A", "B", "A", "A", "B"), // 8
  foodDetail: heat("A", "A", "A", "A", "A", "A"), // 9

  // ---- アイス事業部 ----
  iceMv: heat("B", "B", "C", "A", "A", "C"), // 10
  iceBiz: heat("C", "C", "C", "D", "B", "C"), // 10.5 事業紹介
  iceReason: heat("A", "B", "D", "A", "A", "C"), // 11
  iceList: heat("A", "A", "B", "A", "A", "B"), // 12
  iceRecipe: heat("C", "C", "D", "D", "B", "D"), // 12.5 氷のレシピ
  iceDetail: heat("A", "A", "A", "A", "A", "A"), // 13

  // ---- 会社情報 ----
  ceoMessage: heat("C", "A", "B", "A", "A", "B"), // 14 代表メッセージ(ピーク)
  companyProfile: heat("A", "A", "A", "A", "A", "A"), // 15
  history: heat("A", "A", "A", "A", "A", "A"), // 16
  philosophy: heat("A", "A", "A", "A", "A", "A"), // 17
  csr: heat("A", "A", "A", "A", "A", "A"), // 18

  // ---- お問い合わせ / お知らせ ----
  contactForm: heat("A", "A", "A", "A", "A", "A"), // 19
  newsList: heat("A", "A", "A", "A", "A", "A"), // 20
  videoList: heat("A", "A", "A", "A", "A", "A"), // 21

  // ---- 採用サイト（高熱量） ----
  recruitMv: heat("D", "C", "B", "D", "D", "B"), // 22 採用コピー
  recruitBiz: heat("C", "B", "C", "D", "B", "B"), // 23 事業紹介
  recruitPhilosophy: heat("A", "B", "B", "D", "B", "C"), // 24 企業理念
  recruitLocation: heat("A", "A", "A", "D", "B", "B"), // 25 拠点情報
  recruitCharm: heat("D", "B", "D", "D", "B", "C"), // 26 仕事の魅力
  recruitDay: heat("A", "B", "E", "D", "B", "D"), // 27 一日の流れ
  recruitWork: heat("C", "B", "D", "D", "B", "C"), // 28 業務内容
  recruitDeck: heat("C", "B", "B", "D", "C", "D"), // 29-30 カンパニーデック
  recruitPeople: heat("B", "D", "E", "D", "B", "D"), // 31 人を知る
  recruitCeo: heat("C", "D", "B", "D", "B", "C"), // 32 代表者メッセージ
  recruitInterview: heat("C", "C", "E", "D", "A", "D"), // 37 インタビュー
  recruitApply: heat("C", "D", "D", "D", "B", "D"), // 33 応募コピー
  recruitJob: heat("C", "C", "D", "D", "A", "C"), // 34 業務内容
  recruitTerms: heat("A", "A", "A", "D", "A", "B"), // 35 諸条件
  recruitForm: heat("A", "A", "A", "D", "A", "B"), // 36 フォーム
};
