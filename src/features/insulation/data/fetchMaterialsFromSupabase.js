import { supabase } from "../../../lib/supabase.js";

/**
 * Supabase から材料カタログを取得し、materialDb / densityDb 形式に変換する。
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
    .select("category_id, name, lambda, density, memo")
    .eq("is_active", true)
    .order("sort_order");

  if (matErr) throw matErr;

  const catMap = Object.fromEntries((categories ?? []).map((c) => [c.id, c.name]));

  /** @type {Record<string, {label:string,value:string,λ:number|null,memo:string}[]>} */
  const materialDb = {};
  /** @type {Record<string, number>} */
  const densityDb = {};

  for (const row of rows ?? []) {
    const catName = catMap[row.category_id];
    if (!catName) continue;
    if (!materialDb[catName]) materialDb[catName] = [];
    materialDb[catName].push({
      label: row.name,
      value: row.name,
      λ: row.lambda != null ? Number(row.lambda) : null,
      memo: row.memo ?? "",
    });
    if (row.density != null) densityDb[row.name] = Number(row.density);
  }

  return { materialDb, densityDb };
}
