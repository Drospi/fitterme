import AsyncStorage from "@react-native-async-storage/async-storage";

export type RoutineSession = {
  id: string;
  name: string; // Nombre de la rutina (ej: "Día de Pecho")
  date: string;
  duration: number; // en segundos
  totalVolume: number;
  exercises: {
    exerciseName: string;
    sets: { reps: number; peso: number; intensity?: string; timeMinutes?: number }[];
  }[];
  aiFeedback?: {
    title: string;
    text: string;
    badgeColor?: string;
  };
  healthData?: {
    steps: number;
    activeCalories: number;
  };
};

const HISTORY_ROUTINES_KEY = "history_routines";

const isSameCalendarDay = (dateStr1: string, dateStr2: string): boolean => {
  try {
    const d1 = new Date(dateStr1);
    const d2 = new Date(dateStr2);
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  } catch {
    return false;
  }
};

// Guardar toda la sesión de una vez, combinando si ya se realizó una rutina en el mismo día
export const addRoutineSession = async (
  session: Omit<RoutineSession, "id" | "date"> & { date?: string },
): Promise<RoutineSession> => {
  const history = await getRoutineSessions();
  const sessionDate = session.date || new Date().toISOString();

  const sameDaySessions = history.filter((item) =>
    isSameCalendarDay(item.date, sessionDate)
  );
  const otherDaySessions = history.filter(
    (item) => !isSameCalendarDay(item.date, sessionDate)
  );

  if (sameDaySessions.length > 0) {
    const baseSession = sameDaySessions[0];

    let totalDuration = session.duration || 0;
    let totalVolume = session.totalVolume || 0;
    let combinedName = session.name || "";
    let combinedSteps = session.healthData?.steps || 0;
    let combinedCalories = session.healthData?.activeCalories || 0;
    let hasHealth = !!session.healthData;

    const exercisesMap = new Map<
      string,
      {
        exerciseName: string;
        sets: { reps: number; peso: number; intensity?: string; timeMinutes?: number }[];
      }
    >();

    const mergeExercisesList = (exercises: RoutineSession["exercises"]) => {
      (exercises || []).forEach((ex) => {
        const key = ex.exerciseName.trim().toLowerCase();
        if (exercisesMap.has(key)) {
          exercisesMap.get(key)!.sets.push(...(ex.sets || []));
        } else {
          exercisesMap.set(key, {
            exerciseName: ex.exerciseName,
            sets: [...(ex.sets || [])],
          });
        }
      });
    };

    sameDaySessions.forEach((prev) => {
      totalDuration += prev.duration || 0;
      totalVolume += prev.totalVolume || 0;

      if (prev.name && prev.name.trim()) {
        const currentLower = combinedName.toLowerCase();
        const prevLower = prev.name.toLowerCase();
        if (!combinedName) {
          combinedName = prev.name;
        } else if (
          !currentLower.includes(prevLower) &&
          !prevLower.includes(currentLower)
        ) {
          combinedName = `${prev.name} + ${combinedName}`;
        }
      }

      if (prev.healthData) {
        hasHealth = true;
        combinedSteps += prev.healthData.steps || 0;
        combinedCalories += prev.healthData.activeCalories || 0;
      }

      mergeExercisesList(prev.exercises);
    });

    mergeExercisesList(session.exercises);

    const mergedSession: RoutineSession = {
      ...baseSession,
      name: combinedName || baseSession.name,
      date: sessionDate,
      duration: totalDuration,
      totalVolume,
      exercises: Array.from(exercisesMap.values()),
      healthData: hasHealth
        ? { steps: combinedSteps, activeCalories: combinedCalories }
        : undefined,
      aiFeedback: session.aiFeedback || baseSession.aiFeedback,
    };

    await AsyncStorage.setItem(
      HISTORY_ROUTINES_KEY,
      JSON.stringify([mergedSession, ...otherDaySessions]),
    );

    return mergedSession;
  }

  const newSession: RoutineSession = {
    ...session,
    id: Date.now().toString(),
    date: sessionDate,
  };

  await AsyncStorage.setItem(
    HISTORY_ROUTINES_KEY,
    JSON.stringify([newSession, ...history]),
  );

  return newSession;
};

// Obtener todas las sesiones para mostrar en HistoryScreen
export const getRoutineSessions = async (): Promise<RoutineSession[]> => {
  const data = await AsyncStorage.getItem(HISTORY_ROUTINES_KEY);
  return data ? JSON.parse(data) : [];
};

export const getRoutineSession = async (
  id: string,
): Promise<RoutineSession> => {
  const data = await AsyncStorage.getItem(HISTORY_ROUTINES_KEY);
  const sessions = data ? JSON.parse(data) : [];
  return sessions.find((session: RoutineSession) => session.id === id);
};
