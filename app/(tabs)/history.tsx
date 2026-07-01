import { useTheme } from "@/context/ThemeContext";
import { getGlobalStyles } from "@/styles/global";
import React from "react";
import { ScrollView, Text, View } from "react-native";
const { colors } = useTheme();
const globalStyles = getGlobalStyles(colors);

export default function HistoryScreen() {
  return (
    <ScrollView style={globalStyles.container}>
      <View style={globalStyles.header}>
        <Text>All History</Text>
      </View>
    </ScrollView>
  );
}
