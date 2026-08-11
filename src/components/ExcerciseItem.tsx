import { useTheme } from "@/context/ThemeContext";
import { getGlobalStyles } from "@/styles/global";
import { getExerciseImage } from "@/utils/imageMap";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type ExerciseType = {
  id: number;
  nombre: string;
  musculo: string;
  objetivo: string;
  equipamiento: string;
  urlimage?: string;
  isCustom?: boolean;
  series?: number;
  reps?: number;
  peso?: number;
};

type ExcerciseItemProps = {
  excerciseInfo: ExerciseType;
  onCheck: () => void;
  isCheckedFather: boolean;
};

export default function ExcerciseItem({
  excerciseInfo,
  onCheck,
  isCheckedFather,
}: ExcerciseItemProps) {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const router = useRouter();

  const handleGoToDetails = () => {
    router.push(`/exercises/DetailsExercise/${excerciseInfo.id}` as any);
  };

  return (
    <View
      style={[
        globalStyles.card,
        {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: isCheckedFather
            ? colors.primary + "22"
            : colors.surface,
          width: "100%",
          paddingRight: 10,
        },
      ]}
    >
      {/* Área Principal: Título, Imagen e Info (Navega a Detalles del Ejercicio) */}
      <TouchableOpacity
        onPress={handleGoToDetails}
        style={{ flexDirection: "row", gap: 15, flex: 1, alignItems: "center" }}
        activeOpacity={0.7}
      >
        <Image
          source={getExerciseImage(excerciseInfo.id, excerciseInfo.urlimage)}
          style={{ width: 56, height: 56, borderRadius: 10 }}
        />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={[globalStyles.cardTitle, { fontSize: 15, marginBottom: 2 }]}>
              {excerciseInfo.nombre}
            </Text>
            {excerciseInfo.isCustom && (
              <View
                style={{
                  backgroundColor: colors.primary,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 6,
                }}
              >
                <Text style={{ fontSize: 9, fontWeight: "bold", color: colors.background }}>
                  CUSTOM
                </Text>
              </View>
            )}
          </View>
          <Text style={[globalStyles.cardText, { fontSize: 12 }]}>
            {excerciseInfo.musculo} • {excerciseInfo.equipamiento}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Botón de Agregar / Check a la Rutina */}
      <TouchableOpacity
        onPress={onCheck}
        style={styles.addButton}
        activeOpacity={0.6}
      >
        <Ionicons
          name={isCheckedFather ? "checkmark-circle" : "add-circle-outline"}
          size={32}
          color={isCheckedFather ? colors.primary : colors.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  addButton: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
});
