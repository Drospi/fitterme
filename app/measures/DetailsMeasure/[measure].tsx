import { useTheme } from "@/context/ThemeContext";
import { ExerciseHistory, getHistoryByMuscle } from "@/store/historyExcercise";
import { Measure, getHistoryForBodyPart } from "@/store/measures";
import { getGlobalStyles } from "@/styles/global";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Dimensions, ScrollView, Text, View } from "react-native";
import { LineChart } from "react-native-chart-kit";
import exercisesData from "../../../src/data/exercises.json";

const DetailsMeasureScreen = () => {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  const router = useRouter();

  const { name } = useLocalSearchParams<{ name: string }>();

  const [measureHistory, setMeasureHistory] = useState([
    {
      date: "",
      value: 0,
    },
  ]);
  const [muscleExerciseHistory, setMuscleExerciseHistory] = useState<
    ExerciseHistory[]
  >([]);

  useEffect(() => {
    const fetchMeasureHistory = async () => {
      try {
        const bodyMeasure = await getHistoryForBodyPart(
          name.toLowerCase().trim() as keyof Measure,
        );
        const muscleExHistory = await getHistoryByMuscle(
          name.toLowerCase().trim() as keyof Measure,
        );
        setMeasureHistory(bodyMeasure);
        setMuscleExerciseHistory(muscleExHistory);
      } catch (error) {
        console.error("Error fetching measure history:", error);
      }
    };

    fetchMeasureHistory();
  }, [name]);

  console.log("Muscle Exercise History:", muscleExerciseHistory);
  console.log("Measure History:", measureHistory);

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

  const chartData =
    measureHistory.length > 0
      ? measureHistory.map((h) => h.value || (h.value === 0 ? h.value : 0, 0))
      : [0];
  const chartLabels = measureHistory.map((h, index) => {
    const prevDate = measureHistory[index - 1]?.date;
    const currMonth = getMonthName(h.date); // Tu función que devuelve "JUL"
    const prevMonth = prevDate ? getMonthName(prevDate) : null;

    if (currMonth !== prevMonth) {
      return currMonth;
    }

    return "";
  });

  const reversedChartData = [...chartData].reverse();
  const reversedChartLabels = [...chartLabels].reverse();

  const globalBest = muscleExerciseHistory.reduce(
    (best, log) => {
      return log.bestWeight > best.bestWeight
        ? {
            bestWeight: log.bestWeight,
            bestReps: log.bestReps,
            name: log.exerciseId,
          }
        : best;
    },
    { bestWeight: 0, bestReps: 0 },
  );

  const getFrecuencia = (history: ExerciseHistory[]) => {
    const uniqueDates = [...new Set(history.map((h) => h.date.split("T")[0]))];
    // Si asumes un periodo de 4 semanas (como en tu gráfica):
    return (uniqueDates.length / 4).toFixed(1);
  };

  const avgRPE =
    muscleExerciseHistory.reduce((acc, log) => {
      const logRPE =
        log.sets.reduce((sum, set) => sum + (set.reps || 0), 0) /
        log.sets.length;
      return acc + logRPE;
    }, 0) / muscleExerciseHistory.length;

  const topExercises = muscleExerciseHistory.reduce((acc: any, log) => {
    // 1. Buscamos el detalle del ejercicio en tu base de datos (ejercicios.json)
    const exerciseInfo = exercisesData.find(
      (ex: any) => ex.id === log.exerciseId,
    );

    // 2. Si no existe en el acumulador, lo inicializamos con toda su info + el volumen
    if (!acc[log.exerciseId]) {
      acc[log.exerciseId] = {
        ...exerciseInfo,
        totalVolume: log.totalVolume, // Iniciamos el volumen
      };
    } else {
      acc[log.exerciseId].totalVolume += log.totalVolume;
    }

    return acc;
  }, {});

  const sortedTop = Object.values(topExercises).sort(
    (a: any, b: any) => b.totalVolume - a.totalVolume,
  );

  const totalVolume = muscleExerciseHistory.reduce(
    (acc, log) => acc + log.totalVolume,
    0,
  );

  console.log("Sorted Top:", sortedTop);

  return (
    <ScrollView style={globalStyles.container}>
      <View
        style={[
          globalStyles.header,
          { marginBottom: 20, alignItems: "center" },
        ]}
      >
        <Ionicons
          onPress={() => router.back()}
          name="arrow-back"
          size={24}
          color={colors.text}
        />
        <Text style={globalStyles.title}>{name.toUpperCase()}</Text>
        <Ionicons name="ellipsis-vertical" size={24} color={colors.text} />
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
        {measureHistory.length > 0 && (
          <LineChart
            data={{
              labels: reversedChartLabels,
              datasets: [{ data: reversedChartData }],
            }}
            width={Dimensions.get("window").width - 60}
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
            withDots={false}
            withVerticalLines={false}
            withOuterLines={false}
            withHorizontalLines={true}
            style={{ borderRadius: 16, marginBottom: 20 }}
          />
        )}
      </View>

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
              {globalBest.bestWeight}{" "}
              <Text style={globalStyles.textSecondary}>kg</Text>
            </Text>
            <Text style={globalStyles.textSecondary}>
              {globalBest.bestReps} reps
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
            <View
              key={e.id}
              style={[
                globalStyles.card,
                {
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  justifyContent: "space-between",
                  flex: 1,
                },
              ]}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
              >
                <View
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 10,
                    borderRadius: 50,
                    backgroundColor: colors.primary + 33,
                  }}
                >
                  <Ionicons
                    name="barbell-outline"
                    size={24}
                    color={colors.primary}
                  />
                </View>
                <View>
                  <Text style={globalStyles.cardTitle}>{e.nombre}</Text>
                  <Text style={globalStyles.textSecondary}>
                    {e.objetivo} • {e.equipamiento}
                  </Text>
                </View>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "bold",
                    color: colors.secondary,
                  }}
                >
                  {totalVolume > 0
                    ? ((e.totalVolume / totalVolume) * 100).toFixed(1)
                    : "Sin datos"}
                  %{" "}
                </Text>
                <Text style={globalStyles.textSecondary}>
                  {totalVolume > 0 ? "del volumen" : "Sin datos"}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
      <View style={{ height: 100 }}></View>
    </ScrollView>
  );
};

export default DetailsMeasureScreen;
