import MealItem from "@/components/MealItem";
import { useTheme } from "@/context/ThemeContext";
import { getMeals, Meal } from "@/store/meals";
import { getGlobalStyles } from "@/styles/global";
import { Link, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function AllMealsScreen() {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
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

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 20, gap: 20 }}
      >
        <TouchableOpacity
          style={[
            globalStyles.button,
            { borderRadius: 50, marginHorizontal: 10, paddingHorizontal: 30 },
          ]}
        >
          <Text style={globalStyles.buttonText}>Todos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            globalStyles.button,
            { borderRadius: 50, marginHorizontal: 10, paddingHorizontal: 30 },
          ]}
        >
          <Text style={globalStyles.buttonText}>Desayuno</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            globalStyles.button,
            { borderRadius: 50, marginHorizontal: 10, paddingHorizontal: 30 },
          ]}
        >
          <Text style={globalStyles.buttonText}>Almuerzo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            globalStyles.button,
            { borderRadius: 50, marginHorizontal: 10, paddingHorizontal: 30 },
          ]}
        >
          <Text style={globalStyles.buttonText}>Cena</Text>
        </TouchableOpacity>
      </ScrollView>
      <View style={globalStyles.header}>
        <Text style={globalStyles.title}>Registrar Comidas</Text>
      </View>
      <View style={{ marginTop: 30 }}>
        {meals.length === 0 ? (
          <Text style={globalStyles.empty}>No meals logged yet.</Text>
        ) : (
          meals.map((meal) => (
            <MealItem
              key={meal.id}
              id={meal.id}
              name={meal.name}
              calories={meal.calories}
              protein={meal.protein}
              carbs={meal.carbs}
              fat={meal.fat}
              onDelete={loadMeals}
            />
          ))
        )}
      </View>
      <Link href="/meals/add" push asChild>
        <TouchableOpacity style={globalStyles.button}>
          <Text style={globalStyles.buttonText}>Add Meal</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = {
  clearButton: {
    color: "red",
    fontSize: 16,
  },
};
