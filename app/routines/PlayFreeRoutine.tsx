import Step2FilterButton from "@/components/Step2FilterButton";
import { useTheme } from "@/context/ThemeContext";
import {
  formatWeightText,
  getSettings,
  toDisplayWeight,
  toStoredKg,
  UserSettings,
} from "@/store/conf";
import { ExerciseCatalogItem, getAllExercises } from "@/store/excercise";
import {
  addExerciseLog,
  getPersonalBest,
} from "@/store/historyExcercise";
import { addRoutineSession } from "@/store/historyRoutine";
import { getGlobalStyles } from "@/styles/global";
import { getExerciseImage } from "@/utils/imageMap";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import RoutineCompleted from "./PlayRoutine/RoutineCompleted";

type ExerciseType = ExerciseCatalogItem;

type ActiveSet = {
  reps: number;
  peso: number; // Siempre guardado en KG
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

  const [userSettings, setUserSettings] = useState<UserSettings>({
    unit: "kg",
    weightIncrement: 2.5,
    defaultRestTimer: 90,
  });

  const [allCatalog, setAllCatalog] = useState<ExerciseType[]>([]);

  const loadCatalog = async () => {
    const data = await getAllExercises();
    setAllCatalog(data);
  };

  useFocusEffect(
    useCallback(() => {
      getSettings().then((s) => setUserSettings(s));
      loadCatalog();
    }, [])
  );

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

  // State for completion summary screen
  const [isRoutineCompleted, setIsRoutineCompleted] = useState(false);
  const [completedSummary, setCompletedSummary] = useState({
    name: "Entrenamiento Libre",
    duration: 0,
    totalVolume: 0,
    totalSeries: 0,
    newRecordsCount: 0,
    exercises: [] as ExerciseType[],
  });

  // Modal for exercise picker
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [search, setSearch] = useState("");
  const [muscleSelected, setMuscleSelected] = useState("");

  const handleAddExerciseToWorkout = async (exercise: ExerciseType) => {
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
    const pesoInputVal = parseFloat(currentInput.peso) || 0;

    if (repsNum <= 0) return;

    // Convertir el peso ingresado a KG para guardar de forma consistente
    const weightInKg = toStoredKg(pesoInputVal, userSettings.unit);

    setActiveExercises((prev) => {
      const updated = [...prev];
      const targetEx = updated[exerciseIndex];
      targetEx.sets = [...targetEx.sets, { reps: repsNum, peso: weightInKg }];
      return updated;
    });

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    setActiveExercises((prev) => {
      const updated = [...prev];
      updated[exerciseIndex].sets = updated[exerciseIndex].sets.filter(
        (_, i) => i !== setIndex
      );
      return updated;
    });
  };

  const handleRemoveExercise = (exerciseIndex: number) => {
    setActiveExercises((prev) => prev.filter((_, i) => i !== exerciseIndex));
  };

  const handleFinishWorkout = async () => {
    if (activeExercises.length === 0) {
      Toast.show({
        type: "error",
        text1: "Sin ejercicios",
        text2: "Agrega al menos un ejercicio antes de terminar la rutina.",
      });
      return;
    }

    let totalVolume = 0;
    let totalSeries = 0;
    let newRecordsCount = 0;

    const sessionExercises: {
      exerciseName: string;
      sets: { reps: number; peso: number }[];
    }[] = [];

    const summaryExercises: ExerciseType[] = [];

    for (const item of activeExercises) {
      if (item.sets.length > 0) {
        totalSeries += item.sets.length;
        const exVol = item.sets.reduce((acc, s) => acc + s.peso * s.reps, 0);
        totalVolume += exVol;

        sessionExercises.push({
          exerciseName: item.exerciseInfo.nombre,
          sets: item.sets,
        });

        summaryExercises.push(item.exerciseInfo);

        // Verificar si rompió récord en este ejercicio
        const isNewPR = item.sets.some((s) => {
          if (!item.personalBest) return true;
          return (
            s.peso > item.personalBest.peso ||
            (s.peso === item.personalBest.peso && s.reps > item.personalBest.reps)
          );
        });

        if (isNewPR) {
          newRecordsCount += 1;
        }

        // Save into exercise history for PR tracking
        await addExerciseLog(item.exerciseInfo.id, item.sets);
      }
    }

    if (sessionExercises.length === 0) {
      Toast.show({
        type: "error",
        text1: "Sin series",
        text2: "Registra al menos una serie en tus ejercicios.",
      });
      return;
    }

    await addRoutineSession({
      name: "Entrenamiento Libre",
      duration: timer,
      totalVolume,
      exercises: sessionExercises,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setCompletedSummary({
      name: "Entrenamiento Libre",
      duration: timer,
      totalVolume,
      totalSeries,
      newRecordsCount,
      exercises: summaryExercises,
    });

    setIsRoutineCompleted(true);
  };

  if (isRoutineCompleted) {
    return (
      <RoutineCompleted
        data={{
          name: completedSummary.name,
          exercises: completedSummary.exercises,
        }}
        timer={completedSummary.duration}
        tonelaje={completedSummary.totalVolume}
        series={completedSummary.totalSeries}
        newRecordsCount={completedSummary.newRecordsCount}
      />
    );
  }

  const filteredExercises = allCatalog
    .filter((exercise) => {
      if (muscleSelected === "Todos" || muscleSelected === "") return true;

      const m = (exercise.musculo || "").toLowerCase();

      if (muscleSelected === "Brazos")
        return ["biceps", "triceps", "antebrazo", "hombros"].includes(m);

      if (muscleSelected === "Espalda")
        return ["espalda", "hombros"].includes(m);

      if (muscleSelected === "Pierna")
        return ["pierna", "gemelos", "gluteos", "cuadriceps"].includes(m);

      if (muscleSelected === "Abdomen")
        return ["cadera", "cintura", "abdomen"].includes(m);

      return m === muscleSelected.toLowerCase();
    })
    .filter((e) => e.nombre.toLowerCase().includes(search.toLowerCase()));

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <View style={globalStyles.container}>
        {/* Header */}
        <View style={[globalStyles.header, { marginBottom: 15 }]}>
          <View>
            <Text style={{ fontSize: 13, fontWeight: "bold", color: colors.primary, letterSpacing: 1 }}>
              ENTRENAMIENTO LIBRE
            </Text>
            <Text style={[globalStyles.title, { fontSize: 22, marginTop: 2 }]}>
              Sesión en Curso
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: colors.surface,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.primary + "40",
            }}
          >
            <Ionicons name="timer-outline" size={18} color={colors.primary} />
            <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.primary }}>
              {formatTime(timer)}
            </Text>
          </View>
        </View>

        {/* Main Content */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 250 }}
        >
          {activeExercises.length === 0 ? (
            <View
              style={[
                globalStyles.card,
                { alignItems: "center", paddingVertical: 40, marginTop: 20 },
              ]}
            >
              <Ionicons name="barbell-outline" size={48} color={colors.primary} />
              <Text style={[globalStyles.cardTitle, { marginTop: 15, marginBottom: 5 }]}>
                ¡Empieza tu Entrenamiento!
              </Text>
              <Text style={[globalStyles.cardText, { textAlign: "center", paddingHorizontal: 20 }]}>
                Presiona el botón "+ Agregar Ejercicio" para ir sumando tus ejercicios y registrar tus series.
              </Text>
            </View>
          ) : (
            activeExercises.map((item, exIndex) => {
              const inputVal = inputs[exIndex] || { reps: "10", peso: "10" };
              return (
                <View
                  key={item.exerciseInfo.id}
                  style={[globalStyles.card, { marginBottom: 15, padding: 16 }]}
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
                    <TouchableOpacity
                      style={{
                        flexDirection: "row",
                        gap: 12,
                        alignItems: "center",
                        flex: 1,
                      }}
                      onPress={() => router.push(`/exercises/DetailsExercise/${item.exerciseInfo.id}` as any)}
                    >
                      <Image
                        source={getExerciseImage(item.exerciseInfo.id, item.exerciseInfo.urlimage)}
                        style={{ width: 50, height: 50, borderRadius: 8 }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={globalStyles.cardTitle}>
                          {item.exerciseInfo.nombre}
                        </Text>
                        <Text style={globalStyles.cardText}>
                          {item.exerciseInfo.musculo} • {item.exerciseInfo.equipamiento}
                        </Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 }}>
                          <Ionicons name="trophy" size={13} color={colors.secondary} />
                          <Text style={{ fontSize: 12, color: colors.secondary, fontWeight: "600" }}>
                            Mejor Serie: {item.personalBest ? formatWeightText(item.personalBest.peso, userSettings.unit) + ` x ${item.personalBest.reps} reps` : "Sin récord registrado"}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => handleRemoveExercise(exIndex)}>
                      <Ionicons name="trash-outline" size={22} color={colors.delete} />
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
                      <Text style={{ flex: 1, fontSize: 12, color: colors.textSecondary, fontWeight: "bold" }}>
                        SERIE
                      </Text>
                      <Text style={{ flex: 1, fontSize: 12, color: colors.textSecondary, fontWeight: "bold" }}>
                        PESO ({userSettings.unit.toUpperCase()})
                      </Text>
                      <Text style={{ flex: 1, fontSize: 12, color: colors.textSecondary, fontWeight: "bold" }}>
                        REPETICIONES
                      </Text>
                      <View style={{ width: 30 }} />
                    </View>
                  )}

                  {/* Completed Sets List */}
                  {item.sets.map((set, setIndex) => (
                    <View
                      key={setIndex}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: colors.background,
                        padding: 10,
                        borderRadius: 8,
                        marginBottom: 6,
                      }}
                    >
                      <Text style={{ flex: 1, fontWeight: "bold", color: colors.text }}>
                        Serie {setIndex + 1}
                      </Text>
                      <Text style={{ flex: 1, color: colors.primary, fontWeight: "bold" }}>
                        {formatWeightText(set.peso, userSettings.unit)}
                      </Text>
                      <Text style={{ flex: 1, color: colors.text }}>
                        {set.reps} reps
                      </Text>
                      <TouchableOpacity onPress={() => handleRemoveSet(exIndex, setIndex)}>
                        <Ionicons name="close-circle" size={20} color={colors.delete} />
                      </TouchableOpacity>
                    </View>
                  ))}

                  {/* Form to Add Set */}
                  <View
                    style={{
                      gap: 10,
                      marginTop: 10,
                      paddingTop: 12,
                      borderTopWidth: 1,
                      borderTopColor: colors.background,
                    }}
                  >
                    {/* Stepper Peso */}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: "bold" }}>
                        PESO ({userSettings.unit.toUpperCase()})
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <TouchableOpacity
                          onPress={() => {
                            const currentPeso = parseFloat(inputVal.peso) || 0;
                            const nextPeso = Math.max(0, Math.round((currentPeso - userSettings.weightIncrement) * 10) / 10);
                            setInputs((prev) => ({
                              ...prev,
                              [exIndex]: { ...inputVal, peso: nextPeso.toString() },
                            }));
                          }}
                        >
                          <Ionicons name="remove-circle" size={30} color={colors.primary} />
                        </TouchableOpacity>

                        <TextInput
                          style={[
                            globalStyles.input,
                            {
                              marginTop: 0,
                              height: 40,
                              width: 85,
                              paddingHorizontal: 5,
                              textAlign: "center",
                              fontSize: 16,
                              fontWeight: "bold",
                            },
                          ]}
                          keyboardType="numeric"
                          selectTextOnFocus={true}
                          value={inputVal.peso}
                          onChangeText={(val) =>
                            setInputs((prev) => ({
                              ...prev,
                              [exIndex]: { ...inputVal, peso: val },
                            }))
                          }
                        />

                        <TouchableOpacity
                          onPress={() => {
                            const currentPeso = parseFloat(inputVal.peso) || 0;
                            const nextPeso = Math.round((currentPeso + userSettings.weightIncrement) * 10) / 10;
                            setInputs((prev) => ({
                              ...prev,
                              [exIndex]: { ...inputVal, peso: nextPeso.toString() },
                            }));
                          }}
                        >
                          <Ionicons name="add-circle" size={30} color={colors.primary} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Stepper Reps */}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: "bold" }}>
                        REPETICIONES
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <TouchableOpacity
                          onPress={() => {
                            const currentReps = parseInt(inputVal.reps) || 0;
                            const nextReps = Math.max(1, currentReps - 1);
                            setInputs((prev) => ({
                              ...prev,
                              [exIndex]: { ...inputVal, reps: nextReps.toString() },
                            }));
                          }}
                        >
                          <Ionicons name="remove-circle" size={30} color={colors.primary} />
                        </TouchableOpacity>

                        <TextInput
                          style={[
                            globalStyles.input,
                            {
                              marginTop: 0,
                              height: 40,
                              width: 85,
                              paddingHorizontal: 5,
                              textAlign: "center",
                              fontSize: 16,
                              fontWeight: "bold",
                            },
                          ]}
                          keyboardType="numeric"
                          selectTextOnFocus={true}
                          value={inputVal.reps}
                          onChangeText={(val) =>
                            setInputs((prev) => ({
                              ...prev,
                              [exIndex]: { ...inputVal, reps: val },
                            }))
                          }
                        />

                        <TouchableOpacity
                          onPress={() => {
                            const currentReps = parseInt(inputVal.reps) || 0;
                            const nextReps = currentReps + 1;
                            setInputs((prev) => ({
                              ...prev,
                              [exIndex]: { ...inputVal, reps: nextReps.toString() },
                            }));
                          }}
                        >
                          <Ionicons name="add-circle" size={30} color={colors.primary} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Botón Añadir Serie */}
                    <TouchableOpacity
                      onPress={() => handleAddSet(exIndex)}
                      style={{
                        backgroundColor: colors.primary,
                        height: 42,
                        borderRadius: 10,
                        justifyContent: "center",
                        alignItems: "center",
                        marginTop: 4,
                      }}
                    >
                      <Text style={{ color: colors.background, fontWeight: "bold", fontSize: 14 }}>
                        + Registrar Serie
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}

          {/* Action Buttons */}
          <TouchableOpacity
            style={[
              globalStyles.button,
              {
                backgroundColor: colors.surface,
                borderColor: colors.primary,
                borderWidth: 1.5,
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
                marginVertical: 10,
              },
            ]}
            onPress={() => setIsPickerVisible(true)}
          >
            <Ionicons name="add-circle" size={22} color={colors.primary} />
            <Text style={[globalStyles.buttonText, { color: colors.primary }]}>
              + Agregar Ejercicio
            </Text>
          </TouchableOpacity>

          {activeExercises.length > 0 && (
            <TouchableOpacity
              style={[
                globalStyles.button,
                {
                  backgroundColor: colors.primary,
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 40,
                },
              ]}
              onPress={handleFinishWorkout}
            >
              <Ionicons name="checkmark-circle" size={22} color={colors.background} />
              <Text style={[globalStyles.buttonText, { color: colors.background }]}>
                Finalizar Entrenamiento
              </Text>
            </TouchableOpacity>
          )}
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

            {/* Botón: Crear Ejercicio Personalizado */}
            <TouchableOpacity
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.primary,
                borderWidth: 1.5,
                borderRadius: 12,
                paddingVertical: 12,
                paddingHorizontal: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginBottom: 12,
              }}
              onPress={() => {
                setIsPickerVisible(false);
                router.push("/exercises/add" as any);
              }}
            >
              <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: "bold", fontSize: 14 }}>
                + Crear Ejercicio Personalizado
              </Text>
            </TouchableOpacity>

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
                  )
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
                  (e) => e.exerciseInfo.id === exercise.id
                );
                return (
                  <View
                    key={exercise.id}
                    style={[
                      globalStyles.card,
                      {
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        opacity: isAlreadyAdded ? 0.6 : 1,
                        paddingRight: 10,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={{ flexDirection: "row", gap: 15, alignItems: "center", flex: 1 }}
                      activeOpacity={0.7}
                      onPress={() => {
                        setIsPickerVisible(false);
                        router.push(`/exercises/DetailsExercise/${exercise.id}` as any);
                      }}
                    >
                      <Image
                        source={getExerciseImage(exercise.id, exercise.urlimage)}
                        style={{ width: 50, height: 50, borderRadius: 8 }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={globalStyles.cardTitle}>
                          {exercise.nombre}
                        </Text>
                        <Text style={globalStyles.cardText}>
                          {exercise.musculo} • {exercise.equipamiento}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      disabled={isAlreadyAdded}
                      onPress={() => handleAddExerciseToWorkout(exercise)}
                      style={{ padding: 8 }}
                    >
                      <Ionicons
                        name={
                          isAlreadyAdded
                            ? "checkmark-circle"
                            : "add-circle-outline"
                        }
                        size={30}
                        color={isAlreadyAdded ? colors.primary : colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}
