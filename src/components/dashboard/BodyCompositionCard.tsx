import { useTheme } from "@/context/ThemeContext";
import { TrendDataPoint } from "@/utils/dashboardUtils";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Circle, Line, Polyline } from "react-native-svg";

interface BodyCompositionCardProps {
  currentBodyFat: number;
  currentLeanMass: number;
  fatChange: number;
  leanChange: number;
  trendData: TrendDataPoint[];
  hasEnoughData: boolean;
}

export default function BodyCompositionCard({
  currentBodyFat,
  currentLeanMass,
  fatChange,
  leanChange,
  trendData,
  hasEnoughData,
}: BodyCompositionCardProps) {
  const { colors } = useTheme();

  const isZeroState = currentBodyFat === 0 && currentLeanMass === 0;

  // Cálculo de tendencia en lenguaje motivador
  const trendSummary =
    fatChange < 0
      ? `📉 Grasa en descenso (${fatChange}%). ¡Excelente avance hacia tu definición!`
      : leanChange > 0
      ? `📈 Masa magra aumentando (+${leanChange} kg). ¡Tus músculos están creciendo!`
      : fatChange > 0
      ? `Mantén el ritmo, pequeños ajustes en tu alimentación marcarán la diferencia.`
      : `Composición corporal estable. ¡Sigue con la constancia!`;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      {/* Título de la tarjeta */}
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <Ionicons name="body-outline" size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Composición corporal
          </Text>
        </View>

        {hasEnoughData && (
          <View style={[styles.weeksBadge, { backgroundColor: colors.cardHighlight }]}>
            <Text style={[styles.weeksBadgeText, { color: colors.primary }]}>
              Últimas semanas
            </Text>
          </View>
        )}
      </View>

      {/* Métricas Principales: Grasa Corporal y Masa Magra */}
      <View style={styles.metricsRow}>
        {/* Grasa Corporal */}
        <View style={styles.metricBox}>
          <View style={styles.metricLabelRow}>
            <Ionicons name="flame-outline" size={16} color={colors.flame} />
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              Grasa Corporal
            </Text>
          </View>
          <Text style={[styles.bigValue, { color: colors.text }]}>
            {currentBodyFat > 0 ? `${currentBodyFat}%` : "--"}
          </Text>
          {hasEnoughData && fatChange !== 0 && (
            <View style={styles.changeBadge}>
              <Ionicons
                name={fatChange < 0 ? "arrow-down" : "arrow-up"}
                size={12}
                color={fatChange < 0 ? colors.primary : colors.flame}
              />
              <Text
                style={[
                  styles.changeText,
                  { color: fatChange < 0 ? colors.primary : colors.flame },
                ]}
              >
                {Math.abs(fatChange)}%
              </Text>
            </View>
          )}
        </View>

        {/* Separador vertical */}
        <View style={styles.verticalDivider} />

        {/* Masa Magra */}
        <View style={styles.metricBox}>
          <View style={styles.metricLabelRow}>
            <Ionicons name="barbell-outline" size={16} color={colors.protein} />
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              Masa Muscular
            </Text>
          </View>
          <Text style={[styles.bigValue, { color: colors.text }]}>
            {currentLeanMass > 0 ? `${currentLeanMass} kg` : "--"}
          </Text>
          {hasEnoughData && leanChange !== 0 && (
            <View style={styles.changeBadge}>
              <Ionicons
                name={leanChange > 0 ? "arrow-up" : "arrow-down"}
                size={12}
                color={leanChange > 0 ? colors.primary : colors.flame}
              />
              <Text
                style={[
                  styles.changeText,
                  { color: leanChange > 0 ? colors.primary : colors.flame },
                ]}
              >
                {Math.abs(leanChange)} kg
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Leyenda y Barra Proporcional de Composición */}
      {currentBodyFat > 0 && (
        <View style={styles.proportionContainer}>
          <View style={styles.proportionBar}>
            <View
              style={[
                styles.proportionFat,
                {
                  width: `${Math.min(100, currentBodyFat)}%`,
                  backgroundColor: colors.flame,
                },
              ]}
            />
            <View
              style={[
                styles.proportionLean,
                {
                  width: `${Math.max(0, 100 - currentBodyFat)}%`,
                  backgroundColor: colors.protein,
                },
              ]}
            />
          </View>

          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.flame }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                Grasa: {currentBodyFat}%
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.protein }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                Masa libre de grasa: {(100 - currentBodyFat).toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Mini Gráfica de Tendencia (últimas 4 a 8 semanas) */}
      {hasEnoughData && trendData.length >= 2 ? (
        <View style={styles.chartContainer}>
          <Text style={[styles.chartTitle, { color: colors.textSecondary }]}>
            Tendencia de Grasa Corporal (%)
          </Text>

          {/* Renderizado de mini gráfica con SVG responsivo */}
          <MiniTrendChart
            data={trendData.map((d) => d.bodyFat)}
            strokeColor={colors.flame}
            highlightColor={colors.primary}
          />

          {/* Mensaje de tendencia que muestra si sube o baja */}
          <View style={styles.trendMessageRow}>
            <Text style={[styles.trendMessageText, { color: colors.text }]}>
              {trendSummary}
            </Text>
          </View>
        </View>
      ) : isZeroState ? (
        /* Estado vacío */
        <TouchableOpacity
          style={[
            styles.emptyCard,
            {
              borderColor: colors.cardBorder,
            },
          ]}
          onPress={() => router.push("/measures" as any)}
          activeOpacity={0.7}
        >
          <Ionicons name="scale-outline" size={24} color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Sin datos de composición aún
          </Text>
          <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
            Registra tu peso y medidas para ver tu gráfica de evolución de grasa y
            músculo.
          </Text>
          <View
            style={[styles.emptyActionBtn, { backgroundColor: colors.primary }]}
          >
            <Text
              style={[styles.emptyActionBtnText, { color: colors.background }]}
            >
              + Registrar primera medida
            </Text>
          </View>
        </TouchableOpacity>
      ) : (
        <View style={styles.insufficientDataNotice}>
          <Text style={[styles.insufficientDataText, { color: colors.textSecondary }]}>
            💡 Registra al menos dos mediciones en semanas distintas para ver la
            gráfica de tendencia de subida o bajada.
          </Text>
        </View>
      )}
    </View>
  );
}

/**
 * Mini gráfica SVG responsiva para pantallas móviles
 */
function MiniTrendChart({
  data,
  strokeColor,
  highlightColor,
}: {
  data: number[];
  strokeColor: string;
  highlightColor: string;
}) {
  if (data.length < 2) return null;

  const height = 64;
  const width = 290;
  const paddingX = 14;
  const paddingY = 10;

  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const range = maxVal - minVal || 1;

  const points = data.map((val, idx) => {
    const x = paddingX + (idx / (data.length - 1)) * (width - 2 * paddingX);
    const y =
      height -
      paddingY -
      ((val - minVal) / range) * (height - 2 * paddingY);
    return { x, y, val };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <View style={styles.svgWrapper}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Line
          x1={paddingX}
          y1={height - paddingY}
          x2={width - paddingX}
          y2={height - paddingY}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />

        <Polyline
          points={polylinePoints}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((p, idx) => (
          <Circle
            key={idx}
            cx={p.x}
            cy={p.y}
            r={idx === points.length - 1 ? 4 : 3}
            fill={idx === points.length - 1 ? highlightColor : strokeColor}
            stroke="#0B132B"
            strokeWidth="1.5"
          />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  titleWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  weeksBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  weeksBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 8,
  },
  metricBox: {
    alignItems: "center",
    flex: 1,
  },
  metricLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  bigValue: {
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  changeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 4,
  },
  changeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  verticalDivider: {
    width: 1,
    height: 48,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  proportionContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  proportionBar: {
    height: 8,
    borderRadius: 4,
    flexDirection: "row",
    overflow: "hidden",
    marginBottom: 8,
  },
  proportionFat: {
    height: "100%",
  },
  proportionLean: {
    height: "100%",
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: "500",
  },
  chartContainer: {
    marginTop: 14,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 12,
    padding: 12,
  },
  chartTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  svgWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  trendMessageRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  trendMessageText: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
  },
  emptyCard: {
    marginTop: 10,
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 8,
  },
  emptyDesc: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 17,
    paddingHorizontal: 12,
  },
  emptyActionBtn: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  emptyActionBtnText: {
    fontSize: 12,
    fontWeight: "800",
  },
  insufficientDataNotice: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 10,
  },
  insufficientDataText: {
    fontSize: 12,
    lineHeight: 17,
  },
});
