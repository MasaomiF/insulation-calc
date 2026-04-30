/**
 * レイヤー凡例・PDF 等での材料表示名。空気層は material が空でも「空気層」。
 * @param {{ materialType?: string, material?: string | null } | null | undefined} mat
 * @param {string} [emptySolidFallback] 固体で材料名が無いとき（熱橋スロットでは "熱橋" 等）
 */
export function layerLegendMaterialLabel(mat, emptySolidFallback = "（未設定）") {
  if (!mat || mat.materialType === "none") return emptySolidFallback;
  if (mat.materialType === "air") return "空気層";
  return mat.material || emptySolidFallback;
}
