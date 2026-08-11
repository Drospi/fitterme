import { useTheme } from "@/context/ThemeContext";
import { addMeal, MealCategory } from "@/store/meals";
import { getGlobalStyles } from "@/styles/global";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const CATEGORIES: MealCategory[] = ["Desayuno", "Almuerzo", "Cena", "Snack"];

const ICONS = [
  "restaurant",
  "fast-food",
  "nutrition",
  "egg",
  "fish",
  "pizza",
  "cafe",
  "leaf",
  "flame",
  "water",
];

export default function AddMealScreen() {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const router = useRouter();

  const [name, setName] = useState("");
  const [category, setCategory] = useState<MealCategory>("Almuerzo");
  const [selectedIcon, setSelectedIcon] = useState("restaurant");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  const handleAddMeal = async () => {
    if (!name.trim()) {
      alert("Por favor ingresa un nombre para la comida");
      return;
    }

    await addMeal({
      name: name.trim(),
      category,
      calories: parseInt(calories) || 0,
      protein: parseInt(protein) || 0,
      carbs: parseInt(carbs) || 0,
      fat: parseInt(fat) || 0,
      icon: selectedIcon,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <ScrollView style={globalStyles.container}>
      <Text style={[globalStyles.title, { marginBottom: 20 }]}>Agregar Comida al Catálogo</Text>

      <Text style={[globalStyles.textSecondary, { marginBottom: 8 }]}>Nombre de la Comida</Text>
      <TextInput
        style={globalStyles.input}
        placeholder="Ej. Pechuga con Arroz"
        placeholderTextColor={colors.textSecondary}
        value={name}
        onChangeText={setName}
      />

      <Text style={[globalStyles.textSecondary, { marginTop: 15, marginBottom: 8 }]}>Categoría</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 15 }}>
        {CATEGORIES.map((cat) => {
          const isSelected = category === cat;
          return (
            <TouchableOpacity
              key={cat}
              onPress={() => setCategory(cat)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 20,
                backgroundColor: isSelected ? colors.primary : colors.surface,
              }}
            >
              <Text
                style={{
                  color: isSelected ? colors.background : colors.text,
                  fontWeight: "bold",
                }}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[globalStyles.textSecondary, { marginBottom: 8 }]}>Icono</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        {ICONS.map((iconName) => {
          const isSelected = selectedIcon === iconName;
          return (
            <TouchableOpacity
              key={iconName}
              onPress={() => setSelectedIcon(iconName)}
              style={{
                width: 46,
                height: 46,
                borderRadius: 23,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isSelected ? colors.primary : colors.surface,
                borderWidth: isSelected ? 2 : 0,
                borderColor: colors.text,
              }}
            >
              <Ionicons
                name={iconName as any}
                size={24}
                color={isSelected ? colors.background : colors.text}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[globalStyles.textSecondary, { marginBottom: 8 }]}>Calorías Totales (kcal)</Text>
      <TextInput
        style={globalStyles.input}
        placeholder="Ej. 450"
        placeholderTextColor={colors.textSecondary}
        keyboardType="numeric"
        value={calories}
        onChangeText={setCalories}
      />

      <Text style={[globalStyles.textSecondary, { marginTop: 10, marginBottom: 8 }]}>Macronutrientes (g)</Text>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: colors.secondary, marginBottom: 4 }}>Proteína (g)</Text>
          <TextInput
            style={[globalStyles.input, { width: "100%" }]}
            placeholder="35"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            value={protein}
            onChangeText={setProtein}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: colors.delete, marginBottom: 4 }}>Carbs (g)</Text>
          <TextInput
            style={[globalStyles.input, { width: "100%" }]}
            placeholder="50"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            value={carbs}
            onChangeText={setCarbs}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: colors.primary, marginBottom: 4 }}>Grasa (g)</Text>
          <TextInput
            style={[globalStyles.input, { width: "100%" }]}
            placeholder="12"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            value={fat}
            onChangeText={setFat}
          />
        </View>
      </View>

      <TouchableOpacity style={[globalStyles.button, { marginTop: 30, marginBottom: 60 }]} onPress={handleAddMeal}>
        <Text style={globalStyles.buttonText}>Guardar Comida</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 10,
  },
});
