import { getDailyMealLogs } from "@/store/meals";
import { getRoutineSessions } from "@/store/historyRoutine";
import { getExerciseHistory, ExerciseHistory } from "@/store/historyExcercise";
import { getAllExercises } from "@/store/excercise";

export type WeeklyReportData = {
  startDate: string;
  endDate: string;
  dietDaysRespected: number; // Cantidad de días que registró su dieta (0..7)
  recordsBrokenCount: number;
  recordsBrokenList: Array<{ exerciseName: string; weight: number; reps: number }>;
  reducedAvgCount: number;
  reducedAvgList: Array<{ exerciseName: string; prevAvg: number; currentAvg: number }>;
  bestPerformanceByRoutine: Array<{ routineName: string; maxVolume: number; sessionDate: string }>;
  coachAdvice: string[];
};

export const generateWeeklyReport = async (): Promise<WeeklyReportData> => {
  const now = new Date();

  // Rango de la última semana (últimos 7 días)
  const past7Days = new Date();
  past7Days.setDate(now.getDate() - 7);

  const startDateStr = past7Days.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  const endDateStr = now.toLocaleDateString("es-ES", { day: "numeric", month: "short" });

  // 1. Días que respetó la dieta en los últimos 7 días
  const mealLogs = await getDailyMealLogs();
  const recentMealLogs = mealLogs.filter((log) => {
    const logDate = new Date(log.date);
    return logDate >= past7Days && log.consumedMeals && log.consumedMeals.length > 0;
  });
  const dietDaysRespected = recentMealLogs.length;

  // 2. Sesiones de Rutina de los últimos 7 días y mejor rendimiento por rutina
  const routineSessions = await getRoutineSessions();
  const recentSessions = routineSessions.filter((s) => new Date(s.date) >= past7Days);

  const routinePerformanceMap: Record<string, { maxVolume: number; sessionDate: string }> = {};

  recentSessions.forEach((s) => {
    const existing = routinePerformanceMap[s.name];
    if (!existing || s.totalVolume > existing.maxVolume) {
      routinePerformanceMap[s.name] = {
        maxVolume: s.totalVolume,
        sessionDate: new Date(s.date).toLocaleDateString("es-ES", { weekday: "short", day: "numeric" }),
      };
    }
  });

  const bestPerformanceByRoutine = Object.entries(routinePerformanceMap).map(([routineName, data]) => ({
    routineName,
    maxVolume: data.maxVolume,
    sessionDate: data.sessionDate,
  }));

  // 3. Récords Superados y Ejercicios con Rendimiento Menor
  const allHistory = await getExerciseHistory();
  const catalog = await getAllExercises();

  // Agrupar historial por ejercicioId
  const historyByExercise: Record<number, ExerciseHistory[]> = {};
  allHistory.forEach((h: ExerciseHistory) => {
    if (!historyByExercise[h.exerciseId]) historyByExercise[h.exerciseId] = [];
    historyByExercise[h.exerciseId].push(h);
  });

  const recordsBrokenList: Array<{ exerciseName: string; weight: number; reps: number }> = [];
  const reducedAvgList: Array<{ exerciseName: string; prevAvg: number; currentAvg: number }> = [];

  // Analizar cada ejercicio
  for (const ex of catalog) {
    const exHistory = historyByExercise[ex.id] || [];
    if (exHistory.length === 0) continue;

    const recentLogs = exHistory.filter((h: ExerciseHistory) => new Date(h.date) >= past7Days);
    const olderLogs = exHistory.filter((h: ExerciseHistory) => new Date(h.date) < past7Days);

    if (recentLogs.length > 0 && olderLogs.length > 0) {
      // Comparar mejor peso reciente vs previo
      const prevBestWeight = Math.max(...olderLogs.map((l: ExerciseHistory) => l.bestWeight));
      const recentBestLog = recentLogs.reduce((prev: ExerciseHistory, curr: ExerciseHistory) =>
        curr.bestWeight > prev.bestWeight ? curr : prev
      );

      if (recentBestLog.bestWeight > prevBestWeight) {
        recordsBrokenList.push({
          exerciseName: ex.nombre,
          weight: recentBestLog.bestWeight,
          reps: recentBestLog.sets[0]?.reps || 10,
        });
      }

      // Comparar promedio reciente vs previo
      const prevAvgVol =
        olderLogs.reduce((acc: number, l: ExerciseHistory) => acc + l.totalVolume, 0) / olderLogs.length;
      const recentAvgVol =
        recentLogs.reduce((acc: number, l: ExerciseHistory) => acc + l.totalVolume, 0) / recentLogs.length;

      if (recentAvgVol < prevAvgVol * 0.9) {
        reducedAvgList.push({
          exerciseName: ex.nombre,
          prevAvg: Math.round(prevAvgVol),
          currentAvg: Math.round(recentAvgVol),
        });
      }
    }
  }

  // 4. Generar Consejos Personalizados del Entrenador IA
  const coachAdvice: string[] = [];

  if (dietDaysRespected >= 5) {
    coachAdvice.push("🥗 ¡Gran disciplina nutricional! Mantener la consistencia en tu dieta ha potenciado tu recuperación.");
  } else {
    coachAdvice.push("🥦 Te recomendamos enfocar la próxima semana en registrar al menos 5 días de dieta para asegurar suficiente proteína.");
  }

  if (recordsBrokenList.length > 0) {
    coachAdvice.push(`🏆 Rompiste ${recordsBrokenList.length} récord(s) personal(es) esta semana. ¡Sigue aplicando sobrecarga progresiva!`);
  } else {
    coachAdvice.push("🏋️ Para la próxima semana, intenta aumentar 1 repetición o 1 kg en tu primera serie de cada ejercicio principal.");
  }

  if (reducedAvgList.length > 0) {
    coachAdvice.push(`⚠️ Notamos una pequeña baja de volumen en ${reducedAvgList.length} ejercicio(s). Asegúrate de descansar al menos 48h entre sesiones intensas.`);
  }

  coachAdvice.push("💧 Mantén tu hidratación por encima de 2.5L de agua al día y asegura 7-8 horas de sueño de calidad.");

  return {
    startDate: startDateStr,
    endDate: endDateStr,
    dietDaysRespected,
    recordsBrokenCount: recordsBrokenList.length,
    recordsBrokenList,
    reducedAvgCount: reducedAvgList.length,
    reducedAvgList,
    bestPerformanceByRoutine,
    coachAdvice,
  };
};
