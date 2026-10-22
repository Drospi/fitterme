import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAllExercises } from "@/store/excercise";
import { getLatestGoal } from "@/store/goals";
import { ExerciseHistory, getExerciseHistory, isBetterSet } from "@/store/historyExcercise";
import { getRoutineSessions } from "@/store/historyRoutine";
import { getDailyMealLogs } from "@/store/meals";

export type DailyDietStatus = {
  dayLabel: string; // "Lun", "Mar", etc.
  dateStr: string; // "2026-10-01"
  logged: boolean;
  calories: number;
  protein: number;
};

export type WeeklyReportData = {
  startDate: string;
  endDate: string;
  totalWorkouts: number;
  totalVolume: number;
  totalSets: number;
  totalWorkoutMinutes: number;
  targetFrequency: number;
  dietDaysRespected: number; // 0..7
  dietAdherencePercent: number; // 0..100
  avgCalories: number;
  avgProtein: number;
  targetCalories: number;
  targetProtein: number;
  dailyDietBreakdown: DailyDietStatus[];
  recordsBrokenCount: number;
  recordsBrokenList: Array<{
    exerciseName: string;
    weight: number;
    reps: number;
    estimated1RM: number;
  }>;
  reducedAvgCount: number;
  reducedAvgList: Array<{
    exerciseName: string;
    prevAvg: number;
    currentAvg: number;
    percentChange: number;
  }>;
  bestPerformanceByRoutine: Array<{
    routineName: string;
    maxVolume: number;
    sessionDate: string;
    setsCount: number;
  }>;
  recentSessions: Array<{
    id?: string;
    routineName: string;
    date: string;
    volume: number;
    setsCount: number;
    durationMinutes: number;
  }>;
  coachAdvice: string[];
};

const LAST_VIEWED_WEEK_KEY = "@fitterme_last_viewed_weekly_report_week";
const LAST_DISMISSED_WEEK_KEY = "@fitterme_last_dismissed_weekly_report_week";

/**
 * Retorna el identificador ISO de la semana actual (ej: "2026-W36")
 */
export const getCurrentWeekIdentifier = (d: Date = new Date()): string => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
};

/**
 * Comprueba si el modal de resumen semanal debe mostrarse al usuario al abrir la app.
 */
export const checkWeeklyReportReady = async (): Promise<{
  isReady: boolean;
  weekId: string;
  reportData?: WeeklyReportData;
}> => {
  try {
    const weekId = getCurrentWeekIdentifier();
    const lastViewed = await AsyncStorage.getItem(LAST_VIEWED_WEEK_KEY);
    const lastDismissed = await AsyncStorage.getItem(LAST_DISMISSED_WEEK_KEY);

    // Si ya lo vio o lo descartó para esta semana, no mostrar
    if (lastViewed === weekId || lastDismissed === weekId) {
      return { isReady: false, weekId };
    }

    // Generar datos del informe
    const reportData = await generateWeeklyReport();

    // El informe está listo para presentarse
    return {
      isReady: true,
      weekId,
      reportData,
    };
  } catch (error) {
    console.error("Error al comprobar estado del resumen semanal:", error);
    return { isReady: false, weekId: getCurrentWeekIdentifier() };
  }
};

/**
 * Marca el resumen semanal como visto (ej: cuando el usuario navega a verlo)
 */
export const markWeeklyReportSeen = async (weekId?: string): Promise<void> => {
  try {
    const targetWeek = weekId || getCurrentWeekIdentifier();
    await AsyncStorage.setItem(LAST_VIEWED_WEEK_KEY, targetWeek);
  } catch (error) {
    console.error("Error al marcar resumen semanal como visto:", error);
  }
};

/**
 * Descarta el modal para la semana actual
 */
export const dismissWeeklyReportModal = async (weekId?: string): Promise<void> => {
  try {
    const targetWeek = weekId || getCurrentWeekIdentifier();
    await AsyncStorage.setItem(LAST_DISMISSED_WEEK_KEY, targetWeek);
  } catch (error) {
    console.error("Error al descartar modal de resumen semanal:", error);
  }
};

/**
 * Reinicia el estado visto/descartado (útil para pruebas)
 */
export const resetWeeklyReportModalStatus = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(LAST_VIEWED_WEEK_KEY);
    await AsyncStorage.removeItem(LAST_DISMISSED_WEEK_KEY);
  } catch (error) {
    console.error("Error al reiniciar estado del modal semanal:", error);
  }
};

export const generateWeeklyReport = async (): Promise<WeeklyReportData> => {
  const now = new Date();

  // Rango de la última semana (últimos 7 días)
  const past7Days = new Date();
  past7Days.setDate(now.getDate() - 6);
  past7Days.setHours(0, 0, 0, 0);

  const startDateStr = past7Days.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  const endDateStr = now.toLocaleDateString("es-ES", { day: "numeric", month: "short" });

  const goal = await getLatestGoal();

  // 1. Días de Dieta y desglose diario de los últimos 7 días
  const mealLogs = await getDailyMealLogs();
  const mealMap: Record<string, { calories: number; protein: number; count: number }> = {};

  mealLogs.forEach((log) => {
    if (log.consumedMeals && log.consumedMeals.length > 0) {
      mealMap[log.date] = {
        calories: log.totalCalories || 0,
        protein: log.totalProtein || 0,
        count: log.consumedMeals.length,
      };
    }
  });

  const dailyDietBreakdown: DailyDietStatus[] = [];
  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  let totalLoggedCalories = 0;
  let totalLoggedProtein = 0;
  let dietDaysRespected = 0;

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
    const dayName = dayNames[d.getDay()];

    const logEntry = mealMap[dateKey];
    const logged = !!logEntry && logEntry.count > 0;
    if (logged) {
      dietDaysRespected++;
      totalLoggedCalories += logEntry.calories;
      totalLoggedProtein += logEntry.protein;
    }

    dailyDietBreakdown.push({
      dayLabel: dayName,
      dateStr: dateKey,
      logged,
      calories: logEntry?.calories || 0,
      protein: logEntry?.protein || 0,
    });
  }

  const avgCalories = dietDaysRespected > 0 ? Math.round(totalLoggedCalories / dietDaysRespected) : 0;
  const avgProtein = dietDaysRespected > 0 ? Math.round(totalLoggedProtein / dietDaysRespected) : 0;
  const dietAdherencePercent = Math.round((dietDaysRespected / 7) * 100);

  // 2. Sesiones de Rutina de los últimos 7 días
  const routineSessions = await getRoutineSessions();
  const recentSessionsList = routineSessions.filter((s) => new Date(s.date) >= past7Days);

  let totalVolume = 0;
  let totalSets = 0;
  let totalWorkoutSeconds = 0;

  const routinePerformanceMap: Record<
    string,
    { maxVolume: number; sessionDate: string; setsCount: number }
  > = {};

  const recentSessions: WeeklyReportData["recentSessions"] = [];

  recentSessionsList.forEach((s) => {
    totalVolume += s.totalVolume || 0;
    totalWorkoutSeconds += s.duration || 0;

    let sessionSets = 0;
    if (Array.isArray(s.exercises)) {
      sessionSets = s.exercises.reduce((acc, ex) => acc + (ex.sets?.length || 0), 0);
    }
    totalSets += sessionSets;

    recentSessions.push({
      id: s.id,
      routineName: s.name,
      date: new Date(s.date).toLocaleDateString("es-ES", { weekday: "short", day: "numeric" }),
      volume: s.totalVolume,
      setsCount: sessionSets,
      durationMinutes: Math.round((s.duration || 0) / 60),
    });

    const existing = routinePerformanceMap[s.name];
    if (!existing || s.totalVolume > existing.maxVolume) {
      routinePerformanceMap[s.name] = {
        maxVolume: s.totalVolume,
        sessionDate: new Date(s.date).toLocaleDateString("es-ES", { weekday: "short", day: "numeric" }),
        setsCount: sessionSets,
      };
    }
  });

  const bestPerformanceByRoutine = Object.entries(routinePerformanceMap).map(
    ([routineName, data]) => ({
      routineName,
      maxVolume: data.maxVolume,
      sessionDate: data.sessionDate,
      setsCount: data.setsCount,
    })
  );

  // 3. Récords Superados y Ejercicios a Reforzar
  const allHistory = await getExerciseHistory();
  const catalog = await getAllExercises();

  const historyByExercise: Record<number, ExerciseHistory[]> = {};
  allHistory.forEach((h: ExerciseHistory) => {
    if (!historyByExercise[h.exerciseId]) historyByExercise[h.exerciseId] = [];
    historyByExercise[h.exerciseId].push(h);
  });

  const recordsBrokenList: WeeklyReportData["recordsBrokenList"] = [];
  const reducedAvgList: WeeklyReportData["reducedAvgList"] = [];

  for (const ex of catalog) {
    const exHistory = historyByExercise[ex.id] || [];
    if (exHistory.length === 0) continue;

    const recentLogs = exHistory.filter((h: ExerciseHistory) => new Date(h.date) >= past7Days);
    const olderLogs = exHistory.filter((h: ExerciseHistory) => new Date(h.date) < past7Days);

    if (recentLogs.length > 0 && olderLogs.length > 0) {
      const prevBestSet = olderLogs.reduce(
        (best, l: ExerciseHistory) => {
          const lBest = { peso: l.bestWeight, reps: l.bestReps || 1 };
          return isBetterSet(lBest, best) ? lBest : best;
        },
        { peso: 0, reps: 0 }
      );

      const recentBestLog = recentLogs.reduce((prev: ExerciseHistory, curr: ExerciseHistory) => {
        const currBest = { peso: curr.bestWeight, reps: curr.bestReps || 1 };
        const prevBest = { peso: prev.bestWeight, reps: prev.bestReps || 1 };
        return isBetterSet(currBest, prevBest) ? curr : prev;
      });
      const reps = recentBestLog.bestReps || recentBestLog.sets[0]?.reps || 10;
      const recentBestSet = { peso: recentBestLog.bestWeight, reps };

      if (isBetterSet(recentBestSet, prevBestSet)) {
        const isBw = recentBestLog.bestWeight <= 0;
        const est1RM = isBw ? reps : Math.round(recentBestLog.bestWeight * (1 + reps / 30));
        recordsBrokenList.push({
          exerciseName: ex.nombre,
          weight: recentBestLog.bestWeight,
          reps,
          estimated1RM: est1RM,
        });
      }

      const prevAvgVol =
        olderLogs.reduce((acc: number, l: ExerciseHistory) => acc + l.totalVolume, 0) /
        olderLogs.length;
      const recentAvgVol =
        recentLogs.reduce((acc: number, l: ExerciseHistory) => acc + l.totalVolume, 0) /
        recentLogs.length;

      if (recentAvgVol < prevAvgVol * 0.9 && prevAvgVol > 0) {
        const percentChange = Math.round(((recentAvgVol - prevAvgVol) / prevAvgVol) * 100);
        reducedAvgList.push({
          exerciseName: ex.nombre,
          prevAvg: Math.round(prevAvgVol),
          currentAvg: Math.round(recentAvgVol),
          percentChange,
        });
      }
    }
  }

  // 4. Generar Conclusiones y Consejos Profesionales (Sin emojis, técnicos y directos)
  const coachAdvice: string[] = [];

  if (recentSessionsList.length >= (goal.frequency || 4)) {
    coachAdvice.push(
      `Frecuencia cumplida: Completaste ${recentSessionsList.length} sesiones de entrenamiento, alcanzando el objetivo semanal establecido.`
    );
  } else {
    coachAdvice.push(
      `Frecuencia semanal: Se registraron ${recentSessionsList.length} de ${goal.frequency || 4} sesiones planificadas. Se sugiere priorizar la consistencia en los días de descanso.`
    );
  }

  if (recordsBrokenList.length > 0) {
    coachAdvice.push(
      `Sobrecarga progresiva efectiva: Se superaron ${recordsBrokenList.length} récords personales en la semana, evidenciando adaptación positiva de fuerza.`
    );
  } else {
    coachAdvice.push(
      "Sobrecarga de estímulo: Mantén el foco en sumar 1 repetición o micro-incrementos de carga en las primeras series efectivas."
    );
  }

  if (dietDaysRespected >= 5) {
    coachAdvice.push(
      `Adherencia nutricional del ${dietAdherencePercent}%: El registro constante de macronutrientes optimiza la síntesis proteica y la recuperación muscular.`
    );
  } else {
    coachAdvice.push(
      `Control nutricional: Se registraron ${dietDaysRespected} de 7 días. Consolidar el registro diario ayuda a garantizar el requerimiento calórico y proteico.`
    );
  }

  if (reducedAvgList.length > 0) {
    coachAdvice.push(
      `Monitoreo de fatiga: Se observó reducción de volumen en ${reducedAvgList.length} ejercicio(s). Evaluar el descanso inter-serie y la calidad del sueño.`
    );
  }

  return {
    startDate: startDateStr,
    endDate: endDateStr,
    totalWorkouts: recentSessionsList.length,
    totalVolume,
    totalSets,
    totalWorkoutMinutes: Math.round(totalWorkoutSeconds / 60),
    targetFrequency: goal.frequency || 4,
    dietDaysRespected,
    dietAdherencePercent,
    avgCalories,
    avgProtein,
    targetCalories: goal.targetCalories || 2500,
    targetProtein: goal.targetProtein || 140,
    dailyDietBreakdown,
    recordsBrokenCount: recordsBrokenList.length,
    recordsBrokenList,
    reducedAvgCount: reducedAvgList.length,
    reducedAvgList,
    bestPerformanceByRoutine,
    recentSessions,
    coachAdvice,
  };
};
