import {
  estimateDateForTarget,
  ProgressionStats,
  TargetCalculatorResult,
} from "@/calculos/exerciseProgression";
import ThemedInfoPopover from "@/components/common/ThemedInfoPopover";
import { useTheme } from "@/context/ThemeContext";
import { WeightUnit } from "@/store/conf";
import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useMemo } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

interface ExerciseTargetCalculatorCardProps {
  stats: ProgressionStats;
  unit: WeightUnit;
  targetWeight: string;
  targetReps: string;
  targetSets: string;
  onChangeWeight: (val: string) => void;
  onChangeReps: (val: string) => void;
  onChangeSets: (val: string) => void;
}

export default function ExerciseTargetCalculatorCard({
  stats,
  unit,
  targetWeight,
  targetReps,
  targetSets,
  onChangeWeight,
  onChangeReps,
  onChangeSets,
}: ExerciseTargetCalculatorCardProps) {
  const { colors } = useTheme();

  const numWeight = parseFloat(targetWeight) || 0;
  const numReps = parseInt(targetReps) || 10;
  const numSets = parseInt(targetSets) || 3;

  const result: TargetCalculatorResult = useMemo(() => {
    return estimateDateForTarget(numWeight, numReps, numSets, stats, unit);
  }, [numWeight, numReps, numSets, stats, unit]);

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
              { backgroundColor: colors.secondary + "20" },
            ]}
          >
            <Ionicons name="calculator-outline" size={18} color={colors.secondary} />
          </View>
          <View style={styles.titleInfo}>
            <Text style={[styles.title, { color: colors.text }]}>
              CALCULAR OBJETIVO
            </Text>
            <ThemedInfoPopover
              title="Calculadora de Fechas"
              icon="calculator"
              triggerColor={colors.secondary}
              content="Indica la marca que deseas lograr (peso y repeticiones) y el sistema estimará en cuántas semanas y en qué fecha aproximada lo alcanzarás según tu tasa de sobrecarga."
              colors={colors}
            />
          </View>
        </View>
      </View>

      {/* Input Row */}
      <View style={styles.inputsRow}>
        <View style={styles.inputCol}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Peso ({unit})
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                borderColor: colors.cardBorder,
                color: colors.text,
              },
            ]}
            keyboardType="numeric"
            placeholder={stats.latestWeight > 0 ? `${stats.latestWeight + 5}` : "80"}
            placeholderTextColor={colors.textSecondary + "60"}
            value={targetWeight}
            onChangeText={onChangeWeight}
          />
        </View>

        <View style={styles.inputCol}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Reps
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                borderColor: colors.cardBorder,
                color: colors.text,
              },
            ]}
            keyboardType="numeric"
            placeholder="10"
            placeholderTextColor={colors.textSecondary + "60"}
            value={targetReps}
            onChangeText={onChangeReps}
          />
        </View>

        <View style={styles.inputCol}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Series
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                borderColor: colors.cardBorder,
                color: colors.text,
              },
            ]}
            keyboardType="numeric"
            placeholder="3"
            placeholderTextColor={colors.textSecondary + "60"}
            value={targetSets}
            onChangeText={onChangeSets}
          />
        </View>
      </View>

      {/* Result Display Box */}
      <View
        style={[
          styles.resultBox,
          { backgroundColor: colors.background },
        ]}
      >
        <View style={styles.resultHeader}>
          <Text style={[styles.resultDateLabel, { color: colors.textSecondary }]}>
            FECHA ESTIMADA DE CONSECUCIÓN:
          </Text>
          <Text
            style={[
              styles.resultDate,
              { color: result.isAchieved ? colors.primary : colors.secondary },
            ]}
          >
            {result.estimatedDateStr}
          </Text>
        </View>

        {!result.isAchieved && (
          <View style={styles.statsTimelineRow}>
            <View style={styles.timelineItem}>
              <Text style={[styles.timelineLabel, { color: colors.textSecondary }]}>
                Días necesarios
              </Text>
              <Text style={[styles.timelineValue, { color: colors.text }]}>
                ~{result.daysNeeded} días
              </Text>
            </View>

            <View style={styles.timelineItem}>
              <Text style={[styles.timelineLabel, { color: colors.textSecondary }]}>
                Semanas
              </Text>
              <Text style={[styles.timelineValue, { color: colors.text }]}>
                ~{result.weeksNeeded} sem
              </Text>
            </View>

            <View style={styles.timelineItem}>
              <Text style={[styles.timelineLabel, { color: colors.textSecondary }]}>
                1RM Objetivo
              </Text>
              <Text style={[styles.timelineValue, { color: colors.primary }]}>
                {result.target1RM} {unit}
              </Text>
            </View>
          </View>
        )}

        <Text style={[styles.messageText, { color: colors.textSecondary }]}>
          {result.message}
        </Text>
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
  inputsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  inputCol: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 4,
  },
  input: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "bold",
  },
  resultBox: {
    padding: 14,
    borderRadius: 14,
  },
  resultHeader: {
    marginBottom: 8,
  },
  resultDateLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  resultDate: {
    fontSize: 18,
    fontWeight: "bold",
  },
  statsTimelineRow: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    paddingVertical: 8,
  },
  timelineItem: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 10,
  },
  timelineValue: {
    fontSize: 13,
    fontWeight: "bold",
    marginTop: 2,
  },
  messageText: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
});
