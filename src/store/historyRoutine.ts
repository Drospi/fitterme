import AsyncStorage from "@react-native-async-storage/async-storage";

export type RoutineSession = {
  id: string;
  name: string; // Nombre de la rutina (ej: "Día de Pecho")
  date: string;
  duration: number; // en segundos
  totalVolume: number;
  exercises: {
    exerciseName: string;
    sets: { reps: number; peso: number }[];
  }[];
};

const HISTORY_ROUTINES_KEY = "history_routines";

// Guardar toda la sesión de una vez
export const addRoutineSession = async (
  session: Omit<RoutineSession, "id" | "date">,
) => {
  const history = await getRoutineSessions();
  const newSession: RoutineSession = {
    ...session,
    id: Date.now().toString(),
    date: new Date().toISOString(),
  };

  await AsyncStorage.setItem(
    HISTORY_ROUTINES_KEY,
    JSON.stringify([newSession, ...history]),
  );
};

// Obtener todas las sesiones para mostrar en HistoryScreen
export const getRoutineSessions = async (): Promise<RoutineSession[]> => {
  const data = await AsyncStorage.getItem(HISTORY_ROUTINES_KEY);
  return data ? JSON.parse(data) : [];
};
