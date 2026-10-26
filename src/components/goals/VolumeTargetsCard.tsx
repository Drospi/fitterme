import { MuscleVolumeStat } from "@/calculos/volumeCalculator";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface VolumeTargetsCardProps {
  targetWeeklyVolume: number;
  volumePerSession: number;
  unit: string;
  hasHistory: boolean;
  muscleStats: MuscleVolumeStat[];
  onChangeVolume: (val: number) => void;
  onAutoCalculateVolume: () => void;
}

export default function VolumeTargetsCard({
  targetWeeklyVolume,
  volumePerSession,
  unit,
  hasHistory,
  muscleStats,
  onChangeVolume,
  onAutoCalculateVolume,
}: VolumeTargetsCardProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.primary }]}>
        VOLUMEN DE ENTRENAMIENTO Y MÚSCULOS
      </Text>

      {/* Volumen Máximo Semanal */}
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
              <Ionicons name="analytics-outline" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Volumen Máximo Semanal
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Series × Reps × Peso total acumulado
              </Text>
            </View>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={[styles.highlightValue, { color: colors.primary }]}>
              {targetWeeklyVolume.toLocaleString()}{" "}
              <Text style={{ fontSize: 12 }}>{unit}</Text>
            </Text>
            <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
              ~{volumePerSession.toLocaleString()} {unit}/sesión
            </Text>
          </View>
        </View>

        <Slider
          style={styles.slider}
          minimumValue={5000}
          maximumValue={80000}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.background}
          thumbTintColor={colors.primary}
          value={targetWeeklyVolume}
          onValueChange={(val) => onChangeVolume(Math.round(val / 500) * 500)}
          step={500}
        />

        <TouchableOpacity
          onPress={onAutoCalculateVolume}
          style={[
            styles.actionSecondaryButton,
            {
              backgroundColor: colors.surface,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <Ionicons name="flash-outline" size={16} color={colors.primary} />
          <Text style={[styles.actionSecondaryText, { color: colors.primary }]}>
            Calcular volumen máximo sugerido
          </Text>
        </TouchableOpacity>
      </View>

      {/* Distribución por Músculo */}
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
                { backgroundColor: colors.info + "20" },
              ]}
            >
              <Ionicons name="pie-chart-outline" size={20} color={colors.info} />
            </View>
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Distribución por Músculo
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                {hasHistory
                  ? "Porcentaje real según tu historial"
                  : "Distribución fisiológica recomendada"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.muscleList}>
          {muscleStats.map((stat) => (
            <View key={stat.muscle} style={styles.muscleItem}>
              <View style={styles.muscleHeader}>
                <View style={styles.muscleLabelRow}>
                  <Ionicons name={stat.icon as any} size={16} color={stat.color} />
                  <Text style={[styles.muscleName, { color: colors.text }]}>
                    {stat.muscle}
                  </Text>
                </View>
                <Text style={[styles.musclePercent, { color: stat.color }]}>
                  {stat.percentage}%
                </Text>
              </View>

              <View
                style={[
                  styles.muscleBarBg,
                  { backgroundColor: colors.background },
                ]}
              >
                <View
                  style={[
                    styles.muscleBarFill,
                    {
                      backgroundColor: stat.color,
                      width: `${Math.min(100, stat.percentage)}%`,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
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
  actionSecondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    marginTop: 10,
  },
  actionSecondaryText: {
    fontSize: 13,
    fontWeight: "bold",
  },
  muscleList: {
    gap: 12,
    marginTop: 6,
  },
  muscleItem: {
    gap: 6,
  },
  muscleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  muscleLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  muscleName: {
    fontSize: 13,
    fontWeight: "600",
  },
  musclePercent: {
    fontSize: 13,
    fontWeight: "bold",
  },
  muscleBarBg: {
    height: 6,
    width: "100%",
    borderRadius: 3,
    overflow: "hidden",
  },
  muscleBarFill: {
    height: "100%",
    borderRadius: 3,
  },
});
