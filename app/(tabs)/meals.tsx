import AIFoodScannerModal from "@/components/AIFoodScannerModal";
import AllMeals from "@/components/AllMeals";
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
import Ionicons from "@expo/vector-icons/Ionicons";
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
        l.date !== todayKey && l.consumedMeals && l.consumedMeals.length > 0,
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
      ],
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
    }, []),
  );

  const consumedCalories = todayLog.totalCalories;
  const remainingCalories = Math.max(0, targets.calories - consumedCalories);
  const caloriesPercent = Math.min(
    100,
    Math.round((consumedCalories / targets.calories) * 100),
  );

  const proteinPercent = Math.min(
    100,
    Math.round((todayLog.totalProtein / targets.protein) * 100),
  );
  const carbsPercent = Math.min(
    100,
    Math.round((todayLog.totalCarbs / targets.carbs) * 100),
  );
  const fatPercent = Math.min(
    100,
    Math.round((todayLog.totalFat / targets.fat) * 100),
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

      {/* Botón Destacado: Escanear Comida con IA (Visible solo si la API de IA está configurada) */}
      {isAIActive && (
        <TouchableOpacity
          style={{
            backgroundColor: colors.surface,
            borderRadius: 18,
            padding: 16,
            marginBottom: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderWidth: 1.5,
            borderColor: colors.primary + "60",
          }}
          activeOpacity={0.85}
          onPress={() => setIsAIScannerVisible(true)}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="sparkles" size={22} color={onPrimaryColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: "900", color: colors.text, textTransform: "uppercase" }}>
                Escanear Comida con IA
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                Calcula calorías y macros por foto con Gemini
              </Text>
            </View>
          </View>
          <Ionicons name="arrow-forward" size={20} color={colors.primary} />
        </TouchableOpacity>
      )}

      {/* Card de Métricas Diarias Principal - Estilo Póster */}
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 20,
          padding: 20,
          marginBottom: 16,
          borderWidth: 1.5,
          borderColor: colors.cardBorder || "rgba(255,255,255,0.1)",
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontSize: 11, fontWeight: "900", color: colors.textSecondary, letterSpacing: 1.2 }}>
            ENERGÍA DIARIA • RESTANTE
          </Text>
          <View
            style={{
              backgroundColor: colors.primary + "20",
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 5,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: "900", color: colors.primary }}>
              {caloriesPercent}%
            </Text>
          </View>
        </View>

        <Text
          style={{
            fontSize: 52,
            fontWeight: "900",
            color: colors.primary,
            marginVertical: 4,
            letterSpacing: -1,
          }}
        >
          {remainingCalories}{" "}
          <Text style={{ fontSize: 20, fontWeight: "800", color: colors.textSecondary }}>KCAL</Text>
        </Text>

        {/* Barra de progreso de calorías */}
        <View
          style={{
            height: 10,
            width: "100%",
            marginTop: 10,
            backgroundColor: colors.background,
            borderRadius: 5,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              height: "100%",
              backgroundColor: colors.primary,
              width: `${caloriesPercent}%`,
              borderRadius: 5,
            }}
          />
        </View>

        <View
          style={{
            marginTop: 14,
            width: "100%",
            justifyContent: "space-between",
            flexDirection: "row",
          }}
        >
          <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: "700" }}>
            CONSUMIDAS: <Text style={{ color: colors.primary, fontWeight: "900" }}>{consumedCalories} kcal</Text>
          </Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: "700" }}>
            OBJETIVO: <Text style={{ color: colors.text, fontWeight: "900" }}>{targets.calories} kcal</Text>
          </Text>
        </View>
      </View>

      {/* Grid de Macronutrientes: Proteína, Carbos, Grasa */}
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
        {/* Proteína */}
        <View
          style={{
            flex: 1,
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 14,
            borderWidth: 1.5,
            borderColor: colors.cardBorder || "rgba(255,255,255,0.08)",
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: "900", color: colors.secondary, letterSpacing: 0.8 }}>
            PROTEÍNA
          </Text>
          <Text style={{ fontSize: 22, fontWeight: "900", color: colors.text, marginTop: 4 }}>
            {todayLog.totalProtein}g
          </Text>
          <Text style={{ fontSize: 10, color: colors.textSecondary, fontWeight: "700", marginTop: 1 }}>
            / {targets.protein}g ({proteinPercent}%)
          </Text>
          <View
            style={{
              height: 5,
              width: "100%",
              marginTop: 8,
              backgroundColor: colors.background,
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: "100%",
                backgroundColor: colors.secondary,
                width: `${proteinPercent}%`,
              }}
            />
          </View>
        </View>

        {/* Carbohidratos */}
        <View
          style={{
            flex: 1,
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 14,
            borderWidth: 1.5,
            borderColor: colors.cardBorder || "rgba(255,255,255,0.08)",
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: "900", color: colors.flame || "#ff7a00", letterSpacing: 0.8 }}>
            CARBOS
          </Text>
          <Text style={{ fontSize: 22, fontWeight: "900", color: colors.text, marginTop: 4 }}>
            {todayLog.totalCarbs}g
          </Text>
          <Text style={{ fontSize: 10, color: colors.textSecondary, fontWeight: "700", marginTop: 1 }}>
            / {targets.carbs}g ({carbsPercent}%)
          </Text>
          <View
            style={{
              height: 5,
              width: "100%",
              marginTop: 8,
              backgroundColor: colors.background,
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: "100%",
                backgroundColor: colors.flame || "#ff7a00",
                width: `${carbsPercent}%`,
              }}
            />
          </View>
        </View>

        {/* Grasas */}
        <View
          style={{
            flex: 1,
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 14,
            borderWidth: 1.5,
            borderColor: colors.cardBorder || "rgba(255,255,255,0.08)",
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: "900", color: colors.fat || "#c084fc", letterSpacing: 0.8 }}>
            GRASAS
          </Text>
          <Text style={{ fontSize: 22, fontWeight: "900", color: colors.text, marginTop: 4 }}>
            {todayLog.totalFat}g
          </Text>
          <Text style={{ fontSize: 10, color: colors.textSecondary, fontWeight: "700", marginTop: 1 }}>
            / {targets.fat}g ({fatPercent}%)
          </Text>
          <View
            style={{
              height: 5,
              width: "100%",
              marginTop: 8,
              backgroundColor: colors.background,
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: "100%",
                backgroundColor: colors.fat || "#c084fc",
                width: `${fatPercent}%`,
              }}
            />
          </View>
        </View>
      </View>

      {/* Card de Consumo Registrado Hoy */}
      {todayLog.consumedMeals.length > 0 ? (
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 18,
            padding: 16,
            marginBottom: 20,
            borderWidth: 1.5,
            borderColor: colors.cardBorder || "rgba(255,255,255,0.08)",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="restaurant-outline" size={20} color={colors.primary} />
              <Text style={{ fontSize: 16, fontWeight: "900", color: colors.text }}>
                REGISTRADO HOY ({todayLog.consumedMeals.length})
              </Text>
            </View>
            <View style={{ backgroundColor: colors.primary + "20", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 }}>
              <Text style={{ fontSize: 11, fontWeight: "900", color: colors.primary }}>
                {todayLog.totalCalories} KCAL
              </Text>
            </View>
          </View>

          <View style={{ gap: 8 }}>
            {todayLog.consumedMeals.map((item) => (
              <View
                key={item.id}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundColor: colors.background,
                  padding: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.cardBorder || "rgba(255,255,255,0.06)",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                  <Ionicons
                    name={(item.icon || "restaurant") as any}
                    size={20}
                    color={colors.primary}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "900", color: colors.text, fontSize: 14 }}>
                      {item.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2, fontWeight: "600" }}>
                      {item.timestamp} • {item.calories} kcal ({item.protein}g P / {item.carbs}g C / {item.fat}g G)
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => handleRemoveTodayItem(item.id)}
                  style={{ padding: 4 }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle-outline" size={20} color={colors.delete} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 18,
            padding: 20,
            marginBottom: 20,
            alignItems: "center",
            borderWidth: 1,
            borderColor: colors.cardBorder || "rgba(255,255,255,0.06)",
          }}
        >
          <Ionicons name="fast-food-outline" size={32} color={colors.textSecondary} />
          <Text style={{ fontSize: 15, fontWeight: "900", color: colors.text, marginTop: 8 }}>
            SIN REGISTROS HOY
          </Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: "center", marginTop: 4 }}>
            Selecciona "+ Comer" en el catálogo o usa el escáner IA para sumar calorías.
          </Text>
        </View>
      )}

      {/* Historial previo */}
      {pastLogs.length > 0 && (
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 18,
            padding: 16,
            marginBottom: 20,
            borderWidth: 1.5,
            borderColor: colors.cardBorder || "rgba(255,255,255,0.08)",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="calendar-outline" size={20} color={colors.secondary} />
              <Text style={{ fontSize: 16, fontWeight: "900", color: colors.text }}>
                HISTORIAL RECIENTE
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/reports/mealsHistory" as any)}>
              <Text style={{ color: colors.primary, fontWeight: "900", fontSize: 12 }}>
                VER TODOS ▶
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ gap: 8 }}>
            {pastLogs.slice(0, 3).map((log) => (
              <View
                key={log.date}
                style={{
                  backgroundColor: colors.background,
                  padding: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.cardBorder || "rgba(255,255,255,0.06)",
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={{ fontWeight: "900", color: colors.text, fontSize: 14 }}>
                    {log.date}
                  </Text>
                  <Text style={{ fontWeight: "900", color: colors.primary, fontSize: 14 }}>
                    {log.totalCalories} KCAL
                  </Text>
                </View>
                <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: "600" }}>
                  {log.consumedMeals.length} comidas • {log.totalProtein}g P • {log.totalCarbs}g C • {log.totalFat}g G
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Catálogo de Comidas */}
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
