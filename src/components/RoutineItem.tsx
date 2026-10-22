import ThemeConfirmModal from "@/components/ThemeConfirmModal";
import { useTheme } from "@/context/ThemeContext";
import { deleteRoutine } from "@/store/routines";
import { getGlobalStyles } from "@/styles/global";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";

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
    series: number;
    reps?: number;
    peso?: number;
  }>;
  onDelete: () => void;
};

export default function RoutineItem({
  id,
  name,
  category,
  exercises = [],
  onDelete,
}: RoutineItemProps) {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const router = useRouter();

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const allMuscles = exercises.map((ex) => ex.musculo);
  const uniqueMuscles = [...new Set(allMuscles)];

  const totalSeries = exercises.reduce(
    (total, exercise) => total + (exercise.series || 0),
    0
  );
  const estimatedTime = totalSeries * 3;

  const confirmDeleteRoutine = async () => {
    setShowConfirmDelete(false);
    await deleteRoutine(id);
    onDelete();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Toast.show({
      type: "success",
      text1: "Rutina Eliminada",
      text2: `"${name}" se ha eliminado del catálogo.`,
    });
  };

  const handleEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/routines/EditRoutine/[id]",
      params: { id: id },
    });
  };

  const handlePlay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/routines/PlayRoutine/[id]",
      params: { id: id },
    });
  };

  return (
    <View
      style={[
        globalStyles.card,
        {
          marginVertical: 6,
          padding: 16,
          borderRadius: 16,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.primary + "25",
        },
      ]}
    >
      {/* Fila Superior: Título y Botones de Acción */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 10,
        }}
      >
        <TouchableOpacity style={{ flex: 1, paddingRight: 10 }} onPress={handlePlay}>
          <Text style={[globalStyles.cardTitle, { fontSize: 20, fontWeight: "bold" }]}>
            {name}
          </Text>
          {category ? (
            <Text style={{ fontSize: 11, fontWeight: "600", color: colors.primary, marginTop: 2 }}>
              {category.toUpperCase()}
            </Text>
          ) : null}
        </TouchableOpacity>

        {/* Botones de Acción Ordenados */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TouchableOpacity
            onPress={handleEdit}
            style={[
              styles.iconBtn,
              { backgroundColor: colors.primary + "18" },
            ]}
          >
            <Ionicons name="create-outline" size={20} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowConfirmDelete(true);
            }}
            style={[
              styles.iconBtn,
              { backgroundColor: colors.delete + "18" },
            ]}
          >
            <Ionicons name="trash-outline" size={20} color={colors.delete} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Info: Ejercicios, Tiempo y Series */}
      <Text style={[globalStyles.cardText, { fontSize: 13, marginBottom: 12, color: colors.textSecondary }]}>
        {exercises.length} Ejercicios • {totalSeries} Series • ~{estimatedTime} min
      </Text>

      {/* Etiquetas de Grupos Musculares y Botón Iniciar */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, flex: 1, paddingRight: 10 }}>
          {uniqueMuscles.map((musculo, index) => (
            <View
              key={index}
              style={{
                backgroundColor: colors.background,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.primary + "40",
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: "600", color: colors.text }}>
                {musculo.charAt(0).toUpperCase() + musculo.slice(1)}
              </Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          onPress={handlePlay}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: colors.primary,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 12,
          }}
        >
          <Ionicons name="play" size={18} color={colors.background} />
          <Text style={{ color: colors.background, fontWeight: "bold", fontSize: 13 }}>
            Iniciar
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modal de Confirmacion con estilo Dark/Light */}
      <ThemeConfirmModal
        visible={showConfirmDelete}
        title="Eliminar Rutina"
        message={`¿Estás seguro de eliminar "${name}" del catálogo?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDestructive={true}
        onConfirm={confirmDeleteRoutine}
        onCancel={() => setShowConfirmDelete(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
});
