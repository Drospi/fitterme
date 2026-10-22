import { useTheme } from "@/context/ThemeContext";
import { getGlobalStyles } from "@/styles/global";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ThemeConfirmModal({
  visible,
  title,
  message,
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  isDestructive = false,
  onConfirm,
  onCancel,
}: Props) {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  if (!visible) return null;

  const handleConfirm = () => {
    Haptics.impactAsync(
      isDestructive ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium
    );
    onConfirm();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View
          style={[
            globalStyles.card,
            {
              width: "88%",
              maxWidth: 360,
              padding: 20,
              backgroundColor: colors.surface,
              borderRadius: 20,
              borderWidth: 1.5,
              borderColor: isDestructive ? colors.delete + "60" : colors.primary + "60",
            },
          ]}
        >
          {/* Header icon */}
          <View style={{ alignItems: "center", marginBottom: 12 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: isDestructive ? colors.delete + "20" : colors.primary + "20",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 8,
              }}
            >
              <Ionicons
                name={isDestructive ? "alert-circle" : "help-circle"}
                size={28}
                color={isDestructive ? colors.delete : colors.primary}
              />
            </View>

            <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.text, textAlign: "center" }}>
              {title}
            </Text>
          </View>

          {/* Message */}
          <Text
            style={{
              fontSize: 14,
              color: colors.textSecondary,
              textAlign: "center",
              lineHeight: 20,
              marginBottom: 20,
            }}
          >
            {message}
          </Text>

          {/* Buttons */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.textSecondary + "30",
                alignItems: "center",
              }}
              onPress={onCancel}
            >
              <Text style={{ fontWeight: "bold", fontSize: 14, color: colors.text }}>
                {cancelText}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: isDestructive ? colors.delete : colors.primary,
                alignItems: "center",
              }}
              onPress={handleConfirm}
            >
              <Text style={{ fontWeight: "bold", fontSize: 14, color: colors.background }}>
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
  },
});
