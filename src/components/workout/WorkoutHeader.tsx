import { useTheme } from "@/context/ThemeContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface WorkoutHeaderProps {
  title: string;
  categoryLabel?: string;
  elapsedSeconds: number;
  onFinishPress: () => void;
}

export const formatTimerSeconds = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

export default function WorkoutHeader({
  title,
  categoryLabel = "ENTRENAMIENTO ACTIVO",
  elapsedSeconds,
  onFinishPress,
}: WorkoutHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.titleColumn}>
        <Text style={[styles.categoryLabel, { color: colors.primary }]}>
          {categoryLabel}
        </Text>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
      </View>

      <View style={styles.rightRow}>
        {/* Timer Card */}
        <View
          style={[
            styles.timerCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.cardBorder || "rgba(255,255,255,0.08)",
            },
          ]}
        >
          <Ionicons name="timer-outline" size={16} color={colors.primary} />
          <Text style={[styles.timerText, { color: colors.text }]}>
            {formatTimerSeconds(elapsedSeconds)}
          </Text>
        </View>

        {/* Finish Button */}
        <TouchableOpacity
          onPress={onFinishPress}
          style={[
            styles.finishButton,
            {
              backgroundColor: colors.delete + "18",
              borderColor: colors.delete + "35",
            },
          ]}
          activeOpacity={0.7}
        >
          <Ionicons name="flag-outline" size={13} color={colors.delete} />
          <Text style={[styles.finishButtonText, { color: colors.delete }]}>
            Finalizar
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  titleColumn: {
    flex: 1,
    marginRight: 8,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
  },
  rightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  timerText: {
    fontSize: 13,
    fontWeight: "bold",
  },
  finishButton: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  finishButtonText: {
    fontSize: 11,
    fontWeight: "bold",
  },
});
