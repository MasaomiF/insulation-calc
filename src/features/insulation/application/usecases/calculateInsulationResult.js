import { calculateDeadLoad, calculateUValue } from "../../domain/calc/insulationCalculators";

export function calculateInsulationResult({ layers, rsi, rse, bridgeRatios, materialDb, densityDb }) {
  const uResult = calculateUValue(layers, rsi, rse, bridgeRatios, materialDb);
  const dlResult = calculateDeadLoad(layers, densityDb);
  return { uResult, dlResult };
}
