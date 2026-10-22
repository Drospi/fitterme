import { useTheme } from "@/context/ThemeContext";
import { getExerciseCategory } from "@/store/excercise";
import { getGlobalStyles } from "@/styles/global";
import { getExerciseImage } from "@/utils/imageMap";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
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

  const isNeonLime =
    colors.primary?.toLowerCase().includes("c8ff") ||
    colors.primary?.toLowerCase() === "#c8ff00" ||
    colors.primary?.toLowerCase() === "#52b788";
  const onPrimaryColor = isNeonLime ? "#000000" : "#ffffff";

  const [exercises, setExercises] = useState<ExerciseList>(
    (data.exercises || []).map((ex: Exercise) => ({
      ...ex,
      series: ex.series ?? 4,
      reps: ex.reps ?? 10,
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
    updateData({ exercises: updated });
  };

  const moveExercise = (index: number, direction: "up" | "down") => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= exercises.length) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = [...exercises];
    [updated[index], updated[targetIndex]] = [
      updated[targetIndex],
      updated[index],
    ];

    setExercises(updated);
    updateData({ exercises: updated });
  };

  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateData({ exercises });
    saveRoutine();
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
      {/* Header Poster */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4, marginBottom: 16 }}>
        <TouchableOpacity
          onPress={back}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.surface,
            justifyContent: "center",
            alignItems: "center",
            borderWidth: 1,
            borderColor: colors.cardBorder || "rgba(255,255,255,0.1)",
          }}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>

        <View
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 6,
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: "900", color: onPrimaryColor, letterSpacing: 0.8 }}>
            PASO 03 / 03 ▶ PARÁMETROS
          </Text>
        </View>
      </View>

      <Text
        style={{
          fontSize: 26,
          fontWeight: "900",
          color: colors.text,
          letterSpacing: 0.5,
          textTransform: "uppercase",
        }}
      >
        AJUSTA TUS SERIES & CARGAS
      </Text>
      <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4, marginBottom: 20 }}>
        Personaliza los números base para cada ejercicio. Podrás cambiarlos en vivo al entrenar.
      </Text>

      {/* Lista de Ejercicios */}
      <View style={{ gap: 14, marginBottom: 30 }}>
        {exercises.map((exercise: Exercise, index: number) => {
          const cat = getExerciseCategory(exercise);
          return (
            <View
              key={exercise.id}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 18,
                padding: 16,
                borderWidth: 1.5,
                borderColor: colors.cardBorder || "rgba(255,255,255,0.08)",
              }}
            >
              {/* Top Row: Thumbnail + Info + Reorder arrows */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
                  <Image
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 12,
                      backgroundColor: colors.background,
                      borderWidth: 1,
                      borderColor: colors.cardBorder || "rgba(255,255,255,0.1)",
                    }}
                    source={getExerciseImage(exercise.id, exercise.urlimage)}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "900",
                        color: colors.text,
                      }}
                      numberOfLines={1}
                    >
                      {exercise.nombre}
                    </Text>
                    <View style={{ flexDirection: "row", gap: 6, marginTop: 3 }}>
                      <View
                        style={{
                          backgroundColor: colors.primary + "20",
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 4,
                        }}
                      >
                        <Text style={{ fontSize: 9, fontWeight: "900", color: colors.primary }}>
                          {cat.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: "600" }}>
                        {exercise.musculo}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Controles de orden */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  {index > 0 && (
                    <TouchableOpacity
                      onPress={() => moveExercise(index, "up")}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: colors.background,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Ionicons name="chevron-up" size={18} color={colors.primary} />
                    </TouchableOpacity>
                  )}
                  {index < exercises.length - 1 && (
                    <TouchableOpacity
                      onPress={() => moveExercise(index, "down")}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: colors.background,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Ionicons name="chevron-down" size={18} color={colors.primary} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Bottom Row: Inputs Series, Reps, Peso */}
              <View style={{ flexDirection: "row", gap: 10 }}>
                {/* Series */}
                <View
                  style={{
                    flex: 1,
                    backgroundColor: colors.background,
                    padding: 10,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.cardBorder || "rgba(255,255,255,0.06)",
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: "900", color: colors.textSecondary, letterSpacing: 0.8, marginBottom: 4 }}>
                    SERIES
                  </Text>
                  <TextInput
                    placeholder="4"
                    placeholderTextColor={colors.textSecondary + "60"}
                    keyboardType="numeric"
                    value={exercises[index].series ? exercises[index].series!.toString() : ""}
                    onChangeText={(val) => handleInputChange(index, "series", val)}
                    style={{
                      fontSize: 18,
                      fontWeight: "900",
                      color: colors.primary,
                      padding: 0,
                    }}
                  />
                </View>

                {/* Reps */}
                <View
                  style={{
                    flex: 1,
                    backgroundColor: colors.background,
                    padding: 10,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.cardBorder || "rgba(255,255,255,0.06)",
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: "900", color: colors.textSecondary, letterSpacing: 0.8, marginBottom: 4 }}>
                    REPETICIONES
                  </Text>
                  <TextInput
                    placeholder="10"
                    placeholderTextColor={colors.textSecondary + "60"}
                    keyboardType="numeric"
                    value={exercises[index].reps ? exercises[index].reps!.toString() : ""}
                    onChangeText={(val) => handleInputChange(index, "reps", val)}
                    style={{
                      fontSize: 18,
                      fontWeight: "900",
                      color: colors.text,
                      padding: 0,
                    }}
                  />
                </View>

                {/* Carga Base */}
                <View
                  style={{
                    flex: 1.2,
                    backgroundColor: colors.background,
                    padding: 10,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.cardBorder || "rgba(255,255,255,0.06)",
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: "900", color: colors.textSecondary, letterSpacing: 0.8, marginBottom: 4 }}>
                    CARGA (BASE)
                  </Text>
                  <TextInput
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary + "60"}
                    keyboardType="numeric"
                    value={exercises[index].peso !== undefined ? exercises[index].peso!.toString() : "0"}
                    onChangeText={(val) => handleInputChange(index, "peso", val)}
                    style={{
                      fontSize: 18,
                      fontWeight: "900",
                      color: colors.text,
                      padding: 0,
                    }}
                  />
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* Botón Guardar Rutina estilo Póster */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleSave}
        style={{
          backgroundColor: colors.primary,
          borderRadius: 16,
          paddingVertical: 16,
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          gap: 8,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.45,
          shadowRadius: 10,
          elevation: 5,
        }}
      >
        <Text style={{ color: onPrimaryColor, fontWeight: "900", fontSize: 15, letterSpacing: 0.5 }}>
          GUARDAR RUTINA EN EL SISTEMA
        </Text>
        <Ionicons name="checkmark-done" size={20} color={onPrimaryColor} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({});
