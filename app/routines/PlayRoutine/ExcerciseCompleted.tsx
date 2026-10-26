import { EffortAdjustmentResult, EffortRating } from "@/calculos/perceivedEffort";
import ExerciseFeelingScale from "@/components/workout/ExerciseFeelingScale";
import { useTheme } from "@/context/ThemeContext";
import { getSettings, toDisplayWeight, UserSettings } from "@/store/conf";
import { isBodyweightExercise, isCardioExercise } from "@/store/excercise";
import { getGlobalStyles } from "@/styles/global";
import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

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
  selectedRating?: EffortRating | null;
  onSelectRating?: (rating: EffortRating, result: EffortAdjustmentResult) => void;
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
  selectedRating = null,
  onSelectRating,
}: Props) => {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  const [userSettings, setUserSettings] = useState<UserSettings>({
    unit: "kg",
    weightIncrement: 2.5,
    defaultRestTimer: 90,
  });

  const [localRating, setLocalRating] = useState<EffortRating | null>(selectedRating);

  useEffect(() => {
    getSettings().then((s) => setUserSettings(s));
  }, []);

  const currentExercise = data.exercises[excercise];
  const isCardio = currentExercise ? isCardioExercise(currentExercise) : false;
  const isBw = currentExercise ? isBodyweightExercise(currentExercise) : false;

  return (
    <ScrollView
      style={globalStyles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 60 }}
    >
      {/* Header Temporizador */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginTop: 10, marginBottom: 20 }}>
        <Ionicons name="timer" size={32} color={colors.primary} />
        <View>
          <Text style={[globalStyles.textSecondary, { letterSpacing: 2, fontSize: 11 }]}>
            ENTRENAMIENTO ACTIVO
          </Text>
          <Text style={{ fontWeight: "bold", fontSize: 24, color: colors.primary }}>
            {formatTime(timer)}
          </Text>
        </View>
      </View>

      {/* Ícono Celebratorio */}
      <View style={{ alignItems: "center", marginVertical: 10 }}>
        <Ionicons
          name="checkmark-circle-outline"
          size={110}
          color={colors.primary}
        />
        <Text style={{ fontWeight: "900", fontSize: 22, color: colors.primary, marginTop: 6 }}>
          ¡EJERCICIO COMPLETADO!
        </Text>
        <Text style={[globalStyles.textSecondary, { textAlign: "center", marginTop: 4, paddingHorizontal: 20 }]}>
          Has dominado cada serie con absoluta destreza y disciplina.
        </Text>
      </View>

      {/* Resumen del Ejercicio */}
      <View style={[globalStyles.card, { alignItems: "center", gap: 6, marginVertical: 12 }]}>
        <Text style={[globalStyles.textSecondary, { fontSize: 11, letterSpacing: 1 }]}>
          EJERCICIO REALIZADO
        </Text>
        <Text style={[globalStyles.cardTitle, { fontWeight: "bold", fontSize: 20, textAlign: "center" }]}>
          {currentExercise?.nombre}
        </Text>
      </View>

      {/* Métricas: Sets & Mejor Serie */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10, marginBottom: 14 }}>
        <View style={[globalStyles.card, { alignItems: "center", gap: 6, flex: 1 }]}>
          <Text style={[globalStyles.textSecondary, { fontSize: 11 }]}>Series Totales</Text>
          <Text style={{ fontWeight: "bold", fontSize: 22, color: colors.primary }}>
            {series} / {currentExercise?.series}
          </Text>
        </View>

        <View style={[globalStyles.card, { alignItems: "center", gap: 6, flex: 1 }]}>
          <Text style={[globalStyles.textSecondary, { fontSize: 11 }]}>Mejor Serie</Text>
          <Text style={{ fontWeight: "bold", fontSize: 16, color: colors.secondary || colors.primary }}>
            {mejorPesoEjercicio <= 0
              ? `Corporal x ${mejorRepEjercicio} reps`
              : `${toDisplayWeight(mejorPesoEjercicio, userSettings.unit)} ${userSettings.unit} x ${mejorRepEjercicio} reps`}
          </Text>
        </View>
      </View>

      {/* Escala Percepción del Esfuerzo Subjetivo */}
      {currentExercise && (
        <ExerciseFeelingScale
          selectedRating={localRating}
          onSelectRating={(rating, result) => {
            setLocalRating(rating);
            if (onSelectRating) {
              onSelectRating(rating, result);
            }
          }}
          currentWeight={mejorPesoEjercicio}
          currentReps={mejorRepEjercicio || 10}
          unit={userSettings.unit}
          weightIncrement={userSettings.weightIncrement}
          isBodyweight={isBw}
          isCardio={isCardio}
          exerciseName={currentExercise.nombre}
        />
      )}

      {/* Acciones: Siguiente Ejercicio y Agregar Serie */}
      <TouchableOpacity
        style={[globalStyles.button, { flexDirection: "row", justifyContent: "center", gap: 10, marginTop: 14 }]}
        onPress={next}
      >
        <Text style={globalStyles.buttonText}>
          {excercise < data.exercises.length - 1
            ? "Pasar al siguiente ejercicio"
            : "Terminar Rutina"}
        </Text>
        <Ionicons name="arrow-forward" size={22} color={colors.neutral} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          globalStyles.card,
          {
            alignItems: "center",
            marginTop: 12,
            flexDirection: "row",
            gap: 10,
            justifyContent: "center",
          },
        ]}
        onPress={addSerie}
      >
        <Ionicons name="add" size={26} color={colors.primary} />
        <Text style={{ color: colors.primary, fontWeight: "bold", fontSize: 14 }}>
          + Agregar Serie Adicional
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default ExcerciseCompleted;
