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

// Conversiones de Unidades (Todo se almacena internamente en KG)
const KG_TO_LB = 2.20462;

/**
 * Convierte un peso almacenado en KG a la unidad seleccionada para mostrar al usuario.
 */
export const toDisplayWeight = (weightInKg: number, unit: WeightUnit): number => {
  if (unit === "lb") {
    return Math.round(weightInKg * KG_TO_LB * 10) / 10;
  }
  return Math.round(weightInKg * 10) / 10;
};

/**
 * Convierte un peso ingresado por el usuario en la unidad seleccionada a KG para guardar en almacenamiento.
 */
export const toStoredKg = (inputWeight: number, unit: WeightUnit): number => {
  if (unit === "lb") {
    return Math.round((inputWeight / KG_TO_LB) * 10) / 10;
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
