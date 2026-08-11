import { useTheme } from "@/context/ThemeContext";
import { deleteMeal, logMealForToday, Meal } from "@/store/meals";
import { getGlobalStyles } from "@/styles/global";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";

type MealItemProps = {
  meal: Meal;
  onDelete: () => void;
  onLoggedToday?: () => void;
};

export default function MealItem({
  meal,
  onDelete,
  onLoggedToday,
}: MealItemProps) {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const [justLogged, setJustLogged] = useState(false);

  const handleLogToday = async () => {
    await logMealForToday(meal);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setJustLogged(true);
    if (onLoggedToday) onLoggedToday();

    setTimeout(() => {
      setJustLogged(false);
    }, 2000);
  };

  const handleLongPress = () => {
    Alert.alert("Eliminar Comida", `¿Estás seguro de eliminar "${meal.name}" del catálogo?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          await deleteMeal(meal.id);
          onDelete();
        },
      },
    ]);
  };

  const iconName = meal.icon || "restaurant";

  return (
    <TouchableOpacity
      style={[
        globalStyles.card,
        {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        },
      ]}
      onLongPress={handleLongPress}
      onPress={handleLogToday}
      activeOpacity={0.8}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
        {/* Icono de la comida */}
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: colors.primary + "20",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: colors.primary + "40",
          }}
        >
          <Ionicons name={iconName as any} size={24} color={colors.primary} />
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <Text
              style={[
                globalStyles.cardTitle,
                { fontSize: 16, fontWeight: "bold", marginBottom: 0 },
              ]}
              numberOfLines={1}
            >
              {meal.name}
            </Text>
            {meal.category ? (
              <View
                style={{
                  backgroundColor: colors.surface,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 4,
                }}
              >
                <Text style={{ fontSize: 10, color: colors.textSecondary, fontWeight: "600" }}>
                  {meal.category}
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={[globalStyles.cardText, { fontSize: 13 }]}>
            <Text style={{ fontWeight: "bold", color: colors.primary }}>{meal.calories} kcal</Text> •{" "}
            <Text style={{ color: colors.secondary }}>{meal.protein}g P</Text> •{" "}
            <Text style={{ color: colors.delete }}>{meal.carbs}g C</Text> •{" "}
            <Text style={{ color: colors.textSecondary }}>{meal.fat}g G</Text>
          </Text>
        </View>
      </View>

      {/* Botón para registrar que se comió hoy */}
      <TouchableOpacity
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          backgroundColor: justLogged ? colors.primary : colors.surface,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: justLogged ? colors.primary : colors.primary + "40",
          marginLeft: 8,
        }}
        onPress={handleLogToday}
      >
        <Ionicons
          name={justLogged ? "checkmark-circle" : "add-circle-outline"}
          size={18}
          color={justLogged ? colors.background : colors.primary}
        />
        <Text
          style={{
            fontSize: 12,
            fontWeight: "bold",
            color: justLogged ? colors.background : colors.primary,
          }}
        >
          {justLogged ? "¡Comido!" : "Comer Hoy"}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
