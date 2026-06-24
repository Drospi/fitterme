import { deleteRoutine } from "@/store/routines";
import { colors } from "@/styles/global";
import * as Haptics from "expo-haptics";
import { Alert, StyleSheet, Text, TouchableOpacity } from "react-native";

type RoutineItemProps = {
  id: string;
  name: string;
  series: number;
  reps: number;
  kg: number;
  fat: number;
  onDelete: () => void;
};

export default function RoutineItem({
  id,
  name,
  series,
  reps,
  kg,
  fat,
  onDelete,
}: RoutineItemProps) {
  const handleLongPress = () => {
    Alert.alert(
      "Delete Routine",
      `Are you sure you want to delete "${name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteRoutine(id);
            onDelete();
          },
        },
      ],
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <TouchableOpacity style={styles.container} onLongPress={handleLongPress}>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.macros}>
        {series} series • {reps} reps • {kg} kg • {fat}g F
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  macros: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
