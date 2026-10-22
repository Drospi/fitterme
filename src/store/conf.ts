import AsyncStorage from "@react-native-async-storage/async-storage";

export type WeightUnit = "kg" | "lb";

export type UserSettings = {
  unit: WeightUnit;
  weightIncrement: number; // e.g. 1, 2.5, 5, 10
  defaultRestTimer: number; // in seconds (e.g. 90)
};

const SETTINGS_KEY = "UserSettings_v1";

const DEFAULT_SETTINGS: UserSettings = {
  unit: "kg",
  weightIncrement: 2.5,
  defaultRestTimer: 90,
};

export const getSettings = async (): Promise<UserSettings> => {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      unit: parsed.unit === "lb" ? "lb" : "kg",
      weightIncrement: typeof parsed.weightIncrement === "number" ? parsed.weightIncrement : 2.5,
      defaultRestTimer: typeof parsed.defaultRestTimer === "number" ? parsed.defaultRestTimer : 90,
    };
  } catch (error) {
    console.error("Error al cargar configuración:", error);
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = async (newSettings: Partial<UserSettings>): Promise<UserSettings> => {
  try {
    const current = await getSettings();
    const updated = { ...current, ...newSettings };
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error("Error al guardar configuración:", error);
    return DEFAULT_SETTINGS;
  }
};

// Conversiones de Unidades simplificadas (10 lb = 4.5 kg exactos)
// 1 lb = 0.45 kg | 1 kg = 1 / 0.45 lb
const LB_TO_KG_FACTOR = 0.45;

/**
 * Convierte un peso almacenado en KG a la unidad seleccionada para mostrar al usuario.
 * Con factor simplificado: 4.5 kg -> 10 lb exactas.
 */
export const toDisplayWeight = (weightInKg: number, unit: WeightUnit): number => {
  if (unit === "lb") {
    return Math.round((weightInKg / LB_TO_KG_FACTOR) * 10) / 10;
  }
  return Math.round(weightInKg * 10) / 10;
};

/**
 * Convierte un peso ingresado por el usuario en la unidad seleccionada a KG para guardar en almacenamiento.
 * Con factor simplificado: 10 lb -> 4.5 kg exactos.
 */
export const toStoredKg = (inputWeight: number, unit: WeightUnit): number => {
  if (unit === "lb") {
    return Math.round((inputWeight * LB_TO_KG_FACTOR) * 10) / 10;
  }
  return Math.round(inputWeight * 10) / 10;
};

/**
 * Formatea el peso con su etiqueta ("kg" o "lb").
 */
export const formatWeightText = (weightInKg: number, unit: WeightUnit): string => {
  const displayVal = toDisplayWeight(weightInKg, unit);
  return `${displayVal} ${unit}`;
};

/**
 * Convierte en tiempo real entre KG y LB redondeando al múltiplo de 5 más cercano.
 * Usado exclusivamente en la interfaz activa de series (PlayRoutine y PlayFreeRoutine)
 * para cambiar de unidad sin alterar el almacenamiento exacto en KG.
 */
export const convertWeightToggle = (weight: number, toUnit: WeightUnit): number => {
  if (!weight || weight === 0) return 0;
  const isNeg = weight < 0;
  const absWeight = Math.abs(weight);
  if (toUnit === "lb") {
    // KG -> LB: convertir y redondear al múltiplo de 5 más cercano
    const rawLb = absWeight / LB_TO_KG_FACTOR;
    const rounded = Math.round(rawLb / 5) * 5;
    const finalVal = rounded === 0 ? 5 : rounded;
    return isNeg ? -finalVal : finalVal;
  } else {
    // LB -> KG: convertir y redondear al múltiplo de 5 más cercano
    const rawKg = absWeight * LB_TO_KG_FACTOR;
    const rounded = Math.round(rawKg / 5) * 5;
    const finalVal = rounded === 0 ? 5 : rounded;
    return isNeg ? -finalVal : finalVal;
  }
};
