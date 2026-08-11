import AsyncStorage from "@react-native-async-storage/async-storage";

export type MealCategory = "Desayuno" | "Almuerzo" | "Cena" | "Snack";

export type Meal = {
  id: string;
  name: string;
  category: MealCategory;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  icon?: string;
  createdAt: string;
};

export type ConsumedMeal = {
  id: string;
  mealId: string;
  name: string;
  category: MealCategory;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  icon?: string;
  timestamp: string;
};

export type DailyMealLog = {
  date: string; // Formato YYYY-MM-DD
  consumedMeals: ConsumedMeal[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
};

const MEALS_KEY = "meals";
const DAILY_LOGS_KEY = "daily_meal_logs";

export const DEFAULT_MEALS: Omit<Meal, "id" | "createdAt">[] = [
  // Desayuno
  {
    name: "Avena con Plátano y Proteína",
    category: "Desayuno",
    calories: 420,
    protein: 30,
    carbs: 55,
    fat: 8,
    icon: "nutrition",
  },
  {
    name: "Huevos Revueltos con Tostadas y Aguacate",
    category: "Desayuno",
    calories: 380,
    protein: 22,
    carbs: 30,
    fat: 18,
    icon: "restaurant",
  },
  {
    name: "Omelette de Claras con Espinacas",
    category: "Desayuno",
    calories: 290,
    protein: 28,
    carbs: 12,
    fat: 9,
    icon: "cafe",
  },
  {
    name: "Pancakes de Proteína con Arándanos",
    category: "Desayuno",
    calories: 450,
    protein: 35,
    carbs: 50,
    fat: 10,
    icon: "flame",
  },
  // Almuerzo
  {
    name: "Pechuga de Pollo con Arroz y Brócoli",
    category: "Almuerzo",
    calories: 550,
    protein: 45,
    carbs: 60,
    fat: 10,
    icon: "restaurant",
  },
  {
    name: "Filete de Carne con Camote Asado",
    category: "Almuerzo",
    calories: 620,
    protein: 48,
    carbs: 50,
    fat: 16,
    icon: "flame",
  },
  {
    name: "Salmón a la Plancha con Quinoa",
    category: "Almuerzo",
    calories: 580,
    protein: 42,
    carbs: 45,
    fat: 20,
    icon: "fish",
  },
  {
    name: "Pasta Integral con Pechuga de Pavo",
    category: "Almuerzo",
    calories: 510,
    protein: 38,
    carbs: 65,
    fat: 8,
    icon: "restaurant",
  },
  // Cena
  {
    name: "Ensalada de Atún con Aguacate",
    category: "Cena",
    calories: 380,
    protein: 35,
    carbs: 12,
    fat: 18,
    icon: "fish",
  },
  {
    name: "Crema de Verduras con Pechuga Grille",
    category: "Cena",
    calories: 320,
    protein: 30,
    carbs: 25,
    fat: 7,
    icon: "nutrition",
  },
  {
    name: "Tacos de Pollo en Hojas de Lechuga",
    category: "Cena",
    calories: 340,
    protein: 36,
    carbs: 10,
    fat: 12,
    icon: "restaurant",
  },
  {
    name: "Filete de Pescado Blanco con Espárragos",
    category: "Cena",
    calories: 290,
    protein: 32,
    carbs: 8,
    fat: 6,
    icon: "fish",
  },
  // Snack
  {
    name: "Batido de Proteína y Frutos Secos",
    category: "Snack",
    calories: 280,
    protein: 25,
    carbs: 20,
    fat: 9,
    icon: "flame",
  },
  {
    name: "Yogur Griego con Fresas y Almendras",
    category: "Snack",
    calories: 220,
    protein: 18,
    carbs: 22,
    fat: 6,
    icon: "nutrition",
  },
  {
    name: "Manzana con Mantequilla de Maní",
    category: "Snack",
    calories: 200,
    protein: 6,
    carbs: 26,
    fat: 10,
    icon: "leaf",
  },
  {
    name: "Barrita de Proteína Casera",
    category: "Snack",
    calories: 250,
    protein: 20,
    carbs: 24,
    fat: 8,
    icon: "flame",
  },
];

export const getMeals = async (): Promise<Meal[]> => {
  const data = await AsyncStorage.getItem(MEALS_KEY);
  if (!data) {
    // Si no existen comidas, inicializamos con catálogo amplio de ejemplo por defecto
    const initialMeals: Meal[] = DEFAULT_MEALS.map((m, index) => ({
      ...m,
      id: `default-${index + 1}`,
      createdAt: new Date().toISOString(),
    }));
    await AsyncStorage.setItem(MEALS_KEY, JSON.stringify(initialMeals));
    return initialMeals;
  }
  return JSON.parse(data);
};

export const addMeal = async (
  meal: Omit<Meal, "id" | "createdAt">,
): Promise<Meal> => {
  const meals = await getMeals();
  const newMeal: Meal = {
    ...meal,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(MEALS_KEY, JSON.stringify([newMeal, ...meals]));
  return newMeal;
};

export const deleteMeal = async (id: string): Promise<void> => {
  const meals = await getMeals();
  const filtered = meals.filter((meal) => meal.id !== id);
  await AsyncStorage.setItem(MEALS_KEY, JSON.stringify(filtered));
};

export const clearAllMeals = async (): Promise<void> => {
  await AsyncStorage.removeItem(MEALS_KEY);
  await AsyncStorage.removeItem(DAILY_LOGS_KEY);
};

// ==========================================
// REGISTRO DE CONSUMO DIARIO (HISTORIAL)
// ==========================================

export const getTodayDateKey = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getDailyMealLogs = async (): Promise<DailyMealLog[]> => {
  const data = await AsyncStorage.getItem(DAILY_LOGS_KEY);
  return data ? JSON.parse(data) : [];
};

export const getTodayMealLog = async (): Promise<DailyMealLog> => {
  const logs = await getDailyMealLogs();
  const todayKey = getTodayDateKey();
  const todayLog = logs.find((l) => l.date === todayKey);

  if (todayLog) return todayLog;

  return {
    date: todayKey,
    consumedMeals: [],
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
  };
};

export const logMealForToday = async (meal: Meal): Promise<DailyMealLog> => {
  const logs = await getDailyMealLogs();
  const todayKey = getTodayDateKey();

  const newConsumed: ConsumedMeal = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    mealId: meal.id,
    name: meal.name,
    category: meal.category || "Almuerzo",
    calories: meal.calories || 0,
    protein: meal.protein || 0,
    carbs: meal.carbs || 0,
    fat: meal.fat || 0,
    icon: meal.icon || "fast-food",
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };

  const existingIndex = logs.findIndex((l) => l.date === todayKey);
  let updatedLog: DailyMealLog;

  if (existingIndex >= 0) {
    const currentLog = logs[existingIndex];
    const updatedConsumed = [newConsumed, ...currentLog.consumedMeals];

    updatedLog = {
      ...currentLog,
      consumedMeals: updatedConsumed,
      totalCalories: updatedConsumed.reduce((sum, item) => sum + item.calories, 0),
      totalProtein: updatedConsumed.reduce((sum, item) => sum + item.protein, 0),
      totalCarbs: updatedConsumed.reduce((sum, item) => sum + item.carbs, 0),
      totalFat: updatedConsumed.reduce((sum, item) => sum + item.fat, 0),
    };

    logs[existingIndex] = updatedLog;
  } else {
    updatedLog = {
      date: todayKey,
      consumedMeals: [newConsumed],
      totalCalories: newConsumed.calories,
      totalProtein: newConsumed.protein,
      totalCarbs: newConsumed.carbs,
      totalFat: newConsumed.fat,
    };
    logs.unshift(updatedLog);
  }

  await AsyncStorage.setItem(DAILY_LOGS_KEY, JSON.stringify(logs));
  return updatedLog;
};

export const removeConsumedMealToday = async (consumedId: string): Promise<DailyMealLog> => {
  const logs = await getDailyMealLogs();
  const todayKey = getTodayDateKey();
  const existingIndex = logs.findIndex((l) => l.date === todayKey);

  if (existingIndex < 0) return getTodayMealLog();

  const currentLog = logs[existingIndex];
  const filtered = currentLog.consumedMeals.filter((item) => item.id !== consumedId);

  const updatedLog: DailyMealLog = {
    ...currentLog,
    consumedMeals: filtered,
    totalCalories: filtered.reduce((sum, item) => sum + item.calories, 0),
    totalProtein: filtered.reduce((sum, item) => sum + item.protein, 0),
    totalCarbs: filtered.reduce((sum, item) => sum + item.carbs, 0),
    totalFat: filtered.reduce((sum, item) => sum + item.fat, 0),
  };

  logs[existingIndex] = updatedLog;
  await AsyncStorage.setItem(DAILY_LOGS_KEY, JSON.stringify(logs));
  return updatedLog;
};
