import { useTheme } from "@/context/ThemeContext";
import { getExerciseIdByExerciseName } from "@/store/excercise";
import {
  ExerciseHistory,
  getHistoryByExerciseId,
} from "@/store/historyExcercise";
import { getGlobalStyles } from "@/styles/global";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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

  if (loading) return <ActivityIndicator size="large" />;

  const chartData =
    history.length > 0
      ? history.map(
          (h) => h.totalVolume / h.sets.reduce((acc, set) => acc + set.reps, 0),
        )
      : [0];
  const chartLabels = history.map((h, index) => {
    if (index === history.length - 1) return "ULT";

    const prevDate = history[index - 1]?.date;
    const currMonth = getMonthName(h.date); // Tu función que devuelve "JUL"
    const prevMonth = prevDate ? getMonthName(prevDate) : null;

    if (currMonth !== prevMonth) {
      return currMonth;
    }

    return "";
  });

  const getWorkoutAdvice = (history: ExerciseHistory[]) => {
    if (history.length < 2)
      return "¡Estás empezando! Enfócate en aprender la técnica correcta.";

    const last = history[history.length - 1];
    const previous = history[history.length - 2];

    if (last.bestWeight > previous.bestWeight) {
      return `¡Excelente! Has superado tu récord anterior. Subiste ${last.bestWeight - previous.bestWeight}kg. ¡Sigue así!`;
    } else if (last.bestWeight === previous.bestWeight) {
      return "Mantienes un peso sólido. Intenta añadir una repetición extra en tu próxima serie para progresar.";
    } else {
      return "No te preocupes por el peso menor hoy; a veces el cuerpo necesita una sesión de recuperación. ¡Mañana será mejor!";
    }
  };

  return (
    <ScrollView style={[globalStyles.container, { flex: 1, padding: 10 }]}>
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
        <Text style={globalStyles.title}>{id}</Text>
      </View>
      <View>
        <Text style={globalStyles.textSecondary}>1RM ESTIMADO</Text>
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
            {history.reduce((max, h) => {
              return Math.max(max, h.bestWeight);
            }, 0)}{" "}
            <Text style={globalStyles.textSecondary}>kg</Text>
          </Text>
          <View
            style={[
              globalStyles.card,
              {
                flexDirection: "row",
                gap: 10,
                padding: 0,
                height: 40,
                alignItems: "center",
                width: 160,
                justifyContent: "space-between",
                marginBottom: 20,
              },
            ]}
          >
            <TouchableOpacity
              style={{
                height: "100%",
                padding: 10,
                borderRadius: 10,
              }}
            >
              <Text style={globalStyles.text}>1M</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: colors.primary,
                height: "100%",
                padding: 10,
                borderRadius: 10,
              }}
            >
              <Text style={globalStyles.buttonText}>2M</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                height: "100%",
                padding: 10,
                borderRadius: 10,
              }}
            >
              <Text style={globalStyles.text}>3M</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
        {history.length > 0 && (
          <LineChart
            data={{
              labels: chartLabels,
              datasets: [{ data: chartData }],
            }}
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
        )}
      </View>

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
          <Text style={globalStyles.textSecondary}>MEJOR PESO (PR)</Text>
          <Text
            style={[
              globalStyles.textSecondary,
              { fontSize: 32, color: colors.primary, fontWeight: "bold" },
            ]}
          >
            {history.reduce((max, h) => {
              return Math.max(max, h.bestWeight);
            }, 0)}{" "}
            <Text style={globalStyles.textSecondary}>kg</Text>
          </Text>
        </View>

        <View style={[globalStyles.card, { flex: 1 }]}>
          <Ionicons name="barbell" size={30} color={colors.secondary} />
          <Text style={globalStyles.textSecondary}>MEJOR REPETICIONES</Text>
          <Text
            style={[
              globalStyles.textSecondary,
              { fontSize: 32, color: colors.text, fontWeight: "bold" },
            ]}
          >
            {history.reduce((max, h) => {
              return Math.max(max, h.bestReps);
            }, 0)}{" "}
            <Text style={globalStyles.textSecondary}>reps</Text>
          </Text>
        </View>

        <View style={[globalStyles.card, { flex: 1 }]}>
          <Ionicons
            name="reload-circle-outline"
            size={30}
            color={colors.textSecondary}
          />
          <Text style={globalStyles.textSecondary}>TOTAL SERIES</Text>
          <Text
            style={[
              globalStyles.textSecondary,
              { fontSize: 32, color: colors.text, fontWeight: "bold" },
            ]}
          >
            {history.reduce((total, log) => total + log.sets.length, 0)}{" "}
            <Text style={globalStyles.textSecondary}>series</Text>
          </Text>
        </View>
      </View>

      <View
        style={[globalStyles.card, { marginBottom: 20, flexDirection: "row" }]}
      >
        <Ionicons
          name="stats-chart"
          size={30}
          color={colors.primary}
        ></Ionicons>
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text style={globalStyles.cardTitle}>
            {history.length > 0 ? "Análisis de Progreso" : "Historial"}
          </Text>
          <Text style={[globalStyles.cardText, { flexWrap: "wrap" }]}>
            {history.length > 0
              ? getWorkoutAdvice(history)
              : "Aún no tienes registros. ¡Completa tu primer ejercicio para ver tu análisis!"}
          </Text>
        </View>
      </View>

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
        {history.length > 0 &&
          history.map((item, index) => {
            return (
              <View
                key={index}
                style={[
                  globalStyles.card,
                  {
                    flexDirection: "row",
                    gap: 10,
                    justifyContent: "space-between",
                    alignItems: "center",
                  },
                ]}
              >
                <View style={{ flexDirection: "row" }}>
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
                    <Text style={globalStyles.cardTitle}>
                      {item.date
                        .toString()
                        .slice(0, 10)
                        .split("-")
                        .reverse()
                        .join("/")}
                    </Text>
                    <Text style={globalStyles.cardText}>
                      {item.bestWeight}kg x {item.bestReps} reps
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  {item.totalVolume ===
                    history.reduce((best, log) =>
                      log.totalVolume > best.totalVolume ? log : best,
                    ).totalVolume && (
                    <Popover
                      from={
                        <TouchableOpacity>
                          <Ionicons
                            name="barbell"
                            size={30}
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
                  {item.bestWeight ===
                    history.reduce((best, log) =>
                      log.bestWeight > best.bestWeight ? log : best,
                    ).bestWeight && (
                    <Popover
                      from={
                        <TouchableOpacity>
                          <Ionicons
                            name="medal"
                            size={30}
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

      {history.length === 0 && <Text>No hay historial disponible.</Text>}
    </ScrollView>
  );
};

export default DetailsExerciseScreen;
