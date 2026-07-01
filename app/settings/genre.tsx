import { addMeasure, getMeasures } from "@/store/measures";
import { colors, globalStyles } from "@/styles/global";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function GenreScreen() {
  const { title, value } = useLocalSearchParams();
  const [genre, setGenre] = useState<string>((value as string) || "Masculino");
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    const allMeasures = await getMeasures();
    const currentMeasure = allMeasures[0];

    await addMeasure({
      ...currentMeasure,
      sexo: genre,
    });
    router.back();
  };

  return (
    <ScrollView style={globalStyles.container}>
      <View style={globalStyles.header}>
        <Text style={globalStyles.title}>{title || "Configuración"}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>Género seleccionado:</Text>

        {/* Botón Principal (El que siempre se ve) */}
        <TouchableOpacity
          style={styles.option}
          onPress={() => setExpanded(!expanded)}
        >
          <Text style={styles.textOption}>{genre}</Text>
        </TouchableOpacity>

        {/* Opciones desplegables */}
        {expanded && (
          <View style={styles.dropdown}>
            {["Masculino", "Femenino"].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.option,
                  genre === option && styles.selectedOption,
                ]}
                onPress={() => {
                  setGenre(option);
                  setExpanded(false); // Cierra al seleccionar
                }}
              >
                <Text
                  style={
                    genre === option ? styles.textSelected : styles.textOption
                  }
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[globalStyles.button, { marginTop: 30 }]}
          onPress={handleSave}
        >
          <Text style={globalStyles.buttonText}>Guardar Cambios</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20 },
  label: { fontSize: 16, color: colors.textSecondary, marginBottom: 10 },
  option: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: colors.surface,
    marginVertical: 5,
  },
  dropdown: {
    marginTop: 5,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 5,
  },
  selectedOption: { backgroundColor: colors.primary || "#3498db" },
  textOption: { color: colors.textSecondary, fontSize: 16 },
  textSelected: { color: colors.text, fontWeight: "bold" },
});
