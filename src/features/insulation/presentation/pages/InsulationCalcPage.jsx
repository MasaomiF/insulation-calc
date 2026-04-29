import { useState, useCallback, useRef, useEffect } from "react";
import { UValuePanel } from "../components/UValuePanel";
import { useInsulationCalc } from "../hooks/useInsulationCalc";
import { getDensityKgM3 as resolveDensityKgM3, getLambda as resolveLambda } from "../../domain/calc/insulationCalculators";
import { INITIAL_DENSITY_DB, INITIAL_MATERIAL_DB } from "../../domain/constants/materialDatabase";

// ============================================================
// 表面熱伝達抵抗（国土交通省 Ver.15 表3.1・3.2）
// ============================================================
const RSI_RSE_VALUES = [
  // 屋根
  { part: "屋根（外気に直接接する）",     rsi: 0.09, rse: 0.04 },
  { part: "屋根（通気層等）",              rsi: 0.09, rse: 0.09 },
  // 天井
  { part: "天井（小屋裏等）",              rsi: 0.09, rse: 0.09 },
  // 外壁
  { part: "外壁（外気に直接接する）",      rsi: 0.11, rse: 0.04 },
  { part: "外壁（通気層等）",              rsi: 0.11, rse: 0.11 },
  // 床
  { part: "床（外気に直接接する）",        rsi: 0.15, rse: 0.04 },
  { part: "床（床裏等）",                  rsi: 0.15, rse: 0.15 },
  // 界壁・界床（表3.2）
  { part: "界壁",                          rsi: 0.11, rse: 0.11 },
  { part: "上階側界床",                    rsi: 0.09, rse: 0.09 },
  { part: "下階側界床",                    rsi: 0.15, rse: 0.15 },
];

// ============================================================
// 熱橋面積比プリセット（国土交通省 住宅・住戸の外皮性能計算プログラム Ver.15）
// ratios: [熱橋1, 熱橋2, 熱橋3]  熱橋が1種類の場合は[x, 0, 0]
// ============================================================
const BRIDGE_RATIO_PRESETS = [
  // ── Wall（外壁・界壁） ──
  // 表4-1 軸組構法 柱・間柱間に断熱する場合
  { id: "wall-jikuglm-fill", group: "Wall", label: "軸組構法・充填断熱（柱間柱間）", ratios: [0.17, 0, 0] },
  // 表4-2 軸組構法 付加断熱（横下地） 熱橋1=構造部材等+付加断熱, 熱橋2=柱間+付加断熱層内
  { id: "wall-jiku-add-yoko", group: "Wall", label: "軸組構法・充填+付加断熱（横下地）", ratios: [0.12, 0.05, 0.08] },
  // 表4-2 軸組構法 付加断熱（縦下地）
  { id: "wall-jiku-add-tate", group: "Wall", label: "軸組構法・充填+付加断熱（縦下地）", ratios: [0.04, 0.13, 0.04] },
  // 表4-1 枠組壁工法 たて枠間に断熱する場合
  { id: "wall-waku-fill", group: "Wall", label: "枠組壁工法・充填断熱（たて枠間）", ratios: [0.23, 0, 0] },
  // 表4-3 枠組壁工法 付加断熱（横下地）
  { id: "wall-waku-add-yoko", group: "Wall", label: "枠組壁工法・充填+付加断熱（横下地）", ratios: [0.14, 0.06, 0.10] },
  // 表4-3 枠組壁工法 付加断熱（縦下地）
  { id: "wall-waku-add-tate", group: "Wall", label: "枠組壁工法・充填+付加断熱（縦下地）", ratios: [0.02, 0.21, 0.01] },

  // ── Ceiling（天井） ──
  // 表5 桁・梁間に断熱する場合
  { id: "ceiling-keta", group: "Ceiling", label: "天井・桁梁間断熱", ratios: [0.13, 0, 0] },

  // ── Floor（床） ──
  // 表3-1 軸組構法 床梁工法・根太間断熱
  { id: "floor-jiku-neta", group: "Floor", label: "軸組構法・床梁工法（根太間断熱）", ratios: [0.20, 0, 0] },
  // 表3-1 軸組構法 束立大引工法 根太間断熱
  { id: "floor-jiku-neta2", group: "Floor", label: "軸組構法・束立大引工法（根太間断熱）", ratios: [0.20, 0, 0] },
  // 表3-1 軸組構法 束立大引工法 大引間断熱
  { id: "floor-jiku-ooiki", group: "Floor", label: "軸組構法・束立大引工法（大引間断熱）", ratios: [0.15, 0, 0] },
  // 表3-2 根太間+大引間断熱
  { id: "floor-jiku-both", group: "Floor", label: "軸組構法・根太間+大引間断熱", ratios: [0.12, 0.13, 0.03] },
  // 表3-1 軸組構法 剛床工法
  { id: "floor-jiku-gou", group: "Floor", label: "軸組構法・剛床工法", ratios: [0.15, 0, 0] },
  // 表3-1 軸組構法 床梁土台同面工法
  { id: "floor-jiku-doudou", group: "Floor", label: "軸組構法・床梁土台同面工法", ratios: [0.30, 0, 0] },
  // 表3-1 枠組壁工法 根太間断熱
  { id: "floor-waku-neta", group: "Floor", label: "枠組壁工法・根太間断熱", ratios: [0.13, 0, 0] },

  // ── Roof（屋根） ──
  // 表6-1 たるき間断熱
  { id: "roof-taruki", group: "Roof", label: "屋根・たるき間断熱", ratios: [0.14, 0, 0] },
  // 表6-2 たるき間断熱+付加断熱（横下地）
  { id: "roof-taruki-add", group: "Roof", label: "屋根・たるき間+付加断熱（横下地）", ratios: [0.12, 0.01, 0.08] },
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
// layer.materials[0] = 断熱部（全面）
// layer.materials[1+] = 熱橋部
// ratioForU は上位の bridgeRatios で一括管理
// ratioForDL は各材料で独立設定
// ============================================================
function makeMat(overrides = {}) {
  return {
    materialType: "none", category: null, material: null, color: null,
    ratioForDL: 0,
    dlOverridden: false,
    ...overrides,
  };
}

// 初期熱橋面積比 [熱橋1, 熱橋2, 熱橋3]
const initialBridgeRatios = [0.17, 0, 0];

function defaultLayer(i) {
  const presets = [
    { switchOn: true, surfacetype: "none", thickness: 15, materials: [
      makeMat({ materialType: "solid", category: "非木質系壁材・下地", material: "窯業系サイディング", color: "gray", ratioForDL: 1 }),
    ]},
    { switchOn: true, surfacetype: "none", thickness: 18, materials: [
      makeMat({ materialType: "air", color: "lightcyan", ratioForDL: 0.83 }),
      makeMat({ materialType: "solid", category: "よく使う材料", material: "天然木材", color: "rosybrown", ratioForDL: 0.059 }),
    ]},
    { switchOn: true, surfacetype: "rse", thickness: 105, materials: [
      makeMat({ materialType: "solid", category: "グラスウール", material: "高性能グラスウール HG16-38", color: "khaki", ratioForDL: 0.83 }),
      makeMat({ materialType: "solid", category: "よく使う材料", material: "天然木材", color: "tan", ratioForDL: 0.099 }),
    ]},
    { switchOn: true, surfacetype: "rsi", thickness: 15, materials: [
      makeMat({ materialType: "air", color: "lightcyan", ratioForDL: 0.83 }),
      makeMat({ materialType: "solid", category: "よく使う材料", material: "天然木材", color: "tan", ratioForDL: 0.099 }),
    ]},
    { switchOn: true, surfacetype: "none", thickness: 12.5, materials: [
      makeMat({ materialType: "solid", category: "よく使う材料", material: "せっこうボード(GB-R)", color: "darkolivegreen", ratioForDL: 1 }),
    ]},
  ];
  if (i < presets.length) return presets[i];
  return { switchOn: false, surfacetype: "none", thickness: null,
    materials: [makeMat({ materialType: "solid", ratioForDL: 1 })] };
}

const initialLayers = Array.from({ length: 10 }, (_, i) => defaultLayer(i));
const SAVE_SCHEMA_VERSION = 2;

function getLambda(materialDb, category, material) {
  return resolveLambda(materialDb, category, material);
}

function getDensityKgM3(densityDb, material) {
  return resolveDensityKgM3(densityDb, material);
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

function MaterialCard({ mat, isFirst, onChange, onRemove, canRemove, materialDb, densityDb }) {
  const categories = Object.keys(materialDb);
  const mats = mat.category ? (materialDb[mat.category] || []) : [];
  const λ = mat.materialType === "solid" ? getLambda(materialDb, mat.category, mat.material) : null;
  const rho = mat.materialType === "solid" ? getDensityKgM3(densityDb, mat.material) : 0;

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
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={mat.material || ""} onChange={(e) => onChange({ ...mat, material: e.target.value })} style={S.sel}>
          <option value="">材料選択</option>
          {mats.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </>)}

      {mat.materialType === "air" && (
        <div style={{ fontSize: 10, color: "var(--color-text-secondary)" }}>R = 0.09 m²K/W</div>
      )}

      {/* 色（ポップアップ式） */}
      <details style={{ position: "relative" }}>
        <summary style={{
          ...S.sel,
          listStyle: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              width: 12,
              height: 12,
              borderRadius: 3,
              border: "0.5px solid rgba(0,0,0,0.2)",
              background: mat.color ? COLOR_MAP[mat.color] : "var(--color-background-secondary)",
              display: "inline-block",
            }} />
            <span>{mat.color || "色を選ぶ"}</span>
          </span>
          <span style={{ fontSize: 10, color: "var(--color-text-secondary)" }}>▼</span>
        </summary>
        <div style={{
          position: "absolute",
          zIndex: 20,
          top: "calc(100% + 4px)",
          left: 0,
          right: 0,
          border: "0.5px solid var(--color-border-secondary)",
          borderRadius: 6,
          background: "var(--color-background-primary)",
          padding: 6,
          boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(8, minmax(0, 1fr))", gap: 4 }}>
            <button
              type="button"
              onClick={() => onChange({ ...mat, color: null })}
              title="色なし"
              style={{
                height: 16,
                borderRadius: 3,
                border: mat.color == null ? "2px solid #185FA5" : "0.5px solid var(--color-border-secondary)",
                background: "var(--color-background-secondary)",
                cursor: "pointer",
                padding: 0,
                fontSize: 9,
                color: "var(--color-text-secondary)",
                lineHeight: "14px",
              }}
            >
              ×
            </button>
            {Object.entries(COLOR_MAP).map(([k, v]) => (
              <button
                key={k}
                type="button"
                onClick={() => onChange({ ...mat, color: k })}
                title={k}
                style={{
                  height: 16,
                  borderRadius: 3,
                  border: mat.color === k ? "2px solid #185FA5" : "0.5px solid rgba(0,0,0,0.2)",
                  background: v,
                  cursor: "pointer",
                  padding: 0,
                }}
              />
            ))}
          </div>
        </div>
      </details>

      {/* 比率入力：DL充足率のみ */}
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "3px 5px", alignItems: "center" }}>
        <span style={S.lbl}>DL充足率</span>
        <input
          type="number" min="0" max="1" step="0.001"
          value={mat.ratioForDL}
          onChange={(e) => onChange({ ...mat, ratioForDL: parseFloat(e.target.value) || 0 })}
          style={S.num}
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
function LayerRow({ layer, index, onChange, onMoveUp, onMoveDown, canMoveUp, canMoveDown, materialDb, densityDb }) {
  const update = (key, val) => onChange({ ...layer, [key]: val });

  const updateMat = (mi, newMat) => {
    const mats = [...layer.materials];
    mats[mi] = newMat;
    onChange({ ...layer, materials: mats });
  };

  const addMat = () => {
    onChange({ ...layer, materials: [...layer.materials, makeMat({ materialType: "solid", ratioForDL: 0 })] });
  };

  const removeMat = (mi) => {
    onChange({ ...layer, materials: layer.materials.filter((_, i) => i !== mi) });
  };

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
        <div style={{ display: "flex", gap: 4 }}>
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            title="上に移動"
            style={{
              fontSize: 10,
              padding: "1px 6px",
              borderRadius: 4,
              border: "0.5px solid var(--color-border-secondary)",
              background: "var(--color-background-primary)",
              color: canMoveUp ? "var(--color-text-primary)" : "var(--color-text-secondary)",
              cursor: canMoveUp ? "pointer" : "not-allowed",
            }}
          >
            ↑
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            title="下に移動"
            style={{
              fontSize: 10,
              padding: "1px 6px",
              borderRadius: 4,
              border: "0.5px solid var(--color-border-secondary)",
              background: "var(--color-background-primary)",
              color: canMoveDown ? "var(--color-text-primary)" : "var(--color-text-secondary)",
              cursor: canMoveDown ? "pointer" : "not-allowed",
            }}
          >
            ↓
          </button>
        </div>

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
              canRemove={mi > 0}
              materialDb={materialDb}
              densityDb={densityDb} />
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
export default function InsulationCalcPage() {
  const [materialDb, setMaterialDb] = useState(INITIAL_MATERIAL_DB);
  const [editingCategory, setEditingCategory] = useState(Object.keys(INITIAL_MATERIAL_DB)[0] || "");
  const [densityDb, setDensityDb] = useState(INITIAL_DENSITY_DB);
  const [showDbPanel, setShowDbPanel] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [renameCategoryName, setRenameCategoryName] = useState("");
  const [newMaterialName, setNewMaterialName] = useState("");
  const [newMaterialLambda, setNewMaterialLambda] = useState(0.04);
  const [newMaterialDensity, setNewMaterialDensity] = useState(0.03);
  const [layers, setLayers] = useState(initialLayers);
  const [surfacePart, setSurfacePart] = useState("外壁（通気層等）");
  const [activeTab, setActiveTab] = useState("section");
  const [bridgeRatios, setBridgeRatios] = useState(initialBridgeRatios);

  // ── ファイル管理 state ──
  const [fileName, setFileName] = useState({ part: "", midName: "", number: "", memo: "" });
  const [fileMsg, setFileMsg] = useState(null);
  const [showFilePanel, setShowFilePanel] = useState(true);
  const [isDirty, setIsDirty] = useState(false); // 未保存変更あり
  const fileInputRef = useRef(null);

  const surfaceData = RSI_RSE_VALUES.find((r) => r.part === surfacePart) || RSI_RSE_VALUES[4];
  const { uResult, dlResult } = useInsulationCalc({
    layers,
    surfaceData,
    bridgeRatios,
    materialDb,
    densityDb,
  });

  const updateLayer = useCallback((i, val) => {
    setLayers((prev) => { const next = [...prev]; next[i] = val; return next; });
    setIsDirty(true);
  }, []);
  const moveLayer = useCallback((from, to) => {
    setLayers((prev) => {
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setIsDirty(true);
  }, []);

  const rsiCount = layers.filter((l) => l.surfacetype === "rsi").length;
  const rseCount = layers.filter((l) => l.surfacetype === "rse").length;
  const hasError = rsiCount > 1 || rseCount > 1;
  const materialCategories = Object.keys(materialDb);
  const editingMaterials = materialDb[editingCategory] || [];

  useEffect(() => {
    if (!materialDb[editingCategory]) {
      setEditingCategory(materialCategories[0] || "");
    }
  }, [editingCategory, materialCategories, materialDb]);

  useEffect(() => {
    setRenameCategoryName(editingCategory);
  }, [editingCategory]);

  const fullName = [fileName.part, fileName.midName, fileName.number].filter(Boolean).join("-") || "無題";

  function createSavePayload(overrides = {}) {
    return {
      schemaVersion: SAVE_SCHEMA_VERSION,
      fullName,
      memo: fileName.memo,
      layers,
      surfacePart,
      bridgeRatios,
      materialDb,
      densityDb,
      savedAt: new Date().toISOString(),
      ...overrides,
    };
  }

  function normalizeLoadedData(raw) {
    const schemaVersion = Number(raw?.schemaVersion || 1);
    const loadedMaterialDb = raw?.materialDb && typeof raw.materialDb === "object" ? raw.materialDb : INITIAL_MATERIAL_DB;
    const loadedDensityDb = raw?.densityDb && typeof raw.densityDb === "object" ? raw.densityDb : INITIAL_DENSITY_DB;

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

    // 旧データ向け: bridgeRatios が無い場合は初期値を補完
    const loadedBridgeRatios = Array.isArray(raw?.bridgeRatios) ? raw.bridgeRatios : initialBridgeRatios;

    return {
      schemaVersion,
      fullName: raw?.fullName || "",
      memo: raw?.memo || "",
      layers: loadedLayers,
      surfacePart: raw?.surfacePart || "外壁（通気層等）",
      bridgeRatios: loadedBridgeRatios,
      materialDb: loadedMaterialDb,
      densityDb: loadedDensityDb,
    };
  }

  function showMsg(type, text) {
    setFileMsg({ type, text });
    setTimeout(() => setFileMsg(null), 3000);
  }

  const updateMaterialLambda = useCallback((category, value, nextLambda) => {
    setMaterialDb((prev) => {
      const items = prev[category] || [];
      return {
        ...prev,
        [category]: items.map((m) => (m.value === value ? { ...m, λ: nextLambda } : m)),
      };
    });
    setIsDirty(true);
  }, []);
  const updateMaterialDensity = useCallback((value, nextDensity) => {
    setDensityDb((prev) => ({ ...prev, [value]: nextDensity }));
    setIsDirty(true);
  }, []);
  const addCategory = useCallback(() => {
    const name = newCategoryName.trim();
    if (!name || materialDb[name]) return;
    setMaterialDb((prev) => ({ ...prev, [name]: [] }));
    setEditingCategory(name);
    setNewCategoryName("");
    setIsDirty(true);
  }, [materialDb, newCategoryName]);
  const renameCategory = useCallback(() => {
    const nextName = renameCategoryName.trim();
    if (!editingCategory || !nextName || nextName === editingCategory || materialDb[nextName]) return;
    setMaterialDb((prev) => {
      const { [editingCategory]: currentItems = [], ...rest } = prev;
      return { ...rest, [nextName]: currentItems };
    });
    setLayers((prev) =>
      prev.map((layer) => ({
        ...layer,
        materials: layer.materials.map((mat) =>
          mat.category === editingCategory ? { ...mat, category: nextName } : mat
        ),
      }))
    );
    setEditingCategory(nextName);
    setIsDirty(true);
  }, [editingCategory, materialDb, renameCategoryName]);
  const moveMaterialToCategory = useCallback((materialValue, targetCategory) => {
    if (!targetCategory) return;
    let sourceCategory = "";
    let movingItem = null;
    Object.entries(materialDb).forEach(([category, items]) => {
      if (movingItem) return;
      const found = items.find((item) => item.value === materialValue);
      if (found) {
        sourceCategory = category;
        movingItem = found;
      }
    });
    if (!movingItem || sourceCategory === targetCategory) return;
    if ((materialDb[targetCategory] || []).some((item) => item.value === materialValue)) return;

    setMaterialDb((prev) => {
      const next = { ...prev };
      next[sourceCategory] = (next[sourceCategory] || []).filter((item) => item.value !== materialValue);
      next[targetCategory] = [...(next[targetCategory] || []), movingItem];
      return next;
    });
    setLayers((prev) =>
      prev.map((layer) => ({
        ...layer,
        materials: layer.materials.map((mat) =>
          mat.material === materialValue ? { ...mat, category: targetCategory } : mat
        ),
      }))
    );
    setIsDirty(true);
  }, [materialDb]);
  const addMaterialToCategory = useCallback(() => {
    const name = newMaterialName.trim();
    if (!editingCategory || !name) return;
    const exists = Object.values(materialDb).some((items) => items.some((item) => item.value === name));
    if (exists) return;
    const nextLambda = parseFloat(newMaterialLambda) || 0;
    const nextDensity = parseFloat(newMaterialDensity) || 0;
    setMaterialDb((prev) => ({
      ...prev,
      [editingCategory]: [
        ...(prev[editingCategory] || []),
        { label: name, value: name, λ: nextLambda },
      ],
    }));
    setDensityDb((prev) => ({ ...prev, [name]: nextDensity }));
    setNewMaterialName("");
    setNewMaterialLambda(0.04);
    setNewMaterialDensity(0.03);
    setIsDirty(true);
  }, [editingCategory, materialDb, newMaterialDensity, newMaterialLambda, newMaterialName]);

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
    const data = createSavePayload();
    downloadJSON(data, `${fullName}.json`);
    setIsDirty(false);
    showMsg("ok", `「${fullName}.json」をダウンロードしました`);
  }

  // ── 上書き保存（同名でダウンロード） ──
  function handleOverwrite() {
    const data = createSavePayload();
    downloadJSON(data, `${fullName}.json`);
    setIsDirty(false);
    showMsg("ok", `「${fullName}.json」を上書き保存しました`);
  }

  // ── 別名保存（新しいファイル名でダウンロード） ──
  function handleSaveAs() {
    const newName = window.prompt("別名を入力してください（部位名-中間名-番号）", fullName);
    if (!newName) return;
    const data = createSavePayload({ fullName: newName });
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
        const rawData = JSON.parse(ev.target.result);
        const data = normalizeLoadedData(rawData);
        setLayers(data.layers);
        setSurfacePart(data.surfacePart);
        setBridgeRatios(data.bridgeRatios);
        setMaterialDb(data.materialDb);
        setDensityDb(data.densityDb);
        const firstCategory = Object.keys(data.materialDb)[0];
        if (firstCategory) setEditingCategory(firstCategory);
        const parts = (data.fullName || "").split("-");
        setFileName({ part: parts[0] || "", midName: parts[1] || "", number: parts[2] || "", memo: data.memo || "" });
        setIsDirty(false);
        showMsg("ok", `「${data.fullName || file.name}」を読み込みました（schema v${data.schemaVersion}）`);
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
    setMaterialDb(INITIAL_MATERIAL_DB);
    setDensityDb(INITIAL_DENSITY_DB);
    setEditingCategory(Object.keys(INITIAL_MATERIAL_DB)[0] || "");
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
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <h2 style={{ fontSize: 15, fontWeight: 500, margin: 0 }}>断熱・荷重計算ツール</h2>
        {fullName !== "無題" && (
          <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>— {fullName}{isDirty ? " *" : ""}</span>
        )}
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

          {/* 物性値データベース編集 */}
          <div style={panelStyle}>
            <div style={{ padding: "8px 12px", borderBottom: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-secondary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 500 }}>物性値データベース（λ / 比重 / カテゴリ）</span>
              <button onClick={() => setShowDbPanel((v) => !v)} style={{ ...btnStyle(), fontSize: 10, padding: "2px 7px" }}>
                {showDbPanel ? "閉じる" : "開く"}
              </button>
            </div>
            {showDbPanel && (
              <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 6 }}>
                  <select
                    value={editingCategory}
                    onChange={(e) => setEditingCategory(e.target.value)}
                    style={{ ...inpStyle, fontSize: 11 }}
                  >
                    {materialCategories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  <button onClick={renameCategory} style={btnStyle()}>カテゴリ名変更</button>
                </div>
                <input
                  value={renameCategoryName}
                  onChange={(e) => setRenameCategoryName(e.target.value)}
                  style={inpStyle}
                  placeholder="カテゴリ名を編集"
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 6 }}>
                  <input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    style={inpStyle}
                    placeholder="新規カテゴリ名"
                  />
                  <button onClick={addCategory} style={btnStyle()}>カテゴリ追加</button>
                </div>
                <div style={{ maxHeight: 260, overflowY: "auto", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 4, padding: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                  {editingMaterials.length === 0 ? (
                    <div style={{ padding: "12px 8px", fontSize: 11, color: "var(--color-text-secondary)" }}>
                      このカテゴリに材料がありません。
                    </div>
                  ) : editingMaterials.map((item) => (
                    <div key={item.value} style={{ border: "0.5px solid var(--color-border-tertiary)", borderRadius: 6, background: "var(--color-background-primary)" }}>
                      <div style={{ padding: "7px 10px", fontSize: 12, fontWeight: 500, borderBottom: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-secondary)" }}>
                        {item.label || item.value}
                      </div>
                      <div style={{ padding: "8px 10px", display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr", gap: 8 }}>
                        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <span style={{ fontSize: 10, color: "var(--color-text-secondary)" }}>カテゴリ</span>
                          <select
                            value={editingCategory}
                            onChange={(e) => moveMaterialToCategory(item.value, e.target.value)}
                            style={{ ...inpStyle, fontSize: 11 }}
                          >
                            {materialCategories.map((category) => (
                              <option key={`${item.value}-${category}`} value={category}>{category}</option>
                            ))}
                          </select>
                        </label>
                        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <span style={{ fontSize: 10, color: "var(--color-text-secondary)" }}>λ</span>
                          <input
                            type="number"
                            step="0.001"
                            min="0"
                            value={item.λ}
                            onChange={(e) => updateMaterialLambda(editingCategory, item.value, parseFloat(e.target.value) || 0)}
                            style={{ ...inpStyle, fontFamily: "var(--font-mono)", textAlign: "right" }}
                          />
                        </label>
                        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <span style={{ fontSize: 10, color: "var(--color-text-secondary)" }}>比重</span>
                          <input
                            type="number"
                            step="0.001"
                            min="0"
                            value={densityDb[item.value] ?? 0}
                            onChange={(e) => updateMaterialDensity(item.value, parseFloat(e.target.value) || 0)}
                            style={{ ...inpStyle, fontFamily: "var(--font-mono)", textAlign: "right" }}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ border: "0.5px solid var(--color-border-tertiary)", borderRadius: 4, padding: 8, display: "grid", gap: 6 }}>
                  <div style={{ fontSize: 10, color: "var(--color-text-secondary)", fontWeight: 500 }}>材料を追加（現在カテゴリ: {editingCategory || "未選択"}）</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1.6fr 0.8fr 0.8fr auto", gap: 6 }}>
                    <input
                      value={newMaterialName}
                      onChange={(e) => setNewMaterialName(e.target.value)}
                      style={inpStyle}
                      placeholder="材料名"
                    />
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={newMaterialLambda}
                      onChange={(e) => setNewMaterialLambda(parseFloat(e.target.value) || 0)}
                      style={{ ...inpStyle, fontFamily: "var(--font-mono)", textAlign: "right" }}
                      placeholder="λ"
                    />
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={newMaterialDensity}
                      onChange={(e) => setNewMaterialDensity(parseFloat(e.target.value) || 0)}
                      style={{ ...inpStyle, fontFamily: "var(--font-mono)", textAlign: "right" }}
                      placeholder="比重"
                    />
                    <button onClick={addMaterialToCategory} style={btnStyle("primary")}>追加</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 計算条件パネル（Rsi/Rse + 熱橋面積比） */}
          <div style={panelStyle}>
            <div style={{ padding: "8px 12px", borderBottom: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-secondary)" }}>
              <span style={{ fontSize: 12, fontWeight: 500 }}>計算条件</span>
            </div>
            <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 12 }}>

              {/* 表面熱伝達抵抗 */}
              <div>
                <div style={{ fontSize: 10, color: "var(--color-text-secondary)", marginBottom: 4, fontWeight: 500 }}>表面熱伝達抵抗（Rsi / Rse）</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <select value={surfacePart} onChange={(e) => { setSurfacePart(e.target.value); setIsDirty(true); }}
                    style={{ ...inpStyle, fontSize: 11, flex: 1 }}>
                    <optgroup label="屋根">
                      {RSI_RSE_VALUES.filter(r => r.part.startsWith("屋根")).map((r) => <option key={r.part} value={r.part}>{r.part}</option>)}
                    </optgroup>
                    <optgroup label="天井">
                      {RSI_RSE_VALUES.filter(r => r.part.startsWith("天井")).map((r) => <option key={r.part} value={r.part}>{r.part}</option>)}
                    </optgroup>
                    <optgroup label="外壁">
                      {RSI_RSE_VALUES.filter(r => r.part.startsWith("外壁")).map((r) => <option key={r.part} value={r.part}>{r.part}</option>)}
                    </optgroup>
                    <optgroup label="床">
                      {RSI_RSE_VALUES.filter(r => r.part.startsWith("床")).map((r) => <option key={r.part} value={r.part}>{r.part}</option>)}
                    </optgroup>
                    <optgroup label="界壁・界床">
                      {RSI_RSE_VALUES.filter(r => r.part.startsWith("界") || r.part.includes("界床")).map((r) => <option key={r.part} value={r.part}>{r.part}</option>)}
                    </optgroup>
                  </select>
                  <span style={{ fontSize: 11, color: "var(--color-text-secondary)", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>
                    Rsi={surfaceData.rsi} / Rse={surfaceData.rse}
                  </span>
                </div>
              </div>

              {/* 区切り線 */}
              <div style={{ borderTop: "0.5px solid var(--color-border-tertiary)" }} />

              {/* 熱橋面積比 */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 10, color: "var(--color-text-secondary)", fontWeight: 500 }}>熱橋面積比（U値計算用）</div>

                {/* プリセット選択 */}
                <select defaultValue="" onChange={(e) => {
                    if (!e.target.value) return;
                    const preset = BRIDGE_RATIO_PRESETS.find((p) => p.id === e.target.value);
                    if (preset) { setBridgeRatios([...preset.ratios]); setIsDirty(true); }
                    e.target.value = "";
                  }}
                  style={{ ...inpStyle, fontSize: 11 }}>
                  <option value="">── プリセットを選択（国交省 Ver.15）──</option>
                  {["Wall", "Ceiling", "Floor", "Roof"].map((group) => (
                    <optgroup key={group} label={group}>
                      {BRIDGE_RATIO_PRESETS.filter((p) => p.group === group).map((p) => (
                        <option key={p.id} value={p.id}>{p.label}　熱橋={p.ratios.filter(r=>r>0).map(r=>r.toFixed(2)).join("+")} / 断熱={(1-p.ratios.reduce((s,r)=>s+r,0)).toFixed(2)}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>

                {/* 断熱部（自動） */}
                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "var(--color-text-secondary)", minWidth: 56 }}>断熱部</span>
                  <div style={{ height: 6, borderRadius: 3, background: "#dbeafe", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${uResult.insulationRatio * 100}%`, background: "#185FA5", borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", minWidth: 42, textAlign: "right" }}>
                    {uResult.insulationRatio.toFixed(3)}
                  </span>
                </div>

                {/* 熱橋1〜3 */}
                {[0, 1, 2].map((idx) => (
                  <div key={idx} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "var(--color-text-secondary)", minWidth: 56 }}>熱橋 {idx + 1}</span>
                    <input type="range" min="0" max="0.5" step="0.001"
                      value={bridgeRatios[idx]}
                      onChange={(e) => { const n=[...bridgeRatios]; n[idx]=parseFloat(e.target.value); setBridgeRatios(n); setIsDirty(true); }}
                      style={{ width: "100%", accentColor: "#92400e" }} />
                    <input type="number" min="0" max="0.5" step="0.001"
                      value={bridgeRatios[idx]}
                      onChange={(e) => { const n=[...bridgeRatios]; n[idx]=parseFloat(e.target.value)||0; setBridgeRatios(n); setIsDirty(true); }}
                      style={{ ...inpStyle, width: 58, fontFamily: "var(--font-mono)", textAlign: "right" }} />
                  </div>
                ))}

                {/* 合計チェック */}
                {(() => {
                  const total = bridgeRatios.reduce((s, r) => s + (parseFloat(r) || 0), 0);
                  const ok = total <= 1.0;
                  return (
                    <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", padding: "3px 8px", borderRadius: 3,
                      background: ok ? "#f0fdf4" : "#fee2e2", color: ok ? "#166534" : "#991b1b" }}>
                      Σ熱橋 = {total.toFixed(3)}　断熱部 = {(1 - total).toFixed(3)}
                      {!ok && "　⚠ 合計が1を超えています"}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* 断面構成パネル */}
          <div style={panelStyle}>
            <div style={{ padding: "10px 12px", borderBottom: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-secondary)" }}>
              <span style={{ fontSize: 12, fontWeight: 500 }}>断面構成</span>
            </div>
            <div style={{ padding: "10px 12px" }}>
              {layers.map((layer, i) => (
                <LayerRow
                  key={i}
                  layer={layer}
                  index={i}
                  onChange={(val) => updateLayer(i, val)}
                  onMoveUp={() => moveLayer(i, i - 1)}
                  onMoveDown={() => moveLayer(i, i + 1)}
                  canMoveUp={i > 0}
                  canMoveDown={i < layers.length - 1}
                  materialDb={materialDb}
                  densityDb={densityDb}
                />
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
                <UValuePanel result={uResult} colorMap={COLOR_MAP} />
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
