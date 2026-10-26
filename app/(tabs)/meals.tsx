import AIFoodScannerModal from "@/components/AIFoodScannerModal";
import AllMeals from "@/components/AllMeals";
import AIFoodScannerBanner from "@/components/meals/AIFoodScannerBanner";
import EnergyRemainingCard from "@/components/meals/EnergyRemainingCard";
import MacroNutrientsGrid from "@/components/meals/MacroNutrientsGrid";
import RecentMealsHistoryCard from "@/components/meals/RecentMealsHistoryCard";
import TodayConsumedList from "@/components/meals/TodayConsumedList";
import { useTheme } from "@/context/ThemeContext";
import { isAIConfigured } from "@/store/aiConfig";
import { getLatestGoal } from "@/store/goals";
import {
  addMeal,
  clearAllMeals,
  DailyMealLog,
  getDailyMealLogs,
  getMeals,
  getTodayDateKey,
  getTodayMealLog,
  logMealForToday,
  Meal,
  MealCategory,
  removeConsumedMealToday,
} from "@/store/meals";
import { getGlobalStyles } from "@/styles/global";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function MealsScreen() {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const router = useRouter();

  const isNeonLime =
    colors.primary?.toLowerCase().includes("c8ff") ||
    colors.primary?.toLowerCase() === "#c8ff00" ||
    colors.primary?.toLowerCase() === "#52b788";
  const onPrimaryColor = isNeonLime ? "#000000" : "#ffffff";

  const [meals, setMeals] = useState<Meal[]>([]);
  const [todayLog, setTodayLog] = useState<DailyMealLog>({
    date: getTodayDateKey(),
    consumedMeals: [],
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
  });
  const [pastLogs, setPastLogs] = useState<DailyMealLog[]>([]);

  // Estado para el Modal de Escaneo con IA y habilitación de IA
  const [isAIScannerVisible, setIsAIScannerVisible] = useState(false);
  const [isAIActive, setIsAIActive] = useState(false);

  const [targets, setTargets] = useState({
    calories: 2500,
    protein: 140,
    carbs: 250,
    fat: 70,
  });

  const loadData = async () => {
    const goal = await getLatestGoal();
    setTargets({
      calories: goal.targetCalories || 2500,
      protein: goal.targetProtein || 140,
      carbs: goal.targetCarbs || 250,
      fat: goal.targetFat || 70,
    });

    const catalog = await getMeals();
    setMeals(catalog);

    const currentToday = await getTodayMealLog();
    setTodayLog(currentToday);

    const allLogs = await getDailyMealLogs();
    const todayKey = getTodayDateKey();
    const history = allLogs.filter(
      (l) =>
        l.date !== todayKey && l.consumedMeals && l.consumedMeals.length > 0
    );
    setPastLogs(history);

    const aiStatus = await isAIConfigured();
    setIsAIActive(aiStatus);
  };

  const handleClearAll = async () => {
    Alert.alert(
      "Borrar Todo",
      "¿Estás seguro de reiniciar todo el catálogo y el historial de comidas?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Borrar",
          style: "destructive",
          onPress: async () => {
            await clearAllMeals();
            loadData();
          },
        },
      ]
    );
  };

  const handleRemoveTodayItem = async (consumedId: string) => {
    await removeConsumedMealToday(consumedId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    loadData();
  };

  const handleConfirmAILog = async (data: {
    name: string;
    category: MealCategory;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    icon: string;
    saveToCatalog?: boolean;
  }) => {
    let mealId = `ai-temp-${Date.now()}`;
    if (data.saveToCatalog) {
      const persisted = await addMeal({
        name: data.name,
        category: data.category,
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
        icon: data.icon,
      });
      mealId = persisted.id;
    }

    const tempMeal: Meal = {
      id: mealId,
      name: data.name,
      category: data.category,
      calories: data.calories,
      protein: data.protein,
      carbs: data.carbs,
      fat: data.fat,
      icon: data.icon,
      createdAt: new Date().toISOString(),
    };
    await logMealForToday(tempMeal);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    loadData();
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  return (
    <ScrollView
      style={[globalStyles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 50 }}
    >
      {/* Header Poster */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          marginTop: 6,
        }}
      >
        <View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <View
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 5,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: "900", color: onPrimaryColor, letterSpacing: 0.8 }}>
                NUTRICIÓN & DIETA ▶
              </Text>
            </View>
          </View>
          <Text
            style={{
              fontSize: 26,
              fontWeight: "900",
              color: colors.text,
              letterSpacing: 0.5,
              textTransform: "uppercase",
            }}
          >
            COMIDAS DIARIAS
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleClearAll}
          style={{
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 8,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.cardBorder || "rgba(255,255,255,0.08)",
          }}
        >
          <Text style={{ color: colors.delete, fontSize: 11, fontWeight: "900", letterSpacing: 0.4 }}>
            REINICIAR
          </Text>
        </TouchableOpacity>
      </View>

      {/* Botón Destacado: Escanear Comida con IA */}
      {isAIActive && (
        <AIFoodScannerBanner onPress={() => setIsAIScannerVisible(true)} />
      )}

      {/* Card de Energía Restante Principal */}
      <EnergyRemainingCard
        consumedCalories={todayLog.totalCalories}
        targetCalories={targets.calories}
      />

      {/* Grid de Macronutrientes: Proteína, Carbos, Grasas */}
      <MacroNutrientsGrid
        protein={todayLog.totalProtein}
        targetProtein={targets.protein}
        carbs={todayLog.totalCarbs}
        targetCarbs={targets.carbs}
        fat={todayLog.totalFat}
        targetFat={targets.fat}
      />

      {/* Consumo Registrado Hoy */}
      <TodayConsumedList
        consumedMeals={todayLog.consumedMeals}
        totalCalories={todayLog.totalCalories}
        onRemoveItem={handleRemoveTodayItem}
      />

      {/* Historial Reciente */}
      <RecentMealsHistoryCard
        pastLogs={pastLogs}
        onViewAll={() => router.push("/reports/mealsHistory" as any)}
      />

      {/* Catálogo Completo de Comidas */}
      <AllMeals onLogConsumed={loadData} />

      {/* Modal de Escaneo con IA */}
      <AIFoodScannerModal
        visible={isAIScannerVisible}
        onClose={() => setIsAIScannerVisible(false)}
        onConfirmLog={handleConfirmAILog}
      />
    </ScrollView>
  );
}
