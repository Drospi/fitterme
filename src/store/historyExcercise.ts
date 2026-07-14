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

export const addExerciseLog = async (
  exerciseId: number,
  sets: ExerciseSet[],
): Promise<ExerciseHistory> => {
  const history = await getExerciseHistory();

  // 1. Calculamos métricas de la sesión actual
  const currentTotalVolume = sets.reduce(
    (acc, set) => acc + set.peso * set.reps,
    0,
  );

  const currentBestSet = sets.reduce(
    (best, current) => {
      return current.peso > best.peso ||
        (current.peso === best.peso && current.reps > best.reps)
        ? current
        : best;
    },
    { peso: 0, reps: 0 },
  );

  // 2. Buscamos el histórico anterior del ejercicio para comparar
  const previousLogs = history.filter((h) => h.exerciseId === exerciseId);
  const historicBest = previousLogs.reduce(
    (best, log) => {
      return log.bestWeight > best.peso ||
        (log.bestWeight === best.peso && log.bestReps > best.reps)
        ? { peso: log.bestWeight, reps: log.bestReps }
        : best;
    },
    { peso: 0, reps: 0 },
  );

  // 3. Determinamos el nuevo récord comparando el actual vs el histórico
  const isNewBest =
    currentBestSet.peso > historicBest.peso ||
    (currentBestSet.peso === historicBest.peso &&
      currentBestSet.reps > historicBest.reps);

  const newLog: ExerciseHistory = {
    id: Date.now().toString(),
    exerciseId,
    date: new Date().toISOString(),
    sets,
    totalVolume: currentTotalVolume,
    bestWeight: isNewBest ? currentBestSet.peso : historicBest.peso,
    bestReps: isNewBest ? currentBestSet.reps : historicBest.reps,
  };

  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify([newLog, ...history]));
  const saved = await AsyncStorage.getItem(HISTORY_KEY);
  console.log("¿Se guardó en el Storage?", saved !== null);
  console.log("Historial guardado:", saved);
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
  return history;
};
