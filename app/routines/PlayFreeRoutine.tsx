import CoachRIRModal from "@/components/CoachRIRModal";
import InlineRestTimer from "@/components/InlineRestTimer";
import { useActiveWorkout } from "@/context/ActiveWorkoutContext";
import { useTheme } from "@/context/ThemeContext";
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
  ExerciseCatalogItem,
  getAllExercises,
  getExerciseCategory,
  isBodyweightExercise,
  isCardioExercise,
} from "@/store/excercise";
import {
  addExerciseLog,
  ExerciseHistory,
  getHistoryByExerciseId,
  getPersonalBest,
  isBetterSet,
} from "@/store/historyExcercise";
import { addRoutineSession } from "@/store/historyRoutine";
import { cancelAllRestTimerNotifications } from "@/store/notificationsConfig";
import { getGlobalStyles } from "@/styles/global";
import { getExerciseImage } from "@/utils/imageMap";
import { calculateRIRPrescription } from "@/utils/rirCoachCalculator";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
  peso: number; // Guardado en KG para fuerza
  intensity?: string; // Para cardio: "Baja" | "Moderada" | "Alta" | "Máxima"
  timeMinutes?: number; // Para cardio: minutos
};

type ActiveExercise = {
  exerciseInfo: ExerciseType;
  sets: ActiveSet[];
  personalBest: { peso: number; reps: number; timeMinutes?: number; intensity?: string } | null;
  lastSession?: ExerciseHistory | null;
};

// ============================================================================
// PALETA DE COLORES Y TOKENS UI/UX (INSPIRADO EN EL DARK UI KIT CON DEGRADADOS SUNSET)
// ============================================================================
// PALETA Y TOKENS UI DINÁMICOS - RESPETA EL TEMA ACTIVO (CYBERPUNK LIME, SUNSET, ETC.)
// ============================================================================
export function getWorkoutTheme(colors: any) {
  const isNeonLime =
    colors.primary?.toLowerCase().includes("c8ff") ||
    colors.primary?.toLowerCase() === "#c8ff00" ||
    colors.primary?.toLowerCase() === "#52b788";
  const onPrimaryColor = isNeonLime ? "#000000" : "#ffffff";
  const isLight = colors.background === "#ffffff" || colors.background === "#F4F6F9";

  return {
    bg: colors.background,
    card: colors.surface,
    cardBorder: colors.cardBorder || (isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)"),
    cardBorderActive: colors.primary,
    inset: isLight ? "#e9ecef" : "#0c0e17",
    insetBorder: colors.cardBorder || (isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)"),
    textPrimary: colors.text,
    textSecondary: colors.textSecondary,
    textMuted: colors.textSecondary + "95",
    gradient: [colors.primary, colors.secondary || colors.primary] as const,
    gradientGlow: colors.primary,
    accentOrange: colors.primary, // Mantiene el color original del tema activo
    accentCoral: colors.accent || colors.primary,
    onPrimary: onPrimaryColor,
    tactileButton: colors.surface,
    tactileBorder: colors.cardBorder || (isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)"),
    tactileActive: colors.primary + "20",
    tactileWhite: colors.surface,
    tactileWhiteBorder: colors.cardBorder || (isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)"),
    delete: colors.delete || "#ff4757",
    success: colors.success || "#22c55e",
  };
}

export const UI_KIT = {
  bg: "#12121e",
  card: "#1e1e32",
  cardBorder: "rgba(200, 255, 0, 0.15)",
  cardBorderActive: "#C8FF00",
  inset: "#0c0e17",
  insetBorder: "rgba(200, 255, 0, 0.1)",
  textPrimary: "#ffffff",
  textSecondary: "#a0a0b0",
  textMuted: "#a0a0b095",
  gradient: ["#C8FF00", "#0066ff"] as const,
  gradientGlow: "#C8FF00",
  accentOrange: "#C8FF00",
  accentCoral: "#C8FF00",
  onPrimary: "#000000",
  tactileButton: "#1e1e32",
  tactileBorder: "rgba(200, 255, 0, 0.15)",
  tactileActive: "rgba(200, 255, 0, 0.2)",
  tactileWhite: "#1e1e32",
  tactileWhiteBorder: "rgba(200, 255, 0, 0.15)",
  delete: "#ff4757",
  success: "#22c55e",
};

// ============================================================================
// CONFIGURACIÓN DE LA INTERFAZ DE CARDIO
// (Modifica aquí intensidades, colores o presets a tu gusto)
// ============================================================================
export const CARDIO_INTENSITY_OPTIONS = [
  { label: "Baja", sub: "Suave", color: "#22c55e" },
  { label: "Moderada", sub: "Aeróbico", color: "#eab308" },
  { label: "Alta", sub: "Intenso", color: "#ff7b2b" },
  { label: "Máxima", sub: "HIIT", color: "#ff3d60" },
];

export const CARDIO_PRESET_MINUTES = [5, 10, 15, 20, 30, 45];

export default function PlayFreeRoutineScreen() {
  const { colors } = useTheme();
  const UI_KIT = getWorkoutTheme(colors);
  const globalStyles = getGlobalStyles(colors);
  const router = useRouter();
  const { activeWorkout, startActiveWorkout, updateWorkoutState, finishActiveWorkout } = useActiveWorkout();

  const startTimeRef = useRef<number>(activeWorkout?.startTime || Date.now());

  const [userSettings, setUserSettings] = useState<UserSettings>({
    unit: "kg",
    weightIncrement: 2.5,
    defaultRestTimer: 90,
  });

  // Temporizador de recuperación inline entre series
  const [activeRestTimer, setActiveRestTimer] = useState<{
    exerciseIndex: number;
    setIndex: number;
    duration: number;
    startTime: number;
  } | null>(null);

  const [allCatalog, setAllCatalog] = useState<ExerciseType[]>([]);

  const loadCatalog = async () => {
    const data = await getAllExercises();
    setAllCatalog(data);
  };

  useFocusEffect(
    useCallback(() => {
      getSettings().then((s) => setUserSettings(s));
      loadCatalog();
      startActiveWorkout({
        routineName: "Entrenamiento Libre",
        workoutType: "free",
        routePath: "/routines/PlayFreeRoutine",
        startTime: activeWorkout?.startTime || startTimeRef.current,
        workoutState: { activeExercises, inputs },
      });
    }, [])
  );

  // Timer continuo de la sesión
  const [timer, setTimer] = useState(0);
  useEffect(() => {
    const startMs = activeWorkout?.startTime || startTimeRef.current;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startMs) / 1000);
      setTimer(elapsed);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeWorkout?.startTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // State para los ejercicios agregados a esta sesión (uno debajo del otro)
  const [activeExercises, setActiveExercises] = useState<ActiveExercise[]>(
    activeWorkout?.workoutState?.activeExercises || []
  );

  // Valores predeterminados por ejercicio
  const getDefaultInputsForExercise = (
    exercise: ExerciseType,
    pb: { peso: number; reps: number; timeMinutes?: number; intensity?: string } | null | undefined,
    unit: WeightUnit
  ) => {
    const cat = getExerciseCategory(exercise);
    if (cat === "Cardio") {
      return {
        intensity: pb?.intensity || "Moderada",
        timeMinutes: (pb?.timeMinutes || 15).toString(),
        peso: "0",
        reps: (pb?.timeMinutes || 15).toString(),
        unit,
      };
    }

    if (cat === "Peso corporal") {
      const isAyuda = pb && pb.peso < 0;
      const isLastre = pb && pb.peso > 0;
      const bwMode: "solo" | "lastre" | "ayuda" = isAyuda ? "ayuda" : isLastre ? "lastre" : "solo";
      return {
        peso: pb && pb.peso !== 0
          ? (unit === "lb" ? convertWeightToggle(pb.peso, "lb") : toDisplayWeight(pb.peso, unit)).toString()
          : "0",
        reps: (pb?.reps || 10).toString(),
        unit,
        intensity: "Moderada",
        timeMinutes: "15",
        bodyweightMode: bwMode,
      };
    }

    if (pb && pb.peso > 0) {
      return {
        peso: (unit === "lb" ? convertWeightToggle(pb.peso, "lb") : toDisplayWeight(pb.peso, unit)).toString(),
        reps: (pb.reps || 10).toString(),
        unit,
        intensity: "Moderada",
        timeMinutes: "15",
      };
    }
    return {
      peso: unit === "lb" ? "20" : "10",
      reps: "10",
      unit,
      intensity: "Moderada",
      timeMinutes: "15",
    };
  };

  // Inputs temporales por ejercicio
  const [inputs, setInputs] = useState<
    Record<
      number,
      {
        reps: string;
        peso: string;
        unit?: WeightUnit;
        intensity?: string;
        timeMinutes?: string;
        bodyweightMode?: "solo" | "lastre" | "ayuda";
      }
    >
  >(activeWorkout?.workoutState?.inputs || {});

  // Sincronización en tiempo real
  useEffect(() => {
    updateWorkoutState({
      activeExercises,
      inputs,
    });
  }, [activeExercises, inputs]);

  // Pantalla de resumen final
  const [isRoutineCompleted, setIsRoutineCompleted] = useState(false);
  const [completedSummary, setCompletedSummary] = useState({
    name: "Entrenamiento Libre",
    duration: 0,
    totalVolume: 0,
    totalSeries: 0,
    newRecordsCount: 0,
    exercises: [] as ExerciseType[],
  });

  // Modal para agregar ejercicios
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [search, setSearch] = useState("");
  const [muscleSelected, setMuscleSelected] = useState("");

  // Modal para la prescripción del Coach RIR
  const [selectedCoachIndex, setSelectedCoachIndex] = useState<number | null>(null);

  // Asegurar que todos los ejercicios tengan lastSession cargado del historial
  useEffect(() => {
    let isMounted = true;
    const ensureHistories = async () => {
      let needsUpdate = false;
      const updated = await Promise.all(
        activeExercises.map(async (ex) => {
          if (ex.lastSession === undefined) {
            needsUpdate = true;
            const history = await getHistoryByExerciseId(ex.exerciseInfo.id);
            return {
              ...ex,
              lastSession: history && history.length > 0 ? history[0] : null,
            };
          }
          return ex;
        })
      );
      if (needsUpdate && isMounted) {
        setActiveExercises(updated);
      }
    };
    if (activeExercises.some((e) => e.lastSession === undefined)) {
      ensureHistories();
    }
    return () => {
      isMounted = false;
    };
  }, [activeExercises]);

  const handleApplyCoachOption = (
    exIndex: number,
    optionType: "A" | "topSet" | "backOff" | "cardio" | "sameWeight",
    appliedUnit?: WeightUnit
  ) => {
    const targetEx = activeExercises[exIndex];
    if (!targetEx) return;

    // Detectar unidad: si la medida está en kg o lb, cambiar primero el selector a esa unidad
    const currentCardUnit: WeightUnit = inputs[exIndex]?.unit || userSettings.unit || "kg";
    const unitToApply: WeightUnit = appliedUnit || currentCardUnit;

    const presc = calculateRIRPrescription(
      targetEx.exerciseInfo,
      targetEx.lastSession,
      targetEx.personalBest,
      unitToApply
    );

    const prevInput = inputs[exIndex] || getDefaultInputsForExercise(
      targetEx.exerciseInfo,
      targetEx.personalBest,
      unitToApply
    );

    const isBw = isBodyweightExercise(targetEx.exerciseInfo);
    let targetRepsNum = 10;
    let targetWeightNum = 0;
    let newBwMode = prevInput.bodyweightMode;

    if (optionType === "A") {
      targetRepsNum = presc.optionA.targetReps;
      targetWeightNum = presc.optionA.targetWeightDisplay;
    } else if (optionType === "sameWeight" && presc.sameWeightOption) {
      targetRepsNum = presc.sameWeightOption.targetReps;
      targetWeightNum = presc.sameWeightOption.targetWeightDisplay;
    } else if (optionType === "topSet" && presc.optionB.topSet) {
      targetRepsNum = presc.optionB.topSet.reps;
      targetWeightNum = presc.optionB.topSet.weightDisplay;
    } else if (optionType === "backOff" && presc.optionB.backOffSet) {
      targetRepsNum = presc.optionB.backOffSet.reps;
      targetWeightNum = presc.optionB.backOffSet.weightDisplay;
    }

    if (isBw) {
      if (targetWeightNum > 0) newBwMode = "lastre";
      else if (targetWeightNum < 0) newBwMode = "ayuda";
      else newBwMode = "solo";
    }

    if (optionType === "cardio") {
      setInputs((prev) => ({
        ...prev,
        [exIndex]: {
          ...prevInput,
          timeMinutes: presc.optionA.targetReps.toString(),
          intensity: "Moderada",
        },
      }));
    } else {
      setInputs((prev) => ({
        ...prev,
        [exIndex]: {
          ...prevInput,
          unit: unitToApply, // Sincroniza el selector a la unidad detectada primero
          reps: targetRepsNum.toString(),
          peso: targetWeightNum.toString(),
          bodyweightMode: newBwMode,
        },
      }));
    }
  };

  const handleAddExerciseToWorkout = async (exercise: ExerciseType) => {
    if (activeExercises.some((e) => e.exerciseInfo.id === exercise.id)) {
      setIsPickerVisible(false);
      return;
    }

    const [pb, history] = await Promise.all([
      getPersonalBest(exercise.id),
      getHistoryByExerciseId(exercise.id),
    ]);
    const lastSession = history && history.length > 0 ? history[0] : null;

    const newActiveEx: ActiveExercise = {
      exerciseInfo: exercise,
      sets: [],
      personalBest: pb,
      lastSession,
    };

    const newExIndex = activeExercises.length;
    const initialInputs = getDefaultInputsForExercise(exercise, pb, userSettings.unit);

    // Ajustar inputs con la sugerencia inteligente del Coach RIR si está disponible
    const presc = calculateRIRPrescription(exercise, lastSession, pb, userSettings.unit);
    if (presc.category === "Gym" && presc.optionA.targetWeightDisplay > 0) {
      initialInputs.peso = presc.optionA.targetWeightDisplay.toString();
      initialInputs.reps = presc.optionA.targetReps.toString();
    }

    setInputs((prev) => ({
      ...prev,
      [newExIndex]: initialInputs,
    }));

    setActiveExercises((prev) => [...prev, newActiveEx]);
    setIsPickerVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleAddSet = async (exerciseIndex: number) => {
    const targetEx = activeExercises[exerciseIndex];
    if (!targetEx) return;

    const isCardio = isCardioExercise(targetEx.exerciseInfo);
    const fallbackInputs = getDefaultInputsForExercise(
      targetEx.exerciseInfo,
      targetEx.personalBest,
      userSettings.unit
    );
    const currentInput = inputs[exerciseIndex] || fallbackInputs;
    const newSetIndex = targetEx.sets.length;

    if (isCardio) {
      // REGISTRO DE SERIE DE CARDIO (TIEMPO E INTENSIDAD)
      const timeVal = Math.max(1, parseInt(currentInput.timeMinutes || "15") || 15);
      const intensityVal = currentInput.intensity || "Moderada";

      setActiveExercises((prev) => {
        const updated = [...prev];
        const ex = updated[exerciseIndex];
        ex.sets = [
          ...ex.sets,
          {
            reps: timeVal,
            peso: 0,
            timeMinutes: timeVal,
            intensity: intensityVal,
          },
        ];
        return updated;
      });
    } else {
      // REGISTRO DE SERIE DE FUERZA (PESO Y REPS)
      const repsNum = parseInt(currentInput.reps) || 10;
      const setUnit: WeightUnit = currentInput.unit || userSettings.unit;

      if (repsNum <= 0) return;

      let weightInKg = 0;
      if (isBodyweightExercise(targetEx.exerciseInfo)) {
        const bwMode =
          currentInput.bodyweightMode ||
          (parseFloat(currentInput.peso) < 0
            ? "ayuda"
            : parseFloat(currentInput.peso) > 0
              ? "lastre"
              : "solo");
        if (bwMode === "solo") {
          weightInKg = 0;
        } else if (bwMode === "lastre") {
          const absP = Math.abs(parseFloat(currentInput.peso) || 0);
          weightInKg = setUnit === "lb" ? toStoredKg(absP, "lb") : absP;
        } else {
          const absP = Math.abs(parseFloat(currentInput.peso) || 0) || (setUnit === "lb" ? 10 : 5);
          const stored = setUnit === "lb" ? toStoredKg(absP, "lb") : absP;
          weightInKg = -stored;
        }
      } else {
        const pesoInputVal = parseFloat(currentInput.peso) || 0;
        weightInKg = setUnit === "lb" ? toStoredKg(pesoInputVal, "lb") : pesoInputVal;
      }

      setActiveExercises((prev) => {
        const updated = [...prev];
        const ex = updated[exerciseIndex];
        ex.sets = [...ex.sets, { reps: repsNum, peso: weightInKg }];
        return updated;
      });
    }

    cancelAllRestTimerNotifications();
    if (!isCardio) {
      const freshSettings = await getSettings();
      setUserSettings(freshSettings);
      const restDuration = freshSettings.defaultRestTimer || userSettings.defaultRestTimer || 90;
      setActiveRestTimer({
        exerciseIndex,
        setIndex: newSetIndex,
        duration: restDuration,
        startTime: Date.now(),
      });
    } else {
      setActiveRestTimer(null);
    }

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

    if (activeRestTimer && activeRestTimer.exerciseIndex === exerciseIndex) {
      if (activeRestTimer.setIndex === setIndex) {
        cancelAllRestTimerNotifications();
        setActiveRestTimer(null);
      } else if (activeRestTimer.setIndex > setIndex) {
        setActiveRestTimer((prev) =>
          prev ? { ...prev, setIndex: prev.setIndex - 1 } : null
        );
      }
    }
  };

  const handleRemoveExercise = (exerciseIndex: number) => {
    setActiveExercises((prev) => prev.filter((_, i) => i !== exerciseIndex));
    setInputs((prev) => {
      const nextInputs: typeof prev = {};
      Object.keys(prev).forEach((k) => {
        const idx = parseInt(k, 10);
        if (idx < exerciseIndex) {
          nextInputs[idx] = prev[idx];
        } else if (idx > exerciseIndex) {
          nextInputs[idx - 1] = prev[idx];
        }
      });
      return nextInputs;
    });

    if (activeRestTimer) {
      if (activeRestTimer.exerciseIndex === exerciseIndex) {
        cancelAllRestTimerNotifications();
        setActiveRestTimer(null);
      } else if (activeRestTimer.exerciseIndex > exerciseIndex) {
        setActiveRestTimer((prev) =>
          prev ? { ...prev, exerciseIndex: prev.exerciseIndex - 1 } : null
        );
      }
    }
  };

  const handleFinishWorkout = async () => {
    cancelAllRestTimerNotifications();
    setActiveRestTimer(null);
    const totalSeriesCount = activeExercises.reduce((acc, item) => acc + item.sets.length, 0);

    if (activeExercises.length === 0 || totalSeriesCount === 0) {
      finishActiveWorkout();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Toast.show({
        type: "info",
        text1: "Entrenamiento finalizado",
        text2: "No se guardó nada porque no registraste ninguna serie.",
      });
      router.replace("/(tabs)" as any);
      return;
    }

    let totalVolume = 0;
    let totalSeries = 0;
    let newRecordsCount = 0;

    const sessionExercises: {
      exerciseName: string;
      sets: { reps: number; peso: number; intensity?: string; timeMinutes?: number }[];
    }[] = [];

    const summaryExercises: ExerciseType[] = [];

    for (const item of activeExercises) {
      if (item.sets.length > 0) {
        totalSeries += item.sets.length;
        const isCardio = isCardioExercise(item.exerciseInfo);
        const exVol = isCardio
          ? 0
          : item.sets.reduce((acc, s) => acc + (s.peso > 0 ? (s.peso * s.reps) : 0), 0);
        totalVolume += exVol;

        sessionExercises.push({
          exerciseName: item.exerciseInfo.nombre,
          sets: item.sets,
        });

        summaryExercises.push(item.exerciseInfo);

        const isNewPR = item.sets.some((s) => {
          if (!item.personalBest) return true;
          return isBetterSet(s, item.personalBest);
        });

        if (isNewPR) {
          newRecordsCount += 1;
        }

        await addExerciseLog(item.exerciseInfo.id, item.sets);
      }
    }

    if (sessionExercises.length === 0) {
      finishActiveWorkout();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Toast.show({
        type: "info",
        text1: "Entrenamiento finalizado",
        text2: "No se guardó nada porque no registraste ninguna serie.",
      });
      router.replace("/(tabs)" as any);
      return;
    }
    await addRoutineSession({
      name: "Entrenamiento Libre",
      duration: timer,
      totalVolume,
      exercises: sessionExercises,
    });

    finishActiveWorkout();

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

      const cat = getExerciseCategory(exercise);
      if (muscleSelected === "Gym") return cat === "Gym";
      if (muscleSelected === "Cardio") return cat === "Cardio";
      if (muscleSelected === "Peso corporal") return cat === "Peso corporal";

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
      style={{ flex: 1, backgroundColor: UI_KIT.bg }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <View style={[globalStyles.container, { backgroundColor: UI_KIT.bg }]}>
        {/* Header estilo Dark UI Kit con acentos sunset */}
        <View style={[globalStyles.header, { marginBottom: 16 }]}>
          <View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: UI_KIT.accentOrange,
                }}
              />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "bold",
                  color: UI_KIT.accentOrange,
                  letterSpacing: 1.2,
                }}
              >
                ENTRENAMIENTO LIBRE
              </Text>
            </View>
            <Text
              style={[
                globalStyles.title,
                { fontSize: 24, marginTop: 3, color: UI_KIT.textPrimary, fontWeight: "800" },
              ]}
            >
              Sesión en Curso
            </Text>
          </View>

          {/* Reloj Timer estilo reloj del UI Kit */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              backgroundColor: UI_KIT.card,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 24,
              borderWidth: 1.5,
              borderColor: UI_KIT.cardBorder,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: UI_KIT.accentOrange,
              }}
            >
              <Ionicons name="time" size={15} color={UI_KIT.onPrimary} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: "800", color: UI_KIT.textPrimary }}>
              {formatTime(timer)}
            </Text>
          </View>
        </View>

        {/* Barra de Estadísticas Estilo Dashboard UI Kit */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: UI_KIT.card,
            borderRadius: 16,
            paddingVertical: 10,
            paddingHorizontal: 14,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: UI_KIT.cardBorder,
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View style={{ alignItems: "center", flex: 1 }}>
            <Text style={{ fontSize: 10, color: UI_KIT.textMuted, fontWeight: "700", letterSpacing: 0.6 }}>
              DURACIÓN
            </Text>
            <Text style={{ fontSize: 15, fontWeight: "800", color: UI_KIT.textPrimary, marginTop: 2 }}>
              {formatTime(timer)}
            </Text>
          </View>

          <View style={{ width: 1, height: 20, backgroundColor: UI_KIT.cardBorder }} />

          <View style={{ alignItems: "center", flex: 1 }}>
            <Text style={{ fontSize: 10, color: UI_KIT.textMuted, fontWeight: "700", letterSpacing: 0.6 }}>
              EJERCICIOS
            </Text>
            <Text style={{ fontSize: 15, fontWeight: "800", color: UI_KIT.accentOrange, marginTop: 2 }}>
              {activeExercises.length}
            </Text>
          </View>

          <View style={{ width: 1, height: 20, backgroundColor: UI_KIT.cardBorder }} />

          <View style={{ alignItems: "center", flex: 1 }}>
            <Text style={{ fontSize: 10, color: UI_KIT.textMuted, fontWeight: "700", letterSpacing: 0.6 }}>
              TOTAL SERIES
            </Text>
            <Text style={{ fontSize: 15, fontWeight: "800", color: UI_KIT.textPrimary, marginTop: 2 }}>
              {activeExercises.reduce((sum, e) => sum + e.sets.length, 0)}
            </Text>
          </View>
        </View>

        {/* Lista Vertical de Ejercicios (un ejercicio debajo del otro) */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 220 }}
        >
          {activeExercises.length === 0 ? (
            /* Estado Vacío */
            <View
              style={[
                styles.uiCard,
                { alignItems: "center", paddingVertical: 45, marginTop: 15 },
              ]}
            >
              <View
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 38,
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 16,
                  backgroundColor: UI_KIT.accentOrange,
                }}
              >
                <Ionicons name="barbell" size={40} color={UI_KIT.onPrimary} />
              </View>

              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "bold",
                  color: UI_KIT.textPrimary,
                  marginTop: 6,
                  marginBottom: 6,
                }}
              >
                ¡Empieza tu Entrenamiento!
              </Text>
              <Text
                style={{
                  textAlign: "center",
                  paddingHorizontal: 26,
                  color: UI_KIT.textSecondary,
                  lineHeight: 20,
                  fontSize: 14,
                }}
              >
                Agrega ejercicios con el botón inferior. Podrás registrarlos uno debajo del otro y añadir tantas series o bloques de cardio como quieras.
              </Text>
            </View>
          ) : (
            activeExercises.map((item, exIndex) => {
              const category = getExerciseCategory(item.exerciseInfo);
              const isCardio = category === "Cardio";
              const isBodyweight = category === "Peso corporal";
              const fallbackInput = getDefaultInputsForExercise(
                item.exerciseInfo,
                item.personalBest,
                userSettings.unit
              );
              const inputVal = inputs[exIndex] || fallbackInput;
              const currentUnit: WeightUnit = inputVal.unit || userSettings.unit;

              const borderAccent = isCardio
                ? UI_KIT.accentOrange
                : isBodyweight
                  ? "#22c55e"
                  : UI_KIT.accentCoral;

              return (
                <View
                  key={`${item.exerciseInfo.id}-${exIndex}`}
                  style={[
                    styles.uiCard,
                    {
                      marginBottom: 16,
                      borderLeftWidth: 4,
                      borderLeftColor: borderAccent,
                    },
                  ]}
                >
                  {/* Encabezado del Ejercicio */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 12,
                        alignItems: "flex-start",
                        flex: 1,
                      }}
                    >
                      <TouchableOpacity
                        onPress={() => router.push(`/exercises/DetailsExercise/${item.exerciseInfo.id}` as any)}
                      >
                        <Image
                          source={getExerciseImage(item.exerciseInfo.id, item.exerciseInfo.urlimage)}
                          style={{
                            width: 52,
                            height: 52,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: UI_KIT.cardBorder,
                            marginTop: 2,
                          }}
                        />
                      </TouchableOpacity>
                      <View style={{ flex: 1 }}>
                        <TouchableOpacity
                          onPress={() => router.push(`/exercises/DetailsExercise/${item.exerciseInfo.id}` as any)}
                        >
                          <Text
                            style={{
                              fontSize: 16,
                              fontWeight: "bold",
                              color: UI_KIT.textPrimary,
                            }}
                            numberOfLines={1}
                          >
                            {item.exerciseInfo.nombre}
                          </Text>
                        </TouchableOpacity>

                        {/* Badges de Categoría y Músculo */}
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                          {isCardio ? (
                            <View
                              style={{
                                paddingHorizontal: 8,
                                paddingVertical: 2,
                                borderRadius: 6,
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 3,
                                backgroundColor: UI_KIT.accentOrange + "22",
                                borderWidth: 1,
                                borderColor: UI_KIT.accentOrange + "40",
                              }}
                            >
                              <Ionicons name="flame" size={11} color={UI_KIT.accentOrange} />
                              <Text style={{ fontSize: 10, fontWeight: "bold", color: UI_KIT.accentOrange }}>
                                CARDIO
                              </Text>
                            </View>
                          ) : isBodyweight ? (
                            <View
                              style={{
                                backgroundColor: "rgba(34, 197, 94, 0.15)",
                                paddingHorizontal: 8,
                                paddingVertical: 2,
                                borderRadius: 6,
                                borderWidth: 1,
                                borderColor: "rgba(34, 197, 94, 0.4)",
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 3,
                              }}
                            >
                              <Ionicons name="body" size={11} color="#22c55e" />
                              <Text style={{ fontSize: 10, fontWeight: "bold", color: "#22c55e" }}>
                                PESO CORPORAL
                              </Text>
                            </View>
                          ) : (
                            <View
                              style={{
                                backgroundColor: UI_KIT.inset,
                                paddingHorizontal: 7,
                                paddingVertical: 2,
                                borderRadius: 6,
                                borderWidth: 1,
                                borderColor: UI_KIT.insetBorder,
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 3,
                              }}
                            >
                              <Ionicons name="barbell" size={11} color={UI_KIT.accentOrange} />
                              <Text style={{ fontSize: 10, fontWeight: "bold", color: UI_KIT.accentOrange }}>
                                GYM
                              </Text>
                            </View>
                          )}

                          <Text style={{ fontSize: 11, color: UI_KIT.textMuted }}>
                            {item.exerciseInfo.equipamiento}
                          </Text>
                        </View>

                      </View>


                    </View>

                    {/* Botón Circular Tactile Eliminar */}
                    <TouchableOpacity
                      onPress={() => handleRemoveExercise(exIndex)}
                      style={styles.tactileCircleButton}
                    >
                      <Ionicons name="trash-outline" size={18} color={UI_KIT.delete} />
                    </TouchableOpacity>
                  </View>

                  {/* Sugerencia Coach RIR (Reemplaza Mejor Récord Registrado) */}
                  {(() => {
                    const prescription = calculateRIRPrescription(
                      item.exerciseInfo,
                      item.lastSession,
                      item.personalBest,
                      currentUnit
                    );
                    const getPBMetric = () => {
                      if (!item.personalBest) return { value: "—", label: "Sin registro" };

                      if (isCardio) {
                        const time = item.personalBest.timeMinutes || item.personalBest.reps;
                        return {
                          value: `${time} min`,
                          label: item.personalBest.intensity || "Cardio",
                        };
                      }

                      const { peso = 0, reps } = item.personalBest;
                      const unit = currentUnit;

                      if (isBodyweight) {
                        if (peso > 0) return { value: `+${formatWeightText(peso, unit)}`, label: `${reps} reps PB` };
                        if (peso < 0) return { value: `-${formatWeightText(Math.abs(peso), unit)}`, label: `${reps} reps (asist)` };
                        return { value: `${reps} reps`, label: "Peso corporal" };
                      }

                      return {
                        value: formatWeightText(peso, unit),
                        label: `${reps} reps PB`,
                      };
                    };

                    const pb = getPBMetric();
                    const isFatigued = prescription.hasNeuralFatigue;
                    return (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSelectedCoachIndex(exIndex);
                        }}
                        style={{
                          marginTop: 8,
                          backgroundColor: "#161922", // Fondo oscuro suave como las cards de referencia
                          borderRadius: 18,
                          paddingVertical: 12,
                          paddingHorizontal: 14,
                          borderWidth: 1,
                          borderColor: isFatigued ? "rgba(239, 68, 68, 0.35)" : "rgba(255, 255, 255, 0.05)",
                        }}
                      >
                        {/* Fila Superior: Badge RIR + Target Pill + Botón circular/flecha */}
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            {/* Icono + RIR Tag estilo pill */}
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 5,
                                backgroundColor: isFatigued ? "rgba(239, 68, 68, 0.15)" : "rgba(46, 213, 115, 0.12)",
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: 20,
                              }}
                            >
                              <Ionicons
                                name={isFatigued ? "alert-circle" : "sparkles"}
                                size={12}
                                color={isFatigued ? "#ef4444" : "#2ed573"}
                              />
                              <Text
                                style={{
                                  fontSize: 10,
                                  fontWeight: "800",
                                  letterSpacing: 0.5,
                                  color: isFatigued ? "#ef4444" : "#2ed573",
                                }}
                              >
                                RIR {prescription.optionA.targetRIR}
                              </Text>
                            </View>

                            {/* Resumen corto como subtítulo pill */}

                          </View>

                          {/* Flecha minimalista circular (similar a los switches/botones de la referencia) */}
                          <View
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 11,
                              backgroundColor: "rgba(255, 255, 255, 0.06)",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Ionicons name="chevron-forward" size={12} color="#94a3b8" />
                          </View>
                        </View>
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "600",
                            color: "#94a3b8",
                            maxWidth: 160,
                          }}
                        >
                          {prescription.shortSummary}
                        </Text>


                      </TouchableOpacity>
                    );
                  })()}

                  {/* Tabla de Series/Bloques Completados */}
                  {item.sets.length > 0 && (
                    <View
                      style={{
                        backgroundColor: UI_KIT.inset,
                        borderRadius: 14,
                        padding: 8,
                        marginBottom: 12,
                        borderWidth: 1,
                        borderColor: UI_KIT.insetBorder,
                      }}
                    >
                      {/* Cabecera de la tabla */}
                      <View
                        style={{
                          flexDirection: "row",
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderBottomWidth: 1,
                          borderBottomColor: UI_KIT.insetBorder,
                          marginBottom: 4,
                        }}
                      >
                        <Text style={{ flex: 1, fontSize: 11, color: UI_KIT.textMuted, fontWeight: "bold" }}>
                          {isCardio ? "BLOQUE" : "SERIE"}
                        </Text>
                        <Text style={{ flex: 1.2, fontSize: 11, color: UI_KIT.textMuted, fontWeight: "bold" }}>
                          {isCardio ? "TIEMPO" : "PESO / CARGA"}
                        </Text>
                        <Text style={{ flex: 1.2, fontSize: 11, color: UI_KIT.textMuted, fontWeight: "bold" }}>
                          {isCardio ? "INTENSIDAD" : "REPS"}
                        </Text>
                        <View style={{ width: 28 }} />
                      </View>

                      {/* Filas de series completadas */}
                      {item.sets.map((set, setIndex) => {
                        const isTimerForThisSet =
                          !isCardio &&
                          activeRestTimer !== null &&
                          activeRestTimer.exerciseIndex === exIndex &&
                          activeRestTimer.setIndex === setIndex;

                        return (
                          <View key={setIndex} style={{ marginBottom: 4 }}>
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                backgroundColor: UI_KIT.card,
                                paddingVertical: 8,
                                paddingHorizontal: 10,
                                borderRadius: 10,
                                borderWidth: 1,
                                borderColor: UI_KIT.cardBorder,
                              }}
                            >
                              <Text style={{ flex: 1, fontWeight: "bold", color: UI_KIT.textPrimary, fontSize: 13 }}>
                                {isCardio ? `B${setIndex + 1}` : `S${setIndex + 1}`}
                              </Text>

                              <Text
                                style={{
                                  flex: 1.2,
                                  color: UI_KIT.accentOrange,
                                  fontWeight: "bold",
                                  fontSize: 13,
                                }}
                              >
                                {isCardio
                                  ? `${set.timeMinutes || set.reps} min`
                                  : isBodyweight
                                    ? set.peso === 0
                                      ? "Solo cuerpo"
                                      : set.peso < 0
                                        ? `Ayuda: ${formatWeightText(Math.abs(set.peso), userSettings.unit)}`
                                        : `+${formatWeightText(set.peso, userSettings.unit)}`
                                    : formatWeightText(set.peso, userSettings.unit)}
                              </Text>

                              <Text style={{ flex: 1.2, color: UI_KIT.textSecondary, fontSize: 13, fontWeight: "600" }}>
                                {isCardio
                                  ? `${set.intensity || "Moderada"}`
                                  : `${set.reps} reps`}
                              </Text>

                              <TouchableOpacity
                                onPress={() => handleRemoveSet(exIndex, setIndex)}
                                style={{ width: 28, alignItems: "center" }}
                              >
                                <Ionicons name="close-circle" size={19} color={UI_KIT.delete} />
                              </TouchableOpacity>
                            </View>

                            {/* Inline Rest Timer */}
                            {isTimerForThisSet && (
                              <InlineRestTimer
                                key={`timer-${activeRestTimer.startTime}-${activeRestTimer.exerciseIndex}-${activeRestTimer.setIndex}`}
                                duration={activeRestTimer.duration}
                                startTime={activeRestTimer.startTime}
                                exerciseName={item.exerciseInfo.nombre}
                                routePath="/routines/PlayFreeRoutine"
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
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {/* ========================================================================= */}
                  {/* FORMULARIO PARA REGISTRAR SERIE (CARDIO O FUERZA)                         */}
                  {/* ========================================================================= */}
                  <View
                    style={{
                      gap: 12,
                      paddingTop: 10,
                      borderTopWidth: 1,
                      borderTopColor: UI_KIT.insetBorder,
                    }}
                  >
                    {isCardio ? (
                      /* --------------------------------------------------------------------- */
                      /* INTERFAZ DE CARDIO: INTENSIDAD Y TIEMPO (ESTILO DARK UI KIT)          */
                      /* --------------------------------------------------------------------- */
                      <View style={{ gap: 12 }}>
                        {/* Selector de Intensidad estilo Segmented Control Pill */}
                        <View>
                          <Text
                            style={{
                              fontSize: 11,
                              color: UI_KIT.textMuted,
                              fontWeight: "bold",
                              letterSpacing: 0.8,
                              marginBottom: 6,
                            }}
                          >
                            INTENSIDAD
                          </Text>

                          {/* Segmented Control Pill tipo el menú del UI kit */}
                          <View
                            style={{
                              flexDirection: "row",
                              backgroundColor: UI_KIT.inset,
                              borderRadius: 16,
                              padding: 3,
                              borderWidth: 1,
                              borderColor: UI_KIT.insetBorder,
                            }}
                          >
                            {CARDIO_INTENSITY_OPTIONS.map((opt) => {
                              const isSelected = (inputVal.intensity || "Moderada") === opt.label;
                              return (
                                <TouchableOpacity
                                  key={opt.label}
                                  onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setInputs((prev) => ({
                                      ...prev,
                                      [exIndex]: { ...inputVal, intensity: opt.label },
                                    }));
                                  }}
                                  style={{ flex: 1 }}
                                >
                                  {isSelected ? (
                                    <View
                                      style={{
                                        paddingVertical: 8,
                                        borderRadius: 12,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        backgroundColor: UI_KIT.accentOrange,
                                      }}
                                    >
                                      <Text
                                        style={{
                                          fontSize: 12,
                                          fontWeight: "bold",
                                          color: UI_KIT.onPrimary,
                                        }}
                                      >
                                        {opt.label}
                                      </Text>
                                    </View>
                                  ) : (
                                    <View
                                      style={{
                                        paddingVertical: 8,
                                        borderRadius: 12,
                                        alignItems: "center",
                                        justifyContent: "center",
                                      }}
                                    >
                                      <Text
                                        style={{
                                          fontSize: 12,
                                          fontWeight: "600",
                                          color: UI_KIT.textSecondary,
                                        }}
                                      >
                                        {opt.label}
                                      </Text>
                                    </View>
                                  )}
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>

                        {/* Presets Rápidos de Minutos */}
                        <View>


                          {/* Stepper Tactile con Botones Circulares del UI Kit */}
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "space-between",
                              backgroundColor: UI_KIT.inset,
                              paddingVertical: 6,
                              paddingHorizontal: 12,
                              borderRadius: 14,
                              borderWidth: 1,
                              borderColor: UI_KIT.insetBorder,
                            }}
                          >
                            <Text style={{ fontSize: 12, color: UI_KIT.textSecondary, fontWeight: "600" }}>
                              TIEMPO (MINUTOS)
                            </Text>

                            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                              {/* Botón Circular Tactile (-) */}
                              <TouchableOpacity
                                onPress={() => {
                                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                  const cur = parseInt(inputVal.timeMinutes || "15") || 15;
                                  const nextVal = Math.max(1, cur - 1);
                                  setInputs((prev) => ({
                                    ...prev,
                                    [exIndex]: { ...inputVal, timeMinutes: nextVal.toString() },
                                  }));
                                }}
                                style={styles.tactileCircleButton}
                              >
                                <Ionicons name="remove" size={18} color={UI_KIT.textPrimary} />
                              </TouchableOpacity>

                              {/* Display Recessed de Minutos */}
                              <View
                                style={{
                                  minWidth: 84,
                                  paddingVertical: 6,
                                  paddingHorizontal: 10,
                                  backgroundColor: UI_KIT.card,
                                  borderRadius: 10,
                                  borderWidth: 1,
                                  borderColor: UI_KIT.cardBorder,
                                  alignItems: "center",
                                }}
                              >
                                <Text style={{ fontSize: 16, fontWeight: "bold", color: UI_KIT.accentOrange }}>
                                  {inputVal.timeMinutes || "15"} min
                                </Text>
                              </View>

                              {/* Botón Circular Tactile (+) */}
                              <TouchableOpacity
                                onPress={() => {
                                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                  const cur = parseInt(inputVal.timeMinutes || "15") || 15;
                                  const nextVal = cur + 1;
                                  setInputs((prev) => ({
                                    ...prev,
                                    [exIndex]: { ...inputVal, timeMinutes: nextVal.toString() },
                                  }));
                                }}
                                style={styles.tactileCircleButton}
                              >
                                <Ionicons name="add" size={18} color={UI_KIT.accentOrange} />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>

                        {/* Botón Registrar Serie de Cardio */}
                        <TouchableOpacity
                          onPress={() => handleAddSet(exIndex)}
                          style={[styles.gradientButton, { backgroundColor: UI_KIT.accentOrange, marginTop: 2 }]}
                        >
                          <Ionicons name="flame" size={18} color={UI_KIT.onPrimary} />
                          <Text style={[styles.gradientButtonText, { color: UI_KIT.onPrimary }]}>
                            + Registrar Cardio ({inputVal.timeMinutes || "15"} min • {inputVal.intensity || "Moderada"})
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      /* --------------------------------------------------------------------- */
                      /* INTERFAZ DE FUERZA (GYM & PESO CORPORAL)                             */
                      /* --------------------------------------------------------------------- */
                      /* INTERFAZ DE FUERZA (GYM & PESO CORPORAL CONSISTENTES)               */
                      /* --------------------------------------------------------------------- */
                      <View style={{ gap: 14 }}>
                        {isBodyweight ? (
                          /* SECCIÓN PESO CORPORAL: Selector de modo y carga abajo ("enter") */
                          <View style={{ gap: 10 }}>
                            {/* Fila Superior: Badge y Modos (Solo cuerpo / + Lastre / - Con Ayuda) */}
                            {/* Segmented Pill Selector de Modo (idéntico a la intensidad de cardio) */}
                            <View
                              style={{
                                flexDirection: "row",
                                backgroundColor: UI_KIT.inset,
                                borderRadius: 16,
                                padding: 3,
                                borderWidth: 1,
                                borderColor: UI_KIT.insetBorder,
                                width: "100%",
                              }}
                            >
                              {(() => {
                                const currentBwMode =
                                  inputVal.bodyweightMode ||
                                  (parseFloat(inputVal.peso) < 0
                                    ? "ayuda"
                                    : parseFloat(inputVal.peso) > 0
                                      ? "lastre"
                                      : "solo");

                                const modeOptions: { id: "solo" | "lastre" | "ayuda"; label: string }[] = [
                                  { id: "solo", label: "Solo cuerpo" },
                                  { id: "lastre", label: "+ Lastre" },
                                  { id: "ayuda", label: "- Con Ayuda" },
                                ];

                                return modeOptions.map((opt) => {
                                  const isSelected = currentBwMode === opt.id;
                                  return (
                                    <TouchableOpacity
                                      key={opt.id}
                                      onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        if (opt.id === "solo") {
                                          setInputs((prev) => ({
                                            ...prev,
                                            [exIndex]: { ...inputVal, bodyweightMode: "solo", peso: "0" },
                                          }));
                                        } else if (opt.id === "lastre") {
                                          const prevVal = parseFloat(inputVal.peso) || 0;
                                          const nextVal = prevVal <= 0 ? (currentUnit === "lb" ? 10 : 2.5) : prevVal;
                                          setInputs((prev) => ({
                                            ...prev,
                                            [exIndex]: { ...inputVal, bodyweightMode: "lastre", peso: nextVal.toString() },
                                          }));
                                        } else {
                                          const prevVal = parseFloat(inputVal.peso) || 0;
                                          const nextVal = prevVal >= 0 ? (currentUnit === "lb" ? -10 : -5) : prevVal;
                                          setInputs((prev) => ({
                                            ...prev,
                                            [exIndex]: { ...inputVal, bodyweightMode: "ayuda", peso: nextVal.toString() },
                                          }));
                                        }
                                      }}
                                      style={{ flex: 1 }}
                                    >
                                      {isSelected ? (
                                        <View
                                          style={{
                                            paddingVertical: 8,
                                            borderRadius: 12,
                                            alignItems: "center",
                                            justifyContent: "center",
                                            backgroundColor: UI_KIT.accentOrange,
                                          }}
                                        >
                                          <Text
                                            style={{
                                              fontSize: 12,
                                              fontWeight: "bold",
                                              color: UI_KIT.onPrimary,
                                            }}
                                          >
                                            {opt.label}
                                          </Text>
                                        </View>
                                      ) : (
                                        <View
                                          style={{
                                            paddingVertical: 8,
                                            borderRadius: 12,
                                            alignItems: "center",
                                            justifyContent: "center",
                                          }}
                                        >
                                          <Text
                                            style={{
                                              fontSize: 12,
                                              fontWeight: "600",
                                              color: UI_KIT.textSecondary,
                                            }}
                                          >
                                            {opt.label}
                                          </Text>
                                        </View>
                                      )}
                                    </TouchableOpacity>
                                  );
                                });
                              })()}
                            </View>

                            {/* Fila Inferior ("abajo / enter"): Control de peso según el modo */}
                            {(() => {
                              const currentBwMode =
                                inputVal.bodyweightMode ||
                                (parseFloat(inputVal.peso) < 0
                                  ? "ayuda"
                                  : parseFloat(inputVal.peso) > 0
                                    ? "lastre"
                                    : "solo");

                              if (currentBwMode === "solo") {
                                return (
                                  <View
                                    style={{
                                      flexDirection: "row",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      backgroundColor: UI_KIT.inset,
                                      paddingVertical: 10,
                                      paddingHorizontal: 14,
                                      borderRadius: 12,
                                      borderWidth: 1,
                                      borderColor: UI_KIT.insetBorder,
                                    }}
                                  >
                                    <Text style={{ fontSize: 13, color: UI_KIT.textSecondary, fontWeight: "600" }}>
                                      Solo peso corporal
                                    </Text>
                                    <Text style={{ fontSize: 14, fontWeight: "bold", color: UI_KIT.accentOrange }}>
                                      0 {currentUnit.toUpperCase()}
                                    </Text>
                                  </View>
                                );
                              }

                              return (
                                <View style={{ gap: 8 }}>
                                  <View
                                    style={{
                                      flexDirection: "row",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                    }}
                                  >
                                    {/* Label y Selector KG / LB */}
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>

                                      <View
                                        style={{
                                          flexDirection: "row",
                                          backgroundColor: UI_KIT.inset,
                                          borderRadius: 14,
                                          padding: 2,
                                          borderWidth: 1,
                                          borderColor: UI_KIT.insetBorder,
                                        }}
                                      >
                                        <TouchableOpacity
                                          onPress={() => {
                                            if (currentUnit === "kg") return;
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            const cur = parseFloat(inputVal.peso) || 0;
                                            const converted = convertWeightToggle(cur, "kg");
                                            setInputs((prev) => ({
                                              ...prev,
                                              [exIndex]: { ...inputVal, unit: "kg", peso: converted.toString() },
                                            }));
                                          }}
                                        >
                                          <View
                                            style={{
                                              paddingHorizontal: 10,
                                              paddingVertical: 5,
                                              borderRadius: 12,
                                              backgroundColor: currentUnit === "kg" ? UI_KIT.accentOrange : "transparent",
                                            }}
                                          >
                                            <Text
                                              style={{
                                                fontSize: 11,
                                                fontWeight: "bold",
                                                color: currentUnit === "kg" ? UI_KIT.onPrimary : UI_KIT.textMuted,
                                              }}
                                            >
                                              KG
                                            </Text>
                                          </View>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                          onPress={() => {
                                            if (currentUnit === "lb") return;
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            const cur = parseFloat(inputVal.peso) || 0;
                                            const converted = convertWeightToggle(cur, "lb");
                                            setInputs((prev) => ({
                                              ...prev,
                                              [exIndex]: { ...inputVal, unit: "lb", peso: converted.toString() },
                                            }));
                                          }}
                                        >
                                          <View
                                            style={{
                                              paddingHorizontal: 10,
                                              paddingVertical: 5,
                                              borderRadius: 12,
                                              backgroundColor: currentUnit === "lb" ? UI_KIT.accentOrange : "transparent",
                                            }}
                                          >
                                            <Text
                                              style={{
                                                fontSize: 11,
                                                fontWeight: "bold",
                                                color: currentUnit === "lb" ? UI_KIT.onPrimary : UI_KIT.textMuted,
                                              }}
                                            >
                                              LB
                                            </Text>
                                          </View>
                                        </TouchableOpacity>
                                      </View>
                                    </View>

                                    {/* Stepper Peso con botones */}
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                      <TouchableOpacity
                                        onPress={() => {
                                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                          const step = currentUnit === "lb" ? 5 : userSettings.weightIncrement;
                                          if (currentBwMode === "lastre") {
                                            const cur = Math.abs(parseFloat(inputVal.peso) || 0);
                                            const nextPeso = Math.max(0, Math.round((cur - step) * 10) / 10);
                                            setInputs((prev) => ({
                                              ...prev,
                                              [exIndex]: { ...inputVal, peso: nextPeso.toString() },
                                            }));
                                          } else {
                                            const cur = Math.abs(parseFloat(inputVal.peso) || 0);
                                            const nextPeso = Math.max(0, Math.round((cur - step) * 10) / 10);
                                            setInputs((prev) => ({
                                              ...prev,
                                              [exIndex]: { ...inputVal, peso: (-nextPeso).toString() },
                                            }));
                                          }
                                        }}
                                        style={styles.tactileCircleButton}
                                      >
                                        <Ionicons name="remove" size={18} color={UI_KIT.textPrimary} />
                                      </TouchableOpacity>

                                      <View
                                        style={{
                                          minWidth: 84,
                                          paddingVertical: 6,
                                          paddingHorizontal: 8,
                                          backgroundColor: UI_KIT.inset,
                                          borderRadius: 12,
                                          borderWidth: 1,
                                          borderColor: UI_KIT.insetBorder,
                                          alignItems: "center",
                                        }}
                                      >
                                        <TextInput
                                          editable={false}
                                          style={{
                                            fontSize: 17,
                                            fontWeight: "800",
                                            color: UI_KIT.textPrimary,
                                            textAlign: "center",
                                            padding: 0,
                                          }}
                                          value={
                                            currentBwMode === "lastre"
                                              ? `+${Math.abs(parseFloat(inputVal.peso) || 0)}`
                                              : `-${Math.abs(parseFloat(inputVal.peso) || 0)}`
                                          }
                                        />
                                      </View>

                                      <TouchableOpacity
                                        onPress={() => {
                                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                          const step = currentUnit === "lb" ? 5 : userSettings.weightIncrement;
                                          if (currentBwMode === "lastre") {
                                            const cur = Math.abs(parseFloat(inputVal.peso) || 0);
                                            const nextPeso = Math.round((cur + step) * 10) / 10;
                                            setInputs((prev) => ({
                                              ...prev,
                                              [exIndex]: { ...inputVal, peso: nextPeso.toString() },
                                            }));
                                          } else {
                                            const cur = Math.abs(parseFloat(inputVal.peso) || 0);
                                            const nextPeso = Math.round((cur + step) * 10) / 10;
                                            setInputs((prev) => ({
                                              ...prev,
                                              [exIndex]: { ...inputVal, peso: (-nextPeso).toString() },
                                            }));
                                          }
                                        }}
                                        style={styles.tactileCircleButton}
                                      >
                                        <Ionicons name="add" size={18} color={UI_KIT.accentOrange} />
                                      </TouchableOpacity>
                                    </View>
                                  </View>

                                </View>
                              );
                            })()}
                          </View>
                        ) : (
                          /* EJERCICIO GYM CONVENCIONAL */
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                              <Text style={{ fontSize: 12, color: UI_KIT.textSecondary, fontWeight: "bold" }}>
                                PESO
                              </Text>

                              {/* Segmented Pill Selector KG / LB */}
                              <View
                                style={{
                                  flexDirection: "row",
                                  backgroundColor: UI_KIT.inset,
                                  borderRadius: 14,
                                  padding: 2,
                                  borderWidth: 1,
                                  borderColor: UI_KIT.insetBorder,
                                }}
                              >
                                <TouchableOpacity
                                  onPress={() => {
                                    if (currentUnit === "kg") return;
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    const cur = parseFloat(inputVal.peso) || 0;
                                    const converted = convertWeightToggle(cur, "kg");
                                    setInputs((prev) => ({
                                      ...prev,
                                      [exIndex]: { ...inputVal, unit: "kg", peso: converted.toString() },
                                    }));
                                  }}
                                >
                                  <View
                                    style={{
                                      paddingHorizontal: 10,
                                      paddingVertical: 5,
                                      borderRadius: 12,
                                      backgroundColor: currentUnit === "kg" ? UI_KIT.accentOrange : "transparent",
                                    }}
                                  >
                                    <Text
                                      style={{
                                        fontSize: 11,
                                        fontWeight: "bold",
                                        color: currentUnit === "kg" ? UI_KIT.onPrimary : UI_KIT.textMuted,
                                      }}
                                    >
                                      KG
                                    </Text>
                                  </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                  onPress={() => {
                                    if (currentUnit === "lb") return;
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    const cur = parseFloat(inputVal.peso) || 0;
                                    const converted = convertWeightToggle(cur, "lb");
                                    setInputs((prev) => ({
                                      ...prev,
                                      [exIndex]: { ...inputVal, unit: "lb", peso: converted.toString() },
                                    }));
                                  }}
                                >
                                  <View
                                    style={{
                                      paddingHorizontal: 10,
                                      paddingVertical: 5,
                                      borderRadius: 12,
                                      backgroundColor: currentUnit === "lb" ? UI_KIT.accentOrange : "transparent",
                                    }}
                                  >
                                    <Text
                                      style={{
                                        fontSize: 11,
                                        fontWeight: "bold",
                                        color: currentUnit === "lb" ? UI_KIT.onPrimary : UI_KIT.textMuted,
                                      }}
                                    >
                                      LB
                                    </Text>
                                  </View>
                                </TouchableOpacity>
                              </View>
                            </View>

                            {/* Stepper Peso con Botones Circulares Tactile */}
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                              <TouchableOpacity
                                onPress={() => {
                                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                  const step = currentUnit === "lb" ? 5 : userSettings.weightIncrement;
                                  const currentPeso = parseFloat(inputVal.peso) || 0;
                                  const nextPeso = Math.max(0, Math.round((currentPeso - step) * 10) / 10);
                                  setInputs((prev) => ({
                                    ...prev,
                                    [exIndex]: { ...inputVal, peso: nextPeso.toString() },
                                  }));
                                }}
                                style={styles.tactileCircleButton}
                              >
                                <Ionicons name="remove" size={18} color={UI_KIT.textPrimary} />
                              </TouchableOpacity>

                              <View
                                style={{
                                  minWidth: 80,
                                  paddingVertical: 6,
                                  paddingHorizontal: 8,
                                  backgroundColor: UI_KIT.inset,
                                  borderRadius: 12,
                                  borderWidth: 1,
                                  borderColor: UI_KIT.insetBorder,
                                  alignItems: "center",
                                }}
                              >
                                <TextInput
                                  editable={false}
                                  style={{
                                    fontSize: 17,
                                    fontWeight: "800",
                                    color: UI_KIT.textPrimary,
                                    textAlign: "center",
                                    padding: 0,
                                  }}
                                  value={inputVal.peso}
                                />
                              </View>

                              <TouchableOpacity
                                onPress={() => {
                                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                  const step = currentUnit === "lb" ? 5 : userSettings.weightIncrement;
                                  const currentPeso = parseFloat(inputVal.peso) || 0;
                                  const nextPeso = Math.round((currentPeso + step) * 10) / 10;
                                  setInputs((prev) => ({
                                    ...prev,
                                    [exIndex]: { ...inputVal, peso: nextPeso.toString() },
                                  }));
                                }}
                                style={styles.tactileCircleButton}
                              >
                                <Ionicons name="add" size={18} color={UI_KIT.accentOrange} />
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}

                        {/* Fila Stepper Repeticiones */}
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <Text style={{ fontSize: 12, color: UI_KIT.textSecondary, fontWeight: "bold" }}>
                            REPETICIONES
                          </Text>

                          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            <TouchableOpacity
                              onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                const currentReps = parseInt(inputVal.reps) || 0;
                                const nextReps = Math.max(1, currentReps - 1);
                                setInputs((prev) => ({
                                  ...prev,
                                  [exIndex]: { ...inputVal, reps: nextReps.toString() },
                                }));
                              }}
                              style={styles.tactileCircleButton}
                            >
                              <Ionicons name="remove" size={18} color={UI_KIT.textPrimary} />
                            </TouchableOpacity>

                            <View
                              style={{
                                minWidth: 80,
                                paddingVertical: 6,
                                paddingHorizontal: 8,
                                backgroundColor: UI_KIT.inset,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: UI_KIT.insetBorder,
                                alignItems: "center",
                              }}
                            >
                              <TextInput
                                editable={false}
                                style={{
                                  fontSize: 17,
                                  fontWeight: "800",
                                  color: UI_KIT.textPrimary,
                                  textAlign: "center",
                                  padding: 0,
                                }}
                                value={inputVal.reps}
                              />
                            </View>

                            <TouchableOpacity
                              onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                const currentReps = parseInt(inputVal.reps) || 0;
                                const nextReps = currentReps + 1;
                                setInputs((prev) => ({
                                  ...prev,
                                  [exIndex]: { ...inputVal, reps: nextReps.toString() },
                                }));
                              }}
                              style={styles.tactileCircleButton}
                            >
                              <Ionicons name="add" size={18} color={UI_KIT.accentOrange} />
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* Botón Registrar Serie Fuerza / Peso Corporal */}
                        <TouchableOpacity
                          onPress={() => handleAddSet(exIndex)}
                          style={[styles.gradientButton, { backgroundColor: UI_KIT.accentOrange, marginTop: 2 }]}
                        >
                          <Ionicons name="checkmark" size={18} color={UI_KIT.onPrimary} />
                          <Text style={[styles.gradientButtonText, { color: UI_KIT.onPrimary }]}>
                            + Registrar Serie
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}

          {/* Botón Agregar Ejercicio con estilo Inset/Tactile */}
          <TouchableOpacity
            style={{
              backgroundColor: UI_KIT.card,
              borderColor: UI_KIT.cardBorder,
              borderWidth: 1.5,
              borderRadius: 16,
              paddingVertical: 14,
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              gap: 8,
              marginVertical: 10,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 2,
            }}
            onPress={() => setIsPickerVisible(true)}
          >
            <Ionicons name="add-circle" size={22} color={UI_KIT.accentOrange} />
            <Text style={{ color: UI_KIT.textPrimary, fontWeight: "bold", fontSize: 15 }}>
              + Agregar Ejercicio
            </Text>
          </TouchableOpacity>

          {/* Botón Finalizar Entrenamiento con Sunset Gradient grande */}
          {activeExercises.length > 0 && (
            <TouchableOpacity
              style={{
                marginBottom: 40,
                marginTop: 4,
              }}
              onPress={handleFinishWorkout}
            >
              <View
                style={[styles.gradientButton, { height: 48, borderRadius: 16, backgroundColor: UI_KIT.accentOrange }]}
              >
                <Ionicons name="checkmark-done-circle" size={22} color={UI_KIT.onPrimary} />
                <Text style={[styles.gradientButtonText, { fontSize: 16, color: UI_KIT.onPrimary }]}>
                  Finalizar Entrenamiento
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Modal Selector de Ejercicios adaptado con el UI Kit */}
        <Modal
          visible={isPickerVisible}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setIsPickerVisible(false)}
        >
          <View style={[globalStyles.container, { backgroundColor: UI_KIT.bg, flex: 1 }]}>
            <View style={[globalStyles.header, { marginBottom: 15 }]}>
              <Text style={[globalStyles.title, { color: UI_KIT.textPrimary }]}>
                Seleccionar Ejercicio
              </Text>
              <TouchableOpacity
                onPress={() => setIsPickerVisible(false)}
                style={styles.tactileCircleButton}
              >
                <Ionicons name="close" size={20} color={UI_KIT.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Barra de Búsqueda Dark Inset */}
            <View
              style={{
                flexDirection: "row",
                gap: 10,
                alignItems: "center",
                marginBottom: 12,
                paddingHorizontal: 16,
                paddingVertical: 10,
                backgroundColor: UI_KIT.inset,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: UI_KIT.insetBorder,
              }}
            >
              <Ionicons name="search" size={20} color={UI_KIT.textMuted} />
              <TextInput
                placeholder="Buscar Ejercicios (pesas, cardio...)"
                placeholderTextColor={UI_KIT.textMuted}
                style={{ flex: 1, color: UI_KIT.textPrimary, fontSize: 14 }}
                onChangeText={(text) => setSearch(text)}
                value={search}
              />
            </View>

            {/* Botón: Crear Ejercicio Personalizado */}
            <TouchableOpacity
              style={{
                backgroundColor: UI_KIT.card,
                borderColor: UI_KIT.cardBorder,
                borderWidth: 1.5,
                borderRadius: 14,
                paddingVertical: 11,
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
              <Ionicons name="add-circle-outline" size={20} color={UI_KIT.accentOrange} />
              <Text style={{ color: UI_KIT.textPrimary, fontWeight: "bold", fontSize: 13 }}>
                + Crear Ejercicio Personalizado
              </Text>
            </TouchableOpacity>

            {/* Filtros de Músculo y Cardio */}
            <View style={{ maxHeight: 60, marginBottom: 10 }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, alignItems: "center" }}
              >
                {["Todos", "Gym", "Cardio", "Peso corporal", "Pecho", "Brazos", "Espalda", "Pierna", "Abdomen"].map(
                  (name) => {
                    const isSelected = (muscleSelected === "" && name === "Todos") || muscleSelected === name;
                    return (
                      <TouchableOpacity
                        key={name}
                        onPress={() => setMuscleSelected(name)}
                      >
                        {isSelected ? (
                          <View
                            style={{
                              paddingHorizontal: 16,
                              paddingVertical: 8,
                              borderRadius: 20,
                              backgroundColor: UI_KIT.accentOrange,
                            }}
                          >
                            <Text style={{ color: UI_KIT.onPrimary, fontWeight: "bold", fontSize: 13 }}>
                              {name}
                            </Text>
                          </View>
                        ) : (
                          <View
                            style={{
                              paddingHorizontal: 16,
                              paddingVertical: 8,
                              borderRadius: 20,
                              backgroundColor: UI_KIT.card,
                              borderWidth: 1,
                              borderColor: UI_KIT.cardBorder,
                            }}
                          >
                            <Text style={{ color: UI_KIT.textSecondary, fontWeight: "600", fontSize: 13 }}>
                              {name}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  }
                )}
              </ScrollView>
            </View>

            {/* Lista de Ejercicios */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              {filteredExercises.map((exercise) => {
                const isAlreadyAdded = activeExercises.some(
                  (e) => e.exerciseInfo.id === exercise.id
                );
                const exCategory = getExerciseCategory(exercise);
                const isCardio = exCategory === "Cardio";
                const isBodyweight = exCategory === "Peso corporal";

                return (
                  <View
                    key={exercise.id}
                    style={[
                      styles.uiCard,
                      {
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        opacity: isAlreadyAdded ? 0.5 : 1,
                        paddingVertical: 12,
                        paddingHorizontal: 14,
                        marginBottom: 10,
                        borderLeftWidth: 3,
                        borderLeftColor: isCardio
                          ? UI_KIT.accentOrange
                          : isBodyweight
                            ? "#22c55e"
                            : UI_KIT.cardBorder,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={{ flexDirection: "row", gap: 12, alignItems: "center", flex: 1 }}
                      activeOpacity={0.7}
                      onPress={() => {
                        setIsPickerVisible(false);
                        router.push(`/exercises/DetailsExercise/${exercise.id}` as any);
                      }}
                    >
                      <Image
                        source={getExerciseImage(exercise.id, exercise.urlimage)}
                        style={{ width: 48, height: 48, borderRadius: 10 }}
                      />
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <Text style={{ fontSize: 15, fontWeight: "bold", color: UI_KIT.textPrimary }}>
                            {exercise.nombre}
                          </Text>
                          {isCardio && (
                            <Ionicons name="flame" size={13} color={UI_KIT.accentOrange} />
                          )}
                          {isBodyweight && (
                            <Ionicons name="body" size={13} color="#22c55e" />
                          )}
                        </View>
                        <Text style={{ fontSize: 12, color: UI_KIT.textMuted, marginTop: 2 }}>
                          {isCardio
                            ? "Cardio"
                            : isBodyweight
                              ? "Peso corporal"
                              : exercise.musculo}{" "}
                          • {exercise.equipamiento}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      disabled={isAlreadyAdded}
                      onPress={() => handleAddExerciseToWorkout(exercise)}
                      style={{ padding: 4 }}
                    >
                      <Ionicons
                        name={
                          isAlreadyAdded
                            ? "checkmark-circle"
                            : "add-circle"
                        }
                        size={30}
                        color={isAlreadyAdded ? UI_KIT.success : UI_KIT.accentOrange}
                      />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </Modal>

        {/* Modal Prescripción Coach RIR */}
        {selectedCoachIndex !== null && activeExercises[selectedCoachIndex] && (() => {
          const targetEx = activeExercises[selectedCoachIndex];
          const activeCardUnit: WeightUnit = inputs[selectedCoachIndex]?.unit || userSettings.unit || "kg";
          return (
            <CoachRIRModal
              visible={selectedCoachIndex !== null}
              onClose={() => setSelectedCoachIndex(null)}
              exercise={targetEx.exerciseInfo}
              lastSession={targetEx.lastSession}
              personalBest={targetEx.personalBest}
              prescription={calculateRIRPrescription(
                targetEx.exerciseInfo,
                targetEx.lastSession,
                targetEx.personalBest,
                activeCardUnit
              )}
              onApplyOption={(optionType, appliedUnit) =>
                handleApplyCoachOption(selectedCoachIndex, optionType, appliedUnit)
              }
              userUnit={activeCardUnit}
            />
          );
        })()}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  uiCard: {
    backgroundColor: UI_KIT.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: UI_KIT.cardBorder,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  tactileCircleButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: UI_KIT.tactileButton,
    borderWidth: 1.5,
    borderColor: UI_KIT.tactileBorder,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 2,
  },
  gradientButton: {
    height: 44,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  gradientButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 14,
    letterSpacing: 0.2,
  },
});
