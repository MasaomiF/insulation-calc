import { supabase } from "../../../lib/supabase.js";

/**
 * Supabase から材料カタログを取得し、materialDb / densityDb 形式に変換する。
 * 1つの材料が複数カテゴリに属する場合、それぞれのカテゴリに表示される。
 * @returns {{ materialDb: Record<string, {label:string,value:string,λ:number|null,memo:string}[]>, densityDb: Record<string,number> }}
 */
export async function fetchMaterialsFromSupabase() {
  const { data: categories, error: catErr } = await supabase
    .from("material_categories")
    .select("id, name")
    .order("sort_order");

  if (catErr) throw catErr;

  const { data: rows, error: matErr } = await supabase
    .from("materials")
    .select("name, lambda, density, memo, material_category_links(category_id, is_primary)")
    .eq("is_active", true)
    .order("sort_order");

  if (matErr) throw matErr;

  const catMap = Object.fromEntries((categories ?? []).map((c) => [c.id, c.name]));

  /** @type {Record<string, {label:string,value:string,λ:number|null,memo:string}[]>} */
  const materialDb = {};
  /** @type {Record<string, number>} */
  const densityDb = {};

  for (const row of rows ?? []) {
    const entry = {
      label: row.name,
      value: row.name,
      λ: row.lambda != null ? Number(row.lambda) : null,
      memo: row.memo ?? "",
    };

    // 全カテゴリに追加（複数カテゴリ対応）
    for (const link of row.material_category_links ?? []) {
      const catName = catMap[link.category_id];
      if (!catName) continue;
      if (!materialDb[catName]) materialDb[catName] = [];
      // 同一カテゴリへの重複追加を防ぐ
      if (!materialDb[catName].some((m) => m.value === row.name)) {
        materialDb[catName].push(entry);
      }
    }

    if (row.density != null) densityDb[row.name] = Number(row.density);
  }

  return { materialDb, densityDb };
}
