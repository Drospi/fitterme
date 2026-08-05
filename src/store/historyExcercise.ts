import AsyncStorage from "@react-native-async-storage/async-storage";
import exercisesData from "../data/exercises.json"; // Ajusta la ruta según sea necesario

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

export const addExerciseLog = async (
  exerciseId: number,
  sets: ExerciseSet[],
): Promise<ExerciseHistory> => {
  const history = await getExerciseHistory();

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

  const newLog: ExerciseHistory = {
    id: Date.now().toString(),
    exerciseId,
    date: new Date().toISOString(),
    sets,
    totalVolume: currentTotalVolume,
    bestWeight: currentBestSet.peso,
    bestReps: currentBestSet.reps,
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

  let bestSet: ExerciseSet = { peso: 0, reps: 0 };

  exerciseLogs.forEach((log) => {
    if (log.sets && Array.isArray(log.sets) && log.sets.length > 0) {
      log.sets.forEach((set) => {
        if (
          set.peso > bestSet.peso ||
          (set.peso === bestSet.peso && set.reps > bestSet.reps)
        ) {
          bestSet = { peso: set.peso, reps: set.reps };
        }
      });
    } else if (log.bestWeight > 0) {
      if (
        log.bestWeight > bestSet.peso ||
        (log.bestWeight === bestSet.peso && log.bestReps > bestSet.reps)
      ) {
        bestSet = { peso: log.bestWeight, reps: log.bestReps };
      }
    }
  });

  return bestSet.peso > 0 ? bestSet : null;
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
