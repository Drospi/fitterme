import AIFoodScannerModal from "@/components/AIFoodScannerModal";
import AllMeals from "@/components/AllMeals";
import { useTheme } from "@/context/ThemeContext";
import {
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
import { getLatestGoal } from "@/store/goals";
import { getGlobalStyles } from "@/styles/global";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function MealsScreen() {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

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

  // Estado para el Modal de Escaneo con IA
  const [isAIScannerVisible, setIsAIScannerVisible] = useState(false);

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
      (l) => l.date !== todayKey && l.consumedMeals && l.consumedMeals.length > 0
    );
    setPastLogs(history);
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
  }) => {
    const tempMeal: Meal = {
      id: `ai-temp-${Date.now()}`,
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
  const caloriesPercent = Math.min(100, Math.round((consumedCalories / targets.calories) * 100));

  const proteinPercent = Math.min(100, Math.round((todayLog.totalProtein / targets.protein) * 100));
  const carbsPercent = Math.min(100, Math.round((todayLog.totalCarbs / targets.carbs) * 100));

  return (
    <ScrollView style={globalStyles.container}>
      {/* Header */}
      <View style={[globalStyles.header, { marginBottom: 15 }]}>
        <Text style={globalStyles.title}>Comidas & Nutrición</Text>
        <TouchableOpacity onPress={handleClearAll}>
          <Text style={{ color: colors.delete, fontSize: 14, fontWeight: "bold" }}>
            Reiniciar
          </Text>
        </TouchableOpacity>
      </View>

      {/* Botón Destacado: Escanear Comida con IA */}
      <TouchableOpacity
        style={{
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderWidth: 1.5,
          borderColor: colors.primary + "60",
        }}
        onPress={() => setIsAIScannerVisible(true)}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="sparkles" size={24} color={colors.background} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.text }}>
              📸 Escanear Comida con IA
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
              Detecta calorías y macros por foto sin guardar la imagen
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={22} color={colors.primary} />
      </TouchableOpacity>

      {/* Card de Métricas Diarias Principal */}
      <View style={[globalStyles.card, { alignItems: "center" }]}>
        <Text style={[globalStyles.cardText, { letterSpacing: 1, fontSize: 12 }]}>
          CALORÍAS RESTANTES (HOY)
        </Text>
        <Text style={{ fontSize: 44, fontWeight: "bold", color: colors.primary, marginVertical: 4 }}>
          {remainingCalories}
        </Text>
        <Text style={globalStyles.cardText}>
          de {targets.calories} kcal objetivo
        </Text>

        {/* Barra de progreso de calorías */}
        <View
          style={{
            height: 12,
            width: "100%",
            marginTop: 15,
            backgroundColor: colors.background,
            borderRadius: 6,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              height: "100%",
              backgroundColor: colors.primary,
              width: `${caloriesPercent}%`,
              borderRadius: 6,
            }}
          />
        </View>

        <View
          style={{
            marginTop: 16,
            width: "100%",
            justifyContent: "space-between",
            flexDirection: "row",
          }}
        >
          <Text style={globalStyles.cardText}>
            Consumidas:{" "}
            <Text style={{ fontWeight: "bold", color: colors.primary }}>
              {consumedCalories} kcal
            </Text>
          </Text>
          <Text style={globalStyles.cardText}>
            Objetivo:{" "}
            <Text style={{ fontWeight: "bold", color: colors.text }}>
              {targets.calories} kcal
            </Text>
          </Text>
        </View>
      </View>

      {/* Tarjetas de Macronutrientes (Proteína y Carbs) */}
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
        {/* Proteína */}
        <View style={[globalStyles.card, { flex: 1 }]}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <Text style={[globalStyles.cardText, { fontSize: 13 }]}>Proteína</Text>
            <Ionicons name="nutrition" size={20} color={colors.secondary} />
          </View>
          <Text style={{ fontSize: 32, fontWeight: "bold", color: colors.text }}>
            {todayLog.totalProtein}g
          </Text>
          <Text style={[globalStyles.cardText, { fontSize: 12, color: colors.textSecondary }]}>
            / {targets.protein}g
          </Text>
          <View
            style={{
              height: 8,
              width: "100%",
              marginTop: 10,
              backgroundColor: colors.background,
              borderRadius: 4,
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
        <View style={[globalStyles.card, { flex: 1 }]}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <Text style={[globalStyles.cardText, { fontSize: 13 }]}>Carbohidratos</Text>
            <Ionicons name="flame" size={20} color={colors.delete} />
          </View>
          <Text style={{ fontSize: 32, fontWeight: "bold", color: colors.text }}>
            {todayLog.totalCarbs}g
          </Text>
          <Text style={[globalStyles.cardText, { fontSize: 12, color: colors.textSecondary }]}>
            / {targets.carbs}g
          </Text>
          <View
            style={{
              height: 8,
              width: "100%",
              marginTop: 10,
              backgroundColor: colors.background,
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: "100%",
                backgroundColor: colors.delete,
                width: `${carbsPercent}%`,
              }}
            />
          </View>
        </View>
      </View>

      {/* Card de Consumo Registrado Hoy (si el usuario ha comido al menos 1 alimento hoy) */}
      {todayLog.consumedMeals.length > 0 ? (
        <View style={[globalStyles.card, { marginBottom: 20 }]}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="restaurant-outline" size={22} color={colors.primary} />
              <Text style={[globalStyles.cardTitle, { fontSize: 18, fontWeight: "bold", marginBottom: 0 }]}>
                Registrado Hoy ({todayLog.consumedMeals.length})
              </Text>
            </View>
            <Text style={{ fontSize: 12, fontWeight: "bold", color: colors.primary }}>
              Total: {todayLog.totalCalories} kcal
            </Text>
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
                  padding: 10,
                  borderRadius: 10,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                  <Ionicons name={(item.icon || "restaurant") as any} size={20} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "bold", color: colors.text, fontSize: 14 }}>
                      {item.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                      {item.timestamp} • {item.calories} kcal ({item.protein}g P / {item.carbs}g C / {item.fat}g G)
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => handleRemoveTodayItem(item.id)}
                  style={{ padding: 4 }}
                >
                  <Ionicons name="close-circle-outline" size={22} color={colors.delete} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={[globalStyles.card, { marginBottom: 20, alignItems: "center", paddingVertical: 16 }]}>
          <Ionicons name="fast-food-outline" size={32} color={colors.textSecondary} />
          <Text style={[globalStyles.cardText, { marginTop: 6, textAlign: "center" }]}>
            No has registrado ninguna comida hoy.
          </Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: "center" }}>
            Toca "Comer Hoy" o usa el escáner con IA para registrar tu consumo.
          </Text>
        </View>
      )}

      {/* Card de Historial de Días Anteriores (si existen registros pasados) */}
      {pastLogs.length > 0 ? (
        <View style={[globalStyles.card, { marginBottom: 20 }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Ionicons name="calendar-outline" size={22} color={colors.secondary} />
            <Text style={[globalStyles.cardTitle, { fontSize: 18, fontWeight: "bold", marginBottom: 0 }]}>
              Historial de Días Anteriores
            </Text>
          </View>

          <View style={{ gap: 10 }}>
            {pastLogs.map((log) => (
              <View
                key={log.date}
                style={{
                  backgroundColor: colors.background,
                  padding: 12,
                  borderRadius: 10,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={{ fontWeight: "bold", color: colors.text, fontSize: 14 }}>
                    📅 {log.date}
                  </Text>
                  <Text style={{ fontWeight: "bold", color: colors.primary, fontSize: 14 }}>
                    {log.totalCalories} kcal
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                  {log.consumedMeals.length} comidas • {log.totalProtein}g Proteína • {log.totalCarbs}g Carbs • {log.totalFat}g Grasa
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

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
