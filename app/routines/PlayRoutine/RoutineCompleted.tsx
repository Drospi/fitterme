import { useTheme } from "@/context/ThemeContext";
import { getGlobalStyles } from "@/styles/global";
import React from "react";
import { Text, View } from "react-native";

type ExerciseType = {
  id: number;
  nombre: string;
  musculo: string;
  objetivo: string;
  equipamiento: string;
  urlimage?: string;
  series?: number;
  reps?: number;
  peso?: number;
};

type ExerciseList = ExerciseType[];

type Props = {
  data: {
    name: string;
    exercises: ExerciseType[];
  };
  timer: number;
};
const formatTime = (timer: number) => {
  return new Date(timer * 1000).toISOString().substr(11, 8);
};
const RoutineCompleted = ({ data, timer }: Props) => {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  return (
    <View style={globalStyles.container}>
      <Text>Entrenamiento Activo {data.name}</Text>
      <Text>Rutina Terminada</Text>
      <Text>Tiempo {formatTime(timer)}</Text>
    </View>
  );
};

export default RoutineCompleted;
