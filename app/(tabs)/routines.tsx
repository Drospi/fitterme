import RoutineItem from "@/components/RoutineItem";
import { useTheme } from "@/context/ThemeContext";
import { clearAllRoutines, getRoutines, Routine } from "@/store/routines";
import { getGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { Link, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function AllRoutinesScreen() {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const [Routines, setRoutines] = useState<Routine[]>([]);

  const loadRoutines = async () => {
    const data = await getRoutines();
    setRoutines(data);
  };

  const handleClearAll = async () => {
    await clearAllRoutines();
    loadRoutines();
  };

  useFocusEffect(
    useCallback(() => {
      loadRoutines();
    }, []),
  );

  return (
    <ScrollView style={globalStyles.container}>
      <View style={globalStyles.header}>
        <Text style={globalStyles.title}>Mis Routines</Text>
        <TouchableOpacity onPress={handleClearAll}>
          <Text style={styles.clearButton}>Clear All</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: "column", gap: 10, marginTop: 15 }}>
        <Link href={"/routines/PlayFreeRoutine" as any} push asChild>
          <TouchableOpacity
            style={StyleSheet.flatten([
              globalStyles.button,
              {
                marginTop: 0,
                backgroundColor: colors.primary,
                flexDirection: "row",
                justifyContent: "center",
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
      <View style={{ marginTop: 30 }}>
        {Routines.length === 0 ? (
          <Text style={globalStyles.empty}>No Routines logged yet.</Text>
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
    </ScrollView>
  );
}

const styles = {
  clearButton: {
    color: "red",
    fontSize: 16,
  },
};
