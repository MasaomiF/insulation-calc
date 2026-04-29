import { MATERIAL_CATALOG } from "./materialCatalog.js";

/**
 * アプリ用 materialDb / densityDb を生成。
 * 各材料: { label, value, λ, memo }（λ は null＝熱計上なし）
 */
function buildMaterialDb(catalog) {
  /** @type {Record<string, { label: string, value: string, λ: number | null, memo: string }[]>} */
  const db = {};
  for (const row of catalog) {
    if (!db[row.category]) db[row.category] = [];
    db[row.category].push({
      label: row.value,
      value: row.value,
      λ: row.λ,
      memo: row.memo ?? "",
    });
  }
  return db;
}

function buildDensityDb(catalog) {
  /** @type {Record<string, number>} */
  const d = {};
  for (const row of catalog) {
    if (row.ρ != null) d[row.value] = row.ρ;
  }
  return d;
}

export const INITIAL_MATERIAL_DB = buildMaterialDb(MATERIAL_CATALOG);
export const INITIAL_DENSITY_DB = buildDensityDb(MATERIAL_CATALOG);

/**
 * 読み込み JSON の densityDb を正規化。
 * MATERIAL_CATALOG にある材料の比重は常にカタログ値（JSON より優先）。カタログ外のカスタム材料のみ JSON の値を残す。
 * @param {unknown} densityDb
 * @returns {Record<string, number>}
 */
export function normalizeDensityDbEntries(densityDb) {
  const catalogRho = buildDensityDb(MATERIAL_CATALOG);
  const base = densityDb && typeof densityDb === "object" ? { ...densityDb } : {};
  return { ...base, ...catalogRho };
}

/**
 * 読み込み JSON の materialDb を正規化（memo 欠損補完・型整形）。
 * @param {unknown} materialDb
 */
export function normalizeMaterialDbEntries(materialDb) {
  if (!materialDb || typeof materialDb !== "object") return {};
  /** @type {Record<string, { label: string, value: string, λ: number | null, memo: string }[]>} */
  const out = {};
  for (const [cat, items] of Object.entries(materialDb)) {
    out[cat] = (Array.isArray(items) ? items : []).map((it) => {
      let λ = null;
      if (it.λ === null) λ = null;
      else if (typeof it.λ === "number" && !Number.isNaN(it.λ)) λ = it.λ;
      else if (it.λ === "" || it.λ === undefined) λ = null;
      else {
        const p = parseFloat(it.λ);
        λ = Number.isNaN(p) ? null : p;
      }
      return {
        label: it.label ?? it.value,
        value: it.value,
        λ,
        memo: typeof it.memo === "string" ? it.memo : "",
      };
    });
  }
  return out;
}

/**
 * λ（小数第4位まで同一）を共有する材料のグループ。運用時の突き合わせ用。
 * @param {Record<string, { λ: number | null, value: string }[]> | null | undefined} materialDb
 * @returns {{ λ: number, materials: string[] }[]}
 */
export function findLambdaDuplicateGroupsInDb(materialDb) {
  /** @type {Map<string, string[]>} */
  const byKey = new Map();
  for (const [category, items] of Object.entries(materialDb || {})) {
    if (!Array.isArray(items)) continue;
    for (const it of items) {
      const raw = typeof it.λ === "number" ? it.λ : parseFloat(it.λ);
      if (it.λ === null || it.λ === "" || Number.isNaN(raw)) continue;
      const rounded = Math.round(raw * 10000) / 10000;
      const key = rounded.toFixed(4);
      const line = `${category} / ${it.value}`;
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key).push(line);
    }
  }
  return [...byKey.entries()]
    .filter(([, lines]) => lines.length > 1)
    .map(([key, materials]) => ({ λ: parseFloat(key), materials: [...materials].sort() }))
    .sort((a, b) => a.λ - b.λ);
}
