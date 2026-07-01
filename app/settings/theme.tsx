import { useTheme } from "@/context/ThemeContext";
import { globalStyles } from "@/styles/global";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
type Props = {};

export default function ThemeScreen() {
  const { colors, toggleTheme, isDark } = useTheme();

  return (
    <ScrollView
      style={[globalStyles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <View style={globalStyles.header}>
        <Text style={[globalStyles.title, { color: colors.text }]}>Theme</Text>
      </View>

      <View style={{ marginTop: 40, alignItems: "center" }}>
        <Text style={{ color: colors.text, fontSize: 18, marginBottom: 20 }}>
          Modo actual: {isDark ? "Oscuro" : "Claro"}
        </Text>

        <TouchableOpacity
          onPress={toggleTheme}
          style={{
            backgroundColor: colors.primary,
            paddingVertical: 15,
            paddingHorizontal: 40,
            borderRadius: 25,
            alignItems: "center",
          }}
        >
          <Text style={{ fontWeight: "bold", color: "#000" }}>
            Cambiar a {isDark ? "Claro" : "Oscuro"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
