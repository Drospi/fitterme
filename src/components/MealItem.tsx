import ThemeConfirmModal from "@/components/ThemeConfirmModal";
import { useTheme } from "@/context/ThemeContext";
import { deleteMeal, logMealForToday, Meal } from "@/store/meals";
import { getGlobalStyles } from "@/styles/global";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";

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
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const isNeonLime =
    colors.primary?.toLowerCase().includes("c8ff") ||
    colors.primary?.toLowerCase() === "#c8ff00" ||
    colors.primary?.toLowerCase() === "#52b788";
  const onPrimaryColor = isNeonLime ? "#000000" : "#ffffff";

  const handleLogToday = async () => {
    await logMealForToday(meal);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setJustLogged(true);
    Toast.show({
      type: "success",
      text1: "Comida Registrada",
      text2: `Añadido "${meal.name}" (${meal.calories} kcal) a tu consumo de hoy.`,
    });
    if (onLoggedToday) onLoggedToday();

    setTimeout(() => {
      setJustLogged(false);
    }, 2000);
  };

  const confirmDelete = async () => {
    setShowConfirmDelete(false);
    await deleteMeal(meal.id);
    onDelete();
    Toast.show({
      type: "success",
      text1: "Comida Eliminada",
      text2: `"${meal.name}" se eliminó del catálogo.`,
    });
  };

  const iconName = meal.icon || "restaurant";

  return (
    <TouchableOpacity
      style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1.5,
        borderColor: colors.cardBorder || "rgba(255,255,255,0.08)",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}
      onLongPress={() => setShowConfirmDelete(true)}
      onPress={handleLogToday}
      activeOpacity={0.85}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
        {/* Icono del alimento */}
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: colors.background,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: colors.cardBorder || "rgba(255,255,255,0.1)",
          }}
        >
          <Ionicons name={iconName as any} size={22} color={colors.primary} />
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "900",
              color: colors.text,
              letterSpacing: 0.3,
            }}
            numberOfLines={1}
          >
            {meal.name}
          </Text>

          {/* Micro badges de macros */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
            <View
              style={{
                backgroundColor: colors.primary + "20",
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 4,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: "900", color: colors.primary }}>
                {meal.calories} KCAL
              </Text>
            </View>

            <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: "700" }}>
              {meal.protein}g P • {meal.carbs}g C • {meal.fat}g G
            </Text>
          </View>
        </View>
      </View>

      {/* Botón táctil para registrar que se consumió hoy */}
      <TouchableOpacity
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          backgroundColor: justLogged ? colors.primary : colors.background,
          paddingHorizontal: 10,
          paddingVertical: 7,
          borderRadius: 12,
          borderWidth: 1.5,
          borderColor: justLogged ? colors.primary : colors.cardBorder || "rgba(255,255,255,0.1)",
          marginLeft: 8,
        }}
        onPress={handleLogToday}
      >
        <Ionicons
          name={justLogged ? "checkmark-circle" : "add"}
          size={16}
          color={justLogged ? onPrimaryColor : colors.primary}
        />
        <Text
          style={{
            fontSize: 11,
            fontWeight: "900",
            color: justLogged ? onPrimaryColor : colors.text,
            letterSpacing: 0.4,
          }}
        >
          {justLogged ? "LISTO" : "+ COMER"}
        </Text>
      </TouchableOpacity>

      {/* Modal de confirmación para eliminar */}
      <ThemeConfirmModal
        visible={showConfirmDelete}
        title="Eliminar Alimento"
        message={`¿Estás seguro de eliminar "${meal.name}" del catálogo?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => setShowConfirmDelete(false)}
      />
    </TouchableOpacity>
  );
}
