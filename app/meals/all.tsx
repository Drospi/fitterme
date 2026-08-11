import MealItem from "@/components/MealItem";
import { useTheme } from "@/context/ThemeContext";
import { getMeals, Meal, MealCategory } from "@/store/meals";
import { getGlobalStyles } from "@/styles/global";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const CATEGORIES: Array<MealCategory | "Todos"> = [
  "Todos",
  "Desayuno",
  "Almuerzo",
  "Cena",
  "Snack",
];

export default function AllMealsScreen() {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();

  const [meals, setMeals] = useState<Meal[]>([]);
  const [activeCategory, setActiveCategory] = useState<MealCategory | "Todos">(
    (params.category as MealCategory) || "Todos"
  );
  const [search, setSearch] = useState("");

  const loadMeals = async () => {
    const data = await getMeals();
    setMeals(data);
  };

  useFocusEffect(
    useCallback(() => {
      if (params.category && CATEGORIES.includes(params.category as any)) {
        setActiveCategory(params.category as any);
      }
      loadMeals();
    }, [params.category])
  );

  const filteredMeals = meals.filter((meal) => {
    const matchCategory =
      activeCategory === "Todos" || meal.category === activeCategory;
    const matchSearch =
      search.trim() === "" ||
      meal.name.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={globalStyles.container}>
        {/* Header */}
        <View style={[globalStyles.header, { marginBottom: 15 }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={26} color={colors.text} />
            </TouchableOpacity>
            <View>
              <Text style={{ fontSize: 12, fontWeight: "bold", color: colors.primary, letterSpacing: 1 }}>
                CATÁLOGO COMPLETO
              </Text>
              <Text style={[globalStyles.title, { fontSize: 20, marginTop: 2 }]}>
                Todas las Comidas
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => router.push("/meals/add")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: colors.primary,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 20,
            }}
          >
            <Ionicons name="add-circle" size={18} color={colors.background} />
            <Text style={{ color: colors.background, fontWeight: "bold", fontSize: 13 }}>
              + Crear
            </Text>
          </TouchableOpacity>
        </View>

        {/* Buscador de Comidas */}
        <View
          style={[
            globalStyles.input,
            {
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              paddingHorizontal: 16,
              paddingVertical: 10,
              marginTop: 0,
              marginBottom: 12,
              backgroundColor: colors.surface,
              borderRadius: 14,
            },
          ]}
        >
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            placeholder="Buscar comida o ingrediente..."
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
            style={{ flex: 1, color: colors.text, fontSize: 15 }}
          />
          {search !== "" && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filtro por Categorías */}
        <View style={{ maxHeight: 50, marginBottom: 12 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, alignItems: "center" }}
          >
            {CATEGORIES.map((cat) => {
              const isSelected = activeCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setActiveCategory(cat)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderWidth: 1,
                    borderColor: isSelected ? colors.primary : colors.surface,
                  }}
                >
                  <Text
                    style={{
                      color: isSelected ? colors.background : colors.text,
                      fontWeight: "bold",
                      fontSize: 13,
                    }}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Lista de Comidas Filtradas */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {filteredMeals.length === 0 ? (
            <View style={[globalStyles.card, { alignItems: "center", paddingVertical: 40 }]}>
              <Ionicons name="search-outline" size={40} color={colors.textSecondary} />
              <Text style={[globalStyles.cardTitle, { marginTop: 10, marginBottom: 4 }]}>
                Sin resultados
              </Text>
              <Text style={[globalStyles.cardText, { textAlign: "center" }]}>
                No se encontraron comidas en "{activeCategory}" {search ? `que coincidan con "${search}"` : ""}.
              </Text>
            </View>
          ) : (
            filteredMeals.map((meal) => (
              <MealItem
                key={meal.id}
                meal={meal}
                onDelete={loadMeals}
                onLoggedToday={loadMeals}
              />
            ))
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
