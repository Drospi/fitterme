import AsyncStorage from "@react-native-async-storage/async-storage";

export type Routine = {
  id: string;
  name: string;
  series: number;
  reps: number;
  kg: number;
  fat: number;
  createdAt: string;
};

const ROUTINES_KEY = "Routines";

export const getRoutines = async (): Promise<Routine[]> => {
  const data = await AsyncStorage.getItem(ROUTINES_KEY);
  return data ? JSON.parse(data) : [];
};

export const addRoutine = async (
  Routine: Omit<Routine, "id" | "createdAt">,
): Promise<Routine> => {
  const Routines = await getRoutines();
  const newRoutine: Routine = {
    ...Routine,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(
    ROUTINES_KEY,
    JSON.stringify([newRoutine, ...Routines]),
  );
  return newRoutine;
};

export const deleteRoutine = async (id: string): Promise<void> => {
  const Routines = await getRoutines();
  const filtered = Routines.filter((Routine) => Routine.id !== id);
  await AsyncStorage.setItem(ROUTINES_KEY, JSON.stringify(filtered));
};

export const clearAllRoutines = async (): Promise<void> => {
  await AsyncStorage.removeItem(ROUTINES_KEY);
};
