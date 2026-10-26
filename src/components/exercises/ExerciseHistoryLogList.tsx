import { calculate1RM } from "@/calculos/oneRepMax";
import { useTheme } from "@/context/ThemeContext";
import { toDisplayWeight, WeightUnit } from "@/store/conf";
import { ExerciseHistory } from "@/store/historyExcercise";
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ExerciseHistoryLogListProps {
  history: ExerciseHistory[];
  isCardio: boolean;
  isBodyweight: boolean;
  unit: WeightUnit;
  onDeleteSession: (session: ExerciseHistory) => void;
}

export default function ExerciseHistoryLogList({
  history,
  isCardio,
  isBodyweight,
  unit,
  onDeleteSession,
}: ExerciseHistoryLogListProps) {
  const { colors } = useTheme();

  if (history.length === 0) {
    return (
      <View
        style={[
          styles.emptyCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.cardBorder || "rgba(255,255,255,0.06)",
          },
        ]}
      >
        <Ionicons name="barbell-outline" size={36} color={colors.textSecondary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          Sin historial aún
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          Completa este ejercicio en tus entrenamientos para ver el historial y análisis detallado de sobrecarga.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.primary }]}>
        HISTORIAL DE SESIONES ({history.length})
      </Text>

      <View style={styles.list}>
        {history.map((log, index) => {
          const sets = log.sets || [];
          const bestWeightDisplay = toDisplayWeight(log.bestWeight, unit);
          const totalVolDisplay = toDisplayWeight(log.totalVolume || 0, unit);

          return (
            <View
              key={log.id || `${log.date}-${index}`}
              style={[
                styles.logCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.cardBorder || "rgba(255,255,255,0.08)",
                },
              ]}
            >
              {/* Header de la Sesión */}
              <View style={styles.logHeader}>
                <View style={styles.logHeaderLeft}>
                  <View
                    style={[
                      styles.calendarCircle,
                      { backgroundColor: colors.primary + "18" },
                    ]}
                  >
                    <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={[styles.logDate, { color: colors.text }]}>
                      {log.date}
                    </Text>
                    <Text style={[styles.logSummary, { color: colors.textSecondary }]}>
                      {sets.length} {sets.length === 1 ? "serie" : "series"} • Vol: {totalVolDisplay} {unit}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => onDeleteSession(log)}
                  style={styles.deleteButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.delete} />
                </TouchableOpacity>
              </View>

              {/* Series registradas */}
              <View style={styles.setsList}>
                {sets.map((set, setIdx) => {
                  const setWeightDisplay = toDisplayWeight(set.peso, unit);
                  const estimated1RM = calculate1RM(set.peso, set.reps);
                  const display1RM = toDisplayWeight(estimated1RM, unit);

                  return (
                    <View
                      key={setIdx}
                      style={[
                        styles.setRow,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.cardBorder || "rgba(255,255,255,0.05)",
                        },
                      ]}
                    >
                      <View style={styles.setNumberBadge}>
                        <Text style={[styles.setNumberText, { color: colors.textSecondary }]}>
                          #{setIdx + 1}
                        </Text>
                      </View>

                      {isCardio ? (
                        <Text style={[styles.setText, { color: colors.text }]}>
                          {set.timeMinutes || set.reps || 0} min • {set.intensity || "Moderada"}
                        </Text>
                      ) : isBodyweight ? (
                        <View style={styles.bodyweightSetInfo}>
                          <Text style={[styles.setText, { color: colors.text }]}>
                            {set.reps} reps
                          </Text>
                          {set.peso !== 0 && (
                            <Text style={[styles.lastreText, { color: colors.primary }]}>
                              {set.peso > 0 ? `+${setWeightDisplay} ${unit}` : `-${setWeightDisplay} ${unit}`}
                            </Text>
                          )}
                        </View>
                      ) : (
                        <View style={styles.gymSetInfo}>
                          <Text style={[styles.setText, { color: colors.text }]}>
                            {setWeightDisplay} {unit} × {set.reps} reps
                          </Text>
                          <Text style={[styles.set1RMText, { color: colors.textSecondary }]}>
                            1RM ~{display1RM} {unit}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 12,
  },
  list: {
    gap: 12,
  },
  logCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  logHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  calendarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  logDate: {
    fontSize: 14,
    fontWeight: "bold",
  },
  logSummary: {
    fontSize: 11,
    marginTop: 1,
  },
  deleteButton: {
    padding: 6,
  },
  setsList: {
    gap: 6,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  setNumberBadge: {
    width: 28,
  },
  setNumberText: {
    fontSize: 12,
    fontWeight: "700",
  },
  setText: {
    fontSize: 13,
    fontWeight: "bold",
  },
  bodyweightSetInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  lastreText: {
    fontSize: 12,
    fontWeight: "700",
  },
  gymSetInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flex: 1,
  },
  set1RMText: {
    fontSize: 11,
    fontWeight: "600",
  },
  emptyCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
  },
});
