import { useTheme } from "@/context/ThemeContext";
import { formatWeightText, getSettings, UserSettings } from "@/store/conf";
import { generateWeeklyReport, WeeklyReportData } from "@/store/weeklyReport";
import { getGlobalStyles } from "@/styles/global";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
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
        <Text style={[globalStyles.cardText, { marginTop: 15 }]}>Generando tu resumen semanal...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={globalStyles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={[globalStyles.header, { marginBottom: 15 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={26} color={colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={{ fontSize: 12, fontWeight: "bold", color: colors.primary, letterSpacing: 1 }}>
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
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.primary + "40",
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "bold", color: colors.primary }}>
            {report.startDate} - {report.endDate}
          </Text>
        </View>
      </View>

      {/* Tarjeta 1: Días de Dieta Respetados */}
      <View style={[globalStyles.card, { marginBottom: 16 }]}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="nutrition-outline" size={22} color={colors.primary} />
            <Text style={[globalStyles.cardTitle, { fontSize: 17, fontWeight: "bold", marginBottom: 0 }]}>
              Cumplimiento de Dieta
            </Text>
          </View>
          <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.primary }}>
            {report.dietDaysRespected} / 7 días
          </Text>
        </View>

        <Text style={[globalStyles.cardText, { fontSize: 13, color: colors.textSecondary }]}>
          Días en que registraste activamente tus comidas de la semana.
        </Text>

        <View
          style={{
            height: 10,
            width: "100%",
            marginTop: 12,
            backgroundColor: colors.background,
            borderRadius: 5,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              height: "100%",
              backgroundColor: colors.primary,
              width: `${Math.min(100, Math.round((report.dietDaysRespected / 7) * 100))}%`,
              borderRadius: 5,
            }}
          />
        </View>
      </View>

      {/* Tarjeta 2: Récords Superados (PRs) */}
      <View style={[globalStyles.card, { marginBottom: 16 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Ionicons name="trophy-outline" size={22} color={colors.secondary} />
          <Text style={[globalStyles.cardTitle, { fontSize: 17, fontWeight: "bold", marginBottom: 0 }]}>
            Récords Personales Superados ({report.recordsBrokenCount})
          </Text>
        </View>

        {report.recordsBrokenList.length === 0 ? (
          <Text style={[globalStyles.cardText, { color: colors.textSecondary }]}>
            Esta semana no registraste nuevos récords de peso. ¡Mantén la constancia en tu próxima sesión!
          </Text>
        ) : (
          <View style={{ gap: 8 }}>
            {report.recordsBrokenList.map((item, index) => (
              <View
                key={index}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundColor: colors.background,
                  padding: 10,
                  borderRadius: 10,
                }}
              >
                <Text style={{ fontWeight: "bold", color: colors.text, fontSize: 14 }}>
                  ⚡ {item.exerciseName}
                </Text>
                <Text style={{ fontWeight: "bold", color: colors.secondary, fontSize: 14 }}>
                  {formatWeightText(item.weight, userSettings.unit)} x {item.reps} reps
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Tarjeta 3: Ejercicios con Ajuste de Promedio */}
      {report.reducedAvgList.length > 0 && (
        <View style={[globalStyles.card, { marginBottom: 16 }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Ionicons name="trending-down-outline" size={22} color={colors.delete} />
            <Text style={[globalStyles.cardTitle, { fontSize: 17, fontWeight: "bold", marginBottom: 0 }]}>
              Ejercicios a Reforzar ({report.reducedAvgCount})
            </Text>
          </View>

          <View style={{ gap: 8 }}>
            {report.reducedAvgList.map((item, index) => (
              <View
                key={index}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundColor: colors.background,
                  padding: 10,
                  borderRadius: 10,
                }}
              >
                <Text style={{ fontWeight: "bold", color: colors.text, fontSize: 14 }}>
                  {item.exerciseName}
                </Text>
                <Text style={{ fontSize: 12, color: colors.delete, fontWeight: "bold" }}>
                  Volumen: {formatWeightText(item.currentAvg, userSettings.unit)} (antes {formatWeightText(item.prevAvg, userSettings.unit)})
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Tarjeta 4: Mejor Rendimiento de Cada Rutina */}
      <View style={[globalStyles.card, { marginBottom: 16 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Ionicons name="barbell-outline" size={22} color={colors.primary} />
          <Text style={[globalStyles.cardTitle, { fontSize: 17, fontWeight: "bold", marginBottom: 0 }]}>
            Mejor Rendimiento por Rutina
          </Text>
        </View>

        {report.bestPerformanceByRoutine.length === 0 ? (
          <Text style={[globalStyles.cardText, { color: colors.textSecondary }]}>
            No completaste rutinas en los últimos 7 días.
          </Text>
        ) : (
          <View style={{ gap: 10 }}>
            {report.bestPerformanceByRoutine.map((item, index) => (
              <View
                key={index}
                style={{
                  backgroundColor: colors.background,
                  padding: 12,
                  borderRadius: 10,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={{ fontWeight: "bold", color: colors.text, fontSize: 15 }}>
                    {item.routineName}
                  </Text>
                  <Text style={{ fontWeight: "bold", color: colors.primary, fontSize: 14 }}>
                    {formatWeightText(item.maxVolume, userSettings.unit)}
                  </Text>
                </View>
                <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                  Máximo tonelaje alcanzado el {item.sessionDate}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Tarjeta 5: Consejos del Entrenador IA para la Próxima Semana */}
      <View style={[globalStyles.card, { marginBottom: 100 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Ionicons name="sparkles" size={22} color={colors.secondary} />
          <Text style={[globalStyles.cardTitle, { fontSize: 17, fontWeight: "bold", marginBottom: 0 }]}>
            Consejos para la Próxima Semana
          </Text>
        </View>

        <View style={{ gap: 10 }}>
          {report.coachAdvice.map((advice, index) => (
            <View
              key={index}
              style={{
                flexDirection: "row",
                gap: 10,
                backgroundColor: colors.surface,
                padding: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colors.primary + "30",
              }}
            >
              <Text style={{ fontSize: 14, color: colors.text, flex: 1, lineHeight: 20 }}>
                {advice}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
