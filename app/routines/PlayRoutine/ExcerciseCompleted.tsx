import { useTheme } from "@/context/ThemeContext";
import { getGlobalStyles } from "@/styles/global";
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

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
  next: () => void;
  data: {
    name: string;
    exercises: ExerciseType[];
  };
  addSerie: () => void;
  timer: number;
  series: number;
  excercise: number;
  mejorRepEjercicio: number;
  mejorPesoEjercicio: number;
};
const formatTime = (timer: number) => {
  return new Date(timer * 1000).toISOString().substr(11, 8);
};
const ExcerciseCompleted = ({
  next,
  data,
  addSerie,
  timer,
  series,
  excercise,
  mejorRepEjercicio,
  mejorPesoEjercicio,
}: Props) => {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  return (
    <View
      style={[
        globalStyles.container,
        { flex: 1, justifyContent: "space-between" },
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
        <Ionicons name="timer" size={32} color={colors.primary} />
        <View>
          <Text style={[globalStyles.textSecondary, { letterSpacing: 2 }]}>
            ENTRENAMIENTO ACTIVO
          </Text>
          <Text
            style={{ fontWeight: "bold", fontSize: 24, color: colors.primary }}
          >
            {formatTime(timer)}
          </Text>
        </View>
      </View>
      <View style={{ alignItems: "center" }}>
        <Ionicons
          name="checkmark-circle-outline"
          size={150}
          color={colors.primary}
        />
        <Text
          style={{ fontWeight: "bold", fontSize: 24, color: colors.primary }}
        >
          EJERCICIO COMPLETADO
        </Text>
        <Text style={globalStyles.textSecondary}>
          Haz dominado cada serie con absoulta destreza
        </Text>
      </View>
      <View>
        <View
          style={[
            globalStyles.card,
            { alignItems: "center", gap: 10, marginTop: 20 },
          ]}
        >
          <Text style={globalStyles.textSecondary}>EJERCICIO</Text>
          <Text
            style={[
              globalStyles.cardTitle,
              { fontWeight: "bold", fontSize: 24 },
            ]}
          >
            {data.exercises[excercise].nombre}
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <View
            style={[
              globalStyles.card,
              { alignItems: "center", gap: 10, flex: 1 },
            ]}
          >
            <Text style={globalStyles.textSecondary}>Sets</Text>
            <Text
              style={{
                fontWeight: "bold",
                fontSize: 24,
                color: colors.primary,
              }}
            >
              {series} / {data.exercises[excercise].series}
            </Text>
          </View>
          <View
            style={[
              globalStyles.card,
              { alignItems: "center", gap: 10, flex: 1 },
            ]}
          >
            <Text style={globalStyles.textSecondary}>Mejor Serie</Text>
            <Text
              style={{
                fontWeight: "bold",
                fontSize: 20,
                color: colors.secondary,
              }}
            >
              {mejorPesoEjercicio} kg x {mejorRepEjercicio} reps
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[
            globalStyles.button,
            { flexDirection: "row", justifyContent: "center", gap: 10 },
          ]}
          onPress={next}
        >
          <Text style={globalStyles.buttonText}>
            {excercise < data.exercises.length - 1
              ? "Pasar al siguiente ejercicio"
              : "Terminar Rutina"}
          </Text>
          <Ionicons name="arrow-forward" size={24} color={colors.neutral} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            globalStyles.card,
            {
              alignItems: "center",
              marginTop: 20,
              flexDirection: "row",
              gap: 10,
              justifyContent: "center",
              marginBottom: 30,
            },
          ]}
          onPress={addSerie}
        >
          <Ionicons name="add" size={32} color={colors.primary} />
          <Text style={{ color: colors.primary }}>Agregar Serie</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ExcerciseCompleted;
