import { useTheme } from "@/context/ThemeContext";
import { addExcercise } from "@/store/excercise";
import { getGlobalStyles } from "@/styles/global";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function AddExcerciseScreen() {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  const route = useRouter();
  const [name, setName] = useState("");
  const [series, setSeries] = useState("");
  const [reps, setReps] = useState("");
  const [kg, setKg] = useState("");

  const handleAddExcercise = async () => {
    await addExcercise({
      name,
      series: parseInt(series),
      reps: parseInt(reps),
      kg: parseInt(kg),
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    route.dismissAll();
  };

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Add Excercise</Text>

      <TextInput
        style={globalStyles.input}
        placeholder="Excercise name"
        placeholderTextColor={colors.textSecondary}
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={globalStyles.input}
        placeholder="Series"
        placeholderTextColor={colors.textSecondary}
        keyboardType="numeric"
        value={series}
        onChangeText={setSeries}
      />

      <View style={styles.row}>
        <TextInput
          style={[globalStyles.input, styles.rowInput]}
          placeholder="Reps"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={reps}
          onChangeText={setReps}
        />
        <TextInput
          style={[globalStyles.input, styles.rowInput]}
          placeholder="Weight (kg)"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={kg}
          onChangeText={setKg}
        />
      </View>

      <TouchableOpacity
        style={globalStyles.button}
        onPress={handleAddExcercise}
      >
        <Text style={globalStyles.buttonText}>Add Excercise</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 10,
  },
  rowInput: {
    flex: 1,
    width: 50,
  },
});
