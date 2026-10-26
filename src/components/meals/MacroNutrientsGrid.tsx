import { useTheme } from "@/context/ThemeContext";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface MacroNutrientsGridProps {
  protein: number;
  targetProtein: number;
  carbs: number;
  targetCarbs: number;
  fat: number;
  targetFat: number;
}

export default function MacroNutrientsGrid({
  protein,
  targetProtein,
  carbs,
  targetCarbs,
  fat,
  targetFat,
}: MacroNutrientsGridProps) {
  const { colors } = useTheme();

  const proteinPercent = Math.min(
    100,
    Math.round((protein / (targetProtein || 1)) * 100)
  );
  const carbsPercent = Math.min(
    100,
    Math.round((carbs / (targetCarbs || 1)) * 100)
  );
  const fatPercent = Math.min(
    100,
    Math.round((fat / (targetFat || 1)) * 100)
  );

  const macros = [
    {
      label: "PROTEÍNA",
      value: protein,
      target: targetProtein,
      percent: proteinPercent,
      color: colors.secondary,
    },
    {
      label: "CARBOS",
      value: carbs,
      target: targetCarbs,
      percent: carbsPercent,
      color: colors.flame || "#ff7a00",
    },
    {
      label: "GRASAS",
      value: fat,
      target: targetFat,
      percent: fatPercent,
      color: colors.fat || "#c084fc",
    },
  ];

  return (
    <View style={styles.container}>
      {macros.map((item) => (
        <View
          key={item.label}
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.cardBorder || "rgba(255,255,255,0.08)",
            },
          ]}
        >
          <Text
            style={[
              styles.macroLabel,
              { color: item.color },
            ]}
          >
            {item.label}
          </Text>
          <Text style={[styles.macroValue, { color: colors.text }]}>
            {item.value}g
          </Text>
          <Text style={[styles.targetText, { color: colors.textSecondary }]}>
            / {item.target}g ({item.percent}%)
          </Text>
          <View
            style={[
              styles.barBackground,
              { backgroundColor: colors.background },
            ]}
          >
            <View
              style={[
                styles.barFill,
                {
                  backgroundColor: item.color,
                  width: `${item.percent}%`,
                },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
  },
  macroLabel: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  macroValue: {
    fontSize: 22,
    fontWeight: "900",
    marginTop: 4,
  },
  targetText: {
    fontSize: 10,
    fontWeight: "700",
    marginTop: 1,
  },
  barBackground: {
    height: 5,
    width: "100%",
    marginTop: 8,
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 3,
  },
});
