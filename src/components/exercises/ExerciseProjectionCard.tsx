import {
  DateProjectionResult,
  ProgressionStats,
  projectPerformanceAtDays,
} from "@/calculos/exerciseProgression";
import ThemedInfoPopover from "@/components/common/ThemedInfoPopover";
import { useTheme } from "@/context/ThemeContext";
import { WeightUnit } from "@/store/conf";
import Ionicons from "@expo/vector-icons/Ionicons";
import Slider from "@react-native-community/slider";
import * as Haptics from "expo-haptics";
import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ExerciseProjectionCardProps {
  stats: ProgressionStats;
  unit: WeightUnit;
  days: number;
  onDaysChange: (days: number) => void;
}

export default function ExerciseProjectionCard({
  stats,
  unit,
  days,
  onDaysChange,
}: ExerciseProjectionCardProps) {
  const { colors } = useTheme();

  const projection: DateProjectionResult = useMemo(() => {
    return projectPerformanceAtDays(days, stats, unit);
  }, [days, stats, unit]);

  const QUICK_DAYS = [30, 60, 90, 180];

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
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: colors.primary + "20" },
            ]}
          >
            <Ionicons name="sparkles" size={18} color={colors.primary} />
          </View>
          <View style={styles.titleInfo}>
            <Text style={[styles.title, { color: colors.text }]}>
              PROYECCIÓN A FUTURO
            </Text>
            <ThemedInfoPopover
              title="Predicción de Rendimiento"
              icon="sparkles"
              content="Calcula tu sobrecarga esperada combinando tu tasa real de ganancia de fuerza (1RM) con el tiempo transcurrido."
              colors={colors}
            />
          </View>
        </View>

        <View
          style={[
            styles.dateBadge,
            { backgroundColor: colors.primary + "18" },
          ]}
        >
          <Text style={[styles.dateText, { color: colors.primary }]}>
            📅 {projection.dateStr}
          </Text>
        </View>
      </View>

      {/* Main Projected Prescription Box */}
      <View
        style={[
          styles.projectionBox,
          { backgroundColor: colors.background },
        ]}
      >
        <Text style={[styles.projectionLabel, { color: colors.textSecondary }]}>
          RENDIMIENTO ESTIMADO (+{days} DÍAS):
        </Text>
        <Text style={[styles.projectionMainText, { color: colors.text }]}>
          {projection.fullProjectionText}
        </Text>
        <View style={styles.gainRow}>
          <Text style={[styles.gainText, { color: colors.primary }]}>
            +{projection.gain1RM} {unit} 1RM (+{projection.pct1RM.toFixed(1)}%)
          </Text>
        </View>
      </View>

      {/* Quick Select Buttons */}
      <View style={styles.quickButtonsRow}>
        {QUICK_DAYS.map((d) => (
          <TouchableOpacity
            key={d}
            onPress={() => {
              Haptics.selectionAsync();
              onDaysChange(d);
            }}
            style={[
              styles.quickButton,
              {
                backgroundColor:
                  days === d ? colors.primary : colors.background,
                borderColor:
                  days === d ? colors.primary : colors.cardBorder,
              },
            ]}
          >
            <Text
              style={[
                styles.quickButtonText,
                {
                  color:
                    days === d ? colors.background : colors.textSecondary,
                  fontWeight: days === d ? "900" : "600",
                },
              ]}
            >
              +{d}d
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Slider */}
      <View style={styles.sliderContainer}>
        <Slider
          style={styles.slider}
          minimumValue={7}
          maximumValue={365}
          step={1}
          value={days}
          onValueChange={(val) => onDaysChange(Math.round(val))}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.background}
          thumbTintColor={colors.primary}
        />
      </View>

      {/* Rate Breakdown */}
      <View style={styles.ratesRow}>
        <View
          style={[
            styles.rateItem,
            { backgroundColor: colors.background },
          ]}
        >
          <Text style={[styles.rateLabel, { color: colors.textSecondary }]}>
            Ritmo Semanal
          </Text>
          <Text style={[styles.rateValue, { color: colors.text }]}>
            +{stats.weeklyRate1RM} {unit}
          </Text>
        </View>

        <View
          style={[
            styles.rateItem,
            { backgroundColor: colors.background },
          ]}
        >
          <Text style={[styles.rateLabel, { color: colors.textSecondary }]}>
            Ritmo Mensual
          </Text>
          <Text style={[styles.rateValue, { color: colors.text }]}>
            +{stats.monthlyRate1RM} {unit}
          </Text>
        </View>

        <View
          style={[
            styles.rateItem,
            { backgroundColor: colors.background },
          ]}
        >
          <Text style={[styles.rateLabel, { color: colors.textSecondary }]}>
            Tendencia
          </Text>
          <Text style={[styles.rateValue, { color: colors.primary }]}>
            Sobrecarga 🚀
          </Text>
        </View>
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
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  titleInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
  },
  dateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dateText: {
    fontSize: 11,
    fontWeight: "700",
  },
  projectionBox: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
  },
  projectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  projectionMainText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  gainRow: {
    marginTop: 4,
  },
  gainText: {
    fontSize: 12,
    fontWeight: "800",
  },
  quickButtonsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  quickButton: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  quickButtonText: {
    fontSize: 12,
  },
  sliderContainer: {
    marginBottom: 14,
  },
  slider: {
    width: "100%",
    height: 30,
  },
  ratesRow: {
    flexDirection: "row",
    gap: 8,
  },
  rateItem: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  rateLabel: {
    fontSize: 10,
  },
  rateValue: {
    fontSize: 13,
    fontWeight: "bold",
    marginTop: 2,
  },
});
