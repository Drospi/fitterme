import { useTheme } from "@/context/ThemeContext";
import { getGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import SerieItem from "./SerieItem";

type Serie = {
  id: string;
  series: number;
  reps: number;
  kg: number;
  isActive: boolean;
};

type ExcerciseItemProps = {
  id: string;
  name: string;
  series: Serie[];
  onDelete: () => void;
  // Añadimos esta función para notificar al padre sobre cambios
  onChange: (updatedData: { name: string; series: Serie[] }) => void;
};

export default function ExcerciseItem({
  id,
  name,
  series,
  onDelete,
  onChange,
}: ExcerciseItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  const handleAddSerie = () => {
    const newSerie: Serie = {
      id: Date.now().toString(),
      series: series.length + 1,
      reps: 0,
      kg: 0,
      isActive: false,
    };
    onChange({ name, series: [...series, newSerie] });
  };

  const handleUpdateSerie = (
    serieId: string,
    updatedSerie: { reps: number; kg: number; isActive: boolean },
  ) => {
    const updatedSeriesArray = series.map((s) =>
      s.id === serieId ? { ...s, ...updatedSerie } : s,
    );

    // Notificamos al padre (AddRoutineScreen) que algo cambió en este ejercicio
    onChange({ name, series: updatedSeriesArray });
  };

  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {isEditing ? (
          <TextInput
            style={[globalStyles.title, { flex: 1 }]}
            value={name}
            onChangeText={(newName) => onChange({ name: newName, series })}
            onBlur={() => setIsEditing(false)}
            autoFocus={true}
          />
        ) : (
          <TouchableOpacity onPress={() => setIsEditing(true)}>
            <Text style={globalStyles.title}>
              {name || "Nombre del ejercicio"}
            </Text>
          </TouchableOpacity>
        )}
        <Ionicons
          name="trash-outline"
          size={20}
          color="red"
          onPress={onDelete}
        />
      </View>

      <View style={styles.row}>
        <Text style={[globalStyles.text, styles.colSerie]}>Set</Text>
        <Text style={[globalStyles.text, styles.colAnterior]}>Mejor</Text>
        <Text style={globalStyles.text}>KG</Text>
        <Text style={globalStyles.text}>Reps</Text>
        <Ionicons
          name="checkbox-sharp"
          size={20}
          color={colors.textSecondary}
        />
      </View>

      {series.map((serie) => (
        <SerieItem
          key={serie.id}
          id={serie.id}
          series={serie.series}
          reps={serie.reps}
          kg={serie.kg}
          isActive={serie.isActive}
          onChange={(updatedSerie) => handleUpdateSerie(serie.id, updatedSerie)}
        />
      ))}

      <TouchableOpacity
        style={{ width: "100%", alignItems: "center", marginTop: 10 }}
        onPress={handleAddSerie}
      >
        <Text style={globalStyles.textPrimary}>+ Agregar Serie</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  colSerie: { width: 40, textAlign: "center" },
  colAnterior: { width: 80, textAlign: "center" },

  colCheck: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
