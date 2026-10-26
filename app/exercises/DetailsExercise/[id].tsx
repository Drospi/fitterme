import {
  calculateHistoricalSessionMetrics,
  calculateProgressionStats,
} from "@/calculos/exerciseProgression";
import ExerciseHeader from "@/components/exercises/ExerciseHeader";
import ExerciseHistoryLogList from "@/components/exercises/ExerciseHistoryLogList";
import ExerciseInsightCard, {
  ExerciseInsight,
} from "@/components/exercises/ExerciseInsightCard";
import ExercisePBOverview from "@/components/exercises/ExercisePBOverview";
import ExerciseProgressionChart from "@/components/exercises/ExerciseProgressionChart";
import ExerciseProjectionCard from "@/components/exercises/ExerciseProjectionCard";
import ExerciseTargetCalculatorCard from "@/components/exercises/ExerciseTargetCalculatorCard";
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
  deleteExerciseHistoryLog,
  ExerciseHistory,
  getHistoryByExerciseId,
  isBetterSet,
} from "@/store/historyExcercise";
import { getGlobalStyles } from "@/styles/global";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

export default function DetailsExerciseScreen() {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [exercise, setExercise] = useState<ExerciseCatalogItem | null>(null);
  const [history, setHistory] = useState<ExerciseHistory[]>([]);
  const [userSettings, setUserSettings] = useState<UserSettings>({
    unit: "kg",
    weightIncrement: 2.5,
    defaultRestTimer: 90,
  });

  // Calculadora interactiva
  const [calculatorDays, setCalculatorDays] = useState<number>(30);
  const [targetWeightInput, setTargetWeightInput] = useState<string>("");
  const [targetRepsInput, setTargetRepsInput] = useState<string>("10");
  const [targetSetsInput, setTargetSetsInput] = useState<string>("3");

  // Gráfica
  const [timeRange, setTimeRange] = useState<"1M" | "3M" | "6M">("3M");
  const [showProjection, setShowProjection] = useState<boolean>(true);

  // Modales
  const [deleteExerciseModal, setDeleteExerciseModal] = useState<boolean>(false);
  const [deleteSessionModal, setDeleteSessionModal] = useState<boolean>(false);
  const [sessionToDelete, setSessionToDelete] = useState<ExerciseHistory | null>(null);

  // Modal para detalle de punto clickeado
  const [pointDetailsModal, setPointDetailsModal] = useState<boolean>(false);
  const [selectedPointInfo, setSelectedPointInfo] = useState<{
    date: string;
    value: number;
    sets: string[];
  } | null>(null);

  const loadData = async () => {
    if (!id) return;
    try {
      const exId = parseInt(id);
      const ex = await getExerciseById(exId);
      setExercise(ex || null);

      const hist = await getHistoryByExerciseId(exId);
      setHistory(hist);

      const settings = await getSettings();
      setUserSettings(settings);
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

  const exCategory = useMemo(
    () => (exercise ? getExerciseCategory(exercise) : "Gym"),
    [exercise]
  );
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
      const bestWInLog = Math.max(
        h.bestWeight || 0,
        ...(h.sets?.map((s) => s.peso || 0) || [])
      );
      const bestRInLog = Math.max(
        h.bestReps || 0,
        ...(h.sets?.map((s) => s.reps || 0) || [])
      );
      if (bestWInLog > maxWeight) maxWeight = bestWInLog;
      if (bestRInLog > maxReps) maxReps = bestRInLog;
      totalSets += h.sets?.length || 1;
      if (h.totalVolume > bestVolume) bestVolume = h.totalVolume;
    });

    return { maxWeight, maxReps, totalSets, bestVolume };
  }, [history]);

  // Historial filtrado para la gráfica
  const filteredHistory = useMemo(() => {
    if (!history.length) return [];
    const now = Date.now();
    const daysLimit = timeRange === "1M" ? 30 : timeRange === "3M" ? 90 : 180;
    const cutoff = now - daysLimit * 24 * 60 * 60 * 1000;
    const filtered = history.filter((h) => {
      const t = new Date(h.date).getTime();
      return isNaN(t) || t >= cutoff;
    });
    return filtered.length > 0 ? filtered : history.slice(0, 5);
  }, [history, timeRange]);

  const chronologicalHistory = useMemo(() => {
    return [...filteredHistory].reverse();
  }, [filteredHistory]);

  const historicalMetrics = useMemo(() => {
    return calculateHistoricalSessionMetrics(chronologicalHistory, userSettings.unit);
  }, [chronologicalHistory, userSettings.unit]);

  const progressionStats = useMemo(() => {
    return calculateProgressionStats(history, userSettings.unit);
  }, [history, userSettings.unit]);

  // Curva de datos para la gráfica
  const rawChartData = useMemo(() => {
    if (!historicalMetrics.length) return [0];
    return historicalMetrics.map((h) => h.display1RM);
  }, [historicalMetrics]);

  const rawChartLabels = useMemo(() => {
    return historicalMetrics.map((h, index) => {
      if (index === historicalMetrics.length - 1) return "ÚLT";
      return "";
    });
  }, [historicalMetrics]);

  const displayChartData = useMemo(() => {
    if (!historicalMetrics.length) return [0];
    if (showProjection) {
      const p15 = Number(
        (progressionStats.latest1RM + progressionStats.dailyRate1RM * 15).toFixed(1)
      );
      const p30 = Number(
        (progressionStats.latest1RM + progressionStats.dailyRate1RM * 30).toFixed(1)
      );
      return [...rawChartData, p15, p30];
    }
    if (rawChartData.length === 1) {
      return [rawChartData[0], rawChartData[0]];
    }
    return rawChartData;
  }, [historicalMetrics.length, showProjection, rawChartData, progressionStats]);

  const displayChartLabels = useMemo(() => {
    if (!historicalMetrics.length) return [""];
    if (showProjection) {
      return [...rawChartLabels, "+15d", "+1m"];
    }
    if (rawChartLabels.length === 1) {
      return ["Actual", "Actual"];
    }
    return rawChartLabels;
  }, [historicalMetrics.length, showProjection, rawChartLabels]);

  const workoutInsight: ExerciseInsight = useMemo(() => {
    if (history.length === 0) {
      return {
        type: "EMPTY",
        title: "Sin registros aún",
        tag: "Inicia hoy",
        icon: "fitness-outline",
        color: colors.textSecondary,
        shortMetric: "0 sesiones completadas",
        advice:
          "Registra tu primera serie para comenzar a rastrear sobrecarga progresiva y 1RM.",
      };
    }
    if (history.length < 2) {
      return {
        type: "STARTING",
        title: "Fase de Adaptación",
        tag: "Técnica",
        icon: "leaf-outline",
        color: colors.secondary,
        shortMetric: "1ª sesión registrada",
        advice:
          "¡Estás empezando! Enfócate en aprender la técnica correcta y la cadencia antes de subir cargas.",
      };
    }

    const last = history[0];
    const previous = history[1];

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
        icon: "trophy",
        color: colors.primary,
        shortMetric: weightStr,
        advice: `¡Excelente sesión! Has superado tu rendimiento anterior (${toDisplayWeight(
          last.bestWeight,
          userSettings.unit
        )} ${userSettings.unit} × ${last.bestReps} reps).`,
      };
    } else if (
      last.bestWeight === previous.bestWeight &&
      last.bestReps === previous.bestReps
    ) {
      return {
        type: "MAINTAIN",
        title: "Fuerza Consolidada",
        tag: "Estable",
        icon: "shield-checkmark",
        color: colors.secondary,
        shortMetric: `${toDisplayWeight(
          last.bestWeight,
          userSettings.unit
        )} ${userSettings.unit} constante`,
        advice:
          "Mantienes consistencia. En tu próxima sesión intenta sacar 1 rep extra en la primera serie para inducir sobrecarga.",
      };
    } else {
      return {
        type: "RECOVERY",
        title: "Descarga / Regulación",
        tag: "Regulación",
        icon: "refresh-circle",
        color: "#F59E0B",
        shortMetric: "Volumen adaptado",
        advice:
          "Sesión de regulación para disipar fatiga y consolidar adaptaciones neuromusculares.",
      };
    }
  }, [history, userSettings.unit, colors]);

  const handleDataPointClick = (data: { index: number; value: number }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const item = historicalMetrics[data.index];
    if (item) {
      const setStrings = item.validSets.map((s) =>
        s.peso <= 0
          ? `Corporal x ${s.reps}`
          : `${toDisplayWeight(s.peso, userSettings.unit)} ${userSettings.unit} x ${s.reps}`
      );
      setSelectedPointInfo({
        date: item.date,
        value: data.value,
        sets: setStrings,
      });
      setPointDetailsModal(true);
    }
  };

  const handleConfirmDeleteExercise = async () => {
    if (!exercise) return;
    await deleteExercise(exercise.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Toast.show({
      type: "success",
      text1: "Ejercicio Eliminado",
      text2: `${exercise.nombre} fue removido del catálogo.`,
    });
    router.back();
  };

  const handleConfirmDeleteSession = async () => {
    if (!sessionToDelete) return;
    await deleteExerciseHistoryLog(sessionToDelete.id);
    setDeleteSessionModal(false);
    setSessionToDelete(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    loadData();
  };

  const generateShareText = () => {
    if (!exercise) return "";
    return `🏋️ Progreso de ${exercise.nombre}: Mejor Carga: ${toDisplayWeight(
      stats.maxWeight,
      userSettings.unit
    )} ${userSettings.unit} | Máx Reps: ${stats.maxReps} | 1RM: ${progressionStats.latest1RM} ${userSettings.unit} 🚀`;
  };

  if (loading) {
    return (
      <View
        style={[
          globalStyles.container,
          {
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: colors.background,
          },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!exercise) {
    return (
      <View
        style={[
          globalStyles.container,
          {
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: colors.background,
          },
        ]}
      >
        <Text style={[globalStyles.cardText, { color: colors.text }]}>
          Ejercicio no encontrado.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[globalStyles.button, { marginTop: 20 }]}
        >
          <Text style={globalStyles.buttonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={[globalStyles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* 1. Header con foto, tags y acciones */}
      <ExerciseHeader
        exercise={exercise}
        onBack={() => router.back()}
        onDelete={() => setDeleteExerciseModal(true)}
        shareText={generateShareText()}
      />

      {/* 2. Insight del Coach / Algoritmo */}
      <ExerciseInsightCard insight={workoutInsight} />

      {/* 3. Cuadrícula de Récords Personales (PB) */}
      <ExercisePBOverview
        isCardio={isCardio}
        isBodyweight={isBodyweight}
        maxWeight={stats.maxWeight}
        maxReps={stats.maxReps}
        oneRM={progressionStats.latest1RM}
        bestVolume={stats.bestVolume}
        unit={userSettings.unit}
        colors={colors}
      />

      {/* 4. Gráfica de Progresión de 1RM / Repeticiones */}
      {historicalMetrics.length > 0 && (
        <ExerciseProgressionChart
          chartData={displayChartData}
          chartLabels={displayChartLabels}
          timeRange={timeRange}
          showProjection={showProjection}
          unit={userSettings.unit}
          isCardio={isCardio}
          isBodyweight={isBodyweight}
          onSelectTimeRange={setTimeRange}
          onToggleProjection={() => setShowProjection((prev) => !prev)}
          onDataPointClick={handleDataPointClick}
        />
      )}

      {/* 5. Proyección a Futuro (+días) */}
      {history.length > 0 && (
        <ExerciseProjectionCard
          stats={progressionStats}
          unit={userSettings.unit}
          days={calculatorDays}
          onDaysChange={setCalculatorDays}
        />
      )}

      {/* 6. Calculadora de Objetivos (Target Calculator) */}
      {history.length > 0 && (
        <ExerciseTargetCalculatorCard
          stats={progressionStats}
          unit={userSettings.unit}
          targetWeight={targetWeightInput}
          targetReps={targetRepsInput}
          targetSets={targetSetsInput}
          onChangeWeight={setTargetWeightInput}
          onChangeReps={setTargetRepsInput}
          onChangeSets={setTargetSetsInput}
        />
      )}

      {/* 7. Historial de Sesiones Registradas */}
      <ExerciseHistoryLogList
        history={history}
        isCardio={isCardio}
        isBodyweight={isBodyweight}
        unit={userSettings.unit}
        onDeleteSession={(session) => {
          setSessionToDelete(session);
          setDeleteSessionModal(true);
        }}
      />

      {/* Modal de Detalle de Punto de la Gráfica */}
      <Modal
        visible={pointDetailsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setPointDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Sesión {selectedPointInfo?.date}
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.primary }]}>
              1RM Estimado: {selectedPointInfo?.value} {userSettings.unit}
            </Text>
            <View style={styles.modalSetsList}>
              {selectedPointInfo?.sets.map((s, idx) => (
                <Text
                  key={idx}
                  style={[styles.modalSetItem, { color: colors.textSecondary }]}
                >
                  Serie {idx + 1}: {s}
                </Text>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: colors.primary }]}
              onPress={() => setPointDetailsModal(false)}
            >
              <Text
                style={[styles.modalCloseButtonText, { color: colors.background }]}
              >
                Cerrar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modales de Confirmación */}
      <ThemeConfirmModal
        visible={deleteExerciseModal}
        title="¿Eliminar ejercicio?"
        message={`¿Estás seguro de eliminar "${exercise.nombre}" de tu catálogo? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDestructive
        onConfirm={handleConfirmDeleteExercise}
        onCancel={() => setDeleteExerciseModal(false)}
      />

      <ThemeConfirmModal
        visible={deleteSessionModal}
        title="¿Eliminar sesión del historial?"
        message={`¿Deseas borrar el registro del día ${sessionToDelete?.date}? Tus récords y 1RM se recalcularán automáticamente.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDestructive
        onConfirm={handleConfirmDeleteSession}
        onCancel={() => setDeleteSessionModal(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 4,
    marginBottom: 12,
  },
  modalSetsList: {
    width: "100%",
    gap: 6,
    marginBottom: 16,
  },
  modalSetItem: {
    fontSize: 13,
  },
  modalCloseButton: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  modalCloseButtonText: {
    fontWeight: "bold",
    fontSize: 14,
  },
});
