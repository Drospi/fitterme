import ShareButton from "@/components/ShareButton";
import ThemeConfirmModal from "@/components/ThemeConfirmModal";
import { useTheme } from "@/context/ThemeContext";
import { getSettings, toDisplayWeight, UserSettings } from "@/store/conf";
import {
  deleteExercise,
  ExerciseCatalogItem,
  getExerciseById,
  getExerciseCategory,
} from "@/store/excercise";
import {
  calculate1RM,
  deleteExerciseHistoryLog,
  ExerciseHistory,
  getHistoryByExerciseId,
  isBetterSet,
} from "@/store/historyExcercise";
import { getGlobalStyles } from "@/styles/global";
import {
  calculateHistoricalSessionMetrics,
  calculateProgressionStats,
  estimateDateForTarget,
  projectPerformanceAtDays,
} from "@/utils/exerciseProgressionCalculator";
import { getExerciseImage } from "@/utils/imageMap";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import Popover from "react-native-popover-view";
import Toast from "react-native-toast-message";

interface ThemedInfoPopoverProps {
  title: string;
  content: string;
  icon?: keyof typeof Ionicons.glyphMap;
  triggerIcon?: keyof typeof Ionicons.glyphMap;
  triggerColor?: string;
  colors: any;
}

const ThemedInfoPopover: React.FC<ThemedInfoPopoverProps> = ({
  title,
  content,
  icon = "information-circle",
  triggerIcon = "information-circle-outline",
  triggerColor,
  colors,
}) => {
  return (
    <Popover
      popoverStyle={{
        backgroundColor: colors.surface,
        borderRadius: 14,
        borderWidth: 0,
        borderColor: "transparent",
        shadowColor: "transparent",
        shadowOpacity: 0,
        elevation: 0,
      }}
      from={
        <TouchableOpacity
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{
            padding: 3,
            borderRadius: 10,
            backgroundColor: (triggerColor || colors.primary) + "18",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons
            name={triggerIcon}
            size={16}
            color={triggerColor || colors.primary}
          />
        </TouchableOpacity>
      }
    >
      <View
        style={{
          padding: 14,
          maxWidth: 280,
          backgroundColor: colors.surface,
          borderRadius: 14,
          borderWidth: 0,
          borderColor: "transparent",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 7,
            marginBottom: 6,
          }}
        >
          <Ionicons name={icon} size={18} color={triggerColor || colors.primary} />
          <Text
            style={{
              fontWeight: "bold",
              fontSize: 14,
              color: colors.text,
              flex: 1,
            }}
          >
            {title}
          </Text>
        </View>
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: 12,
            lineHeight: 18,
          }}
        >
          {content}
        </Text>
      </View>
    </Popover>
  );
};

const DetailsExerciseScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  const [exercise, setExercise] = useState<ExerciseCatalogItem | null>(null);
  const [history, setHistory] = useState<ExerciseHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<"1M" | "3M" | "6M">("1M");
  const [showProjection, setShowProjection] = useState<boolean>(true);

  // Modal para detalle de punto en la gráfica (1RM y volumen)
  const [selectedPointDetail, setSelectedPointDetail] = useState<{
    dateStr: string;
    oneRM: number;
    peakWeight: number;
    peakReps: number;
    groupedText: string;
    totalVolume: number;
  } | null>(null);

  // Modal para punto proyectado
  const [projectedInfo, setProjectedInfo] = useState<{
    days: number;
    dateStr: string;
    value: number;
    projectionText?: string;
  } | null>(null);

  // Calculadora de Fecha Futura y Objetivo
  const [calculatorMode, setCalculatorMode] = useState<"DATE" | "TARGET">("DATE");
  const [calculatorDays, setCalculatorDays] = useState<number>(30);
  const [targetWeightInput, setTargetWeightInput] = useState<string>("");
  const [targetRepsInput, setTargetRepsInput] = useState<string>("10");
  const [targetSetsInput, setTargetSetsInput] = useState<string>("3");

  const [userSettings, setUserSettings] = useState<UserSettings>({
    unit: "kg",
    weightIncrement: 2.5,
    defaultRestTimer: 90,
  });

  const getMonthName = (dateString: string) => {
    if (!dateString || typeof dateString !== "string" || !dateString.includes("-")) return "";
    const parts = dateString.split("-");
    if (parts.length < 2) return "";
    const month = parseInt(parts[1], 10);
    const months = [
      "ENE",
      "FEB",
      "MAR",
      "ABR",
      "MAY",
      "JUN",
      "JUL",
      "AGO",
      "SEP",
      "OCT",
      "NOV",
      "DIC",
    ];
    return months[month - 1] || "";
  };

  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const loadData = async () => {
    if (!id) return;
    try {
      const s = await getSettings();
      setUserSettings(s);
      const ex = await getExerciseById(id);
      setExercise(ex);

      if (ex) {
        const data = await getHistoryByExerciseId(ex.id);
        setHistory(data);
      }
    } catch (error) {
      console.error("Error al cargar detalles del ejercicio:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [id])
  );

  const [logToDelete, setLogToDelete] = useState<ExerciseHistory | null>(null);
  const [showDeleteExerciseModal, setShowDeleteExerciseModal] = useState<boolean>(false);

  const handleDelete = () => {
    if (!exercise) return;
    if (!exercise.isCustom) {
      Toast.show({
        type: "error",
        text1: "No permitido",
        text2: "Solo los ejercicios personalizados pueden ser eliminados.",
      });
      return;
    }
    setShowDeleteExerciseModal(true);
  };

  const handleConfirmDeleteExercise = async () => {
    if (!exercise) return;
    setShowDeleteExerciseModal(false);
    await deleteExercise(exercise.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Toast.show({
      type: "success",
      text1: "Ejercicio Eliminado",
      text2: `"${exercise.nombre}" se eliminó del catálogo.`,
    });
    router.back();
  };

  const handlePromptDeleteLog = (logItem: ExerciseHistory) => {
    setLogToDelete(logItem);
  };

  const handleConfirmDeleteLog = async () => {
    if (!logToDelete || !exercise) return;
    try {
      await deleteExerciseHistoryLog(logToDelete.id, logToDelete.date, exercise.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: "success",
        text1: "Récord eliminado",
        text2: "El historial y los récords se han recalculado automáticamente.",
      });
      await loadData();
    } catch (error) {
      console.error("Error al eliminar registro:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se pudo eliminar el registro.",
      });
    } finally {
      setLogToDelete(null);
    }
  };

  const handleEdit = () => {
    if (!exercise) return;
    router.push(`/exercises/edit?id=${exercise.id}` as any);
  };

  // Filtrado de historial por rango de tiempo (1M, 3M, 6M)
  const filteredHistory = useMemo(() => {
    if (!history.length) return [];
    const now = Date.now();
    const daysLimit = timeRange === "1M" ? 30 : timeRange === "3M" ? 90 : 180;
    const cutoff = now - daysLimit * 24 * 60 * 60 * 1000;
    const filtered = history.filter((h) => {
      const t = new Date(h.date).getTime();
      return isNaN(t) || t >= cutoff;
    });
    // Si no hay suficientes registros en la ventana, mostramos los disponibles
    return filtered.length > 0 ? filtered : history.slice(0, 5);
  }, [history, timeRange]);

  // Historial ordenado cronológicamente (antiguo a reciente)
  const chronologicalHistory = useMemo(() => {
    return [...filteredHistory].reverse().map((h) => {
      const setsList =
        h.sets && h.sets.length > 0
          ? h.sets
          : [{ peso: h.bestWeight, reps: h.bestReps || 1 }];
      const totalReps = setsList.reduce((sum, s) => sum + (s.reps || 0), 0);
      const avgReps =
        setsList.length > 0 ? Number((totalReps / setsList.length).toFixed(2)) : 0;
      return {
        ...h,
        setsList,
        avgReps,
      };
    });
  }, [filteredHistory]);

  const exCategory = useMemo(() => getExerciseCategory(exercise), [exercise]);
  const isBodyweight = exCategory === "Peso corporal";
  const isCardio = exCategory === "Cardio";

  // Estadísticas globales del ejercicio
  const stats = useMemo(() => {
    if (!history.length)
      return { maxWeight: 0, maxReps: 0, totalSets: 0, bestVolume: 0 };

    let maxWeight = 0;
    let maxReps = 0;
    let totalSets = 0;
    let bestVolume = 0;

    history.forEach((h) => {
      const bestWInLog = Math.max(h.bestWeight || 0, ...(h.sets?.map((s) => s.peso || 0) || []));
      const bestRInLog = Math.max(h.bestReps || 0, ...(h.sets?.map((s) => s.reps || 0) || []));
      if (bestWInLog > maxWeight) maxWeight = bestWInLog;
      if (bestRInLog > maxReps) maxReps = bestRInLog;
      totalSets += (h.sets?.length || 1);
      if (h.totalVolume > bestVolume) bestVolume = h.totalVolume;
    });

    return { maxWeight, maxReps, totalSets, bestVolume };
  }, [history]);

  // Métricas históricas completas (1RM, peso, reps y volumen por sesión)
  const historicalMetrics = useMemo(() => {
    return calculateHistoricalSessionMetrics(chronologicalHistory, userSettings.unit);
  }, [chronologicalHistory, userSettings.unit]);

  // Estadísticas globales de progresión y regresión de 1RM
  const progressionStats = useMemo(() => {
    return calculateProgressionStats(history, userSettings.unit);
  }, [history, userSettings.unit]);

  // Curva de datos para la gráfica: Fuerza Estimada (1RM) por sesión
  const rawReversedData = useMemo(() => {
    if (!historicalMetrics.length) return [0];
    return historicalMetrics.map((h) => h.display1RM);
  }, [historicalMetrics]);

  const rawReversedLabels = useMemo(() => {
    return historicalMetrics.map((h, index) => {
      if (index === historicalMetrics.length - 1) return "ÚLT";
      const prevDate = historicalMetrics[index - 1]?.date;
      const currMonth = getMonthName(h.date);
      const prevMonth = prevDate ? getMonthName(prevDate) : null;
      return currMonth !== prevMonth ? currMonth : "";
    });
  }, [historicalMetrics]);

  // Datos para la gráfica con o sin proyección
  const isSinglePoint = rawReversedData.length === 1;

  const displayChartData = useMemo(() => {
    if (!historicalMetrics.length) return [0];
    if (showProjection) {
      const p15 = Number(
        (progressionStats.latest1RM + progressionStats.dailyRate1RM * 15).toFixed(1)
      );
      const p30 = Number(
        (progressionStats.latest1RM + progressionStats.dailyRate1RM * 30).toFixed(1)
      );
      return [...rawReversedData, p15, p30];
    }
    if (isSinglePoint) {
      return [rawReversedData[0], rawReversedData[0]];
    }
    return rawReversedData;
  }, [historicalMetrics.length, showProjection, rawReversedData, progressionStats, isSinglePoint]);

  const displayChartLabels = useMemo(() => {
    if (!historicalMetrics.length) return [""];
    if (showProjection) {
      return [...rawReversedLabels, "+15d", "+1m"];
    }
    if (isSinglePoint) {
      return [rawReversedLabels[0] || "Actual", rawReversedLabels[0] || "Actual"];
    }
    return rawReversedLabels;
  }, [historicalMetrics.length, showProjection, rawReversedLabels, isSinglePoint]);

  // Manejador de click en puntos de la gráfica
  const handleDataPointClick = (data: { index: number; value: number }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const historicalCount = historicalMetrics.length;

    if (showProjection && data.index >= historicalCount) {
      const projOffset = data.index - historicalCount;
      const days = projOffset === 0 ? 15 : 30;
      const proj = projectPerformanceAtDays(
        days,
        progressionStats,
        userSettings.unit,
        userSettings.weightIncrement
      );
      setProjectedInfo({
        days,
        dateStr: proj.dateStr,
        value: proj.projected1RM,
        projectionText: proj.fullProjectionText,
      });
      return;
    }

    const pointIndex = isSinglePoint ? 0 : data.index;
    const item = historicalMetrics[pointIndex];
    if (item) {
      const grouped: string[] = [];
      const counts: Record<string, number> = {};
      item.validSets.forEach((s) => {
        const key =
          s.peso <= 0
            ? `Corporal x ${s.reps}`
            : `${toDisplayWeight(s.peso, userSettings.unit)}${userSettings.unit} x ${s.reps}`;
        counts[key] = (counts[key] || 0) + 1;
      });
      Object.entries(counts).forEach(([k, c]) => {
        grouped.push(c > 1 ? `${k} x ${c}` : k);
      });

      setSelectedPointDetail({
        dateStr: formatDateDisplay(item.date),
        oneRM: item.display1RM,
        peakWeight: item.displayWeight,
        peakReps: item.repsAtPeak,
        groupedText: grouped.join(" ; "),
        totalVolume: item.displayVolume,
      });
    }
  };

  // Proyección a 30 días para la tarjeta de Predicción
  const proj30 = useMemo(() => {
    return projectPerformanceAtDays(
      30,
      progressionStats,
      userSettings.unit,
      userSettings.weightIncrement
    );
  }, [progressionStats, userSettings.unit, userSettings.weightIncrement]);

  // Modo 1: Proyección por fecha futura
  const calcDateProj = useMemo(() => {
    return projectPerformanceAtDays(
      calculatorDays,
      progressionStats,
      userSettings.unit,
      userSettings.weightIncrement
    );
  }, [calculatorDays, progressionStats, userSettings.unit, userSettings.weightIncrement]);

  // Modo 2: Calculadora de Objetivo / Target
  const targetCalcResult = useMemo(() => {
    const defaultWeight =
      progressionStats.latestWeight > 0
        ? progressionStats.latestWeight + (userSettings.weightIncrement || 2.5)
        : (userSettings.weightIncrement || 2.5);
    const parsedWeight = parseFloat(targetWeightInput);
    const w = !isNaN(parsedWeight) ? parsedWeight : defaultWeight;
    const r = parseInt(targetRepsInput, 10) || 10;
    const s = parseInt(targetSetsInput, 10) || 3;
    return estimateDateForTarget(w, r, s, progressionStats, userSettings.unit);
  }, [targetWeightInput, targetRepsInput, targetSetsInput, progressionStats, userSettings.unit, userSettings.weightIncrement]);

  const getWorkoutInsight = (historyList: ExerciseHistory[]) => {
    if (historyList.length === 0) {
      return {
        type: "EMPTY",
        title: "Sin registros aún",
        tag: "Inicia hoy",
        icon: "fitness-outline" as keyof typeof Ionicons.glyphMap,
        color: colors.textSecondary,
        shortMetric: "0 sesiones completadas",
        advice: "Registra tu primera serie para comenzar a rastrear sobrecarga progresiva y 1RM.",
      };
    }
    if (historyList.length < 2) {
      return {
        type: "STARTING",
        title: "Fase de Adaptación",
        tag: "Técnica",
        icon: "leaf-outline" as keyof typeof Ionicons.glyphMap,
        color: colors.secondary,
        shortMetric: "1ª sesión registrada",
        advice: "¡Estás empezando! Enfócate en aprender la técnica correcta y la cadencia antes de subir cargas.",
      };
    }

    const last = historyList[historyList.length - 1];
    const previous = historyList[historyList.length - 2];

    const lastSet = { peso: last.bestWeight, reps: last.bestReps };
    const prevSet = { peso: previous.bestWeight, reps: previous.bestReps };

    if (isBetterSet(lastSet, prevSet)) {
      const diffWeight = last.bestWeight - previous.bestWeight;
      const weightStr =
        diffWeight > 0
          ? `+${toDisplayWeight(diffWeight, userSettings.unit)} ${userSettings.unit}`
          : `${last.bestReps} reps (+1RM)`;
      return {
        type: "RECORD",
        title: "Sobrecarga Superada",
        tag: "¡Récord!",
        icon: "trophy" as keyof typeof Ionicons.glyphMap,
        color: colors.primary,
        shortMetric: weightStr,
        advice: `¡Excelente sesión! Has superado tu rendimiento anterior (${toDisplayWeight(last.bestWeight, userSettings.unit)} ${userSettings.unit} × ${last.bestReps} reps). Tu sobrecarga progresiva va por buen camino.`,
      };
    } else if (last.bestWeight === previous.bestWeight && last.bestReps === previous.bestReps) {
      return {
        type: "MAINTAIN",
        title: "Fuerza Consolidada",
        tag: "Estable",
        icon: "shield-checkmark" as keyof typeof Ionicons.glyphMap,
        color: colors.secondary,
        shortMetric: `${toDisplayWeight(last.bestWeight, userSettings.unit)} ${userSettings.unit} constante`,
        advice: "Mantienes un peso y repeticiones sólidos. En tu próxima sesión, intenta añadir 1 repetición extra en la primera serie para inducir sobrecarga.",
      };
    } else {
      return {
        type: "RECOVERY",
        title: "Descarga / Regulación",
        tag: "Regulación",
        icon: "refresh-circle" as keyof typeof Ionicons.glyphMap,
        color: "#F59E0B",
        shortMetric: "Volumen adaptado",
        advice: "El cuerpo a veces necesita una sesión de menor intensidad o autorregulación para disipar fatiga y consolidar adaptaciones musculares.",
      };
    }
  };

  const calculateBrzycki1RM = (weight: number, reps: number): number => {
    return Math.round(calculate1RM(weight, reps) * 10) / 10;
  };

  if (loading) {
    return (
      <View style={[globalStyles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!exercise) {
    return (
      <View style={[globalStyles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={globalStyles.cardText}>Ejercicio no encontrado.</Text>
        <TouchableOpacity onPress={() => router.back()} style={[globalStyles.button, { marginTop: 20 }]}>
          <Text style={globalStyles.buttonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const generateExerciseProgressSummary = () => {
    if (!exercise) return "";
    const unitStr = userSettings.unit.toUpperCase();
    const displayMaxWeight = toDisplayWeight(stats.maxWeight, userSettings.unit);
    const displayBestVolume = toDisplayWeight(stats.bestVolume, userSettings.unit);
    const isExCardio = getExerciseCategory(exercise) === "Cardio";
    const isExBodyweight = getExerciseCategory(exercise) === "Peso corporal";

    let text = `🏋️ Progreso de Ejercicio: ${exercise.nombre}\n`;
    text += `💪 Músculo: ${exercise.musculo} | Equipo: ${exercise.equipamiento}\n\n`;

    text += `📊 Récords y Estadísticas:\n`;
    if (isExCardio) {
      text += `• Récord Tiempo: ${stats.maxReps} min\n`;
      text += `• Total Sesiones: ${history.length} | Bloques registrados: ${stats.totalSets}\n`;
    } else if (isExBodyweight) {
      text += `• Récord Repeticiones: ${stats.maxReps} reps\n`;
      if (stats.maxWeight > 0) {
        text += `• Mayor Lastre: +${displayMaxWeight} ${unitStr}\n`;
      }
      text += `• Total Sesiones: ${history.length} | Series registradas: ${stats.totalSets}\n`;
    } else {
      text += `• Récord de Peso: ${displayMaxWeight} ${unitStr}\n`;
      text += `• Récord Repeticiones: ${stats.maxReps} reps\n`;
      if (progressionStats.latest1RM > 0) {
        text += `• 1RM Estimado: ${progressionStats.latest1RM.toFixed(1)} ${unitStr}\n`;
      }
      text += `• Mejor Volumen: ${displayBestVolume.toLocaleString()} ${unitStr}\n`;
      text += `• Total Sesiones: ${history.length} | Series registradas: ${stats.totalSets}\n`;
    }

    if (history.length > 0) {
      text += `\n🕒 Últimos entrenamientos:\n`;
      const recent = history.slice(0, 3);
      recent.forEach((log) => {
        const d = formatDateDisplay(log.date);
        const setsDesc = (log.sets || [])
          .map((s) => {
            if (isExCardio) return `${s.timeMinutes || s.reps || 0} min (${s.intensity || "Moderada"})`;
            if (isExBodyweight) {
              if (s.peso === 0) return `${s.reps} reps`;
              if (s.peso > 0) return `+${toDisplayWeight(s.peso, userSettings.unit)}${userSettings.unit} x ${s.reps}`;
              return `-${toDisplayWeight(Math.abs(s.peso), userSettings.unit)}${userSettings.unit} (Ayuda) x ${s.reps}`;
            }
            return `${s.reps}x${toDisplayWeight(s.peso, userSettings.unit)}${userSettings.unit}`;
          })
          .join(", ");
        text += `- ${d}: ${setsDesc}\n`;
      });
    }

    text += `\n🚀 ¡Registrado con Fitterme!`;
    return text;
  };

  return (
    <ScrollView style={[globalStyles.container, { flex: 1, padding: 10 }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View
        style={[
          globalStyles.header,
          {
            marginBottom: 15,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </TouchableOpacity>

        <Text style={{ fontWeight: "bold", fontSize: 20, color: colors.text, flex: 1, textAlign: "center" }} numberOfLines={1}>
          {exercise.nombre}
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <ShareButton text={generateExerciseProgressSummary()} />
          <TouchableOpacity onPress={handleEdit} style={{ padding: 4 }}>
            <Ionicons name="create-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
          {exercise.isCustom ? (
            <TouchableOpacity onPress={handleDelete} style={{ padding: 4 }}>
              <Ionicons name="trash-outline" size={24} color={colors.delete} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Tarjeta de Imagen del Ejercicio y Badges */}
      <View
        style={[
          globalStyles.card,
          {
            padding: 0,
            overflow: "hidden",
            marginBottom: 20,
          },
        ]}
      >
        <Image
          source={getExerciseImage(exercise.id, exercise.urlimage)}
          style={{ width: "100%", height: 220 }}
          resizeMode="cover"
        />
        <View style={{ padding: 14 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <View style={{ backgroundColor: colors.primary + "30", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
              <Text style={{ color: colors.primary, fontWeight: "bold", fontSize: 12 }}>
                💪 {exercise.musculo}
              </Text>
            </View>

            <View style={{ backgroundColor: colors.secondary + "30", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
              <Text style={{ color: colors.secondary, fontWeight: "bold", fontSize: 12 }}>
                🏋️ {exercise.equipamiento}
              </Text>
            </View>

            {(() => {
              const cat = getExerciseCategory(exercise);
              const icon = cat === "Gym" ? "🏋️ " : cat === "Cardio" ? "🏃 " : "🤸 ";
              return (
                <View style={{ backgroundColor: colors.surface, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: colors.textSecondary + "30" }}>
                  <Text style={{ color: colors.text, fontWeight: "bold", fontSize: 12 }}>
                    {icon}{cat}
                  </Text>
                </View>
              );
            })()}

            {exercise.descripcion && (
              <Popover
                popoverStyle={{
                  backgroundColor: colors.surface,
                  borderRadius: 16,
                  borderWidth: 0,
                  borderColor: "transparent",
                  shadowColor: "transparent",
                  shadowOpacity: 0,
                  elevation: 0,
                }}
                from={
                  <TouchableOpacity
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      backgroundColor: colors.primary + "18",
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 8,
                      borderWidth: 0,
                    }}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Ionicons name="book-outline" size={13} color={colors.primary} />
                    <Text style={{ color: colors.primary, fontWeight: "bold", fontSize: 12 }}>
                      Técnica
                    </Text>
                  </TouchableOpacity>
                }
              >
                <View
                  style={{
                    padding: 14,
                    maxWidth: 290,
                    backgroundColor: colors.surface,
                    borderRadius: 16,
                    borderWidth: 0,
                    borderColor: "transparent",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <Ionicons name="barbell-outline" size={18} color={colors.primary} />
                    <Text style={{ fontWeight: "bold", fontSize: 15, color: colors.text }}>
                      Técnica de Ejecución
                    </Text>
                  </View>
                  <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19 }}>
                    {exercise.descripcion}
                  </Text>
                </View>
              </Popover>
            )}
          </View>
        </View>
      </View>

      {/* 1RM Estimado y Vistas 1M / 3M / 6M */}
      <View style={{ marginBottom: 15 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 5 }}>
          <Text style={globalStyles.cardTitle}>
            {isBodyweight && stats.maxWeight <= 0
              ? "RÉCORD REPETICIONES (CORPORAL)"
              : isCardio
                ? "RÉCORD TIEMPO (CARDIO)"
                : "1RM ESTIMADO (BRZYCKI)"}
          </Text>
          <ThemedInfoPopover
            title={
              isBodyweight && stats.maxWeight <= 0
                ? "¿Qué es este récord?"
                : isCardio
                  ? "Récord de Tiempo"
                  : "¿Qué es el 1RM Brzycki?"
            }
            icon={isBodyweight && stats.maxWeight <= 0 ? "fitness" : isCardio ? "timer" : "calculator"}
            content={
              isBodyweight && stats.maxWeight <= 0
                ? "Para ejercicios de peso corporal sin lastre, tu sobrecarga se mide por el número máximo de repeticiones de calidad que eres capaz de realizar en una serie."
                : isCardio
                  ? "El mayor tiempo de actividad continua que has completado en este ejercicio cardiovascular."
                  : "Tu 1RM (Una Repetición Máxima) es la fuerza máxima teórica que puedes mover en una sola repetición. Se calcula matemáticamente con la fórmula validada de Brzycki a partir de tu mejor serie."
            }
            colors={colors}
          />
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text
            style={[
              globalStyles.textSecondary,
              { fontSize: 36, color: colors.primary, fontWeight: "bold" },
            ]}
          >
            {isBodyweight && stats.maxWeight <= 0 ? (
              <>
                {stats.maxReps}{" "}
                <Text style={globalStyles.textSecondary}>reps</Text>
              </>
            ) : isCardio ? (
              <>
                {stats.maxReps}{" "}
                <Text style={globalStyles.textSecondary}>min</Text>
              </>
            ) : (
              <>
                {toDisplayWeight(calculateBrzycki1RM(stats.maxWeight, stats.maxReps), userSettings.unit)}{" "}
                <Text style={globalStyles.textSecondary}>{userSettings.unit}</Text>
              </>
            )}
          </Text>

          {/* Selector de Rango 1M, 3M, 6M funcional */}
          <View
            style={[
              globalStyles.card,
              {
                flexDirection: "row",
                gap: 4,
                padding: 3,
                height: 40,
                alignItems: "center",
                borderRadius: 12,
              },
            ]}
          >
            {(["1M", "3M", "6M"] as const).map((range) => (
              <TouchableOpacity
                key={range}
                onPress={() => {
                  Haptics.selectionAsync();
                  setTimeRange(range);
                }}
                style={{
                  backgroundColor:
                    timeRange === range ? colors.primary : "transparent",
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "bold",
                    color:
                      timeRange === range
                        ? colors.background
                        : colors.textSecondary,
                  }}
                >
                  {range}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Gráfico de Medias de Repeticiones y Proyección */}
      {history.length > 0 && (
        <View
          style={[
            globalStyles.card,
            {
              width: "100%",
              padding: 16,
              marginBottom: 20,
            },
          ]}
        >
          {/* Header de la gráfica con toggle predictivo */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View>
                <Text style={{ fontSize: 13, fontWeight: "bold", color: colors.text }}>
                  {isBodyweight && stats.maxWeight <= 0
                    ? "REPETICIONES MÁXIMAS"
                    : isCardio
                      ? "TIEMPO POR SESIÓN"
                      : "FUERZA ESTIMADA (1RM)"}
                </Text>
                <Text style={{ fontSize: 10, color: colors.textSecondary }}>
                  {isBodyweight && stats.maxWeight <= 0
                    ? `Progresión de repeticiones en ${timeRange}`
                    : isCardio
                      ? `Evolución de minutos en ${timeRange}`
                      : `Sobrecarga efectiva (${userSettings.unit}) en ${timeRange}`}
                </Text>
              </View>
              <ThemedInfoPopover
                title="Curva de Progresión"
                icon="analytics"
                content="Traza la evolución de tu fuerza máxima estimada en cada sesión. Si activas '+1 Mes', la línea proyecta tu rendimiento a 15 y 30 días basándose en tu ritmo real."
                colors={colors}
              />
            </View>

            <View
              style={{
                flexDirection: "row",
                backgroundColor: colors.background,
                borderRadius: 20,
                padding: 3,
                borderWidth: 1,
                borderColor: colors.textSecondary + "25",
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  setShowProjection(false);
                }}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 14,
                  backgroundColor: !showProjection ? colors.primary : "transparent",
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "bold",
                    color: !showProjection ? colors.background : colors.textSecondary,
                  }}
                >
                  Historial
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  setShowProjection(true);
                }}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 14,
                  backgroundColor: showProjection ? colors.primary : "transparent",
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "bold",
                    color: showProjection ? colors.background : colors.textSecondary,
                  }}
                >
                  +1 Mes
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <LineChart
            data={{ labels: displayChartLabels, datasets: [{ data: displayChartData }] }}
            width={Dimensions.get("window").width - 52}
            height={210}
            chartConfig={{
              backgroundColor: colors.surface,
              backgroundGradientFrom: colors.surface,
              backgroundGradientTo: colors.surface,
              color: () => colors.primary,
              labelColor: () => colors.textSecondary,
              decimalPlaces: 1,
              propsForDots: {
                r: "5",
                strokeWidth: "2",
                stroke: colors.primary,
                fill: colors.background,
              },
            }}
            bezier={!isSinglePoint}
            withDots={true}
            withVerticalLines={false}
            withHorizontalLines={true}
            onDataPointClick={handleDataPointClick}
            style={{ borderRadius: 16 }}
          />

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              marginTop: 8,
            }}
          >
            <Ionicons name="finger-print-outline" size={14} color={colors.primary} />
            <Text style={{ fontSize: 11, color: colors.textSecondary }}>
              Toca un punto para ver el desglose o la proyección
            </Text>
          </View>
        </View>
      )}

      {/* Proyección Predictiva a 1 Mes (Carga x Reps x Series) */}
      {history.length > 0 && (
        <View
          style={[
            globalStyles.card,
            {
              marginBottom: 20,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.primary + "35",
            },
          ]}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, flex: 1 }}>
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: colors.primary + "20",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="sparkles" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={{ fontSize: 14, fontWeight: "bold", color: colors.text }}>
                  PREDICCIÓN A 1 MES
                </Text>
                <ThemedInfoPopover
                  title="Predicción de Rendimiento"
                  icon="sparkles"
                  content="Estima tu sobrecarga combinando tu ganancia de fuerza (1RM) y el volumen acumulado. Te indica los pesos y repeticiones ideales para tu próximo mes."
                  colors={colors}
                />
              </View>
            </View>
          </View>

          {/* Muestra principal combinada */}
          <View
            style={{
              backgroundColor: colors.background,
              padding: 14,
              borderRadius: 14,
              marginBottom: 12,
            }}
          >


            <Text style={{ fontSize: 22, fontWeight: "bold", color: colors.text }}>
              {proj30.fullProjectionText}
            </Text>
          </View>

          {/* Desglose de ritmo de sobrecarga */}
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 10,
                backgroundColor: colors.background,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 10, color: colors.textSecondary }}>Ritmo Semanal</Text>
              <Text style={{ fontSize: 13, fontWeight: "bold", color: colors.text, marginTop: 2 }}>
                +{progressionStats.weeklyRate1RM} {userSettings.unit}
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 10,
                backgroundColor: colors.background,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 10, color: colors.textSecondary }}>Ritmo Mensual</Text>
              <Text style={{ fontSize: 13, fontWeight: "bold", color: colors.text, marginTop: 2 }}>
                +{progressionStats.monthlyRate1RM} {userSettings.unit}
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 10,
                backgroundColor: colors.background,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 10, color: colors.textSecondary }}>Tendencia</Text>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "bold",
                  color: colors.primary,
                  marginTop: 2,
                }}
              >
                Sobrecarga 🚀
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Calculadora Predictiva de Rendimiento y Objetivos */}
      {history.length > 0 && (
        <View
          style={[
            globalStyles.card,
            {
              marginBottom: 20,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.textSecondary + "25",
            },
          ]}
        >
          {/* Header de la calculadora */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: colors.secondary + "20",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="calculator-outline" size={18} color={colors.secondary} />
              </View>
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={{ fontSize: 14, fontWeight: "bold", color: colors.text }}>
                  CALCULADORA
                </Text>
                <ThemedInfoPopover
                  title="Calculadora Predictiva"
                  icon="calculator"
                  triggerColor={colors.secondary}
                  content="Simula tu progreso a futuro según el tiempo deseado en 'Proyección a Fecha', o calcula en cuántas semanas alcanzarás una marca concreta en 'Calcular Objetivo'."
                  colors={colors}
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                setCalculatorDays(30);
                setTargetWeightInput("");
                setTargetRepsInput("10");
                setTargetSetsInput("3");
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 10,
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.textSecondary + "30",
              }}
            >
              <Ionicons name="refresh-outline" size={13} color={colors.textSecondary} />
              <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: "600" }}>
                Reiniciar
              </Text>
            </TouchableOpacity>
          </View>

          {/* Selector de Modo: Por Fecha Futura vs Por Objetivo */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: colors.background,
              borderRadius: 10,
              padding: 3,
              marginBottom: 14,
              borderWidth: 1,
              borderColor: colors.textSecondary + "20",
            }}
          >
            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                setCalculatorMode("DATE");
              }}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 8,
                alignItems: "center",
                backgroundColor: calculatorMode === "DATE" ? colors.secondary : "transparent",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "bold",
                  color: calculatorMode === "DATE" ? colors.textWhite : colors.textSecondary,
                }}
              >
                Predicción a Fecha
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                setCalculatorMode("TARGET");
              }}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 8,
                alignItems: "center",
                backgroundColor: calculatorMode === "TARGET" ? colors.secondary : "transparent",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "bold",
                  color: calculatorMode === "TARGET" ? colors.textWhite : colors.textSecondary,
                }}
              >
                Predicción de objetivo
              </Text>
            </TouchableOpacity>
          </View>

          {/* MODO 1: PROYECCIÓN A FECHA FUTURA */}
          {calculatorMode === "DATE" && (
            <View>
              {/* Botones de incremento rápido de días */}
              <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 8 }}>
                Sumar tiempo a la proyección:
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {[
                    { label: "+2S (+14d)", days: 14 },
                    { label: "+1M (+30d)", days: 30 },
                    { label: "+2M (+60d)", days: 60 },
                    { label: "+3M (+90d)", days: 90 },
                    { label: "+6M (+180d)", days: 180 },
                  ].map((chip) => (
                    <TouchableOpacity
                      key={chip.days}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setCalculatorDays((prev) => prev + chip.days);
                      }}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                        borderRadius: 16,
                        backgroundColor: colors.background,
                        borderWidth: 1,
                        borderColor: colors.secondary + "50",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "bold",
                          color: colors.secondary,
                        }}
                      >
                        {chip.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Stepper de días */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: colors.background,
                  padding: 10,
                  borderRadius: 12,
                  marginBottom: 12,
                }}
              >
                <View>
                  <Text style={{ fontSize: 13, color: colors.text, fontWeight: "600" }}>
                    Total de días a futuro:
                  </Text>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.selectionAsync();
                      setCalculatorDays((prev) => Math.max(1, prev - 5));
                    }}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: colors.surface,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: colors.textSecondary + "30",
                    }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.text }}>-5</Text>
                  </TouchableOpacity>

                  <TextInput
                    keyboardType="numeric"
                    value={calculatorDays.toString()}
                    onChangeText={(val) => {
                      const num = parseInt(val, 10);
                      if (!isNaN(num)) setCalculatorDays(Math.max(1, num));
                      else if (val === "") setCalculatorDays(0);
                    }}
                    style={{
                      minWidth: 55,
                      textAlign: "center",
                      fontSize: 16,
                      fontWeight: "bold",
                      color: colors.primary,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 8,
                      backgroundColor: colors.surface,
                    }}
                  />

                  <TouchableOpacity
                    onPress={() => {
                      Haptics.selectionAsync();
                      setCalculatorDays((prev) => prev + 5);
                    }}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: colors.surface,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: colors.textSecondary + "30",
                    }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.text }}>+5</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Resultado Modo 1 */}
              <View
                style={{
                  padding: 14,
                  borderRadius: 14,
                  backgroundColor: colors.primary + "12",
                  borderWidth: 1,
                  borderColor: colors.primary + "40",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                    Fecha estimada ({calculatorDays} días):
                  </Text>
                  <Text style={{ fontSize: 12, fontWeight: "bold", color: colors.primary }}>
                    {calcDateProj.dateStr}
                  </Text>
                </View>

                <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.text, marginTop: 2 }}>
                  {calcDateProj.fullProjectionText}
                </Text>

              </View>
            </View>
          )}

          {/* MODO 2: CALCULADORA DE OBJETIVO / TARGET */}
          {calculatorMode === "TARGET" && (
            <View>

              {/* 3 Inputs numéricos: Peso, Reps, Series */}
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
                <View style={{ flex: 1.4 }}>
                  <Text style={{ fontSize: 10, color: colors.textSecondary, marginBottom: 4, fontWeight: "bold" }}>
                    PESO ({userSettings.unit.toUpperCase()})
                  </Text>
                  <TextInput
                    keyboardType="numeric"
                    placeholder={String(progressionStats.latestWeight > 0 ? progressionStats.latestWeight + 2.5 : 20)}
                    placeholderTextColor={colors.textSecondary + "60"}
                    value={targetWeightInput}
                    onChangeText={setTargetWeightInput}
                    style={{
                      backgroundColor: colors.background,
                      color: colors.text,
                      fontSize: 16,
                      fontWeight: "bold",
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: colors.secondary + "40",
                      textAlign: "center",
                    }}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, color: colors.textSecondary, marginBottom: 4, fontWeight: "bold" }}>
                    REPS
                  </Text>
                  <TextInput
                    keyboardType="numeric"
                    placeholder="10"
                    placeholderTextColor={colors.textSecondary + "60"}
                    value={targetRepsInput}
                    onChangeText={setTargetRepsInput}
                    style={{
                      backgroundColor: colors.background,
                      color: colors.text,
                      fontSize: 16,
                      fontWeight: "bold",
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: colors.secondary + "40",
                      textAlign: "center",
                    }}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, color: colors.textSecondary, marginBottom: 4, fontWeight: "bold" }}>
                    SERIES
                  </Text>
                  <TextInput
                    keyboardType="numeric"
                    placeholder="3"
                    placeholderTextColor={colors.textSecondary + "60"}
                    value={targetSetsInput}
                    onChangeText={setTargetSetsInput}
                    style={{
                      backgroundColor: colors.background,
                      color: colors.text,
                      fontSize: 16,
                      fontWeight: "bold",
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: colors.secondary + "40",
                      textAlign: "center",
                    }}
                  />
                </View>
              </View>

              {/* Resultado Modo 2 */}
              <View
                style={{
                  padding: 14,
                  borderRadius: 14,
                  backgroundColor: targetCalcResult.isAchieved ? colors.primary + "15" : colors.secondary + "15",
                  borderWidth: 1,
                  borderColor: targetCalcResult.isAchieved ? colors.primary + "40" : colors.secondary + "40",
                }}
              >
                {targetCalcResult.isAchieved ? (
                  <View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                      <Text style={{ fontSize: 14, fontWeight: "bold", color: colors.primary }}>
                        ¡META YA ALCANZADA!
                      </Text>
                    </View>
                    <Text style={{ fontSize: 12, color: colors.text, lineHeight: 18 }}>
                      {targetCalcResult.message}
                    </Text>
                  </View>
                ) : (
                  <View>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 4,
                      }}
                    >
                      <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                        Fecha estimada para alcanzarlo:
                      </Text>
                      <Text style={{ fontSize: 12, fontWeight: "bold", color: colors.primary }}>
                        {targetCalcResult.estimatedDateStr}
                      </Text>
                    </View>

                    <Text style={{ fontSize: 15, fontWeight: "bold", color: colors.text, marginTop: 2 }}>
                      En aproximadamente ~{targetCalcResult.daysNeeded} días (~{targetCalcResult.weeksNeeded} sem)
                    </Text>

                    {/* Desglose en 3 métricas */}
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 6,
                        marginTop: 10,
                        paddingTop: 8,
                        borderTopWidth: 1,
                        borderTopColor: colors.textSecondary + "20",
                      }}
                    >
                      <View style={{ flex: 1, alignItems: "center" }}>
                        <Text style={{ fontSize: 9, color: colors.textSecondary }}>1RM Meta</Text>
                        <Text style={{ fontSize: 12, fontWeight: "bold", color: colors.text, marginTop: 1 }}>
                          {targetCalcResult.target1RM} {userSettings.unit}
                        </Text>
                        <Text style={{ fontSize: 9, color: colors.primary }}>
                          +{targetCalcResult.diff1RM} {userSettings.unit}
                        </Text>
                      </View>

                      <View style={{ flex: 1, alignItems: "center" }}>
                        <Text style={{ fontSize: 9, color: colors.textSecondary }}>Ritmo Actual</Text>
                        <Text style={{ fontSize: 12, fontWeight: "bold", color: colors.text, marginTop: 1 }}>
                          +{progressionStats.weeklyRate1RM}
                        </Text>
                        <Text style={{ fontSize: 9, color: colors.textSecondary }}>
                          {userSettings.unit}/sem
                        </Text>
                      </View>

                      <View style={{ flex: 1, alignItems: "center" }}>
                        <Text style={{ fontSize: 9, color: colors.textSecondary }}>Volumen Total</Text>
                        <Text style={{ fontSize: 12, fontWeight: "bold", color: colors.text, marginTop: 1 }}>
                          {(
                            (parseFloat(targetWeightInput) || targetCalcResult.targetWeight) *
                            targetCalcResult.targetReps *
                            targetCalcResult.targetSets
                          ).toLocaleString()}
                        </Text>
                        <Text style={{ fontSize: 9, color: colors.textSecondary }}>
                          {userSettings.unit}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Tarjetas de Estadísticas generales */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 20,
        }}
      >
        <View style={[globalStyles.card, { flex: 1, padding: 12 }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.primary + "20",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="medal" size={20} color={colors.primary} />
            </View>
            <ThemedInfoPopover
              title="Mejor Peso (Récord)"
              icon="medal"
              content="La carga más alta que has registrado en una serie completada de este ejercicio."
              colors={colors}
            />
          </View>
          <Text style={[globalStyles.textSecondary, { fontSize: 11, fontWeight: "600" }]}>
            {isBodyweight
              ? stats.maxWeight > 0
                ? "MAYOR LASTRE"
                : "MODALIDAD"
              : isCardio
                ? "MEJOR TIEMPO"
                : "MEJOR PESO"}
          </Text>
          <Text
            style={[
              globalStyles.textSecondary,
              { fontSize: 18, color: colors.primary, fontWeight: "bold", marginTop: 2 },
            ]}
          >
            {isBodyweight
              ? stats.maxWeight > 0
                ? `+${toDisplayWeight(stats.maxWeight, userSettings.unit)} ${userSettings.unit}`
                : "Corporal"
              : isCardio
                ? `${stats.maxReps} min`
                : `${toDisplayWeight(stats.maxWeight, userSettings.unit)} ${userSettings.unit}`}
          </Text>
        </View>

        <View style={[globalStyles.card, { flex: 1, padding: 12 }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.secondary + "20",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="barbell" size={20} color={colors.secondary} />
            </View>
            <ThemedInfoPopover
              title="Mejores Repeticiones"
              icon="barbell"
              triggerColor={colors.secondary}
              content="El número máximo de repeticiones registradas en tu serie récord."
              colors={colors}
            />
          </View>
          <Text style={[globalStyles.textSecondary, { fontSize: 11, fontWeight: "600" }]}>MEJOR REPS</Text>
          <Text
            style={[
              globalStyles.textSecondary,
              { fontSize: 18, color: colors.text, fontWeight: "bold", marginTop: 2 },
            ]}
          >
            {stats.maxReps} reps
          </Text>
        </View>

        <View style={[globalStyles.card, { flex: 1, padding: 12 }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.textSecondary + "20",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name="reload-circle-outline"
                size={20}
                color={colors.textSecondary}
              />
            </View>
            <ThemedInfoPopover
              title="Total de Series"
              icon="reload-circle-outline"
              triggerColor={colors.textSecondary}
              content="Suma acumulada de todas las series de trabajo realizadas en tu historial de este ejercicio."
              colors={colors}
            />
          </View>
          <Text style={[globalStyles.textSecondary, { fontSize: 11, fontWeight: "600" }]}>SERIES</Text>
          <Text
            style={[
              globalStyles.textSecondary,
              { fontSize: 18, color: colors.text, fontWeight: "bold", marginTop: 2 },
            ]}
          >
            {stats.totalSets}
          </Text>
        </View>
      </View>

      {/* Widget Visual de Estado y Análisis con Popover */}
      {(() => {
        const insight = getWorkoutInsight(history);
        return (
          <View
            style={[
              globalStyles.card,
              {
                marginBottom: 20,
                padding: 14,
                borderWidth: 1,
                borderColor: insight.color + "35",
              },
            ]}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1, marginRight: 8 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: insight.color + "20",
                    borderWidth: 1.5,
                    borderColor: insight.color + "50",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name={insight.icon} size={22} color={insight.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <Text style={{ fontSize: 15, fontWeight: "bold", color: colors.text }}>
                      {insight.title}
                    </Text>
                    <View
                      style={{
                        backgroundColor: insight.color + "25",
                        paddingHorizontal: 7,
                        paddingVertical: 2,
                        borderRadius: 6,
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: "bold", color: insight.color }}>
                        {insight.tag}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                    {insight.shortMetric}
                  </Text>
                </View>
              </View>

              <Popover
                popoverStyle={{
                  backgroundColor: colors.surface,
                  borderRadius: 16,
                  borderWidth: 0,
                  borderColor: "transparent",
                  shadowColor: "transparent",
                  shadowOpacity: 0,
                  elevation: 0,
                }}
                from={
                  <TouchableOpacity
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      paddingHorizontal: 10,
                      paddingVertical: 7,
                      borderRadius: 10,
                      backgroundColor: insight.color + "18",
                      borderWidth: 0,
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="sparkles" size={14} color={insight.color} />
                    <Text style={{ fontSize: 11, fontWeight: "bold", color: insight.color }}>
                      Explicación
                    </Text>
                  </TouchableOpacity>
                }
              >
                <View
                  style={{
                    padding: 16,
                    maxWidth: 290,
                    backgroundColor: colors.surface,
                    borderRadius: 16,
                    borderWidth: 0,
                    borderColor: "transparent",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <Ionicons name={insight.icon} size={20} color={insight.color} />
                    <Text style={{ fontWeight: "bold", fontSize: 15, color: colors.text, flex: 1 }}>
                      {insight.title}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 19 }}>
                    {insight.advice}
                  </Text>
                </View>
              </Popover>
            </View>
          </View>
        );
      })()}

      {/* Lista de Historial de Sesiones */}
      <View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 15,
          }}
        >
          <Text
            style={{
              fontWeight: "bold",
              fontSize: 22,
              color: colors.text,
            }}
          >
            Historial de Sesiones
          </Text>

          {history.length > 0 && (
            <TouchableOpacity
              onPress={() => handlePromptDeleteLog(history[0])}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                backgroundColor: colors.delete + "18",
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.delete + "35",
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={15} color={colors.delete} />
              <Text style={{ fontSize: 12, fontWeight: "bold", color: colors.delete }}>
                Eliminar último récord
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {history.map((item, index) => {
          const formattedDate = item.date
            .toString()
            .slice(0, 10)
            .split("-")
            .reverse()
            .join("/");
          const isBestVolume = item.totalVolume === stats.bestVolume;
          const isBestWeight = item.bestWeight === stats.maxWeight;
          const isLatest = index === 0;

          const setsList =
            item.sets && item.sets.length > 0
              ? item.sets
              : item.bestWeight > 0
                ? [{ peso: item.bestWeight, reps: item.bestReps || 1 }]
                : [];

          const totalRepsInSession = setsList.reduce(
            (acc, s) => acc + (s.reps || 0),
            0
          );
          const sessionAvgReps =
            setsList.length > 0 ? (totalRepsInSession / setsList.length).toFixed(2) : "0";

          const sessionVolume =
            item.totalVolume ||
            setsList.reduce(
              (acc, s) => acc + (s.peso || 0) * (s.reps || 0),
              0
            );

          const groupedSets: {
            peso: number;
            reps: number;
            count: number;
            isBest: boolean;
          }[] = [];

          setsList.forEach((set) => {
            const isBest =
              set.peso === item.bestWeight && set.reps === item.bestReps;
            const existing = groupedSets.find(
              (g) => g.peso === set.peso && g.reps === set.reps
            );
            if (existing) {
              existing.count += 1;
              if (isBest) existing.isBest = true;
            } else {
              groupedSets.push({
                peso: set.peso,
                reps: set.reps,
                count: 1,
                isBest,
              });
            }
          });

          return (
            <View
              key={`${item.id || item.date}-${index}`}
              style={[
                globalStyles.card,
                {
                  marginVertical: 6,
                  padding: 14,
                  borderWidth: isLatest ? 1.5 : 1,
                  borderColor: isLatest ? colors.primary + "50" : colors.textSecondary + "20",
                },
              ]}
            >
              {/* Encabezado: Fecha, Totales y Badges */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                  <View
                    style={{
                      marginRight: 10,
                      padding: 8,
                      borderRadius: 10,
                      backgroundColor: colors.background,
                      height: 38,
                      width: 38,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons
                      name="calendar-outline"
                      color={isLatest ? colors.primary : colors.textSecondary}
                      size={18}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={[globalStyles.cardTitle, { fontSize: 16 }]}>{formattedDate}</Text>
                      {isLatest && (
                        <View
                          style={{
                            backgroundColor: colors.primary + "20",
                            paddingHorizontal: 6,
                            paddingVertical: 1.5,
                            borderRadius: 6,
                          }}
                        >
                          <Text style={{ fontSize: 10, fontWeight: "bold", color: colors.primary }}>
                            ÚLTIMO
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 1 }}>
                      {setsList.length} {setsList.length === 1 ? "serie" : "series"} · Media: {sessionAvgReps} reps · {toDisplayWeight(sessionVolume, userSettings.unit)} {userSettings.unit}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  {isBestVolume && (
                    <Popover
                      popoverStyle={{
                        backgroundColor: colors.surface,
                        borderRadius: 14,
                        borderWidth: 0,
                        borderColor: "transparent",
                        shadowColor: "transparent",
                        shadowOpacity: 0,
                        elevation: 0,
                      }}
                      from={
                        <TouchableOpacity
                          style={{
                            padding: 5,
                            borderRadius: 8,
                            backgroundColor: colors.secondary + "20",
                          }}
                        >
                          <Ionicons
                            name="barbell"
                            size={18}
                            color={colors.secondary}
                          />
                        </TouchableOpacity>
                      }
                    >
                      <View
                        style={{
                          padding: 12,
                          maxWidth: 240,
                          backgroundColor: colors.surface,
                          borderRadius: 14,
                          borderWidth: 0,
                          borderColor: "transparent",
                        }}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <Ionicons name="barbell" size={16} color={colors.secondary} />
                          <Text style={{ fontWeight: "bold", fontSize: 13, color: colors.text }}>
                            Récord de Tonelaje
                          </Text>
                        </View>
                        <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 16 }}>
                          ¡Esta sesión acumuló tu mayor volumen total de entrenamiento!
                        </Text>
                      </View>
                    </Popover>
                  )}
                  {isBestWeight && (
                    <Popover
                      popoverStyle={{
                        backgroundColor: colors.surface,
                        borderRadius: 14,
                        borderWidth: 0,
                        borderColor: "transparent",
                        shadowColor: "transparent",
                        shadowOpacity: 0,
                        elevation: 0,
                      }}
                      from={
                        <TouchableOpacity
                          style={{
                            padding: 5,
                            borderRadius: 8,
                            backgroundColor: colors.primary + "20",
                          }}
                        >
                          <Ionicons
                            name="medal"
                            size={18}
                            color={colors.primary}
                          />
                        </TouchableOpacity>
                      }
                    >
                      <View
                        style={{
                          padding: 12,
                          maxWidth: 240,
                          backgroundColor: colors.surface,
                          borderRadius: 14,
                          borderWidth: 0,
                          borderColor: "transparent",
                        }}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <Ionicons name="trophy" size={16} color={colors.primary} />
                          <Text style={{ fontWeight: "bold", fontSize: 13, color: colors.text }}>
                            Récord de Carga
                          </Text>
                        </View>
                        <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 16 }}>
                          ¡Tu serie más pesada registrada hasta la fecha en este ejercicio!
                        </Text>
                      </View>
                    </Popover>
                  )}
                  <TouchableOpacity
                    onPress={() => handlePromptDeleteLog(item)}
                    style={{
                      padding: 6,
                      borderRadius: 8,
                      backgroundColor: colors.delete + "15",
                      marginLeft: 2,
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.delete} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Desglose visible y agrupado de series: ej. "10kg x 10 x 2 ; 10kg x 8" */}
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 8,
                  paddingTop: 8,
                  borderTopWidth: 1,
                  borderTopColor: colors.textSecondary + "15",
                }}
              >
                {groupedSets.map((g, gIdx) => {
                  const displayWeight = toDisplayWeight(g.peso, userSettings.unit);
                  const isLastItem = gIdx === groupedSets.length - 1;

                  return (
                    <View
                      key={gIdx}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          backgroundColor: g.isBest
                            ? colors.primary + "18"
                            : colors.background,
                          borderColor: g.isBest
                            ? colors.primary + "55"
                            : colors.textSecondary + "25",
                          borderWidth: 1,
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          borderRadius: 8,
                          gap: 4,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: "bold",
                            color: colors.text,
                          }}
                        >
                          {(() => {
                            const isExCardio = getExerciseCategory(exercise) === "Cardio";
                            const isExBodyweight = getExerciseCategory(exercise) === "Peso corporal";
                            if (isExCardio) {
                              const timeM = (g as any).timeMinutes || g.reps;
                              return `${timeM} min`;
                            }
                            if (isExBodyweight) {
                              if (g.peso === 0) return `Corporal x ${g.reps}`;
                              if (g.peso > 0) return `+${displayWeight}${userSettings.unit} x ${g.reps}`;
                              return `-${toDisplayWeight(Math.abs(g.peso), userSettings.unit)}${userSettings.unit} x ${g.reps}`;
                            }
                            return `${displayWeight}${userSettings.unit} x ${g.reps}`;
                          })()}
                          {g.count > 1 ? (
                            <Text
                              style={{
                                color: g.isBest ? colors.primary : colors.text,
                                fontWeight: "bold",
                              }}
                            >
                              {" "}x {g.count}
                            </Text>
                          ) : null}
                        </Text>
                        {g.isBest && (
                          <Ionicons
                            name="sparkles"
                            size={12}
                            color={colors.primary}
                            style={{ marginLeft: 2 }}
                          />
                        )}
                      </View>

                      {!isLastItem && (
                        <Text
                          style={{
                            fontSize: 15,
                            fontWeight: "bold",
                            color: colors.textSecondary,
                          }}
                        >
                          ;
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>

      {history.length === 0 && (
        <Text style={{ color: colors.textSecondary, textAlign: "center", marginVertical: 10 }}>
          No hay historial de entrenamientos registrado.
        </Text>
      )}
      <View style={{ height: 60 }} />

      {/* Modal no nativo: Detalle de punto histórico pulsado en la gráfica */}
      <Modal
        visible={!!selectedPointDetail}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedPointDetail(null)}
      >
        <View style={modalStyles.overlay}>
          <View
            style={[
              globalStyles.card,
              {
                width: "88%",
                maxWidth: 340,
                padding: 20,
                backgroundColor: colors.surface,
                borderRadius: 20,
                borderWidth: 1.5,
                borderColor: colors.primary + "60",
                alignItems: "center",
              },
            ]}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: colors.primary + "20",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <Ionicons name="analytics" size={26} color={colors.primary} />
            </View>

            <Text style={{ fontSize: 17, fontWeight: "bold", color: colors.text, marginBottom: 2 }}>
              Sesión de Entrenamiento
            </Text>
            <Text style={{ fontSize: 13, color: colors.primary, fontWeight: "600", marginBottom: 12 }}>
              📅 {selectedPointDetail?.dateStr}
            </Text>

            <Text style={{ fontSize: 32, fontWeight: "bold", color: colors.text }}>
              {selectedPointDetail?.oneRM}{" "}
              <Text style={{ fontSize: 16, color: colors.textSecondary }}>{userSettings.unit} (1RM)</Text>
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 14 }}>
              Fuerza máxima estimada en esta sesión
            </Text>

            <View
              style={{
                width: "100%",
                backgroundColor: colors.background,
                padding: 12,
                borderRadius: 12,
                marginBottom: 16,
                gap: 6,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>Mejor Serie:</Text>
                <Text style={{ fontSize: 12, fontWeight: "bold", color: colors.primary }}>
                  {selectedPointDetail?.peakWeight} {userSettings.unit} × {selectedPointDetail?.peakReps} reps
                </Text>
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>Volumen Total:</Text>
                <Text style={{ fontSize: 12, fontWeight: "bold", color: colors.text }}>
                  {selectedPointDetail?.totalVolume} {userSettings.unit}
                </Text>
              </View>

              <View style={{ marginTop: 4 }}>
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 2 }}>
                  Series realizadas:
                </Text>
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.text }}>
                  {selectedPointDetail?.groupedText}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setSelectedPointDetail(null)}
              style={{
                width: "100%",
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: colors.primary,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "bold", color: colors.background }}>
                Cerrar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal no nativo: Punto Proyectado */}
      <Modal
        visible={!!projectedInfo}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setProjectedInfo(null)}
      >
        <View style={modalStyles.overlay}>
          <View
            style={[
              globalStyles.card,
              {
                width: "88%",
                maxWidth: 340,
                padding: 20,
                backgroundColor: colors.surface,
                borderRadius: 20,
                borderWidth: 1.5,
                borderColor: colors.primary + "60",
                alignItems: "center",
              },
            ]}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: colors.primary + "20",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <Ionicons name="sparkles" size={26} color={colors.primary} />
            </View>

            <Text style={{ fontSize: 17, fontWeight: "bold", color: colors.text, marginBottom: 4 }}>
              Proyección (+{projectedInfo?.days} días)
            </Text>
            <Text style={{ fontSize: 13, color: colors.primary, fontWeight: "600", marginBottom: 12 }}>
              {projectedInfo?.dateStr}
            </Text>

            <Text style={{ fontSize: 32, fontWeight: "bold", color: colors.text, marginBottom: 4 }}>
              {projectedInfo?.value}{" "}
              <Text style={{ fontSize: 18, color: colors.textSecondary }}>{userSettings.unit} 1RM</Text>
            </Text>

            {projectedInfo?.projectionText && (
              <View
                style={{
                  width: "100%",
                  backgroundColor: colors.background,
                  padding: 12,
                  borderRadius: 12,
                  marginVertical: 10,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 2 }}>
                  Rendimiento estimado de series:
                </Text>
                <Text style={{ fontSize: 14, fontWeight: "bold", color: colors.primary }}>
                  {projectedInfo.projectionText}
                </Text>
              </View>
            )}

            <Text
              style={{
                fontSize: 12,
                color: colors.textSecondary,
                textAlign: "center",
                lineHeight: 17,
                marginBottom: 16,
              }}
            >
              Estimación basada en la tasa real de sobrecarga progresiva (peso y repeticiones combinadas).
            </Text>

            <TouchableOpacity
              onPress={() => setProjectedInfo(null)}
              style={{
                width: "100%",
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: colors.primary,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "bold", color: colors.background }}>
                Entendido
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal no nativo para confirmar eliminación de récord/sesión */}
      <ThemeConfirmModal
        visible={!!logToDelete}
        title="Eliminar Registro de Récord"
        message={
          logToDelete
            ? `¿Estás seguro de que deseas eliminar este registro (${toDisplayWeight(logToDelete.bestWeight, userSettings.unit)} ${userSettings.unit} x ${logToDelete.bestReps} reps)? Si era tu récord más alto, el siguiente mejor registro pasará a ser tu récord actual.`
            : ""
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDestructive={true}
        onConfirm={handleConfirmDeleteLog}
        onCancel={() => setLogToDelete(null)}
      />

      {/* Modal no nativo para confirmar eliminación de ejercicio */}
      <ThemeConfirmModal
        visible={showDeleteExerciseModal}
        title="Eliminar Ejercicio"
        message={
          exercise
            ? `¿Estás seguro de eliminar "${exercise.nombre}"? Esta acción no se puede deshacer.`
            : ""
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDestructive={true}
        onConfirm={handleConfirmDeleteExercise}
        onCancel={() => setShowDeleteExerciseModal(false)}
      />
    </ScrollView>
  );
};

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default DetailsExerciseScreen;
