import { useTheme } from "@/context/ThemeContext";
import { DailyMealLog } from "@/store/meals";
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface RecentMealsHistoryCardProps {
  pastLogs: DailyMealLog[];
  onViewAll: () => void;
}

export default function RecentMealsHistoryCard({
  pastLogs,
  onViewAll,
}: RecentMealsHistoryCardProps) {
  const { colors } = useTheme();

  if (pastLogs.length === 0) return null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.cardBorder || "rgba(255,255,255,0.08)",
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <Ionicons name="calendar-outline" size={20} color={colors.secondary} />
          <Text style={[styles.title, { color: colors.text }]}>
            HISTORIAL RECIENTE
          </Text>
        </View>
        <TouchableOpacity onPress={onViewAll}>
          <Text style={[styles.viewAllText, { color: colors.primary }]}>
            VER TODOS ▶
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.logsList}>
        {pastLogs.slice(0, 3).map((log) => (
          <View
            key={log.date}
            style={[
              styles.logItem,
              {
                backgroundColor: colors.background,
                borderColor: colors.cardBorder || "rgba(255,255,255,0.06)",
              },
            ]}
          >
            <View style={styles.logHeader}>
              <Text style={[styles.logDate, { color: colors.text }]}>
                {log.date}
              </Text>
              <Text style={[styles.logCalories, { color: colors.primary }]}>
                {log.totalCalories} KCAL
              </Text>
            </View>
            <Text style={[styles.logSubtext, { color: colors.textSecondary }]}>
              {log.consumedMeals.length} comidas • {log.totalProtein}g P • {log.totalCarbs}g C • {log.totalFat}g G
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1.5,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  titleWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "900",
  },
  viewAllText: {
    fontWeight: "900",
    fontSize: 12,
  },
  logsList: {
    gap: 8,
  },
  logItem: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  logDate: {
    fontWeight: "900",
    fontSize: 14,
  },
  logCalories: {
    fontWeight: "900",
    fontSize: 14,
  },
  logSubtext: {
    fontSize: 11,
    fontWeight: "600",
  },
});
