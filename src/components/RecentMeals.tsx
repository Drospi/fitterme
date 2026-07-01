import { useTheme } from "@/context/ThemeContext";
import { Meal } from "@/store/meals";
import { getGlobalStyles } from "@/styles/global";
import { StyleSheet, Text, View } from "react-native";
import MealItem from "./MealItem";

type RecentMealsProps = {
  meals: Meal[];
  onDelete: () => void;
};

export default function RecentMeals({ meals, onDelete }: RecentMealsProps) {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  return (
    <View style={{ marginTop: 30 }}>
      <Text style={globalStyles.title}>Recent Meals</Text>
      {meals.length === 0 ? (
        <Text style={globalStyles.textSecondary}>No meals logged yet.</Text>
      ) : (
        meals
          .slice(0, 5)
          .map((meal) => (
            <MealItem
              key={meal.id}
              id={meal.id}
              name={meal.name}
              calories={meal.calories}
              protein={meal.protein}
              carbs={meal.carbs}
              fat={meal.fat}
              onDelete={onDelete}
            />
          ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 16,
  },
  empty: {
    color: "#a0a0b0",
    fontSize: 14,
  },
});
