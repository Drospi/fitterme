import { addRoutine } from "@/store/routines";
import { colors, globalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
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

export default function AddRoutineScreen() {
  const router = useRouter();
  const route = useRouter();
  const [name, setName] = useState("");
  const [series, setSeries] = useState("");
  const [reps, setReps] = useState("");
  const [kg, setKg] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const handleAddRoutine = async () => {
    await addRoutine({
      name,
      series: parseInt(series) || 0,
      reps: parseInt(reps) || 0,
      kg: parseInt(kg) || 0,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    route.dismissAll();
  };

  const handleTerminar = () => {
    // Lógica extra aquí (guardar, limpiar, etc.)
    router.push("/routines");
  };

  return (
    <View style={globalStyles.container}>
      <View style={globalStyles.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Ionicons
            name="arrow-back"
            onPress={() => route.back()}
            size={24}
            color={colors.text}
          />
          <Ionicons
            name="timer-outline"
            onPress={() => route.push("/settings/timer")}
            size={24}
            color={colors.text}
          />
        </View>
        <Text style={styles.timer}>05:00</Text>
        <TouchableOpacity onPress={handleTerminar}>
          <Text style={styles.terminar}>Terminar</Text>
        </TouchableOpacity>
      </View>
      <View>
        {isEditing ? (
          <TextInput
            style={globalStyles.title}
            value={name}
            onChangeText={setName}
            onBlur={() => {
              setName(name);
              setIsEditing(false);
            }}
            autoFocus={true}
          />
        ) : (
          <TouchableOpacity onPress={() => setIsEditing(true)}>
            <Text style={globalStyles.title}>{name || "Add Routine"}</Text>
          </TouchableOpacity>
        )}
      </View>

      <TextInput
        style={styles.input}
        placeholder="Routine name"
        placeholderTextColor={colors.textSecondary}
        value={name}
        onChangeText={setName}
      />

      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.rowInput]}
          placeholder="Series (s)"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={series}
          onChangeText={setSeries}
        />
        <TextInput
          style={[styles.input, styles.rowInput]}
          placeholder="Reps (r)"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={reps}
          onChangeText={setReps}
        />
        <TextInput
          style={[styles.input, styles.rowInput]}
          placeholder="Weight (kg)"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={kg}
          onChangeText={setKg}
        />
      </View>

      <TouchableOpacity style={globalStyles.button} onPress={handleAddRoutine}>
        <Text style={globalStyles.buttonText}>Add Routine</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surface,
    color: colors.text,
    padding: 16,
    borderRadius: 10,
    fontSize: 16,
    marginTop: 16,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  rowInput: {
    flex: 1,
    width: 50,
  },
  timer: {
    color: colors.textSecondary,
    fontSize: 16,
    marginLeft: 10,
  },
  terminar: {
    color: colors.primary,
    fontSize: 16,
    marginLeft: 10,
  },
});
