import Step2FilterButton from "@/components/Step2FilterButton";
import { useTheme } from "@/context/ThemeContext";
import { getGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
    Button,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

type Props = {
  next: () => void;
  back: () => void;
  data: {
    exercises: Array<{
      id: string;
      name: string;
      series: Array<{ id: string; series: number; reps: number; kg: number }>;
    }>;
  };
  updateData: (newData: Partial<{ name: string; category: string }>) => void;
};

export default function Step2({ next, back, data, updateData }: Props) {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  const [muscleSelected, setMuscleSelected] = useState("");
  return (
    <View style={globalStyles.container}>
      <Ionicons name="arrow-back" size={32} onPress={back} color="#fff" />
      <Text style={globalStyles.title}>Paso 2: Ejercicios</Text>
      <View style={[globalStyles.input, { flexDirection: "row", gap: 10 }]}>
        <Ionicons name="search" size={20} onPress={back} color="#fff" />
        <TextInput
          placeholder="Buscar Ejercicios"
          placeholderTextColor="#666"
        />
      </View>

      <ScrollView horizontal style={{ marginTop: 20, flexDirection: "row" }}>
        <Step2FilterButton
          name="Todos"
          muscleSelected={muscleSelected}
          setMuscleSelected={setMuscleSelected}
        />
        <Step2FilterButton
          name="Pecho"
          muscleSelected={muscleSelected}
          setMuscleSelected={setMuscleSelected}
        />
        <Step2FilterButton
          name="Biceps"
          muscleSelected={muscleSelected}
          setMuscleSelected={setMuscleSelected}
        />
        <Step2FilterButton
          name="Muslos"
          muscleSelected={muscleSelected}
          setMuscleSelected={setMuscleSelected}
        />
      </ScrollView>
      <Button title="Siguiente" onPress={next} color="#d4ff00" />
    </View>
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
