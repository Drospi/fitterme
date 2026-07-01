import { useTheme } from "@/context/ThemeContext";
import { addMeasure, getMeasures } from "@/store/measures";
import { getGlobalStyles } from "@/styles/global";
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
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

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
        <Text style={globalStyles.text}>Género seleccionado:</Text>

        {/* Botón Principal (El que siempre se ve) */}
        <TouchableOpacity
          style={styles.option}
          onPress={() => setExpanded(!expanded)}
        >
          <Text style={globalStyles.text}>{genre}</Text>
        </TouchableOpacity>

        {/* Opciones desplegables */}
        {expanded && (
          <View style={styles.dropdown}>
            {["Masculino", "Femenino"].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.option,
                  genre === option && { backgroundColor: colors.primary },
                ]}
                onPress={() => {
                  setGenre(option);
                  setExpanded(false); // Cierra al seleccionar
                }}
              >
                <Text
                  style={
                    genre === option
                      ? globalStyles.textPrimary
                      : globalStyles.text
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

  option: {
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
  },
  dropdown: {
    marginTop: 5,
    borderRadius: 10,
    padding: 5,
  },
});
