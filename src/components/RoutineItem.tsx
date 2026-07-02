import { useTheme } from "@/context/ThemeContext";
import { deleteRoutine } from "@/store/routines";
import { getGlobalStyles } from "@/styles/global";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router"; // Importamos useRouter
import { Alert, Text, TouchableOpacity } from "react-native";

type RoutineItemProps = {
  id: string;
  name: string;
  // Ajustamos los props: ahora recibirá un array de ejercicios o el objeto completo
  // Si tu 'Routine' tiene varios ejercicios, es mejor mostrar un resumen.
  exercisesCount: number;
  onDelete: () => void;
};

export default function RoutineItem({
  id,
  name,
  exercisesCount,
  onDelete,
}: RoutineItemProps) {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const router = useRouter(); // Inicializamos el router

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
      // Navegación a detalles pasando el ID como parámetro
      onPress={() => router.push(`/routines/details?id=${id}`)}
    >
      <Text style={globalStyles.title}>{name}</Text>
      <Text style={globalStyles.textSecondary}>
        {exercisesCount} ejercicios en esta rutina
      </Text>
    </TouchableOpacity>
  );
}
