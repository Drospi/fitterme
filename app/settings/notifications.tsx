import { useTheme } from "@/context/ThemeContext";
import { getGlobalStyles } from "@/styles/global";
import React from "react";
import { Text, View } from "react-native";
const notificationsScreen = () => {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  return (
    <View>
      <Text>language</Text>
    </View>
  );
};

export default notificationsScreen;
