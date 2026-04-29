export function getLambda(materialDb, category, material) {
  if (!category || !material) return null;
  const found = (materialDb[category] || []).find((m) => m.value === material);
  return found ? found.λ : null;
}

export function getDensityKgM3(densityDb, material) {
  const rho = densityDb[material];
  return rho != null ? rho * 1000 : 0;
}

export function calcR(materialDb, mat, thickness) {
  if (mat.materialType === "air") return 0.09;
  if (mat.materialType === "none" || !mat.material) return null;
  const lambda = getLambda(materialDb, mat.category, mat.material);
  return lambda ? (thickness / 1000) / lambda : null;
}

export function calculateUValue(layers, rsi, rse, bridgeRatios, materialDb) {
  let startLayer = 0;
  let endLayer = layers.length - 1;
  for (let i = 0; i < layers.length; i++) {
    if (layers[i]?.surfacetype === "rse") {
      startLayer = i;
      break;
    }
  }
  for (let i = layers.length - 1; i >= startLayer; i--) {
    if (layers[i]?.surfacetype === "rsi") {
      endLayer = i - 1;
      break;
    }
  }

  let R_common = rsi + rse;
  const bridgeRExtras = [0, 0, 0];
  const rows = [];

  rows.push({ label: "室内側表面熱抵抗 Rsi", λ: "—", d: "—", flag: "両", R_bridge: rsi, R_ins: rsi });

  for (let i = startLayer; i <= endLayer; i++) {
    const layer = layers[i];
    if (!layer?.switchOn || !layer.thickness) continue;
    const { materials, thickness } = layer;
    const d = thickness / 1000;
    const hasBridge = materials.slice(1).some((m) => m.materialType !== "none");

    const m1 = materials[0];
    const lambda1 = m1.materialType === "air" ? "空気層" : getLambda(materialDb, m1.category, m1.material);
    const r1 = calcR(materialDb, m1, thickness);
    const name1 = m1.materialType === "air" ? "空気層" : m1.material || "（未設定）";

    if (hasBridge) {
      if (r1 != null) {
        rows.push({ label: name1, λ: lambda1, d, flag: "断熱", R_bridge: r1, R_ins: r1, color: m1.color });
        R_common += r1;
      }
      materials.slice(1).forEach((mj, ji) => {
        if (mj.materialType === "none") return;
        const lambdaJ = mj.materialType === "air" ? "空気層" : getLambda(materialDb, mj.category, mj.material);
        const rj = calcR(materialDb, mj, thickness);
        const nameJ = mj.materialType === "air" ? "空気層" : mj.material || "（未設定）";
        if (rj != null) {
          rows.push({ label: nameJ, λ: lambdaJ, d, flag: "熱橋", R_bridge: rj, R_ins: 0, color: mj.color });
          if (ji < 3) bridgeRExtras[ji] += rj;
        }
      });
    } else if (r1 != null) {
      rows.push({ label: name1, λ: lambda1, d, flag: "熱橋＆断熱", R_bridge: r1, R_ins: r1, color: m1.color });
      R_common += r1;
    }
  }

  rows.push({ label: "外気側表面熱抵抗 Rse", λ: "—", d: "—", flag: "両", R_bridge: rse, R_ins: rse });

  const totalBridgeRatio = bridgeRatios.reduce((s, r) => s + (parseFloat(r) || 0), 0);
  const insulationRatio = Math.max(0, 1 - totalBridgeRatio);
  const U_ins = R_common > 0 ? 1 / R_common : 0;

  let uFinal = U_ins * insulationRatio;
  const bridgeResults = bridgeRatios
    .map((ratio, idx) => {
      const r = parseFloat(ratio) || 0;
      if (r <= 0) return null;
      const R_bridge = R_common + bridgeRExtras[idx];
      const U_bridge = R_bridge > 0 ? 1 / R_bridge : 0;
      uFinal += U_bridge * r;
      return { ratio: r, R: R_bridge, U: U_bridge, index: idx };
    })
    .filter(Boolean);

  const R_bridge_disp =
    bridgeResults.length > 0
      ? bridgeResults.reduce((s, b) => s + b.R * b.ratio, 0) / (totalBridgeRatio || 1)
      : R_common;

  return { uFinal, U_ins, R_common, R_bridge_disp, insulationRatio, bridgeResults, rows, startLayer, endLayer };
}

export function calculateDeadLoad(layers, densityDb) {
  const rows = [];
  let total = 0;

  layers.forEach((layer) => {
    if (!layer.switchOn || !layer.thickness) return;
    const d = layer.thickness / 1000;

    layer.materials.forEach((mat) => {
      if (mat.materialType === "none" || mat.materialType === "air") return;
      if (!mat.material) return;
      const rho = getDensityKgM3(densityDb, mat.material);
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
