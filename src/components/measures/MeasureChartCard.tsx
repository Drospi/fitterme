import ThemeConfirmModal from "@/components/ThemeConfirmModal";
import { useTheme } from "@/context/ThemeContext";
import { MeasureHistoryItem } from "@/store/measures";
import { getGlobalStyles } from "@/styles/global";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import Toast from "react-native-toast-message";

interface MeasureChartCardProps {
  hasHistory: boolean;
  reversedHistory: MeasureHistoryItem[];
  showProjection: boolean;
  onToggleProjection: (val: boolean) => void;
  displayChartData: number[];
  displayChartLabels: string[];
  isSinglePoint: boolean;
  onSaveEdit: (point: MeasureHistoryItem, value: number) => Promise<void>;
  onConfirmDelete: (point: MeasureHistoryItem) => Promise<void>;
  formatDateDisplay: (dateStr?: string) => string;
}

export default function MeasureChartCard({
  hasHistory,
  reversedHistory,
  showProjection,
  onToggleProjection,
  displayChartData,
  displayChartLabels,
  isSinglePoint,
  onSaveEdit,
  onConfirmDelete,
  formatDateDisplay,
}: MeasureChartCardProps) {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  // Selected point modal state (edit / delete)
  const [selectedPoint, setSelectedPoint] = useState<MeasureHistoryItem | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [pointModalVisible, setPointModalVisible] = useState<boolean>(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState<boolean>(false);

  // Projected point modal state
  const [projectedInfo, setProjectedInfo] = useState<{
    days: number;
    dateStr: string;
    value: number;
  } | null>(null);
  const [projectedModalVisible, setProjectedModalVisible] = useState<boolean>(false);

  // Click handler for points on LineChart
  const handleDataPointClick = (data: { index: number; value: number }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const historicalCount = reversedHistory.length;

    if (showProjection && data.index >= historicalCount) {
      const projOffset = data.index - historicalCount;
      const days = projOffset === 0 ? 15 : 30;
      const projDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      setProjectedInfo({
        days,
        dateStr: formatDateDisplay(projDate.toISOString()),
        value: data.value,
      });
      setProjectedModalVisible(true);
      return;
    }

    const pointIndex = isSinglePoint ? 0 : data.index;
    const point = reversedHistory[pointIndex];
    if (point) {
      setSelectedPoint(point);
      setEditValue(point.value.toString());
      setPointModalVisible(true);
    }
  };

  const handleSave = async () => {
    if (!selectedPoint) return;
    const parsed = parseFloat(editValue);
    if (isNaN(parsed) || parsed <= 0) {
      Toast.show({
        type: "error",
        text1: "Medida no válida",
        text2: "Ingresa un número mayor a 0",
      });
      return;
    }
    await onSaveEdit(selectedPoint, parsed);
    setPointModalVisible(false);
  };

  const handleDelete = async () => {
    if (!selectedPoint) return;
    await onConfirmDelete(selectedPoint);
    setConfirmDeleteVisible(false);
    setPointModalVisible(false);
  };

  return (
    <View
      style={[
        globalStyles.card,
        {
          width: "100%",
          padding: 16,
          alignItems: hasHistory ? "stretch" : "center",
          marginBottom: 20,
        },
      ]}
    >
      {/* Toggle Mode: Historial vs Proyección +1 Mes */}
      {hasHistory && (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="stats-chart" size={18} color={colors.primary} />
            <Text style={{ fontSize: 13, fontWeight: "bold", color: colors.text }}>
              PROGRESO & CURVA
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              backgroundColor: colors.background,
              borderRadius: 20,
              padding: 3,
              borderWidth: 1,
              borderColor: colors.textSecondary + "25",
            }}
          >
            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                onToggleProjection(false);
              }}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 14,
                backgroundColor: !showProjection ? colors.primary : "transparent",
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "bold",
                  color: !showProjection ? colors.background : colors.textSecondary,
                }}
              >
                Historial
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                onToggleProjection(true);
              }}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 14,
                backgroundColor: showProjection ? colors.primary : "transparent",
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "bold",
                  color: showProjection ? colors.background : colors.textSecondary,
                }}
              >
                +1 Mes Predictivo
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {hasHistory ? (
        <>
          <LineChart
            data={{
              labels: displayChartLabels,
              datasets: [{ data: displayChartData }],
            }}
            width={Dimensions.get("window").width - 64}
            height={210}
            chartConfig={{
              backgroundColor: colors.surface,
              backgroundGradientFrom: colors.surface,
              backgroundGradientTo: colors.surface,
              color: () => colors.primary,
              labelColor: () => colors.textSecondary,
              decimalPlaces: 1,
              propsForDots: {
                r: "5.5",
                strokeWidth: "2",
                stroke: colors.primary,
                fill: colors.background,
              },
            }}
            bezier={!isSinglePoint}
            withDots={true}
            withVerticalLines={false}
            withOuterLines={false}
            withHorizontalLines={true}
            onDataPointClick={handleDataPointClick}
            style={{ borderRadius: 16 }}
          />
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              marginTop: 8,
            }}
          >
            <Ionicons name="finger-print-outline" size={14} color={colors.primary} />
            <Text style={{ fontSize: 11, color: colors.textSecondary }}>
              Toca cualquier punto para{" "}
              <Text style={{ color: colors.primary, fontWeight: "bold" }}>
                editar o eliminar
              </Text>
            </Text>
          </View>
        </>
      ) : (
        <View style={{ paddingVertical: 20, alignItems: "center" }}>
          <Ionicons
            name="analytics-outline"
            size={36}
            color={colors.textSecondary}
          />
          <Text
            style={[
              globalStyles.cardText,
              { marginTop: 10, textAlign: "center" },
            ]}
          >
            No hay historial de medidas válidas para este músculo aún.
          </Text>
        </View>
      )}

      {/* Point Edit / Delete Modal */}
      <Modal
        visible={pointModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPointModalVisible(false)}
      >
        <View style={modalStyles.overlay}>
          <View
            style={[
              globalStyles.card,
              {
                width: "90%",
                maxWidth: 360,
                padding: 20,
                backgroundColor: colors.surface,
                borderRadius: 20,
                borderWidth: 1.5,
                borderColor: colors.primary + "60",
              },
            ]}
          >
            {/* Modal Header */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="create-outline" size={22} color={colors.primary} />
                <Text style={{ fontSize: 17, fontWeight: "bold", color: colors.text }}>
                  Editar o Eliminar Medida
                </Text>
              </View>
              <TouchableOpacity onPress={() => setPointModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Date info */}
            {selectedPoint && (
              <View
                style={{
                  backgroundColor: colors.background,
                  padding: 10,
                  borderRadius: 10,
                  marginBottom: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                <Text style={{ fontSize: 13, color: colors.text, fontWeight: "500" }}>
                  Fecha: {formatDateDisplay(selectedPoint.date)}
                </Text>
              </View>
            )}

            {/* Value adjustment with stepper and text input */}
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: colors.textSecondary,
                marginBottom: 8,
              }}
            >
              VALOR DE LA MEDIDA (CM)
            </Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  const current = parseFloat(editValue) || 0;
                  setEditValue((Math.max(0, current - 0.1)).toFixed(1));
                }}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: colors.background,
                  borderWidth: 1,
                  borderColor: colors.textSecondary + "30",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="remove" size={22} color={colors.text} />
              </TouchableOpacity>

              <View
                style={{
                  minWidth: 100,
                  backgroundColor: colors.background,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.primary,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  alignItems: "center",
                }}
              >
                <TextInput
                  keyboardType="numeric"
                  value={editValue}
                  onChangeText={setEditValue}
                  selectTextOnFocus
                  style={{
                    fontSize: 24,
                    fontWeight: "bold",
                    color: colors.text,
                    textAlign: "center",
                  }}
                />
              </View>

              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  const current = parseFloat(editValue) || 0;
                  setEditValue((current + 0.1).toFixed(1));
                }}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: colors.background,
                  borderWidth: 1,
                  borderColor: colors.textSecondary + "30",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="add" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={{ gap: 10 }}>
              <TouchableOpacity
                onPress={handleSave}
                style={{
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "bold", color: colors.background }}>
                  Guardar Medida
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setConfirmDeleteVisible(true)}
                style={{
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: colors.delete + "18",
                  borderWidth: 1,
                  borderColor: colors.delete + "40",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: 6,
                }}
              >
                <Ionicons name="trash-outline" size={18} color={colors.delete} />
                <Text style={{ fontSize: 14, fontWeight: "bold", color: colors.delete }}>
                  Eliminar este registro
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Projected Point Details Modal */}
      <Modal
        visible={projectedModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setProjectedModalVisible(false)}
      >
        <View style={modalStyles.overlay}>
          <View
            style={[
              globalStyles.card,
              {
                width: "88%",
                maxWidth: 340,
                padding: 20,
                backgroundColor: colors.surface,
                borderRadius: 20,
                borderWidth: 1.5,
                borderColor: colors.primary + "60",
                alignItems: "center",
              },
            ]}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: colors.primary + "20",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <Ionicons name="sparkles" size={26} color={colors.primary} />
            </View>

            <Text style={{ fontSize: 17, fontWeight: "bold", color: colors.text, marginBottom: 4 }}>
              Punto Proyectado (+{projectedInfo?.days} días)
            </Text>
            <Text style={{ fontSize: 13, color: colors.primary, fontWeight: "600", marginBottom: 12 }}>
              {projectedInfo?.dateStr}
            </Text>

            <Text style={{ fontSize: 32, fontWeight: "bold", color: colors.text, marginBottom: 8 }}>
              {projectedInfo?.value}{" "}
              <Text style={{ fontSize: 18, color: colors.textSecondary }}>cm</Text>
            </Text>

            <Text
              style={{
                fontSize: 13,
                color: colors.textSecondary,
                textAlign: "center",
                lineHeight: 18,
                marginBottom: 18,
              }}
            >
              Este punto es una proyección estadística a futuro calculada a partir de tu progreso real.
            </Text>

            <TouchableOpacity
              onPress={() => setProjectedModalVisible(false)}
              style={{
                width: "100%",
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: colors.primary,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "bold", color: colors.background }}>
                Entendido
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Non-Native Confirmation Modal for Deletion with same-day measures warning */}
      <ThemeConfirmModal
        visible={confirmDeleteVisible}
        title="¿Eliminar registro del día?"
        message={`¿Estás seguro de que deseas eliminar este registro del ${
          selectedPoint ? formatDateDisplay(selectedPoint.date) : "día"
        }?\n\n⚠️ Advertencia: Al eliminarlo, también se eliminarán las otras medidas corporales que se realizaron ese mismo día.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDestructive={true}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteVisible(false)}
      />
    </View>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
});
