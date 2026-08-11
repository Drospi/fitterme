import ExerciseItem from "@/components/ExcerciseItem";
import { useTheme } from "@/context/ThemeContext";
import {
  formatWeightText,
  getSettings,
  toDisplayWeight,
  toStoredKg,
  UserSettings,
} from "@/store/conf";
import { getExerciseIdByExerciseName } from "@/store/excercise";
import {
  addExerciseLog,
  ExerciseSet,
  getPersonalBest,
} from "@/store/historyExcercise";
import { addRoutineSession } from "@/store/historyRoutine";
import { getRoutineById } from "@/store/routines";
import { getGlobalStyles } from "@/styles/global";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import Toast from "react-native-toast-message";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ExcerciseCompleted from "./ExcerciseCompleted";
import RoutineCompleted from "./RoutineCompleted";

const PlayRoutineScreen = () => {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const { id } = useLocalSearchParams<{ id: string }>();

  const [userSettings, setUserSettings] = useState<UserSettings>({
    unit: "kg",
    weightIncrement: 2.5,
    defaultRestTimer: 90,
  });

  const [routineData, setRoutineData] = useState({
    id: "",
    name: "",
    category: "",
    exercises: [] as Array<{
      id: number;
      nombre: string;
      musculo: string;
      objetivo: string;
      equipamiento: string;
      urlimage?: string;
      series: number;
      reps: number;
      peso?: number;
    }>,
  });

  const [seriesCompletadas, setSeriesCompletadas] = useState<ExerciseSet[]>([]);
  const [personalBest, setPersonalBest] = useState<{
    peso: number;
    reps: number;
  } | null>(null);

  const [serieActual, setSerieActual] = useState(0);
  const [ejercicioActual, setEjercicioActual] = useState(0);

  const [mejorRepEjercicio, setMejorRepEjercicio] = useState(0);
  const [mejorPesoEjercicio, setMejorPesoEjercicio] = useState(0);

  const [performedSets, setPerformedSets] = useState<
    Record<number, Array<{ reps: number; peso: number }>>
  >({});

  const [totalTonelaje, setTotalTonelaje] = useState(0);
  const [totalSeries, setTotalSeries] = useState(0);

  const [timer, setTimer] = useState(1);
  const [isActiveTimer, setIsActiveTimer] = useState(true);
  const [isRoutineCompleted, setIsRoutineCompleted] = useState(false);

  const [repActual, setRepActual] = useState(0);
  const [pesoActual, setPesoActual] = useState(0);

  const loadRoutine = async () => {
    const data = await getRoutineById(id);
    setRoutineData(data);
  };

  useFocusEffect(
    useCallback(() => {
      getSettings().then((s) => setUserSettings(s));
      loadRoutine();
    }, [id])
  );

  useEffect(() => {
    let interval: any = null;

    if (isActiveTimer && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } else if (timer === 0) {
      clearInterval(interval);
      setIsActiveTimer(false);
    }

    return () => clearInterval(interval);
  }, [isActiveTimer, timer]);

  useEffect(() => {
    const loadPR = async () => {
      const ejercicio = routineData.exercises[ejercicioActual];
      if (ejercicio) {
        setRepActual(ejercicio.reps ?? 10);
        const initialWeightKg = ejercicio.peso ?? 10;
        setPesoActual(toDisplayWeight(initialWeightKg, userSettings.unit));

        const pb = await getPersonalBest(ejercicio.id);
        setPersonalBest(pb);
      }
    };

    loadPR();
  }, [routineData, ejercicioActual, userSettings.unit]);

  const [newRecordsCount, setNewRecordsCount] = useState(0);

  const handleNextExercise = async () => {
    if (seriesCompletadas.length > 0) {
      const currentExerciseName = routineData.exercises[ejercicioActual].nombre;
      const currentExerciseId =
        await getExerciseIdByExerciseName(currentExerciseName);
      if (currentExerciseId !== null) {
        // Verificar si se logro un nuevo récord en este ejercicio
        const isNewPR = seriesCompletadas.some((set) => {
          if (!personalBest) return true;
          return (
            set.peso > personalBest.peso ||
            (set.peso === personalBest.peso && set.reps > personalBest.reps)
          );
        });

        if (isNewPR) {
          setNewRecordsCount((prev) => prev + 1);
        }

        await addExerciseLog(currentExerciseId, seriesCompletadas);
      }
    }

    setSeriesCompletadas([]);

    if (ejercicioActual < routineData.exercises.length - 1) {
      setEjercicioActual((prev) => prev + 1);
      setSerieActual(0);
      setMejorRepEjercicio(0);
      setMejorPesoEjercicio(0);
    } else {
      setIsActiveTimer(false);
      setIsRoutineCompleted(true);
      handleFinishRoutine();
    }
  };

  const handleFinishRoutine = async () => {
    const sessionData = {
      name: routineData.name,
      duration: timer,
      totalVolume: totalTonelaje,
      exercises: routineData.exercises.map((ex) => ({
        exerciseName: ex.nombre,
        sets: performedSets[ex.id] || [],
      })),
    };

    await addRoutineSession(sessionData);
  };

  const handleCompleteSerie = () => {
    // Convertir peso ingresado a KG para almacenamiento consistente
    const weightInKg = toStoredKg(pesoActual, userSettings.unit);

    setSeriesCompletadas((prev) => [
      ...prev,
      { reps: repActual, peso: weightInKg },
    ]);
    const currentExercise = routineData.exercises[ejercicioActual];
    const newSet = { reps: repActual, peso: weightInKg };
    setPerformedSets((prev) => ({
      ...prev,
      [currentExercise.id]: [...(prev[currentExercise.id] || []), newSet],
    }));
    setSerieActual((prev) => prev + 1);
    setTotalTonelaje((prev) => prev + weightInKg * repActual);
    setTotalSeries((prev) => prev + 1);

    if (
      weightInKg > mejorPesoEjercicio ||
      (weightInKg === mejorPesoEjercicio && repActual > mejorRepEjercicio)
    ) {
      setMejorPesoEjercicio(weightInKg);
      setMejorRepEjercicio(repActual);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSkipSerie = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSerieActual((prev) => prev + 1);
    Toast.show({
      type: "info",
      text1: "Serie Omitida",
      text2: `Serie ${serieActual + 1} de ${routineData.exercises[ejercicioActual].nombre} fue omitida.`,
    });
  };

  const handleSkipExercise = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const skippedName = routineData.exercises[ejercicioActual]?.nombre || "Ejercicio";

    setSeriesCompletadas([]);

    if (ejercicioActual < routineData.exercises.length - 1) {
      setEjercicioActual((prev) => prev + 1);
      setSerieActual(0);
      setMejorRepEjercicio(0);
      setMejorPesoEjercicio(0);
      Toast.show({
        type: "info",
        text1: "Ejercicio Omitido",
        text2: `${skippedName} fue omitido.`,
      });
    } else {
      setIsActiveTimer(false);
      setIsRoutineCompleted(true);
      handleFinishRoutine();
    }
  };

  const handleAddSerie = () => {
    const newExercises = [...routineData.exercises];
    newExercises[ejercicioActual] = {
      ...newExercises[ejercicioActual],
      series: (newExercises[ejercicioActual].series || 0) + 1,
    };

    setRoutineData({
      ...routineData,
      exercises: newExercises,
    });
  };

  const handleMoveUpcomingExercise = (upcomingIndex: number, direction: "up" | "down") => {
    const realIndex = ejercicioActual + 1 + upcomingIndex;
    const targetIndex = direction === "up" ? realIndex - 1 : realIndex + 1;

    if (targetIndex <= ejercicioActual || targetIndex >= routineData.exercises.length) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRoutineData((prev) => {
      const newExercises = [...prev.exercises];
      const temp = newExercises[realIndex];
      newExercises[realIndex] = newExercises[targetIndex];
      newExercises[targetIndex] = temp;
      return { ...prev, exercises: newExercises };
    });
  };

  const formatTime = (timer: number) => {
    return new Date(timer * 1000).toISOString().substr(11, 8);
  };

  if (routineData.id === "") {
    return (
      <View style={globalStyles.container}>
        <Text style={{ color: colors.text }}>Cargando rutina...</Text>
      </View>
    );
  }

  if (isRoutineCompleted) {
    return (
      <RoutineCompleted
        data={routineData}
        timer={timer}
        tonelaje={totalTonelaje}
        series={totalSeries}
        newRecordsCount={newRecordsCount}
      />
    );
  }

  if (serieActual >= routineData.exercises[ejercicioActual].series) {
    return (
      <ExcerciseCompleted
        next={handleNextExercise}
        data={routineData}
        addSerie={handleAddSerie}
        timer={timer}
        series={serieActual}
        excercise={ejercicioActual}
        mejorRepEjercicio={mejorRepEjercicio}
        mejorPesoEjercicio={mejorPesoEjercicio}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView
        style={globalStyles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 150 }}
      >
        <View style={globalStyles.header}>
          <View>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "bold",
                color: colors.primary,
                letterSpacing: 1,
              }}
            >
              ENTRENAMIENTO ACTIVO
            </Text>
            <Text style={globalStyles.title}>
              {routineData.name.length > 18
                ? routineData.name.slice(0, 18) + "..."
                : routineData.name}
            </Text>
          </View>
          <View
            style={[
              globalStyles.card,
              {
                alignItems: "center",
                borderRadius: 30,
                justifyContent: "center",
                paddingHorizontal: 16,
                paddingVertical: 8,
              },
            ]}
          >
            <Ionicons name="timer-outline" size={22} color={colors.primary} />
            <Text style={[globalStyles.title, { fontSize: 15, alignSelf: "center", marginTop: 2 }]}>
              {formatTime(timer)}
            </Text>
          </View>
        </View>

        <View style={globalStyles.card}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ gap: 8, marginBottom: 15 }}>
              <Text style={globalStyles.title}>
                {routineData.exercises[ejercicioActual].nombre}
              </Text>

              <Text style={globalStyles.textSecondary}>
                {routineData.exercises[ejercicioActual].objetivo} -{" "}
                {routineData.exercises[ejercicioActual].equipamiento}
              </Text>
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 8,
                  backgroundColor: colors.background,
                  alignSelf: "flex-start",
                }}
              >
                <Text style={{ color: colors.primary, fontWeight: "bold", fontSize: 12 }}>
                  {routineData.exercises[ejercicioActual].musculo.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          {/* Series Pointers */}
          <View style={{ gap: 10, alignItems: "flex-start", marginBottom: 15 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {Array.from({
                  length: routineData.exercises[ejercicioActual].series,
                }).map((_, i) => (
                  <View
                    key={i}
                    style={{
                      height: 44,
                      width: 44,
                      borderRadius: 22,
                      backgroundColor:
                        i === serieActual ? colors.primary : colors.background,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontWeight: "bold",
                        fontSize: 16,
                        color:
                          i === serieActual ? colors.background : colors.textSecondary,
                      }}
                    >
                      {i + 1}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
            <Text style={globalStyles.textSecondary}>
              Serie Actual: {serieActual + 1} /{" "}
              {routineData.exercises[ejercicioActual].series}
            </Text>
          </View>

          {/* Input Controls */}
          <View style={{ gap: 15, marginVertical: 10 }}>
            {/* Control Peso */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text style={globalStyles.cardText}>
                PESO ({userSettings.unit.toUpperCase()})
              </Text>

              <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                <TouchableOpacity
                  onPress={() =>
                    setPesoActual(
                      Math.max(0, Math.round((pesoActual - userSettings.weightIncrement) * 10) / 10)
                    )
                  }
                >
                  <Ionicons name="remove-circle" size={34} color={colors.primary} />
                </TouchableOpacity>

                <TextInput
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  selectTextOnFocus={true}
                  value={pesoActual.toString()}
                  style={[
                    globalStyles.input,
                    {
                      backgroundColor: colors.background,
                      textAlign: "center",
                      fontSize: 22,
                      fontWeight: "bold",
                      marginBottom: 0,
                      height: 48,
                      width: 110,
                    },
                  ]}
                  onChangeText={(text) => {
                    if (text === "") {
                      setPesoActual(0);
                    } else {
                      const parsed = parseFloat(text);
                      if (!isNaN(parsed)) setPesoActual(parsed);
                    }
                  }}
                />

                <TouchableOpacity
                  onPress={() =>
                    setPesoActual(
                      Math.round((pesoActual + userSettings.weightIncrement) * 10) / 10
                    )
                  }
                >
                  <Ionicons name="add-circle" size={34} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Control Reps */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text style={globalStyles.cardText}>REPETICIONES</Text>
              <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                <TouchableOpacity
                  onPress={() => setRepActual(Math.max(1, repActual - 1))}
                >
                  <Ionicons name="remove-circle" size={34} color={colors.primary} />
                </TouchableOpacity>

                <TextInput
                  placeholder="10"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  selectTextOnFocus={true}
                  value={repActual ? repActual.toString() : ""}
                  style={[
                    globalStyles.input,
                    {
                      backgroundColor: colors.background,
                      textAlign: "center",
                      fontSize: 22,
                      fontWeight: "bold",
                      marginBottom: 0,
                      height: 48,
                      width: 110,
                    },
                  ]}
                  onChangeText={(text) => {
                    if (text === "") {
                      setRepActual(0);
                    } else {
                      const parsed = parseInt(text, 10);
                      if (!isNaN(parsed)) setRepActual(parsed);
                    }
                  }}
                />

                <TouchableOpacity onPress={() => setRepActual(repActual + 1)}>
                  <Ionicons name="add-circle" size={34} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <Text style={[globalStyles.cardText, { marginTop: 10, color: colors.secondary, fontWeight: "600" }]}>
            🏆 Mejor serie:{" "}
            {personalBest
              ? formatWeightText(personalBest.peso, userSettings.unit) + ` x ${personalBest.reps} reps`
              : "Sin registro previo"}
          </Text>

          <TouchableOpacity
            style={[globalStyles.button, { marginTop: 15 }]}
            onPress={handleCompleteSerie}
          >
            <Text style={globalStyles.buttonText}>Completar Serie</Text>
          </TouchableOpacity>

          {/* Botones de Omitir / Saltar */}
          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderColor: colors.textSecondary + "40",
                borderWidth: 1,
                borderRadius: 10,
                paddingVertical: 10,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 6,
              }}
              onPress={handleSkipSerie}
            >
              <Ionicons name="play-skip-forward-outline" size={16} color={colors.textSecondary} />
              <Text style={{ color: colors.text, fontSize: 13, fontWeight: "600" }}>
                Saltar Serie
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderColor: colors.delete + "50",
                borderWidth: 1,
                borderRadius: 10,
                paddingVertical: 10,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 6,
              }}
              onPress={handleSkipExercise}
            >
              <Ionicons name="play-forward-outline" size={16} color={colors.delete} />
              <Text style={{ color: colors.delete, fontSize: 13, fontWeight: "600" }}>
                Saltar Ejercicio
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Próximos Ejercicios Reordenables */}
        {routineData.exercises.slice(ejercicioActual + 1).length > 0 && (
          <View style={[globalStyles.card, { marginTop: 20 }]}>
            <Text style={[globalStyles.title, { fontSize: 18, marginBottom: 12 }]}>
              Próximos Ejercicios ({routineData.exercises.length - (ejercicioActual + 1)})
            </Text>

            {routineData.exercises.slice(ejercicioActual + 1).map((ex, relIdx) => {
              const isFirst = relIdx === 0;
              const isLast =
                relIdx === routineData.exercises.slice(ejercicioActual + 1).length - 1;
              return (
                <View
                  key={ex.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 8,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <ExerciseItem
                      excerciseInfo={ex}
                      onCheck={() => {}}
                      isCheckedFather={false}
                    />
                  </View>

                  {/* Controles de Reordenamiento */}
                  <View style={{ flexDirection: "column", gap: 4 }}>
                    <TouchableOpacity
                      disabled={isFirst}
                      onPress={() => handleMoveUpcomingExercise(relIdx, "up")}
                      style={{
                        opacity: isFirst ? 0.3 : 1,
                        backgroundColor: colors.surface,
                        padding: 8,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: colors.primary + "40",
                      }}
                    >
                      <Ionicons name="chevron-up" size={18} color={colors.primary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      disabled={isLast}
                      onPress={() => handleMoveUpcomingExercise(relIdx, "down")}
                      style={{
                        opacity: isLast ? 0.3 : 1,
                        backgroundColor: colors.surface,
                        padding: 8,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: colors.primary + "40",
                      }}
                    >
                      <Ionicons name="chevron-down" size={18} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default PlayRoutineScreen;
