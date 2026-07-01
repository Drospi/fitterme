import { useTheme } from "@/context/ThemeContext";
import { getGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import React from "react";
import { ScrollView, Text, View } from "react-native";

export default function ProfileScreen() {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  return (
    <ScrollView style={globalStyles.container}>
      <View style={globalStyles.header}>
        <Text style={globalStyles.title}>Profile</Text>
        <Link href="/settings/settings">
          <Ionicons style={globalStyles.title} name="settings" />
        </Link>
      </View>
      <View style={{ marginTop: 30, gap: 20 }}>
        <Link style={globalStyles.title} href="/routines">
          Routine
        </Link>
        <Link style={globalStyles.title} href="/measures/measures">
          Measure
        </Link>
      </View>
    </ScrollView>
  );
}
