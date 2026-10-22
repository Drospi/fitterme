import { useTheme } from "@/context/ThemeContext";
import { DayStatus } from "@/utils/dashboardUtils";
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface WeeklyFrequencyCardProps {
  days: DayStatus[];
  weeklyDone: number;
  targetFreq: number;
}

export default function WeeklyFrequencyCard({
  days,
  weeklyDone,
  targetFreq,
}: WeeklyFrequencyCardProps) {
  const { colors } = useTheme();

  const weeklyRemaining = Math.max(0, targetFreq - weeklyDone);
  const isGoalMet = weeklyDone >= targetFreq;

  const motivationalMessage = isGoalMet
    ? "¡Meta semanal cumplida! Eres pura disciplina y constancia."
    : weeklyDone > 0
    ? `¡Llevas ${weeklyDone} días! Solo te ${
        weeklyRemaining === 1 ? "falta 1 sesión" : `faltan ${weeklyRemaining} sesiones`
      } para completar tu meta.`
    : "¡Inicia tu semana con energía! Cada entrenamiento te acerca a tu cambio físico.";

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      {/* Cabecera con Título y Badge "X/Y días" */}
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <Ionicons name="calendar-outline" size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Frecuencia semanal
          </Text>
        </View>

        <View
          style={[
            styles.badge,
            {
              backgroundColor: colors.cardHighlight,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <Text style={[styles.badgeText, { color: colors.primary }]}>
            {weeklyDone}/{targetFreq} días
          </Text>
        </View>
      </View>

      {/* Fila única compacta de 7 puntos */}
      <View style={styles.dotsRow}>
        {days.map((day, idx) => {
          return (
            <View key={idx} style={styles.dayColumn}>
              <Text
                style={[
                  styles.dayLabel,
                  {
                    color: day.isToday ? colors.primary : colors.textSecondary,
                    fontWeight: day.isToday ? "800" : "600",
                  },
                ]}
              >
                {day.label}
              </Text>

              {/* Punto indicador */}
              <View
                style={[
                  styles.dot,
                  day.isTrained
                    ? [styles.dotTrained, { backgroundColor: colors.primary }]
                    : day.isToday
                    ? [styles.dotToday, { borderColor: colors.primary }]
                    : styles.dotEmpty,
                ]}
              >
                {day.isTrained && (
                  <Ionicons name="checkmark" size={13} color={colors.background} />
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Frase corta y motivadora */}
      <Text style={[styles.motivationalText, { color: colors.textSecondary }]}>
        {motivationalMessage}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  titleWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "800",
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 12,
    marginBottom: 12,
  },
  dayColumn: {
    alignItems: "center",
    gap: 6,
  },
  dayLabel: {
    fontSize: 12,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dotTrained: {},
  dotToday: {
    backgroundColor: "transparent",
    borderWidth: 2,
  },
  dotEmpty: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  motivationalText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
});
