import { useTheme } from "@/context/ThemeContext";
import { getSettings, toDisplayWeight, UserSettings } from "@/store/conf";
import {
  deleteExercise,
  ExerciseCatalogItem,
  getExerciseById,
} from "@/store/excercise";
import {
  ExerciseHistory,
  getHistoryByExerciseId,
} from "@/store/historyExcercise";
import { getGlobalStyles } from "@/styles/global";
import { getExerciseImage } from "@/utils/imageMap";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import Toast from "react-native-toast-message";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import Popover from "react-native-popover-view";

const DetailsExerciseScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  const [exercise, setExercise] = useState<ExerciseCatalogItem | null>(null);
  const [history, setHistory] = useState<ExerciseHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<"1M" | "2M" | "3M">("2M");
  const [userSettings, setUserSettings] = useState<UserSettings>({
    unit: "kg",
    weightIncrement: 2.5,
    defaultRestTimer: 90,
  });

  const getMonthName = (dateString: string) => {
    const month = dateString.split("-")[1];
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
    return months[parseInt(month) - 1];
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
    Alert.alert(
      "Eliminar Ejercicio",
      `¿Estás seguro de eliminar "${exercise.nombre}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            await deleteExercise(exercise.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Toast.show({
              type: "success",
              text1: "Ejercicio Eliminado",
              text2: `"${exercise.nombre}" se eliminó del catálogo.`,
            });
            router.back();
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    if (!exercise) return;
    router.push(`/exercises/edit?id=${exercise.id}` as any);
  };

  // Historial ordenado de antiguo a reciente para la gráfica cronológica
  const chronologicalHistory = useMemo(() => {
    return [...history].reverse();
  }, [history]);

  // Cálculo optimizado con useMemo
  const stats = useMemo(() => {
    if (!history.length)
      return { maxWeight: 0, maxReps: 0, totalSets: 0, bestVolume: 0 };

    let maxWeight = 0;
    let maxReps = 0;
    let totalSets = 0;
    let bestVolume = 0;

    history.forEach((h) => {
      if (h.bestWeight > maxWeight) maxWeight = h.bestWeight;
      if (h.bestReps > maxReps) maxReps = h.bestReps;
      totalSets += h.sets.length;
      if (h.totalVolume > bestVolume) bestVolume = h.totalVolume;
    });

    return { maxWeight, maxReps, totalSets, bestVolume };
  }, [history]);

  const chartData = useMemo(() => {
    if (!chronologicalHistory.length) return [0];
    return chronologicalHistory.map(
      (h) => h.totalVolume / h.sets.reduce((acc, set) => acc + set.reps, 0)
    );
  }, [chronologicalHistory]);

  const chartLabels = useMemo(() => {
    return chronologicalHistory.map((h, index) => {
      if (index === chronologicalHistory.length - 1) return "ÚLT";
      const prevDate = chronologicalHistory[index - 1]?.date;
      const currMonth = getMonthName(h.date);
      const prevMonth = prevDate ? getMonthName(prevDate) : null;
      return currMonth !== prevMonth ? currMonth : "";
    });
  }, [chronologicalHistory]);

  const getWorkoutAdvice = (historyList: ExerciseHistory[]) => {
    if (historyList.length < 2)
      return "¡Estás empezando! Enfócate en aprender la técnica correcta.";
    const last = historyList[historyList.length - 1];
    const previous = historyList[historyList.length - 2];

    if (last.bestWeight > previous.bestWeight) {
      return `¡Excelente! Has superado tu récord anterior. Subiste ${last.bestWeight - previous.bestWeight}kg. ¡Sigue así!`;
    } else if (last.bestWeight === previous.bestWeight) {
      return "Mantienes un peso sólido. Intenta añadir una repetición extra en tu próxima serie para progresar.";
    } else {
      return "No te preocupes por el peso menor hoy; a veces el cuerpo necesita una sesión de recuperación.";
    }
  };

  const calculateBrzycki1RM = (weight: number, reps: number): number => {
    if (reps === 1) return weight;
    if (reps >= 37) return weight;
    return Math.round(weight * (36 / (37 - reps)));
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

  return (
    <ScrollView style={[globalStyles.container, { flex: 1, padding: 10 }]}>
      {/* Header con título y botones de Editar / Eliminar */}
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

        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
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
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
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

            <View style={{ backgroundColor: colors.textSecondary + "20", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
              <Text style={{ color: colors.text, fontWeight: "bold", fontSize: 12 }}>
                🎯 {exercise.objetivo}
              </Text>
            </View>

            {exercise.isCustom && (
              <View style={{ backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                <Text style={{ color: colors.background, fontWeight: "bold", fontSize: 12 }}>
                  ✨ PERSONALIZADO
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Sección: ¿Cómo realizar el ejercicio? (Descripción) */}
      <View style={[globalStyles.card, { marginBottom: 20 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Ionicons name="book-outline" size={22} color={colors.primary} />
          <Text style={[globalStyles.cardTitle, { fontSize: 18, fontWeight: "bold", marginBottom: 0 }]}>
            ¿Cómo realizar el ejercicio?
          </Text>
        </View>

        <Text style={[globalStyles.cardText, { fontSize: 14, lineHeight: 22, color: colors.text }]}>
          {exercise.descripcion ||
            "Flexiona y extiende con técnica controlada manteniendo la columna neutra y apretando los músculos al final del movimiento."}
        </Text>
      </View>

      {/* 1RM Estimado y Filtros */}
      <View>
        <Popover
          from={<Text style={globalStyles.textSecondary}>1RM ESTIMADO</Text>}
        >
          <Text style={{ padding: 10 }}>
            Este es tu repeticion maxima de 1 rep con peso maximo.
          </Text>
        </Popover>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text
            style={[
              globalStyles.textSecondary,
              { fontSize: 40, color: colors.primary, fontWeight: "bold" },
            ]}
          >
            {toDisplayWeight(calculateBrzycki1RM(stats.maxWeight, stats.maxReps), userSettings.unit)}{" "}
            <Text style={globalStyles.textSecondary}>{userSettings.unit}</Text>
          </Text>

          <View
            style={[
              globalStyles.card,
              {
                flexDirection: "row",
                gap: 5,
                padding: 0,
                height: 40,
                alignItems: "center",
                width: 150,
                justifyContent: "space-around",
                marginBottom: 20,
              },
            ]}
          >
            {(["1M", "2M", "3M"] as const).map((range) => (
              <TouchableOpacity
                key={range}
                onPress={() => setTimeRange(range)}
                style={{
                  backgroundColor:
                    timeRange === range ? colors.primary : "transparent",
                  height: "100%",
                  paddingHorizontal: 12,
                  justifyContent: "center",
                  borderRadius: 10,
                }}
              >
                <Text
                  style={
                    timeRange === range
                      ? globalStyles.buttonText
                      : globalStyles.text
                  }
                >
                  {range}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Gráfico */}
      {history.length > 0 && (
        <View
          style={[
            globalStyles.card,
            {
              width: "100%",
              padding: 0,
              paddingVertical: 10,
              paddingTop: 30,
              paddingRight: 20,
            },
          ]}
        >
          <LineChart
            data={{ labels: chartLabels, datasets: [{ data: chartData }] }}
            width={Dimensions.get("window").width - 40}
            height={200}
            chartConfig={{
              backgroundColor: colors.surface,
              backgroundGradientFrom: colors.surface,
              backgroundGradientTo: colors.surface,
              color: () => colors.primary,
              labelColor: () => colors.text,
              decimalPlaces: 2,
            }}
            bezier
            withInnerLines={false}
            style={{ borderRadius: 16, marginBottom: 20 }}
          />
        </View>
      )}

      {/* Tarjetas de Estadísticas */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 20,
        }}
      >
        <View style={[globalStyles.card, { flex: 1 }]}>
          <Ionicons name="medal" size={28} color={colors.primary} />
          <Text style={globalStyles.textSecondary}>MEJOR PESO</Text>
          <Text
            style={[
              globalStyles.textSecondary,
              { fontSize: 22, color: colors.primary, fontWeight: "bold" },
            ]}
          >
            {toDisplayWeight(stats.maxWeight, userSettings.unit)} {userSettings.unit}
          </Text>
        </View>

        <View style={[globalStyles.card, { flex: 1 }]}>
          <Ionicons name="barbell" size={28} color={colors.secondary} />
          <Text style={globalStyles.textSecondary}>MEJOR REPS</Text>
          <Text
            style={[
              globalStyles.textSecondary,
              { fontSize: 22, color: colors.text, fontWeight: "bold" },
            ]}
          >
            {stats.maxReps} reps
          </Text>
        </View>

        <View style={[globalStyles.card, { flex: 1 }]}>
          <Ionicons
            name="reload-circle-outline"
            size={28}
            color={colors.textSecondary}
          />
          <Text style={globalStyles.textSecondary}>SERIES</Text>
          <Text
            style={[
              globalStyles.textSecondary,
              { fontSize: 22, color: colors.text, fontWeight: "bold" },
            ]}
          >
            {stats.totalSets}
          </Text>
        </View>
      </View>

      {/* Análisis / Consejo */}
      <View
        style={[
          globalStyles.card,
          { marginBottom: 20, flexDirection: "row", alignItems: "center" },
        ]}
      >
        <Ionicons name="stats-chart" size={28} color={colors.primary} />
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text style={globalStyles.cardTitle}>
            {history.length > 0 ? "Análisis de Progreso" : "Historial"}
          </Text>
          <Text style={[globalStyles.cardText, { flexWrap: "wrap" }]}>
            {history.length > 0
              ? getWorkoutAdvice(history)
              : "Aún no tienes registros para este ejercicio."}
          </Text>
        </View>
      </View>

      {/* Lista de Historial */}
      <View>
        <Text
          style={{
            fontWeight: "bold",
            fontSize: 22,
            color: colors.text,
            marginBottom: 15,
          }}
        >
          Historial de Sesiones
        </Text>
        {history.map((item, index) => {
          const formattedDate = item.date
            .toString()
            .slice(0, 10)
            .split("-")
            .reverse()
            .join("/");
          const isBestVolume = item.totalVolume === stats.bestVolume;
          const isBestWeight = item.bestWeight === stats.maxWeight;

          return (
            <View
              key={`${item.date}-${index}`}
              style={[
                globalStyles.card,
                {
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginVertical: 4,
                },
              ]}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    marginRight: 10,
                    padding: 10,
                    borderRadius: 10,
                    backgroundColor: colors.background,
                    height: 44,
                    width: 44,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Ionicons
                    name="calendar-outline"
                    color={colors.textSecondary}
                    size={20}
                  />
                </View>
                <View>
                  <Text style={globalStyles.cardTitle}>{formattedDate}</Text>
                  <Text style={globalStyles.cardText}>
                    {item.bestWeight}kg x {item.bestReps} reps
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 10 }}>
                {isBestVolume && (
                  <Popover
                    from={
                      <TouchableOpacity>
                        <Ionicons
                          name="barbell"
                          size={24}
                          color={colors.secondary}
                        />
                      </TouchableOpacity>
                    }
                  >
                    <Text style={{ padding: 10 }}>
                      ¡Este es tu mejor tonelaje registrado!
                    </Text>
                  </Popover>
                )}
                {isBestWeight && (
                  <Popover
                    from={
                      <TouchableOpacity>
                        <Ionicons
                          name="medal"
                          size={24}
                          color={colors.primary}
                        />
                      </TouchableOpacity>
                    }
                  >
                    <Text style={{ padding: 10 }}>
                      ¡Este es tu mejor peso registrado!
                    </Text>
                  </Popover>
                )}
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
    </ScrollView>
  );
};

export default DetailsExerciseScreen;
