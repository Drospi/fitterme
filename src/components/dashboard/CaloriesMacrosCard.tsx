import { useTheme } from "@/context/ThemeContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

interface CaloriesMacrosCardProps {
  todayCalories: number;
  goalCalories: number;
  todayProtein?: number;
  targetProtein?: number;
  todayCarbs?: number;
  targetCarbs?: number;
  todayFat?: number;
  targetFat?: number;
}

export default function CaloriesMacrosCard({
  todayCalories = 0,
  goalCalories = 2500,
  todayProtein = 0,
  targetProtein = 140,
  todayCarbs = 0,
  targetCarbs = 250,
  todayFat = 0,
  targetFat = 70,
}: CaloriesMacrosCardProps) {
  const { colors } = useTheme();

  const consumed = Math.max(0, todayCalories);
  const remaining = Math.max(0, goalCalories - consumed);
  const percent = Math.min(100, Math.round((consumed / (goalCalories || 1)) * 100));

  // Animación de entrada suave (máx 600 ms)
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: 1,
      duration: 550,
      useNativeDriver: false,
    }).start();
  }, [todayCalories]);

  // Dimensiones del anillo SVG
  const radius = 45;
  const strokeWidth = 8;
  const size = radius * 2;
  const circumference = 2 * Math.PI * (radius - strokeWidth / 2);

  // Offset del trazo para el arco de color
  const safePercent = Math.min(100, Math.max(percent, consumed > 0 ? 3 : 0));
  const strokeDashoffset = circumference - (safePercent / 100) * circumference;

  // Porcentajes de macros
  const proteinPct = Math.min(100, Math.round((todayProtein / (targetProtein || 1)) * 100));
  const carbsPct = Math.min(100, Math.round((todayCarbs / (targetCarbs || 1)) * 100));
  const fatPct = Math.min(100, Math.round((todayFat / (targetFat || 1)) * 100));

  const isZeroData = consumed === 0 && todayProtein === 0 && todayCarbs === 0 && todayFat === 0;

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
      {/* Título de sección */}
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <Ionicons name="nutrition-outline" size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Calorías y Macros
          </Text>
        </View>
        <Text style={[styles.consumedMeta, { color: colors.textSecondary }]}>
          {consumed} / {goalCalories} kcal
        </Text>
      </View>

      {/* Contenido principal: Anillo + 3 Barras */}
      <View style={styles.mainContentRow}>
        {/* Anillo de Calorías con Datos DENTRO */}
        <View style={styles.ringWrapper}>
          <Svg width={size} height={size}>
            {/* Círculo de fondo tenue */}
            <Circle
              stroke="rgba(255, 255, 255, 0.08)"
              cx={radius}
              cy={radius}
              r={radius - strokeWidth / 2}
              strokeWidth={strokeWidth}
            />
            {/* Arco de progreso en color primario del tema */}
            <Circle
              stroke={colors.primary}
              cx={radius}
              cy={radius}
              r={radius - strokeWidth / 2}
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation="-90"
              originX={radius}
              originY={radius}
            />
          </Svg>

          {/* DATO DENTRO DEL CÍRCULO */}
          <View style={styles.ringCenterText}>
            <Text style={[styles.ringBigNumber, { color: colors.text }]}>
              {remaining > 0 ? remaining : percent === 100 ? "100%" : 0}
            </Text>
            <Text style={[styles.ringSubLabel, { color: colors.textSecondary }]}>
              {remaining > 0 ? "kcal rest." : "meta lista"}
            </Text>
          </View>
        </View>

        {/* 3 Barras pequeñas de macros con su meta diaria */}
        <View style={styles.macrosList}>
          {/* Proteína */}
          <View style={styles.macroItem}>
            <View style={styles.macroLabelRow}>
              <Text style={[styles.macroName, { color: colors.text }]}>Proteína</Text>
              <Text style={[styles.macroValues, { color: colors.textSecondary }]}>
                <Text style={{ fontWeight: "700", color: colors.protein }}>
                  {todayProtein}g
                </Text>{" "}
                / {targetProtein}g
              </Text>
            </View>
            <View style={styles.macroTrack}>
              <View
                style={[
                  styles.macroBar,
                  { width: `${proteinPct}%`, backgroundColor: colors.protein },
                ]}
              />
            </View>
          </View>

          {/* Carbohidratos */}
          <View style={styles.macroItem}>
            <View style={styles.macroLabelRow}>
              <Text style={[styles.macroName, { color: colors.text }]}>Carbohidratos</Text>
              <Text style={[styles.macroValues, { color: colors.textSecondary }]}>
                <Text style={{ fontWeight: "700", color: colors.carbs }}>
                  {todayCarbs}g
                </Text>{" "}
                / {targetCarbs}g
              </Text>
            </View>
            <View style={styles.macroTrack}>
              <View
                style={[
                  styles.macroBar,
                  { width: `${carbsPct}%`, backgroundColor: colors.carbs },
                ]}
              />
            </View>
          </View>

          {/* Grasas */}
          <View style={styles.macroItem}>
            <View style={styles.macroLabelRow}>
              <Text style={[styles.macroName, { color: colors.text }]}>Grasas</Text>
              <Text style={[styles.macroValues, { color: colors.textSecondary }]}>
                <Text style={{ fontWeight: "700", color: colors.fat }}>
                  {todayFat}g
                </Text>{" "}
                / {targetFat}g
              </Text>
            </View>
            <View style={styles.macroTrack}>
              <View
                style={[
                  styles.macroBar,
                  { width: `${fatPct}%`, backgroundColor: colors.fat },
                ]}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Estado vacío o guía cuando no hay comidas registradas */}
      {isZeroData && (
        <TouchableOpacity
          style={[
            styles.emptyGuideBanner,
            {
              backgroundColor: colors.cardHighlight,
              borderColor: colors.cardBorder,
            },
          ]}
          onPress={() => router.push("/meals" as any)}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
          <Text style={[styles.emptyGuideText, { color: colors.primary }]}>
            Registra tu primera comida para activar tus macros
          </Text>
        </TouchableOpacity>
      )}
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
    marginBottom: 16,
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
  consumedMeta: {
    fontSize: 13,
    fontWeight: "600",
  },
  mainContentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  ringWrapper: {
    position: "relative",
    width: 90,
    height: 90,
    alignItems: "center",
    justifyContent: "center",
  },
  ringCenterText: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  ringBigNumber: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  ringSubLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: -1,
  },
  macrosList: {
    flex: 1,
    gap: 10,
  },
  macroItem: {
    gap: 4,
  },
  macroLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  macroName: {
    fontSize: 12,
    fontWeight: "600",
  },
  macroValues: {
    fontSize: 11,
  },
  macroTrack: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 3,
    overflow: "hidden",
  },
  macroBar: {
    height: "100%",
    borderRadius: 3,
  },
  emptyGuideBanner: {
    marginTop: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
  },
  emptyGuideText: {
    fontSize: 12,
    fontWeight: "700",
  },
});
