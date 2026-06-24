import RoutineItem from "@/components/RoutineItem";
import { clearAllRoutines, getRoutines, Routine } from "@/store/routines";
import { globalStyles } from "@/styles/global";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

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
              fat={Routine.fat}
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
