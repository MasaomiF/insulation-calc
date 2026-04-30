import { useMemo } from "react";
import { calculateInsulationResult } from "../../application/usecases/calculateInsulationResult";

export function useInsulationCalc({ layers, surfaceData, bridgeRatios, materialDb, densityDb, skipUValueCalculation }) {
  return useMemo(
    () =>
      calculateInsulationResult({
        layers,
        rsi: surfaceData.rsi,
        rse: surfaceData.rse,
        bridgeRatios,
        materialDb,
        densityDb,
        skipUValueCalculation: Boolean(skipUValueCalculation),
      }),
    [layers, surfaceData, bridgeRatios, materialDb, densityDb, skipUValueCalculation]
  );
}
