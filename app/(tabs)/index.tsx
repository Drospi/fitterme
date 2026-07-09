import MacroGrid from "@/components/MacroGrid";
import MeasureStadistics from "@/components/MeasureStadistics";
import ShareButton from "@/components/ShareButton";
import { useTheme } from "@/context/ThemeContext";
import { getMeals, Meal } from "@/store/meals";
import { getGlobalStyles } from "@/styles/global";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";

export default function HomeScreen() {
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
    <ScrollView style={globalStyles.container}>
      <View style={globalStyles.header}>
        <Image
          style={globalStyles.icon}
          source={require("@/assets/images/profile.jpeg")}
        />
        <Text style={globalStyles.title}>FitterMe</Text>
        <ShareButton meals={meals} />
      </View>

      <MacroGrid meals={meals} goalCalories={2000} />
      <MeasureStadistics />
    </ScrollView>
  );
}
