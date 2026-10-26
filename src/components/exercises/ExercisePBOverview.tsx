import { toDisplayWeight, WeightUnit } from "@/store/conf";
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface ExercisePBOverviewProps {
  isCardio: boolean;
  isBodyweight: boolean;
  maxWeight: number;
  maxReps: number;
  oneRM: number;
  bestVolume: number;
  unit: WeightUnit;
  colors: any;
}

export default function ExercisePBOverview({
  isCardio,
  isBodyweight,
  maxWeight,
  maxReps,
  oneRM,
  bestVolume,
  unit,
  colors,
}: ExercisePBOverviewProps) {
  const displayMaxWeight = toDisplayWeight(maxWeight, unit);
  const displayBestVolume = toDisplayWeight(bestVolume, unit);

  if (isCardio) {
    return (
      <View style={styles.grid}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="time-outline" size={18} color={colors.primary} />
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>RÉCORD TIEMPO</Text>
          </View>
          <Text style={[styles.cardValue, { color: colors.primary }]}>
            {maxReps} <Text style={styles.unitText}>min</Text>
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="flash-outline" size={18} color={colors.secondary} />
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>INTENSIDAD</Text>
          </View>
          <Text style={[styles.cardValue, { color: colors.text }]}>
            {maxWeight > 0 ? `${maxWeight}` : "Progresiva"}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {/* Récord de Carga */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="barbell-outline" size={18} color={colors.primary} />
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
            {isBodyweight ? "MAYOR LASTRE" : "PESO MÁXIMO"}
          </Text>
        </View>
        <Text style={[styles.cardValue, { color: colors.primary }]}>
          {displayMaxWeight} <Text style={styles.unitText}>{unit}</Text>
        </Text>
      </View>

      {/* Récord de Reps */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="repeat-outline" size={18} color={colors.secondary} />
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>MÁX. REPS</Text>
        </View>
        <Text style={[styles.cardValue, { color: colors.secondary }]}>
          {maxReps} <Text style={styles.unitText}>reps</Text>
        </Text>
      </View>

      {/* 1RM Estimado */}
      {!isBodyweight && (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="trophy-outline" size={18} color="#f59e0b" />
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>1RM ESTIMADO</Text>
          </View>
          <Text style={[styles.cardValue, { color: "#f59e0b" }]}>
            {toDisplayWeight(oneRM, unit)} <Text style={styles.unitText}>{unit}</Text>
          </Text>
        </View>
      )}

      {/* Mejor Volumen */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="analytics-outline" size={18} color={colors.text} />
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>MEJOR VOLUMEN</Text>
        </View>
        <Text style={[styles.cardValue, { color: colors.text }]}>
          {displayBestVolume.toLocaleString()} <Text style={styles.unitText}>{unit}</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  card: {
    flex: 1,
    minWidth: "46%",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: "900",
  },
  unitText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
