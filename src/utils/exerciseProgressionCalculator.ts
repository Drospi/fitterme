import { WeightUnit, toDisplayWeight } from "@/store/conf";
import { calculate1RM, ExerciseHistory } from "@/store/historyExcercise";

export interface ProgressionStats {
  dailyRate1RM: number;
  weeklyRate1RM: number;
  monthlyRate1RM: number;
  latest1RM: number;
  latestWeight: number;
  latestReps: number;
  typicalSetsCount: number;
  isPositive: boolean;
  totalSessions: number;
}

export interface DateProjectionResult {
  days: number;
  dateStr: string;
  projected1RM: number;
  gain1RM: number;
  pct1RM: number;
  projectedWeight: number;
  expectedReps: number;
  repsRangeText: string;
  sets: number;
  estVolume: number;
  fullProjectionText: string;
}

export interface TargetCalculatorResult {
  targetWeight: number;
  targetReps: number;
  targetSets: number;
  target1RM: number;
  current1RM: number;
  diff1RM: number;
  daysNeeded: number;
  weeksNeeded: number;
  monthsNeeded: number;
  estimatedDate: Date;
  estimatedDateStr: string;
  isAchieved: boolean;
  message: string;
}

/**
 * Formatea una fecha a formato legible en español.
 */
export const formatSpanishDate = (date: Date): string => {
  if (!date || isNaN(date.getTime())) return "";
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

/**
 * Extrae y calcula las métricas de fuerza y volumen de cada sesión del historial.
 * Unifica peso y repeticiones utilizando el 1RM estimado (fórmula científica de Epley/Brzycki).
 */
export const calculateHistoricalSessionMetrics = (
  history: ExerciseHistory[],
  unit: WeightUnit = "kg"
) => {
  if (!history || history.length === 0) return [];

  // Ordenar cronológicamente (más antiguo al más reciente)
  const chronological = [...history].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return chronological.map((session) => {
    const validSets =
      session.sets && session.sets.length > 0
        ? session.sets.filter((s) => s.reps > 0)
        : [{ peso: session.bestWeight, reps: session.bestReps || 1 }];

    let best1RMKg = 0;
    let peakWeightKg = 0;
    let peakRepsAtWeight = 0;
    let totalVolumeKg = 0;
    let maxRepsInSession = 0;
    let totalRepsInSession = 0;

    validSets.forEach((s) => {
      const rm = calculate1RM(s.peso, s.reps);
      if (rm > best1RMKg) best1RMKg = rm;
      if (s.reps > maxRepsInSession) maxRepsInSession = s.reps;
      totalRepsInSession += s.reps || 0;

      if (s.peso > peakWeightKg) {
        peakWeightKg = s.peso;
        peakRepsAtWeight = s.reps;
      }
      totalVolumeKg += (s.peso || 0) * (s.reps || 0);
    });

    const isPureBodyweight = peakWeightKg <= 0;
    if (isPureBodyweight) {
      peakRepsAtWeight = maxRepsInSession || session.bestReps || 1;
    }

    // Para peso corporal puro (sin lastre), la métrica de progresión son las repeticiones máximas
    const display1RM = isPureBodyweight ? peakRepsAtWeight : toDisplayWeight(best1RMKg, unit);
    const displayWeight = isPureBodyweight ? 0 : toDisplayWeight(peakWeightKg, unit);
    const displayVolume = isPureBodyweight
      ? (session.totalVolume || totalRepsInSession)
      : toDisplayWeight(session.totalVolume || totalVolumeKg, unit);

    return {
      date: session.date,
      timestamp: new Date(session.date).getTime(),
      display1RM,
      displayWeight,
      repsAtPeak: peakRepsAtWeight,
      setsCount: validSets.length,
      displayVolume,
      validSets,
      isPureBodyweight,
    };
  });
};

/**
 * Calcula la tasa de progreso real (regresión lineal sobre 1RM / sobrecarga efectiva o reps en calistenia).
 * Evita el sesgo falso de estancamiento cuando el usuario sube peso y bajan las repeticiones.
 */
export const calculateProgressionStats = (
  history: ExerciseHistory[],
  unit: WeightUnit = "kg"
): ProgressionStats => {
  const points = calculateHistoricalSessionMetrics(history, unit);

  if (points.length === 0) {
    return {
      dailyRate1RM: 0.035,
      weeklyRate1RM: 0.25,
      monthlyRate1RM: 1.0,
      latest1RM: 0,
      latestWeight: 0,
      latestReps: 0,
      typicalSetsCount: 3,
      isPositive: true,
      totalSessions: 0,
    };
  }

  const latest = points[points.length - 1];
  const typicalSetsCount =
    Math.round(
      points.reduce((acc, p) => acc + p.setsCount, 0) / points.length
    ) || 3;

  const isBw = latest.isPureBodyweight || latest.displayWeight <= 0;

  // Si solo hay una sesión registrada, estimar una ganancia fisiológica normal (~1.5% a 2% mensual, o 1-2 reps en calistenia)
  if (points.length === 1) {
    const defaultMonthly = isBw
      ? Math.max(1, Math.round(latest.display1RM * 0.12))
      : Math.max(0.5, latest.display1RM * 0.02);
    const daily = defaultMonthly / 30;
    return {
      dailyRate1RM: Number(daily.toFixed(4)),
      weeklyRate1RM: Number((daily * 7).toFixed(2)),
      monthlyRate1RM: Number(defaultMonthly.toFixed(2)),
      latest1RM: latest.display1RM,
      latestWeight: latest.displayWeight,
      latestReps: latest.repsAtPeak,
      typicalSetsCount,
      isPositive: true,
      totalSessions: 1,
    };
  }

  // Regresión lineal de progreso frente al tiempo en días
  const n = points.length;
  const t0 = points[0].timestamp;
  let sumT = 0;
  let sumY = 0;
  let sumTY = 0;
  let sumT2 = 0;

  points.forEach((p) => {
    const t = Math.max(0, (p.timestamp - t0) / (1000 * 60 * 60 * 24));
    const y = p.display1RM;
    sumT += t;
    sumY += y;
    sumTY += t * y;
    sumT2 += t * t;
  });

  const denom = n * sumT2 - sumT * sumT;
  let slope = denom !== 0 ? (n * sumTY - sumT * sumY) / denom : 0;

  // Parámetros de acotación biológica realista:
  const conservativeMonthly = isBw
    ? Math.max(0.8, latest.display1RM * 0.05)
    : Math.max(0.4, latest.display1RM * 0.012);
  const minDaily = conservativeMonthly / 30;
  const maxDaily = isBw
    ? Math.max(0.2, (latest.display1RM * 0.25) / 30)
    : Math.max(0.2, (latest.display1RM * 0.08) / 30);

  if (slope < minDaily) {
    slope = minDaily;
  } else if (slope > maxDaily) {
    slope = maxDaily;
  }

  const weeklyRate = slope * 7;
  const monthlyRate = slope * 30;

  return {
    dailyRate1RM: Number(slope.toFixed(4)),
    weeklyRate1RM: Number(weeklyRate.toFixed(2)),
    monthlyRate1RM: Number(monthlyRate.toFixed(2)),
    latest1RM: latest.display1RM,
    latestWeight: latest.displayWeight,
    latestReps: latest.repsAtPeak,
    typicalSetsCount,
    isPositive: slope > 0,
    totalSessions: n,
  };
};

/**
 * Modo 1: Proyección de rendimiento a fecha futura (ej. +30 días).
 * Traduce el progreso futuro a una combinación realista de Carga × Reps × Series.
 */
export const projectPerformanceAtDays = (
  days: number,
  stats: ProgressionStats,
  unit: WeightUnit = "kg",
  weightIncrement: number = 2.5
): DateProjectionResult => {
  const targetDays = Math.max(1, days);
  const targetDate = new Date(Date.now() + targetDays * 24 * 60 * 60 * 1000);
  const dateStr = formatSpanishDate(targetDate);

  const projected1RM = stats.latest1RM + stats.dailyRate1RM * targetDays;
  const gain1RM = projected1RM - stats.latest1RM;
  const pct1RM =
    stats.latest1RM > 0 ? (gain1RM / stats.latest1RM) * 100 : 0;

  const sets = stats.typicalSetsCount || 3;

  // Si el ejercicio es corporal sin peso (0 kg)
  if (stats.latestWeight <= 0) {
    const baseReps = stats.latestReps > 0 ? stats.latestReps : (stats.latest1RM > 0 ? stats.latest1RM : 10);
    const repGain = Math.max(0, Math.round(stats.dailyRate1RM * targetDays));
    const expectedReps = baseReps + repGain;
    const repMin = Math.max(1, expectedReps - 1);
    const repMax = expectedReps + 1;
    const repsRangeText = `${repMin}-${repMax} reps`;
    return {
      days: targetDays,
      dateStr,
      projected1RM: expectedReps,
      gain1RM: repGain,
      pct1RM: baseReps > 0 ? Number(((repGain / baseReps) * 100).toFixed(1)) : 0,
      projectedWeight: 0,
      expectedReps,
      repsRangeText,
      sets,
      estVolume: expectedReps * sets,
      fullProjectionText: `Corporal × ${repsRangeText} en ${sets} series`,
    };
  }

  // Para ejercicios con carga:
  // Se busca un rango de hipertrofia efectivo entre 8 y 12 reps (objetivo ~10 reps)
  const idealWorkingReps = 10;
  // 1RM = Weight * (1 + Reps / 30) => Weight = 1RM / (1 + Reps / 30)
  const rawTargetWeight = projected1RM / (1 + idealWorkingReps / 30);
  const step = weightIncrement > 0 ? weightIncrement : unit === "lb" ? 5 : 2.5;

  let roundedWeight = Math.round(rawTargetWeight / step) * step;
  roundedWeight = Math.max(step, roundedWeight);

  // Repeticiones esperadas precisas con ese peso
  // Reps = 30 * (1RM / Weight - 1)
  let expectedReps = Math.round(30 * (projected1RM / roundedWeight - 1));
  expectedReps = Math.max(6, Math.min(15, expectedReps));

  const repMin = Math.max(6, expectedReps - 1);
  const repMax = expectedReps + 1;
  const repsRangeText = `${repMin}–${repMax} reps`;
  const estVolume = Math.round(roundedWeight * expectedReps * sets);

  const fullProjectionText = `${roundedWeight} ${unit} × ${repsRangeText} en ${sets} series`;

  return {
    days: targetDays,
    dateStr,
    projected1RM: Number(projected1RM.toFixed(1)),
    gain1RM: Number(gain1RM.toFixed(1)),
    pct1RM: Number(pct1RM.toFixed(1)),
    projectedWeight: roundedWeight,
    expectedReps,
    repsRangeText,
    sets,
    estVolume,
    fullProjectionText,
  };
};

/**
 * Modo 2: Calculadora de Objetivo (Target Calculator).
 * "¿Cuándo levantaré X kg × Y reps en Z series?"
 * Calcula la fecha estimada a partir de la tasa de progreso real del historial.
 */
export const estimateDateForTarget = (
  targetWeight: number,
  targetReps: number,
  targetSets: number,
  stats: ProgressionStats,
  unit: WeightUnit = "kg"
): TargetCalculatorResult => {
  const w = Math.max(0, targetWeight);
  const r = Math.max(1, targetReps);
  const s = Math.max(1, targetSets);

  // 1RM del objetivo
  const target1RM = calculate1RM(w, r);
  const diff1RM = target1RM - stats.latest1RM;

  if (diff1RM <= 0) {
    return {
      targetWeight: w,
      targetReps: r,
      targetSets: s,
      target1RM: Number(target1RM.toFixed(1)),
      current1RM: stats.latest1RM,
      diff1RM: 0,
      daysNeeded: 0,
      weeksNeeded: 0,
      monthsNeeded: 0,
      estimatedDate: new Date(),
      estimatedDateStr: "¡Ya alcanzado!",
      isAchieved: true,
      message: `¡Ya dominas este nivel de fuerza! Tu 1RM actual (${stats.latest1RM} ${unit}) supera el 1RM requerido (${target1RM.toFixed(1)} ${unit}).`,
    };
  }

  const effectiveRate = Math.max(0.01, stats.dailyRate1RM);
  const daysNeeded = Math.ceil(diff1RM / effectiveRate);
  const estimatedDate = new Date(
    Date.now() + daysNeeded * 24 * 60 * 60 * 1000
  );
  const weeksNeeded = Number((daysNeeded / 7).toFixed(1));
  const monthsNeeded = Number((daysNeeded / 30).toFixed(1));
  const estimatedDateStr = formatSpanishDate(estimatedDate);

  const message = `Manteniendo tu tasa de sobrecarga actual (+${stats.weeklyRate1RM} ${unit} 1RM/sem), alcanzarás los ${w} ${unit} × ${r} reps en ~${daysNeeded} días (~${weeksNeeded} semanas).`;

  return {
    targetWeight: w,
    targetReps: r,
    targetSets: s,
    target1RM: Number(target1RM.toFixed(1)),
    current1RM: stats.latest1RM,
    diff1RM: Number(diff1RM.toFixed(1)),
    daysNeeded,
    weeksNeeded,
    monthsNeeded,
    estimatedDate,
    estimatedDateStr,
    isAchieved: false,
    message,
  };
};
