import { useTheme } from "@/context/ThemeContext";
import { DailyMealLog, getDailyMealLogs, getTodayDateKey } from "@/store/meals";
import { getGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function MealsHistoryScreen() {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const router = useRouter();

  const [pastLogs, setPastLogs] = useState<DailyMealLog[]>([]);

  const loadData = async () => {
    const allLogs = await getDailyMealLogs();
    const todayKey = getTodayDateKey();
    const history = allLogs.filter(
      (l) => l.date !== todayKey && l.consumedMeals && l.consumedMeals.length > 0
    );
    setPastLogs(history);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  return (
    <View style={globalStyles.container}>
      {/* Header */}
      <View style={globalStyles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={globalStyles.title}>Historial Completo</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        {pastLogs.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 40 }}>
            <Ionicons name="restaurant-outline" size={48} color={colors.textSecondary + "50"} />
            <Text style={{ color: colors.textSecondary, marginTop: 12, textAlign: "center" }}>
              Aún no tienes historial de comidas registrado.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {pastLogs.map((log) => (
              <View
                key={log.date}
                style={[
                  globalStyles.card,
                  { padding: 16, marginBottom: 0, flexDirection: "column", gap: 8 }
                ]}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.text }}>
                    {log.date}
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.primary }}>
                    {log.totalCalories} kcal
                  </Text>
                </View>
                
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: "600" }}>PROTEÍNA</Text>
                    <Text style={{ fontSize: 13, color: colors.text, fontWeight: "bold" }}>{log.totalProtein}g</Text>
                  </View>
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: "600" }}>CARBS</Text>
                    <Text style={{ fontSize: 13, color: colors.text, fontWeight: "bold" }}>{log.totalCarbs}g</Text>
                  </View>
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: "600" }}>GRASA</Text>
                    <Text style={{ fontSize: 13, color: colors.text, fontWeight: "bold" }}>{log.totalFat}g</Text>
                  </View>
                </View>

                <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.neutral + "40" }}>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, fontStyle: "italic" }}>
                    {log.consumedMeals.length} {log.consumedMeals.length === 1 ? "comida registrada" : "comidas registradas"}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
