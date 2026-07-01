import RoutineItem from "@/components/RoutineItem";
import { useTheme } from "@/context/ThemeContext";
import { clearAllRoutines, getRoutines, Routine } from "@/store/routines";
import { getGlobalStyles } from "@/styles/global";
import { Link, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
const { colors } = useTheme();
const globalStyles = getGlobalStyles(colors);

export default function AllRoutinesScreen() {
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
        <Text style={globalStyles.title}>All Routines</Text>
        <TouchableOpacity onPress={handleClearAll}>
          <Text style={styles.clearButton}>Clear All</Text>
        </TouchableOpacity>
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
              series={Routine.series}
              reps={Routine.reps}
              kg={Routine.kg}
              onDelete={loadRoutines}
            />
          ))
        )}
      </View>
      <Link href="/routines/add" push asChild>
        <TouchableOpacity style={globalStyles.button}>
          <Text style={globalStyles.buttonText}>Add Routine</Text>
        </TouchableOpacity>
      </Link>
    </ScrollView>
  );
}

const styles = {
  clearButton: {
    color: "red",
    fontSize: 16,
  },
};
