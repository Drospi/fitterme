import { WeightUnit } from "@/store/conf";

export type EffortRating = 1 | 2 | 3 | 4 | 5;

export interface EffortLevelInfo {
  rating: EffortRating;
  title: string;
  shortLabel: string;
  description: string;
  color: string;
  dots: number; // 1 to 5
  rirEstimate: string;
  actionSummary: string;
}

export const EFFORT_LEVELS: Record<EffortRating, EffortLevelInfo> = {
  1: {
    rating: 1,
    title: "Al Límite / Fallo",
    shortLabel: "Muy duro (temblando)",
    description: "En las 2 últimas ya estabas temblando y no podías hacerlo rápido.",
    color: "#ef4444",
    dots: 1,
    rirEstimate: "RIR 0 (Fallo)",
    actionSummary: "Bajamos peso o repeticiones para proteger tu técnica y recuperación.",
  },
  2: {
    rating: 2,
    title: "Muy Exigente",
    shortLabel: "Casi al fallo",
    description: "Llegaste muy forzado al final; velocidad muy reducida y temblor ligero.",
    color: "#f97316",
    dots: 2,
    rirEstimate: "RIR 0.5 - 1",
    actionSummary: "Mantenemos o ajustamos -1 rep para afianzar el estímulo.",
  },
  3: {
    rating: 3,
    title: "Esfuerzo Óptimo",
    shortLabel: "Punto ideal",
    description: "Esfuerzo perfecto. Terminaste con dificultad pero manteniendo buena técnica.",
    color: "#eab308",
    dots: 3,
    rirEstimate: "RIR 1 - 2",
    actionSummary: "Carga en su punto justo. Mantendremos el peso para consolidar la adaptación.",
  },
  4: {
    rating: 4,
    title: "Fuerte y Sólido",
    shortLabel: "Cómodo",
    description: "Buena velocidad en todas las series. Sentiste que podías dar 1 o 2 más.",
    color: "#22c55e",
    dots: 4,
    rirEstimate: "RIR 2 - 3",
    actionSummary: "Subimos +1 repetición para impulsar la sobrecarga progresiva.",
  },
  5: {
    rating: 5,
    title: "Con Energía de Sobra",
    shortLabel: "Muy fácil / Sobrado",
    description: "Sientes que podías hacer 2 o más repeticiones normal y con velocidad fluida.",
    color: "#10b981",
    dots: 5,
    rirEstimate: "RIR 3+",
    actionSummary: "¡Excelente reserva de fuerza! Aumentamos peso o reps para seguir mejorando.",
  },
};

export interface EffortAdjustmentInput {
  currentWeight: number;
  currentReps: number;
  rating: EffortRating;
  unit: WeightUnit;
  weightIncrement?: number;
  isBodyweight?: boolean;
  isCardio?: boolean;
  currentTimeMinutes?: number;
  currentIntensity?: string;
}

export interface EffortAdjustmentResult {
  rating: EffortRating;
  info: EffortLevelInfo;
  nextWeight: number;
  nextReps: number;
  deltaWeight: number;
  deltaReps: number;
  nextTimeMinutes?: number;
  nextIntensity?: string;
  adjustmentBadge: string;
  explanation: string;
}

/**
 * Calcula el ajuste inteligente de peso, repeticiones o parámetros de cardio
 * según la percepción de esfuerzo subjetivo (escala de 1 a 5) reportada por el usuario
 * para todo el ejercicio.
 */
export const calculateEffortAdjustment = ({
  currentWeight,
  currentReps,
  rating,
  unit,
  weightIncrement = 2.5,
  isBodyweight = false,
  isCardio = false,
  currentTimeMinutes = 15,
  currentIntensity = "Moderada",
}: EffortAdjustmentInput): EffortAdjustmentResult => {
  const info = EFFORT_LEVELS[rating];

  // =========================================================================
  // CASO 1: CARDIO
  // =========================================================================
  if (isCardio) {
    let nextTime = currentTimeMinutes;
    let nextInt = currentIntensity;
    let badge = "";

    switch (rating) {
      case 1:
        nextTime = Math.max(5, currentTimeMinutes - 5);
        nextInt = "Baja";
        badge = "-5 min | Intensidad Suave";
        break;
      case 2:
        nextTime = Math.max(5, currentTimeMinutes - 2);
        nextInt = currentIntensity === "Máxima" ? "Alta" : "Moderada";
        badge = "-2 min | Menor intensidad";
        break;
      case 3:
        badge = "Mantener tiempo e intensidad";
        break;
      case 4:
        nextTime = currentTimeMinutes + 2;
        badge = "+2 min | Ritmo constante";
        break;
      case 5:
        nextTime = currentTimeMinutes + 5;
        nextInt = currentIntensity === "Baja" ? "Moderada" : "Alta";
        badge = "+5 min | Mayor intensidad";
        break;
    }

    return {
      rating,
      info,
      nextWeight: 0,
      nextReps: nextTime,
      deltaWeight: 0,
      deltaReps: nextTime - currentTimeMinutes,
      nextTimeMinutes: nextTime,
      nextIntensity: nextInt,
      adjustmentBadge: badge,
      explanation: info.actionSummary,
    };
  }

  // =========================================================================
  // CASO 2: PESO CORPORAL (CALISTENIA)
  // =========================================================================
  if (isBodyweight) {
    let nextReps = currentReps;
    let nextWeight = currentWeight; // Puede ser lastre (+) o ayuda (-)
    let badge = "";

    switch (rating) {
      case 1:
        // Muy agotado: si tiene lastre, quitar lastre; si no, bajar 2 reps
        if (currentWeight > 0) {
          nextWeight = Math.max(0, currentWeight - weightIncrement);
          badge = `-${weightIncrement} ${unit} de lastre`;
        } else {
          nextReps = Math.max(1, currentReps - 2);
          badge = "-2 reps corporales";
        }
        break;
      case 2:
        nextReps = Math.max(1, currentReps - 1);
        badge = "-1 repetición";
        break;
      case 3:
        badge = "Mantener repeticiones";
        break;
      case 4:
        nextReps = currentReps + 1;
        badge = "+1 repetición";
        break;
      case 5:
        // Si ya hace muchas reps (e.g. >= 12), sugerir empezar a añadir lastre
        if (currentReps >= 12 && currentWeight >= 0) {
          nextWeight = currentWeight + weightIncrement;
          badge = `+${weightIncrement} ${unit} lastre (+2 reps)`;
          nextReps = Math.max(8, currentReps - 2);
        } else {
          nextReps = currentReps + 2;
          badge = "+2 repeticiones corporales";
        }
        break;
    }

    return {
      rating,
      info,
      nextWeight,
      nextReps,
      deltaWeight: nextWeight - currentWeight,
      deltaReps: nextReps - currentReps,
      adjustmentBadge: badge,
      explanation: info.actionSummary,
    };
  }

  // =========================================================================
  // CASO 3: FUERZA / GYM (BARRAS, MANCUERNAS, MÁQUINAS)
  // =========================================================================
  let nextWeight = currentWeight;
  let nextReps = currentReps;
  let deltaWeight = 0;
  let deltaReps = 0;
  let badge = "";

  switch (rating) {
    case 1:
      // Al fallo / temblando: Bajar peso si hay peso cargado, o bajar 2 reps
      if (currentWeight > weightIncrement) {
        nextWeight = Number((currentWeight - weightIncrement).toFixed(1));
        deltaWeight = -weightIncrement;
        badge = `-${weightIncrement} ${unit}`;
      } else {
        nextReps = Math.max(1, currentReps - 2);
        deltaReps = -2;
        badge = "-2 repeticiones";
      }
      break;

    case 2:
      // Muy exigente: Reducir 1 repetición para no acumular fatiga excesiva
      nextReps = Math.max(1, currentReps - 1);
      deltaReps = -1;
      badge = "-1 repetición";
      break;

    case 3:
      // Punto óptimo: Carga perfecta
      badge = `Mantener ${currentWeight} ${unit} x ${currentReps} reps`;
      break;

    case 4:
      // Fuerte y controlado: Aumentar 1 rep hacia la sobrecarga
      nextReps = currentReps + 1;
      deltaReps = 1;
      badge = "+1 repetición";
      break;

    case 5:
      // Con energía de sobra: Si el ejercicio tiene peso, subir peso directo
      if (currentWeight > 0) {
        nextWeight = Number((currentWeight + weightIncrement).toFixed(1));
        deltaWeight = weightIncrement;
        badge = `+${weightIncrement} ${unit}`;
      } else {
        nextReps = currentReps + 2;
        deltaReps = 2;
        badge = "+2 repeticiones";
      }
      break;
  }

  return {
    rating,
    info,
    nextWeight,
    nextReps,
    deltaWeight,
    deltaReps,
    adjustmentBadge: badge,
    explanation: info.actionSummary,
  };
};
