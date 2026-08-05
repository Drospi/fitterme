import ExerciseItem from "@/components/ExcerciseItem";
import Step2FilterButton from "@/components/Step2FilterButton";
import { useTheme } from "@/context/ThemeContext";
import dataExcercises from "@/data/exercises.json";
import { getGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Dimensions,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type ExerciseType = {
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

type Props = {
  next: () => void;
  back: () => void;
  data: {
    exercises: ExerciseType[];
  };
  updateData: (newData: Partial<{ exercises: ExerciseType[] }>) => void;
};

export default function Step2({ next, back, data, updateData }: Props) {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  const [search, setSearch] = useState("");
  const [muscleSelected, setMuscleSelected] = useState("");
  const [exercises, setExercises] = useState<ExerciseType[]>(
    data.exercises ?? [],
  );

  const handleSelect = (exerciseToAdd: ExerciseType) => {
    let newExercises;
    const exists = exercises.find((e) => e.id === exerciseToAdd.id);

    if (exists) {
      newExercises = exercises.filter((e) => e.id !== exerciseToAdd.id);
    } else {
      newExercises = [...exercises, exerciseToAdd];
    }

    setExercises(newExercises);
    updateData({ exercises: newExercises });
  };

  const filteredExercises = dataExcercises
    .filter((exercise) => {
      if (muscleSelected === "Todos" || muscleSelected === "") return true;

      const m = exercise.musculo.toLowerCase();

      if (muscleSelected === "Brazos")
        return ["biceps", "triceps", "antebrazos", "hombros"].includes(m);

      if (muscleSelected === "Espalda")
        return ["espalda", "hombros"].includes(m);

      if (muscleSelected === "Pierna")
        return ["pierna", "gemelos", "gluteos", "cuadriceps"].includes(m);

      if (muscleSelected === "Abdomen")
        return ["cadera", "cintura"].includes(m);

      return m === muscleSelected.toLowerCase();
    })
    .filter((e) => e.nombre.toLowerCase().includes(search.toLowerCase()));

  return (
    <View
      style={{
        flex: 1,
        width: "100%",
      }}
    >
      {/* 1. Cabecera */}
      <Ionicons name="arrow-back" size={32} onPress={back} color={colors.text} />
      <Text style={[globalStyles.title, { marginVertical: 10 }]}>
        Paso 2: Ejercicios
      </Text>

      {/* 2. Buscador */}
      <View
        style={[
          globalStyles.input,
          {
            flexDirection: "row",
            gap: 10,
            alignItems: "center",
            marginBottom: 10,
            paddingHorizontal: 20,
            paddingVertical: 10,
            marginTop: 0,
          },
        ]}
      >
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          placeholder="Buscar Ejercicios"
          placeholderTextColor={colors.textSecondary}
          style={{ flex: 1, color: colors.text }}
          onChangeText={(text) => setSearch(text)}
          value={search}
        />
      </View>

      {/* 3. Filtros horizontales */}
      <View style={{ maxHeight: 60, marginBottom: 10 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, alignItems: "center" }}
        >
          {["Todos", "Pecho", "Brazos", "Espalda", "Pierna", "Abdomen"].map(
            (name) => (
              <Step2FilterButton
                key={name}
                name={name}
                muscleSelected={muscleSelected}
                setMuscleSelected={setMuscleSelected}
              />
            ),
          )}
        </ScrollView>
      </View>

      <Text style={[globalStyles.textSecondary, { marginBottom: 10 }]}>
        Ejercicios seleccionados ({exercises.length})
      </Text>

      {/* 4. Lista de ejercicios que ocupa todo el espacio scrollable disponible */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 15 }}
      >
        {filteredExercises.map((excercise: ExerciseType) => (
          <ExerciseItem
            key={excercise.id}
            excerciseInfo={excercise}
            onCheck={() => handleSelect(excercise)}
            isCheckedFather={exercises.some((e) => e.id === excercise.id)}
          />
        ))}
      </ScrollView>

      {/* 5. Botón Siguiente anclado permanentemente en la parte inferior */}
      <View style={{ paddingTop: 10, paddingBottom: 20, backgroundColor: colors.background, width: "100%" }}>
        <TouchableOpacity
          onPress={next}
          style={[globalStyles.button, { marginTop: 0 }]}
        >
          <Text style={globalStyles.buttonText}>Siguiente</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
