import exercisesData from "@/data/exercises.json";
import { getExerciseHistory } from "@/store/historyExcercise";
import { getRoutineSessions } from "@/store/historyRoutine";

export interface MuscleVolumeStat {
  muscle: string;
  volume: number;
  percentage: number;
  color: string;
  icon: string;
}

const MUSCLE_META: Record<string, { color: string; icon: string; label: string; defaultPct: number }> = {
  espalda: { color: "#3B82F6", icon: "body-outline", label: "Espalda", defaultPct: 22 },
  pecho: { color: "#EF4444", icon: "fitness-outline", label: "Pecho", defaultPct: 20 },
  cuadriceps: { color: "#10B981", icon: "walk-outline", label: "Cuádriceps / Piernas", defaultPct: 20 },
  hombros: { color: "#F59E0B", icon: "trending-up-outline", label: "Hombros", defaultPct: 14 },
  gluteos: { color: "#EC4899", icon: "ellipse-outline", label: "Glúteos / Isquios", defaultPct: 10 },
  biceps: { color: "#8B5CF6", icon: "barbell-outline", label: "Bíceps", defaultPct: 7 },
  triceps: { color: "#06B6D4", icon: "triangle-outline", label: "Tríceps", defaultPct: 7 },
};

/**
 * Calcula la distribución real de volumen por grupo muscular a partir del historial.
 */
export const calculateMuscleVolumeStats = async (): Promise<{
  totalVolume: number;
  hasHistory: boolean;
  stats: MuscleVolumeStat[];
}> => {
  try {
    const exerciseHistory = await getExerciseHistory();
    const routineSessions = await getRoutineSessions();

    const muscleVolumeMap: Record<string, number> = {
      espalda: 0,
      pecho: 0,
      cuadriceps: 0,
      hombros: 0,
      gluteos: 0,
      biceps: 0,
      triceps: 0,
    };

    let totalCalculated = 0;

    // Mapa de ejercicioId a músculo
    const exerciseMuscleMap: Record<number, string> = {};
    (exercisesData as any[]).forEach((ex) => {
      if (ex.id && ex.musculo) {
        exerciseMuscleMap[ex.id] = ex.musculo.toLowerCase();
      }
    });

    // 1. Procesar historial de ejercicios
    exerciseHistory.forEach((log) => {
      const muscle = exerciseMuscleMap[log.exerciseId] || "espalda";
      const vol = log.totalVolume || 0;
      if (muscleVolumeMap[muscle] !== undefined) {
        muscleVolumeMap[muscle] += vol;
      } else {
        muscleVolumeMap["espalda"] += vol;
      }
      totalCalculated += vol;
    });

    // 2. Si no hay suficiente en exerciseHistory, procesar routineSessions
    if (totalCalculated === 0 && routineSessions.length > 0) {
      routineSessions.forEach((session) => {
        session.exercises.forEach((exItem) => {
          const matched = (exercisesData as any[]).find(
            (e) => e.nombre.toLowerCase() === exItem.exerciseName.toLowerCase()
          );
          const muscle = matched ? matched.musculo.toLowerCase() : "pecho";
          const vol = exItem.sets.reduce((sum, s) => sum + s.peso * s.reps, 0);
          if (muscleVolumeMap[muscle] !== undefined) {
            muscleVolumeMap[muscle] += vol;
          } else {
            muscleVolumeMap["pecho"] += vol;
          }
          totalCalculated += vol;
        });
      });
    }

    const hasHistory = totalCalculated > 0;

    const stats: MuscleVolumeStat[] = Object.entries(MUSCLE_META).map(([key, meta]) => {
      const vol = muscleVolumeMap[key] || 0;
      const pct = hasHistory
        ? Math.round((vol / (totalCalculated || 1)) * 100)
        : meta.defaultPct;

      return {
        muscle: meta.label,
        volume: vol,
        percentage: pct,
        color: meta.color,
        icon: meta.icon,
      };
    });

    return {
      totalVolume: totalCalculated,
      hasHistory,
      stats: stats.sort((a, b) => b.percentage - a.percentage),
    };
  } catch (error) {
    console.error("Error al calcular estadísticas de volumen por músculo:", error);
    const fallbackStats: MuscleVolumeStat[] = Object.entries(MUSCLE_META).map(([, meta]) => ({
      muscle: meta.label,
      volume: 0,
      percentage: meta.defaultPct,
      color: meta.color,
      icon: meta.icon,
    }));
    return {
      totalVolume: 0,
      hasHistory: false,
      stats: fallbackStats,
    };
  }
};

/**
 * Calcula el Volumen Máximo Recuperable (MRV) semanal recomendado basado en peso y frecuencia.
 */
export const calculateRecommendedMaxVolume = (
  weightKg: number,
  frequencyDays: number,
  masaMagraKg?: number
): number => {
  const baseWeight = masaMagraKg && masaMagraKg > 30 ? masaMagraKg * 1.2 : weightKg;
  // ~14 series promedio por día de entrenamiento x 10 reps x ~50% del peso corporal
  const estimatedTonnage = Math.round(baseWeight * 0.52 * 10 * (frequencyDays * 14));
  // Redondear a múltiplos de 500
  return Math.max(5000, Math.round(estimatedTonnage / 500) * 500);
};
