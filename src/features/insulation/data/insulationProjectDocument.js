import {
  INITIAL_MATERIAL_DB,
  mergeMaterialDbWithCatalog,
  normalizeMaterialDbEntries,
  normalizeDensityDbEntries,
} from "../domain/constants/materialDatabase.js";

/** 保存 JSON の schemaVersion。後方互換のマイグレーションは parse 側で行う。 */
export const SAVE_SCHEMA_VERSION = 4;

/** 旧データや欠損時の表面部位デフォルト */
export const DEFAULT_SURFACE_PART = "外壁（通気層等）";

/**
 * ファイル保存・API POST などで送るドキュメントを組み立てる。
 * UI state からの投影のみ（I/O は呼び出し側）。
 *
 * @param {{
 *   fullName: string,
 *   memo: string,
 *   layers: unknown[],
 *   surfacePart: string,
 *   bridgeRatios: unknown[],
 *   materialDb: unknown,
 *   densityDb: unknown,
 *   skipUValueCalculation: boolean,
 *   overrides?: Record<string, unknown>,
 * }} p
 */
export function serializeInsulationProjectDocument(p) {
  const {
    fullName,
    memo,
    layers,
    surfacePart,
    bridgeRatios,
    materialDb,
    densityDb,
    skipUValueCalculation,
    overrides = {},
  } = p;
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    fullName,
    memo,
    layers,
    surfacePart,
    bridgeRatios,
    materialDb,
    densityDb,
    skipUValueCalculation,
    savedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * ファイル読込・API GET の生 JSON をアプリ state 用に正規化する。
 * レイヤー形状は画面モジュールの defaultLayer / makeMat に依存するため注入する。
 *
 * @param {unknown} raw
 * @param {{
 *   makeMat: (overrides?: object) => object,
 *   defaultLayer: (index: number) => object,
 *   initialLayers: object[],
 *   initialBridgeRatios: number[],
 *   sanitizeRsSurfaceLayers: (layers: object[]) => object[],
 * }} layerHelpers
 */
export function parseInsulationProjectDocument(raw, layerHelpers) {
  const { makeMat, defaultLayer, initialLayers, initialBridgeRatios, sanitizeRsSurfaceLayers } =
    layerHelpers;

  const schemaVersion = Number(raw?.schemaVersion || 1);
  const rawMaterialDb =
    raw?.materialDb && typeof raw.materialDb === "object" ? raw.materialDb : INITIAL_MATERIAL_DB;
  const loadedMaterialDb = mergeMaterialDbWithCatalog(normalizeMaterialDbEntries(rawMaterialDb));
  const loadedDensityDb = normalizeDensityDbEntries(raw?.densityDb);

  let loadedLayers = Array.isArray(raw?.layers) ? raw.layers : initialLayers;
  loadedLayers = loadedLayers.map((layer, i) => {
    const base = defaultLayer(i);
    const layerMaterials = Array.isArray(layer?.materials) ? layer.materials : base.materials;
    return {
      ...base,
      ...layer,
      materials: layerMaterials.map((mat) => ({ ...makeMat(), ...mat })),
    };
  });

  const loadedBridgeRatios = Array.isArray(raw?.bridgeRatios) ? raw.bridgeRatios : initialBridgeRatios;

  return {
    schemaVersion,
    fullName: raw?.fullName || "",
    memo: raw?.memo || "",
    layers: sanitizeRsSurfaceLayers(loadedLayers),
    surfacePart: raw?.surfacePart || DEFAULT_SURFACE_PART,
    bridgeRatios: loadedBridgeRatios,
    materialDb: loadedMaterialDb,
    densityDb: loadedDensityDb,
    skipUValueCalculation: raw?.skipUValueCalculation === true,
  };
}
