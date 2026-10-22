import ExerciseItem from "@/components/ExcerciseItem";
import InlineRestTimer from "@/components/InlineRestTimer";
import { useActiveWorkout } from "@/context/ActiveWorkoutContext";
import { useTheme } from "@/context/ThemeContext";
import { cancelAllRestTimerNotifications } from "@/store/notificationsConfig";
import {
  convertWeightToggle,
  formatWeightText,
  getSettings,
  toDisplayWeight,
  toStoredKg,
  UserSettings,
  WeightUnit,
} from "@/store/conf";
import {
  getExerciseIdByExerciseName,
  getExerciseCategory,
  isBodyweightExercise,
  isCardioExercise,
} from "@/store/excercise";
import {
  addExerciseLog,
  ExerciseHistory,
  ExerciseSet,
  getHistoryByExerciseId,
  getPersonalBest,
  isBetterSet,
} from "@/store/historyExcercise";
import { addRoutineSession } from "@/store/historyRoutine";
import ThemeConfirmModal from "@/components/ThemeConfirmModal";
import CoachRIRModal from "@/components/CoachRIRModal";
import { calculateRIRPrescription } from "@/utils/rirCoachCalculator";
import { getRoutineById } from "@/store/routines";
import { getGlobalStyles } from "@/styles/global";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import ExcerciseCompleted from "./ExcerciseCompleted";
import RoutineCompleted from "./RoutineCompleted";

const MOTIVATIONAL_MESSAGES = [
  "«El dolor que sientes hoy es la fuerza que sentirás mañana. ¡Cada repetición te acerca a tu mejor versión!» 💪",
  "«Los resultados no vienen de lo que haces de vez en cuando, sino de lo que haces con constancia. ¡Tú puedes dar una serie más!» 🔥",
  "«La disciplina es el puente entre tus metas y tus logros. ¡No bajes los brazos ahora!» ⚡",
  "«El único entrenamiento fallido es el que se abandona. ¡Demuéstrate de qué estás hecho!» 🦁",
];

const PlayRoutineScreen = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeWorkout, startActiveWorkout, finishActiveWorkout } = useActiveWorkout();

  const startTimeRef = useRef<number>(activeWorkout?.startTime || Date.now());

  const [showGiveUpModal, setShowGiveUpModal] = useState<boolean>(false);
  const [motivationalMessage, setMotivationalMessage] = useState<string>(MOTIVATIONAL_MESSAGES[0]);

  const handlePromptGiveUp = () => {
    const randomMsg =
      MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];
    setMotivationalMessage(randomMsg);
    setShowGiveUpModal(true);
  };

  const handleConfirmGiveUp = async () => {
    setShowGiveUpModal(false);
    finishActiveWorkout();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    if (totalSeries === 0) {
      Toast.show({
        type: "info",
        text1: "Entrenamiento cancelado",
        text2: "No se guardó nada ya que no completaste series. ¡A por la próxima!",
      });
      router.replace("/(tabs)" as any);
    } else {
      await handleFinishRoutine();
      setIsRoutineCompleted(true);
    }
  };

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
    timeMinutes?: number;
    intensity?: string;
  } | null>(null);
  const [lastSession, setLastSession] = useState<ExerciseHistory | null>(null);
  const [showCoachModal, setShowCoachModal] = useState<boolean>(false);

  const [inputUnit, setInputUnit] = useState<WeightUnit>("kg");
  const [activeRestTimer, setActiveRestTimer] = useState<{
    duration: number;
    startTime: number;
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

  const [timer, setTimer] = useState(0);
  const [isRoutineCompleted, setIsRoutineCompleted] = useState(false);

  const [repActual, setRepActual] = useState(0);
  const [pesoActual, setPesoActual] = useState(0);
  const [bodyweightMode, setBodyweightMode] = useState<"solo" | "lastre" | "ayuda">("solo");

  const loadRoutine = async () => {
    const data = await getRoutineById(id);
    setRoutineData(data);
    if (data && data.name) {
      startActiveWorkout({
        routineId: String(data.id),
        routineName: data.name,
        workoutType: "predefined",
        routePath: `/routines/PlayRoutine/${id}`,
        startTime: activeWorkout?.startTime || startTimeRef.current,
      });
    }
  };

  useFocusEffect(
    useCallback(() => {
      getSettings().then((s) => {
        setUserSettings(s);
        setInputUnit(s.unit);
      });
      loadRoutine();
    }, [id])
  );

  // Temporizador basado en la hora del teléfono (Date.now()) continuo sin reinicio
  useEffect(() => {
    const startMs = activeWorkout?.startTime || startTimeRef.current;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startMs) / 1000);
      setTimer(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeWorkout?.startTime]);

  const inputUnitRef = useRef(inputUnit);
  inputUnitRef.current = inputUnit;

  const handleApplyCoachOption = (
    optionType: "A" | "topSet" | "backOff" | "cardio" | "sameWeight",
    appliedUnit?: WeightUnit
  ) => {
    const ejercicio = routineData?.exercises?.[ejercicioActual];
    if (!ejercicio) return;

    // Si la medida está en kg o lb y el selector está en la otra unidad,
    // cambiamos primero el selector a esa unidad
    const unitToApply: WeightUnit = appliedUnit || inputUnit;
    if (unitToApply !== inputUnit) {
      setInputUnit(unitToApply);
    }

    const presc = calculateRIRPrescription(
      ejercicio,
      lastSession,
      personalBest,
      unitToApply
    );

    const isBodyweight = getExerciseCategory(ejercicio) === "Peso corporal";
    let targetWeight = 0;
    let targetReps = 10;

    if (optionType === "A") {
      targetWeight = presc.optionA.targetWeightDisplay;
      targetReps = presc.optionA.targetReps;
    } else if (optionType === "sameWeight" && presc.sameWeightOption) {
      targetWeight = presc.sameWeightOption.targetWeightDisplay;
      targetReps = presc.sameWeightOption.targetReps;
    } else if (optionType === "topSet" && presc.optionB.topSet) {
      targetWeight = presc.optionB.topSet.weightDisplay;
      targetReps = presc.optionB.topSet.reps;
    } else if (optionType === "backOff" && presc.optionB.backOffSet) {
      targetWeight = presc.optionB.backOffSet.weightDisplay;
      targetReps = presc.optionB.backOffSet.reps;
    }

    setPesoActual(targetWeight);
    setRepActual(targetReps);

    if (isBodyweight) {
      if (targetWeight > 0) setBodyweightMode("lastre");
      else if (targetWeight < 0) setBodyweightMode("ayuda");
      else setBodyweightMode("solo");
    }
  };

  useEffect(() => {
    const loadPR = async () => {
      const ejercicio = routineData?.exercises?.[ejercicioActual];
      if (ejercicio) {
        const [pb, history] = await Promise.all([
          getPersonalBest(ejercicio.id),
          getHistoryByExerciseId(ejercicio.id),
        ]);
        setPersonalBest(pb);
        const latestHistory = history && history.length > 0 ? history[0] : null;
        setLastSession(latestHistory);

        const isBodyweight = getExerciseCategory(ejercicio) === "Peso corporal";
        const unit = inputUnitRef.current;
        const presc = calculateRIRPrescription(ejercicio, latestHistory, pb, unit);

        if (isBodyweight) {
          setRepActual(pb?.reps || ejercicio.reps || 10);
          if (pb && pb.peso < 0) {
            setBodyweightMode("ayuda");
            setPesoActual(
              unit === "lb"
                ? convertWeightToggle(pb.peso, "lb")
                : toDisplayWeight(pb.peso, unit)
            );
          } else if (pb && pb.peso > 0) {
            setBodyweightMode("lastre");
            setPesoActual(
              unit === "lb"
                ? convertWeightToggle(pb.peso, "lb")
                : toDisplayWeight(pb.peso, unit)
            );
          } else {
            setBodyweightMode("solo");
            setPesoActual(0);
          }
        } else if (presc.category === "Gym" && presc.optionA.targetWeightDisplay > 0) {
          // Pre-llenar con la sugerencia inteligente del Coach RIR
          setRepActual(presc.optionA.targetReps);
          setPesoActual(presc.optionA.targetWeightDisplay);
        } else if (pb && pb.peso > 0) {
          setRepActual(pb.reps || 10);
          setPesoActual(
            unit === "lb"
              ? convertWeightToggle(pb.peso, "lb")
              : toDisplayWeight(pb.peso, unit)
          );
        } else {
          setRepActual(ejercicio.reps ?? 10);
          const initialWeightKg = ejercicio.peso ?? 10;
          setPesoActual(
            unit === "lb"
              ? convertWeightToggle(initialWeightKg, "lb")
              : toDisplayWeight(initialWeightKg, unit)
          );
        }
      }
    };

    loadPR();
  }, [routineData, ejercicioActual]);

  const [newRecordsCount, setNewRecordsCount] = useState(0);

  const handleNextExercise = async () => {
    cancelAllRestTimerNotifications();
    setActiveRestTimer(null);
    if (seriesCompletadas.length > 0) {
      const currentExerciseName = routineData.exercises[ejercicioActual].nombre;
      const currentExerciseId =
        await getExerciseIdByExerciseName(currentExerciseName);
      if (currentExerciseId !== null) {
        // Verificar si se logro un nuevo récord en este ejercicio con lógica 1RM
        const isNewPR = seriesCompletadas.some((set) => {
          if (!personalBest) return true;
          return isBetterSet(set, personalBest);
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
      setIsRoutineCompleted(true);
      handleFinishRoutine();
    }
  };

  const handleFinishRoutine = async () => {
    cancelAllRestTimerNotifications();
    setActiveRestTimer(null);
    const sessionData = {
      name: routineData.name,
      duration: timer,
      totalVolume: totalTonelaje,
      exercises: routineData.exercises.map((ex) => ({
        exerciseName: ex.nombre,
        sets: performedSets[ex.id] || [],
      })),
    };
    finishActiveWorkout();
    await addRoutineSession(sessionData);
  };

  const handleCompleteSerie = async () => {
    const isCurrentBodyweight = routineData.exercises[ejercicioActual]
      ? isBodyweightExercise(routineData.exercises[ejercicioActual])
      : false;

    let weightInKg = 0;
    if (isCurrentBodyweight) {
      if (bodyweightMode === "solo") {
        weightInKg = 0;
      } else if (bodyweightMode === "lastre") {
        const absP = Math.abs(pesoActual);
        weightInKg = inputUnit === "lb" ? toStoredKg(absP, "lb") : absP;
      } else {
        const absP = Math.abs(pesoActual) || (inputUnit === "lb" ? 10 : 5);
        const stored = inputUnit === "lb" ? toStoredKg(absP, "lb") : absP;
        weightInKg = -stored;
      }
    } else {
      weightInKg = inputUnit === "lb" ? toStoredKg(pesoActual, "lb") : pesoActual;
    }

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
    setTotalTonelaje((prev) => prev + (weightInKg > 0 ? weightInKg * repActual : 0));
    setTotalSeries((prev) => prev + 1);

    const currentBest = { peso: mejorPesoEjercicio, reps: mejorRepEjercicio };
    if (isBetterSet({ peso: weightInKg, reps: repActual }, currentBest)) {
      setMejorPesoEjercicio(weightInKg);
      setMejorRepEjercicio(repActual);
    }

    cancelAllRestTimerNotifications();

    const isCurrentCardio = routineData.exercises[ejercicioActual]
      ? isCardioExercise(routineData.exercises[ejercicioActual])
      : false;

    if (!isCurrentCardio && serieActual + 1 < routineData.exercises[ejercicioActual].series) {
      const freshSettings = await getSettings();
      setUserSettings(freshSettings);
      const restDuration = freshSettings.defaultRestTimer || userSettings.defaultRestTimer || 90;
      setActiveRestTimer({
        duration: restDuration,
        startTime: Date.now(),
      });
    } else {
      setActiveRestTimer(null);
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSkipSerie = () => {
    cancelAllRestTimerNotifications();
    setActiveRestTimer(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSerieActual((prev) => prev + 1);
    Toast.show({
      type: "info",
      text1: "Serie Omitida",
      text2: `Serie ${serieActual + 1} de ${routineData.exercises[ejercicioActual].nombre} fue omitida.`,
    });
  };

  const handleSkipExercise = () => {
    cancelAllRestTimerNotifications();
    setActiveRestTimer(null);
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
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "bold",
                color: colors.primary,
                letterSpacing: 1,
              }}
            >
              ENTRENAMIENTO ACTIVO
            </Text>
            <Text style={globalStyles.title} numberOfLines={1}>
              {routineData.name}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View
              style={[
                globalStyles.card,
                {
                  alignItems: "center",
                  borderRadius: 30,
                  justifyContent: "center",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                },
              ]}
            >
              <Ionicons name="timer-outline" size={18} color={colors.primary} />
              <Text style={[globalStyles.title, { fontSize: 13, alignSelf: "center", marginTop: 2 }]}>
                {formatTime(timer)}
              </Text>
            </View>

            {/* Botón pequeño para finalizar en el Header */}
            <TouchableOpacity
              onPress={handlePromptGiveUp}
              style={{
                backgroundColor: colors.delete + "18",
                borderColor: colors.delete + "35",
                borderWidth: 1,
                paddingHorizontal: 10,
                paddingVertical: 7,
                borderRadius: 20,
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="flag-outline" size={13} color={colors.delete} />
              <Text style={{ fontSize: 11, fontWeight: "bold", color: colors.delete }}>
                Finalizar
              </Text>
            </TouchableOpacity>
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
          {(() => {
            const isCurrentBodyweight = routineData.exercises[ejercicioActual]
              ? isBodyweightExercise(routineData.exercises[ejercicioActual])
              : false;

            return (
              <View style={{ gap: 14, marginVertical: 10 }}>
                {/* SI ES PESO CORPORAL: Selector de Modo y Carga en línea separada ("enter") */}
                {isCurrentBodyweight ? (
                  <View style={{ gap: 10 }}>
                    {/* Fila Superior: Título y Segmented Control de Modo */}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 8,
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Ionicons name="body" size={15} color={colors.primary} />
                        <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: "bold", letterSpacing: 0.5 }}>
                          PESO CORPORAL
                        </Text>
                      </View>

                      {/* Modos: Solo cuerpo / + Lastre / - Con Ayuda */}
                      <View
                        style={{
                          flexDirection: "row",
                          backgroundColor: colors.background,
                          borderRadius: 10,
                          padding: 2,
                          borderWidth: 1,
                          borderColor: colors.primary + "25",
                        }}
                      >
                        <TouchableOpacity
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setBodyweightMode("solo");
                            setPesoActual(0);
                          }}
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 5,
                            borderRadius: 8,
                            backgroundColor: bodyweightMode === "solo" ? colors.primary : "transparent",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: "bold",
                              color: bodyweightMode === "solo" ? colors.background : colors.textSecondary,
                            }}
                          >
                            Solo cuerpo
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setBodyweightMode("lastre");
                            if (pesoActual <= 0) setPesoActual(inputUnit === "lb" ? 10 : 2.5);
                          }}
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 5,
                            borderRadius: 8,
                            backgroundColor: bodyweightMode === "lastre" ? colors.primary : "transparent",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: "bold",
                              color: bodyweightMode === "lastre" ? colors.background : colors.textSecondary,
                            }}
                          >
                            + Lastre
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setBodyweightMode("ayuda");
                            if (pesoActual >= 0) setPesoActual(inputUnit === "lb" ? -10 : -5);
                          }}
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 5,
                            borderRadius: 8,
                            backgroundColor: bodyweightMode === "ayuda" ? colors.primary : "transparent",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: "bold",
                              color: bodyweightMode === "ayuda" ? colors.background : colors.textSecondary,
                            }}
                          >
                            - Con Ayuda
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Fila Inferior ("abajo / enter"): Control de peso según el modo */}
                    {bodyweightMode === "solo" ? (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          backgroundColor: colors.background,
                          paddingVertical: 10,
                          paddingHorizontal: 14,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: colors.primary + "20",
                        }}
                      >
                        <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: "600" }}>
                          Solo peso corporal (sin peso adicional ni asistencia)
                        </Text>
                        <Text style={{ fontSize: 14, fontWeight: "bold", color: colors.primary }}>
                          0 {inputUnit.toUpperCase()}
                        </Text>
                      </View>
                    ) : (
                      <View style={{ gap: 8 }}>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          {/* Label del modo y selector KG / LB */}
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: "bold" }}>
                              {bodyweightMode === "lastre" ? "CARGA ADICIONAL" : "PESO DE ASISTENCIA"}
                            </Text>

                            <View
                              style={{
                                flexDirection: "row",
                                backgroundColor: colors.background,
                                borderRadius: 8,
                                padding: 2,
                                borderWidth: 1,
                                borderColor: colors.primary + "30",
                              }}
                            >
                              <TouchableOpacity
                                onPress={() => {
                                  if (inputUnit === "kg") return;
                                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                  const converted = convertWeightToggle(pesoActual, "kg");
                                  setInputUnit("kg");
                                  setPesoActual(converted);
                                }}
                                style={{
                                  paddingHorizontal: 8,
                                  paddingVertical: 3,
                                  borderRadius: 6,
                                  backgroundColor: inputUnit === "kg" ? colors.primary : "transparent",
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: 11,
                                    fontWeight: "bold",
                                    color: inputUnit === "kg" ? colors.background : colors.textSecondary,
                                  }}
                                >
                                  KG
                                </Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                onPress={() => {
                                  if (inputUnit === "lb") return;
                                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                  const converted = convertWeightToggle(pesoActual, "lb");
                                  setInputUnit("lb");
                                  setPesoActual(converted);
                                }}
                                style={{
                                  paddingHorizontal: 8,
                                  paddingVertical: 3,
                                  borderRadius: 6,
                                  backgroundColor: inputUnit === "lb" ? colors.primary : "transparent",
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: 11,
                                    fontWeight: "bold",
                                    color: inputUnit === "lb" ? colors.background : colors.textSecondary,
                                  }}
                                >
                                  LB
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>

                          {/* Stepper Peso para Lastre o Ayuda */}
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            <TouchableOpacity
                              onPress={() => {
                                const step = inputUnit === "lb" ? 5 : userSettings.weightIncrement;
                                if (bodyweightMode === "lastre") {
                                  setPesoActual(Math.max(0, Math.round((Math.abs(pesoActual) - step) * 10) / 10));
                                } else {
                                  const cur = Math.abs(pesoActual);
                                  const nextVal = Math.max(0, Math.round((cur - step) * 10) / 10);
                                  setPesoActual(-nextVal);
                                }
                              }}
                            >
                              <Ionicons name="remove-circle" size={30} color={colors.primary} />
                            </TouchableOpacity>

                            <TextInput
                              editable={false}
                              value={
                                bodyweightMode === "lastre"
                                  ? `+${Math.abs(pesoActual)}`
                                  : `-${Math.abs(pesoActual)}`
                              }
                              style={[
                                globalStyles.input,
                                {
                                  marginTop: 0,
                                  marginBottom: 0,
                                  minHeight: 42,
                                  width: 85,
                                  paddingHorizontal: 5,
                                  textAlign: "center",
                                  fontSize: 17,
                                  fontWeight: "bold",
                                  color: colors.text,
                                  backgroundColor: colors.background,
                                },
                              ]}
                            />

                            <TouchableOpacity
                              onPress={() => {
                                const step = inputUnit === "lb" ? 5 : userSettings.weightIncrement;
                                if (bodyweightMode === "lastre") {
                                  setPesoActual(Math.round((Math.abs(pesoActual) + step) * 10) / 10);
                                } else {
                                  const cur = Math.abs(pesoActual);
                                  const nextVal = Math.round((cur + step) * 10) / 10;
                                  setPesoActual(-nextVal);
                                }
                              }}
                            >
                              <Ionicons name="add-circle" size={30} color={colors.primary} />
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* Presets rápidos */}
                        <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                          {(bodyweightMode === "lastre"
                            ? [
                                { label: "+2.5", val: 2.5 },
                                { label: "+5", val: 5 },
                                { label: "+10", val: 10 },
                                { label: "+15", val: 15 },
                              ]
                            : [
                                { label: "5 kg ayuda", val: -5 },
                                { label: "10 kg ayuda", val: -10 },
                                { label: "15 kg ayuda", val: -15 },
                                { label: "20 kg ayuda", val: -20 },
                              ]
                          ).map((chip) => {
                            const isChipActive = pesoActual === chip.val;
                            return (
                              <TouchableOpacity
                                key={chip.label}
                                onPress={() => {
                                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                  setPesoActual(chip.val);
                                }}
                                style={{
                                  paddingHorizontal: 10,
                                  paddingVertical: 5,
                                  borderRadius: 10,
                                  backgroundColor: isChipActive ? colors.primary : colors.surface,
                                  borderWidth: 1,
                                  borderColor: colors.primary + "30",
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: 11,
                                    fontWeight: "bold",
                                    color: isChipActive ? colors.background : colors.text,
                                  }}
                                >
                                  {chip.label}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    )}
                  </View>
                ) : (
                  /* EJERCICIO GYM / FUERZA CONVENCIONAL */
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: "bold" }}>
                        PESO
                      </Text>
                      {/* Selector de Unidad KG / LB */}
                      <View
                        style={{
                          flexDirection: "row",
                          backgroundColor: colors.background,
                          borderRadius: 8,
                          padding: 2,
                          borderWidth: 1,
                          borderColor: colors.primary + "30",
                        }}
                      >
                        <TouchableOpacity
                          onPress={() => {
                            if (inputUnit === "kg") return;
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            const converted = convertWeightToggle(pesoActual, "kg");
                            setInputUnit("kg");
                            setPesoActual(converted);
                          }}
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 6,
                            backgroundColor: inputUnit === "kg" ? colors.primary : "transparent",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: "bold",
                              color: inputUnit === "kg" ? colors.background : colors.textSecondary,
                            }}
                          >
                            KG
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => {
                            if (inputUnit === "lb") return;
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            const converted = convertWeightToggle(pesoActual, "lb");
                            setInputUnit("lb");
                            setPesoActual(converted);
                          }}
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 6,
                            backgroundColor: inputUnit === "lb" ? colors.primary : "transparent",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: "bold",
                              color: inputUnit === "lb" ? colors.background : colors.textSecondary,
                            }}
                          >
                            LB
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <TouchableOpacity
                        onPress={() => {
                          const step = inputUnit === "lb" ? 5 : userSettings.weightIncrement;
                          setPesoActual(
                            Math.max(0, Math.round((pesoActual - step) * 10) / 10)
                          );
                        }}
                      >
                        <Ionicons name="remove-circle" size={30} color={colors.primary} />
                      </TouchableOpacity>

                      <TextInput
                        editable={false}
                        value={pesoActual.toString()}
                        style={[
                          globalStyles.input,
                          {
                            marginTop: 0,
                            marginBottom: 0,
                            minHeight: 42,
                            width: 85,
                            paddingHorizontal: 5,
                            textAlign: "center",
                            fontSize: 18,
                            fontWeight: "bold",
                            color: colors.text,
                            backgroundColor: colors.background,
                          },
                        ]}
                      />

                      <TouchableOpacity
                        onPress={() => {
                          const step = inputUnit === "lb" ? 5 : userSettings.weightIncrement;
                          setPesoActual(
                            Math.round((pesoActual + step) * 10) / 10
                          );
                        }}
                      >
                        <Ionicons name="add-circle" size={30} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Control Reps Común para todos */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 2,
                  }}
                >
                  <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: "bold" }}>
                    REPETICIONES
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => setRepActual(Math.max(1, repActual - 1))}
                    >
                      <Ionicons name="remove-circle" size={30} color={colors.primary} />
                    </TouchableOpacity>

                    <TextInput
                      editable={false}
                      value={repActual ? repActual.toString() : "0"}
                      style={[
                        globalStyles.input,
                        {
                          marginTop: 0,
                          marginBottom: 0,
                          minHeight: 42,
                          width: 85,
                          paddingHorizontal: 8,
                          textAlign: "center",
                          fontSize: 18,
                          fontWeight: "bold",
                          color: colors.text,
                          backgroundColor: colors.background,
                        },
                      ]}
                    />

                    <TouchableOpacity onPress={() => setRepActual(repActual + 1)}>
                      <Ionicons name="add-circle" size={30} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })()}

          {/* Sugerencia Coach RIR & Autorregulación (Reemplaza Mejor Serie) */}
          {(() => {
            const ejercicio = routineData?.exercises?.[ejercicioActual];
            if (!ejercicio) return null;
            const prescription = calculateRIRPrescription(
              ejercicio,
              lastSession,
              personalBest,
              inputUnit
            );

            return (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowCoachModal(true);
                }}
                style={{
                  marginTop: 12,
                  marginBottom: 6,
                  backgroundColor: colors.background,
                  borderRadius: 12,
                  paddingVertical: 8,
                  paddingHorizontal: 10,
                  borderWidth: 1,
                  borderColor: prescription.hasNeuralFatigue
                    ? "rgba(239, 68, 68, 0.4)"
                    : colors.primary + "30",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 5, flex: 1 }}>
                    <Ionicons
                      name={prescription.hasNeuralFatigue ? "alert-circle" : "sparkles"}
                      size={13}
                      color={prescription.hasNeuralFatigue ? "#ef4444" : colors.primary}
                    />
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "800",
                        color: prescription.hasNeuralFatigue ? "#ef4444" : colors.primary,
                        letterSpacing: 0.5,
                      }}
                    >
                      COACH RIR
                    </Text>
                    <View
                      style={{
                        backgroundColor: colors.surface,
                        paddingHorizontal: 5,
                        paddingVertical: 1,
                        borderRadius: 4,
                        borderWidth: 0.5,
                        borderColor: colors.cardBorder || (colors.primary + "30"),
                      }}
                    >
                      <Text style={{ fontSize: 9, fontWeight: "700", color: colors.secondary || colors.primary }}>
                        {prescription.optionA.targetRIR}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                    <Text style={{ fontSize: 10, fontWeight: "700", color: colors.primary }}>
                      Ver plan
                    </Text>
                    <Ionicons name="chevron-forward" size={11} color={colors.primary} />
                  </View>
                </View>

                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: colors.text,
                    marginTop: 3,
                  }}
                  numberOfLines={1}
                >
                  {prescription.shortSummary}
                </Text>

                <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2 }}>
                  {personalBest
                    ? personalBest.peso > 0
                      ? `Último récord: +${formatWeightText(personalBest.peso, inputUnit)} x ${personalBest.reps} reps`
                      : personalBest.peso < 0
                        ? `Último récord: ${personalBest.reps} reps (Ayuda: ${formatWeightText(Math.abs(personalBest.peso), inputUnit)})`
                        : `Último récord: ${personalBest.reps} reps (Solo cuerpo)`
                    : "Sin récord previo registrado"}
                </Text>
              </TouchableOpacity>
            );
          })()}

          {/* Temporizador de Recuperación Inline si está activo */}
          {activeRestTimer && !isCardioExercise(routineData.exercises[ejercicioActual]) && (
            <InlineRestTimer
              duration={activeRestTimer.duration}
              startTime={activeRestTimer.startTime}
              exerciseName={routineData.exercises[ejercicioActual]?.nombre}
              routePath={`/routines/PlayRoutine/${id}`}
              onAddSeconds={(secs) => {
                setActiveRestTimer((prev) =>
                  prev ? { ...prev, duration: prev.duration + secs } : null
                );
              }}
              onSkip={() => {
                cancelAllRestTimerNotifications();
                setActiveRestTimer(null);
              }}
            />
          )}

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

          {/* Botón pequeño para finalizar entrenamiento con confirmación motivacional */}
          <TouchableOpacity
            onPress={handlePromptGiveUp}
            style={{
              alignSelf: "center",
              marginTop: 14,
              paddingVertical: 7,
              paddingHorizontal: 14,
              borderRadius: 8,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: colors.delete + "12",
              borderWidth: 1,
              borderColor: colors.delete + "30",
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="flag-outline" size={14} color={colors.delete} />
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.delete }}>
              Finalizar entrenamiento
            </Text>
          </TouchableOpacity>
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
                      onCheck={() => { }}
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

      {/* Modal no nativo para confirmar abandono/finalización con mensaje motivacional */}
      <ThemeConfirmModal
        visible={showGiveUpModal}
        title="¿Seguro que quieres rendirte ahora?"
        message={`${motivationalMessage}\n\n${
          totalSeries > 0
            ? "Si finalizas ahora, se guardará el progreso de las series que ya completaste."
            : "Aún no has completado ninguna serie, por lo que no se guardará ningún registro."
        }`}
        confirmText="Sí, finalizar"
        cancelText="¡Seguir entrenando!"
        isDestructive={true}
        onConfirm={handleConfirmGiveUp}
        onCancel={() => setShowGiveUpModal(false)}
      />

      {/* Modal Prescripción Coach RIR */}
      {showCoachModal && routineData?.exercises?.[ejercicioActual] && (
        <CoachRIRModal
          visible={showCoachModal}
          onClose={() => setShowCoachModal(false)}
          exercise={routineData.exercises[ejercicioActual]}
          lastSession={lastSession}
          personalBest={personalBest}
          prescription={calculateRIRPrescription(
            routineData.exercises[ejercicioActual],
            lastSession,
            personalBest,
            inputUnit
          )}
          onApplyOption={handleApplyCoachOption}
          userUnit={inputUnit}
        />
      )}
    </KeyboardAvoidingView>
  );
};

export default PlayRoutineScreen;
