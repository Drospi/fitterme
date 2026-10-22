import AsyncStorage from "@react-native-async-storage/async-storage";

export type DashboardCardId =
  | "todayWorkout"
  | "caloriesMacros"
  | "weeklyFrequency"
  | "bodyComposition"
  | "goalsProgress"
  | "bodyHeatmap"
  | "dailyAdvice";

export type CardConfigItem = {
  id: DashboardCardId;
  label: string;
  icon: string;
  visible: boolean;
};

const STORAGE_KEY = "fitterme_dashboard_cards_layout_v1";

export const DEFAULT_CARD_CONFIG: CardConfigItem[] = [
  {
    id: "todayWorkout",
    label: "Entrenamiento de hoy",
    icon: "flash",
    visible: true,
  },
  {
    id: "caloriesMacros",
    label: "Calorías y macros",
    icon: "nutrition",
    visible: true,
  },
  {
    id: "weeklyFrequency",
    label: "Frecuencia semanal",
    icon: "calendar",
    visible: true,
  },
  {
    id: "bodyComposition",
    label: "Composición corporal",
    icon: "body",
    visible: true,
  },
  {
    id: "goalsProgress",
    label: "Progreso hacia tus metas",
    icon: "flag",
    visible: true,
  },
  {
    id: "bodyHeatmap",
    label: "Mapa muscular",
    icon: "fitness",
    visible: true,
  },
  {
    id: "dailyAdvice",
    label: "Consejo del día",
    icon: "bulb",
    visible: true,
  },
];

export const getDashboardConfig = async (): Promise<CardConfigItem[]> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CARD_CONFIG;
    const parsed: CardConfigItem[] = JSON.parse(raw);

    // Asegurar que todas las tarjetas existan aunque se hayan añadido nuevas
    const existingIds = new Set(parsed.map((item) => item.id));
    const merged = [...parsed];

    DEFAULT_CARD_CONFIG.forEach((def) => {
      if (!existingIds.has(def.id)) {
        merged.push(def);
      }
    });

    return merged;
  } catch {
    return DEFAULT_CARD_CONFIG;
  }
};

export const saveDashboardConfig = async (
  config: CardConfigItem[]
): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error("Error guardando config del dashboard:", error);
  }
};

export const resetDashboardConfig = async (): Promise<CardConfigItem[]> => {
  await AsyncStorage.removeItem(STORAGE_KEY);
  return DEFAULT_CARD_CONFIG;
};
