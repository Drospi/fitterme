import ExerciseItem from "@/components/ExcerciseItem";
import Step2FilterButton from "@/components/Step2FilterButton";
import { useTheme } from "@/context/ThemeContext";
import dataExcercises from "@/data/exercises.json";
import { getGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
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

type ExerciseList = ExerciseType[];

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

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={globalStyles.container}>
        <Ionicons name="arrow-back" size={32} onPress={back} color="#fff" />
        <Text style={globalStyles.title}>Paso 2: Ejercicios</Text>
        <View style={[globalStyles.input, { flexDirection: "row", gap: 10 }]}>
          <Ionicons name="search" size={20} onPress={back} color="#fff" />
          <TextInput
            placeholder="Buscar Ejercicios"
            placeholderTextColor={colors.textSecondary}
          />
        </View>
        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{
              marginTop: 20,
              flexDirection: "row",
              gap: 10,
              marginBottom: 20,
              flex: 1,
            }}
          >
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
              name="Brazos"
              muscleSelected={muscleSelected}
              setMuscleSelected={setMuscleSelected}
            />
            <Step2FilterButton
              name="Espalda"
              muscleSelected={muscleSelected}
              setMuscleSelected={setMuscleSelected}
            />
            <Step2FilterButton
              name="Pierna"
              muscleSelected={muscleSelected}
              setMuscleSelected={setMuscleSelected}
            />
            <Step2FilterButton
              name="Abdomen"
              muscleSelected={muscleSelected}
              setMuscleSelected={setMuscleSelected}
            />
          </ScrollView>
        </View>
        <View style={{ height: "60%" }}>
          <Text style={globalStyles.textSecondary}>
            {" "}
            ejercicios seleccionados
          </Text>
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ flex: 1, marginTop: 20 }}
          >
            {dataExcercises
              .filter((exercise) => {
                if (muscleSelected === "Todos" || muscleSelected === "")
                  return true;

                const m = exercise.musculo.toLowerCase();

                if (muscleSelected === "Brazos")
                  return [
                    "biceps",
                    "triceps",
                    "antebrazos",
                    "hombros",
                  ].includes(m);

                if (muscleSelected === "Espalda")
                  return ["espalda", "hombros"].includes(m);

                if (muscleSelected === "Pierna")
                  return [
                    "pierna",
                    "gemelos",
                    "gluteos",
                    "cuadriceps",
                  ].includes(m);

                if (muscleSelected === "Abdomen")
                  return ["cadera", "cintura"].includes(m);

                return m === muscleSelected.toLowerCase();
              })
              .map((excercise: ExerciseType) => (
                <ExerciseItem
                  key={excercise.id}
                  excerciseInfo={excercise}
                  onCheck={() => handleSelect(excercise)}
                  isCheckedFather={exercises.some((e) => e.id === excercise.id)}
                />
              ))}
          </ScrollView>
        </View>
      </ScrollView>
      <TouchableOpacity
        onPress={next}
        style={[
          globalStyles.button,
          {
            position: "absolute",
            bottom: 20,
            right: 20,
            left: 20,
          },
        ]}
      >
        <Text style={globalStyles.buttonText}>Siguiente</Text>
      </TouchableOpacity>
    </View>
  );
}
