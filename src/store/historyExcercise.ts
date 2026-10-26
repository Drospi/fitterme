import AsyncStorage from "@react-native-async-storage/async-storage";
import exercisesData from "../data/exercises.json"; // Ajusta la ruta según sea necesario

export type ExerciseSet = {
  reps: number;
  peso: number;
  intensity?: string; // "Baja" | "Moderada" | "Alta" | "Máxima"
  timeMinutes?: number;
};

export type ExerciseHistory = {
  id: string;
  exerciseId: number;
  date: string;
  sets: ExerciseSet[];
  totalVolume: number;
  bestWeight: number;
  bestReps: number;
  effortRating?: 1 | 2 | 3 | 4 | 5;
};

const HISTORY_KEY = "exercise_history";

export const getExerciseHistory = async (): Promise<ExerciseHistory[]> => {
  const data = await AsyncStorage.getItem(HISTORY_KEY);
  return data ? JSON.parse(data) : [];
};

export const getHistoryByExerciseId = async (
  id: number,
): Promise<ExerciseHistory[]> => {
  const history = await getExerciseHistory();
  return history.filter((log) => log.exerciseId === id);
};

export const getHistoryByMuscle = async (
  muscle: string,
): Promise<ExerciseHistory[]> => {
  const exercisesIdByMuscle = (exercisesData as any[])
    .filter(
      (exercise) => exercise.musculo.toLowerCase() === muscle.toLowerCase(),
    )
    .map((exercise) => exercise.id);

  const history = await getExerciseHistory();

  return history.filter((log) => exercisesIdByMuscle.includes(log.exerciseId));
};

import { calculate1RM } from "@/calculos/oneRepMax";
export { calculate1RM };

/**
 * Compara dos series evaluando cuál representa un rendimiento superior.
 * Para Cardio: compara tiempo (o intensidad).
 * Para Fuerza: evalúa 1RM estimado.
 */
export const isBetterSet = (
  setA: { peso: number; reps: number; timeMinutes?: number; intensity?: string } | null | undefined,
  setB: { peso: number; reps: number; timeMinutes?: number; intensity?: string } | null | undefined
): boolean => {
  if (!setA) return false;
  const aHasCardio = (setA.timeMinutes && setA.timeMinutes > 0);
  const bHasCardio = (setB?.timeMinutes && setB.timeMinutes > 0);

  if (aHasCardio || bHasCardio) {
    if (!setB) return true;
    const timeA = setA.timeMinutes || 0;
    const timeB = setB.timeMinutes || 0;
    return timeA >= timeB;
  }

  if (setA.peso === 0 && setA.reps <= 0) return false;
  if (!setB || (setB.peso === 0 && setB.reps <= 0)) return true;

  // Si ambos son series de peso corporal o asistidas (peso <= 0)
  if (setA.peso <= 0 && setB.peso <= 0) {
    // Si uno es solo cuerpo (0) y el otro asistido (< 0): solo cuerpo supera asistencia
    if (setA.peso === 0 && setB.peso < 0) return true;
    if (setA.peso < 0 && setB.peso === 0) return false;

    // Si ambos son asistidos (< 0): menor ayuda (peso más cercano a 0) es mejor estímulo
    if (setA.peso < 0 && setB.peso < 0) {
      if (setA.peso !== setB.peso) {
        return setA.peso > setB.peso; // Ej: -5 kg de ayuda es mejor que -15 kg
      }
      return setA.reps > setB.reps;
    }

    // Ambos son peso corporal sin ayuda (peso === 0): compara repeticiones
    return setA.reps > setB.reps;
  }
  // Si uno tiene peso adicional/lastre y el otro no
  if (setA.peso > 0 && setB.peso <= 0) {
    return true;
  }
  if (setA.peso <= 0 && setB.peso > 0) {
    return false;
  }

  const rmA = calculate1RM(setA.peso, setA.reps);
  const rmB = calculate1RM(setB.peso, setB.reps);

  if (Math.abs(rmA - rmB) > 0.05) {
    return rmA > rmB;
  }

  // Desempate por peso absoluto y luego repeticiones
  if (setA.peso !== setB.peso) {
    return setA.peso > setB.peso;
  }
  return setA.reps > setB.reps;
};

export const addExerciseLog = async (
  exerciseId: number,
  sets: ExerciseSet[],
  effortRating?: 1 | 2 | 3 | 4 | 5,
): Promise<ExerciseHistory> => {
  const history = await getExerciseHistory();

  const currentTotalVolume = sets.reduce(
    (acc, set) => acc + (set.peso > 0 ? set.peso * set.reps : set.reps),
    0,
  );

  const currentBestSet = sets.reduce(
    (best, current) => {
      return isBetterSet(current, best) ? current : best;
    },
    { peso: 0, reps: 0 },
  );

  // Asegurar que si es peso corporal (peso <= 0), bestReps refleje las repeticiones máximas reales
  let resolvedBestReps = currentBestSet.reps;
  if (!resolvedBestReps || resolvedBestReps <= 0) {
    const maxRepsInSets = Math.max(0, ...sets.map((s) => s.reps || 0));
    if (maxRepsInSets > 0) {
      resolvedBestReps = maxRepsInSets;
    }
  }

  const newLog: ExerciseHistory = {
    id: Date.now().toString(),
    exerciseId,
    date: new Date().toISOString(),
    sets,
    totalVolume: currentTotalVolume,
    bestWeight: currentBestSet.peso,
    bestReps: resolvedBestReps || 0,
    effortRating,
  };

  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify([newLog, ...history]));
  return newLog;
};

// Obtener el Récord Personal (Mejor Serie Histórica) de un ejercicio específico
export const getPersonalBest = async (
  exerciseId: number,
): Promise<{ peso: number; reps: number; timeMinutes?: number; intensity?: string } | null> => {
  const history = await getExerciseHistory();
  const exerciseLogs = history.filter((log) => log.exerciseId === exerciseId);

  if (exerciseLogs.length === 0) return null;

  let bestSet: ExerciseSet = { peso: 0, reps: 0 };

  exerciseLogs.forEach((log) => {
    if (log.sets && Array.isArray(log.sets) && log.sets.length > 0) {
      log.sets.forEach((set) => {
        if (isBetterSet(set, bestSet)) {
          bestSet = {
            peso: set.peso,
            reps: set.reps,
            timeMinutes: set.timeMinutes,
            intensity: set.intensity,
          };
        }
      });
    } else if (log.bestWeight !== undefined || log.bestReps !== undefined) {
      const fallbackReps = log.bestReps || (log.sets && log.sets[0]?.reps) || 0;
      const legacySet = { peso: log.bestWeight || 0, reps: fallbackReps };
      if (isBetterSet(legacySet, bestSet)) {
        bestSet = legacySet;
      }
    }
  });

  return (bestSet.peso !== 0 || bestSet.reps > 0 || (bestSet.timeMinutes && bestSet.timeMinutes > 0)) ? bestSet : null;
};

// Borrar el historial de un ejercicio específico (opcional)
export const deleteExerciseHistory = async (
  exerciseId: number,
): Promise<void> => {
  const history = await getExerciseHistory();
  const filtered = history.filter((log) => log.exerciseId !== exerciseId);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
};

/**
 * Elimina un registro/sesión específico del historial de un ejercicio.
 * Permite eliminar un récord erróneo para que el siguiente mejor récord vuelva a ser el personal best.
 */
export const deleteExerciseHistoryLog = async (
  logId?: string,
  logDate?: string,
  exerciseId?: number,
): Promise<boolean> => {
  const history = await getExerciseHistory();
  const initialCount = history.length;
  const filtered = history.filter((log) => {
    if (logId && log.id) {
      return log.id !== logId;
    }
    if (logDate && exerciseId !== undefined) {
      return !(log.date === logDate && log.exerciseId === exerciseId);
    }
    if (logDate) {
      return log.date !== logDate;
    }
    return true;
  });

  if (filtered.length !== initialCount) {
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
    return true;
  }
  return false;
};

// Limpiar todo el historial
export const clearAllHistory = async (): Promise<void> => {
  await AsyncStorage.removeItem(HISTORY_KEY);
};

// Agrega esto a store/historyExercise.ts
export const getGroupedHistory = async () => {
  const history = await getExerciseHistory();
  return history;
};
