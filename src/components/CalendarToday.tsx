import { useTheme } from "@/context/ThemeContext";
import { getGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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
      activeOpacity={0.8}
      onPress={() => {
        Haptics.selectionAsync();
        if (onPress) onPress();
      }}
      style={[
        globalStyles.card,
        {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderWidth: 1,
          borderColor: colors.neutral,
          marginBottom: 0,
        },
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Ionicons name="calendar" size={22} color={colors.primary} />
        <Text style={[globalStyles.text, { fontSize: 15, textTransform: "capitalize", fontWeight: "bold" }]}>
          {currentDate}
        </Text>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <Text style={{ fontSize: 13, color: colors.primary, fontWeight: "bold" }}>
          Ver Calendario
        </Text>
        <Ionicons name="chevron-forward" size={16} color={colors.primary} />
      </View>
    </TouchableOpacity>
  );
}
