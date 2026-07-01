import SettingCard from "@/components/SettingCard";
import { useTheme } from "@/context/ThemeContext";
import { getMeasures } from "@/store/measures";
import { getGlobalStyles } from "@/styles/global";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function SettingsScreen() {
  const { colors, isDark } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const [sexo, setSexo] = useState("masculino");

  const loadMeasures = async () => {
    const data = await getMeasures();
    setSexo(data[0]?.sexo || "ninguno");
  };

  useFocusEffect(
    useCallback(() => {
      loadMeasures();
    }, []),
  );

  return (
    <ScrollView style={globalStyles.container}>
      <View style={globalStyles.header}>
        <Text style={globalStyles.title}>Settings</Text>
      </View>
      <ScrollView
        style={globalStyles.container}
        contentContainerStyle={{ padding: 20 }}
      >
        <View style={styles.section}>
          <Text style={[globalStyles.text, { marginBottom: 10, left: -20 }]}>
            Appearance
          </Text>
          <SettingCard
            link="/settings/theme"
            title="Theme"
            value={isDark ? "Oscuro" : "Claro"}
          />
        </View>

        <View style={styles.section}>
          <Text style={[globalStyles.text, { marginBottom: 10, left: -20 }]}>
            Temporizador
          </Text>
          <SettingCard
            title="Valor del Aumento"
            link={"/settings/timer"}
            value="30 segundos"
          />

          <SettingCard title="Valor del Aumento" value="30 segundos" />

          <SettingCard title="Valor del Aumento" value="30 segundos" />
        </View>

        <View style={styles.section}>
          <Text style={[globalStyles.text, { marginBottom: 10, left: -20 }]}>
            Appearance
          </Text>

          <SettingCard title="Valor del Aumento" value="30 segundos" />
        </View>
        <View style={styles.section}>
          <Text style={[globalStyles.text, { marginBottom: 10, left: -20 }]}>
            Genero
          </Text>

          <SettingCard title="Sexo" value={sexo} link="/settings/genre" />
        </View>
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  selection: {
    fontSize: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    marginTop: 8,
  },

  section: {
    marginBottom: 24,
  },
});
