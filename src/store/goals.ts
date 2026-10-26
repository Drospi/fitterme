import AsyncStorage from "@react-native-async-storage/async-storage";
import exercisesData from "@/data/exercises.json";
import { getExerciseHistory } from "./historyExcercise";
import { getRoutineSessions } from "./historyRoutine";

export type Goals = {
  id: string;
  goalWeight: number;
  goalGrass: number; // % grasa corporal
  masaMagra: number; // kg masa magra
  frequency: number; // dias a la semana
  targetCalories?: number; // kcal
  targetProtein?: number; // g proteina
  targetCarbs?: number; // g carbs
  targetFat?: number; // g grasa
  targetWeeklyVolume?: number; // Volumen Máximo / Objetivo semanal en kg (ej: 25000)
  customMuscleDistribution?: Record<string, number>; // Porcentaje de volumen por músculo
  createdAt: string;
};

const GOALS_KEY = "Goals";

export const DEFAULT_GOAL: Goals = {
  id: "default",
  goalWeight: 75,
  goalGrass: 15,
  masaMagra: 60,
  frequency: 4,
  targetCalories: 2500,
  targetProtein: 140,
  targetCarbs: 250,
  targetFat: 70,
  targetWeeklyVolume: 24000,
  createdAt: new Date().toISOString(),
};

export const getGoals = async (): Promise<Goals[]> => {
  const data = await AsyncStorage.getItem(GOALS_KEY);
  return data ? JSON.parse(data) : [];
};

export const getLatestGoal = async (): Promise<Goals> => {
  const list = await getGoals();
  if (list && list.length > 0) {
    const latest = list[0];
    return {
      ...DEFAULT_GOAL,
      ...latest,
      targetCalories: latest.targetCalories || 2500,
      targetProtein: latest.targetProtein || 140,
      targetCarbs: latest.targetCarbs || 250,
      targetFat: latest.targetFat || 70,
      targetWeeklyVolume: latest.targetWeeklyVolume || 24000,
    };
  }
  return DEFAULT_GOAL;
};

export const addGoal = async (
  goal: Omit<Goals, "id" | "createdAt">
): Promise<Goals> => {
  const goals = await getGoals();
  const newGoal: Goals = {
    ...goal,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(GOALS_KEY, JSON.stringify([newGoal, ...goals]));
  return newGoal;
};

export {
  calculateMuscleVolumeStats,
  calculateRecommendedMaxVolume,
  MuscleVolumeStat,
} from "@/calculos/volumeCalculator";
