import AsyncStorage from "@react-native-async-storage/async-storage";

export type Measure = {
  id: string;
  name: string;
  cuello: number;
  hombros: number;
  pecho: number;
  biceps: number;
  antebrazo: number;
  cintura: number;
  cadera: number;
  cuadriceps: number;
  gemelos: number;
  gluteos: number;
  espalda: number;
  edad: number;
  sexo: string;
  peso: number;
  altura: number;
  createdAt: string;
};

const MEASURES_KEY = "Measures";

export const getMeasures = async (): Promise<Measure[]> => {
  const data = await AsyncStorage.getItem(MEASURES_KEY);
  return data ? JSON.parse(data) : [];
};

export const addMeasure = async (
  Measure: Omit<Measure, "id" | "createdAt">,
): Promise<Measure> => {
  const Measures = await getMeasures();
  const newMeasure: Measure = {
    ...Measure,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(
    MEASURES_KEY,
    JSON.stringify([newMeasure, ...Measures]),
  );
  return newMeasure;
};

export const updateMeasure = async (
  id: string,
  updatedMeasure: Omit<Measure, "id" | "createdAt">,
): Promise<Measure> => {
  const Measures = await getMeasures();
  const updatedMeasures = Measures.map((Measure) => {
    if (Measure.id === id) {
      return {
        ...Measure,
        ...updatedMeasure,
      };
    }
    return Measure;
  });
  await AsyncStorage.setItem(MEASURES_KEY, JSON.stringify(updatedMeasures));
  return updatedMeasures.find((Measure) => Measure.id === id)!;
};

export const deleteMeasure = async (id: string): Promise<void> => {
  const Measures = await getMeasures();
  const filtered = Measures.filter((Measure) => Measure.id !== id);
  await AsyncStorage.setItem(MEASURES_KEY, JSON.stringify(filtered));
};

export const clearAllMeasures = async (): Promise<void> => {
  await AsyncStorage.removeItem(MEASURES_KEY);
};
