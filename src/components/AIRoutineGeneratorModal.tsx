import { useTheme } from "@/context/ThemeContext";
import {
  AIGeneratedRoutine,
  generateAIRoutine,
  saveAIRoutineToStore,
  TargetGoal,
  TargetMuscle,
} from "@/services/aiRoutineService";
import { getGlobalStyles } from "@/styles/global";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  onRoutineGenerated: () => void;
};

const MUSCLE_OPTIONS: { label: string; value: TargetMuscle }[] = [
  { label: "Pecho", value: "pecho" },
  { label: "Espalda", value: "espalda" },
  { label: "Hombros", value: "hombros" },
  { label: "Bícep", value: "biceps" },
  { label: "Trícep", value: "triceps" },
  { label: "Cuádriceps", value: "cuadriceps" },
  { label: "Glúteos", value: "gluteos" },
  { label: "Gemelos", value: "gemelos" },
  { label: "Antebrazo", value: "antebrazo" },
];

const GOAL_OPTIONS: TargetGoal[] = ["Hipertrofia", "Fuerza", "Resistencia"];

export default function AIRoutineGeneratorModal({
  visible,
  onClose,
  onRoutineGenerated,
}: Props) {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const router = useRouter();

  const [selectedMuscles, setSelectedMuscles] = useState<TargetMuscle[]>(["pecho", "triceps"]);
  const [selectedGoal, setSelectedGoal] = useState<TargetGoal>("Hipertrofia");

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRoutine, setGeneratedRoutine] = useState<AIGeneratedRoutine | null>(null);

  const toggleMuscle = (muscle: TargetMuscle) => {
    setSelectedMuscles((prev) => {
      if (prev.includes(muscle)) {
        if (prev.length === 1) return prev; // Mantener al menos 1 seleccionado
        return prev.filter((m) => m !== muscle);
      } else {
        return [...prev, muscle];
      }
    });
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedRoutine(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Simular tiempo de reasoning de la IA para analizar el historial de récords
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const routine = await generateAIRoutine(selectedMuscles, selectedGoal);
      setGeneratedRoutine(routine);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      alert("Error al generar la rutina con IA. Inténtalo de nuevo.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveOnly = async () => {
    if (!generatedRoutine) return;
    await saveAIRoutineToStore(generatedRoutine);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onRoutineGenerated();
    handleClose();
  };

  const handleSaveAndStart = async () => {
    if (!generatedRoutine) return;
    const saved = await saveAIRoutineToStore(generatedRoutine);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onRoutineGenerated();
    handleClose();
    router.push(`/routines/PlayRoutine/${saved.id}` as any);
  };

  const handleClose = () => {
    setIsGenerating(false);
    setGeneratedRoutine(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="sparkles" size={24} color={colors.primary} />
              <Text style={[globalStyles.title, { fontSize: 20 }]}>Generador de Rutinas con IA</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={{ padding: 4 }}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Paso 1: Configurar Generación */}
            {!isGenerating && !generatedRoutine && (
              <View style={{ paddingVertical: 10 }}>
                <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 12 }}>
                  Selecciona los músculos a entrenar y tu objetivo. La IA analizará tu historial de récords para calcular sobrecarga progresiva.
                </Text>

                {/* Músculos Objetivo */}
                <Text style={{ fontSize: 14, fontWeight: "bold", color: colors.text, marginBottom: 8 }}>
                  1. Músculos a Trabajar
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                  {MUSCLE_OPTIONS.map((item) => {
                    const isSelected = selectedMuscles.includes(item.value);
                    return (
                      <TouchableOpacity
                        key={item.value}
                        onPress={() => toggleMuscle(item.value)}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 10,
                          borderRadius: 20,
                          backgroundColor: isSelected ? colors.primary : colors.surface,
                        }}
                      >
                        <Text
                          style={{
                            fontWeight: "bold",
                            fontSize: 13,
                            color: isSelected ? colors.background : colors.text,
                          }}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Enfoque / Objetivo */}
                <Text style={{ fontSize: 14, fontWeight: "bold", color: colors.text, marginBottom: 8 }}>
                  2. Enfoque del Entrenamiento
                </Text>
                <View style={{ flexDirection: "row", gap: 8, marginBottom: 24 }}>
                  {GOAL_OPTIONS.map((goal) => {
                    const isSelected = selectedGoal === goal;
                    return (
                      <TouchableOpacity
                        key={goal}
                        onPress={() => setSelectedGoal(goal)}
                        style={{
                          flex: 1,
                          paddingVertical: 12,
                          borderRadius: 16,
                          alignItems: "center",
                          backgroundColor: isSelected ? colors.primary : colors.surface,
                        }}
                      >
                        <Text
                          style={{
                            fontWeight: "bold",
                            fontSize: 13,
                            color: isSelected ? colors.background : colors.text,
                          }}
                        >
                          {goal}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Botón de Generar */}
                <TouchableOpacity
                  style={[globalStyles.button, { flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 10 }]}
                  onPress={handleGenerate}
                >
                  <Ionicons name="hardware-chip-outline" size={22} color={colors.background} />
                  <Text style={globalStyles.buttonText}>🤖 Generar Entrenamiento con IA</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Paso 2: Generando */}
            {isGenerating && (
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ marginTop: 16, fontWeight: "bold", color: colors.primary, fontSize: 18 }}>
                  🤖 Analizando historial y calculando sobrecarga...
                </Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 6, textAlign: "center" }}>
                  Buscando ejercicios óptimos y proyectando aumentos de peso progresivos.
                </Text>
              </View>
            )}

            {/* Paso 3: Vista previa de la Rutina IA */}
            {!isGenerating && generatedRoutine && (
              <View style={{ paddingVertical: 10, gap: 14 }}>
                <View
                  style={{
                    backgroundColor: colors.surface,
                    padding: 16,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: colors.primary + "50",
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "bold", color: colors.primary }}>
                    ✨ RUTINA GENERADA POR IA
                  </Text>
                  <Text style={[globalStyles.cardTitle, { fontSize: 20, fontWeight: "bold", marginTop: 2, marginBottom: 4 }]}>
                    {generatedRoutine.name}
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                    {generatedRoutine.exercises.length} Ejercicios seleccionados • Enfoque {generatedRoutine.category}
                  </Text>
                </View>

                {/* Lista de Ejercicios Generados */}
                <Text style={{ fontWeight: "bold", color: colors.text, fontSize: 16 }}>
                  Ejercicios y Objetivos de Carga
                </Text>

                <View style={{ gap: 10 }}>
                  {generatedRoutine.exercises.map((ex, index) => (
                    <View key={ex.id} style={[globalStyles.card, { marginVertical: 0 }]}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <Text style={{ fontWeight: "bold", color: colors.text, fontSize: 16 }}>
                          {index + 1}. {ex.nombre}
                        </Text>
                        <Text style={{ fontWeight: "bold", color: colors.primary, fontSize: 14 }}>
                          {ex.peso} kg
                        </Text>
                      </View>

                      <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
                        {ex.series} series × {ex.reps} reps • {ex.equipamiento}
                      </Text>

                      {/* Nota de sobrecarga o sugerencia IA */}
                      <View
                        style={{
                          marginTop: 8,
                          backgroundColor: colors.background,
                          padding: 8,
                          borderRadius: 8,
                        }}
                      >
                        <Text style={{ fontSize: 11, color: colors.primary, fontWeight: "600" }}>
                          {ex.aiSuggestionNote}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Botones de Acción */}
                <View style={{ gap: 10, marginTop: 10, marginBottom: 20 }}>
                  <TouchableOpacity
                    style={[globalStyles.button, { backgroundColor: colors.primary, flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 0 }]}
                    onPress={handleSaveAndStart}
                  >
                    <Ionicons name="flash" size={20} color={colors.background} />
                    <Text style={globalStyles.buttonText}>⚡ Guardar e Iniciar Entrenamiento</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      globalStyles.card,
                      { flexDirection: "row", justifyContent: "center", gap: 8, alignItems: "center", marginTop: 0 },
                    ]}
                    onPress={handleSaveOnly}
                  >
                    <Ionicons name="bookmark-outline" size={20} color={colors.text} />
                    <Text style={{ fontWeight: "bold", color: colors.text }}>💾 Solo Guardar en Mis Rutinas</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setGeneratedRoutine(null)}
                    style={{ alignItems: "center", paddingVertical: 6 }}
                  >
                    <Text style={{ color: colors.textSecondary, fontSize: 13 }}>⚙️ Cambiar Músculos u Objetivo</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    maxHeight: "88%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
});
