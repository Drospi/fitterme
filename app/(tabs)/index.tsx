import MacroGrid from "@/components/MacroGrid";
import MeasureStadistics from "@/components/MeasureStadistics";
import ShareButton from "@/components/ShareButton";
import { useTheme } from "@/context/ThemeContext";
import { DEFAULT_GOAL, getLatestGoal, Goals } from "@/store/goals";
import { getRoutineSessions, RoutineSession } from "@/store/historyRoutine";
import { getMeals, getTodayMealLog, Meal } from "@/store/meals";
import { getGlobalStyles } from "@/styles/global";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";

export default function HomeScreen() {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  const [meals, setMeals] = useState<Meal[]>([]);
  const [todayCalories, setTodayCalories] = useState(0);
  const [userGoal, setUserGoal] = useState<Goals>(DEFAULT_GOAL);
  const [weeklyDone, setWeeklyDone] = useState(0);

  const getThisWeekSessionsCount = (sessions: RoutineSession[]): number => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    return sessions.filter((s) => {
      const sessionDate = new Date(s.date);
      return sessionDate >= monday;
    }).length;
  };

  const loadData = async () => {
    const goal = await getLatestGoal();
    setUserGoal(goal);

    const catalog = await getMeals();
    setMeals(catalog);

    const todayLog = await getTodayMealLog();
    setTodayCalories(todayLog.totalCalories);

    const sessions = await getRoutineSessions();
    const count = getThisWeekSessionsCount(sessions);
    setWeeklyDone(count);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const targetFreq = userGoal.frequency || 4;
  const weeklyRemaining = Math.max(0, targetFreq - weeklyDone);

  return (
    <ScrollView style={globalStyles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={[globalStyles.header, { marginBottom: 16 }]}>
        <Image
          style={globalStyles.icon}
          source={require("@/assets/images/profile.jpeg")}
        />
        <Text style={globalStyles.title}>FitterMe</Text>
        <ShareButton meals={meals} />
      </View>

      {/* Grid de Calorías del Día */}
      <MacroGrid
        todayCalories={todayCalories}
        goalCalories={userGoal.targetCalories || 2500}
      />

      {/* Card Frecuencia Semanal & Progreso de Entrenamientos */}
      <View style={[globalStyles.card, { marginTop: 15, marginBottom: 15 }]}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="calendar" size={22} color={colors.primary} />
            <Text
              style={[
                globalStyles.cardTitle,
                { fontSize: 16, fontWeight: "bold", marginBottom: 0 },
              ]}
            >
              Frecuencia Semanal
            </Text>
          </View>

          <View
            style={{
              backgroundColor: colors.primary + "20",
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12,
            }}
          >
            <Text style={{ fontWeight: "bold", fontSize: 13, color: colors.primary }}>
              {weeklyDone} / {targetFreq} días
            </Text>
          </View>
        </View>

        <Text
          style={[
            globalStyles.cardText,
            { fontSize: 14, color: colors.text, fontWeight: "500", marginTop: 4 },
          ]}
        >
          {weeklyRemaining > 0
            ? `🏋️ ¡Te faltan ${weeklyRemaining} entrenamiento${
                weeklyRemaining > 1 ? "s" : ""
              } para completar tu meta semanal!`
            : "🎉 ¡Meta semanal completada! ¡Excelente disciplina! 🔥"}
        </Text>

        {/* Barra de progreso semanal */}
        <View
          style={{
            height: 10,
            width: "100%",
            marginTop: 12,
            backgroundColor: colors.background,
            borderRadius: 5,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              height: "100%",
              backgroundColor: colors.primary,
              width: `${Math.min(100, Math.round((weeklyDone / targetFreq) * 100))}%`,
              borderRadius: 5,
            }}
          />
        </View>
      </View>

      {/* Estadísticas de Medidas & Mensajes Motivacionales */}
      <MeasureStadistics />
    </ScrollView>
  );
}
