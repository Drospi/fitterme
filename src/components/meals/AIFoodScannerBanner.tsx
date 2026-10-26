import { useTheme } from "@/context/ThemeContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface AIFoodScannerBannerProps {
  onPress: () => void;
}

export default function AIFoodScannerBanner({ onPress }: AIFoodScannerBannerProps) {
  const { colors } = useTheme();

  const isNeonLime =
    colors.primary?.toLowerCase().includes("c8ff") ||
    colors.primary?.toLowerCase() === "#c8ff00" ||
    colors.primary?.toLowerCase() === "#52b788";
  const onPrimaryColor = isNeonLime ? "#000000" : "#ffffff";

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.primary + "60",
        },
      ]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={styles.content}>
        <View
          style={[
            styles.iconWrapper,
            { backgroundColor: colors.primary },
          ]}
        >
          <Ionicons name="sparkles" size={22} color={onPrimaryColor} />
        </View>
        <View style={styles.textWrapper}>
          <Text
            style={[
              styles.title,
              { color: colors.text },
            ]}
          >
            Escanear Comida con IA
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Calcula calorías y macros por foto con Gemini
          </Text>
        </View>
      </View>
      <Ionicons name="arrow-forward" size={20} color={colors.primary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrapper: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
});
