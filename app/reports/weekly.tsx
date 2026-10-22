import { useTheme } from "@/context/ThemeContext";
import { formatWeightText, getSettings, UserSettings } from "@/store/conf";
import { generateWeeklyReport, WeeklyReportData } from "@/store/weeklyReport";
import { getGlobalStyles } from "@/styles/global";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function WeeklyReportScreen() {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<WeeklyReportData | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings>({
    unit: "kg",
    weightIncrement: 2.5,
    defaultRestTimer: 90,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const s = await getSettings();
      setUserSettings(s);
      const data = await generateWeeklyReport();
      setReport(data);
    } catch (error) {
      console.error("Error al cargar informe semanal:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  if (loading || !report) {
    return (
      <View style={[globalStyles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[globalStyles.cardText, { marginTop: 15 }]}>
          Calculando métricas semanales...
        </Text>
      </View>
    );
  }

  const maxSessionVol =
    report.recentSessions.length > 0
      ? Math.max(...report.recentSessions.map((s) => s.volume), 1)
      : 1;

  return (
    <ScrollView style={globalStyles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={[globalStyles.header, { marginBottom: 16 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              padding: 6,
              borderRadius: 10,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.cardBorder,
            }}
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={{ fontSize: 11, fontWeight: "bold", color: colors.primary, letterSpacing: 1 }}>
              INFORME DE RENDIMIENTO
            </Text>
            <Text style={[globalStyles.title, { fontSize: 20, marginTop: 2 }]}>
              Resumen Semanal
            </Text>
          </View>
        </View>

        <View
          style={{
            backgroundColor: colors.surface,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.primary + "40",
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "bold", color: colors.primary }}>
            {report.startDate} - {report.endDate}
          </Text>
        </View>
      </View>

      {/* KPI Grid (2 filas de 2 tarjetas responsivas 50%/50% con flex: 1 y porcentajes) */}
      <View style={{ marginBottom: 16, gap: 10 }}>
        {/* Fila 1 */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          {/* KPI 1: Sesiones */}
          <View style={[styles.kpiCard, { flex: 1, backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <View style={styles.kpiHeader}>
              <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>SESIONES</Text>
              <Ionicons name="fitness-outline" size={16} color={colors.primary} />
            </View>
            <Text style={[styles.kpiValue, { color: colors.text }]}>
              {report.totalWorkouts}{" "}
              <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: "normal" }}>
                / {report.targetFrequency}
              </Text>
            </Text>
            <Text style={[styles.kpiSub, { color: colors.primary, fontWeight: "600" }]}>
              {Math.min(100, Math.round((report.totalWorkouts / Math.max(1, report.targetFrequency)) * 100))}% meta
            </Text>
          </View>

          {/* KPI 2: Volumen Total */}
          <View style={[styles.kpiCard, { flex: 1, backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <View style={styles.kpiHeader}>
              <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>VOLUMEN TOTAL</Text>
              <Ionicons name="barbell-outline" size={16} color={colors.primary} />
            </View>
            <Text style={[styles.kpiValue, { color: colors.primary }]} numberOfLines={1}>
              {formatWeightText(report.totalVolume, userSettings.unit)}
            </Text>
            <Text style={[styles.kpiSub, { color: colors.textSecondary }]}>
              {report.totalSets} series · {report.totalWorkoutMinutes} min
            </Text>
          </View>
        </View>

        {/* Fila 2 */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          {/* KPI 3: Récords Superados */}
          <View style={[styles.kpiCard, { flex: 1, backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <View style={styles.kpiHeader}>
              <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>RÉCORDS (PR)</Text>
              <Ionicons name="trophy-outline" size={16} color={colors.secondary} />
            </View>
            <Text style={[styles.kpiValue, { color: colors.secondary }]}>
              {report.recordsBrokenCount}
            </Text>
            <Text style={[styles.kpiSub, { color: colors.textSecondary }]}>
              Nuevas marcas de carga
            </Text>
          </View>

          {/* KPI 4: Adherencia a Dieta */}
          <View style={[styles.kpiCard, { flex: 1, backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <View style={styles.kpiHeader}>
              <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>DIETA</Text>
              <Ionicons name="nutrition-outline" size={16} color={colors.primary} />
            </View>
            <Text style={[styles.kpiValue, { color: colors.text }]}>
              {report.dietAdherencePercent}%
            </Text>
            <Text style={[styles.kpiSub, { color: colors.textSecondary }]}>
              {report.dietDaysRespected} de 7 días ({report.dietAdherencePercent}%)
            </Text>
          </View>
        </View>
      </View>

      {/* SECCIÓN 1: Consistencia Nutricional */}
      <View style={[globalStyles.card, styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardTitleGroup}>
            <Ionicons name="restaurant-outline" size={18} color={colors.primary} />
            <Text style={[styles.cardTitleText, { color: colors.text }]}>
              Consistencia Nutricional
            </Text>
          </View>
          <View style={[styles.pillBadge, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "40" }]}>
            <Text style={[styles.pillBadgeText, { color: colors.primary }]}>
              {report.dietDaysRespected} / 7 días
            </Text>
          </View>
        </View>

        {/* Días de la semana en pastillas */}
        <View style={styles.weekDaysRow}>
          {report.dailyDietBreakdown.map((item, idx) => (
            <View
              key={idx}
              style={[
                styles.dayPill,
                {
                  backgroundColor: item.logged ? colors.primary + "20" : colors.background,
                  borderColor: item.logged ? colors.primary : colors.textSecondary + "25",
                },
              ]}
            >
              <Text
                style={[
                  styles.dayPillLabel,
                  { color: item.logged ? colors.primary : colors.textSecondary },
                ]}
              >
                {item.dayLabel}
              </Text>
              <Ionicons
                name={item.logged ? "checkmark" : "remove"}
                size={12}
                color={item.logged ? colors.primary : colors.textSecondary + "50"}
              />
            </View>
          ))}
        </View>

        {/* Métricas Promedio de Dieta */}
        <View style={styles.metricsTwoCol}>
          <View style={[styles.metricBox, { backgroundColor: colors.background }]}>
            <Text style={[styles.metricBoxLabel, { color: colors.textSecondary }]}>
              CALORÍAS PROMEDIO
            </Text>
            <Text style={[styles.metricBoxValue, { color: colors.text }]}>
              {report.avgCalories > 0 ? `${report.avgCalories} kcal` : "--"}
            </Text>
            <Text style={[styles.metricBoxMeta, { color: colors.textSecondary }]}>
              Objetivo: {report.targetCalories} kcal
            </Text>
          </View>

          <View style={[styles.metricBox, { backgroundColor: colors.background }]}>
            <Text style={[styles.metricBoxLabel, { color: colors.textSecondary }]}>
              PROTEÍNA PROMEDIO
            </Text>
            <Text style={[styles.metricBoxValue, { color: colors.text }]}>
              {report.avgProtein > 0 ? `${report.avgProtein} g` : "--"}
            </Text>
            <Text style={[styles.metricBoxMeta, { color: colors.textSecondary }]}>
              Objetivo: {report.targetProtein} g
            </Text>
          </View>
        </View>

        {/* Barra de Adherencia */}
        <View style={styles.progressBarWrapper}>
          <View style={[styles.progressBarBg, { backgroundColor: colors.background }]}>
            <View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: colors.primary,
                  width: `${report.dietAdherencePercent}%`,
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* SECCIÓN 2: Récords Personales (PRs) */}
      <View style={[globalStyles.card, styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardTitleGroup}>
            <Ionicons name="trophy-outline" size={18} color={colors.secondary} />
            <Text style={[styles.cardTitleText, { color: colors.text }]}>
              Récords Personales
            </Text>
          </View>
          <View style={[styles.pillBadge, { backgroundColor: colors.secondary + "15", borderColor: colors.secondary + "40" }]}>
            <Text style={[styles.pillBadgeText, { color: colors.secondary }]}>
              {report.recordsBrokenCount} superados
            </Text>
          </View>
        </View>

        {report.recordsBrokenList.length === 0 ? (
          <View style={[styles.emptyStateBox, { backgroundColor: colors.background }]}>
            <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              Sin nuevos récords de carga máxima en este período de 7 días.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {report.recordsBrokenList.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.recordItemRow,
                  { backgroundColor: colors.background, borderColor: colors.cardBorder },
                ]}
              >
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={[styles.recordName, { color: colors.text }]}>
                    {item.exerciseName}
                  </Text>
                  <Text style={[styles.recordMeta, { color: colors.textSecondary }]}>
                    {item.weight <= 0
                      ? `Récord Corporal: ${item.reps} reps`
                      : `1RM Estimado: ${formatWeightText(item.estimated1RM, userSettings.unit)}`}
                  </Text>
                </View>

                <View style={[styles.recordBadge, { backgroundColor: colors.secondary + "15", borderColor: colors.secondary + "40" }]}>
                  <Text style={[styles.recordBadgeText, { color: colors.secondary }]}>
                    {item.weight <= 0
                      ? `Corporal × ${item.reps} reps`
                      : `${formatWeightText(item.weight, userSettings.unit)} × ${item.reps} reps`}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* SECCIÓN 3: Desglose de Sesiones de Entrenamiento */}
      <View style={[globalStyles.card, styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardTitleGroup}>
            <Ionicons name="barbell-outline" size={18} color={colors.primary} />
            <Text style={[styles.cardTitleText, { color: colors.text }]}>
              Sesiones de Entrenamiento
            </Text>
          </View>
          <View style={[styles.pillBadge, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "40" }]}>
            <Text style={[styles.pillBadgeText, { color: colors.primary }]}>
              {report.recentSessions.length} completadas
            </Text>
          </View>
        </View>

        {report.recentSessions.length === 0 ? (
          <View style={[styles.emptyStateBox, { backgroundColor: colors.background }]}>
            <Ionicons name="barbell-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              No se registraron entrenamientos completados en los últimos 7 días.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {report.recentSessions.map((session, index) => {
              const relWidth = Math.min(100, Math.max(15, (session.volume / maxSessionVol) * 100));
              return (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (session.id) {
                      Haptics.selectionAsync();
                      router.push({
                        pathname: "/routines/DetailsRoutine/[id]",
                        params: { id: session.id },
                      });
                    }
                  }}
                  style={[
                    styles.sessionItem,
                    { backgroundColor: colors.background, borderColor: colors.cardBorder },
                  ]}
                >
                  <View style={styles.sessionHeader}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={[styles.sessionName, { color: colors.text }]}>
                        {session.routineName}
                      </Text>
                      <Text style={[styles.sessionMeta, { color: colors.textSecondary }]}>
                        {session.date} · {session.durationMinutes > 0 ? `${session.durationMinutes} min` : "Finalizado"} · {session.setsCount} series
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={[styles.sessionVolume, { color: colors.primary }]}>
                        {formatWeightText(session.volume, userSettings.unit)}
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                    </View>
                  </View>

                  {/* Barra relativa de volumen */}
                  <View style={[styles.sessionBarBg, { backgroundColor: colors.surface }]}>
                    <View
                      style={[
                        styles.sessionBarFill,
                        { backgroundColor: colors.primary, width: `${relWidth}%` },
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* SECCIÓN 4: Control de Cargas y Fatiga (si aplica) */}
      {report.reducedAvgList.length > 0 && (
        <View style={[globalStyles.card, styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardTitleGroup}>
              <Ionicons name="trending-down-outline" size={18} color={colors.delete} />
              <Text style={[styles.cardTitleText, { color: colors.text }]}>
                Control de Fatiga y Volumen
              </Text>
            </View>
            <View style={[styles.pillBadge, { backgroundColor: colors.delete + "15", borderColor: colors.delete + "40" }]}>
              <Text style={[styles.pillBadgeText, { color: colors.delete }]}>
                {report.reducedAvgCount} ejercicios
              </Text>
            </View>
          </View>

          <View style={{ gap: 8 }}>
            {report.reducedAvgList.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.fatigueRow,
                  { backgroundColor: colors.background, borderColor: colors.cardBorder },
                ]}
              >
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={[styles.fatigueName, { color: colors.text }]}>
                    {item.exerciseName}
                  </Text>
                  <Text style={[styles.fatigueMeta, { color: colors.textSecondary }]}>
                    Anterior: {formatWeightText(item.prevAvg, userSettings.unit)} → Actual: {formatWeightText(item.currentAvg, userSettings.unit)}
                  </Text>
                </View>
                <View style={[styles.fatigueBadge, { backgroundColor: colors.delete + "15" }]}>
                  <Text style={[styles.fatigueBadgeText, { color: colors.delete }]}>
                    {item.percentChange}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* SECCIÓN 5: Conclusiones Técnicas */}
      <View style={[globalStyles.card, styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder, marginBottom: 40 }]}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardTitleGroup}>
            <Ionicons name="analytics-outline" size={18} color={colors.primary} />
            <Text style={[styles.cardTitleText, { color: colors.text }]}>
              Conclusiones del Período
            </Text>
          </View>
        </View>

        <View style={{ gap: 8 }}>
          {report.coachAdvice.map((advice, index) => (
            <View
              key={index}
              style={[
                styles.adviceRow,
                { backgroundColor: colors.background, borderColor: colors.cardBorder },
              ]}
            >
              <View style={[styles.adviceBullet, { backgroundColor: colors.primary }]} />
              <Text style={[styles.adviceText, { color: colors.text }]}>
                {advice}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  kpiHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 2,
  },
  kpiSub: {
    fontSize: 11,
  },
  sectionCard: {
    marginBottom: 14,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitleText: {
    fontSize: 15,
    fontWeight: "bold",
  },
  pillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  pillBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  weekDaysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 4,
    marginBottom: 12,
  },
  dayPill: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 2,
  },
  dayPillLabel: {
    fontSize: 10,
    fontWeight: "bold",
  },
  metricsTwoCol: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  metricBox: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
  },
  metricBoxLabel: {
    fontSize: 9,
    fontWeight: "bold",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metricBoxValue: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 2,
  },
  metricBoxMeta: {
    fontSize: 10,
  },
  progressBarWrapper: {
    marginTop: 2,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  emptyStateBox: {
    padding: 14,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  emptyStateText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  recordItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  recordName: {
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 2,
  },
  recordMeta: {
    fontSize: 11,
  },
  recordBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  recordBadgeText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  sessionItem: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sessionName: {
    fontSize: 13,
    fontWeight: "bold",
  },
  sessionMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  sessionVolume: {
    fontSize: 13,
    fontWeight: "bold",
  },
  sessionBarBg: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  sessionBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  fatigueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  fatigueName: {
    fontSize: 13,
    fontWeight: "bold",
  },
  fatigueMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  fatigueBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  fatigueBadgeText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  adviceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  adviceBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  adviceText: {
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
});

