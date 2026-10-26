import MeasureItem from "@/components/MeasureItem";
import { useTheme } from "@/context/ThemeContext";
import { Measure, MuscleSummary } from "@/store/measures";
import { getGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ActiveMusclesListProps {
  displayedMuscles: { key: keyof Measure; name: string }[];
  activeMusclesCount: number;
  sanitizedSummary: Record<string, MuscleSummary>;
  showAll: boolean;
  onToggleShowAll: () => void;
  onNavigateMeasures: () => void;
}

export default function ActiveMusclesList({
  displayedMuscles,
  activeMusclesCount,
  sanitizedSummary,
  showAll,
  onToggleShowAll,
  onNavigateMeasures,
}: ActiveMusclesListProps) {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  return (
    <View style={styles.container}>
      {/* Sección Medidas Corporales */}
      <View style={styles.headerRow}>
        <View>
          <View style={styles.titleWithIcon}>
            <Ionicons name="fitness-outline" size={20} color={colors.primary} />
            <Text style={[globalStyles.title, styles.title]}>
              Medidas Corporales
            </Text>
          </View>
          <Text style={[globalStyles.textSecondary, styles.subtitle]}>
            {activeMusclesCount > 3 && !showAll
              ? "Top 3 con mayor cambio"
              : "Rastrea tu progreso a lo largo del tiempo."}
          </Text>
        </View>

        <TouchableOpacity
          onPress={onNavigateMeasures}
          style={styles.updateButton}
        >
          <Text style={[styles.updateButtonText, { color: colors.primary }]}>
            Actualizar
          </Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Medidas corporales */}
      {displayedMuscles.map((muscle) => {
        const item = sanitizedSummary[muscle.key];
        if (!item || !item.latest || item.latest <= 0) return null;
        return (
          <MeasureItem
            key={muscle.key}
            name={muscle.name}
            measure={item.latest}
            previousMeasure={item.previous}
          />
        );
      })}

      {/* Botón acordeón */}
      {activeMusclesCount > 3 && (
        <View style={styles.accordionContainer}>
          <TouchableOpacity
            onPress={onToggleShowAll}
            style={[
              styles.accordionButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.primary + "40",
              },
            ]}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons
              name={showAll ? "chevron-up" : "chevron-down"}
              size={16}
              color={colors.primary}
            />
            <Text
              style={[
                styles.accordionButtonText,
                { color: colors.primary },
              ]}
            >
              {showAll ? "Ver menos" : "Ver todas"}
            </Text>
            <Ionicons
              name={showAll ? "chevron-up" : "chevron-down"}
              size={14}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    marginBottom: 8,
  },
  titleWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    fontSize: 18,
    marginBottom: 0,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  updateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  updateButtonText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  accordionContainer: {
    alignItems: "center",
    marginTop: 14,
  },
  accordionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  accordionButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },
});
