import { useTheme } from "@/context/ThemeContext";
import { UserSettings } from "@/store/conf";
import {
  CuratedProgressionResult,
  ExerciseItemInput,
  ProgressionRecommendation,
  selectCuratedProgressions,
} from "@/utils/progressiveOverload";
import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Popover from "react-native-popover-view";

interface Props {
  exercises: ExerciseItemInput[];
  muscleMap: Record<string, string>;
  userSettings: UserSettings;
}

export const ProgressiveOverloadGoals: React.FC<Props> = ({
  exercises,
  muscleMap,
  userSettings,
}) => {
  const { colors } = useTheme();
  const [showAll, setShowAll] = useState(false);

  const curated: CuratedProgressionResult = useMemo(() => {
    return selectCuratedProgressions(
      exercises,
      muscleMap,
      userSettings.unit,
      userSettings.weightIncrement
    );
  }, [exercises, muscleMap, userSettings.unit, userSettings.weightIncrement]);

  if (!curated.primaryGoal) {
    return null;
  }

  const { primaryGoal, secondaryGoals, remainingGoals } = curated;

  // Helper de colores temáticos para badges
  const getBadgeColors = (type: ProgressionRecommendation["type"]) => {
    switch (type) {
      case "WEIGHT":
        return {
          bg: (colors.success || "#22c55e") + "18",
          border: (colors.success || "#22c55e") + "40",
          text: colors.success || "#22c55e",
        };
      case "CONSOLIDATE":
        return {
          bg: "#f59e0b18",
          border: "#f59e0b40",
          text: "#f59e0b",
        };
      case "REPS":
      default:
        return {
          bg: colors.primary + "18",
          border: colors.primary + "40",
          text: colors.primary,
        };
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.textSecondary + "20",
        },
      ]}
    >
      {/* Encabezado Principal */}
      <View style={styles.header}>
        <View
          style={[
            styles.headerIconContainer,
            { backgroundColor: colors.primary + "20" },
          ]}
        >
          <Ionicons name="trending-up" size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              SOBRECARGA PROGRESIVA
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Doble progresión (10–12 reps)
            </Text>
          </View>
          <Popover
            popoverStyle={{
              backgroundColor: colors.surface,
              borderRadius: 14,
              borderWidth: 0,
              borderColor: "transparent",
              shadowColor: "transparent",
              shadowOpacity: 0,
              elevation: 0,
            }}
            from={
              <TouchableOpacity
                style={{
                  padding: 4,
                  borderRadius: 8,
                  backgroundColor: colors.primary + "18",
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
              </TouchableOpacity>
            }
          >
            <View
              style={{
                padding: 14,
                maxWidth: 270,
                backgroundColor: colors.surface,
                borderRadius: 14,
                borderWidth: 0,
                borderColor: "transparent",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Ionicons name="trending-up" size={16} color={colors.primary} />
                <Text style={{ fontWeight: "bold", fontSize: 13, color: colors.text }}>
                  Doble Progresión
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 17 }}>
                Primero aumentas repeticiones hasta alcanzar el techo (12 reps). Una vez dominado, subes la carga (+{userSettings.weightIncrement || 2.5} {userSettings.unit}) y reinicias en la base del rango (10 reps).
              </Text>
            </View>
          </Popover>
        </View>
      </View>

      {/*OBJETIVO PRINCIPAL (Destacado) */}
      <View style={styles.sectionSpacing}>

        <PrimaryGoalCard
          goal={primaryGoal}
          colors={colors}
          badgeStyle={getBadgeColors(primaryGoal.type)}
        />
      </View>

      {/* OTRAS MEJORAS (Secundarias) */}
      {secondaryGoals.length > 0 && (
        <View style={styles.sectionSpacing}>
          <Text
            style={[
              styles.sectionCategoryLabel,
              { color: colors.textSecondary, marginBottom: 10 },
            ]}
          >
            OTRAS MEJORAS
          </Text>

          <View style={{ gap: 8 }}>
            {secondaryGoals.map((goal, idx) => (
              <SecondaryGoalCard
                key={`${goal.exerciseName}-${idx}`}
                goal={goal}
                colors={colors}
                badgeStyle={getBadgeColors(goal.type)}
              />
            ))}
          </View>
        </View>
      )}

      {/* LISTA EXPANDIBLE: Ver todos los ejercicios */}
      {remainingGoals.length > 0 && (
        <View style={{ marginTop: 8 }}>
          {showAll && (
            <View style={{ gap: 8, marginBottom: 12 }}>
              {remainingGoals.map((goal, idx) => (
                <SecondaryGoalCard
                  key={`rem-${goal.exerciseName}-${idx}`}
                  goal={goal}
                  colors={colors}
                  badgeStyle={getBadgeColors(goal.type)}
                />
              ))}
            </View>
          )}

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowAll((prev) => !prev)}
            style={[
              styles.toggleButton,
              {
                backgroundColor: colors.background,
                borderColor: colors.textSecondary + "25",
              },
            ]}
          >
            <Text
              style={[
                styles.toggleButtonText,
                { color: colors.primary },
              ]}
            >
              {showAll
                ? "Ocultar ejercicios adicionales"
                : `Ver todos los ejercicios (${remainingGoals.length} más)`}
            </Text>
            <Ionicons
              name={showAll ? "chevron-up" : "chevron-down"}
              size={16}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// Tarjeta del Objetivo Principal (más prominente)
const PrimaryGoalCard: React.FC<{
  goal: ProgressionRecommendation;
  colors: any;
  badgeStyle: { bg: string; border: string; text: string };
}> = ({ goal, colors, badgeStyle }) => {
  return (
    <View
      style={[
        styles.primaryCard,
        {
          backgroundColor: colors.background
        },
      ]}
    >
      {/* Fila Superior: Badge de estado y músculo */}
      <View style={styles.cardHeaderRow}>
        {/* Nombre del Ejercicio */}
        <Text style={[styles.primaryExerciseName, { color: colors.text }]}>
          {goal.exerciseName}
        </Text>

        {goal.muscle ? (
          <View
            style={[
              styles.muscleBadge,
              { backgroundColor: colors.surface },
            ]}
          >
            <Text style={[styles.muscleText, { color: colors.textSecondary }]}>
              {goal.muscle}
            </Text>
          </View>
        ) : null}
      </View>



      {/* Flujo de Progresión Visual */}
      <View
        style={[
          styles.primaryTransitionBox,
          {
            backgroundColor: colors.surface,
            borderColor: colors.textSecondary + "15",
          },
        ]}
      >
        <View style={styles.flowStep}>
          <Text style={[styles.flowStepLabel, { color: colors.textSecondary }]}>
            ÚLTIMA SESIÓN
          </Text>
          <Text style={[styles.flowStepValue, { color: colors.text }]}>
            {goal.fromText}
          </Text>
        </View>

        <View style={styles.flowArrow}>
          <Ionicons
            name="arrow-forward"
            size={18}
            color={badgeStyle.text}
          />
        </View>

        <View style={styles.flowStep}>
          <Text style={[styles.flowStepLabel, { color: badgeStyle.text }]}>
            PRÓXIMO OBJETIVO
          </Text>
          <Text
            style={[
              styles.flowStepValue,
              { color: badgeStyle.text, fontWeight: "bold" },
            ]}
          >
            {goal.toText}
          </Text>
        </View>
      </View>

      {/* Comentario motivacional / Guía de entrenador con Popover */}
      {goal.coachComment && (
        <View style={{ marginTop: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5, flex: 1, marginRight: 8 }}>
            <Ionicons name="sparkles" size={13} color={badgeStyle.text} />
            <Text style={{ fontSize: 11, fontWeight: "bold", color: badgeStyle.text }} numberOfLines={1}>
              {goal.actionText}
            </Text>
          </View>

          <Popover
            popoverStyle={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              borderWidth: 0,
              borderColor: "transparent",
              shadowColor: "transparent",
              shadowOpacity: 0,
              elevation: 0,
            }}
            from={
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 3,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                  backgroundColor: badgeStyle.bg,
                  borderWidth: 0,
                }}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="bulb-outline" size={12} color={badgeStyle.text} />
                <Text style={{ fontSize: 10, fontWeight: "bold", color: badgeStyle.text }}>

                </Text>
              </TouchableOpacity>
            }
          >
            <View
              style={{
                padding: 12,
                maxWidth: 250,
                backgroundColor: colors.surface,
                borderRadius: 12,
                borderWidth: 0,
                borderColor: "transparent",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <Ionicons name="bulb-outline" size={15} color={badgeStyle.text} />
                <Text style={{ fontWeight: "bold", fontSize: 13, color: colors.text }}>
                  Estrategia
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 16 }}>
                {goal.coachComment}
              </Text>
            </View>
          </Popover>
        </View>
      )}
    </View>
  );
};

// Tarjeta de Recomendación Secundaria (más compacta y directa)
const SecondaryGoalCard: React.FC<{
  goal: ProgressionRecommendation;
  colors: any;
  badgeStyle: { bg: string; border: string; text: string };
}> = ({ goal, colors, badgeStyle }) => {
  return (
    <View
      style={[
        styles.secondaryCard,
        {
          backgroundColor: colors.background,
          borderColor: colors.textSecondary + "20",
        },
      ]}
    >
      <View style={styles.secondaryHeaderRow}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>

          <Text
            style={[styles.secondaryExerciseName, { color: colors.text }]}
            numberOfLines={1}
          >
            {goal.exerciseName}
          </Text>
        </View>

        {goal.muscle ? (
          <Text style={[styles.secondaryMuscleText, { color: colors.textSecondary }]}>
            {goal.muscle}
          </Text>
        ) : null}
      </View>



      {/* Subtítulo / Acción concisa */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
        <Text style={[styles.secondaryActionText, { color: badgeStyle.text }]}>
          {goal.actionText}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  headerIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 0.4,
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  sectionSpacing: {
    marginBottom: 14,
  },
  labelRow: {
    marginBottom: 8,
  },
  sectionCategoryLabel: {
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 0.8,
  },
  primaryCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 0.4,
  },
  muscleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  muscleText: {
    fontSize: 10,
    fontWeight: "600",
  },
  primaryExerciseName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  primaryTransitionBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  flowStep: {
    flex: 1,
  },
  flowStepLabel: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 2,
  },
  flowStepValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  flowArrow: {
    paddingHorizontal: 8,
  },
  coachRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  coachCommentText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  secondaryCard: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  secondaryHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  secondaryExerciseName: {
    fontSize: 13,
    fontWeight: "bold",
    flex: 1,
  },
  secondaryMuscleText: {
    fontSize: 10,
    fontWeight: "500",
  },
  secondaryTransitionRow: {
    marginTop: 2,
  },
  secondaryTransitionText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  secondaryActionText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  toggleButtonText: {
    fontSize: 12,
    fontWeight: "bold",
  },
});

export default ProgressiveOverloadGoals;
