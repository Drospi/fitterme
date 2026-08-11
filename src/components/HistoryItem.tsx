import { useTheme } from "@/context/ThemeContext";
import { toDisplayWeight, WeightUnit } from "@/store/conf";
import { getGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type HistoryItemProps = {
  dateDay: string;
  date: string;
  tonelaje: number;
  timeTrains: number;
  id: string;
  unit?: WeightUnit;
  onDatePress?: () => void;
};

const HistoryItem = ({
  dateDay,
  date,
  tonelaje,
  timeTrains,
  id,
  unit = "kg",
  onDatePress,
}: HistoryItemProps) => {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const router = useRouter();

  const displayVolume = toDisplayWeight(tonelaje, unit);

  return (
    <TouchableOpacity
      onPress={() =>
        router.push({
          pathname: "/routines/DetailsRoutine/[id]",
          params: { id: id },
        })
      }
      style={[globalStyles.card, { gap: 10 }]}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontWeight: "bold", fontSize: 20, color: colors.text, textTransform: "capitalize" }}>
          {dateDay}
        </Text>

        <TouchableOpacity
          onPress={() => {
            if (onDatePress) onDatePress();
          }}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            backgroundColor: colors.surface,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.primary + "40",
          }}
        >
          <Ionicons name="calendar-outline" size={14} color={colors.primary} />
          <Text style={{ fontWeight: "bold", fontSize: 13, color: colors.primary }}>
            {date}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: "row", gap: 20 }}>
        <View style={{ justifyContent: "space-between", gap: 10, flex: 1 }}>
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <Ionicons name="barbell" size={16} color={colors.primary} />
            <Text style={globalStyles.cardText}>Registro de Tonelaje</Text>
          </View>
          <Text style={globalStyles.cardText}>
            <Text
              style={{ fontWeight: "bold", color: colors.text, fontSize: 32 }}
            >
              {displayVolume.toLocaleString()}{" "}
            </Text>{" "}
            {unit}
          </Text>
        </View>

        <View style={{ justifyContent: "space-between", gap: 10, flex: 1 }}>
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <Ionicons name="fitness" size={16} color={colors.secondary} />
            <Text style={globalStyles.cardText}>Resumen Entrenamiento</Text>
          </View>
          <Text style={globalStyles.cardText}>
            <Text
              style={{ fontWeight: "bold", color: colors.text, fontSize: 32 }}
            >
              {timeTrains}{" "}
            </Text>{" "}
            min
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default HistoryItem;
