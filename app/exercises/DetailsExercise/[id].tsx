import { useTheme } from "@/context/ThemeContext";
import { getExerciseIdByExerciseName } from "@/store/excercise";
import {
  ExerciseHistory,
  getHistoryByExerciseId,
} from "@/store/historyExcercise";
import { getGlobalStyles } from "@/styles/global";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
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

  const [history, setHistory] = useState<ExerciseHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<"1M" | "2M" | "3M">("2M");

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

  useEffect(() => {
    const loadData = async () => {
      try {
        const resolvedId = await getExerciseIdByExerciseName(id);
        if (resolvedId !== null) {
          const data = await getHistoryByExerciseId(Number(resolvedId));
          setHistory(data);
        }
      } catch (error) {
        console.error("Error al cargar historial:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  // Cálculo optimizado con useMemo para evitar múltiples .reduce() en render
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
    if (!history.length) return [0];
    return history.map(
      (h) => h.totalVolume / h.sets.reduce((acc, set) => acc + set.reps, 0),
    );
  }, [history]);

  const chartLabels = useMemo(() => {
    return history.map((h, index) => {
      if (index === history.length - 1) return "ULT";
      const prevDate = history[index - 1]?.date;
      const currMonth = getMonthName(h.date);
      const prevMonth = prevDate ? getMonthName(prevDate) : null;
      return currMonth !== prevMonth ? currMonth : "";
    });
  }, [history]);

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
      return "No te preocupes por el peso menor hoy; a veces el cuerpo necesita una sesión de recuperación. ¡Mañana será mejor!";
    }
  };

  const calculateBrzycki1RM = (weight: number, reps: number): number => {
    if (reps === 1) return weight;
    if (reps >= 37) return weight;
    return Math.round(weight * (36 / (37 - reps)));
  };

  if (loading)
    return (
      <ActivityIndicator
        size="large"
        style={{ flex: 1, justifyContent: "center" }}
      />
    );

  return (
    <ScrollView style={[globalStyles.container, { flex: 1, padding: 10 }]}>
      {/* Header */}
      <View
        style={[
          globalStyles.header,
          {
            marginBottom: 20,
            gap: 10,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-start",
          },
        ]}
      >
        <Ionicons
          onPress={() => router.back()}
          name="arrow-back"
          size={24}
          color={colors.text}
        />
        <Text style={{ fontWeight: "bold", fontSize: 24, color: colors.text }}>
          {id}
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
            {calculateBrzycki1RM(stats.maxWeight, stats.maxReps)}{" "}
            <Text style={globalStyles.textSecondary}>kg</Text>
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
          <Ionicons name="medal" size={30} color={colors.primary} />
          <Text style={globalStyles.textSecondary}>MEJOR PESO</Text>
          <Text
            style={[
              globalStyles.textSecondary,
              { fontSize: 24, color: colors.primary, fontWeight: "bold" },
            ]}
          >
            {stats.maxWeight} kg
          </Text>
        </View>

        <View style={[globalStyles.card, { flex: 1 }]}>
          <Ionicons name="barbell" size={30} color={colors.secondary} />
          <Text style={globalStyles.textSecondary}>MEJOR REPS</Text>
          <Text
            style={[
              globalStyles.textSecondary,
              { fontSize: 24, color: colors.text, fontWeight: "bold" },
            ]}
          >
            {stats.maxReps} reps
          </Text>
        </View>

        <View style={[globalStyles.card, { flex: 1 }]}>
          <Ionicons
            name="reload-circle-outline"
            size={30}
            color={colors.textSecondary}
          />
          <Text style={globalStyles.textSecondary}>SERIES</Text>
          <Text
            style={[
              globalStyles.textSecondary,
              { fontSize: 24, color: colors.text, fontWeight: "bold" },
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
        <Ionicons name="stats-chart" size={30} color={colors.primary} />
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text style={globalStyles.cardTitle}>
            {history.length > 0 ? "Análisis de Progreso" : "Historial"}
          </Text>
          <Text style={[globalStyles.cardText, { flexWrap: "wrap" }]}>
            {history.length > 0
              ? getWorkoutAdvice(history)
              : "Aún no tienes registros."}
          </Text>
        </View>
      </View>

      {/* Lista de Historial */}
      <View>
        <Text
          style={{
            fontWeight: "bold",
            fontSize: 28,
            color: colors.text,
            marginBottom: 20,
          }}
        >
          Historial
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
                    height: 48,
                    width: 48,
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
                          size={26}
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
                          size={26}
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
        <Text style={{ color: colors.textSecondary, textAlign: "center" }}>
          No hay historial disponible.
        </Text>
      )}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

export default DetailsExerciseScreen;
