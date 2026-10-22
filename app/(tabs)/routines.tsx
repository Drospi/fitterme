import AIRoutineGeneratorModal from "@/components/AIRoutineGeneratorModal";
import RoutineItem from "@/components/RoutineItem";
import { useTheme } from "@/context/ThemeContext";
import { isAIConfigured } from "@/store/aiConfig";
import { clearAllRoutines, getRoutines, Routine } from "@/store/routines";
import { getGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Link, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

export default function AllRoutinesScreen() {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const [Routines, setRoutines] = useState<Routine[]>([]);
  const [isAIGeneratorVisible, setIsAIGeneratorVisible] = useState(false);
  const [isAIActive, setIsAIActive] = useState(false);

  const loadRoutines = async () => {
    const data = await getRoutines();
    setRoutines(data);
    const aiStatus = await isAIConfigured();
    setIsAIActive(aiStatus);
  };

  const handleClearAll = async () => {
    Alert.alert(
      "Reiniciar Rutinas",
      "¿Estás seguro de eliminar todas las rutinas registradas?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Borrar Todas",
          style: "destructive",
          onPress: async () => {
            await clearAllRoutines();
            await loadRoutines();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Toast.show({
              type: "success",
              text1: "Rutinas Reiniciadas",
              text2: "Todas las rutinas han sido eliminadas.",
            });
          },
        },
      ],
    );
  };

  useFocusEffect(
    useCallback(() => {
      loadRoutines();
    }, []),
  );

  return (
    <ScrollView style={globalStyles.container}>
      <View style={globalStyles.header}>
        <Text style={globalStyles.title}>Mis Rutinas</Text>
        <TouchableOpacity onPress={handleClearAll}>
          <Text style={styles.clearButton}>Reiniciar</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: "column", gap: 10, marginTop: 15 }}>
        {/* Botón Destacado: Generar Rutina con IA (Visible solo si la API de IA está configurada) */}
        {isAIActive && (
          <TouchableOpacity
            style={StyleSheet.flatten([
              globalStyles.button,
              {
                marginTop: 0,
                backgroundColor: colors.surface,
                borderColor: colors.primary,
                borderWidth: 1.5,
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
              },
            ])}
            onPress={() => setIsAIGeneratorVisible(true)}
          >
            <Ionicons name="sparkles" size={20} color={colors.primary} />
            <Text style={[globalStyles.buttonText, { color: colors.primary }]}>
              Generar Rutina con IA (Sobrecarga Progresiva)
            </Text>
          </TouchableOpacity>
        )}

        <Link href={"/routines/PlayFreeRoutine" as any} push asChild>
          <TouchableOpacity
            style={StyleSheet.flatten([
              globalStyles.button,
              {
                marginTop: 0,
                backgroundColor: colors.primary,
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
              },
            ])}
          >
            <Ionicons name="flash" size={20} color={colors.background} />
            <Text style={globalStyles.buttonText}>
              Iniciar Entrenamiento Libre
            </Text>
          </TouchableOpacity>
        </Link>

        <Link href="/routines/CreateRoutineScreen" push asChild>
          <TouchableOpacity
            style={StyleSheet.flatten([
              globalStyles.button,
              {
                marginTop: 0,
                backgroundColor: colors.surface,
                borderColor: colors.textSecondary,
                borderWidth: 1,
              },
            ])}
          >
            <Text style={[globalStyles.buttonText, { color: colors.text }]}>
              + Crear Rutina Predefinida
            </Text>
          </TouchableOpacity>
        </Link>
      </View>

      <View style={{ marginTop: 30, marginBottom: 80 }}>
        {Routines.length === 0 ? (
          <View
            style={[
              globalStyles.card,
              { alignItems: "center", paddingVertical: 20 },
            ]}
          >
            <Ionicons
              name="barbell-outline"
              size={40}
              color={colors.textSecondary}
            />
            <Text style={[globalStyles.cardText, { marginTop: 8 }]}>
              No tienes rutinas creadas todavía.
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: colors.textSecondary,
                textAlign: "center",
                marginTop: 4,
              }}
            >
              Usa el generador IA para crear entrenamientos optimizados basados
              en tus músculos e historial de récords.
            </Text>
          </View>
        ) : (
          Routines.map((Routine) => (
            <RoutineItem
              key={Routine.id}
              id={Routine.id}
              name={Routine.name}
              exercises={Routine.exercises}
              category={Routine.category}
              onDelete={loadRoutines}
            />
          ))
        )}
      </View>

      {/* Modal del Generador de Rutinas con IA */}
      <AIRoutineGeneratorModal
        visible={isAIGeneratorVisible}
        onClose={() => setIsAIGeneratorVisible(false)}
        onRoutineGenerated={loadRoutines}
      />
    </ScrollView>
  );
}

const styles = {
  clearButton: {
    color: "red",
    fontSize: 16,
  },
};
