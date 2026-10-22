import React, { createContext, useContext, useState } from "react";

export type ActiveWorkoutState = {
  isActive: boolean;
  routineId?: string;
  routineName: string;
  workoutType: "predefined" | "free";
  startTime: number; // Timestamp en ms del inicio real del entrenamiento
  routePath: string; // p. ej. "/routines/PlayRoutine/123" o "/routines/PlayFreeRoutine"
  workoutState?: any; // Objeto con el estado borrador del entrenamiento (ej. ejercicios e inputs)
};

type ActiveWorkoutContextType = {
  activeWorkout: ActiveWorkoutState | null;
  startActiveWorkout: (params: {
    routineId?: string;
    routineName: string;
    workoutType: "predefined" | "free";
    routePath: string;
    startTime?: number;
    workoutState?: any;
  }) => void;
  updateWorkoutState: (stateData: any) => void;
  finishActiveWorkout: () => void;
  getElapsedTime: () => number;
};

const ActiveWorkoutContext = createContext<ActiveWorkoutContextType>({
  activeWorkout: null,
  startActiveWorkout: () => {},
  updateWorkoutState: () => {},
  finishActiveWorkout: () => {},
  getElapsedTime: () => 0,
});

export const ActiveWorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkoutState | null>(null);

  const startActiveWorkout = ({
    routineId,
    routineName,
    workoutType,
    routePath,
    startTime = Date.now(),
    workoutState,
  }: {
    routineId?: string;
    routineName: string;
    workoutType: "predefined" | "free";
    routePath: string;
    startTime?: number;
    workoutState?: any;
  }) => {
    setActiveWorkout((prev) => {
      // Si ya hay un entrenamiento activo de la misma rutina/ruta, mantener el startTime y estado original
      if (prev && prev.isActive && prev.routePath === routePath) {
        return prev;
      }
      return {
        isActive: true,
        routineId,
        routineName,
        workoutType,
        routePath,
        startTime: prev?.startTime || startTime,
        workoutState: workoutState || prev?.workoutState,
      };
    });
  };

  const updateWorkoutState = (stateData: any) => {
    setActiveWorkout((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        workoutState: {
          ...prev.workoutState,
          ...stateData,
        },
      };
    });
  };

  const finishActiveWorkout = () => {
    setActiveWorkout(null);
  };

  const getElapsedTime = (): number => {
    if (!activeWorkout || !activeWorkout.startTime) return 0;
    return Math.max(0, Math.floor((Date.now() - activeWorkout.startTime) / 1000));
  };

  return (
    <ActiveWorkoutContext.Provider
      value={{
        activeWorkout,
        startActiveWorkout,
        updateWorkoutState,
        finishActiveWorkout,
        getElapsedTime,
      }}
    >
      {children}
    </ActiveWorkoutContext.Provider>
  );
};

export const useActiveWorkout = () => useContext(ActiveWorkoutContext);
