import BodyHeatmap from "@/components/BodyHeatmap";
import BodyCompositionCard from "@/components/dashboard/BodyCompositionCard";
import CaloriesMacrosCard from "@/components/dashboard/CaloriesMacrosCard";
import DailyAdviceCard from "@/components/dashboard/DailyAdviceCard";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardLayoutModal from "@/components/dashboard/DashboardLayoutModal";
import GoalsProgressCard from "@/components/dashboard/GoalsProgressCard";
import TodayWorkoutCard from "@/components/dashboard/TodayWorkoutCard";
import WeeklyFrequencyCard from "@/components/dashboard/WeeklyFrequencyCard";
import WeeklyReportReadyModal from "@/components/WeeklyReportReadyModal";
import { useTheme } from "@/context/ThemeContext";
import {
  CardConfigItem,
  DashboardCardId,
  DEFAULT_CARD_CONFIG,
  getDashboardConfig,
} from "@/store/dashboardConfig";
import { DEFAULT_GOAL, getLatestGoal, Goals } from "@/store/goals";
import { getRoutineSessions, RoutineSession } from "@/store/historyRoutine";
import { getTodayMealLog } from "@/store/meals";
import { getMeasures } from "@/store/measures";
import { getRoutines, Routine } from "@/store/routines";
import { getUserProfile, UserProfile } from "@/store/userProfile";
import { checkWeeklyReportReady, WeeklyReportData } from "@/store/weeklyReport";
import {
  DaySchedule,
  getTodaySchedule,
} from "@/store/weeklySchedule";
import {
  calculateTotalTrainedDays,
  DayStatus,
  getCompositionTrend,
  getWeeklyDayStatus,
  TrendDataPoint,
} from "@/utils/dashboardUtils";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";

export default function HomeScreen() {
  const { colors } = useTheme();

  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: "Diego",
    photoUri: null,
  });

  // Configuración de tarjetas (visibilidad y orden)
  const [cardConfigs, setCardConfigs] =
    useState<CardConfigItem[]>(DEFAULT_CARD_CONFIG);

  // Metas del usuario
  const [userGoal, setUserGoal] = useState<Goals>(DEFAULT_GOAL);

  // Rutinas y Planificación de hoy
  const [allRoutines, setAllRoutines] = useState<Routine[]>([]);
  const [todayRoutine, setTodayRoutine] = useState<Routine | null>(null);
  const [todaySchedule, setTodaySchedule] = useState<DaySchedule>({
    dayOfWeek: new Date().getDay(),
    type: "unassigned",
  });
  const [todayDayOfWeek, setTodayDayOfWeek] = useState<number>(new Date().getDay());

  // Calorías y Macros de hoy
  const [todayCalories, setTodayCalories] = useState(0);
  const [todayProtein, setTodayProtein] = useState(0);
  const [todayCarbs, setTodayCarbs] = useState(0);
  const [todayFat, setTodayFat] = useState(0);

  // Días entrenando y Frecuencia semanal
  const [totalTrainedDays, setTotalTrainedDays] = useState(0);
  const [weeklyDone, setWeeklyDone] = useState(0);
  const [weeklyDays, setWeeklyDays] = useState<DayStatus[]>([]);

  // Composición corporal y tendencia
  const [compositionTrend, setCompositionTrend] = useState<{
    dataPoints: TrendDataPoint[];
    currentBodyFat: number;
    currentLeanMass: number;
    currentWeight: number;
    fatChange: number;
    leanChange: number;
    hasEnoughData: boolean;
  }>({
    dataPoints: [],
    currentBodyFat: 0,
    currentLeanMass: 0,
    currentWeight: 0,
    fatChange: 0,
    leanChange: 0,
    hasEnoughData: false,
  });

  // Estado para refresco de componentes hijos
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Estado para el Modal de Resumen Semanal Listo
  const [isWeeklyReportModalVisible, setIsWeeklyReportModalVisible] =
    useState(false);
  const [weeklyReportData, setWeeklyReportData] =
    useState<WeeklyReportData | null>(null);
  const [currentWeekId, setCurrentWeekId] = useState<string>("");

  const loadData = async () => {
    setRefreshKey((prev) => prev + 1);

    // 0. Cargar Configuración de Tarjetas (visibilidad y orden)
    const savedLayout = await getDashboardConfig();
    setCardConfigs(savedLayout);

    // 1. Cargar Perfil
    const profile = await getUserProfile();
    setUserProfile(profile);

    // 2. Cargar Metas
    const goal = await getLatestGoal();
    setUserGoal(goal);

    // 3. Cargar Rutinas creadas y Asignación de Hoy
    const routinesList = await getRoutines();
    setAllRoutines(routinesList);

    const todaySched = await getTodaySchedule();
    setTodaySchedule(todaySched.schedule);
    setTodayRoutine(todaySched.routine);
    setTodayDayOfWeek(todaySched.dayOfWeek);

    // 4. Cargar Nutrición y Macros de Hoy
    const todayLog = await getTodayMealLog();
    setTodayCalories(todayLog.totalCalories);
    setTodayProtein(todayLog.totalProtein);
    setTodayCarbs(todayLog.totalCarbs);
    setTodayFat(todayLog.totalFat);

    // 5. Cargar Sesiones, Total de Días Entrenando y Frecuencia Semanal
    const sessions = await getRoutineSessions();
    const trainedCount = calculateTotalTrainedDays(sessions);
    setTotalTrainedDays(trainedCount);

    const { days, completedCount } = getWeeklyDayStatus(sessions);
    setWeeklyDays(days);
    setWeeklyDone(completedCount);

    // 6. Cargar Composición Corporal y Tendencia
    const measures = await getMeasures();
    const trend = getCompositionTrend(measures);
    setCompositionTrend(trend);

    // 7. Comprobar si el resumen semanal está listo para mostrarse
    const reportStatus = await checkWeeklyReportReady();
    if (reportStatus.isReady && reportStatus.reportData) {
      setWeeklyReportData(reportStatus.reportData);
      setCurrentWeekId(reportStatus.weekId);
      setIsWeeklyReportModalVisible(true);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const targetFreq = userGoal.frequency || 4;

  const generateHomeSummary = () => {
    const calObj = userGoal.targetCalories || 2500;
    const isGoalMet = weeklyDone >= targetFreq;
    let text = `FitterMe - Resumen Diario\n`;
    text += `Días entrenando: ${totalTrainedDays} días completados\n`;
    text += `Calorías: ${todayCalories} / ${calObj} kcal\n`;
    text += `Frecuencia semanal: ${weeklyDone} / ${targetFreq} días ${
      isGoalMet ? "(¡Meta Cumplida!)" : ""
    }\n`;
    text += `¡A seguir mejorando!`;
    return text;
  };

  // Renderizador dinámico según el orden y visibilidad configurada
  const renderCardById = (id: DashboardCardId) => {
    switch (id) {
      case "todayWorkout":
        return (
          <TodayWorkoutCard
            key="todayWorkout"
            routine={todayRoutine}
            todaySchedule={todaySchedule}
            allRoutines={allRoutines}
            todayDayOfWeek={todayDayOfWeek}
            onRefresh={loadData}
          />
        );
      case "caloriesMacros":
        return (
          <CaloriesMacrosCard
            key="caloriesMacros"
            todayCalories={todayCalories}
            goalCalories={userGoal.targetCalories || 2500}
            todayProtein={todayProtein}
            targetProtein={userGoal.targetProtein || 140}
            todayCarbs={todayCarbs}
            targetCarbs={userGoal.targetCarbs || 250}
            todayFat={todayFat}
            targetFat={userGoal.targetFat || 70}
          />
        );
      case "weeklyFrequency":
        return (
          <WeeklyFrequencyCard
            key="weeklyFrequency"
            days={weeklyDays}
            weeklyDone={weeklyDone}
            targetFreq={targetFreq}
          />
        );
      case "bodyComposition":
        return (
          <BodyCompositionCard
            key="bodyComposition"
            currentBodyFat={compositionTrend.currentBodyFat}
            currentLeanMass={compositionTrend.currentLeanMass}
            fatChange={compositionTrend.fatChange}
            leanChange={compositionTrend.leanChange}
            trendData={compositionTrend.dataPoints}
            hasEnoughData={compositionTrend.hasEnoughData}
          />
        );
      case "goalsProgress":
        return (
          <GoalsProgressCard
            key="goalsProgress"
            goals={userGoal}
            currentWeight={compositionTrend.currentWeight}
            currentBodyFat={compositionTrend.currentBodyFat}
            currentLeanMass={compositionTrend.currentLeanMass}
          />
        );
      case "bodyHeatmap":
        return <BodyHeatmap key="bodyHeatmap" refreshTrigger={refreshKey} />;
      case "dailyAdvice":
        return <DailyAdviceCard key="dailyAdvice" />;
      default:
        return null;
    }
  };

  return (
    <View style={[styles.mainWrapper, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* ========================================================
            1. ENCABEZADO (Siempre visible arriba): Foto, saludo y días entrenando
           ======================================================== */}
        <DashboardHeader
          userProfile={userProfile}
          trainedDays={totalTrainedDays}
          shareText={generateHomeSummary()}
        />

        {/* ========================================================
            2 a 8: TARJETAS DINÁMICAS (Orden y visibilidad personalizables)
           ======================================================== */}
        {cardConfigs
          .filter((config) => config.visible)
          .map((config) => renderCardById(config.id))}

        {/* Modal de Resumen Semanal Listo (solo cuando la semana cierra) */}
        <WeeklyReportReadyModal
          visible={isWeeklyReportModalVisible}
          reportData={weeklyReportData}
          weekId={currentWeekId}
          onClose={() => setIsWeeklyReportModalVisible(false)}
        />
      </ScrollView>

      {/* ========================================================
          MENÚ FLOTANTE INFERIOR DERECHO (FAB) PARA PERSONALIZAR
         ======================================================== */}
      <DashboardLayoutModal
        cardConfigs={cardConfigs}
        onConfigChange={(newConfigs: CardConfigItem[]) => setCardConfigs(newConfigs)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    position: "relative",
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 52,
    paddingBottom: 85, // Espacio para que el botón flotante no tape contenido
  },
});
