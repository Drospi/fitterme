import { useTheme } from "@/context/ThemeContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface GiveUpModalProps {
  visible: boolean;
  motivationalMessage: string;
  totalSeries: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function GiveUpModal({
  visible,
  motivationalMessage,
  totalSeries,
  onConfirm,
  onCancel,
}: GiveUpModalProps) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: colors.surface,
              borderColor: colors.cardBorder || "rgba(255,255,255,0.1)",
            },
          ]}
        >
          <View
            style={[
              styles.iconWrapper,
              { backgroundColor: colors.delete + "20" },
            ]}
          >
            <Ionicons name="flag-outline" size={32} color={colors.delete} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            {totalSeries > 0 ? "¿Finalizar entrenamiento?" : "¿Cancelar entrenamiento?"}
          </Text>

          <Text style={[styles.message, { color: colors.textSecondary }]}>
            {motivationalMessage}
          </Text>

          {totalSeries > 0 ? (
            <Text style={[styles.subNotice, { color: colors.primary }]}>
              Se guardarán las {totalSeries} series completadas en tu historial.
            </Text>
          ) : (
            <Text style={[styles.subNotice, { color: colors.textSecondary }]}>
              No has completado ninguna serie todavía. No se guardará nada.
            </Text>
          )}

          <View style={styles.buttonsRow}>
            <TouchableOpacity
              onPress={onCancel}
              style={[
                styles.cancelButton,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.cardBorder || "rgba(255,255,255,0.1)",
                },
              ]}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                Seguir Entrenando
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              style={[
                styles.confirmButton,
                { backgroundColor: colors.delete },
              ]}
            >
              <Text style={styles.confirmButtonText}>
                {totalSeries > 0 ? "Sí, Finalizar" : "Sí, Cancelar"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1.5,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    fontStyle: "italic",
    marginBottom: 12,
  },
  subNotice: {
    fontSize: 12,
    textAlign: "center",
    fontWeight: "600",
    marginBottom: 20,
  },
  buttonsRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
  },
});
