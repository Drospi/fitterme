import { useTheme } from "@/context/ThemeContext";
import { getGlobalStyles } from "@/styles/global";
import { Checkbox } from "expo-checkbox";
import { useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type SerieItemProps = {
  id: string;
  series: number;
  reps: number;
  kg: number;
  isActive: boolean;
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

  const { width: SCREEN_WIDTH } = Dimensions.get("window");

  const [isEditingKg, setIsEditingKg] = useState(false);
  const [isEditingReps, setIsEditingReps] = useState(false);

  const containerBackgroundColor = isActive ? colors.success : "transparent";

  return (
    <View
      style={{
        backgroundColor: containerBackgroundColor,
        padding: 5,
        opacity: isActive ? 0.7 : 1,
        left: -20,
        width: SCREEN_WIDTH,
      }}
    >
      <View style={styles.row}>
        <Text
          style={[
            globalStyles.cardText,
            styles.colSerie,
            isActive && { color: colors.textWhite },
          ]}
        >
          {series}
        </Text>
        <Text
          style={[
            globalStyles.cardText,
            styles.colAnterior,
            isActive && { color: colors.textWhite },
          ]}
        >
          {reps}reps x {kg}kg{" "}
        </Text>

        {isActive ? (
          <Text
            style={[
              globalStyles.cardText,
              {
                textAlign: "center",
                color: colors.textWhite,
              },
            ]}
          >
            {kg}
          </Text>
        ) : isEditingKg ? (
          <TextInput
            style={[
              globalStyles.cardText,
              styles.colInput,
              { borderWidth: 1, borderColor: colors.primary },
            ]}
            value={kg.toString()}
            onChangeText={(text) =>
              onChange({ reps, kg: parseInt(text) || 0, isActive })
            }
            keyboardType="numeric"
            onBlur={() => setIsEditingKg(false)}
            autoFocus
          />
        ) : (
          <TouchableOpacity
            onPress={() => setIsEditingKg(true)}
            style={styles.colInput}
          >
            <Text style={[globalStyles.cardText, { textAlign: "center" }]}>
              {kg}
            </Text>
          </TouchableOpacity>
        )}

        {isActive ? (
          <Text
            style={[
              globalStyles.cardText,
              { textAlign: "center", color: colors.textWhite },
            ]}
          >
            {reps}
          </Text>
        ) : isEditingReps ? (
          <TextInput
            style={[
              globalStyles.cardText,
              styles.colInput,
              { borderWidth: 1, borderColor: colors.primary },
            ]}
            value={reps.toString()}
            onChangeText={(text) =>
              onChange({ reps: parseInt(text) || 0, kg, isActive })
            }
            keyboardType="numeric"
            onBlur={() => setIsEditingReps(false)}
            autoFocus
            editable={!isActive}
          />
        ) : (
          <TouchableOpacity onPress={() => setIsEditingReps(true)}>
            <Text style={[globalStyles.cardText, { textAlign: "center" }]}>
              {reps}
            </Text>
          </TouchableOpacity>
        )}

        <Checkbox
          style={styles.colCheck}
          value={isActive}
          color={isActive ? colors.success : colors.textSecondary}
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
    paddingVertical: 10,
  },
  colSerie: { width: 40, textAlign: "center" },
  colAnterior: { width: 80, textAlign: "center" },
  colInput: {
    width: 60,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 0,
    paddingBottom: 0,
    textAlign: "center",
    textAlignVertical: "center",
  },
  colCheck: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
