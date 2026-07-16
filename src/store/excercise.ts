import exerciseData from "@/data/exercises.json";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Excercise = {
  id: string;
  name: string;
  series: number;
  reps: number;
  kg: number;
  muscle: string;
  equipment: string;
  createdAt: string;
};

const EXCERCISES_KEY = "Excercises";

export const getExcercises = async (): Promise<Excercise[]> => {
  const data = await AsyncStorage.getItem(EXCERCISES_KEY);
  return data ? JSON.parse(data) : [];
};

export const addExcercise = async (
  Excercise: Omit<Excercise, "id" | "createdAt">,
): Promise<Excercise> => {
  const Excercises = await getExcercises();
  const newExcercise: Excercise = {
    ...Excercise,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(
    EXCERCISES_KEY,
    JSON.stringify([newExcercise, ...Excercises]),
  );
  return newExcercise;
};

export const deleteExcercise = async (id: string): Promise<void> => {
  const Excercises = await getExcercises();
  const filtered = Excercises.filter((Excercise) => Excercise.id !== id);
  await AsyncStorage.setItem(EXCERCISES_KEY, JSON.stringify(filtered));
};

export const clearAllExcercises = async (): Promise<void> => {
  await AsyncStorage.removeItem(EXCERCISES_KEY);
};

export const getExerciseIdByExerciseName = async (
  name: string,
): Promise<number | null> => {
  const normalizedName = name.trim().toLowerCase();
  const exercise = exerciseData.find(
    (ex) => ex.nombre.trim().toLowerCase() === normalizedName,
  );
  return exercise ? exercise.id : null;
};
