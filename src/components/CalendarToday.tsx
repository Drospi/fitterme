import { useTheme } from "@/context/ThemeContext";
import { getGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

export default function CalendarToday() {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <View style={[globalStyles.card, { flexDirection: "row", gap: 10 }]}>
      <Ionicons name="calendar" size={24} color={colors.secondary} />
      <Text style={globalStyles.text}>{currentDate}</Text>
      <Ionicons name="chevron-down" size={24} color={colors.text} />
    </View>
  );
}
