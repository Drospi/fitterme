import { useTheme } from "@/context/ThemeContext";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface EnergyRemainingCardProps {
  consumedCalories: number;
  targetCalories: number;
}

export default function EnergyRemainingCard({
  consumedCalories,
  targetCalories,
}: EnergyRemainingCardProps) {
  const { colors } = useTheme();

  const remainingCalories = Math.max(0, targetCalories - consumedCalories);
  const caloriesPercent = Math.min(
    100,
    Math.round((consumedCalories / (targetCalories || 1)) * 100)
  );

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.cardBorder || "rgba(255,255,255,0.1)",
        },
      ]}
    >
      <View style={styles.headerRow}>
        <Text
          style={[
            styles.label,
            { color: colors.textSecondary },
          ]}
        >
          ENERGÍA DIARIA • RESTANTE
        </Text>
        <View
          style={[
            styles.percentBadge,
            { backgroundColor: colors.primary + "20" },
          ]}
        >
          <Text style={[styles.percentText, { color: colors.primary }]}>
            {caloriesPercent}%
          </Text>
        </View>
      </View>

      <Text
        style={[
          styles.bigNumber,
          { color: colors.primary },
        ]}
      >
        {remainingCalories}{" "}
        <Text style={[styles.unitText, { color: colors.textSecondary }]}>
          KCAL
        </Text>
      </Text>

      {/* Barra de progreso */}
      <View
        style={[
          styles.progressBarBackground,
          { backgroundColor: colors.background },
        ]}
      >
        <View
          style={[
            styles.progressBarFill,
            {
              backgroundColor: colors.primary,
              width: `${caloriesPercent}%`,
            },
          ]}
        />
      </View>

      <View style={styles.footerRow}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          CONSUMIDAS:{" "}
          <Text style={{ color: colors.primary, fontWeight: "900" }}>
            {consumedCalories} kcal
          </Text>
        </Text>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          OBJETIVO:{" "}
          <Text style={{ color: colors.text, fontWeight: "900" }}>
            {targetCalories} kcal
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.5,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  percentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  percentText: {
    fontSize: 11,
    fontWeight: "900",
  },
  bigNumber: {
    fontSize: 52,
    fontWeight: "900",
    marginVertical: 4,
    letterSpacing: -1,
  },
  unitText: {
    fontSize: 20,
    fontWeight: "800",
  },
  progressBarBackground: {
    height: 10,
    width: "100%",
    marginTop: 10,
    borderRadius: 5,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 5,
  },
  footerRow: {
    marginTop: 14,
    width: "100%",
    justifyContent: "space-between",
    flexDirection: "row",
  },
  footerText: {
    fontSize: 12,
    fontWeight: "700",
  },
});
