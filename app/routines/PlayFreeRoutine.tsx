import Step2FilterButton from "@/components/Step2FilterButton";
import { useTheme } from "@/context/ThemeContext";
import dataExcercises from "@/data/exercises.json";
import {
  addExerciseLog,
  getPersonalBest,
} from "@/store/historyExcercise";
import { addRoutineSession } from "@/store/historyRoutine";
import { getGlobalStyles } from "@/styles/global";
import { getExerciseImage } from "@/utils/imageMap";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type ExerciseType = {
  id: number;
  nombre: string;
  musculo: string;
  objetivo: string;
  equipamiento: string;
};

type ActiveSet = {
  reps: number;
  peso: number;
};

type ActiveExercise = {
  exerciseInfo: ExerciseType;
  sets: ActiveSet[];
  personalBest: { peso: number; reps: number } | null;
};

export default function PlayFreeRoutineScreen() {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const router = useRouter();

  // Timer
  const [timer, setTimer] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // State for added exercises in this workout session
  const [activeExercises, setActiveExercises] = useState<ActiveExercise[]>([]);

  // State for temporary set inputs per exercise index
  const [inputs, setInputs] = useState<
    Record<number, { reps: string; peso: string }>
  >({});

  // Modal for exercise picker
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [search, setSearch] = useState("");
  const [muscleSelected, setMuscleSelected] = useState("");

  const handleAddExerciseToWorkout = async (exercise: ExerciseType) => {
    // Check if exercise already added
    if (activeExercises.some((e) => e.exerciseInfo.id === exercise.id)) {
      setIsPickerVisible(false);
      return;
    }

    const pb = await getPersonalBest(exercise.id);
    const newActiveEx: ActiveExercise = {
      exerciseInfo: exercise,
      sets: [],
      personalBest: pb,
    };

    setActiveExercises((prev) => [...prev, newActiveEx]);
    setIsPickerVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleAddSet = (exerciseIndex: number) => {
    const currentInput = inputs[exerciseIndex] || { reps: "10", peso: "10" };
    const repsNum = parseInt(currentInput.reps) || 10;
    const pesoNum = parseFloat(currentInput.peso) || 0;

    if (repsNum <= 0) return;

    setActiveExercises((prev) => {
      const updated = [...prev];
      const targetEx = updated[exerciseIndex];
      targetEx.sets = [...targetEx.sets, { reps: repsNum, peso: pesoNum }];
      return updated;
    });

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    setActiveExercises((prev) => {
      const updated = [...prev];
      updated[exerciseIndex].sets = updated[exerciseIndex].sets.filter(
        (_, i) => i !== setIndex,
      );
      return updated;
    });
  };

  const handleRemoveExercise = (exerciseIndex: number) => {
    setActiveExercises((prev) => prev.filter((_, i) => i !== exerciseIndex));
  };

  const handleFinishWorkout = async () => {
    if (activeExercises.length === 0) {
      alert("Agrega al menos un ejercicio antes de terminar la rutina.");
      return;
    }

    let totalVolume = 0;
    const sessionExercises: {
      exerciseName: string;
      sets: { reps: number; peso: number }[];
    }[] = [];

    for (const item of activeExercises) {
      if (item.sets.length > 0) {
        const exVol = item.sets.reduce(
          (acc, s) => acc + s.peso * s.reps,
          0,
        );
        totalVolume += exVol;

        sessionExercises.push({
          exerciseName: item.exerciseInfo.nombre,
          sets: item.sets,
        });

        // Save into exercise history for PR tracking
        await addExerciseLog(item.exerciseInfo.id, item.sets);
      }
    }

    if (sessionExercises.length === 0) {
      alert("Registra al menos una serie en tus ejercicios.");
      return;
    }

    await addRoutineSession({
      name: "Entrenamiento Libre",
      duration: timer,
      totalVolume,
      exercises: sessionExercises,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace("/(tabs)/history");
  };

  const filteredExercises = dataExcercises
    .filter((exercise) => {
      if (muscleSelected === "Todos" || muscleSelected === "") return true;

      const m = exercise.musculo.toLowerCase();

      if (muscleSelected === "Brazos")
        return ["biceps", "triceps", "antebrazos", "hombros"].includes(m);

      if (muscleSelected === "Espalda")
        return ["espalda", "hombros"].includes(m);

      if (muscleSelected === "Pierna")
        return ["pierna", "gemelos", "gluteos", "cuadriceps"].includes(m);

      if (muscleSelected === "Abdomen")
        return ["cadera", "cintura"].includes(m);

      return m === muscleSelected.toLowerCase();
    })
    .filter((e) => e.nombre.toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={globalStyles.container}>
      {/* Header Bar */}
      <View style={[globalStyles.header, { marginBottom: 15 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <View style={{ alignItems: "center" }}>
          <Text style={[globalStyles.title, { fontSize: 20, marginTop: 0 }]}>
            Entrenamiento Libre
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Ionicons name="time-outline" size={16} color={colors.primary} />
            <Text
              style={{
                fontWeight: "bold",
                color: colors.primary,
                fontSize: 16,
              }}
            >
              {formatTime(timer)}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={handleFinishWorkout}
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: colors.background, fontWeight: "bold" }}>
            Terminar
          </Text>
        </TouchableOpacity>
      </View>

      {/* List of active exercises */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {activeExercises.length === 0 ? (
          <View
            style={[
              globalStyles.card,
              {
                alignItems: "center",
                padding: 30,
                marginTop: 20,
                gap: 15,
              },
            ]}
          >
            <Ionicons name="barbell-outline" size={50} color={colors.primary} />
            <Text style={[globalStyles.cardTitle, { textAlign: "center" }]}>
              ¡Comienza tu entrenamiento!
            </Text>
            <Text style={[globalStyles.cardText, { textAlign: "center" }]}>
              Añade ejercicios sobre la marcha y registra tus series.
            </Text>
          </View>
        ) : (
          activeExercises.map((item, exIndex) => {
            const inputVal = inputs[exIndex] || { reps: "10", peso: "10" };
            return (
              <View
                key={item.exerciseInfo.id}
                style={[globalStyles.card, { marginBottom: 15 }]}
              >
                {/* Exercise Header */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 12,
                      alignItems: "center",
                      flex: 1,
                    }}
                  >
                    <Image
                      source={getExerciseImage(item.exerciseInfo.id)}
                      style={{ width: 50, height: 50, borderRadius: 8 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={globalStyles.cardTitle}>
                        {item.exerciseInfo.nombre}
                      </Text>
                      <Text style={globalStyles.cardText}>
                        {item.exerciseInfo.musculo} •{" "}
                        {item.exerciseInfo.equipamiento}
                      </Text>
                      {item.personalBest && (
                        <Text
                          style={{
                            fontSize: 12,
                            color: colors.primary,
                            fontWeight: "bold",
                            marginTop: 2,
                          }}
                        >
                          🏆 PR: {item.personalBest.peso}kg x{" "}
                          {item.personalBest.reps} reps
                        </Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveExercise(exIndex)}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={22}
                      color={colors.delete}
                    />
                  </TouchableOpacity>
                </View>

                {/* Table Header */}
                {item.sets.length > 0 && (
                  <View
                    style={{
                      flexDirection: "row",
                      paddingHorizontal: 8,
                      marginBottom: 8,
                    }}
                  >
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 12,
                        color: colors.textSecondary,
                        fontWeight: "bold",
                      }}
                    >
                      SERIE
                    </Text>
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 12,
                        color: colors.textSecondary,
                        fontWeight: "bold",
                        textAlign: "center",
                      }}
                    >
                      PESO (KG)
                    </Text>
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 12,
                        color: colors.textSecondary,
                        fontWeight: "bold",
                        textAlign: "center",
                      }}
                    >
                      REPS
                    </Text>
                    <Text
                      style={{
                        width: 40,
                        fontSize: 12,
                        color: colors.textSecondary,
                        textAlign: "right",
                      }}
                    ></Text>
                  </View>
                )}

                {/* Completed Sets Rows */}
                {item.sets.map((set, setIdx) => (
                  <View
                    key={setIdx}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: colors.background,
                      padding: 10,
                      borderRadius: 8,
                      marginBottom: 6,
                    }}
                  >
                    <Text
                      style={{
                        flex: 1,
                        color: colors.text,
                        fontWeight: "bold",
                      }}
                    >
                      {setIdx + 1}
                    </Text>
                    <Text
                      style={{
                        flex: 1,
                        color: colors.text,
                        fontWeight: "bold",
                        textAlign: "center",
                      }}
                    >
                      {set.peso} kg
                    </Text>
                    <Text
                      style={{
                        flex: 1,
                        color: colors.text,
                        fontWeight: "bold",
                        textAlign: "center",
                      }}
                    >
                      {set.reps} reps
                    </Text>
                    <TouchableOpacity
                      style={{ width: 40, alignItems: "flex-end" }}
                      onPress={() => handleRemoveSet(exIndex, setIdx)}
                    >
                      <Ionicons
                        name="close-circle-outline"
                        size={20}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                ))}

                {/* Add New Set Form Row */}
                <View
                  style={{
                    flexDirection: "row",
                    gap: 8,
                    alignItems: "center",
                    marginTop: 8,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <TextInput
                      placeholder="Peso (kg)"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="numeric"
                      value={inputVal.peso}
                      onChangeText={(val) =>
                        setInputs((prev) => ({
                          ...prev,
                          [exIndex]: { ...inputVal, peso: val },
                        }))
                      }
                      style={[
                        globalStyles.input,
                        { marginTop: 0, paddingVertical: 8, fontSize: 14 },
                      ]}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      placeholder="Reps"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="numeric"
                      value={inputVal.reps}
                      onChangeText={(val) =>
                        setInputs((prev) => ({
                          ...prev,
                          [exIndex]: { ...inputVal, reps: val },
                        }))
                      }
                      style={[
                        globalStyles.input,
                        { marginTop: 0, paddingVertical: 8, fontSize: 14 },
                      ]}
                    />
                  </View>
                  <TouchableOpacity
                    onPress={() => handleAddSet(exIndex)}
                    style={{
                      backgroundColor: colors.secondary,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 8,
                    }}
                  >
                    <Text
                      style={{ color: colors.textWhite, fontWeight: "bold" }}
                    >
                      + Serie
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        {/* Big Add Exercise Button */}
        <TouchableOpacity
          onPress={() => setIsPickerVisible(true)}
          style={[
            globalStyles.button,
            {
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
              marginTop: 10,
              backgroundColor: colors.surface,
              borderColor: colors.primary,
              borderWidth: 1,
            },
          ]}
        >
          <Ionicons name="add-circle" size={24} color={colors.primary} />
          <Text style={[globalStyles.buttonText, { color: colors.primary }]}>
            Agregar Ejercicio
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal for Exercise Selector */}
      <Modal
        visible={isPickerVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsPickerVisible(false)}
      >
        <View style={[globalStyles.container, { flex: 1 }]}>
          <View style={[globalStyles.header, { marginBottom: 15 }]}>
            <Text style={globalStyles.title}>Seleccionar Ejercicio</Text>
            <TouchableOpacity onPress={() => setIsPickerVisible(false)}>
              <Ionicons name="close" size={30} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View
            style={[
              globalStyles.input,
              {
                flexDirection: "row",
                gap: 10,
                alignItems: "center",
                marginBottom: 10,
                paddingHorizontal: 20,
                paddingVertical: 10,
                marginTop: 0,
              },
            ]}
          >
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              placeholder="Buscar Ejercicios"
              placeholderTextColor={colors.textSecondary}
              style={{ flex: 1, color: colors.text }}
              onChangeText={(text) => setSearch(text)}
              value={search}
            />
          </View>

          {/* Muscle Filters */}
          <View style={{ maxHeight: 60, marginBottom: 10 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, alignItems: "center" }}
            >
              {["Todos", "Pecho", "Brazos", "Espalda", "Pierna", "Abdomen"].map(
                (name) => (
                  <Step2FilterButton
                    key={name}
                    name={name}
                    muscleSelected={muscleSelected}
                    setMuscleSelected={setMuscleSelected}
                  />
                ),
              )}
            </ScrollView>
          </View>

          {/* Exercise List */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {filteredExercises.map((exercise) => {
              const isAlreadyAdded = activeExercises.some(
                (e) => e.exerciseInfo.id === exercise.id,
              );
              return (
                <TouchableOpacity
                  key={exercise.id}
                  disabled={isAlreadyAdded}
                  onPress={() => handleAddExerciseToWorkout(exercise)}
                  style={[
                    globalStyles.card,
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      opacity: isAlreadyAdded ? 0.5 : 1,
                    },
                  ]}
                >
                  <View style={{ flexDirection: "row", gap: 15, alignItems: "center" }}>
                    <Image
                      source={getExerciseImage(exercise.id)}
                      style={{ width: 50, height: 50, borderRadius: 8 }}
                    />
                    <View>
                      <Text style={globalStyles.cardTitle}>
                        {exercise.nombre}
                      </Text>
                      <Text style={globalStyles.cardText}>
                        {exercise.musculo} • {exercise.equipamiento}
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name={
                      isAlreadyAdded
                        ? "checkmark-circle"
                        : "add-circle-outline"
                    }
                    size={28}
                    color={isAlreadyAdded ? colors.primary : colors.textSecondary}
                  />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({});
