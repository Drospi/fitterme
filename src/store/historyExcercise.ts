import AsyncStorage from "@react-native-async-storage/async-storage";

export type ExerciseSet = {
  reps: number;
  peso: number;
};

export type ExerciseHistory = {
  id: string;
  exerciseId: number;
  date: string;
  sets: ExerciseSet[];
  totalVolume: number;
  bestWeight: number;
  bestReps: number;
};

const HISTORY_KEY = "exercise_history";

// Obtener todo el historial
export const getExerciseHistory = async (): Promise<ExerciseHistory[]> => {
  const data = await AsyncStorage.getItem(HISTORY_KEY);
  return data ? JSON.parse(data) : [];
};

// Añadir el registro de un ejercicio al terminar sus series
export const addExerciseLog = async (
  exerciseId: number,
  sets: ExerciseSet[],
): Promise<ExerciseHistory> => {
  const history = await getExerciseHistory();

  const totalVolume = sets.reduce((acc, set) => acc + set.peso * set.reps, 0);

  const bestSet = sets.reduce(
    (best, current) => {
      if (current.peso > best.peso) return current;
      if (current.peso === best.peso && current.reps > best.reps)
        return current;
      return best;
    },
    { peso: 0, reps: 0 },
  );

  const newLog: ExerciseHistory = {
    id: Date.now().toString(),
    exerciseId,
    date: new Date().toISOString(),
    sets,
    totalVolume,
    bestWeight: bestSet.peso,
    bestReps: bestSet.reps,
  };

  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify([newLog, ...history]));
  return newLog;
};

// Obtener el Récord Personal (Mejor Serie Histórica) de un ejercicio específico
export const getPersonalBest = async (
  exerciseId: number,
): Promise<{ peso: number; reps: number } | null> => {
  const history = await getExerciseHistory();
  const exerciseLogs = history.filter((log) => log.exerciseId === exerciseId);

  if (exerciseLogs.length === 0) return null;

  let bestWeight = 0;
  let bestReps = 0;

  exerciseLogs.forEach((log) => {
    if (log.bestWeight > bestWeight) {
      bestWeight = log.bestWeight;
      bestReps = log.bestReps;
    } else if (log.bestWeight === bestWeight && log.bestReps > bestReps) {
      bestReps = log.bestReps;
    }
  });

  return { peso: bestWeight, reps: bestReps };
};

// Borrar el historial de un ejercicio específico (opcional)
export const deleteExerciseHistory = async (
  exerciseId: number,
): Promise<void> => {
  const history = await getExerciseHistory();
  const filtered = history.filter((log) => log.exerciseId !== exerciseId);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
};

// Limpiar todo el historial
export const clearAllHistory = async (): Promise<void> => {
  await AsyncStorage.removeItem(HISTORY_KEY);
};

// Agrega esto a store/historyExercise.ts
export const getGroupedHistory = async () => {
  const history = await getExerciseHistory();
  // Agrupa por fecha (si quieres agruparlos) o simplemente retorna todo
  return history;
};
