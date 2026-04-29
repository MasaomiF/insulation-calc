import { useMemo } from "react";
import { calculateInsulationResult } from "../../application/usecases/calculateInsulationResult";

export function useInsulationCalc({ layers, surfaceData, bridgeRatios, materialDb, densityDb }) {
  return useMemo(
    () =>
      calculateInsulationResult({
        layers,
        rsi: surfaceData.rsi,
        rse: surfaceData.rse,
        bridgeRatios,
        materialDb,
        densityDb,
      }),
    [layers, surfaceData, bridgeRatios, materialDb, densityDb]
  );
}
