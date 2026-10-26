import { useTheme } from "@/context/ThemeContext";
import { ExerciseCatalogItem, getExerciseCategory } from "@/store/excercise";
import { getExerciseImage } from "@/utils/imageMap";
import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useMemo, useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface ExercisePickerModalProps {
  visible: boolean;
  exercises: ExerciseCatalogItem[];
  addedExerciseIds: number[];
  onSelectExercise: (exercise: ExerciseCatalogItem) => void;
  onClose: () => void;
  onNavigateDetail?: (exerciseId: number) => void;
  onCreateCustom?: () => void;
}

const MUSCLE_FILTERS = [
  "Todos",
  "Pecho",
  "Espalda",
  "Piernas",
  "Hombros",
  "Bíceps",
  "Tríceps",
  "Abdomen",
  "Cardio",
];

export default function ExercisePickerModal({
  visible,
  exercises,
  addedExerciseIds,
  onSelectExercise,
  onClose,
  onNavigateDetail,
  onCreateCustom,
}: ExercisePickerModalProps) {
  const { colors } = useTheme();
  const [search, setSearch] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState("Todos");

  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      const matchSearch =
        ex.nombre.toLowerCase().includes(search.toLowerCase()) ||
        (ex.musculo && ex.musculo.toLowerCase().includes(search.toLowerCase()));

      const matchMuscle =
        selectedMuscle === "Todos" ||
        (ex.musculo && ex.musculo.toLowerCase().includes(selectedMuscle.toLowerCase())) ||
        (selectedMuscle === "Cardio" && getExerciseCategory(ex) === "Cardio");

      return matchSearch && matchMuscle;
    });
  }, [exercises, search, selectedMuscle]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Añadir Ejercicio
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeButton, { borderColor: colors.cardBorder }]}
          >
            <Ionicons name="close" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.surface,
              borderColor: colors.cardBorder || "rgba(255,255,255,0.08)",
            },
          ]}
        >
          <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Buscar por nombre o músculo..."
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Optional: Create custom exercise button */}
        {onCreateCustom ? (
          <TouchableOpacity
            style={[
              styles.createCustomButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.cardBorder,
              },
            ]}
            onPress={onCreateCustom}
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <Text style={[styles.createCustomText, { color: colors.text }]}>
              + Crear Ejercicio Personalizado
            </Text>
          </TouchableOpacity>
        ) : null}

        {/* Muscle Filter Chips */}
        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {MUSCLE_FILTERS.map((m) => {
              const isSelected = selectedMuscle === m;
              return (
                <TouchableOpacity
                  key={m}
                  onPress={() => setSelectedMuscle(m)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.cardBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color: isSelected ? colors.background : colors.textSecondary,
                        fontWeight: isSelected ? "bold" : "600",
                      },
                    ]}
                  >
                    {m}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Exercises List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
        >
          {filtered.map((exercise) => {
            const isAdded = addedExerciseIds.includes(exercise.id);
            const cat = getExerciseCategory(exercise);

            return (
              <View
                key={exercise.id}
                style={[
                  styles.exerciseCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.cardBorder || "rgba(255,255,255,0.08)",
                    opacity: isAdded ? 0.5 : 1,
                  },
                ]}
              >
                <TouchableOpacity
                  style={{ flexDirection: "row", alignItems: "center", flex: 1, gap: 12 }}
                  disabled={!onNavigateDetail}
                  onPress={() => onNavigateDetail && onNavigateDetail(exercise.id)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={getExerciseImage(exercise.id, exercise.urlimage)}
                    style={styles.exerciseImage}
                  />

                  <View style={styles.exerciseInfo}>
                    <Text style={[styles.exerciseName, { color: colors.text }]}>
                      {exercise.nombre}
                    </Text>
                    <Text style={[styles.exerciseMeta, { color: colors.textSecondary }]}>
                      {cat} • {exercise.musculo}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={isAdded}
                  onPress={() => onSelectExercise(exercise)}
                  style={styles.addButton}
                >
                  <Ionicons
                    name={isAdded ? "checkmark-circle" : "add-circle"}
                    size={32}
                    color={isAdded ? colors.primary : colors.primary}
                  />
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  createCustomButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  createCustomText: {
    fontSize: 13,
    fontWeight: "bold",
  },
  filterRow: {
    marginBottom: 14,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
  },
  exerciseCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  exerciseImage: {
    width: 48,
    height: 48,
    borderRadius: 10,
    marginRight: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: "bold",
  },
  exerciseMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  addButton: {
    padding: 4,
  },
});
