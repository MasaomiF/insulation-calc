import { forwardRef } from "react";
import { layerLegendMaterialLabel } from "../utils/layerLegendMaterialLabel";

const box = { border: "1px solid #d4d4d4", borderRadius: 3, padding: "6px 8px" };
const h2 = { fontSize: 11, fontWeight: 700, margin: "0 0 5px 0", color: "#111827", borderBottom: "1px solid #e5e7eb", paddingBottom: 3 };
const muted = { fontSize: 8, color: "#6b7280" };
const tableBase = { width: "100%", borderCollapse: "collapse", fontSize: 7.5, color: "#111827", tableLayout: "fixed" };
const th = { padding: "2px 3px", borderBottom: "1px solid #9ca3af", textAlign: "left", background: "#f3f4f6", fontWeight: 600, fontSize: 7 };
const td = { padding: "2px 3px", borderBottom: "1px solid #e5e7eb", verticalAlign: "top", wordBreak: "break-word" };
const tdR = { ...td, textAlign: "right", fontFamily: "ui-monospace, monospace" };
const colStack = { display: "flex", flexDirection: "column", gap: 8 };

function uRowCells(row, i, colorMap) {
  const isRsi = row.label.startsWith("室内側");
  const isRse = row.label.startsWith("外気側");
  const isSurface = isRsi || isRse;
  const lam = isSurface ? "—" : row.λ == null ? "—" : typeof row.λ === "number" ? String(row.λ) : String(row.λ);
  const d = isSurface ? "—" : row.d.toFixed(3);
  const flag = isSurface ? "—" : row.flag;
  const rIns = isSurface
    ? row.R_ins.toFixed(3)
    : row.flag === "熱橋"
      ? "0"
      : row.R_ins > 0
        ? row.R_ins.toFixed(3)
        : "";
  const rBr = isSurface
    ? row.R_bridge.toFixed(3)
    : row.flag === "断熱"
      ? "0"
      : row.R_bridge > 0
        ? row.R_bridge.toFixed(3)
        : "";
  return (
    <tr key={i} style={{ background: isSurface ? "#f9fafb" : undefined }}>
      <td style={td}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
          {row.color && !isSurface && (
            <span
              style={{
                display: "inline-block",
                width: 5,
                height: 5,
                borderRadius: 1,
                background: colorMap[row.color] || "#ccc",
                flexShrink: 0,
              }}
            />
          )}
          <span>{row.label}</span>
        </span>
      </td>
      <td style={tdR}>{lam}</td>
      <td style={tdR}>{d}</td>
      <td style={{ ...td, textAlign: "center", fontSize: 6.5 }}>{flag}</td>
      <td style={tdR}>{rIns}</td>
      <td style={tdR}>{rBr}</td>
    </tr>
  );
}

export const InsulationPdfReportRoot = forwardRef(function InsulationPdfReportRoot(
  {
    fullName,
    fileMemo,
    generatedAt,
    surfacePart,
    rsi,
    rse,
    bridgeRatios,
    bridgePresetLabel,
    layers,
    uResult,
    dlResult,
    colorMap,
  },
  ref
) {
  const bridgeTotal = bridgeRatios.reduce((s, r) => s + (parseFloat(r) || 0), 0);
  const insulationPart = 1 - bridgeTotal;

  const hasUValue = uResult != null;
  let sumRBridge = 0;
  let sumRIns = 0;
  let R_bridge_disp = 0;
  let U_bridge_disp = 0;
  let bridgeRatio = 0;
  if (hasUValue) {
    sumRBridge = uResult.rows.reduce((sum, row) => {
      if (row.label?.startsWith("室内側") || row.label?.startsWith("外気側")) return sum + (row.R_bridge || 0);
      if (row.flag === "断熱") return sum;
      return sum + (row.R_bridge || 0);
    }, 0);
    sumRIns = uResult.rows.reduce((sum, row) => {
      if (row.label?.startsWith("室内側") || row.label?.startsWith("外気側")) return sum + (row.R_ins || 0);
      if (row.flag === "熱橋") return sum;
      return sum + (row.R_ins || 0);
    }, 0);
    R_bridge_disp = uResult.R_bridge_disp;
    U_bridge_disp = R_bridge_disp > 0 ? 1 / R_bridge_disp : 0;
    bridgeRatio = 1 - uResult.insulationRatio;
  }

  const activeLayers = layers.filter((l) => l.switchOn && l.thickness);

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        left: -12000,
        top: 0,
        width: 794,
        padding: 14,
        background: "#ffffff",
        color: "#111827",
        fontFamily: '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", Meiryo, sans-serif',
        fontSize: 9,
        lineHeight: 1.35,
        boxSizing: "border-box",
      }}
    >
      <div style={{ marginBottom: 8, borderBottom: "1px solid #e5e7eb", paddingBottom: 6 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", lineHeight: 1.3 }}>{fullName || "無題"}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", marginTop: 4, ...muted, fontSize: 8 }}>
          <span>出力: {generatedAt}</span>
          {fileMemo ? <span>メモ: {fileMemo}</span> : null}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          alignItems: "start",
        }}
      >
        {/* ── 左列: 条件 + 断面図 ── */}
        <div style={colStack}>
          <div style={box}>
            <div style={h2}>計算条件</div>
            <div style={{ ...muted, marginBottom: 2 }}>表面熱伝達抵抗</div>
            <div style={{ marginBottom: 5, fontSize: 8 }}>
              {surfacePart}
              <span style={muted}>　Rsi={rsi} / Rse={rse}</span>
            </div>
            <div style={{ ...muted, marginBottom: 2 }}>熱橋面積比（U値）</div>
            <div style={{ fontSize: 8, marginBottom: 3 }}>{bridgePresetLabel}</div>
            <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 8 }}>
              橋1={Number(bridgeRatios[0] || 0).toFixed(3)} 橋2={Number(bridgeRatios[1] || 0).toFixed(3)} 橋3=
              {Number(bridgeRatios[2] || 0).toFixed(3)}
            </div>
            <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 8, marginTop: 2 }}>
              Σ熱橋={bridgeTotal.toFixed(3)}　断熱={insulationPart.toFixed(3)}
            </div>
          </div>

          <div style={box}>
            <div style={h2}>断面プレビュー</div>
            <div style={{ ...muted, fontSize: 7, marginBottom: 4 }}>青: Rse / 赤: Rsi</div>
            <img
              data-pdf-section
              alt=""
              src=""
              style={{ display: "block", width: "100%", height: "auto", border: "1px solid #e5e7eb" }}
            />
          </div>
        </div>

        {/* ── 右列: レイヤー + U + 荷重 ── */}
        <div style={colStack}>
          <div style={box}>
            <div style={h2}>断面構成（レイヤー）</div>
            {activeLayers.length === 0 ? (
              <div style={muted}>有効なレイヤーなし</div>
            ) : (
              <table style={tableBase}>
                <thead>
                  <tr>
                    <th style={{ ...th, width: "10%" }}>L</th>
                    <th style={th}>材料</th>
                    <th style={{ ...th, width: "16%", textAlign: "right" }}>mm</th>
                  </tr>
                </thead>
                <tbody>
                  {activeLayers.map((layer, i) => {
                    const idx = layers.indexOf(layer) + 1;
                    const m0 = layerLegendMaterialLabel(layer.materials[0]);
                    const m1 = layer.materials[1];
                    const extra =
                      layer.materials.length > 1 && m1?.materialType !== "none"
                        ? ` +${layerLegendMaterialLabel(m1, "熱橋")}`
                        : "";
                    return (
                      <tr key={i}>
                        <td style={tdR}>L{idx}</td>
                        <td style={td}>
                          {m0}
                          {extra}
                        </td>
                        <td style={tdR}>{layer.thickness}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {hasUValue ? (
            <div style={box}>
              <div style={h2}>熱貫流率</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#0C447C", marginBottom: 4 }}>
                U = {uResult.uFinal.toFixed(3)} W/(m²·K)
              </div>
              <table style={tableBase}>
                <colgroup>
                  <col style={{ width: "34%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "14%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th style={th}>部分</th>
                    <th style={{ ...th, textAlign: "right" }}>λ</th>
                    <th style={{ ...th, textAlign: "right" }}>d</th>
                    <th style={{ ...th, textAlign: "center" }}>区分</th>
                    <th style={{ ...th, textAlign: "right" }}>R断</th>
                    <th style={{ ...th, textAlign: "right" }}>R橋</th>
                  </tr>
                  <tr>
                    <td style={td}>熱橋比</td>
                    <td colSpan={3} />
                    <td style={{ ...tdR, color: "#166534" }}>{uResult.insulationRatio.toFixed(3)}</td>
                    <td style={{ ...tdR, color: "#92400e" }}>{bridgeRatio.toFixed(3)}</td>
                  </tr>
                </thead>
                <tbody>{uResult.rows.map((row, i) => uRowCells(row, i, colorMap))}</tbody>
                <tfoot>
                  <tr style={{ background: "#f3f4f6" }}>
                    <td colSpan={4} style={{ ...td, fontWeight: 600 }}>ΣR</td>
                    <td style={{ ...tdR, fontWeight: 600, color: "#166534" }}>{sumRIns.toFixed(3)}</td>
                    <td style={{ ...tdR, fontWeight: 600, color: "#92400e" }}>{sumRBridge.toFixed(3)}</td>
                  </tr>
                  <tr style={{ background: "#f3f4f6" }}>
                    <td colSpan={4} style={{ ...td, fontWeight: 600 }}>Un</td>
                    <td style={{ ...tdR, fontWeight: 600, color: "#166534" }}>{uResult.U_ins.toFixed(3)}</td>
                    <td style={{ ...tdR, fontWeight: 600, color: "#92400e" }}>{U_bridge_disp.toFixed(3)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div style={box}>
              <div style={h2}>熱貫流率</div>
              <div style={{ fontSize: 8, color: "#6b7280", lineHeight: 1.45 }}>
                熱貫流率の計算は行っていません（「熱貫流率を計算しない」が有効なデータです）。
              </div>
            </div>
          )}

          <div style={box}>
            <div style={h2}>固定荷重</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#7c2d12", marginBottom: 4 }}>計 {dlResult.totalCeiled ?? Math.ceil(dlResult.total)} N/m²</div>
            <table style={tableBase}>
              <colgroup>
                <col style={{ width: "40%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "15%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={th}>材料</th>
                  <th style={{ ...th, textAlign: "right" }}>ρ</th>
                  <th style={{ ...th, textAlign: "right" }}>d</th>
                  <th style={{ ...th, textAlign: "right" }}>比</th>
                  <th style={{ ...th, textAlign: "right" }}>N/m²</th>
                </tr>
              </thead>
              <tbody>
                {dlResult.rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ ...td, textAlign: "center", color: "#6b7280" }}>
                      材料なし
                    </td>
                  </tr>
                ) : (
                  dlResult.rows.map((row, i) => (
                    <tr key={i}>
                      <td style={td}>
                        <div style={{ fontSize: 6.5, color: "#6b7280", lineHeight: 1.2 }}>{row.category || ""}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          {row.color ? (
                            <span
                              style={{
                                display: "inline-block",
                                width: 5,
                                height: 5,
                                borderRadius: 1,
                                background: colorMap[row.color] || "#ccc",
                                flexShrink: 0,
                              }}
                            />
                          ) : null}
                          <span>{row.material}</span>
                        </div>
                      </td>
                      <td style={tdR}>{row.rho > 0 ? row.rho.toFixed(0) : "—"}</td>
                      <td style={tdR}>{row.d.toFixed(3)}</td>
                      <td style={tdR}>{row.ratio.toFixed(3)}</td>
                      <td style={tdR}>{row.load.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={{ ...muted, fontSize: 7, marginTop: 6 }}>
        本レポートはアプリの計算結果を PDF 化したものです。設計判断は元データと法令・告示をご確認ください。
      </div>
    </div>
  );
});
