import { useTheme } from "@/context/ThemeContext";
import { Meal } from "@/store/meals";
import { getGlobalStyles } from "@/styles/global";
import React from "react";
import { Text, View } from "react-native";
import ProgressCircle from "./ProgressCircle";

type MacroGridProps = {
  meals?: Meal[];
  todayCalories?: number;
  goalCalories: number;
};

export default function MacroGrid({ meals = [], todayCalories, goalCalories }: MacroGridProps) {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  const consumed =
    todayCalories !== undefined
      ? todayCalories
      : meals.reduce((acc, meal) => acc + meal.calories, 0);

  const percent = Math.min(100, Math.round((consumed / goalCalories) * 100));

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
        <Text style={globalStyles.textSecondary}>Calorías consumidas hoy</Text>
        <View style={{ flexDirection: "row", alignItems: "baseline", marginTop: 4 }}>
          <Text
            style={[
              globalStyles.text,
              { fontWeight: "bold", fontSize: 36, color: colors.primary },
            ]}
          >
            {consumed}
          </Text>
          <Text style={[globalStyles.textSecondary, { fontSize: 16, marginLeft: 4 }]}>
            / {goalCalories} kcal
          </Text>
        </View>
      </View>
      <ProgressCircle percent={percent} radius={38} />
    </View>
  );
}
