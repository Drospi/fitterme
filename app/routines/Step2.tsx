import ExerciseItem from "@/components/ExcerciseItem";
import Step2FilterButton from "@/components/Step2FilterButton";
import { useTheme } from "@/context/ThemeContext";
import { ExerciseCatalogItem, getAllExercises, getExerciseCategory } from "@/store/excercise";
import { getGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  next: () => void;
  back: () => void;
  data: {
    exercises: ExerciseCatalogItem[];
  };
  updateData: (newData: Partial<{ exercises: ExerciseCatalogItem[] }>) => void;
};

export default function Step2({ next, back, data, updateData }: Props) {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [muscleSelected, setMuscleSelected] = useState("");
  const [catalog, setCatalog] = useState<ExerciseCatalogItem[]>([]);
  const [exercises, setExercises] = useState<ExerciseCatalogItem[]>(
    data.exercises ?? [],
  );

  const loadCatalog = async () => {
    const list = await getAllExercises();
    setCatalog(list);
  };

  useFocusEffect(
    useCallback(() => {
      loadCatalog();
    }, [])
  );

  const handleSelect = (exerciseToAdd: ExerciseCatalogItem) => {
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

  const filteredExercises = catalog
    .filter((exercise) => {
      if (muscleSelected === "Todos" || muscleSelected === "") return true;

      const cat = getExerciseCategory(exercise);
      if (muscleSelected === "Gym") return cat === "Gym";
      if (muscleSelected === "Cardio") return cat === "Cardio";
      if (muscleSelected === "Peso corporal") return cat === "Peso corporal";

      const m = (exercise.musculo || "").toLowerCase();

      if (muscleSelected === "Brazos")
        return ["biceps", "triceps", "antebrazo", "hombros"].includes(m);

      if (muscleSelected === "Espalda")
        return ["espalda", "hombros"].includes(m);

      if (muscleSelected === "Pierna")
        return ["pierna", "gemelos", "gluteos", "cuadriceps"].includes(m);

      if (muscleSelected === "Abdomen")
        return ["cadera", "cintura", "abdomen"].includes(m);

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
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Ionicons name="arrow-back" size={28} onPress={back} color={colors.text} />
          <Text style={[globalStyles.title, { fontSize: 22, marginVertical: 0 }]}>
            Paso 2: Ejercicios
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push("/exercises/add" as any)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            backgroundColor: colors.primary,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 16,
          }}
        >
          <Ionicons name="add-circle" size={18} color={colors.background} />
          <Text style={{ color: colors.background, fontWeight: "bold", fontSize: 12 }}>
            Crear Ejercicio
          </Text>
        </TouchableOpacity>
      </View>

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
          {["Todos", "Gym", "Cardio", "Peso corporal", "Pecho", "Brazos", "Espalda", "Pierna", "Abdomen"].map(
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

      {/* 4. Lista de ejercicios */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 15 }}
      >
        {filteredExercises.map((excercise: ExerciseCatalogItem) => (
          <ExerciseItem
            key={excercise.id}
            excerciseInfo={excercise}
            onCheck={() => handleSelect(excercise)}
            isCheckedFather={exercises.some((e) => e.id === excercise.id)}
          />
        ))}
      </ScrollView>

      {/* 5. Botón Siguiente */}
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
