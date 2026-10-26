import GoalStepperSliderCard from "@/components/goals/GoalStepperSliderCard";
import MacroTargetsCard from "@/components/goals/MacroTargetsCard";
import VolumeTargetsCard from "@/components/goals/VolumeTargetsCard";
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
      text1: "Metas Guardadas con Éxito",
      text2: "Tus objetivos han sido actualizados.",
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

  const volumePerSession = Math.round(targetWeeklyVolume / (frequency || 1));

  if (loading) {
    return (
      <View
        style={[
          globalStyles.container,
          {
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: colors.background,
          },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[globalStyles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { borderColor: colors.cardBorder }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>Mis Objetivos</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Personaliza tus metas físicas y nutricionales
          </Text>
        </View>
      </View>

      {/* SECCIÓN 1: METAS FÍSICAS */}
      <Text style={[styles.sectionTitle, { color: colors.primary }]}>
        METAS FÍSICAS Y COMPOSICIÓN
      </Text>

      {/* Meta 1: Peso deseado */}
      <GoalStepperSliderCard
        title="Peso deseado"
        subtitle="Meta de peso corporal total"
        icon="scale-outline"
        value={goalWeight}
        unit={userSettings.unit}
        min={40}
        max={160}
        tintColor={colors.primary}
        onValueChange={setGoalWeight}
        onAdjust={(delta) => adjustValue(goalWeight, delta, 40, 160, setGoalWeight)}
      />

      {/* Meta 2: Grasa Corporal */}
      <GoalStepperSliderCard
        title="Grasa corporal meta"
        subtitle="Porcentaje de grasa deseado"
        icon="flame-outline"
        value={goalGrass}
        unit="%"
        min={5}
        max={45}
        tintColor={colors.flame}
        onValueChange={setGoalGrass}
        onAdjust={(delta) => adjustValue(goalGrass, delta, 5, 45, setGoalGrass)}
      />

      {/* Meta 3: Masa Magra */}
      <GoalStepperSliderCard
        title="Masa muscular magra"
        subtitle="Kilos de músculo objetivo"
        icon="barbell-outline"
        value={masaMagra}
        unit={userSettings.unit}
        min={30}
        max={110}
        tintColor={colors.protein}
        onValueChange={setMasaMagra}
        onAdjust={(delta) => adjustValue(masaMagra, delta, 30, 110, setMasaMagra)}
      />

      {/* SECCIÓN 2: FRECUENCIA DE ENTRENAMIENTO */}
      <Text style={[styles.sectionTitle, { color: colors.primary }]}>
        FRECUENCIA DE ENTRENAMIENTO
      </Text>

      <GoalStepperSliderCard
        title="Días por semana"
        subtitle="Frecuencia semanal sugerida"
        icon="calendar-outline"
        value={frequency}
        unit="días"
        min={1}
        max={7}
        tintColor={colors.secondary}
        onValueChange={setFrequency}
        onAdjust={(delta) => adjustValue(frequency, delta, 1, 7, setFrequency)}
      />

      {/* SECCIÓN 3: METAS NUTRICIONALES DIARIAS */}
      <MacroTargetsCard
        targetCalories={targetCalories}
        targetProtein={targetProtein}
        targetCarbs={targetCarbs}
        targetFat={targetFat}
        onChangeCalories={setTargetCalories}
        onChangeProtein={setTargetProtein}
        onChangeCarbs={setTargetCarbs}
        onChangeFat={setTargetFat}
      />

      {/* SECCIÓN 4: VOLUMEN DE ENTRENAMIENTO Y MÚSCULOS */}
      <VolumeTargetsCard
        targetWeeklyVolume={targetWeeklyVolume}
        volumePerSession={volumePerSession}
        unit={userSettings.unit}
        hasHistory={hasHistory}
        muscleStats={muscleStats}
        onChangeVolume={setTargetWeeklyVolume}
        onAutoCalculateVolume={handleAutoCalculateVolume}
      />

      {/* Botón Guardar */}
      <TouchableOpacity
        style={[
          globalStyles.button,
          {
            backgroundColor: colors.primary,
            borderRadius: 16,
            paddingVertical: 16,
            marginTop: 10,
            alignItems: "center",
            justifyContent: "center",
          },
        ]}
        onPress={handleSave}
      >
        <Text style={[globalStyles.buttonText, { fontSize: 16, fontWeight: "bold" }]}>
          Guardar Objetivos
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 6,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 8,
  },
});
