/**
 * 外部プロジェクトAPI・材料マスタ等の参照先（将来の DB / BaaS 連携用）。
 * Vite では `.env` に `VITE_PROJECT_API_BASE_URL=https://example.com/api` のように置くとビルド時に埋め込まれる。
 */

function readEnv(key) {
  if (typeof import.meta === "undefined" || !import.meta.env) return "";
  const v = import.meta.env[key];
  return v != null && v !== "" ? String(v) : "";
}

/** 末尾スラッシュを除いたベース URL。未設定時は空文字。 */
export function getProjectApiBaseUrl() {
  return readEnv("VITE_PROJECT_API_BASE_URL").replace(/\/+$/, "");
}

export function isProjectApiConfigured() {
  return Boolean(getProjectApiBaseUrl());
}

/**
 * 材料物性の取得元（将来: リモートマスタとバンドル版の切り替え）。
 * @type {"bundled" | "remote"}
 */
export const materialCatalogSource =
  readEnv("VITE_MATERIAL_CATALOG_SOURCE") === "remote" ? "remote" : "bundled";
