import { RoutineSession } from "@/store/historyRoutine";

/**
 * Formatea una fecha local a formato YYYY-MM-DD
 */
export const formatLocalDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

/**
 * Calcula el número total de días en los que el usuario ha completado al menos una sesión o rutina de entrenamiento
 */
export const calculateTotalTrainedDays = (sessions: RoutineSession[]): number => {
  if (!sessions || sessions.length === 0) return 0;

  const trainedDays = new Set<string>();
  sessions.forEach((s) => {
    if (s.date) {
      try {
        const d = new Date(s.date);
        trainedDays.add(formatLocalDate(d));
      } catch {
        // Ignorar fechas inválidas
      }
    }
  });

  return trainedDays.size;
};

/**
 * Calcula la racha actual de días continuos de entrenamiento
 */
export const calculateStreak = (sessions: RoutineSession[]): number => {
  if (!sessions || sessions.length === 0) return 0;

  const trainedDays = new Set<string>();
  sessions.forEach((s) => {
    if (s.date) {
      try {
        const d = new Date(s.date);
        trainedDays.add(formatLocalDate(d));
      } catch {
        // Ignorar fechas inválidas
      }
    }
  });

  const today = new Date();
  const todayStr = formatLocalDate(today);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatLocalDate(yesterday);

  let checkDate = new Date(today);
  if (trainedDays.has(todayStr)) {
    checkDate = today;
  } else if (trainedDays.has(yesterdayStr)) {
    checkDate = yesterday;
  } else {
    return 0;
  }

  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const checkStr = formatLocalDate(checkDate);
    if (trainedDays.has(checkStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

export interface TrendPoint {
  timestamp: number;
  value: number;
}

/**
 * Calcula la regresión lineal para proyecciones de métricas corporales o marcas
 */
export const calculateLinearTrend = (points: TrendPoint[]) => {
  if (points.length < 2) {
    return { slopePerDay: 0, intercept: points[0]?.value || 0 };
  }

  const n = points.length;
  const t0 = points[0].timestamp;
  let sumT = 0;
  let sumY = 0;
  let sumTY = 0;
  let sumT2 = 0;

  points.forEach((p) => {
    const t = (p.timestamp - t0) / (1000 * 60 * 60 * 24);
    const y = p.value;
    sumT += t;
    sumY += y;
    sumTY += t * y;
    sumT2 += t * t;
  });

  const denom = n * sumT2 - sumT * sumT;
  const slopePerDay = denom !== 0 ? (n * sumTY - sumT * sumY) / denom : 0;
  const intercept = (sumY - slopePerDay * sumT) / n;

  return { slopePerDay, intercept };
};

export interface MeasureHistoryPoint {
  date: string;
  value: number;
}

/**
 * Calcula la tasa de cambio y regresión lineal acotada para medidas corporales (en cm/día)
 */
export const calculateMeasureTrend = (history: MeasureHistoryPoint[]) => {
  if (!history || history.length === 0) {
    return {
      dailyRate: 0.0133,
      latestValue: 0,
      r2: 0,
    };
  }

  const latestVal = history[history.length - 1].value;

  if (history.length === 1) {
    return {
      dailyRate: 0.0133,
      latestValue: latestVal,
      r2: 1,
    };
  }

  const n = history.length;
  const tFirst = new Date(history[0].date).getTime();

  let sumT = 0;
  let sumY = 0;
  let sumTY = 0;
  let sumT2 = 0;

  history.forEach((pt) => {
    const t = Math.max(0, (new Date(pt.date).getTime() - tFirst) / (1000 * 60 * 60 * 24));
    const y = pt.value;
    sumT += t;
    sumY += y;
    sumTY += t * y;
    sumT2 += t * t;
  });

  const denominator = n * sumT2 - sumT * sumT;
  let slope = denominator !== 0 ? (n * sumTY - sumT * sumY) / denominator : 0;

  if (Math.abs(slope) < 0.0001) {
    slope = 0.0133;
  }

  // Límites realistas (-0.06 cm/día a +0.04 cm/día)
  slope = Math.max(-0.06, Math.min(0.04, slope));

  return {
    dailyRate: slope,
    latestValue: latestVal,
    r2: 0.85,
  };
};

