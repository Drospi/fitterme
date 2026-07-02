import ExcerciseItem from "@/components/ExcerciseItem";
import { useTheme } from "@/context/ThemeContext";
import { getRoutines } from "@/store/routines"; // Necesitarás una función para actualizar/guardar
import { getGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function RoutineDetails() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const router = useRouter();

  const [routine, setRoutine] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [timer, setTimer] = useState(0); // Segundos

  useEffect(() => {
    loadRoutine();
  }, [id]);

  const loadRoutine = async () => {
    const all = await getRoutines();
    const found = all.find((r) => r.id === id);
    setRoutine(found);
  };

  // Lógica del contador
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!routine) return <Text>Cargando...</Text>;

  return (
    <ScrollView style={globalStyles.container}>
      {/* Header con Timer */}
      <View style={globalStyles.header}>
        <Ionicons
          name="arrow-back"
          onPress={() => router.back()}
          size={24}
          color={colors.text}
        />
        <Text style={globalStyles.text}>{formatTime(timer)}</Text>
        <TouchableOpacity
          onPress={() => console.log("Finalizar entrenamiento")}
        >
          <Text style={globalStyles.textPrimary}>Finalizar</Text>
        </TouchableOpacity>
      </View>

      {/* Edición de nombre */}
      {isEditing ? (
        <TextInput
          style={globalStyles.title}
          value={routine.name}
          onChangeText={(val) => setRoutine({ ...routine, name: val })}
          onBlur={() => setIsEditing(false)}
          autoFocus
        />
      ) : (
        <TouchableOpacity onPress={() => setIsEditing(true)}>
          <Text style={globalStyles.title}>{routine.name}</Text>
        </TouchableOpacity>
      )}

      {/* Lista de ejercicios */}
      {routine.exercises.map((ex: any) => (
        <ExcerciseItem
          key={ex.id}
          id={ex.id}
          name={ex.name}
          series={ex.series}
          onDelete={() => {}} // Lógica de eliminar ejercicio
          onChange={(newData) => {
            const newExercises = routine.exercises.map((e: any) =>
              e.id === ex.id ? { ...e, ...newData } : e,
            );
            setRoutine({ ...routine, exercises: newExercises });
          }}
        />
      ))}

      <TouchableOpacity style={globalStyles.button}>
        <Text style={globalStyles.buttonText}>Guardar Cambios</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
