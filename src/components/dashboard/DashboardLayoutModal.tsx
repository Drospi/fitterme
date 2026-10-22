import { useTheme } from "@/context/ThemeContext";
import {
  CardConfigItem,
  resetDashboardConfig,
  saveDashboardConfig,
} from "@/store/dashboardConfig";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface DashboardLayoutModalProps {
  cardConfigs: CardConfigItem[];
  onConfigChange: (newConfigs: CardConfigItem[]) => void;
}

export default function DashboardLayoutModal({
  cardConfigs,
  onConfigChange,
}: DashboardLayoutModalProps) {
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [localConfigs, setLocalConfigs] = useState<CardConfigItem[]>(cardConfigs);

  const handleOpen = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocalConfigs([...cardConfigs]);
    setModalVisible(true);
  };

  const handleToggleVisible = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = [...localConfigs];
    updated[index] = {
      ...updated[index],
      visible: !updated[index].visible,
    };
    setLocalConfigs(updated);
    saveDashboardConfig(updated);
    onConfigChange(updated);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = [...localConfigs];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    setLocalConfigs(updated);
    saveDashboardConfig(updated);
    onConfigChange(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === localConfigs.length - 1) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = [...localConfigs];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    setLocalConfigs(updated);
    saveDashboardConfig(updated);
    onConfigChange(updated);
  };

  const handleReset = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const def = await resetDashboardConfig();
    setLocalConfigs([...def]);
    onConfigChange([...def]);
  };

  return (
    <>
      {/* BOTÓN FLOTANTE EN LA ESQUINA INFERIOR DERECHA */}
      <TouchableOpacity
        style={[
          styles.fabButton,
          {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
          },
        ]}
        onPress={handleOpen}
        activeOpacity={0.85}
      >
        <Ionicons name="options" size={24} color={colors.background} />
      </TouchableOpacity>

      {/* MODAL PARA ACTIVAR/DESACTIVAR Y REORDENAR TARJETAS */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            {/* Header del Modal */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Ionicons name="layers-outline" size={22} color={colors.primary} />
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    Personalizar Dashboard
                  </Text>
                </View>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  Activa, oculta o reordena las tarjetas a tu gusto
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close-circle" size={28} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Lista de Tarjetas con Switches y Flechas de Orden */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 380 }}
              contentContainerStyle={{ paddingVertical: 6 }}
            >
              {localConfigs.map((item, index) => {
                const isFirst = index === 0;
                const isLast = index === localConfigs.length - 1;

                return (
                  <View
                    key={item.id}
                    style={[
                      styles.itemRow,
                      {
                        backgroundColor: colors.background,
                        borderColor: item.visible
                          ? colors.cardBorder
                          : "rgba(255, 255, 255, 0.04)",
                        opacity: item.visible ? 1 : 0.6,
                      },
                    ]}
                  >
                    {/* Botones de Reordenar (Arriba / Abajo) */}
                    <View style={styles.reorderControls}>
                      <TouchableOpacity
                        onPress={() => handleMoveUp(index)}
                        disabled={isFirst}
                        style={[
                          styles.arrowBtn,
                          isFirst && { opacity: 0.2 },
                        ]}
                      >
                        <Ionicons
                          name="chevron-up"
                          size={18}
                          color={isFirst ? colors.textSecondary : colors.primary}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleMoveDown(index)}
                        disabled={isLast}
                        style={[
                          styles.arrowBtn,
                          isLast && { opacity: 0.2 },
                        ]}
                      >
                        <Ionicons
                          name="chevron-down"
                          size={18}
                          color={isLast ? colors.textSecondary : colors.primary}
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Ícono y Nombre de la Tarjeta */}
                    <View style={styles.labelContainer}>
                      <View
                        style={[
                          styles.cardIconBox,
                          {
                            backgroundColor: item.visible
                              ? colors.cardHighlight
                              : "rgba(255, 255, 255, 0.05)",
                          },
                        ]}
                      >
                        <Ionicons
                          name={(item.icon as any) || "grid-outline"}
                          size={18}
                          color={item.visible ? colors.primary : colors.textSecondary}
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.itemTitle,
                            {
                              color: item.visible ? colors.text : colors.textSecondary,
                              fontWeight: item.visible ? "700" : "500",
                            },
                          ]}
                        >
                          {item.label}
                        </Text>
                        <Text
                          style={[
                            styles.itemStatus,
                            { color: item.visible ? colors.primary : colors.textSecondary },
                          ]}
                        >
                          {item.visible ? "Visible" : "Oculta"}
                        </Text>
                      </View>
                    </View>

                    {/* Switch para Mostrar / Ocultar */}
                    <Switch
                      value={item.visible}
                      onValueChange={() => handleToggleVisible(index)}
                      trackColor={{
                        false: "rgba(255, 255, 255, 0.15)",
                        true: colors.primary,
                      }}
                      thumbColor={item.visible ? colors.background : "#999"}
                    />
                  </View>
                );
              })}
            </ScrollView>

            {/* Footer con Acciones */}
            <View style={styles.footerRow}>
              <TouchableOpacity
                onPress={handleReset}
                style={[styles.resetButton, { borderColor: colors.cardBorder }]}
              >
                <Ionicons name="refresh-outline" size={16} color={colors.textSecondary} />
                <Text style={[styles.resetButtonText, { color: colors.textSecondary }]}>
                  Restablecer
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.doneButton, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.doneButtonText, { color: colors.background }]}>
                  Guardar y Cerrar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fabButton: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    zIndex: 999,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  modalCard: {
    width: "100%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 2,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    gap: 10,
  },
  reorderControls: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  arrowBtn: {
    padding: 2,
  },
  labelContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cardIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  itemTitle: {
    fontSize: 13,
  },
  itemStatus: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 1,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  resetButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },
  doneButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  doneButtonText: {
    fontSize: 14,
    fontWeight: "800",
  },
});
