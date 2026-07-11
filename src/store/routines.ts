import AsyncStorage from "@react-native-async-storage/async-storage";

export type Routine = {
  id: string;
  name: string;
  category: string;
  exercises: Array<{
    id: number;
    nombre: string;
    musculo: string;
    objetivo: string;
    equipamiento: string;
    urlimage?: string;
    series?: number;
    reps?: number;
    peso?: number;
  }>;

  createdAt: string;
};

const ROUTINES_KEY = "Routines";

export const getRoutines = async (): Promise<Routine[]> => {
  const data = await AsyncStorage.getItem(ROUTINES_KEY);
  return data ? JSON.parse(data) : [];
};

export const getRoutineById = async (id: string) => {
  const routines = await getRoutines();
  const foundRoutine = routines.find((r) => r.id === id);

  if (!foundRoutine) {
    return {
      id: "",
      name: "",
      category: "",
      exercises: [],
      createdAt: "",
    };
  }
  return {
    id: foundRoutine.id,
    name: foundRoutine.name,
    category: foundRoutine.category,
    exercises: foundRoutine.exercises,
  };
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

export const updateRoutine = async (
  id: string,
  updatedData: Omit<Routine, "id" | "createdAt">,
): Promise<Routine> => {
  const Routines = await getRoutines();

  const index = Routines.findIndex((r) => r.id === id);

  if (index === -1) {
    throw new Error(`Rutina con ID ${id} no encontrada`);
  }

  const updatedRoutine: Routine = {
    ...Routines[index],
    ...updatedData,
  };

  const newRoutinesList = [...Routines];
  newRoutinesList[index] = updatedRoutine;

  await AsyncStorage.setItem(ROUTINES_KEY, JSON.stringify(newRoutinesList));

  return updatedRoutine;
};

export const deleteRoutine = async (id: string): Promise<void> => {
  const Routines = await getRoutines();
  const filtered = Routines.filter((Routine) => Routine.id !== id);
  await AsyncStorage.setItem(ROUTINES_KEY, JSON.stringify(filtered));
};

export const clearAllRoutines = async (): Promise<void> => {
  await AsyncStorage.removeItem(ROUTINES_KEY);
};
