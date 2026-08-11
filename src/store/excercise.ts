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

export type ExerciseCatalogItem = {
  id: number;
  nombre: string;
  musculo: string;
  objetivo: string;
  equipamiento: string;
  descripcion?: string;
  urlimage?: string;
  isCustom?: boolean;
};

const EXCERCISES_KEY = "Excercises";
const CUSTOM_EXERCISES_KEY = "custom_exercises_catalog";
const OVERRIDDEN_EXERCISES_KEY = "overridden_exercises_catalog";
const DELETED_EXERCISES_KEY = "deleted_exercises_catalog";

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

// ==========================================
// CATÁLOGO DE EJERCICIOS Y PERSONALIZACIÓN
// ==========================================

export const getCustomExercises = async (): Promise<ExerciseCatalogItem[]> => {
  const data = await AsyncStorage.getItem(CUSTOM_EXERCISES_KEY);
  return data ? JSON.parse(data) : [];
};

export const getOverriddenExercises = async (): Promise<Record<number, ExerciseCatalogItem>> => {
  const data = await AsyncStorage.getItem(OVERRIDDEN_EXERCISES_KEY);
  return data ? JSON.parse(data) : {};
};

export const getDeletedExerciseIds = async (): Promise<number[]> => {
  const data = await AsyncStorage.getItem(DELETED_EXERCISES_KEY);
  return data ? JSON.parse(data) : [];
};

export const getAllExercises = async (): Promise<ExerciseCatalogItem[]> => {
  const custom = await getCustomExercises();
  const overrides = await getOverriddenExercises();
  const deletedIds = await getDeletedExerciseIds();

  const baseCatalog: ExerciseCatalogItem[] = (exerciseData as ExerciseCatalogItem[])
    .filter((ex) => !deletedIds.includes(ex.id))
    .map((ex) => overrides[ex.id] || ex);

  const filteredCustom = custom.filter((ex) => !deletedIds.includes(ex.id));

  return [...filteredCustom, ...baseCatalog];
};

export const getExerciseById = async (
  idOrName: number | string
): Promise<ExerciseCatalogItem | null> => {
  const all = await getAllExercises();
  if (typeof idOrName === "number" || !isNaN(Number(idOrName))) {
    const targetId = Number(idOrName);
    const found = all.find((ex) => ex.id === targetId);
    if (found) return found;
  }

  const normalized = String(idOrName).trim().toLowerCase();
  
  // Buscar por nombre actual
  let found = all.find((ex) => ex.nombre.trim().toLowerCase() === normalized);
  if (found) return found;

  // Buscar por nombre base original en exercises.json para preservar la integridad si fue renombrado
  const baseMatch = (exerciseData as any[]).find(
    (ex) => ex.nombre.trim().toLowerCase() === normalized
  );
  if (baseMatch) {
    found = all.find((ex) => ex.id === baseMatch.id);
    if (found) return found;
  }

  return null;
};

export const addCustomExercise = async (
  exercise: Omit<ExerciseCatalogItem, "id">,
): Promise<ExerciseCatalogItem> => {
  const custom = await getCustomExercises();
  const newCustom: ExerciseCatalogItem = {
    ...exercise,
    id: Date.now(),
    isCustom: true,
  };
  const updated = [newCustom, ...custom];
  await AsyncStorage.setItem(CUSTOM_EXERCISES_KEY, JSON.stringify(updated));
  return newCustom;
};

export const updateExercise = async (
  updatedItem: ExerciseCatalogItem
): Promise<void> => {
  if (updatedItem.isCustom) {
    const custom = await getCustomExercises();
    const updatedCustom = custom.map((ex) =>
      ex.id === updatedItem.id ? { ...ex, ...updatedItem } : ex
    );
    await AsyncStorage.setItem(CUSTOM_EXERCISES_KEY, JSON.stringify(updatedCustom));
  } else {
    const overrides = await getOverriddenExercises();
    overrides[updatedItem.id] = updatedItem;
    await AsyncStorage.setItem(OVERRIDDEN_EXERCISES_KEY, JSON.stringify(overrides));
  }
};

export const deleteExercise = async (id: number): Promise<void> => {
  const custom = await getCustomExercises();
  const isCustom = custom.some((ex) => ex.id === id);

  if (isCustom) {
    const filtered = custom.filter((ex) => ex.id !== id);
    await AsyncStorage.setItem(CUSTOM_EXERCISES_KEY, JSON.stringify(filtered));
  } else {
    const deletedIds = await getDeletedExerciseIds();
    if (!deletedIds.includes(id)) {
      await AsyncStorage.setItem(
        DELETED_EXERCISES_KEY,
        JSON.stringify([...deletedIds, id])
      );
    }
  }
};

export const deleteCustomExercise = deleteExercise;

export const getExerciseIdByExerciseName = async (
  name: string,
): Promise<number | null> => {
  if (!isNaN(Number(name))) {
    return Number(name);
  }
  const ex = await getExerciseById(name);
  return ex ? ex.id : null;
};
