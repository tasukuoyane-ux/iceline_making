// 画像URL。実データは src/content/images.json で管理（/console から差し替え可能）。
import imagesData from "../../content/images.json";

export const IMG: Record<string, string> = imagesData.IMG;

// 商品IDごとの画像割り当て
export const PRODUCT_IMG: Record<string, string> = imagesData.PRODUCT_IMG;

// インタビューIDごとの画像
export const INTERVIEW_IMG: Record<string, string> = imagesData.INTERVIEW_IMG;
