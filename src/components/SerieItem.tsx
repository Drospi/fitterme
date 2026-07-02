import { useTheme } from "@/context/ThemeContext";
import { getGlobalStyles } from "@/styles/global";
import { Checkbox } from "expo-checkbox";
import { StyleSheet, Text, TextInput, View } from "react-native";

type SerieItemProps = {
  id: string; // ID de la serie
  series: number;
  reps: number;
  kg: number;
  isActive: boolean; // Ahora el estado viene de arriba
  // Nueva prop para subir los cambios
  onChange: (updatedSerie: {
    reps: number;
    kg: number;
    isActive: boolean;
  }) => void;
};

export default function SerieItem({
  id,
  series,
  reps,
  kg,
  isActive,
  onChange,
}: SerieItemProps) {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  const containerBackgroundColor = isActive ? colors.success : "transparent";

  return (
    <View style={{ backgroundColor: containerBackgroundColor, padding: 5 }}>
      <View style={styles.row}>
        <Text style={[globalStyles.cardText, styles.colSerie]}>{series}</Text>

        {/* Input KG */}
        <TextInput
          style={[
            globalStyles.input,
            { width: 40, height: 30, textAlign: "center" },
          ]}
          value={kg.toString()}
          onChangeText={(text) =>
            onChange({ reps, kg: parseInt(text) || 0, isActive })
          }
          keyboardType="numeric"
          editable={!isActive}
        />

        {/* Input Reps */}
        <TextInput
          style={[
            globalStyles.input,
            { width: 40, height: 30, textAlign: "center" },
          ]}
          value={reps.toString()}
          onChangeText={(text) =>
            onChange({ reps: parseInt(text) || 0, kg, isActive })
          }
          keyboardType="numeric"
          editable={!isActive}
        />

        <Checkbox
          style={[
            globalStyles.input,
            { width: 30, height: 30, backgroundColor: colors.surface },
          ]}
          value={isActive}
          color={isActive ? colors.primary : colors.success}
          onValueChange={(newValue) =>
            onChange({ reps, kg, isActive: newValue })
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  colSerie: { width: "15%" },
});
