import { useTheme } from "@/context/ThemeContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export interface ExerciseInsight {
  type: string;
  title: string;
  tag: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  shortMetric: string;
  advice: string;
}

interface ExerciseInsightCardProps {
  insight: ExerciseInsight;
}

export default function ExerciseInsightCard({ insight }: ExerciseInsightCardProps) {
  const { colors } = useTheme();

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
        <View style={styles.titleRow}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: insight.color + "20" },
            ]}
          >
            <Ionicons name={insight.icon} size={20} color={insight.color} />
          </View>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>
              {insight.title}
            </Text>
            <Text style={[styles.metricText, { color: insight.color }]}>
              {insight.shortMetric}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.tagBadge,
            { backgroundColor: insight.color + "20" },
          ]}
        >
          <Text style={[styles.tagText, { color: insight.color }]}>
            {insight.tag}
          </Text>
        </View>
      </View>

      <Text style={[styles.adviceText, { color: colors.textSecondary }]}>
        {insight.advice}
      </Text>
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
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 15,
    fontWeight: "bold",
  },
  metricText: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 1,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  adviceText: {
    fontSize: 12,
    lineHeight: 18,
  },
});
