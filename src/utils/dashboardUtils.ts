import { RoutineSession } from "@/store/historyRoutine";
import { Measure } from "@/store/measures";
import { calculateNavyBodyFat } from "./musclePhysiology";

export type DayStatus = {
  label: string; // 'L', 'M', 'M', 'J', 'V', 'S', 'D'
  fullLabel: string; // 'Lun', 'Mar', etc.
  dateStr: string; // YYYY-MM-DD
  isTrained: boolean;
  isToday: boolean;
  isFuture: boolean;
};

/**
 * Formatea una fecha local a YYYY-MM-DD
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
 * Calcula la racha actual de días seguidos de entrenamiento (opcional para comparativas)
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

/**
 * Devuelve el estado de los 7 días de la semana actual (Lunes a Domingo)
 */
export const getWeeklyDayStatus = (sessions: RoutineSession[]): {
  days: DayStatus[];
  completedCount: number;
} => {
  const trainedDays = new Set<string>();
  sessions.forEach((s) => {
    if (s.date) {
      try {
        const d = new Date(s.date);
        trainedDays.add(formatLocalDate(d));
      } catch {
        // Ignorar
      }
    }
  });

  const now = new Date();
  const todayStr = formatLocalDate(now);
  const currentDay = now.getDay(); // 0 es Domingo, 1 es Lunes
  const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;

  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const labels = ["L", "M", "M", "J", "V", "S", "D"];
  const fullLabels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const days: DayStatus[] = [];
  let completedCount = 0;

  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + i);
    const dateStr = formatLocalDate(dayDate);
    const isTrained = trainedDays.has(dateStr);
    const isToday = dateStr === todayStr;
    const isFuture = dayDate > now && !isToday;

    if (isTrained) completedCount++;

    days.push({
      label: labels[i],
      fullLabel: fullLabels[i],
      dateStr,
      isTrained,
      isToday,
      isFuture,
    });
  }

  return { days, completedCount };
};

export type TrendDataPoint = {
  date: string;
  bodyFat: number;
  leanMass: number;
  weight: number;
};

/**
 * Calcula la tendencia de las últimas 4 a 8 semanas de composición corporal
 */
export const getCompositionTrend = (
  measures: Measure[]
): {
  dataPoints: TrendDataPoint[];
  currentBodyFat: number;
  currentLeanMass: number;
  currentWeight: number;
  fatChange: number;
  leanChange: number;
  hasEnoughData: boolean;
} => {
  if (!measures || measures.length === 0) {
    return {
      dataPoints: [],
      currentBodyFat: 0,
      currentLeanMass: 0,
      currentWeight: 0,
      fatChange: 0,
      leanChange: 0,
      hasEnoughData: false,
    };
  }

  const sorted = [...measures]
    .filter((m) => m && m.createdAt)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const eightWeeksAgo = new Date();
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

  const recentMeasures = sorted.filter((m) => new Date(m.createdAt) >= eightWeeksAgo);
  const dataPool = recentMeasures.length >= 2 ? recentMeasures : sorted.slice(-8);

  const dataPoints: TrendDataPoint[] = dataPool.map((m) => {
    const bodyFat = calculateNavyBodyFat(m);
    const weight = Number(m.peso) || 70;
    const leanMass = parseFloat((((100 - bodyFat) / 100) * weight).toFixed(1));
    const d = new Date(m.createdAt);
    const dateLabel = `${d.getDate()}/${d.getMonth() + 1}`;

    return {
      date: dateLabel,
      bodyFat,
      leanMass,
      weight,
    };
  });

  const latest = dataPoints[dataPoints.length - 1];
  const first = dataPoints[0];

  const currentBodyFat = latest?.bodyFat || 0;
  const currentLeanMass = latest?.leanMass || 0;
  const currentWeight = latest?.weight || 0;

  const fatChange = dataPoints.length >= 2 ? parseFloat((latest.bodyFat - first.bodyFat).toFixed(1)) : 0;
  const leanChange = dataPoints.length >= 2 ? parseFloat((latest.leanMass - first.leanMass).toFixed(1)) : 0;

  return {
    dataPoints,
    currentBodyFat,
    currentLeanMass,
    currentWeight,
    fatChange,
    leanChange,
    hasEnoughData: dataPoints.length >= 2,
  };
};
