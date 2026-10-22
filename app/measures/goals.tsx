import { useTheme } from "@/context/ThemeContext";
import { formatWeightText, getSettings, UserSettings } from "@/store/conf";
import {
  addGoal,
  calculateMuscleVolumeStats,
  calculateRecommendedMaxVolume,
  getLatestGoal,
  MuscleVolumeStat,
} from "@/store/goals";
import { getGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

export default function GoalScreen() {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const router = useRouter();

  const [userSettings, setUserSettings] = useState<UserSettings>({
    unit: "kg",
    weightIncrement: 2.5,
    defaultRestTimer: 90,
  });

  const [goalWeight, setGoalWeight] = useState(75);
  const [goalGrass, setGoalGrass] = useState(15);
  const [masaMagra, setMasaMagra] = useState(60);
  const [frequency, setFrequency] = useState(4);

  const [targetCalories, setTargetCalories] = useState(2500);
  const [targetProtein, setTargetProtein] = useState(140);
  const [targetCarbs, setTargetCarbs] = useState(250);
  const [targetFat, setTargetFat] = useState(70);

  const [targetWeeklyVolume, setTargetWeeklyVolume] = useState(24000);
  const [muscleStats, setMuscleStats] = useState<MuscleVolumeStat[]>([]);
  const [hasHistory, setHasHistory] = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const s = await getSettings();
        setUserSettings(s);

        const latest = await getLatestGoal();
        setGoalWeight(latest.goalWeight || 75);
        setGoalGrass(latest.goalGrass || 15);
        setMasaMagra(latest.masaMagra || 60);
        setFrequency(latest.frequency || 4);

        setTargetCalories(latest.targetCalories || 2500);
        setTargetProtein(latest.targetProtein || 140);
        setTargetCarbs(latest.targetCarbs || 250);
        setTargetFat(latest.targetFat || 70);

        setTargetWeeklyVolume(latest.targetWeeklyVolume || 24000);

        const volumeData = await calculateMuscleVolumeStats();
        setMuscleStats(volumeData.stats);
        setHasHistory(volumeData.hasHistory);
      } catch (error) {
        console.error("Error al cargar las metas:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleAutoCalculateVolume = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const calculated = calculateRecommendedMaxVolume(goalWeight, frequency, masaMagra);
    setTargetWeeklyVolume(calculated);
    Toast.show({
      type: "success",
      text1: "Volumen Sugerido Calculado",
      text2: `${calculated.toLocaleString()} ${userSettings.unit} semanales (~${Math.round(calculated / frequency).toLocaleString()} ${userSettings.unit}/sesión).`,
    });
  };

  const handleSave = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await addGoal({
      goalWeight,
      goalGrass,
      masaMagra,
      frequency,
      targetCalories,
      targetProtein,
      targetCarbs,
      targetFat,
      targetWeeklyVolume,
    });
    Toast.show({
      type: "success",
      text1: "Metas Guardadas",
      text2: "Tus objetivos se han actualizado correctamente.",
    });
    router.back();
  };

  const adjustValue = (
    current: number,
    delta: number,
    min: number,
    max: number,
    setter: (val: number) => void
  ) => {
    Haptics.selectionAsync();
    const next = Math.min(max, Math.max(min, current + delta));
    setter(next);
  };

  if (loading) {
    return (
      <View
        style={[
          globalStyles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 12 }}>
          Cargando metas...
        </Text>
      </View>
    );
  }

  const volumePerSession = Math.round(targetWeeklyVolume / Math.max(1, frequency));

  return (
    <ScrollView
      style={globalStyles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 60 }}
    >
      {/* ── ENCABEZADO ESTÁNDAR DE FITTERME ── */}
      <View style={globalStyles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ fontWeight: "bold", fontSize: 24, color: colors.text }}>
          Fijar Metas
        </Text>
        <Ionicons name="flag-outline" size={24} color={colors.primary} />
      </View>

      {/* ══════════════════════════════════════════
          SECCIÓN 1: FRECUENCIA DE ENTRENAMIENTO
         ══════════════════════════════════════════ */}
      <Text style={[styles.sectionTitle, { color: colors.primary }]}>
        FRECUENCIA DE ENTRENAMIENTO
      </Text>

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
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Días de entrenamiento
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Días por semana que planeas entrenar
              </Text>
            </View>
          </View>
          <Text style={[styles.highlightValue, { color: colors.primary }]}>
            {frequency} <Text style={{ fontSize: 14 }}>días</Text>
          </Text>
        </View>

        <View style={styles.daysSelectorRow}>
          {[1, 2, 3, 4, 5, 6, 7].map((num) => {
            const isSelected = frequency === num;
            return (
              <TouchableOpacity
                key={num}
                onPress={() => {
                  Haptics.selectionAsync();
                  setFrequency(num);
                }}
                style={[
                  styles.dayButton,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.background,
                    borderColor: isSelected ? colors.primary : colors.cardBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dayButtonText,
                    {
                      color: isSelected ? colors.background : colors.text,
                    },
                  ]}
                >
                  {num}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ══════════════════════════════════════════
          SECCIÓN 2: PESO Y COMPOSICIÓN CORPORAL
         ══════════════════════════════════════════ */}
      <Text style={[styles.sectionTitle, { color: colors.primary }]}>
        PESO Y COMPOSICIÓN CORPORAL
      </Text>

      {/* Meta 1: Peso Objetivo */}
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
              <Ionicons name="scale-outline" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Peso deseado
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Meta de peso corporal total
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.stepperRow}>
          <TouchableOpacity
            onPress={() => adjustValue(goalWeight, -1, 40, 160, setGoalWeight)}
            style={[styles.stepperButton, { borderColor: colors.cardBorder }]}
          >
            <Ionicons name="remove" size={22} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.valueDisplay}>
            <Text style={[styles.bigNumber, { color: colors.primary }]}>
              {goalWeight}
            </Text>
            <Text style={[styles.unitText, { color: colors.textSecondary }]}>
              {userSettings.unit}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => adjustValue(goalWeight, 1, 40, 160, setGoalWeight)}
            style={[styles.stepperButton, { borderColor: colors.cardBorder }]}
          >
            <Ionicons name="add" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        <Slider
          style={styles.slider}
          minimumValue={40}
          maximumValue={160}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.background}
          thumbTintColor={colors.primary}
          value={goalWeight}
          onValueChange={(val) => setGoalWeight(Math.round(val))}
          step={1}
        />
      </View>

      {/* Meta 2: Grasa Corporal */}
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
                { backgroundColor: colors.flame + "20" },
              ]}
            >
              <Ionicons name="flame-outline" size={20} color={colors.flame} />
            </View>
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Grasa corporal meta
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Porcentaje de grasa deseado
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.stepperRow}>
          <TouchableOpacity
            onPress={() => adjustValue(goalGrass, -1, 5, 45, setGoalGrass)}
            style={[styles.stepperButton, { borderColor: colors.cardBorder }]}
          >
            <Ionicons name="remove" size={22} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.valueDisplay}>
            <Text style={[styles.bigNumber, { color: colors.flame }]}>
              {goalGrass}
            </Text>
            <Text style={[styles.unitText, { color: colors.textSecondary }]}>%</Text>
          </View>

          <TouchableOpacity
            onPress={() => adjustValue(goalGrass, 1, 5, 45, setGoalGrass)}
            style={[styles.stepperButton, { borderColor: colors.cardBorder }]}
          >
            <Ionicons name="add" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        <Slider
          style={styles.slider}
          minimumValue={5}
          maximumValue={45}
          minimumTrackTintColor={colors.flame}
          maximumTrackTintColor={colors.background}
          thumbTintColor={colors.flame}
          value={goalGrass}
          onValueChange={(val) => setGoalGrass(Math.round(val))}
          step={1}
        />
      </View>

      {/* Meta 3: Masa Magra */}
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
              <Ionicons name="barbell-outline" size={20} color={colors.protein} />
            </View>
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Masa muscular magra
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Kilos de músculo objetivo
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.stepperRow}>
          <TouchableOpacity
            onPress={() => adjustValue(masaMagra, -1, 30, 110, setMasaMagra)}
            style={[styles.stepperButton, { borderColor: colors.cardBorder }]}
          >
            <Ionicons name="remove" size={22} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.valueDisplay}>
            <Text style={[styles.bigNumber, { color: colors.protein }]}>
              {masaMagra}
            </Text>
            <Text style={[styles.unitText, { color: colors.textSecondary }]}>
              {userSettings.unit}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => adjustValue(masaMagra, 1, 30, 110, setMasaMagra)}
            style={[styles.stepperButton, { borderColor: colors.cardBorder }]}
          >
            <Ionicons name="add" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        <Slider
          style={styles.slider}
          minimumValue={30}
          maximumValue={110}
          minimumTrackTintColor={colors.protein}
          maximumTrackTintColor={colors.background}
          thumbTintColor={colors.protein}
          value={masaMagra}
          onValueChange={(val) => setMasaMagra(Math.round(val))}
          step={1}
        />
      </View>

      {/* ══════════════════════════════════════════
          SECCIÓN 3: METAS NUTRICIONALES DIARIAS
         ══════════════════════════════════════════ */}
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
          onValueChange={(val) => setTargetCalories(Math.round(val))}
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
          onValueChange={(val) => setTargetProtein(Math.round(val))}
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
          onValueChange={(val) => setTargetCarbs(Math.round(val))}
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
          onValueChange={(val) => setTargetFat(Math.round(val))}
          step={5}
        />
      </View>

      {/* ══════════════════════════════════════════
          SECCIÓN 4: VOLUMEN DE ENTRENAMIENTO & MÚSCULOS
         ══════════════════════════════════════════ */}
      <Text style={[styles.sectionTitle, { color: colors.primary }]}>
        VOLUMEN DE ENTRENAMIENTO Y MÚSCULOS
      </Text>

      {/* Volumen Máximo */}
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
              <Text style={{ fontSize: 12 }}>{userSettings.unit}</Text>
            </Text>
            <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
              ~{volumePerSession.toLocaleString()} {userSettings.unit}/sesión
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
          onValueChange={(val) => setTargetWeeklyVolume(Math.round(val / 500) * 500)}
          step={500}
        />

        <TouchableOpacity
          onPress={handleAutoCalculateVolume}
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

      {/* Distribución Muscular */}
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
          <View
            style={[
              styles.badge,
              {
                backgroundColor: hasHistory ? colors.success + "20" : colors.warning + "20",
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: hasHistory ? colors.success : colors.warning },
              ]}
            >
              {hasHistory ? "HISTORIAL" : "SUGERIDO"}
            </Text>
          </View>
        </View>

        <View style={{ gap: 12, marginTop: 4 }}>
          {muscleStats.map((item, index) => {
            const muscleEstimatedVolume = Math.round(
              (targetWeeklyVolume * item.percentage) / 100
            );
            return (
              <View key={index} style={{ gap: 4 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Ionicons name={item.icon as any} size={16} color={item.color} />
                    <Text style={{ fontWeight: "700", color: colors.text, fontSize: 14 }}>
                      {item.muscle}
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                      ~{muscleEstimatedVolume.toLocaleString()} {userSettings.unit}
                    </Text>
                    <View
                      style={{
                        backgroundColor: item.color + "20",
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 6,
                        minWidth: 42,
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontWeight: "bold",
                          color: item.color,
                          fontSize: 12,
                        }}
                      >
                        {item.percentage}%
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Barra de Progreso */}
                <View
                  style={{
                    height: 6,
                    width: "100%",
                    backgroundColor: colors.background,
                    borderRadius: 3,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      height: "100%",
                      backgroundColor: item.color,
                      width: `${Math.min(100, Math.max(3, item.percentage * 2.5))}%`,
                      borderRadius: 3,
                    }}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* ── BOTÓN GUARDAR OBJETIVOS ── */}
      <TouchableOpacity
        onPress={handleSave}
        style={[globalStyles.button, { marginBottom: 40, marginTop: 24 }]}
        activeOpacity={0.8}
      >
        <Text style={globalStyles.buttonText}>Guardar Metas</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 24,
    marginBottom: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
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
  daysSelectorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
    marginTop: 4,
  },
  dayButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayButtonText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    marginTop: 4,
  },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  valueDisplay: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  bigNumber: {
    fontSize: 34,
    fontWeight: "bold",
  },
  unitText: {
    fontSize: 16,
    fontWeight: "600",
  },
  slider: {
    width: "100%",
    height: 36,
    marginTop: 2,
  },
  actionSecondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 4,
  },
  actionSecondaryText: {
    fontWeight: "bold",
    fontSize: 13,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
});
