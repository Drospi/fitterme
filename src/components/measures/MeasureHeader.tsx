import ShareButton from "@/components/ShareButton";
import { useTheme } from "@/context/ThemeContext";
import { getGlobalStyles } from "@/styles/global";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface MeasureHeaderProps {
  title: string;
  shareText: string;
}

export default function MeasureHeader({ title, shareText }: MeasureHeaderProps) {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const router = useRouter();

  return (
    <View
      style={[
        globalStyles.header,
        { marginBottom: 20, alignItems: "center" },
      ]}
    >
      <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={globalStyles.title}>{title.toUpperCase()}</Text>
      <ShareButton text={shareText} />
    </View>
  );
}
