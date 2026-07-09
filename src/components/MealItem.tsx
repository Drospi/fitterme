import { useTheme } from "@/context/ThemeContext";
import { deleteMeal } from "@/store/meals";
import { getGlobalStyles } from "@/styles/global";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { Alert, Image, Text, TouchableOpacity, View } from "react-native";

type MealItemProps = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  onDelete: () => void;
};

export default function MealItem({
  id,
  name,
  calories,
  protein,
  carbs,
  fat,
  onDelete,
}: MealItemProps) {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const handleLongPress = () => {
    Alert.alert("Delete Meal", `Are you sure you want to delete "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteMeal(id);
          onDelete();
        },
      },
    ]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <TouchableOpacity
      style={[
        globalStyles.card,
        { flexDirection: "row", justifyContent: "space-between" },
      ]}
      onLongPress={handleLongPress}
    >
      <View style={{ marginRight: 10, width: "20%" }}>
        <Image></Image>
      </View>
      <View>
        <Text style={globalStyles.cardTitle}>{name}</Text>
        <Text style={globalStyles.cardText}>
          {calories} cal • {protein}g P • {carbs}g C • {fat}g F
        </Text>
      </View>
      <View>
        <Ionicons name="add-circle" size={40} color={colors.primary} />
      </View>
    </TouchableOpacity>
  );
}
