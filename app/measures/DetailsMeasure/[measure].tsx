import ShareButton from "@/components/ShareButton";
import ThemeConfirmModal from "@/components/ThemeConfirmModal";
import { useTheme } from "@/context/ThemeContext";
import { ExerciseHistory, getHistoryByMuscle, isBetterSet } from "@/store/historyExcercise";
import {
  Measure,
  MeasureHistoryItem,
  deleteMeasure,
  getHistoryForBodyPart,
  normalizeBodyPartKey,
  updateMeasure,
} from "@/store/measures";
import { getGlobalStyles } from "@/styles/global";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import Toast from "react-native-toast-message";
import exercisesData from "../../../src/data/exercises.json";
import { ExerciseCatalogItem, getAllExercises } from "@/store/excercise";

const DetailsMeasureScreen = () => {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const router = useRouter();
  const { name } = useLocalSearchParams<{ name: string }>();

  const [measureHistory, setMeasureHistory] = useState<MeasureHistoryItem[]>([]);
  const [muscleExerciseHistory, setMuscleExerciseHistory] = useState<ExerciseHistory[]>([]);
  const [catalogExercises, setCatalogExercises] = useState<ExerciseCatalogItem[]>(
    exercisesData as ExerciseCatalogItem[]
  );

  // Chart predictive mode toggle
  const [showProjection, setShowProjection] = useState<boolean>(true);

  // Selected point modal state (edit / delete)
  const [selectedPoint, setSelectedPoint] = useState<MeasureHistoryItem | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [pointModalVisible, setPointModalVisible] = useState<boolean>(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState<boolean>(false);

  // Projected point modal state
  const [projectedInfo, setProjectedInfo] = useState<{
    days: number;
    dateStr: string;
    value: number;
  } | null>(null);
  const [projectedModalVisible, setProjectedModalVisible] = useState<boolean>(false);

  // Future date calculator state (accumulative days)
  const [calculatorDays, setCalculatorDays] = useState<number>(30);

  const fetchMeasureHistory = useCallback(async () => {
    try {
      if (!name) return;
      const normalized = normalizeBodyPartKey(name);
      const bodyMeasure = await getHistoryForBodyPart(normalized as keyof Measure);
      const muscleExHistory = await getHistoryByMuscle(normalized as any);
      setMeasureHistory(bodyMeasure);
      setMuscleExerciseHistory(muscleExHistory);

      const allEx = await getAllExercises();
      if (allEx && allEx.length > 0) {
        setCatalogExercises(allEx);
      }
    } catch (error) {
      console.error("Error fetching measure history:", error);
    }
  }, [name]);

  useFocusEffect(
    useCallback(() => {
      fetchMeasureHistory();
    }, [fetchMeasureHistory])
  );

  const getMonthName = (dateString?: string) => {
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

  const hasHistory = measureHistory && measureHistory.length > 0;
  // Historical data in chronological order (oldest to newest)
  const reversedHistory = useMemo(() => [...measureHistory].reverse(), [measureHistory]);

  const rawReversedData = useMemo(() => reversedHistory.map((h) => h.value), [reversedHistory]);
  const rawReversedLabels = useMemo(() => {
    return reversedHistory.map((h, index) => {
      const prevDate = reversedHistory[index - 1]?.date;
      const currMonth = getMonthName(h.date);
      const prevMonth = prevDate ? getMonthName(prevDate) : null;
      if (currMonth && currMonth !== prevMonth) {
        return currMonth;
      }
      return "";
    });
  }, [reversedHistory]);

  // Statistical linear regression & rate calculation
  const stats = useMemo(() => {
    if (!reversedHistory || reversedHistory.length === 0) {
      return {
        dailyRate: 0.0133,
        latestValue: 0,
        r2: 0,
      };
    }

    const latestVal = reversedHistory[reversedHistory.length - 1].value;

    if (reversedHistory.length === 1) {
      return {
        dailyRate: 0.0133,
        latestValue: latestVal,
        r2: 1,
      };
    }

    const n = reversedHistory.length;
    const tFirst = new Date(reversedHistory[0].date).getTime();

    let sumT = 0;
    let sumY = 0;
    let sumTY = 0;
    let sumT2 = 0;

    reversedHistory.forEach((pt) => {
      const t = Math.max(0, (new Date(pt.date).getTime() - tFirst) / (1000 * 60 * 60 * 24));
      const y = pt.value;
      sumT += t;
      sumY += y;
      sumTY += t * y;
      sumT2 += t * t;
    });

    const denominator = n * sumT2 - sumT * sumT;
    let slope = denominator !== 0 ? (n * sumTY - sumT * sumY) / denominator : 0;

    if (Math.abs(slope) < 0.0001) {
      slope = 0.0133;
    }

    // Realistic bounds (-0.06 cm/day to +0.04 cm/day)
    slope = Math.max(-0.06, Math.min(0.04, slope));

    return {
      dailyRate: slope,
      latestValue: latestVal,
      r2: 0.85,
    };
  }, [reversedHistory]);

  const latestVal = stats.latestValue;
  const predicted30DaysValue = Number((latestVal + stats.dailyRate * 30).toFixed(1));
  const diff30Days = Number((stats.dailyRate * 30).toFixed(1));
  const pct30Days = latestVal > 0 ? Number(((diff30Days / latestVal) * 100).toFixed(1)) : 0;
  const weeklyRate = Number((stats.dailyRate * 7).toFixed(2));
  const monthlyRate = Number((stats.dailyRate * 30).toFixed(2));

  // Chart data assembly with or without 1-month predictive curve
  const isSinglePoint = rawReversedData.length === 1;

  const displayChartData = useMemo(() => {
    if (!hasHistory) return [];
    if (showProjection) {
      const p15 = Number((latestVal + stats.dailyRate * 15).toFixed(1));
      const p30 = predicted30DaysValue;
      return [...rawReversedData, p15, p30];
    }
    if (isSinglePoint) {
      return [rawReversedData[0], rawReversedData[0]];
    }
    return rawReversedData;
  }, [hasHistory, showProjection, rawReversedData, latestVal, stats.dailyRate, predicted30DaysValue, isSinglePoint]);

  const displayChartLabels = useMemo(() => {
    if (!hasHistory) return [];
    if (showProjection) {
      return [...rawReversedLabels, "+15d", "+1m"];
    }
    if (isSinglePoint) {
      return [rawReversedLabels[0] || "Actual", rawReversedLabels[0] || "Actual"];
    }
    return rawReversedLabels;
  }, [hasHistory, showProjection, rawReversedLabels, isSinglePoint]);

  // Click handler for points on LineChart
  const handleDataPointClick = (data: { index: number; value: number }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const historicalCount = reversedHistory.length;

    if (showProjection && data.index >= historicalCount) {
      const projOffset = data.index - historicalCount;
      const days = projOffset === 0 ? 15 : 30;
      const projDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      setProjectedInfo({
        days,
        dateStr: formatDateDisplay(projDate.toISOString()),
        value: data.value,
      });
      setProjectedModalVisible(true);
      return;
    }

    const pointIndex = isSinglePoint ? 0 : data.index;
    const point = reversedHistory[pointIndex];
    if (point) {
      setSelectedPoint(point);
      setEditValue(point.value.toString());
      setPointModalVisible(true);
    }
  };

  // Save edited value
  const handleSaveEdit = async () => {
    if (!selectedPoint || !selectedPoint.id || !name) return;
    const parsed = parseFloat(editValue);
    if (isNaN(parsed) || parsed <= 0) {
      Toast.show({
        type: "error",
        text1: "Medida no válida",
        text2: "Ingresa un número mayor a 0",
      });
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const normalized = normalizeBodyPartKey(name);
      await updateMeasure(selectedPoint.id, {
        [normalized]: parsed,
      });
      Toast.show({
        type: "success",
        text1: "Medida actualizada",
        text2: `Nuevo valor: ${parsed} cm`,
      });
      setPointModalVisible(false);
      await fetchMeasureHistory();
    } catch (error) {
      console.error("Error updating measure:", error);
      Toast.show({
        type: "error",
        text1: "Error al actualizar",
        text2: "No se pudo guardar la medida.",
      });
    }
  };

  // Confirm delete handler
  const handleConfirmDelete = async () => {
    if (!selectedPoint || !selectedPoint.id) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await deleteMeasure(selectedPoint.id);
      setConfirmDeleteVisible(false);
      setPointModalVisible(false);
      Toast.show({
        type: "success",
        text1: "Registro eliminado",
        text2: "Se eliminó el registro de medidas de ese día.",
      });
      await fetchMeasureHistory();
    } catch (error) {
      console.error("Error deleting measure:", error);
      Toast.show({
        type: "error",
        text1: "Error al eliminar",
        text2: "No se pudo eliminar el registro.",
      });
    }
  };

  // Future calculator projected value
  const calculatedFutureDate = useMemo(() => {
    const d = new Date(Date.now() + calculatorDays * 24 * 60 * 60 * 1000);
    return formatDateDisplay(d.toISOString());
  }, [calculatorDays]);

  const calculatedFutureValue = useMemo(() => {
    return Number((latestVal + stats.dailyRate * calculatorDays).toFixed(1));
  }, [latestVal, stats.dailyRate, calculatorDays]);

  const calculatedFutureDiff = useMemo(() => {
    return Number((stats.dailyRate * calculatorDays).toFixed(1));
  }, [stats.dailyRate, calculatorDays]);

  const calculatedFuturePct = useMemo(() => {
    return latestVal > 0
      ? Number(((calculatedFutureDiff / latestVal) * 100).toFixed(1))
      : 0;
  }, [latestVal, calculatedFutureDiff]);

  // Exercise history stats
  const globalBest = useMemo(() => {
    let best = { bestWeight: 0, bestReps: 0, name: 0 };
    muscleExerciseHistory.forEach((log) => {
      const bestWeightInLog = Math.max(log.bestWeight || 0, ...(log.sets?.map((s) => s.peso || 0) || []));
      const bestRepsInLog = Math.max(log.bestReps || 0, ...(log.sets?.map((s) => s.reps || 0) || []));
      const currentCandidate = { peso: bestWeightInLog, reps: bestRepsInLog };
      const currentBest = { peso: best.bestWeight, reps: best.bestReps };
      if (isBetterSet(currentCandidate, currentBest)) {
        best = {
          bestWeight: bestWeightInLog,
          bestReps: bestRepsInLog,
          name: log.exerciseId,
        };
      }
    });
    return best;
  }, [muscleExerciseHistory]);

  const getFrecuencia = (history: ExerciseHistory[]) => {
    const uniqueDates = [...new Set(history.map((h) => h.date.split("T")[0]))];
    return (uniqueDates.length / 4).toFixed(1);
  };

  const avgRPE =
    muscleExerciseHistory.length > 0
      ? muscleExerciseHistory.reduce((acc, log) => {
          const logRPE =
            log.sets.reduce((sum, set) => sum + (set.reps || 0), 0) /
            log.sets.length;
          return acc + logRPE;
        }, 0) / muscleExerciseHistory.length
      : 0;

  const truncateExerciseName = (name?: string, maxChars = 24) => {
    if (!name) return "";
    return name.length > maxChars ? `${name.slice(0, maxChars)}...` : name;
  };

  const topExercises = useMemo(() => {
    return muscleExerciseHistory.reduce((acc: any, log) => {
      const exerciseInfo =
        catalogExercises.find((ex: any) => ex.id === log.exerciseId) ||
        exercisesData.find((ex: any) => ex.id === log.exerciseId);
      if (!acc[log.exerciseId]) {
        acc[log.exerciseId] = {
          id: log.exerciseId,
          nombre: exerciseInfo?.nombre || `Ejercicio #${log.exerciseId}`,
          objetivo: exerciseInfo?.objetivo || "",
          equipamiento: exerciseInfo?.equipamiento || "",
          ...exerciseInfo,
          totalVolume: log.totalVolume,
        };
      } else {
        acc[log.exerciseId].totalVolume += log.totalVolume;
      }
      return acc;
    }, {});
  }, [muscleExerciseHistory, catalogExercises]);

  const sortedTop = useMemo(() => {
    return Object.values(topExercises).sort(
      (a: any, b: any) => b.totalVolume - a.totalVolume
    );
  }, [topExercises]);

  const totalVolume = muscleExerciseHistory.reduce(
    (acc, log) => acc + log.totalVolume,
    0
  );

  const generateMuscleProgressSummary = () => {
    if (!name) return "";
    const muscleTitle = name.charAt(0).toUpperCase() + name.slice(1);
    let text = `💪 Progreso Muscular: ${muscleTitle}\n`;
    text += `📅 Fecha: ${new Date().toLocaleDateString("es-ES")}\n\n`;

    text += `📏 Medidas Corporales:\n`;
    if (latestVal > 0) {
      text += `• Medida Actual: ${latestVal} cm\n`;
      text += `• Tendencia Mensual: ${monthlyRate >= 0 ? "+" : ""}${monthlyRate} cm/mes\n`;
      text += `• Total de Registros: ${measureHistory.length}\n`;
    } else {
      text += `• Sin registros de medida aún.\n`;
    }

    text += `\n🏋️ Rendimiento en Entrenamiento:\n`;
    text += `• Volumen Total Levantado: ${Math.round(totalVolume).toLocaleString()} kg\n`;
    text += `• Frecuencia Promedio: ${getFrecuencia(muscleExerciseHistory)} entrenamientos/sem\n`;
    if (globalBest.bestWeight > 0 || globalBest.bestReps > 0) {
      const bestEx =
        catalogExercises.find((e: any) => e.id === globalBest.name) ||
        exercisesData.find((e: any) => e.id === globalBest.name);
      if (globalBest.bestWeight > 0) {
        text += `• Récord Máximo: ${globalBest.bestWeight} kg x ${globalBest.bestReps} reps (${bestEx?.nombre || "Ejercicio"})\n`;
      } else {
        text += `• Récord Máximo: ${globalBest.bestReps} reps peso corporal (${bestEx?.nombre || "Ejercicio"})\n`;
      }
    }

    if (sortedTop.length > 0) {
      text += `\n🔝 Ejercicios Principales:\n`;
      sortedTop.slice(0, 3).forEach((ex: any, i: number) => {
        text += `${i + 1}. ${ex.nombre}: ${Math.round(ex.totalVolume).toLocaleString()} kg\n`;
      });
    }

    text += `\n🚀 ¡Registrado con Fitterme!`;
    return text;
  };

  return (
    <ScrollView style={globalStyles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View
        style={[
          globalStyles.header,
          { marginBottom: 20, alignItems: "center" },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={globalStyles.title}>{(name || "").toUpperCase()}</Text>
        <ShareButton text={generateMuscleProgressSummary()} />
      </View>

      {/* Chart Section */}
      <View
        style={[
          globalStyles.card,
          {
            width: "100%",
            padding: 16,
            alignItems: hasHistory ? "stretch" : "center",
            marginBottom: 20,
          },
        ]}
      >
        {/* Toggle Mode: Historial vs Proyección +1 Mes */}
        {hasHistory && (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="stats-chart" size={18} color={colors.primary} />
              <Text style={{ fontSize: 13, fontWeight: "bold", color: colors.text }}>
                PROGRESO & CURVA
              </Text>
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
                  +1 Mes Predictivo
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {hasHistory ? (
          <>
            <LineChart
              data={{
                labels: displayChartLabels,
                datasets: [{ data: displayChartData }],
              }}
              width={Dimensions.get("window").width - 64}
              height={210}
              chartConfig={{
                backgroundColor: colors.surface,
                backgroundGradientFrom: colors.surface,
                backgroundGradientTo: colors.surface,
                color: (opacity = 1) =>
                  showProjection ? colors.primary : colors.primary,
                labelColor: () => colors.textSecondary,
                decimalPlaces: 1,
                propsForDots: {
                  r: "5.5",
                  strokeWidth: "2",
                  stroke: colors.primary,
                  fill: colors.background,
                },
              }}
              bezier={!isSinglePoint}
              withDots={true}
              withVerticalLines={false}
              withOuterLines={false}
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
                Toca cualquier punto para{" "}
                <Text style={{ color: colors.primary, fontWeight: "bold" }}>
                  editar o eliminar
                </Text>
              </Text>
            </View>
          </>
        ) : (
          <View style={{ paddingVertical: 20, alignItems: "center" }}>
            <Ionicons
              name="analytics-outline"
              size={36}
              color={colors.textSecondary}
            />
            <Text
              style={[
                globalStyles.cardText,
                { marginTop: 10, textAlign: "center" },
              ]}
            >
              No hay historial de medidas válidas para este músculo aún.
            </Text>
          </View>
        )}
      </View>

      {/* 1-Month Prediction Card */}
      {hasHistory && (
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
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
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
              <View>
                <Text style={{ fontSize: 14, fontWeight: "bold", color: colors.text }}>
                  PREDICCIÓN MUSCULAR A 1 MES
                </Text>
                <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                  Basado en curva estadística y volumen
                </Text>
              </View>
            </View>
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 8,
                backgroundColor: colors.primary + "25",
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: "bold", color: colors.primary }}>
                PROYECCIÓN
              </Text>
            </View>
          </View>

          {/* Main projection display */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "baseline",
              justifyContent: "space-between",
              backgroundColor: colors.background,
              padding: 14,
              borderRadius: 14,
              marginBottom: 12,
            }}
          >
            <View>
              <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 2 }}>
                Medida estimada en 30 días
              </Text>
              <Text style={{ fontSize: 32, fontWeight: "bold", color: colors.text }}>
                {predicted30DaysValue}{" "}
                <Text style={{ fontSize: 18, color: colors.textSecondary }}>cm</Text>
              </Text>
            </View>

            <View style={{ alignItems: "flex-end" }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 3,
                  backgroundColor:
                    diff30Days >= 0 ? colors.primary + "25" : colors.delete + "25",
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 8,
                }}
              >
                <Ionicons
                  name={diff30Days >= 0 ? "trending-up" : "trending-down"}
                  size={16}
                  color={diff30Days >= 0 ? colors.primary : colors.delete}
                />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "bold",
                    color: diff30Days >= 0 ? colors.primary : colors.delete,
                  }}
                >
                  {diff30Days >= 0 ? `+${diff30Days}` : `${diff30Days}`} cm
                </Text>
              </View>
              <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>
                {pct30Days >= 0 ? `+${pct30Days}%` : `${pct30Days}%`} del volumen actual
              </Text>
            </View>
          </View>

          {/* Detailed stats chips */}
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
              <Text style={{ fontSize: 14, fontWeight: "bold", color: colors.text, marginTop: 2 }}>
                {weeklyRate >= 0 ? `+${weeklyRate}` : `${weeklyRate}`} cm
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
              <Text style={{ fontSize: 14, fontWeight: "bold", color: colors.text, marginTop: 2 }}>
                {monthlyRate >= 0 ? `+${monthlyRate}` : `${monthlyRate}`} cm
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
                  color: monthlyRate > 0 ? colors.primary : colors.secondary,
                  marginTop: 2,
                }}
              >
                {monthlyRate > 0 ? "Hipertrofia" : "Definición"}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Date Predictor Calculator */}
      {hasHistory && (
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
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "bold", color: colors.text }}>
                  CALCULADORA DE MEDIDA POR FECHA
                </Text>
                <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                  Suma tiempo para estimar la medida de tu {name}
                </Text>
              </View>
            </View>

            {/* Reset button */}
            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                setCalculatorDays(30);
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

          {/* Quick additive buttons */}
          <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 8 }}>
            Sumar tiempo a la proyección:
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {[
                { label: "+2 sem (+14d)", days: 14 },
                { label: "+1 mes (+30d)", days: 30 },
                { label: "+2 meses (+60d)", days: 60 },
                { label: "+3 meses (+90d)", days: 90 },
                { label: "+6 meses (+180d)", days: 180 },
                { label: "+1 año (+365d)", days: 365 },
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

          {/* Custom days stepper */}
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
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                Ajusta libremente con +/-
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

          {/* Calculator Result Box */}
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
                📅 {calculatedFutureDate}
              </Text>
            </View>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginTop: 4,
              }}
            >
              <View>
                <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                  Medida proyectada:
                </Text>
                <Text style={{ fontSize: 28, fontWeight: "bold", color: colors.text }}>
                  {calculatedFutureValue}{" "}
                  <Text style={{ fontSize: 16, color: colors.textSecondary }}>cm</Text>
                </Text>
              </View>

              <View style={{ alignItems: "flex-end" }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "bold",
                    color: calculatedFutureDiff >= 0 ? colors.primary : colors.delete,
                  }}
                >
                  {calculatedFutureDiff >= 0
                    ? `+${calculatedFutureDiff}`
                    : `${calculatedFutureDiff}`}{" "}
                  cm
                </Text>
                <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                  ({calculatedFuturePct >= 0 ? `+${calculatedFuturePct}` : `${calculatedFuturePct}`}%)
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Muscle Exercise History & Stats */}
      <View>
        <View
          style={[
            globalStyles.card,
            {
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            },
          ]}
        >
          <View>
            <Text style={globalStyles.textSecondary}>RECORD PERSONAL</Text>
            <Text
              style={{
                fontSize: 32,
                fontWeight: "bold",
                color: colors.text,
              }}
            >
              {globalBest.bestWeight > 0 ? (
                <>
                  {globalBest.bestWeight}{" "}
                  <Text style={globalStyles.textSecondary}>kg</Text>
                </>
              ) : globalBest.bestReps > 0 ? (
                <>
                  {globalBest.bestReps}{" "}
                  <Text style={globalStyles.textSecondary}>reps</Text>
                </>
              ) : (
                "--"
              )}
            </Text>
            <Text style={globalStyles.textSecondary}>
              {globalBest.bestWeight > 0
                ? `${globalBest.bestReps} reps`
                : globalBest.bestReps > 0
                  ? "Peso corporal"
                  : "Sin registros"}
            </Text>
          </View>
          <Ionicons name="medal-outline" size={24} color={colors.primary} />
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <View style={[globalStyles.card, { flex: 1 }]}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Ionicons name="time-outline" size={24} color={colors.primary} />
              <Text style={globalStyles.cardTitle}>Frecuencia</Text>
            </View>
            <Text style={globalStyles.title}>
              {getFrecuencia(muscleExerciseHistory)}{" "}
              <Text style={globalStyles.textSecondary}>veces/semana</Text>
            </Text>
          </View>
          <View style={[globalStyles.card, { flex: 1 }]}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Ionicons name="time-outline" size={24} color={colors.primary} />
              <Text style={globalStyles.cardTitle}>INTENSIDAD</Text>
            </View>
            <Text style={globalStyles.title}>
              {avgRPE.toFixed(1)}{" "}
              <Text style={globalStyles.textSecondary}> RPE promedio</Text>
            </Text>
          </View>
        </View>
      </View>

      {/* Top Exercises */}
      <View>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "bold",
            color: colors.text,
            marginBottom: 20,
          }}
        >
          TOP EJERCICIOS
        </Text>
        <View style={{ gap: 10 }}>
          {sortedTop.map((e: any) => (
            <TouchableOpacity
              key={e.id}
              activeOpacity={0.7}
              onPress={() => {
                Haptics.selectionAsync();
                router.push(`/exercises/DetailsExercise/${e.id}` as any);
              }}
              style={[
                globalStyles.card,
                {
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  justifyContent: "space-between",
                },
              ]}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  flex: 1,
                  marginRight: 8,
                }}
              >
                <View
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 10,
                    borderRadius: 50,
                    backgroundColor: colors.primary + 33,
                    flexShrink: 0,
                  }}
                >
                  <Ionicons
                    name="barbell-outline"
                    size={24}
                    color={colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={globalStyles.cardTitle}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {truncateExerciseName(e.nombre, 24)}
                  </Text>
                  <Text
                    style={globalStyles.textSecondary}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {e.objetivo ? `${e.objetivo} • ` : ""}{e.equipamiento || "Sin equipamiento"}
                  </Text>
                </View>
              </View>
              <View style={{ alignItems: "flex-end", flexShrink: 0 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "bold",
                    color: colors.secondary,
                  }}
                >
                  {totalVolume > 0
                    ? `${((e.totalVolume / totalVolume) * 100).toFixed(1)}%`
                    : "Sin datos"}
                </Text>
                <Text style={globalStyles.textSecondary}>
                  {totalVolume > 0 ? "del volumen" : "Sin datos"}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={{ height: 100 }}></View>

      {/* Point Edit / Delete Modal */}
      <Modal
        visible={pointModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPointModalVisible(false)}
      >
        <View style={modalStyles.overlay}>
          <View
            style={[
              globalStyles.card,
              {
                width: "90%",
                maxWidth: 360,
                padding: 20,
                backgroundColor: colors.surface,
                borderRadius: 20,
                borderWidth: 1.5,
                borderColor: colors.primary + "60",
              },
            ]}
          >
            {/* Modal Header */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="create-outline" size={22} color={colors.primary} />
                <Text style={{ fontSize: 17, fontWeight: "bold", color: colors.text }}>
                  Editar o Eliminar Medida
                </Text>
              </View>
              <TouchableOpacity onPress={() => setPointModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Date info */}
            {selectedPoint && (
              <View
                style={{
                  backgroundColor: colors.background,
                  padding: 10,
                  borderRadius: 10,
                  marginBottom: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                <Text style={{ fontSize: 13, color: colors.text, fontWeight: "500" }}>
                  Fecha: {formatDateDisplay(selectedPoint.date)}
                </Text>
              </View>
            )}

            {/* Value adjustment with stepper and text input */}
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: colors.textSecondary,
                marginBottom: 8,
              }}
            >
              VALOR DE LA MEDIDA (CM)
            </Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  const current = parseFloat(editValue) || 0;
                  setEditValue((Math.max(0, current - 0.1)).toFixed(1));
                }}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: colors.background,
                  borderWidth: 1,
                  borderColor: colors.textSecondary + "30",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="remove" size={22} color={colors.text} />
              </TouchableOpacity>

              <View
                style={{
                  minWidth: 100,
                  backgroundColor: colors.background,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.primary,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  alignItems: "center",
                }}
              >
                <TextInput
                  keyboardType="numeric"
                  value={editValue}
                  onChangeText={setEditValue}
                  selectTextOnFocus
                  style={{
                    fontSize: 24,
                    fontWeight: "bold",
                    color: colors.text,
                    textAlign: "center",
                  }}
                />
              </View>

              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  const current = parseFloat(editValue) || 0;
                  setEditValue((current + 0.1).toFixed(1));
                }}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: colors.background,
                  borderWidth: 1,
                  borderColor: colors.textSecondary + "30",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="add" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={{ gap: 10 }}>
              <TouchableOpacity
                onPress={handleSaveEdit}
                style={{
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "bold", color: colors.background }}>
                  Guardar Medida
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setConfirmDeleteVisible(true)}
                style={{
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: colors.delete + "18",
                  borderWidth: 1,
                  borderColor: colors.delete + "40",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: 6,
                }}
              >
                <Ionicons name="trash-outline" size={18} color={colors.delete} />
                <Text style={{ fontSize: 14, fontWeight: "bold", color: colors.delete }}>
                  Eliminar este registro
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Projected Point Details Modal */}
      <Modal
        visible={projectedModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setProjectedModalVisible(false)}
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
              Punto Proyectado (+{projectedInfo?.days} días)
            </Text>
            <Text style={{ fontSize: 13, color: colors.primary, fontWeight: "600", marginBottom: 12 }}>
              {projectedInfo?.dateStr}
            </Text>

            <Text style={{ fontSize: 32, fontWeight: "bold", color: colors.text, marginBottom: 8 }}>
              {projectedInfo?.value}{" "}
              <Text style={{ fontSize: 18, color: colors.textSecondary }}>cm</Text>
            </Text>

            <Text
              style={{
                fontSize: 13,
                color: colors.textSecondary,
                textAlign: "center",
                lineHeight: 18,
                marginBottom: 18,
              }}
            >
              Este punto es una proyección estadística a futuro calculada a partir de tu progreso real.
            </Text>

            <TouchableOpacity
              onPress={() => setProjectedModalVisible(false)}
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

      {/* Non-Native Confirmation Modal for Deletion with same-day measures warning */}
      <ThemeConfirmModal
        visible={confirmDeleteVisible}
        title="¿Eliminar registro del día?"
        message={`¿Estás seguro de que deseas eliminar este registro del ${
          selectedPoint ? formatDateDisplay(selectedPoint.date) : "día"
        }?\n\n⚠️ Advertencia: Al eliminarlo, también se eliminarán las otras medidas corporales que se realizaron ese mismo día.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteVisible(false)}
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

export default DetailsMeasureScreen;
