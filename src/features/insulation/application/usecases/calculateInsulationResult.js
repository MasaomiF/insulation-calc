import { calculateDeadLoad, calculateUValue } from "../../domain/calc/insulationCalculators";

export function calculateInsulationResult({
  layers,
  rsi,
  rse,
  bridgeRatios,
  materialDb,
  densityDb,
  skipUValueCalculation = false,
}) {
  const dlResult = calculateDeadLoad(layers, densityDb);
  if (skipUValueCalculation) {
    return { uResult: null, dlResult };
  }
  const uResult = calculateUValue(layers, rsi, rse, bridgeRatios, materialDb);
  return { uResult, dlResult };
}
