import { useTheme } from "@/context/ThemeContext";
import { deleteMeal } from "@/store/meals";
import { getGlobalStyles } from "@/styles/global";
import * as Haptics from "expo-haptics";
import { Alert, Text, TouchableOpacity } from "react-native";

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
    <TouchableOpacity style={globalStyles.card} onLongPress={handleLongPress}>
      <Text style={globalStyles.cardTitle}>{name}</Text>
      <Text style={globalStyles.cardText}>
        {calories} cal • {protein}g P • {carbs}g C • {fat}g F
      </Text>
    </TouchableOpacity>
  );
}
