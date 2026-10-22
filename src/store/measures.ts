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

export const normalizeBodyPartKey = (key: string): keyof Measure => {
  const clean = key
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  if (clean === "biceps") return "biceps";
  if (clean === "cuadriceps") return "cuadriceps";
  if (clean === "gluteos") return "gluteos";
  if (clean === "gemelos") return "gemelos";
  if (clean === "espalda") return "espalda";

  return clean as keyof Measure;
};

export const ALL_MUSCLE_KEYS: (keyof Measure)[] = [
  "pecho",
  "cuello",
  "hombros",
  "biceps",
  "antebrazo",
  "cintura",
  "cadera",
  "cuadriceps",
  "gemelos",
  "gluteos",
  "espalda",
];

export type MeasureHistoryItem = {
  id?: string;
  date: string;
  value: number;
};

export const sanitizeMeasureHistory = (
  rawHistory: MeasureHistoryItem[]
): MeasureHistoryItem[] => {
  if (!rawHistory || !Array.isArray(rawHistory)) return [];

  // 1. Filtrar valores no numéricos, menores o iguales a cero y sin fecha
  const validEntries = rawHistory
    .filter((item) => {
      if (!item || !item.date) return false;
      const num = Number(item.value);
      return !isNaN(num) && num > 0;
    })
    .map((item) => ({
      id: item.id,
      date: item.date,
      value: Number(item.value),
    }));

  if (validEntries.length === 0) return [];

  // 2. Ordenar cronológicamente del más RECIENTE al más ANTIGUO (descendente)
  const sortedDesc = [...validEntries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // 3. El dato más nuevo SIEMPRE se acepta como la realidad actual (ancla de referencia)
  const sanitized: MeasureHistoryItem[] = [sortedDesc[0]];

  // 4. Recorrer hacia el pasado: eliminar los anteriores que difieran en 20cm o más de la referencia
  for (let i = 1; i < sortedDesc.length; i++) {
    const curr = sortedDesc[i];
    const reference = sanitized[sanitized.length - 1];
    const valDiff = Math.abs(curr.value - reference.value);

    // Si el dato anterior tiene una diferencia de 20cm o más respecto al dato de referencia, se descarta
    if (valDiff >= 20) {
      continue;
    }

    sanitized.push(curr);
  }

  // Devolver en orden descendente (más reciente primero)
  return sanitized;
};

export const getMeasures = async (): Promise<Measure[]> => {
  const data = await AsyncStorage.getItem(MEASURES_KEY);
  if (!data) return [];
  try {
    const list: Measure[] = JSON.parse(data);
    return list.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });
  } catch {
    return [];
  }
};

export const getHistoryForBodyPart = async (
  bodyPart: string
): Promise<MeasureHistoryItem[]> => {
  const measures = await getMeasures();
  const normalizedKey = normalizeBodyPartKey(bodyPart);

  const rawHistory: MeasureHistoryItem[] = measures.map((m) => ({
    id: m.id,
    date: m.createdAt,
    value: Number(m[normalizedKey]) || 0,
  }));

  return sanitizeMeasureHistory(rawHistory);
};

export type MuscleSummary = {
  latest: number;
  previous?: number;
  history: { date: string; value: number }[];
};

export const getSanitizedMeasuresSummary = async (): Promise<
  Record<string, MuscleSummary>
> => {
  const measures = await getMeasures();

  const summary: Record<string, MuscleSummary> = {};

  for (const key of ALL_MUSCLE_KEYS) {
    const raw = measures.map((m) => ({
      date: m.createdAt,
      value: Number(m[key]) || 0,
    }));
    const sanitized = sanitizeMeasureHistory(raw);
    summary[key] = {
      latest: sanitized[0]?.value || 0,
      previous: sanitized[1]?.value,
      history: sanitized,
    };
  }

  return summary;
};

export const getLatestSanitizedMeasure = async (): Promise<Measure | null> => {
  const measures = await getMeasures();
  if (!measures || measures.length === 0) return null;

  // measures ya está ordenado del más reciente al más antiguo
  const latestRaw = measures[0];
  const summary = await getSanitizedMeasuresSummary();

  // Buscar el peso, altura, sexo y edad válidos más recientes en todo el historial
  const latestPeso =
    measures.find((m) => m.peso && Number(m.peso) > 0)?.peso || latestRaw.peso || 70;
  const latestAltura =
    measures.find((m) => m.altura && Number(m.altura) > 0)?.altura || latestRaw.altura || 170;
  const latestSexo =
    measures.find((m) => m.sexo && m.sexo.trim() !== "")?.sexo || latestRaw.sexo || "Masculino";
  const latestEdad =
    measures.find((m) => m.edad && Number(m.edad) > 0)?.edad || latestRaw.edad || 18;

  const sanitizedMeasure: Measure = {
    ...latestRaw,
    peso: Number(latestPeso),
    altura: Number(latestAltura),
    sexo: latestSexo,
    edad: Number(latestEdad),
    pecho: summary.pecho?.latest || latestRaw.pecho || 0,
    cuello: summary.cuello?.latest || latestRaw.cuello || 0,
    hombros: summary.hombros?.latest || latestRaw.hombros || 0,
    biceps: summary.biceps?.latest || latestRaw.biceps || 0,
    antebrazo: summary.antebrazo?.latest || latestRaw.antebrazo || 0,
    cintura: summary.cintura?.latest || latestRaw.cintura || 0,
    cadera: summary.cadera?.latest || latestRaw.cadera || 0,
    cuadriceps: summary.cuadriceps?.latest || latestRaw.cuadriceps || 0,
    gemelos: summary.gemelos?.latest || latestRaw.gemelos || 0,
    gluteos: summary.gluteos?.latest || latestRaw.gluteos || 0,
    espalda: summary.espalda?.latest || latestRaw.espalda || 0,
  };

  return sanitizedMeasure;
};

export const addMeasure = async (
  MeasureData: Omit<Measure, "id" | "createdAt">
): Promise<Measure> => {
  const Measures = await getMeasures();
  const newMeasure: Measure = {
    ...MeasureData,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(
    MEASURES_KEY,
    JSON.stringify([newMeasure, ...Measures])
  );
  return newMeasure;
};

export const updateMeasure = async (
  id: string,
  updatedMeasure: Partial<Omit<Measure, "id" | "createdAt">>
): Promise<Measure> => {
  const Measures = await getMeasures();
  const updatedMeasures = Measures.map((m) => {
    if (m.id === id) {
      return {
        ...m,
        ...updatedMeasure,
      };
    }
    return m;
  });
  await AsyncStorage.setItem(MEASURES_KEY, JSON.stringify(updatedMeasures));
  return updatedMeasures.find((m) => m.id === id)!;
};

export const deleteMeasure = async (id: string): Promise<void> => {
  const Measures = await getMeasures();
  const filtered = Measures.filter((m) => m.id !== id);
  await AsyncStorage.setItem(MEASURES_KEY, JSON.stringify(filtered));
};

export const clearAllMeasures = async (): Promise<void> => {
  await AsyncStorage.removeItem(MEASURES_KEY);
};
