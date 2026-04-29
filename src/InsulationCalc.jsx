import { useState, useCallback, useRef, useEffect } from "react";

// ============================================================
// λデータベース（_部位別熱貫流率_new.xlsx「材料種別の熱伝導率」）
// ============================================================
const MATERIAL_DB = {
  "よく使う材料": [
    { label: "せっこうボード(GB-R)", value: "せっこうボード(GB-R)", λ: 0.22 },
    { label: "モイス（ケイ酸カルシウム板）", value: "モイス（ケイ酸カルシウム板）", λ: 0.24 },
    { label: "吹込み用セルローズファイバー", value: "吹込み用セルローズファイバー", λ: 0.04 },
    { label: "ｲﾝｼｭﾚｰｼｮﾝﾌｧｲﾊﾞｰ断熱材(ﾌｧｲﾊﾞｰﾎﾞｰﾄﾞ)", value: "ｲﾝｼｭﾚｰｼｮﾝﾌｧｲﾊﾞｰ断熱材(ﾌｧｲﾊﾞｰﾎﾞｰﾄﾞ)", λ: 0.052 },
    { label: "押出法ポリスチレンフォーム3種b-A", value: "押出法ポリスチレンフォーム3種b-A", λ: 0.028 },
    { label: "ﾌｪﾉｰﾙﾌｫｰﾑ断熱材1種2号CⅡ", value: "ﾌｪﾉｰﾙﾌｫｰﾑ断熱材1種2号CⅡ", λ: 0.02 },
    { label: "ウォール180", value: "ウォール180", λ: 0.042 },
    { label: "フォームライトSL100", value: "フォームライトSL100", λ: 0.0343 },
    { label: "フォームライトSL", value: "フォームライトSL", λ: 0.034 },
    { label: "あんしん", value: "あんしん", λ: 0.17 },
    { label: "吹付け硬質ｳﾚﾀﾝﾌｫｰﾑ断熱材A種3", value: "吹付け硬質ｳﾚﾀﾝﾌｫｰﾑ断熱材A種3", λ: 0.04 },
    { label: "吹付け硬質ｳﾚﾀﾝﾌｫｰﾑ断熱材A種1,2", value: "吹付け硬質ｳﾚﾀﾝﾌｫｰﾑ断熱材A種1,2", λ: 0.034 },
    { label: "吹付け硬質ｳﾚﾀﾝﾌｫｰﾑ断熱材A種1h", value: "吹付け硬質ｳﾚﾀﾝﾌｫｰﾑ断熱材A種1h", λ: 0.021 },
    { label: "吹付け硬質ｳﾚﾀﾝﾌｫｰﾑ断熱材 B種", value: "吹付け硬質ｳﾚﾀﾝﾌｫｰﾑ断熱材 B種", λ: 0.026 },
    { label: "天然木材", value: "天然木材", λ: 0.12 },
    { label: "合板", value: "合板", λ: 0.16 },
    { label: "ダイライト（火山性ガラス質複層板）", value: "ダイライト（火山性ガラス質複層板）", λ: 0.13 },
    { label: "硬質ウレタンフォーム2種2号D", value: "硬質ウレタンフォーム2種2号D", λ: 0.021 },
    { label: "硬質ウレタンフォーム", value: "硬質ウレタンフォーム", λ: 0.02 },
    { label: "フォームグラス", value: "フォームグラス", λ: 0.052 },
  ],
  "コンクリート系": [
    { label: "コンクリート", value: "コンクリート", λ: 1.6 },
    { label: "軽量コンクリート", value: "軽量コンクリート", λ: 0.8 },
  ],
  "金属": [
    { label: "鋼", value: "鋼", λ: 55.0 },
    { label: "アルミニウム", value: "アルミニウム", λ: 210.0 },
    { label: "銅", value: "銅", λ: 370.0 },
    { label: "ステンレス", value: "ステンレス", λ: 15.0 },
  ],
  "非木質系壁材・下地": [
    { label: "せっこうプラスター", value: "せっこうプラスター", λ: 0.6 },
    { label: "漆喰", value: "漆喰", λ: 0.74 },
    { label: "土壁", value: "土壁", λ: 0.69 },
    { label: "ガラス", value: "ガラス", λ: 1.0 },
    { label: "アクリルガラス", value: "アクリルガラス", λ: 0.2 },
    { label: "タイル", value: "タイル", λ: 1.3 },
    { label: "れんが", value: "れんが", λ: 0.64 },
    { label: "ロックウール化粧吸音板", value: "ロックウール化粧吸音板", λ: 0.06 },
    { label: "セメント・モルタル", value: "セメント・モルタル", λ: 1.5 },
    { label: "窯業系サイディング", value: "窯業系サイディング", λ: 0.35 },
  ],
  "グラスウール": [
    { label: "高性能グラスウール HG16-36", value: "高性能グラスウール HG16-36", λ: 0.036 },
    { label: "高性能グラスウール HG16-38", value: "高性能グラスウール HG16-38", λ: 0.038 },
    { label: "高性能グラスウール HG24-35", value: "高性能グラスウール HG24-35", λ: 0.035 },
    { label: "高性能グラスウール", value: "高性能グラスウール", λ: 0.033 },
    { label: "高性能グラスウール断熱材24K相当", value: "高性能グラスウール断熱材24K相当", λ: 0.036 },
  ],
  "ロックウール": [
    { label: "ロックウールMA", value: "ロックウールMA", λ: 0.038 },
  ],
  "木質系": [
    { label: "MDF", value: "MDF", λ: 0.12 },
  ],
  "EPS": [
    { label: "ビーズ法ポリスチレンフォーム1号", value: "ビーズ法ポリスチレンフォーム1号", λ: 0.034 },
    { label: "ビーズ法ポリスチレンフォーム2号", value: "ビーズ法ポリスチレンフォーム2号", λ: 0.036 },
    { label: "ビーズ法ポリスチレンフォーム3号", value: "ビーズ法ポリスチレンフォーム3号", λ: 0.038 },
    { label: "ラムダボードNB18", value: "ラムダボードNB18", λ: 0.033 },
  ],
  "ウレタン系": [
    { label: "アクアフォームLITE", value: "アクアフォームLITE", λ: 0.038 },
    { label: "アクアフォーム", value: "アクアフォーム", λ: 0.033 },
    { label: "スタイロエースⅡ", value: "スタイロエースⅡ", λ: 0.028 },
    { label: "ネオマフォーム", value: "ネオマフォーム", λ: 0.02 },
    { label: "スタイロフォーム", value: "スタイロフォーム", λ: 0.036 },
    { label: "スタイロフォームAT", value: "スタイロフォームAT", λ: 0.028 },
  ],
};

const CATEGORIES = Object.keys(MATERIAL_DB);

// ============================================================
// 比重データベース（_固定荷重.xlsx「材料種別の比重」 g/cm³）
// ============================================================
const DENSITY_DB = {
  "吹込み用セルローズファイバー": 0.055,
  "ｲﾝｼｭﾚｰｼｮﾝﾌｧｲﾊﾞｰ断熱材(ﾌｧｲﾊﾞｰﾎﾞｰﾄﾞ)": 0.15,
  "押出法ポリスチレンフォーム3種b-A": 0.036,
  "ネオマフォーム": 0.027,
  "ウォール180": 0.18,
  "フォームライトSL100": 0.011,
  "フォームライトSL": 0.011,
  "ロックウールMA": 0.03,
  "吹付け硬質ｳﾚﾀﾝﾌｫｰﾑ断熱材A種3": 0.02,
  "吹付け硬質ｳﾚﾀﾝﾌｫｰﾑ断熱材A種1h": 0.026,
  "吹付け硬質ｳﾚﾀﾝﾌｫｰﾑ断熱材A種1,2": 0.023,
  "吹付け硬質ｳﾚﾀﾝﾌｫｰﾑ断熱材 B種": 0.026,
  "アクアフォームLITE": 0.011,
  "アクアフォーム": 0.02,
  "スタイロエースⅡ": 0.036,
  "スタイロフォーム": 0.03,
  "スタイロフォームAT": 0.036,
  "ﾌｪﾉｰﾙﾌｫｰﾑ断熱材1種2号CⅡ": 0.04,
  "硬質ウレタンフォーム": 0.025,
  "硬質ウレタンフォーム2種2号D": 0.025,
  "せっこうボード(GB-R)": 0.8,
  "モイス（ケイ酸カルシウム板）": 1.1,
  "合板": 0.58,
  "天然木材": 0.55,
  "あんしん": 0.92,
  "ダイライト（火山性ガラス質複層板）": 0.78,
  "MDF": 0.78,
  "高性能グラスウール HG16-36": 0.016,
  "高性能グラスウール HG16-38": 0.016,
  "高性能グラスウール HG24-35": 0.024,
  "高性能グラスウール": 0.016,
  "高性能グラスウール断熱材24K相当": 0.024,
  "ラムダボードNB18": 0.033,
  "ビーズ法ポリスチレンフォーム1号": 0.03,
  "ビーズ法ポリスチレンフォーム2号": 0.025,
  "ビーズ法ポリスチレンフォーム3号": 0.02,
  "コンクリート": 2.3,
  "軽量コンクリート": 1.4,
  "鋼": 7.85,
  "アルミニウム": 2.7,
  "漆喰": 1.0,
  "タイル": 1.0,
  "セメント・モルタル": 2.2,
  "窯業系サイディング": 1.2,
};

const RSI_RSE_VALUES = [
  { part: "屋根(外気)", rsi: 0.09, rse: 0.04 },
  { part: "屋根(通気層)", rsi: 0.09, rse: 0.09 },
  { part: "天井(小屋裏)", rsi: 0.09, rse: 0.09 },
  { part: "外壁(外気)", rsi: 0.11, rse: 0.04 },
  { part: "外壁(通気層)", rsi: 0.11, rse: 0.11 },
  { part: "床(外気)", rsi: 0.15, rse: 0.04 },
  { part: "床(床下)", rsi: 0.15, rse: 0.15 },
];

const COLOR_MAP = {
  gray: "#9e9e9e", darkslategray: "#3d5a5a", darkolivegreen: "#5a6a2a",
  white: "#f5f5f5", lightcyan: "#cff5f5", lavender: "#e8e8ff",
  rosybrown: "#c4918a", tan: "#d2b48c", tomato: "#e85a4f",
  khaki: "#d4c86a", darkkhaki: "#a89a30", palegreen: "#98d898",
  aquamarine: "#7fffd4", lightblue: "#87ceeb", pink: "#ffb6c1", violet: "#ee82ee",
};

// ============================================================
// データ構造ヘルパー
// layer.materials[0] = 断熱部（全面、ratioForUは自動 = 1 - Σ熱橋比率）
// layer.materials[1+] = 熱橋部（ratioForU手動入力、合計=1の制約）
// ratioForDL は熱貫流率比率とは独立した充足率
// ============================================================
function makeMat(overrides = {}) {
  return {
    materialType: "none", category: null, material: null, color: null,
    ratioForU: 0, ratioForDL: 0,
    dlOverridden: false,  // trueのとき ratioForDL はratioForUと独立
    ...overrides,
  };
}

function syncRatio1(materials) {
  const bridgeSum = materials.slice(1).reduce((s, m) => s + (parseFloat(m.ratioForU) || 0), 0);
  const newRatioForU = parseFloat((1 - bridgeSum).toFixed(4));
  const m0 = materials[0];
  // material1のDLも未上書きなら同期
  const newDL0 = m0.dlOverridden ? m0.ratioForDL : newRatioForU;
  return [
    { ...m0, ratioForU: newRatioForU, ratioForDL: newDL0 },
    ...materials.slice(1),
  ];
}

function defaultLayer(i) {
  const presets = [
    { switchOn: true, surfacetype: "none", thickness: 15, materials: [
      makeMat({ materialType: "solid", category: "非木質系壁材・下地", material: "窯業系サイディング", color: "gray", ratioForU: 1, ratioForDL: 1 }),
    ]},
    { switchOn: true, surfacetype: "none", thickness: 18, materials: [
      makeMat({ materialType: "air", color: "lightcyan", ratioForU: 0.83, ratioForDL: 0.83 }),
      makeMat({ materialType: "solid", category: "よく使う材料", material: "天然木材", color: "rosybrown", ratioForU: 0.17, ratioForDL: 0.059 }),
    ]},
    { switchOn: true, surfacetype: "rse", thickness: 105, materials: [
      makeMat({ materialType: "solid", category: "グラスウール", material: "高性能グラスウール HG16-38", color: "khaki", ratioForU: 0.83, ratioForDL: 0.83 }),
      makeMat({ materialType: "solid", category: "よく使う材料", material: "天然木材", color: "tan", ratioForU: 0.17, ratioForDL: 0.099 }),
    ]},
    { switchOn: true, surfacetype: "rsi", thickness: 15, materials: [
      makeMat({ materialType: "air", color: "lightcyan", ratioForU: 0.83, ratioForDL: 0.83 }),
      makeMat({ materialType: "solid", category: "よく使う材料", material: "天然木材", color: "tan", ratioForU: 0.17, ratioForDL: 0.099 }),
    ]},
    { switchOn: true, surfacetype: "none", thickness: 12.5, materials: [
      makeMat({ materialType: "solid", category: "よく使う材料", material: "せっこうボード(GB-R)", color: "darkolivegreen", ratioForU: 1, ratioForDL: 1 }),
    ]},
  ];
  if (i < presets.length) return presets[i];
  return { switchOn: false, surfacetype: "none", thickness: null,
    materials: [makeMat({ materialType: "solid", ratioForU: 1, ratioForDL: 1 })] };
}

const initialLayers = Array.from({ length: 10 }, (_, i) => defaultLayer(i));

// ============================================================
// 計算ロジック
// ============================================================
function getLambda(category, material) {
  if (!category || !material) return null;
  const found = (MATERIAL_DB[category] || []).find((m) => m.value === material);
  return found ? found.λ : null;
}

function getDensityKgM3(material) {
  const rho = DENSITY_DB[material];
  return rho != null ? rho * 1000 : 0;
}

function calcR(mat, thickness) {
  if (mat.materialType === "air") return 0.09;
  if (mat.materialType === "none" || !mat.material) return null;
  const λ = getLambda(mat.category, mat.material);
  return λ ? (thickness / 1000) / λ : null;
}

/*
 * U値計算（Excelロジック）
 * 戻り値に rows[] を追加 → 各行: { label, λ, d, flag, R_bridge, R_ins }
 * flag: "断熱" | "熱橋" | "熱橋＆断熱"
 */
function calculateUValue(layers, rsi, rse) {
  let startLayer = 0, endLayer = layers.length - 1;
  for (let i = 0; i < layers.length; i++) {
    if (layers[i]?.surfacetype === "rse") { startLayer = i; break; }
  }
  for (let i = layers.length - 1; i >= startLayer; i--) {
    if (layers[i]?.surfacetype === "rsi") { endLayer = i - 1; break; }
  }

  let R_common = rsi + rse;
  const bridgeItems = [];
  const rows = []; // Excel表示用行データ

  // Rsi行
  rows.push({ label: `室内側表面熱抵抗 Rsi`, λ: "—", d: "—", flag: "両", R_bridge: rsi, R_ins: rsi });

  for (let i = startLayer; i <= endLayer; i++) {
    const layer = layers[i];
    if (!layer?.switchOn || !layer.thickness) continue;
    const { materials, thickness } = layer;
    const d = thickness / 1000;

    // material1（断熱部・全面）
    const m1 = materials[0];
    const λ1 = m1.materialType === "air" ? "空気層" : getLambda(m1.category, m1.material);
    const r1 = calcR(m1, thickness);
    const matName1 = m1.materialType === "air" ? "空気層" : (m1.material || "（未設定）");

    // material2+（熱橋部）があるかどうかで flag を決定
    const hasBridge = materials.slice(1).some((m) => m.materialType !== "none");

    if (hasBridge) {
      // material1は両経路（断熱＆熱橋）
      if (r1 != null) {
        rows.push({ label: matName1, λ: typeof λ1 === "number" ? λ1 : λ1, d, flag: "熱橋＆断熱", R_bridge: r1, R_ins: r1, color: m1.color });
        R_common += r1;
      }
      // material2+は熱橋経路のみ
      materials.slice(1).forEach((mj, ji) => {
        if (mj.materialType === "none") return;
        const λj = mj.materialType === "air" ? "空気層" : getLambda(mj.category, mj.material);
        const rj = calcR(mj, thickness);
        const nameJ = mj.materialType === "air" ? "空気層" : (mj.material || "（未設定）");
        if (rj != null) {
          rows.push({ label: nameJ, λ: typeof λj === "number" ? λj : λj, d, flag: "熱橋", R_bridge: rj, R_ins: 0, color: mj.color });
          bridgeItems.push({ ratio: parseFloat(mj.ratioForU) || 0, R_extra: rj });
        }
      });
    } else {
      // 熱橋なし → 断熱経路のみ
      if (r1 != null) {
        rows.push({ label: matName1, λ: typeof λ1 === "number" ? λ1 : λ1, d, flag: "断熱", R_bridge: 0, R_ins: r1, color: m1.color });
        R_common += r1;
      }
    }
  }

  // Rse行
  rows.push({ label: `外気側表面熱抵抗 Rse`, λ: "—", d: "—", flag: "両", R_bridge: rse, R_ins: rse });

  const U_ins = R_common > 0 ? 1 / R_common : 0;
  let totalBridgeRatio = bridgeItems.reduce((s, b) => s + b.ratio, 0);
  const insulationRatio = Math.max(0, 1 - totalBridgeRatio);

  let uFinal = U_ins * insulationRatio;
  const bridgeResults = bridgeItems.map((b) => {
    const R_bridge = R_common + b.R_extra;
    const U_bridge = R_bridge > 0 ? 1 / R_bridge : 0;
    uFinal += U_bridge * b.ratio;
    return { ratio: b.ratio, R: R_bridge, U: U_bridge };
  });

  // ΣR（熱橋部）= R_common + Σ各熱橋のR_extra（加重平均）
  const R_bridge_total = bridgeItems.length > 0
    ? bridgeItems.reduce((s, b) => s + (R_common + b.R_extra) * b.ratio, 0) / (totalBridgeRatio || 1)
    : R_common;

  return { uFinal, U_ins, R_common, R_bridge_total, insulationRatio, bridgeResults, rows, startLayer, endLayer };
}

function calculateDeadLoad(layers) {
  const rows = [];
  let total = 0;

  layers.forEach((layer) => {
    if (!layer.switchOn || !layer.thickness) return;
    const d = layer.thickness / 1000;

    layer.materials.forEach((mat) => {
      if (mat.materialType === "none" || mat.materialType === "air") return;
      if (!mat.material) return;
      const rho = getDensityKgM3(mat.material);
      const ratio = parseFloat(mat.ratioForDL) || 0;
      const load = rho * d * 9.81 * ratio;
      rows.push({
        category: mat.category,
        material: mat.material,
        rho,
        d,
        ratio,
        load,
        color: mat.color,
      });
      total += load;
    });
  });

  return { rows, total };
}

// ============================================================
// 断面図キャンバス
// ============================================================
const CANVAS_W = 560;

function SectionCanvas({ layers }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let y = 0;
    const cmds = [];
    layers.forEach((layer) => {
      if (!layer.switchOn || !layer.thickness) return;
      const h = Math.max(layer.thickness * 1.6, 6);
      if (layer.surfacetype === "rse") cmds.push({ type: "dash", y, color: "#2563eb" });
      if (layer.surfacetype === "rsi") cmds.push({ type: "dash", y, color: "#dc2626" });
      // material1: 全面背景
      const m1 = layer.materials[0];
      cmds.push({ type: "rect", x: 0, y, w: CANVAS_W, h, color: COLOR_MAP[m1?.color] || "#ccc" });
      // material2+: 熱橋部を幅比で中央描画
      layer.materials.slice(1).forEach((mat) => {
        if (mat.materialType === "none") return;
        const w = CANVAS_W * (parseFloat(mat.ratioForU) || 0.1);
        const x = (CANVAS_W - w) / 2;
        cmds.push({ type: "rect", x, y, w, h, color: COLOR_MAP[mat.color] || "#888" });
      });
      y += h;
    });
    canvas.height = Math.max(y + 4, 60);
    ctx.clearRect(0, 0, CANVAS_W, canvas.height);
    cmds.forEach((c) => {
      if (c.type === "rect") {
        ctx.fillStyle = c.color;
        ctx.fillRect(c.x, c.y, c.w, c.h);
        ctx.strokeStyle = "rgba(0,0,0,0.1)";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(c.x, c.y, c.w, c.h);
      } else {
        ctx.beginPath(); ctx.setLineDash([10, 4]);
        ctx.strokeStyle = c.color; ctx.lineWidth = 2;
        ctx.moveTo(0, c.y); ctx.lineTo(CANVAS_W, c.y);
        ctx.stroke(); ctx.setLineDash([]);
      }
    });
  }, [layers]);
  return (
    <canvas ref={canvasRef} width={CANVAS_W} height={60}
      style={{ width: "100%", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-md)", display: "block" }} />
  );
}

// ============================================================
// 材料カード（横並び1枚）
// ============================================================
const S = {
  sel: { fontSize: 11, padding: "2px 4px", borderRadius: 3, border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", width: "100%" },
  num: { fontSize: 11, padding: "2px 4px", borderRadius: 3, border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", width: "100%", fontFamily: "var(--font-mono)" },
  lbl: { fontSize: 10, color: "var(--color-text-secondary)", whiteSpace: "nowrap" },
};

function MaterialCard({ mat, isFirst, onChange, onRemove, canRemove }) {
  const mats = mat.category ? (MATERIAL_DB[mat.category] || []) : [];
  const λ = mat.materialType === "solid" ? getLambda(mat.category, mat.material) : null;
  const rho = mat.materialType === "solid" ? getDensityKgM3(mat.material) : 0;

  return (
    <div style={{
      border: `0.5px solid ${isFirst ? "var(--color-border-tertiary)" : "#fbbf24"}`,
      borderRadius: "var(--border-radius-md)",
      padding: "8px 9px",
      background: "var(--color-background-primary)",
      flex: "1 1 155px", minWidth: 150, maxWidth: 220,
      display: "flex", flexDirection: "column", gap: 5,
    }}>
      {/* ヘッダー */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 10, fontWeight: 500, color: isFirst ? "var(--color-text-secondary)" : "#92400e" }}>
          {isFirst ? "断熱部（全面）" : "熱橋部"}
        </span>
        {canRemove && (
          <button onClick={onRemove} style={{ fontSize: 10, padding: "0 5px", borderRadius: 3, border: "0.5px solid var(--color-border-secondary)", background: "none", color: "var(--color-text-secondary)", cursor: "pointer" }}>×</button>
        )}
      </div>

      {/* 材料タイプ */}
      <select value={mat.materialType} onChange={(e) => onChange({ ...mat, materialType: e.target.value, category: null, material: null })} style={S.sel}>
        <option value="none">なし</option>
        <option value="solid">固体</option>
        <option value="air">空気層</option>
      </select>

      {mat.materialType === "solid" && (<>
        <select value={mat.category || ""} onChange={(e) => onChange({ ...mat, category: e.target.value, material: null })} style={S.sel}>
          <option value="">カテゴリ</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={mat.material || ""} onChange={(e) => onChange({ ...mat, material: e.target.value })} style={S.sel}>
          <option value="">材料選択</option>
          {mats.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </>)}

      {mat.materialType === "air" && (
        <div style={{ fontSize: 10, color: "var(--color-text-secondary)" }}>R = 0.09 m²K/W</div>
      )}

      {/* 色 */}
      <select value={mat.color || ""} onChange={(e) => onChange({ ...mat, color: e.target.value })}
        style={{ ...S.sel, background: mat.color ? COLOR_MAP[mat.color] : "var(--color-background-primary)" }}>
        <option value="">色</option>
        {Object.entries(COLOR_MAP).map(([k]) => <option key={k} value={k} style={{ background: COLOR_MAP[k] }}>{k}</option>)}
      </select>

      {/* 比率入力 */}
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "3px 5px", alignItems: "center" }}>
        <span style={S.lbl}>U比率</span>
        {isFirst ? (
          <div style={{ ...S.num, background: "var(--color-background-secondary)", color: "var(--color-text-secondary)", padding: "2px 4px", display: "block" }}>
            {(parseFloat(mat.ratioForU) || 0).toFixed(3)}
          </div>
        ) : (
          <input type="number" min="0" max="1" step="0.001" value={mat.ratioForU}
            onChange={(e) => {
              const newU = parseFloat(e.target.value) || 0;
              // DL未上書きなら連動
              const newDL = mat.dlOverridden ? mat.ratioForDL : newU;
              onChange({ ...mat, ratioForU: newU, ratioForDL: newDL });
            }} style={S.num} />
        )}

        {/* DL充足率ラベル＋同期チェック */}
        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
          <span style={S.lbl}>DL充足率</span>
          <label title="U比率と連動" style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={!mat.dlOverridden}
              onChange={(e) => {
                const sync = e.target.checked;
                onChange({
                  ...mat,
                  dlOverridden: !sync,
                  ratioForDL: sync ? mat.ratioForU : mat.ratioForDL,
                });
              }}
              style={{ width: 10, height: 10, accentColor: "#185FA5", margin: 0 }}
            />
            <span style={{ fontSize: 9, color: "#185FA5", marginLeft: 2 }}>連動</span>
          </label>
        </div>
        <input
          type="number" min="0" max="1" step="0.001"
          value={mat.ratioForDL}
          disabled={!mat.dlOverridden && !isFirst}
          onChange={(e) => onChange({ ...mat, ratioForDL: parseFloat(e.target.value) || 0, dlOverridden: true })}
          style={{ ...S.num, background: mat.dlOverridden ? "var(--color-background-primary)" : "var(--color-background-secondary)", color: mat.dlOverridden ? "var(--color-text-primary)" : "var(--color-text-secondary)" }}
        />
      </div>

      {/* λ/ρ表示 */}
      {λ != null && (
        <div style={{ fontSize: 10, color: "var(--color-text-secondary)", fontFamily: "var(--font-mono)" }}>
          λ={λ}{rho > 0 ? ` ρ=${(rho / 1000).toFixed(3)}g/cm³` : ""}
        </div>
      )}
    </div>
  );
}

// ============================================================
// レイヤー行
// ============================================================
function LayerRow({ layer, index, onChange }) {
  const update = (key, val) => onChange({ ...layer, [key]: val });

  const updateMat = (mi, newMat) => {
    const mats = [...layer.materials];
    // 熱橋部(mi>0)のratioForU変更時、DL未上書きなら連動
    if (mi > 0 && newMat.ratioForU !== mats[mi].ratioForU && !newMat.dlOverridden) {
      newMat = { ...newMat, ratioForDL: newMat.ratioForU };
    }
    mats[mi] = newMat;
    onChange({ ...layer, materials: syncRatio1(mats) });
  };

  const addMat = () => {
    const mats = [...layer.materials, makeMat({ materialType: "solid", ratioForU: 0, ratioForDL: 0, dlOverridden: false })];
    onChange({ ...layer, materials: syncRatio1(mats) });
  };

  const removeMat = (mi) => {
    const mats = layer.materials.filter((_, i) => i !== mi);
    onChange({ ...layer, materials: syncRatio1(mats) });
  };

  const totalRatio = layer.materials.reduce((s, m) => s + (parseFloat(m.ratioForU) || 0), 0);
  const ratioOk = Math.abs(totalRatio - 1) < 0.005;

  return (
    <div style={{
      border: "0.5px solid var(--color-border-tertiary)",
      borderRadius: "var(--border-radius-md)",
      marginBottom: 8,
      background: layer.switchOn ? "var(--color-background-primary)" : "var(--color-background-secondary)",
      overflow: "hidden",
    }}>
      {/* ヘッダー */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "var(--color-background-secondary)", borderBottom: "0.5px solid var(--color-border-tertiary)", flexWrap: "wrap" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }}>
          <input type="checkbox" checked={layer.switchOn} onChange={(e) => update("switchOn", e.target.checked)} style={{ accentColor: "#185FA5" }} />
          <span style={{ fontSize: 12, fontWeight: 500 }}>Layer {index + 1}</span>
        </label>

        {layer.switchOn && (<>
          <select value={layer.surfacetype} onChange={(e) => update("surfacetype", e.target.value)}
            style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, border: "0.5px solid var(--color-border-secondary)",
              background: layer.surfacetype === "rse" ? "#dbeafe" : layer.surfacetype === "rsi" ? "#fee2e2" : "var(--color-background-primary)",
              color: "var(--color-text-primary)" }}>
            <option value="none">境界なし</option>
            <option value="rse">Rse（室外側）</option>
            <option value="rsi">Rsi（室内側）</option>
          </select>

          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>厚さ</span>
            <input type="number" value={layer.thickness || ""}
              onChange={(e) => update("thickness", parseFloat(e.target.value) || 0)}
              style={{ width: 58, fontSize: 11, padding: "2px 4px", borderRadius: 4, border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", fontFamily: "var(--font-mono)" }} />
            <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>mm</span>
          </div>

          {/* U比率合計 */}
          <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: ratioOk ? "#166534" : "#991b1b", background: ratioOk ? "#dcfce7" : "#fee2e2", padding: "1px 6px", borderRadius: 3 }}>
            Σ={totalRatio.toFixed(3)}
          </span>

          {layer.materials.length < 4 && (
            <button onClick={addMat} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, border: "0.5px solid #185FA5", background: "none", color: "#185FA5", cursor: "pointer", marginLeft: "auto" }}>
              + 熱橋追加
            </button>
          )}
        </>)}
      </div>

      {/* 材料カード 横並び */}
      {layer.switchOn && (
        <div style={{ padding: "8px 10px", display: "flex", gap: 8, flexWrap: "wrap" }}>
          {layer.materials.map((mat, mi) => (
            <MaterialCard key={mi} mat={mat} isFirst={mi === 0}
              onChange={(val) => updateMat(mi, val)}
              onRemove={() => removeMat(mi)}
              canRemove={mi > 0} />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 結果パネル
// ============================================================
// ============================================================
// 断面プレビュー（縦方向・計算表と横並び用）
// ============================================================
const PREVIEW_W = 80;

function SectionPreview({ layers, uResult }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Rsi〜Rseの範囲と各レイヤー高さを計算
    const activeLayers = layers.filter((l) => l.switchOn && l.thickness);
    const totalThickness = activeLayers.reduce((s, l) => s + l.thickness, 0);
    const CANVAS_H = 360;
    const HEADER_H = 20; // Rsi/Rse境界線のオフセット

    canvas.height = CANVAS_H;
    ctx.clearRect(0, 0, PREVIEW_W, CANVAS_H);

    let y = HEADER_H;
    activeLayers.forEach((layer) => {
      const h = (layer.thickness / totalThickness) * (CANVAS_H - HEADER_H * 2);

      if (layer.surfacetype === "rse") {
        ctx.beginPath(); ctx.setLineDash([6, 3]);
        ctx.strokeStyle = "#2563eb"; ctx.lineWidth = 1.5;
        ctx.moveTo(0, y); ctx.lineTo(PREVIEW_W, y);
        ctx.stroke(); ctx.setLineDash([]);
      }
      if (layer.surfacetype === "rsi") {
        ctx.beginPath(); ctx.setLineDash([6, 3]);
        ctx.strokeStyle = "#dc2626"; ctx.lineWidth = 1.5;
        ctx.moveTo(0, y); ctx.lineTo(PREVIEW_W, y);
        ctx.stroke(); ctx.setLineDash([]);
      }

      // material1（背景）
      const m1 = layer.materials[0];
      ctx.fillStyle = COLOR_MAP[m1?.color] || "#ddd";
      ctx.fillRect(0, y, PREVIEW_W, h);
      ctx.strokeStyle = "rgba(0,0,0,0.08)";
      ctx.lineWidth = 0.5;
      ctx.strokeRect(0, y, PREVIEW_W, h);

      // material2+（熱橋部、幅比で中央）
      layer.materials.slice(1).forEach((mat) => {
        if (mat.materialType === "none") return;
        const ratio = parseFloat(mat.ratioForU) || 0.1;
        const bw = PREVIEW_W * ratio;
        const bx = (PREVIEW_W - bw) / 2;
        ctx.fillStyle = COLOR_MAP[mat.color] || "#888";
        ctx.fillRect(bx, y, bw, h);
      });

      y += h;
    });
  }, [layers, uResult]);

  return (
    <canvas ref={canvasRef} width={PREVIEW_W} height={360}
      style={{ display: "block", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-md)", flexShrink: 0 }} />
  );
}

// ============================================================
// U値計算表パネル（Excelライク + 断面プレビュー横並び）
// ============================================================
function UValuePanel({ result, layers }) {
  if (!result) return null;
  const { rows, R_common, R_bridge_total, U_ins, bridgeResults, uFinal, insulationRatio } = result;

  // 熱橋部ΣR・U値（加重平均済み代表値を表示）
  const R_bridge_disp = bridgeResults.length > 0 ? R_bridge_total : R_common;
  const U_bridge_disp = R_bridge_disp > 0 ? 1 / R_bridge_disp : 0;
  const bridge_ratio = 1 - insulationRatio;

  const td = (content, opts = {}) => ({
    padding: "4px 6px",
    fontFamily: opts.mono ? "var(--font-mono)" : undefined,
    fontSize: 11,
    color: opts.muted ? "var(--color-text-secondary)" : "var(--color-text-primary)",
    borderBottom: "0.5px solid var(--color-border-tertiary)",
    background: opts.bg || undefined,
    fontWeight: opts.bold ? 500 : undefined,
    textAlign: opts.right ? "right" : "left",
    whiteSpace: "nowrap",
    ...opts.style,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* 凡例 */}
      <div style={{ fontSize: 10, color: "var(--color-text-secondary)", display: "flex", gap: 10 }}>
        <span style={{ background: "#f0fdf4", color: "#166534", padding: "1px 5px", borderRadius: 2 }}>断熱</span>
        <span style={{ background: "#fffbeb", color: "#92400e", padding: "1px 5px", borderRadius: 2 }}>熱橋</span>
        <span style={{ background: "#fffbeb", color: "#92400e", padding: "1px 5px", borderRadius: 2 }}>熱橋＆断熱</span>
      </div>
      {/* 計算表 */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse", tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "28%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "13%" }} />
            <col style={{ width: "13%" }} />
            <col style={{ width: "13%" }} />
          </colgroup>
          <thead>
            <tr style={{ background: "var(--color-background-secondary)" }}>
              {["部分名", "λ", "d(m)", "熱橋or断熱", "熱橋部 R", "断熱部 R"].map((h) => (
                <th key={h} style={{ padding: "5px 6px", fontSize: 10, fontWeight: 500, color: "var(--color-text-secondary)", borderBottom: "1px solid var(--color-border-secondary)", textAlign: h === "部分名" ? "left" : "right", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
            {/* 面積比行 */}
            <tr style={{ background: "var(--color-background-secondary)" }}>
              <td style={td("熱橋面積比", { muted: true })}>熱橋面積比</td>
              <td colSpan={3} />
              <td style={{ ...td("", { mono: true, right: true }), color: "#92400e" }}>{bridge_ratio.toFixed(3)}</td>
              <td style={{ ...td("", { mono: true, right: true }), color: "#166534" }}>{insulationRatio.toFixed(3)}</td>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const isRsi = row.label.startsWith("室内側");
              const isRse = row.label.startsWith("外気側");
              const isSurface = isRsi || isRse;
              const flagColor = row.flag === "断熱" ? "#166534" : row.flag === "熱橋" ? "#92400e" : "var(--color-text-secondary)";
              const flagBg = row.flag === "断熱" ? "#f0fdf4" : row.flag === "熱橋" ? "#fffbeb" : undefined;
              return (
                <tr key={i} style={{ background: isSurface ? "var(--color-background-secondary)" : undefined }}>
                  <td style={{ ...td("", {}), display: "flex", alignItems: "center", gap: 5, overflow: "hidden" }}>
                    {row.color && !isSurface && (
                      <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: COLOR_MAP[row.color] || "#ccc", flexShrink: 0 }} />
                    )}
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.label}</span>
                  </td>
                  <td style={td("", { mono: true, right: true, muted: isSurface })}>
                    {isSurface ? "—" : (typeof row.λ === "number" ? row.λ : row.λ)}
                  </td>
                  <td style={td("", { mono: true, right: true, muted: isSurface })}>
                    {isSurface ? "—" : row.d.toFixed(3)}
                  </td>
                  <td style={{ ...td("", {}), color: flagColor, background: flagBg, fontSize: 10, textAlign: "center" }}>
                    {isSurface ? "—" : row.flag}
                  </td>
                  <td style={td("", { mono: true, right: true })}>
                    {isSurface
                      ? row.R_bridge.toFixed(3)
                      : row.flag === "断熱"
                      ? "0"
                      : row.R_bridge > 0 ? row.R_bridge.toFixed(3) : ""}
                  </td>
                  <td style={td("", { mono: true, right: true })}>
                    {isSurface
                      ? row.R_ins.toFixed(3)
                      : row.flag === "熱橋"
                      ? "0"
                      : row.R_ins > 0 ? row.R_ins.toFixed(3) : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            {/* ΣR */}
            <tr style={{ background: "var(--color-background-secondary)", borderTop: "1px solid var(--color-border-secondary)" }}>
              <td colSpan={4} style={{ padding: "5px 6px", fontSize: 11, fontWeight: 500 }}>ΣR = Σ(d/λ)</td>
              <td style={{ padding: "5px 6px", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 500, textAlign: "right", color: "#92400e" }}>{R_bridge_disp.toFixed(3)}</td>
              <td style={{ padding: "5px 6px", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 500, textAlign: "right", color: "#166534" }}>{R_common.toFixed(3)}</td>
            </tr>
            {/* Un = 1/ΣR */}
            <tr style={{ background: "var(--color-background-secondary)" }}>
              <td colSpan={4} style={{ padding: "5px 6px", fontSize: 11, fontWeight: 500 }}>Un = 1/ΣR</td>
              <td style={{ padding: "5px 6px", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 500, textAlign: "right", color: "#92400e" }}>{U_bridge_disp.toFixed(3)}</td>
              <td style={{ padding: "5px 6px", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 500, textAlign: "right", color: "#166534" }}>{U_ins.toFixed(3)}</td>
            </tr>
            {/* 平均U値 */}
            <tr style={{ background: "#dbeafe", borderTop: "1px solid #93c5fd" }}>
              <td colSpan={5} style={{ padding: "7px 6px", fontSize: 12, fontWeight: 500, color: "#0C447C" }}>
                平均熱貫流率 Ui = Σ(ain・Un)
              </td>
              <td style={{ padding: "7px 6px", fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 500, color: "#0C447C", textAlign: "right" }}>
                {uFinal.toFixed(3)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// 断面プレビュー（縦断面・上=室外側 下=室内側）
// ============================================================
const SECTION_CW = 600; // キャンバス内部幅
const SECTION_CH = 160; // キャンバス内部高さ（固定）

function HorizontalSection({ layers }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const activeLayers = layers.filter((l) => l.switchOn && l.thickness);
    const totalThickness = activeLayers.reduce((s, l) => s + l.thickness, 0);
    ctx.clearRect(0, 0, SECTION_CW, SECTION_CH);
    if (totalThickness === 0) return;

    let y = 0;
    activeLayers.forEach((layer) => {
      const h = (layer.thickness / totalThickness) * SECTION_CH;

      // Rse/Rsi境界線（横線）
      if (layer.surfacetype === "rse") {
        ctx.beginPath(); ctx.setLineDash([8, 4]);
        ctx.strokeStyle = "#2563eb"; ctx.lineWidth = 2;
        ctx.moveTo(0, y); ctx.lineTo(SECTION_CW, y);
        ctx.stroke(); ctx.setLineDash([]);
      }
      if (layer.surfacetype === "rsi") {
        ctx.beginPath(); ctx.setLineDash([8, 4]);
        ctx.strokeStyle = "#dc2626"; ctx.lineWidth = 2;
        ctx.moveTo(0, y); ctx.lineTo(SECTION_CW, y);
        ctx.stroke(); ctx.setLineDash([]);
      }

      // material1（背景・全幅）
      const m1 = layer.materials[0];
      ctx.fillStyle = COLOR_MAP[m1?.color] || "#ddd";
      ctx.fillRect(0, y, SECTION_CW, h);
      ctx.strokeStyle = "rgba(0,0,0,0.08)";
      ctx.lineWidth = 0.5;
      ctx.strokeRect(0, y, SECTION_CW, h);

      // material2+（熱橋部・幅比で中央）
      layer.materials.slice(1).forEach((mat) => {
        if (mat.materialType === "none") return;
        const ratio = parseFloat(mat.ratioForU) || 0.1;
        const bw = SECTION_CW * ratio;
        const bx = (SECTION_CW - bw) / 2;
        ctx.fillStyle = COLOR_MAP[mat.color] || "#888";
        ctx.fillRect(bx, y, bw, h);
      });

      y += h;
    });
  }, [layers]);

  return (
    <canvas ref={canvasRef} width={SECTION_CW} height={SECTION_CH}
      style={{ width: "100%", height: "auto", display: "block", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-md)" }} />
  );
}

// ============================================================
// 固定荷重パネル（縦積み・横向き断面図付き）
// ============================================================
function DeadLoadPanel({ result, layers }) {
  const { rows, total } = result;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* 縦積み計算表 */}
      <div style={{ border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-md)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "var(--color-background-secondary)" }}>
              {["材料", "比重 (kg/m³)", "d (m)", "充足率", "荷重 (N/m²)"].map((h, i) => (
                <th key={h} style={{
                  padding: "6px 10px", fontSize: 11, fontWeight: 500,
                  color: "var(--color-text-secondary)",
                  borderBottom: "1px solid var(--color-border-secondary)",
                  textAlign: i === 0 ? "left" : "right",
                  whiteSpace: "nowrap",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "16px 10px", textAlign: "center", fontSize: 12, color: "var(--color-text-secondary)" }}>
                  有効な材料がありません
                </td>
              </tr>
            ) : rows.map((row, i) => (
              <tr key={i} style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                <td style={{ padding: "7px 10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {row.color && (
                      <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: COLOR_MAP[row.color] || "#ccc", flexShrink: 0 }} />
                    )}
                    <div>
                      <div style={{ fontSize: 10, color: "var(--color-text-secondary)" }}>{row.category || ""}</div>
                      <div style={{ fontSize: 11, fontWeight: 500 }}>{row.material}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "7px 10px", textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11 }}>
                  {row.rho > 0 ? row.rho.toFixed(0) : "—"}
                </td>
                <td style={{ padding: "7px 10px", textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11 }}>
                  {row.d.toFixed(3)}
                </td>
                <td style={{ padding: "7px 10px", textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11 }}>
                  {row.ratio.toFixed(3)}
                </td>
                <td style={{ padding: "7px 10px", textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 500 }}>
                  {row.load.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: "1px solid var(--color-border-secondary)", background: "var(--color-background-secondary)" }}>
              <td colSpan={4} style={{ padding: "8px 10px", fontWeight: 500, fontSize: 12 }}>合計</td>
              <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 500 }}>
                {total.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* 合計荷重ハイライト */}
        <div style={{ padding: "10px 14px", background: "var(--color-background-secondary)", borderTop: "1px solid var(--color-border-secondary)", display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 500, color: "var(--color-text-primary)" }}>
            {total.toFixed(2)}
          </span>
          <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>N/m²</span>
          <span style={{ fontSize: 11, color: "var(--color-text-secondary)", marginLeft: 4 }}>固定荷重合計</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// メインアプリ
// ============================================================
export default function InsulationCalc() {
  const [layers, setLayers] = useState(initialLayers);
  const [surfacePart, setSurfacePart] = useState("外壁(通気層)");
  const [activeTab, setActiveTab] = useState("section");

  // ── ファイル管理 state ──
  const [fileName, setFileName] = useState({ part: "", midName: "", number: "", memo: "" });
  const [fileMsg, setFileMsg] = useState(null);
  const [showFilePanel, setShowFilePanel] = useState(true);
  const [isDirty, setIsDirty] = useState(false); // 未保存変更あり
  const fileInputRef = useRef(null);

  const surfaceData = RSI_RSE_VALUES.find((r) => r.part === surfacePart) || RSI_RSE_VALUES[4];
  const uResult = calculateUValue(layers, surfaceData.rsi, surfaceData.rse);
  const dlResult = calculateDeadLoad(layers);

  const updateLayer = useCallback((i, val) => {
    setLayers((prev) => { const next = [...prev]; next[i] = val; return next; });
    setIsDirty(true);
  }, []);

  const rsiCount = layers.filter((l) => l.surfacetype === "rsi").length;
  const rseCount = layers.filter((l) => l.surfacetype === "rse").length;
  const hasError = rsiCount > 1 || rseCount > 1;

  const fullName = [fileName.part, fileName.midName, fileName.number].filter(Boolean).join("-") || "無題";

  function showMsg(type, text) {
    setFileMsg({ type, text });
    setTimeout(() => setFileMsg(null), 3000);
  }

  // ── JSONをダウンロード ──
  function downloadJSON(data, name) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── 新規保存（名前を付けてダウンロード） ──
  function handleSaveNew() {
    if (!fileName.part && !fileName.midName && !fileName.number) {
      showMsg("err", "ファイル名を入力してください"); return;
    }
    const data = { fullName, memo: fileName.memo, layers, surfacePart, savedAt: new Date().toISOString() };
    downloadJSON(data, `${fullName}.json`);
    setIsDirty(false);
    showMsg("ok", `「${fullName}.json」をダウンロードしました`);
  }

  // ── 上書き保存（同名でダウンロード） ──
  function handleOverwrite() {
    const data = { fullName, memo: fileName.memo, layers, surfacePart, savedAt: new Date().toISOString() };
    downloadJSON(data, `${fullName}.json`);
    setIsDirty(false);
    showMsg("ok", `「${fullName}.json」を上書き保存しました`);
  }

  // ── 別名保存（新しいファイル名でダウンロード） ──
  function handleSaveAs() {
    const newName = window.prompt("別名を入力してください（部位名-中間名-番号）", fullName);
    if (!newName) return;
    const data = { fullName: newName, memo: fileName.memo, layers, surfacePart, savedAt: new Date().toISOString() };
    downloadJSON(data, `${newName}.json`);
    setIsDirty(false);
    showMsg("ok", `「${newName}.json」として保存しました`);
  }

  // ── ファイルを開く（JSONアップロード） ──
  function handleOpenClick() {
    if (isDirty && !window.confirm("未保存の変更があります。開きますか？")) return;
    fileInputRef.current.click();
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        setLayers(data.layers);
        setSurfacePart(data.surfacePart || "外壁(通気層)");
        const parts = (data.fullName || "").split("-");
        setFileName({ part: parts[0] || "", midName: parts[1] || "", number: parts[2] || "", memo: data.memo || "" });
        setIsDirty(false);
        showMsg("ok", `「${data.fullName || file.name}」を読み込みました`);
      } catch { showMsg("err", "ファイルの読み込みに失敗しました（JSONが不正です）"); }
    };
    reader.readAsText(file);
    e.target.value = ""; // 同名ファイルの再選択を可能に
  }

  // ── 新規作成 ──
  function handleNew() {
    if (isDirty && !window.confirm("未保存の変更があります。新規作成しますか？")) return;
    setLayers(initialLayers);
    setSurfacePart("外壁(通気層)");
    setFileName({ part: "", midName: "", number: "", memo: "" });
    setIsDirty(false);
    showMsg("ok", "新規作成しました");
  }

  const TABS = [
    { id: "section", label: "断面構成" },
    { id: "uvalue",  label: "熱貫流率" },
    { id: "deadload",label: "固定荷重" },
  ];

  const panelStyle = {
    border: "0.5px solid var(--color-border-tertiary)",
    borderRadius: "var(--border-radius-lg)",
    background: "var(--color-background-primary)",
    overflow: "hidden",
  };

  const legendStyle = {
    fontSize: 10, color: "var(--color-text-secondary)",
    display: "flex", gap: 10, marginTop: 6,
  };

  const inpStyle = {
    fontSize: 11, padding: "3px 6px", borderRadius: 4,
    border: "0.5px solid var(--color-border-secondary)",
    background: "var(--color-background-primary)",
    color: "var(--color-text-primary)", width: "100%",
  };

  const btnStyle = (variant = "default") => ({
    fontSize: 11, padding: "4px 10px", borderRadius: 4, cursor: "pointer",
    border: "0.5px solid var(--color-border-secondary)",
    background: variant === "primary" ? "#185FA5" : variant === "danger" ? "none" : "var(--color-background-secondary)",
    color: variant === "primary" ? "white" : variant === "danger" ? "#dc2626" : "var(--color-text-primary)",
    whiteSpace: "nowrap",
  });

  return (
    <div style={{ fontFamily: "var(--font-sans)", color: "var(--color-text-primary)", maxWidth: 1000, margin: "0 auto" }}>

      {/* ── ヘッダー ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
        <h2 style={{ fontSize: 15, fontWeight: 500, margin: 0 }}>断熱・荷重計算ツール</h2>
        {fullName !== "無題" && (
          <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>— {fullName}{isDirty ? " *" : ""}</span>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
          <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>部位:</span>
          <select value={surfacePart} onChange={(e) => setSurfacePart(e.target.value)}
            style={{ fontSize: 12, padding: "3px 8px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)", color: "var(--color-text-primary)" }}>
            {RSI_RSE_VALUES.map((r) => <option key={r.part} value={r.part}>{r.part}</option>)}
          </select>
          <span style={{ fontSize: 11, color: "var(--color-text-secondary)", fontFamily: "var(--font-mono)" }}>
            Rsi={surfaceData.rsi} / Rse={surfaceData.rse}
          </span>
        </div>
      </div>

      {hasError && (
        <div style={{ marginBottom: 10, padding: "6px 12px", borderRadius: "var(--border-radius-md)", background: "#fee2e2", border: "0.5px solid #fca5a5", fontSize: 11, color: "#991b1b" }}>
          {rsiCount > 1 ? "エラー: Rsi境界が複数設定されています" : "エラー: Rse境界が複数設定されています"}
        </div>
      )}

      {/* メッセージ */}
      {fileMsg && (
        <div style={{ marginBottom: 10, padding: "6px 12px", borderRadius: "var(--border-radius-md)", fontSize: 11,
          background: fileMsg.type === "ok" ? "#f0fdf4" : "#fee2e2",
          border: `0.5px solid ${fileMsg.type === "ok" ? "#86efac" : "#fca5a5"}`,
          color: fileMsg.type === "ok" ? "#166534" : "#991b1b" }}>
          {fileMsg.text}
        </div>
      )}

      {/* ── 2カラムグリッド ── */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.4fr)", gap: 16, alignItems: "start" }}>

        {/* ── 左カラム ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* ファイル管理パネル */}
          <div style={panelStyle}>
            <div style={{ padding: "8px 12px", borderBottom: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-secondary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 500 }}>ファイル管理</span>
                {isDirty && <span style={{ fontSize: 10, color: "#92400e", background: "#fffbeb", padding: "1px 6px", borderRadius: 3 }}>未保存</span>}
              </div>
              <button onClick={() => setShowFilePanel((v) => !v)} style={{ ...btnStyle(), fontSize: 10, padding: "2px 7px" }}>
                {showFilePanel ? "閉じる" : "開く"}
              </button>
            </div>

            {showFilePanel && (
              <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 10 }}>

                {/* ファイル名入力 */}
                {/* 部位名：タブ選択 */}
                <div>
                  <div style={{ fontSize: 10, color: "var(--color-text-secondary)", marginBottom: 4 }}>部位名</div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {["Wall", "Ceiling", "Floor", "Roof"].map((p) => (
                      <button key={p} onClick={() => { setFileName((f) => ({ ...f, part: p })); setIsDirty(true); }}
                        style={{
                          flex: 1, fontSize: 11, padding: "4px 0", borderRadius: 4, cursor: "pointer",
                          border: `0.5px solid ${fileName.part === p ? "#185FA5" : "var(--color-border-secondary)"}`,
                          background: fileName.part === p ? "#dbeafe" : "var(--color-background-secondary)",
                          color: fileName.part === p ? "#0C447C" : "var(--color-text-primary)",
                          fontWeight: fileName.part === p ? 500 : 400,
                        }}>{p}</button>
                    ))}
                  </div>
                </div>

                {/* 中間名・番号・メモ */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                  {[["midName", "中間名 (Name)"], ["number", "番号 (No.)"], ["memo", "メモ (Memo)"]].map(([key, label]) => (
                    <div key={key}>
                      <div style={{ fontSize: 10, color: "var(--color-text-secondary)", marginBottom: 2 }}>{label}</div>
                      <input value={fileName[key]}
                        onChange={(e) => { setFileName((f) => ({ ...f, [key]: e.target.value })); setIsDirty(true); }}
                        style={inpStyle} placeholder={label.split(" ")[0]} />
                    </div>
                  ))}
                </div>

                {/* フルネームプレビュー */}
                <div style={{ fontSize: 11, color: "var(--color-text-secondary)", fontFamily: "var(--font-mono)", padding: "4px 8px", background: "var(--color-background-secondary)", borderRadius: 4 }}>
                  📄 {fullName}.json
                </div>

                {/* 操作ボタン */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button onClick={handleNew} style={btnStyle()}>新規</button>
                  <button onClick={handleSaveNew} style={btnStyle("primary")}>保存</button>
                  <button onClick={handleOverwrite} style={btnStyle()}>上書き保存</button>
                  <button onClick={handleSaveAs} style={btnStyle()}>別名保存</button>
                  <button onClick={handleOpenClick} style={btnStyle()}>📂 開く</button>
                </div>

                {/* 非表示ファイル入力 */}
                <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange}
                  style={{ display: "none" }} />

                <div style={{ fontSize: 10, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                  保存：JSONファイルとしてダウンロードされます。<br />
                  開く：保存したJSONファイルを選択して読み込みます。
                </div>
              </div>
            )}
          </div>

          {/* 断面構成パネル */}
          <div style={panelStyle}>
            <div style={{ padding: "10px 12px", borderBottom: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-secondary)" }}>
              <span style={{ fontSize: 12, fontWeight: 500 }}>断面構成</span>
            </div>
            <div style={{ padding: "10px 12px" }}>
              {layers.map((layer, i) => (
                <LayerRow key={i} layer={layer} index={i} onChange={(val) => updateLayer(i, val)} />
              ))}
            </div>
          </div>
        </div>

        {/* ── 右カラム：断面プレビュー（常時）＋タブ切り替え結果 ── */}
        <div style={{ position: "sticky", top: 16, display: "flex", flexDirection: "column", gap: 12 }}>

          {/* 断面プレビュー（全タブ共通・常時表示） */}
          <div style={panelStyle}>
            <div style={{ padding: "8px 12px", borderBottom: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-secondary)" }}>
              <span style={{ fontSize: 12, fontWeight: 500 }}>断面プレビュー</span>
            </div>
            <div style={{ padding: 12 }}>
              <HorizontalSection layers={layers} />
              <div style={legendStyle}>
                <span><span style={{ display: "inline-block", width: 10, height: 2, background: "#2563eb", marginRight: 3, verticalAlign: "middle" }} />Rse</span>
                <span><span style={{ display: "inline-block", width: 10, height: 2, background: "#dc2626", marginRight: 3, verticalAlign: "middle" }} />Rsi</span>
              </div>
            </div>
          </div>

          {/* タブバー */}
          <div style={{ display: "flex", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
            {TABS.map(({ id, label }) => (
              <button key={id} onClick={() => setActiveTab(id)} style={{
                fontSize: 12, padding: "8px 16px", background: "none", border: "none",
                borderBottom: activeTab === id ? "2px solid #185FA5" : "2px solid transparent",
                color: activeTab === id ? "#185FA5" : "var(--color-text-secondary)",
                cursor: "pointer", marginBottom: -1, fontWeight: activeTab === id ? 500 : 400,
              }}>{label}</button>
            ))}
          </div>

          {/* 断面構成タブ：レイヤー凡例 */}
          {activeTab === "section" && (
            <div style={panelStyle}>
              <div style={{ padding: "8px 12px", borderBottom: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-secondary)" }}>
                <span style={{ fontSize: 12, fontWeight: 500 }}>レイヤー凡例</span>
              </div>
              <div style={{ padding: "8px 12px" }}>
                {layers.filter((l) => l.switchOn && l.thickness).map((layer, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      {layer.materials.filter((m) => m.materialType !== "none").map((mat, mi) => (
                        <span key={mi} style={{ display: "inline-block", width: 12, height: 12, borderRadius: 2, background: COLOR_MAP[mat.color] || "#ccc", border: "0.5px solid rgba(0,0,0,0.15)" }} />
                      ))}
                    </div>
                    <span style={{ fontSize: 11, color: "var(--color-text-secondary)", minWidth: 28 }}>L{layers.indexOf(layer) + 1}</span>
                    <span style={{ fontSize: 11, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {layer.materials[0].material || "（未設定）"}
                      {layer.materials.length > 1 && layer.materials[1].materialType !== "none" && ` + ${layer.materials[1].material || "熱橋"}`}
                    </span>
                    <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--color-text-secondary)", flexShrink: 0 }}>{layer.thickness} mm</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 熱貫流率タブ */}
          {activeTab === "uvalue" && (
            <div style={panelStyle}>
              <div style={{ padding: "8px 12px", borderBottom: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-secondary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 500 }}>熱貫流率計算</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 500, color: "#0C447C" }}>
                  U = {uResult.uFinal.toFixed(3)} W/(m²·K)
                </span>
              </div>
              <div style={{ padding: 12 }}>
                <UValuePanel result={uResult} layers={layers} />
              </div>
            </div>
          )}

          {/* 固定荷重タブ */}
          {activeTab === "deadload" && (
            <div style={panelStyle}>
              <div style={{ padding: "8px 12px", borderBottom: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-secondary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 500 }}>固定荷重計算</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 500, color: "#7c2d12" }}>
                  {dlResult.total.toFixed(1)} N/m²
                </span>
              </div>
              <div style={{ padding: 12 }}>
                <DeadLoadPanel result={dlResult} layers={layers} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
