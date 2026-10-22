import { useTheme } from "@/context/ThemeContext";
import { Goals } from "@/store/goals";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface GoalsProgressCardProps {
  goals: Goals;
  currentWeight: number;
  currentBodyFat: number;
  currentLeanMass: number;
}

export default function GoalsProgressCard({
  goals,
  currentWeight,
  currentBodyFat,
  currentLeanMass,
}: GoalsProgressCardProps) {
  const { colors } = useTheme();

  // 1. Progreso de Peso
  const weightDiff = currentWeight > 0 ? currentWeight - goals.goalWeight : 0;
  const isWeightMet = Math.abs(weightDiff) < 0.5;
  const weightProgressPct =
    currentWeight > 0
      ? Math.min(
          100,
          Math.max(
            15,
            Math.round(
              (1 - Math.abs(weightDiff) / (goals.goalWeight * 0.25 || 1)) * 100
            )
          )
        )
      : 0;

  // 2. Progreso de Grasa Corporal
  const fatDiff = currentBodyFat > 0 ? currentBodyFat - goals.goalGrass : 0;
  const isFatMet = currentBodyFat > 0 && currentBodyFat <= goals.goalGrass;
  const fatProgressPct =
    currentBodyFat > 0
      ? Math.min(
          100,
          Math.max(
            15,
            Math.round(
              (1 - Math.max(0, fatDiff) / (goals.goalGrass || 1)) * 100
            )
          )
        )
      : 0;

  // 3. Progreso de Masa Muscular
  const leanDiff = currentLeanMass > 0 ? goals.masaMagra - currentLeanMass : 0;
  const isLeanMet = currentLeanMass > 0 && currentLeanMass >= goals.masaMagra;
  const leanProgressPct =
    currentLeanMass > 0
      ? Math.min(
          100,
          Math.max(
            15,
            Math.round((currentLeanMass / (goals.masaMagra || 1)) * 100)
          )
        )
      : 0;

  const hasAnyMeasure = currentWeight > 0 || currentBodyFat > 0;

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
      {/* Título de la sección */}
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <Ionicons name="flag-outline" size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Progreso hacia tus metas
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push("/measures/goals" as any)}
          style={styles.editGoalsBtn}
        >
          <Text style={[styles.editGoalsText, { color: colors.primary }]}>
            Ajustar
          </Text>
        </TouchableOpacity>
      </View>

      {!hasAnyMeasure ? (
        <TouchableOpacity
          style={styles.emptyStateBanner}
          onPress={() => router.push("/measures" as any)}
          activeOpacity={0.7}
        >
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
            Registra tu peso para ver el porcentaje de avance hacia tus objetivos.
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.goalsList}>
          {/* META 1: PESO CORPORAL */}
          <View style={styles.goalItem}>
            <View style={styles.goalTopRow}>
              <View style={styles.goalTitleRow}>
                <Ionicons name="scale-outline" size={16} color={colors.primary} />
                <Text style={[styles.goalName, { color: colors.text }]}>
                  Peso Corporal
                </Text>
              </View>
              <Text style={[styles.goalValues, { color: colors.textSecondary }]}>
                <Text style={{ color: colors.text, fontWeight: "700" }}>
                  {currentWeight > 0 ? `${currentWeight} kg` : "--"}
                </Text>{" "}
                / {goals.goalWeight} kg meta
              </Text>
            </View>

            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${weightProgressPct}%`,
                    backgroundColor: isWeightMet ? colors.primary : colors.protein,
                  },
                ]}
              />
            </View>

            <Text style={[styles.goalMotivation, { color: colors.textSecondary }]}>
              {isWeightMet
                ? "¡Felicidades! Estás exactamente en tu peso ideal."
                : weightDiff > 0
                ? `A solo ${weightDiff.toFixed(1)} kg de tu objetivo. ¡Sigue enfocado!`
                : `A ${Math.abs(weightDiff).toFixed(1)} kg de tu meta. ¡Gran trabajo!`}
            </Text>
          </View>

          {/* META 2: GRASA CORPORAL */}
          <View style={styles.goalItem}>
            <View style={styles.goalTopRow}>
              <View style={styles.goalTitleRow}>
                <Ionicons name="flame-outline" size={16} color={colors.flame} />
                <Text style={[styles.goalName, { color: colors.text }]}>
                  Grasa Corporal
                </Text>
              </View>
              <Text style={[styles.goalValues, { color: colors.textSecondary }]}>
                <Text style={{ color: colors.text, fontWeight: "700" }}>
                  {currentBodyFat > 0 ? `${currentBodyFat}%` : "--"}
                </Text>{" "}
                / {goals.goalGrass}% meta
              </Text>
            </View>

            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${fatProgressPct}%`,
                    backgroundColor: isFatMet ? colors.primary : colors.flame,
                  },
                ]}
              />
            </View>

            <Text style={[styles.goalMotivation, { color: colors.textSecondary }]}>
              {isFatMet
                ? "¡Meta de grasa corporal superada con éxito!"
                : fatDiff > 0
                ? `Te faltan ${fatDiff.toFixed(1)}% para tu meta de definición.`
                : "Excelente nivel de grasa corporal. ¡Mantén tus buenos hábitos!"}
            </Text>
          </View>

          {/* META 3: MASA MUSCULAR */}
          <View style={styles.goalItem}>
            <View style={styles.goalTopRow}>
              <View style={styles.goalTitleRow}>
                <Ionicons name="barbell-outline" size={16} color={colors.primary} />
                <Text style={[styles.goalName, { color: colors.text }]}>
                  Masa Muscular Magra
                </Text>
              </View>
              <Text style={[styles.goalValues, { color: colors.textSecondary }]}>
                <Text style={{ color: colors.text, fontWeight: "700" }}>
                  {currentLeanMass > 0 ? `${currentLeanMass} kg` : "--"}
                </Text>{" "}
                / {goals.masaMagra} kg meta
              </Text>
            </View>

            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${leanProgressPct}%`,
                    backgroundColor: isLeanMet ? colors.primary : colors.protein,
                  },
                ]}
              />
            </View>

            <Text style={[styles.goalMotivation, { color: colors.textSecondary }]}>
              {isLeanMet
                ? "¡Objetivo de masa muscular alcanzado! Eres un portento."
                : leanDiff > 0
                ? `A ${leanDiff.toFixed(1)} kg de masa muscular de tu meta. ¡A comer y entrenar!`
                : "Desarrollo muscular sólido y constante."}
            </Text>
          </View>
        </View>
      )}
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
  editGoalsBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editGoalsText: {
    fontSize: 12,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  goalsList: {
    gap: 14,
  },
  goalItem: {
    gap: 6,
  },
  goalTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  goalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  goalName: {
    fontSize: 13,
    fontWeight: "700",
  },
  goalValues: {
    fontSize: 12,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  goalMotivation: {
    fontSize: 12,
    lineHeight: 16,
  },
  emptyStateBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 10,
  },
  emptyStateText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 17,
  },
});
