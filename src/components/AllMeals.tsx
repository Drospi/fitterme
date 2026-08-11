import MealItem from "@/components/MealItem";
import { useTheme } from "@/context/ThemeContext";
import { getMeals, Meal, MealCategory } from "@/store/meals";
import { getGlobalStyles } from "@/styles/global";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

const CATEGORIES: MealCategory[] = ["Desayuno", "Almuerzo", "Cena", "Snack"];

const CATEGORY_ICONS: Record<MealCategory, string> = {
  Desayuno: "cafe-outline",
  Almuerzo: "restaurant-outline",
  Cena: "moon-outline",
  Snack: "nutrition-outline",
};

type Props = {
  onLogConsumed?: () => void;
};

export default function AllMealsScreen({ onLogConsumed }: Props) {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const router = useRouter();

  const [meals, setMeals] = useState<Meal[]>([]);

  const loadMeals = async () => {
    const data = await getMeals();
    setMeals(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadMeals();
    }, []),
  );

  const handleMealLogged = () => {
    loadMeals();
    if (onLogConsumed) onLogConsumed();
  };

  return (
    <View style={{ marginTop: 10, marginBottom: 40 }}>
      {/* General Section Header */}
      <View style={[globalStyles.header, { marginBottom: 15 }]}>
        <Text style={[globalStyles.title, { fontSize: 22 }]}>
          Catálogo por Categorías
        </Text>
      </View>

      {/* Lista de Categorías con solo las primeras 3 comidas y botón 'Ver Todo' */}
      {CATEGORIES.map((category) => {
        const categoryMeals = meals.filter((m) => m.category === category);
        const top3Meals = categoryMeals.slice(0, 3);
        const iconName = CATEGORY_ICONS[category];

        return (
          <View key={category} style={{ marginBottom: 20 }}>
            {/* Header de Categoría con botón Ver Todo */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
                paddingHorizontal: 4,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Ionicons
                  name={iconName as any}
                  size={20}
                  color={colors.primary}
                />
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    color: colors.text,
                  }}
                >
                  {category}
                </Text>
                <View
                  style={{
                    backgroundColor: colors.surface,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 10,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      color: colors.textSecondary,
                      fontWeight: "bold",
                    }}
                  >
                    {categoryMeals.length}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/meals/all",
                    params: { category },
                  })
                }
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <Text
                  style={{
                    color: colors.primary,
                    fontWeight: "bold",
                    fontSize: 13,
                  }}
                >
                  Ver todo
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={14}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>

            {/* Primeras 3 Comidas de la Categoría */}
            {top3Meals.length === 0 ? (
              <View
                style={[
                  globalStyles.card,
                  {
                    alignItems: "center",
                    paddingVertical: 16,
                    borderStyle: "dashed",
                    borderWidth: 1,
                    borderColor: colors.textSecondary + "40",
                  },
                ]}
              >
                <Text style={[globalStyles.cardText, { fontSize: 13 }]}>
                  No hay comidas guardadas en {category}.
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/meals/add")}
                  style={{ marginTop: 6 }}
                >
                  <Text
                    style={{
                      color: colors.primary,
                      fontWeight: "bold",
                      fontSize: 13,
                    }}
                  >
                    + Crear Comida en {category}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              top3Meals.map((meal) => (
                <MealItem
                  key={meal.id}
                  meal={meal}
                  onDelete={loadMeals}
                  onLoggedToday={handleMealLogged}
                />
              ))
            )}
          </View>
        );
      })}
    </View>
  );
}
