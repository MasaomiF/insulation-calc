export function UValuePanel({ result, colorMap }) {
  if (!result) return null;
  const { rows, R_common, R_bridge_disp: R_bridge_disp_raw, U_ins, uFinal, insulationRatio } = result;
  const bridgeRatio = 1 - insulationRatio;
  const R_bridge_disp = R_bridge_disp_raw;
  const U_bridge_disp = R_bridge_disp > 0 ? 1 / R_bridge_disp : 0;

  const td = (_content, opts = {}) => ({
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
      <div style={{ fontSize: 10, color: "var(--color-text-secondary)", display: "flex", gap: 10 }}>
        <span style={{ background: "#f0fdf4", color: "#166534", padding: "1px 5px", borderRadius: 2 }}>断熱（熱橋あり・主材料）</span>
        <span style={{ background: "#fffbeb", color: "#92400e", padding: "1px 5px", borderRadius: 2 }}>熱橋（熱橋材料）</span>
        <span style={{ background: "#f0f9ff", color: "#0369a1", padding: "1px 5px", borderRadius: 2 }}>熱橋＆断熱（熱橋なし・全経路共通）</span>
      </div>
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
            <tr style={{ background: "var(--color-background-secondary)" }}>
              <td style={td("熱橋面積比", { muted: true })}>熱橋面積比</td>
              <td colSpan={3} />
              <td style={{ ...td("", { mono: true, right: true }), color: "#92400e" }}>{bridgeRatio.toFixed(3)}</td>
              <td style={{ ...td("", { mono: true, right: true }), color: "#166534" }}>{insulationRatio.toFixed(3)}</td>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const isRsi = row.label.startsWith("室内側");
              const isRse = row.label.startsWith("外気側");
              const isSurface = isRsi || isRse;
              const flagColor = row.flag === "断熱" ? "#166534" : row.flag === "熱橋" ? "#92400e" : row.flag === "熱橋＆断熱" ? "#0369a1" : "var(--color-text-secondary)";
              const flagBg = row.flag === "断熱" ? "#f0fdf4" : row.flag === "熱橋" ? "#fffbeb" : row.flag === "熱橋＆断熱" ? "#f0f9ff" : undefined;
              return (
                <tr key={i} style={{ background: isSurface ? "var(--color-background-secondary)" : undefined }}>
                  <td style={{ ...td("", {}), display: "flex", alignItems: "center", gap: 5, overflow: "hidden" }}>
                    {row.color && !isSurface && (
                      <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: colorMap[row.color] || "#ccc", flexShrink: 0 }} />
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
                      : row.flag === "熱橋＆断熱"
                        ? row.R_bridge > 0 ? row.R_bridge.toFixed(3) : ""
                        : row.flag === "断熱"
                          ? row.R_ins > 0 ? row.R_ins.toFixed(3) : ""
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
            <tr style={{ background: "var(--color-background-secondary)", borderTop: "1px solid var(--color-border-secondary)" }}>
              <td colSpan={4} style={{ padding: "5px 6px", fontSize: 11, fontWeight: 500 }}>ΣR = Σ(d/λ)</td>
              <td style={{ padding: "5px 6px", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 500, textAlign: "right", color: "#92400e" }}>{R_bridge_disp.toFixed(3)}</td>
              <td style={{ padding: "5px 6px", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 500, textAlign: "right", color: "#166534" }}>{R_common.toFixed(3)}</td>
            </tr>
            <tr style={{ background: "var(--color-background-secondary)" }}>
              <td colSpan={4} style={{ padding: "5px 6px", fontSize: 11, fontWeight: 500 }}>Un = 1/ΣR</td>
              <td style={{ padding: "5px 6px", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 500, textAlign: "right", color: "#92400e" }}>{U_bridge_disp.toFixed(3)}</td>
              <td style={{ padding: "5px 6px", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 500, textAlign: "right", color: "#166534" }}>{U_ins.toFixed(3)}</td>
            </tr>
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
