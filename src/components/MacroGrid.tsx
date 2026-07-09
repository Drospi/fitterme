import { useTheme } from "@/context/ThemeContext";
import { Meal } from "@/store/meals";
import { getGlobalStyles } from "@/styles/global";
import { Text, View } from "react-native";
import ProgressCircle from "./ProgressCircle";
type MacroGridProps = {
  meals: Meal[];
  goalCalories: number;
};

export default function MacroGrid({ meals, goalCalories }: MacroGridProps) {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  console.log("GlobalStyles:", globalStyles);
  const totals = meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fat: acc.fat + meal.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  return (
    <View
      style={[
        globalStyles.card,
        {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        },
      ]}
    >
      <View>
        <Text style={globalStyles.textSecondary}>Calorias hoy</Text>
        <View>
          <Text style={globalStyles.textSecondary}>
            <Text
              style={[
                globalStyles.text,
                { width: 100, fontWeight: "bold", fontSize: 40 },
              ]}
            >
              {totals.calories}
            </Text>{" "}
            / {goalCalories} kcal
          </Text>
        </View>
      </View>
      <ProgressCircle
        percent={(totals.calories / goalCalories) * 100}
        radius={40}
      />
    </View>
  );
}
