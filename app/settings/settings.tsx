import SettingCard from "@/components/SettingCard";
import { colors, globalStyles } from "@/styles/global";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function SettingsScreen() {
  return (
    <ScrollView style={globalStyles.container}>
      <View style={globalStyles.header}>
        <Text style={globalStyles.title}>Settings</Text>
      </View>
      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.text}>Appearance</Text>
          <SettingCard title="Theme" value="Light" />
        </View>

        <View style={styles.section}>
          <Text style={styles.text}>Temporizador</Text>
          <SettingCard title="Valor del Aumento" value="30 segundos" />

          <SettingCard title="Valor del Aumento" value="30 segundos" />

          <SettingCard title="Valor del Aumento" value="30 segundos" />
        </View>

        <View style={styles.section}>
          <Text style={styles.text}>Appearance</Text>

          <SettingCard title="Valor del Aumento" value="30 segundos" />
        </View>
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: globalStyles.container.backgroundColor,
  },
  text: {
    fontSize: 16,
    marginBottom: 8,
    color: colors.text,
    left: -8,
  },
  selection: {
    fontSize: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    marginTop: 8,
  },
  textSelection: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
});
