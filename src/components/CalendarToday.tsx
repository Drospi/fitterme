import { useTheme } from "@/context/ThemeContext";
import { getGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type Props = {
  onPress?: () => void;
};

export default function CalendarToday({ onPress }: Props) {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  const currentDate = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        globalStyles.card,
        {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingVertical: 14,
        },
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Ionicons name="calendar" size={24} color={colors.primary} />
        <Text style={[globalStyles.text, { fontSize: 16, textTransform: "capitalize", fontWeight: "bold" }]}>
          {currentDate}
        </Text>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "bold" }}>
          Ver Calendario
        </Text>
        <Ionicons name="chevron-forward" size={18} color={colors.primary} />
      </View>
    </TouchableOpacity>
  );
}
