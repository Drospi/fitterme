import AsyncStorage from "@react-native-async-storage/async-storage";

export type Goals = {
  id: string;
  goalWeight: number;
  goalGrass: number;
  masaMagra: number;
  frequency: number;
  createdAt: string;
};

const GOALS_KEY = "Goals";

export const getGoals = async (): Promise<Goals[]> => {
  const data = await AsyncStorage.getItem(GOALS_KEY);
  return data ? JSON.parse(data) : [];
};

export const addGoal = async (
  Excercise: Omit<Goals, "id" | "createdAt">,
): Promise<Goals> => {
  const Goals = await getGoals();
  const newGoal: Goals = {
    ...Excercise,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(GOALS_KEY, JSON.stringify([newGoal, ...Goals]));
  return newGoal;
};
