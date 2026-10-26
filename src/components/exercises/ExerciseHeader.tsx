import ShareButton from "@/components/ShareButton";
import { useTheme } from "@/context/ThemeContext";
import { ExerciseCatalogItem, getExerciseCategory } from "@/store/excercise";
import { getExerciseImage } from "@/utils/imageMap";
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ExerciseHeaderProps {
  exercise: ExerciseCatalogItem;
  onBack: () => void;
  onDelete: () => void;
  shareText: string;
}

export default function ExerciseHeader({
  exercise,
  onBack,
  onDelete,
  shareText,
}: ExerciseHeaderProps) {
  const { colors } = useTheme();
  const category = getExerciseCategory(exercise);

  return (
    <View style={styles.container}>
      {/* Top action row */}
      <View style={styles.navRow}>
        <TouchableOpacity
          onPress={onBack}
          style={[styles.circleButton, { borderColor: colors.cardBorder }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.actionButtons}>
          <ShareButton text={shareText} />
          <TouchableOpacity
            onPress={onDelete}
            style={[styles.circleButton, { borderColor: colors.cardBorder }]}
          >
            <Ionicons name="trash-outline" size={20} color={colors.delete} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Exercise Image & Hero Info */}
      <View style={styles.heroRow}>
        <Image
          source={getExerciseImage(exercise.id, exercise.urlimage)}
          style={[
            styles.exerciseImage,
            { backgroundColor: colors.surface, borderColor: colors.cardBorder },
          ]}
          resizeMode="cover"
        />

        <View style={styles.heroText}>
          <Text
            style={[styles.exerciseTitle, { color: colors.text }]}
            numberOfLines={2}
          >
            {exercise.nombre}
          </Text>

          <View style={styles.badgeRow}>
            {/* Categoría */}
            <View
              style={[
                styles.badge,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Text style={[styles.badgeText, { color: colors.primary }]}>
                {category}
              </Text>
            </View>

            {/* Músculo */}
            <View
              style={[
                styles.badge,
                { backgroundColor: colors.secondary + "20" },
              ]}
            >
              <Text style={[styles.badgeText, { color: colors.secondary }]}>
                {exercise.musculo}
              </Text>
            </View>

            {/* Equipamiento */}
            {exercise.equipamiento ? (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.cardBorder },
                ]}
              >
                <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
                  {exercise.equipamiento}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  exerciseImage: {
    width: 80,
    height: 80,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  heroText: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
});
