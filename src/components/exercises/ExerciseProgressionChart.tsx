import ThemedInfoPopover from "@/components/common/ThemedInfoPopover";
import { useTheme } from "@/context/ThemeContext";
import { WeightUnit } from "@/store/conf";
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LineChart } from "react-native-chart-kit";

interface ExerciseProgressionChartProps {
  chartData: number[];
  chartLabels: string[];
  timeRange: "1M" | "3M" | "6M";
  showProjection: boolean;
  unit: WeightUnit;
  isCardio: boolean;
  isBodyweight: boolean;
  onSelectTimeRange: (range: "1M" | "3M" | "6M") => void;
  onToggleProjection: () => void;
  onDataPointClick: (data: { index: number; value: number }) => void;
}

const screenWidth = Dimensions.get("window").width;

export default function ExerciseProgressionChart({
  chartData,
  chartLabels,
  timeRange,
  showProjection,
  unit,
  isCardio,
  isBodyweight,
  onSelectTimeRange,
  onToggleProjection,
  onDataPointClick,
}: ExerciseProgressionChartProps) {
  const { colors } = useTheme();

  const chartTitle = isCardio
    ? "RITMO Y TIEMPO (MIN)"
    : isBodyweight
      ? "REPETICIONES MÁXIMAS"
      : `FUERZA ESTIMADA (1RM EN ${unit.toUpperCase()})`;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.cardBorder || "rgba(255,255,255,0.08)",
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleInfo}>
          <Text style={[styles.title, { color: colors.text }]}>
            {chartTitle}
          </Text>
          <ThemedInfoPopover
            title={chartTitle}
            icon="trending-up-outline"
            content="Muestra la evolución de tu fuerza y rendimiento a lo largo del tiempo, con proyecciones científicas a futuro."
            colors={colors}
          />
        </View>

        {/* Time range buttons */}
        <View style={styles.rangeRow}>
          {(["1M", "3M", "6M"] as const).map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => onSelectTimeRange(r)}
              style={[
                styles.rangeButton,
                {
                  backgroundColor:
                    timeRange === r ? colors.primary : colors.background,
                },
              ]}
            >
              <Text
                style={[
                  styles.rangeButtonText,
                  {
                    color:
                      timeRange === r
                        ? colors.background
                        : colors.textSecondary,
                    fontWeight: timeRange === r ? "bold" : "600",
                  },
                ]}
              >
                {r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Chart */}
      <LineChart
        data={{
          labels: chartLabels,
          datasets: [{ data: chartData }],
        }}
        width={screenWidth - 44}
        height={190}
        chartConfig={{
          backgroundColor: colors.surface,
          backgroundGradientFrom: colors.surface,
          backgroundGradientTo: colors.surface,
          decimalPlaces: 1,
          color: (opacity = 1) => colors.primary,
          labelColor: (opacity = 1) => colors.textSecondary,
          propsForDots: {
            r: "5",
            strokeWidth: "2",
            stroke: colors.primary,
          },
        }}
        bezier
        style={styles.chart}
        onDataPointClick={onDataPointClick}
      />

      {/* Toggle Projection */}
      <View style={styles.footerRow}>
        <TouchableOpacity
          onPress={onToggleProjection}
          style={[
            styles.toggleButton,
            {
              backgroundColor: showProjection
                ? colors.primary + "18"
                : colors.background,
              borderColor: showProjection ? colors.primary : colors.cardBorder,
            },
          ]}
        >
          <Ionicons
            name={showProjection ? "sparkles" : "sparkles-outline"}
            size={14}
            color={showProjection ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.toggleButtonText,
              {
                color: showProjection ? colors.primary : colors.textSecondary,
                fontWeight: showProjection ? "bold" : "600",
              },
            ]}
          >
            {showProjection ? "Proyección activa (+15d, +1m)" : "Activar proyección"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  titleInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  rangeRow: {
    flexDirection: "row",
    gap: 4,
  },
  rangeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rangeButtonText: {
    fontSize: 10,
  },
  chart: {
    marginVertical: 4,
    borderRadius: 12,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  toggleButtonText: {
    fontSize: 11,
  },
});
