import { calculateMeasureTrend } from "@/calculos/statistics";
import MeasureCalculatorCard from "@/components/measures/MeasureCalculatorCard";
import MeasureChartCard from "@/components/measures/MeasureChartCard";
import MeasureHeader from "@/components/measures/MeasureHeader";
import MeasurePerformanceCard, { TopExerciseItem } from "@/components/measures/MeasurePerformanceCard";
import MeasurePredictionCard from "@/components/measures/MeasurePredictionCard";
import { useTheme } from "@/context/ThemeContext";
import exercisesData from "@/data/exercises.json";
import { ExerciseCatalogItem, getAllExercises } from "@/store/excercise";
import { ExerciseHistory, getHistoryByMuscle, isBetterSet } from "@/store/historyExcercise";
import {
  deleteMeasure,
  getHistoryForBodyPart,
  Measure,
  MeasureHistoryItem,
  normalizeBodyPartKey,
  updateMeasure,
} from "@/store/measures";
import { getGlobalStyles } from "@/styles/global";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import Toast from "react-native-toast-message";

const DetailsMeasureScreen = () => {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const { name } = useLocalSearchParams<{ name: string }>();

  const [measureHistory, setMeasureHistory] = useState<MeasureHistoryItem[]>([]);
  const [muscleExerciseHistory, setMuscleExerciseHistory] = useState<ExerciseHistory[]>([]);
  const [catalogExercises, setCatalogExercises] = useState<ExerciseCatalogItem[]>(
    exercisesData as ExerciseCatalogItem[]
  );

  // Chart predictive mode toggle
  const [showProjection, setShowProjection] = useState<boolean>(true);

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
      "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
      "JUL", "AGO", "SEP", "OCT", "NOV", "DIC",
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

  // Regresión lineal y tasa de cambio delegada en @/calculos/statistics
  const stats = useMemo(() => {
    return calculateMeasureTrend(reversedHistory);
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

  // Guardar edición de medida
  const handleSaveEdit = async (point: MeasureHistoryItem, parsedValue: number) => {
    if (!point.id || !name) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const normalized = normalizeBodyPartKey(name);
      await updateMeasure(point.id, {
        [normalized]: parsedValue,
      });
      Toast.show({
        type: "success",
        text1: "Medida actualizada",
        text2: `Nuevo valor: ${parsedValue} cm`,
      });
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

  // Confirmar eliminación de medida
  const handleConfirmDelete = async (point: MeasureHistoryItem) => {
    if (!point.id) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await deleteMeasure(point.id);
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

  // Proyecciones de la calculadora a medida
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

  // Exercise history stats & bests
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

  const topExercises: TopExerciseItem[] = useMemo(() => {
    const aggregated = muscleExerciseHistory.reduce((acc: any, log) => {
      const exerciseInfo =
        catalogExercises.find((ex: any) => ex.id === log.exerciseId) ||
        exercisesData.find((ex: any) => ex.id === log.exerciseId);
      if (!acc[log.exerciseId]) {
        acc[log.exerciseId] = {
          id: log.exerciseId,
          nombre: exerciseInfo?.nombre || `Ejercicio #${log.exerciseId}`,
          objetivo: exerciseInfo?.objetivo || "",
          equipamiento: exerciseInfo?.equipamiento || "",
          totalVolume: log.totalVolume,
        };
      } else {
        acc[log.exerciseId].totalVolume += log.totalVolume;
      }
      return acc;
    }, {});

    return Object.values(aggregated).sort(
      (a: any, b: any) => b.totalVolume - a.totalVolume
    ) as TopExerciseItem[];
  }, [muscleExerciseHistory, catalogExercises]);

  const totalVolume = useMemo(() => {
    return muscleExerciseHistory.reduce((acc, log) => acc + log.totalVolume, 0);
  }, [muscleExerciseHistory]);

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

    if (topExercises.length > 0) {
      text += `\n🔝 Ejercicios Principales:\n`;
      topExercises.slice(0, 3).forEach((ex, i) => {
        text += `${i + 1}. ${ex.nombre}: ${Math.round(ex.totalVolume).toLocaleString()} kg\n`;
      });
    }

    text += `\n🚀 ¡Registrado con Fitterme!`;
    return text;
  };

  return (
    <ScrollView style={globalStyles.container} showsVerticalScrollIndicator={false}>
      {/* 1. Header Modular */}
      <MeasureHeader
        title={name || ""}
        shareText={generateMuscleProgressSummary()}
      />

      {/* 2. Gráfica de Progreso y Curva Modular */}
      <MeasureChartCard
        hasHistory={hasHistory}
        reversedHistory={reversedHistory}
        showProjection={showProjection}
        onToggleProjection={setShowProjection}
        displayChartData={displayChartData}
        displayChartLabels={displayChartLabels}
        isSinglePoint={isSinglePoint}
        onSaveEdit={handleSaveEdit}
        onConfirmDelete={handleConfirmDelete}
        formatDateDisplay={formatDateDisplay}
      />

      {/* 3. Proyección Estadística a 1 Mes */}
      {hasHistory && (
        <MeasurePredictionCard
          latestVal={latestVal}
          predicted30DaysValue={predicted30DaysValue}
          diff30Days={diff30Days}
          pct30Days={pct30Days}
          weeklyRate={weeklyRate}
          monthlyRate={monthlyRate}
        />
      )}

      {/* 4. Calculadora Proyectada Interactiva */}
      {hasHistory && (
        <MeasureCalculatorCard
          calculatorDays={calculatorDays}
          onDaysChange={setCalculatorDays}
          calculatedFutureDate={calculatedFutureDate}
          calculatedFutureValue={calculatedFutureValue}
          calculatedFutureDiff={calculatedFutureDiff}
          calculatedFuturePct={calculatedFuturePct}
        />
      )}

      {/* 5. Rendimiento Muscular y Top Ejercicios */}
      <MeasurePerformanceCard
        globalBest={globalBest}
        frequency={getFrecuencia(muscleExerciseHistory)}
        avgRPE={avgRPE}
        topExercises={topExercises}
        totalVolume={totalVolume}
      />

      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

export default DetailsMeasureScreen;
