import { useTheme } from "@/context/ThemeContext";
import { deleteRoutine } from "@/store/routines";
import { getGlobalStyles } from "@/styles/global";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router"; // Importamos useRouter
import { Alert, Text, TouchableOpacity, View } from "react-native";

type RoutineItemProps = {
  id: string;
  name: string;
  category: string;
  exercises: Array<{
    id: number;
    nombre: string;
    musculo: string;
    objetivo: string;
    equipamiento: string;
    urlimage?: string;
    series?: number;
    reps?: number;
    peso?: number;
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
  const allMuscles = exercises.map((ex) => ex.musculo);

  const uniqueMuscles = [...new Set(allMuscles)];

  console.log("Exercises in RoutineItem:", exercises);

  const handleDelete = () => {
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
    <TouchableOpacity style={globalStyles.card}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={[globalStyles.cardTitle, { fontSize: 24 }]}>{name}</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Ionicons
            name="pencil-outline"
            size={24}
            color={colors.secondary}
            onPress={() =>
              router.push({
                pathname: "/routines/EditRoutine/[id]",
                params: { id: id },
              })
            }
          />
          <Ionicons
            name="trash"
            size={24}
            color={colors.delete}
            onPress={handleDelete}
          />
        </View>
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View>
          <Text style={globalStyles.cardText}>
            {exercises.length} ejercicios • {exercises.length * 15} min,{" "}
            {exercises[1].reps}
            estimados{" "}
          </Text>
          <View
            style={{ marginTop: 10, display: "flex", flexDirection: "row" }}
          >
            {uniqueMuscles.map((musculo, index) => (
              <Text
                key={index}
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
                {musculo.charAt(0).toUpperCase() + musculo.slice(1)}
              </Text>
            ))}
          </View>
        </View>
        <Ionicons name="play-circle" size={48} color={colors.primary} />
      </View>
    </TouchableOpacity>
  );
}
