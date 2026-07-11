import { useTheme } from "@/context/ThemeContext";
import { getGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Image,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

type Exercise = {
  id: number;
  nombre: string;
  musculo: string;
  objetivo: string;
  equipamiento: string;
  urlimage?: string;
  series?: number;
  reps?: number;
  peso?: number;
};

type ExerciseList = Exercise[];

type Props = {
  back: () => void;
  data: {
    exercises: ExerciseList;
  };
  updateData: (newData: Partial<{ exercises: ExerciseList }>) => void;
  saveRoutine: () => void;
};

export default function Step3({ back, data, updateData, saveRoutine }: Props) {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  const [exercises, setExercises] = useState<ExerciseList>(
    (data.exercises || []).map((ex: Exercise) => ({
      ...ex,
      series: ex.series ?? 0,
      reps: ex.reps ?? 0,
      peso: ex.peso ?? 0,
    })),
  );

  const handleInputChange = (
    index: number,
    field: "series" | "reps" | "peso",
    value: string,
  ) => {
    const updated = [...exercises];
    const numValue = value === "" ? 0 : Number(value);
    updated[index] = { ...updated[index], [field]: numValue };
    setExercises(updated);
  };

  const moveExercise = (index: number, direction: "up" | "down") => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= exercises.length) return;

    const updated = [...exercises];
    [updated[index], updated[targetIndex]] = [
      updated[targetIndex],
      updated[index],
    ];

    setExercises(updated);
    updateData({ exercises: updated });
  };

  const handleSave = () => {
    updateData({ exercises: exercises });
    saveRoutine();
  };

  return (
    <ScrollView style={globalStyles.container}>
      <Ionicons name="arrow-back" size={32} onPress={back} color="#fff" />
      <Text style={styles.title}>Paso 3: Configuracion</Text>
      <Text style={globalStyles.textSecondary}>
        Ajusta las series, repeticiones y descansos para cada ejercicio
        seleccionado
      </Text>

      {exercises.map((exercise: Exercise, index: number) => (
        <View
          key={exercise.id}
          style={[globalStyles.card, { marginVertical: 10 }]}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <View style={{ flexDirection: "row", gap: 20 }}>
              <Image
                style={{ width: 60, height: 60, borderRadius: 10 }}
                source={require("@/assets/images/excercises/example.jpeg")}
              />
              <View>
                <Text style={globalStyles.cardTitle}>{exercise.nombre}</Text>
                <Text style={globalStyles.textSecondary}>
                  {exercise.musculo} • {exercise.objetivo}
                </Text>
              </View>
            </View>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
            >
              {index > 0 && (
                <Ionicons
                  name="chevron-up"
                  size={22}
                  color={colors.primary}
                  onPress={() => moveExercise(index, "up")}
                />
              )}
              {index < exercises.length - 1 && (
                <Ionicons
                  name="chevron-down"
                  size={22}
                  color={colors.primary}
                  onPress={() => moveExercise(index, "down")}
                />
              )}
            </View>
          </View>
          <View style={{ gap: 10, flexDirection: "row", width: "100%" }}>
            <View style={{ flexDirection: "column", flex: 1, marginRight: 10 }}>
              <Text
                style={[
                  globalStyles.cardText,
                  { fontWeight: "bold", marginBottom: 5 },
                ]}
              >
                SERIES
              </Text>
              <TextInput
                placeholder="4"
                placeholderTextColor="#666"
                keyboardType="numeric"
                value={
                  exercises[index].series
                    ? exercises[index].series.toString()
                    : ""
                }
                onChangeText={(val) => handleInputChange(index, "series", val)}
                style={styles.input}
              />
            </View>
            <View style={{ flexDirection: "column", flex: 1, marginRight: 10 }}>
              <Text
                style={[
                  globalStyles.cardText,
                  { fontWeight: "bold", marginBottom: 5 },
                ]}
              >
                REPS
              </Text>
              <TextInput
                placeholder="10"
                placeholderTextColor="#666"
                keyboardType="numeric"
                value={
                  exercises[index].reps ? exercises[index].reps?.toString() : ""
                }
                onChangeText={(val) => handleInputChange(index, "reps", val)}
                style={styles.input}
              />
            </View>
            <View style={{ flexDirection: "column", flex: 1, marginRight: 10 }}>
              <Text
                style={[
                  globalStyles.cardText,
                  { fontWeight: "bold", marginBottom: 5 },
                ]}
              >
                PESO (KG)
              </Text>
              <TextInput
                placeholder="15"
                placeholderTextColor="#666"
                keyboardType="numeric"
                value={
                  exercises[index].peso ? exercises[index].peso?.toString() : ""
                }
                onChangeText={(val) => handleInputChange(index, "peso", val)}
                style={styles.input}
              />
            </View>
          </View>
        </View>
      ))}

      <TouchableOpacity style={globalStyles.button} onPress={handleSave}>
        <Text>Guardar Rutina</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1 },
  title: { color: "#fff", fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  input: {
    backgroundColor: "#1a1a1a",
    color: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
});
