import ExcerciseItem from "@/components/ExcerciseItem";
import { useTheme } from "@/context/ThemeContext";
import { addRoutine } from "@/store/routines";
import { getGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function AddRoutineScreen() {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const route = useRouter();

  const [name, setName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [exercises, setExercises] = useState([
    {
      id: Date.now().toString(),
      name: "",
      series: [
        {
          id: Date.now().toString(),
          series: 1,
          reps: 0,
          kg: 0,
          isActive: false,
        },
      ],
    },
  ]);

  const handleAddExercise = () => {
    const newExercise = {
      id: Date.now().toString(),
      name: "",
      series: [
        {
          id: Date.now().toString(),
          series: 1,
          reps: 0,
          kg: 0,
          isActive: false,
        },
      ],
    };
    setExercises((prev) => [...prev, newExercise]);
  };

  // Función para actualizar un ejercicio específico
  const updateExercise = (id: string, updatedData: any) => {
    setExercises((prev) =>
      prev.map((ex) => (ex.id === id ? { ...ex, ...updatedData } : ex)),
    );
  };

  const handleDeleteExercise = (id: string) => {
    setExercises((prev) => prev.filter((ex) => ex.id !== id));
  };

  const handleAddRoutine = async () => {
    await addRoutine({
      name,
      exercises: exercises,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    route.dismissAll();
  };

  return (
    <ScrollView
      style={globalStyles.container}
      contentContainerStyle={{ paddingBottom: 50 }}
    >
      <View style={globalStyles.header}>
        <Ionicons
          name="arrow-back"
          onPress={() => route.back()}
          size={24}
          color={colors.text}
        />
        <Text style={globalStyles.text}>Crear Rutina</Text>
        <TouchableOpacity onPress={handleAddRoutine}>
          <Text style={globalStyles.textPrimary}>Guardar</Text>
        </TouchableOpacity>
      </View>

      <View style={{ marginVertical: 20 }}>
        {isEditing ? (
          <TextInput
            style={globalStyles.title}
            value={name}
            onChangeText={setName}
            onBlur={() => setIsEditing(false)}
            autoFocus
            placeholder="Nombre de la rutina"
          />
        ) : (
          <TouchableOpacity onPress={() => setIsEditing(true)}>
            <Text style={globalStyles.title}>
              {name || "Nombre de la rutina"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {exercises.map((exercise) => (
        <ExcerciseItem
          key={exercise.id}
          id={exercise.id}
          name={exercise.name}
          series={exercise.series}
          onChange={(newData) => updateExercise(exercise.id, newData)}
          onDelete={() => handleDeleteExercise(exercise.id)}
        />
      ))}

      <TouchableOpacity
        style={{ width: "100%", alignItems: "center", marginTop: 20 }}
        onPress={handleAddExercise}
      >
        <Text style={globalStyles.textPrimary}>+ Agregar Ejercicio</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
