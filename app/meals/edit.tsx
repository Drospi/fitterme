import { useTheme } from "@/context/ThemeContext";
import { addMeal, MealCategory } from "@/store/meals";
import { getGlobalStyles } from "@/styles/global";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function EditMealScreen() {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const router = useRouter();

  const [name, setName] = useState("");
  const [category, setCategory] = useState<MealCategory>("Almuerzo");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  const handleAddMeal = async () => {
    await addMeal({
      name,
      category,
      calories: parseInt(calories) || 0,
      protein: parseInt(protein) || 0,
      carbs: parseInt(carbs) || 0,
      fat: parseInt(fat) || 0,
      icon: "restaurant",
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Editar Comida</Text>

      <TextInput
        style={globalStyles.input}
        placeholder="Nombre de la comida"
        placeholderTextColor={colors.textSecondary}
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={globalStyles.input}
        placeholder="Calorías"
        placeholderTextColor={colors.textSecondary}
        keyboardType="numeric"
        value={calories}
        onChangeText={setCalories}
      />

      <View style={styles.row}>
        <TextInput
          style={[globalStyles.input, styles.rowInput]}
          placeholder="Proteína (g)"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={protein}
          onChangeText={setProtein}
        />
        <TextInput
          style={[globalStyles.input, styles.rowInput]}
          placeholder="Carbohidratos (g)"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={carbs}
          onChangeText={setCarbs}
        />
        <TextInput
          style={[globalStyles.input, styles.rowInput]}
          placeholder="Grasa (g)"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={fat}
          onChangeText={setFat}
        />
      </View>

      <TouchableOpacity style={globalStyles.button} onPress={handleAddMeal}>
        <Text style={globalStyles.buttonText}>Guardar Cambios</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 10,
  },
  rowInput: {
    flex: 1,
    width: 50,
  },
});
