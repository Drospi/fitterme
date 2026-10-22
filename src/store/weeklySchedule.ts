import AsyncStorage from "@react-native-async-storage/async-storage";
import { getRoutines, Routine } from "./routines";

export type DayAssignmentType = "routine" | "rest" | "unassigned";

export type DaySchedule = {
  dayOfWeek: number; // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  type: DayAssignmentType;
  routineId?: string;
  routineName?: string;
};

export const DAY_NAMES: Record<number, string> = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
  0: "Domingo",
};

export const ORDERED_DAYS = [1, 2, 3, 4, 5, 6, 0]; // Lunes a Domingo

const WEEKLY_SCHEDULE_KEY = "weekly_routine_schedule_v1";

export const DEFAULT_SCHEDULE: Record<number, DaySchedule> = {
  1: { dayOfWeek: 1, type: "unassigned" },
  2: { dayOfWeek: 2, type: "unassigned" },
  3: { dayOfWeek: 3, type: "unassigned" },
  4: { dayOfWeek: 4, type: "unassigned" },
  5: { dayOfWeek: 5, type: "unassigned" },
  6: { dayOfWeek: 6, type: "unassigned" },
  0: { dayOfWeek: 0, type: "unassigned" },
};

export const getWeeklySchedule = async (): Promise<Record<number, DaySchedule>> => {
  try {
    const raw = await AsyncStorage.getItem(WEEKLY_SCHEDULE_KEY);
    if (!raw) return { ...DEFAULT_SCHEDULE };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SCHEDULE, ...parsed };
  } catch {
    return { ...DEFAULT_SCHEDULE };
  }
};

export const saveWeeklySchedule = async (
  schedule: Record<number, DaySchedule>
): Promise<void> => {
  await AsyncStorage.setItem(WEEKLY_SCHEDULE_KEY, JSON.stringify(schedule));
};

export const assignRoutineToDay = async (
  dayOfWeek: number,
  routineId: string,
  routineName: string
): Promise<Record<number, DaySchedule>> => {
  const current = await getWeeklySchedule();
  current[dayOfWeek] = {
    dayOfWeek,
    type: "routine",
    routineId,
    routineName,
  };
  await saveWeeklySchedule(current);
  return current;
};

export const assignRestToDay = async (
  dayOfWeek: number
): Promise<Record<number, DaySchedule>> => {
  const current = await getWeeklySchedule();
  current[dayOfWeek] = {
    dayOfWeek,
    type: "rest",
  };
  await saveWeeklySchedule(current);
  return current;
};

export const unassignDay = async (
  dayOfWeek: number
): Promise<Record<number, DaySchedule>> => {
  const current = await getWeeklySchedule();
  current[dayOfWeek] = {
    dayOfWeek,
    type: "unassigned",
  };
  await saveWeeklySchedule(current);
  return current;
};

export const getTodaySchedule = async (): Promise<{
  dayOfWeek: number;
  dayName: string;
  schedule: DaySchedule;
  routine: Routine | null;
}> => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0..6
  const scheduleMap = await getWeeklySchedule();
  const daySchedule = scheduleMap[dayOfWeek] || {
    dayOfWeek,
    type: "unassigned",
  };

  let matchedRoutine: Routine | null = null;
  if (daySchedule.type === "routine" && daySchedule.routineId) {
    const allRoutines = await getRoutines();
    matchedRoutine = allRoutines.find((r) => r.id === daySchedule.routineId) || null;
  }

  return {
    dayOfWeek,
    dayName: DAY_NAMES[dayOfWeek] || "Hoy",
    schedule: daySchedule,
    routine: matchedRoutine,
  };
};
