import AllMeals from "@/components/AllMeals";
import { useTheme } from "@/context/ThemeContext";
import { clearAllMeals, getMeals, Meal } from "@/store/meals";
import { getGlobalStyles } from "@/styles/global";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function MealsScreen() {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const [meals, setMeals] = useState<Meal[]>([]);

  const loadMeals = async () => {
    const data = await getMeals();
    setMeals(data);
  };

  const handleClearAll = async () => {
    await clearAllMeals();
    loadMeals();
  };

  useFocusEffect(
    useCallback(() => {
      loadMeals();
    }, []),
  );

  return (
    <ScrollView style={globalStyles.container}>
      <View style={globalStyles.header}>
        <Text style={globalStyles.title}>Comidas</Text>
        <TouchableOpacity onPress={handleClearAll}>
          <Text style={styles.clearButton}>Clear All</Text>
        </TouchableOpacity>
      </View>
      <View style={[globalStyles.card, { alignItems: "center" }]}>
        <Text style={globalStyles.cardText}>CALORIAS RESTANTES</Text>
        <Text
          style={{ fontSize: 40, fontWeight: "bold", color: colors.primary }}
        >
          0
        </Text>
        <Text style={globalStyles.cardText}>de 2500 kcal</Text>
        <View
          style={{
            height: 12,
            width: "100%",
            marginTop: 15,
            backgroundColor: colors.background,
            borderRadius: 6,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              height: "100%",
              backgroundColor: colors.primary,
              width: `${65}%`,
            }}
          />
        </View>
        <View
          style={{
            marginTop: 20,
            width: "100%",
            justifyContent: "space-between",
            flexDirection: "row",
          }}
        >
          <Text style={globalStyles.cardText}>
            Consumidas:{" "}
            <Text style={{ fontWeight: "bold", color: colors.text }}>
              0 kcal
            </Text>
          </Text>
          <Text style={globalStyles.cardText}>
            Quemadas:{" "}
            <Text style={{ fontWeight: "bold", color: colors.secondary }}>
              2500 kcal
            </Text>
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: "4%" }}>
        <View style={[globalStyles.card, { width: "48%" }]}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={globalStyles.cardText}>Proteina</Text>
            <Ionicons name="nutrition" size={24} color={colors.secondary} />
          </View>
          <Text
            style={{
              fontSize: 40,
              fontWeight: "bold",
              color: colors.text,
            }}
          >
            85g
          </Text>
          <Text style={globalStyles.cardText}>/ 100g</Text>
          <View
            style={{
              height: 8,
              width: "100%",
              marginTop: 15,
              backgroundColor: colors.background,
              borderRadius: 6,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: 8,
                backgroundColor: colors.secondary,
                width: `${65}%`,
              }}
            />
          </View>
        </View>
        <View style={[globalStyles.card, { width: "48%" }]}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={globalStyles.cardText}>Carbohidratos</Text>
            <Ionicons name="thunderstorm" size={24} color={colors.delete} />
          </View>
          <Text
            style={{
              fontSize: 40,
              fontWeight: "bold",
              color: colors.text,
            }}
          >
            85g
          </Text>
          <Text style={globalStyles.cardText}>/ 100g</Text>
          <View
            style={{
              height: 8,
              width: "100%",
              marginTop: 15,
              backgroundColor: colors.background,
              borderRadius: 6,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: 8,
                backgroundColor: colors.delete,
                width: `${65}%`,
              }}
            />
          </View>
        </View>
      </View>
      <AllMeals />
    </ScrollView>
  );
}

const styles = {
  clearButton: {
    color: "red",
    fontSize: 16,
  },
};
