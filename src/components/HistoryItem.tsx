import { useTheme } from "@/context/ThemeContext";
import { getGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

type HistoryItemProps = {
  dateDay: string;
  date: string;
  kcal: number;
  timeTrains: number;
};

const HistoryItem = ({ dateDay, date, kcal, timeTrains }: HistoryItemProps) => {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  return (
    <View style={[globalStyles.card, { gap: 10 }]}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ fontWeight: "bold", fontSize: 20, color: colors.text }}>
          {dateDay}
        </Text>
        <Text
          style={{ fontWeight: "bold", fontSize: 16, color: colors.secondary }}
        >
          {date}
        </Text>
      </View>
      <View style={{ flexDirection: "row", gap: 20 }}>
        <View style={{ justifyContent: "space-between", gap: 10, flex: 1 }}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Ionicons name="fast-food" size={16} color={colors.primary} />
            <Text style={globalStyles.cardText}>Registro de Comida</Text>
          </View>
          <Text style={globalStyles.cardText}>
            <Text
              style={{ fontWeight: "bold", color: colors.text, fontSize: 36 }}
            >
              {kcal}{" "}
            </Text>{" "}
            kcal
          </Text>
        </View>

        <View style={{ justifyContent: "space-between", gap: 10, flex: 1 }}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Ionicons name="fitness" size={16} color={colors.secondary} />
            <Text style={globalStyles.cardText}>Resumen de Entrenamiento</Text>
          </View>
          <Text style={globalStyles.cardText}>
            <Text
              style={{ fontWeight: "bold", color: colors.text, fontSize: 36 }}
            >
              {timeTrains}{" "}
            </Text>{" "}
            min
          </Text>
        </View>
      </View>
    </View>
  );
};

export default HistoryItem;
