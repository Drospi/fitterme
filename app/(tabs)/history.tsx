import { useTheme } from "@/context/ThemeContext";
import { getGlobalStyles } from "@/styles/global";
import React from "react";
import { ScrollView, Text, View } from "react-native";

export default function HistoryScreen() {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  return (
    <ScrollView style={globalStyles.container}>
      <View style={globalStyles.header}>
        <Text>All History</Text>
      </View>
    </ScrollView>
  );
}
