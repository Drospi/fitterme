import { useTheme } from "@/context/ThemeContext";
import { deleteRoutine } from "@/store/routines";
import { getGlobalStyles } from "@/styles/global";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router"; // Importamos useRouter
import { Alert, Text, TouchableOpacity, View } from "react-native";

type RoutineItemProps = {
  id: string;
  name: string;
  // Cambiamos el tipo para que coincida con tu tipo Routine
  exercises: Array<{
    id: string;
    name: string;
    series: Array<{ id: string; series: number; reps: number; kg: number }>;
  }>;
  onDelete: () => void;
};

export default function RoutineItem({
  id,
  name,
  exercises,
  onDelete,
}: RoutineItemProps) {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const router = useRouter();
  console.log("Exercises in RoutineItem:", exercises);

  const handleLongPress = () => {
    Alert.alert(
      "Eliminar Rutina",
      `¿Estás seguro de que quieres eliminar "${name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            await deleteRoutine(id);
            onDelete();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ],
    );
  };

  return (
    <TouchableOpacity
      style={globalStyles.card}
      onLongPress={handleLongPress}
      onPress={() => router.push(`/routines/details?id=${id}`)}
    >
      <Text style={[globalStyles.cardTitle, { fontSize: 24 }]}>{name}</Text>
      <Text style={globalStyles.cardText}>
        {exercises.length} ejercicios • {exercises.length * 15} min
        estimados{" "}
      </Text>
      <View style={{ marginTop: 10, display: "flex", flexDirection: "row" }}>
        {exercises.map((ex) => (
          <Text
            key={ex.id}
            style={{
              color: colors.text,
              backgroundColor: colors.background,
              borderColor: colors.primary,
              padding: 5,
              paddingHorizontal: 15,
              borderRadius: 5,
              marginBottom: 5,
              marginRight: 5,
            }}
          >
            {ex.name}
          </Text>
        ))}
      </View>
    </TouchableOpacity>
  );
}
