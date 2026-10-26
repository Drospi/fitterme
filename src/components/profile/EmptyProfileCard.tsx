import { useTheme } from "@/context/ThemeContext";
import { getGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface EmptyProfileCardProps {
  onAddInfo: () => void;
}

export default function EmptyProfileCard({ onAddInfo }: EmptyProfileCardProps) {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  return (
    <View
      style={[
        globalStyles.card,
        styles.card,
        {
          borderColor: colors.primary + "30",
        },
      ]}
    >
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: colors.primary + "18" },
        ]}
      >
        <Ionicons name="person-outline" size={28} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>
        No hay información del perfil
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        ¿Deseas agregar tus datos biométricos para personalizar tus estadísticas?
      </Text>
      <TouchableOpacity
        style={[
          globalStyles.button,
          styles.button,
        ]}
        onPress={onAddInfo}
      >
        <Ionicons name="add" size={18} color={colors.background} />
        <Text style={globalStyles.buttonText}>Agregar Información</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    padding: 24,
    borderWidth: 1,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 16,
    textAlign: "center",
    lineHeight: 18,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});
