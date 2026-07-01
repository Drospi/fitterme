import { useTheme } from "@/context/ThemeContext";
import { getGlobalStyles } from "@/styles/global";
import { Text, View } from "react-native";

export default function HomeHeader() {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <View style={globalStyles.header}>
      <Text style={globalStyles.text}>{currentDate}</Text>
    </View>
  );
}
