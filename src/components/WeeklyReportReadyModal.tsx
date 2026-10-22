import { useTheme } from "@/context/ThemeContext";
import {
  dismissWeeklyReportModal,
  markWeeklyReportSeen,
  WeeklyReportData,
} from "@/store/weeklyReport";
import { getGlobalStyles } from "@/styles/global";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  visible: boolean;
  reportData: WeeklyReportData | null;
  weekId?: string;
  onClose: () => void;
};

export default function WeeklyReportReadyModal({
  visible,
  reportData,
  weekId,
  onClose,
}: Props) {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const router = useRouter();

  if (!visible || !reportData) return null;

  const handleGoToReport = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await markWeeklyReportSeen(weekId);
    onClose();
    router.push("/reports/weekly");
  };

  const handleDismiss = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await dismissWeeklyReportModal(weekId);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: colors.surface,
              borderColor: colors.primary + "50",
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View
              style={[
                styles.iconBadge,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Ionicons name="analytics" size={28} color={colors.primary} />
            </View>

            <View
              style={{
                backgroundColor: colors.primary + "15",
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 12,
                marginTop: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "bold",
                  color: colors.primary,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                }}
              >
                {reportData.startDate} - {reportData.endDate}
              </Text>
            </View>

            <Text
              style={[
                globalStyles.title,
                { fontSize: 20, textAlign: "center", marginTop: 8, marginBottom: 4 },
              ]}
            >
              Resumen Semanal Listo
            </Text>

            <Text
              style={{
                fontSize: 12,
                color: colors.textSecondary,
                textAlign: "center",
                lineHeight: 18,
                paddingHorizontal: 10,
              }}
            >
              Análisis consolidado de tu rendimiento, nutrición y récords de los últimos 7 días.
            </Text>
          </View>

          {/* Tarjetas de Resumen Rápido */}
          <View style={styles.metricsRow}>
            {/* Días de Dieta */}
            <View
              style={[
                styles.metricCard,
                { backgroundColor: colors.background, borderColor: colors.primary + "20" },
              ]}
            >
              <Ionicons name="nutrition-outline" size={18} color={colors.primary} />
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {reportData.dietDaysRespected}/7
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                Dieta
              </Text>
            </View>

            {/* Récords Superados */}
            <View
              style={[
                styles.metricCard,
                { backgroundColor: colors.background, borderColor: colors.secondary + "20" },
              ]}
            >
              <Ionicons name="trophy-outline" size={18} color={colors.secondary} />
              <Text style={[styles.metricValue, { color: colors.secondary }]}>
                {reportData.recordsBrokenCount}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                Récords (PR)
              </Text>
            </View>

            {/* Sesiones Completadas */}
            <View
              style={[
                styles.metricCard,
                { backgroundColor: colors.background, borderColor: colors.primary + "20" },
              ]}
            >
              <Ionicons name="barbell-outline" size={18} color={colors.primary} />
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {reportData.totalWorkouts || reportData.bestPerformanceByRoutine.length}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                Sesiones
              </Text>
            </View>
          </View>

          {/* Consejo Destacado */}
          {reportData.coachAdvice.length > 0 && (
            <View
              style={[
                styles.adviceBox,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.primary + "30",
                },
              ]}
            >
              <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
              <Text
                style={{
                  fontSize: 12,
                  color: colors.text,
                  flex: 1,
                  lineHeight: 16,
                }}
                numberOfLines={2}
              >
                {reportData.coachAdvice[0]}
              </Text>
            </View>
          )}

          {/* Botones de Acción */}
          <View style={{ width: "100%", gap: 10, marginTop: 18 }}>
            <TouchableOpacity
              style={[
                globalStyles.button,
                {
                  marginTop: 0,
                  backgroundColor: colors.primary,
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 8,
                },
              ]}
              onPress={handleGoToReport}
            >
              <Ionicons name="analytics" size={20} color={colors.background} />
              <Text style={[globalStyles.buttonText, { fontWeight: "bold" }]}>
                Ver Resumen Completo
              </Text>
              <Ionicons name="arrow-forward" size={18} color={colors.background} />
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                alignItems: "center",
                paddingVertical: 10,
              }}
              onPress={handleDismiss}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: "600" }}>
                Más tarde
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
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  container: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    alignItems: "center",
    marginBottom: 16,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 4,
  },
  metricLabel: {
    fontSize: 11,
    marginTop: 2,
    textAlign: "center",
  },
  adviceBox: {
    flexDirection: "row",
    gap: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    width: "100%",
  },
});
