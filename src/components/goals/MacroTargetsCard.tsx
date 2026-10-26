import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface MacroTargetsCardProps {
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  onChangeCalories: (val: number) => void;
  onChangeProtein: (val: number) => void;
  onChangeCarbs: (val: number) => void;
  onChangeFat: (val: number) => void;
}

export default function MacroTargetsCard({
  targetCalories,
  targetProtein,
  targetCarbs,
  targetFat,
  onChangeCalories,
  onChangeProtein,
  onChangeCarbs,
  onChangeFat,
}: MacroTargetsCardProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.primary }]}>
        METAS NUTRICIONALES DIARIAS
      </Text>

      {/* Calorías */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.cardBorder,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Ionicons name="flash-outline" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Calorías diarias
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Meta de consumo energético
              </Text>
            </View>
          </View>
          <Text style={[styles.highlightValue, { color: colors.primary }]}>
            {targetCalories} <Text style={{ fontSize: 13 }}>kcal</Text>
          </Text>
        </View>

        <Slider
          style={styles.slider}
          minimumValue={1200}
          maximumValue={4500}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.background}
          thumbTintColor={colors.primary}
          value={targetCalories}
          onValueChange={(val) => onChangeCalories(Math.round(val))}
          step={50}
        />
      </View>

      {/* Proteína */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.cardBorder,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.protein + "20" },
              ]}
            >
              <Ionicons name="fitness-outline" size={20} color={colors.protein} />
            </View>
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Proteína
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Recuperación y desarrollo muscular
              </Text>
            </View>
          </View>
          <Text style={[styles.highlightValue, { color: colors.protein }]}>
            {targetProtein} <Text style={{ fontSize: 13 }}>g</Text>
          </Text>
        </View>

        <Slider
          style={styles.slider}
          minimumValue={40}
          maximumValue={300}
          minimumTrackTintColor={colors.protein}
          maximumTrackTintColor={colors.background}
          thumbTintColor={colors.protein}
          value={targetProtein}
          onValueChange={(val) => onChangeProtein(Math.round(val))}
          step={5}
        />
      </View>

      {/* Carbohidratos */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.cardBorder,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.carbs + "20" },
              ]}
            >
              <Ionicons name="leaf-outline" size={20} color={colors.carbs} />
            </View>
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Carbohidratos
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Energía para tus entrenamientos
              </Text>
            </View>
          </View>
          <Text style={[styles.highlightValue, { color: colors.carbs }]}>
            {targetCarbs} <Text style={{ fontSize: 13 }}>g</Text>
          </Text>
        </View>

        <Slider
          style={styles.slider}
          minimumValue={50}
          maximumValue={500}
          minimumTrackTintColor={colors.carbs}
          maximumTrackTintColor={colors.background}
          thumbTintColor={colors.carbs}
          value={targetCarbs}
          onValueChange={(val) => onChangeCarbs(Math.round(val))}
          step={5}
        />
      </View>

      {/* Grasas */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.cardBorder,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.fat + "20" },
              ]}
            >
              <Ionicons name="water-outline" size={20} color={colors.fat} />
            </View>
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Grasas saludables
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Salud hormonal y absorción de nutrientes
              </Text>
            </View>
          </View>
          <Text style={[styles.highlightValue, { color: colors.fat }]}>
            {targetFat} <Text style={{ fontSize: 13 }}>g</Text>
          </Text>
        </View>

        <Slider
          style={styles.slider}
          minimumValue={20}
          maximumValue={150}
          minimumTrackTintColor={colors.fat}
          maximumTrackTintColor={colors.background}
          thumbTintColor={colors.fat}
          value={targetFat}
          onValueChange={(val) => onChangeFat(Math.round(val))}
          step={5}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 8,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  highlightValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  slider: {
    width: "100%",
    height: 30,
  },
});
