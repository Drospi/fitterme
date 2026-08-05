import { useTheme } from "@/context/ThemeContext";
import { getGlobalStyles } from "@/styles/global";
import { getExerciseImage } from "@/utils/imageMap";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type ExerciseType = {
  id: number;
  nombre: string;
  musculo: string;
  objetivo: string;
  equipamiento: string;
  urlimage?: string;
  series?: number;
  reps?: number;
  peso?: number;
};

type ExcerciseItemProps = {
  excerciseInfo: ExerciseType;
  onCheck: () => void;
  isCheckedFather: boolean;
};

export default function ExcerciseItem({
  excerciseInfo,
  onCheck,
  isCheckedFather,
}: ExcerciseItemProps) {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  return (
    <TouchableOpacity
      style={[
        globalStyles.card,
        {
          flexDirection: "row",
          justifyContent: "space-between",
          backgroundColor: isCheckedFather
            ? colors.primary + 33
            : colors.surface,
          width: "100%",
        },
      ]}
      onPress={onCheck}
    >
      <View style={{ flexDirection: "row", gap: 20 }}>
        <Image
          source={getExerciseImage(excerciseInfo.id)}
          style={{ width: 60, height: 60, borderRadius: 10 }}
        />
        <View>
          <Text style={globalStyles.cardTitle}>{excerciseInfo.nombre}</Text>
          <Text style={globalStyles.cardText}>
            {excerciseInfo.musculo} • {excerciseInfo.equipamiento}
          </Text>
        </View>
      </View>
      <View style={styles.colCheck}></View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  colCheck: {
    alignItems: "center",
    justifyContent: "center",
  },
});
