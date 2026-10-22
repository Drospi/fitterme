import { useTheme } from "@/context/ThemeContext";
import { getLatestSanitizedMeasure, Measure } from "@/store/measures";
import {
  calculateMuscleIntensity,
  calculateNavyBodyFat,
  getDevelopmentLevelInfo,
} from "@/utils/musclePhysiology";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  LayoutChangeEvent,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Body from "react-native-body-highlighter";

interface BodyHeatmapProps {
  refreshTrigger?: number;
}

type MuscleDetailInfo = {
  name: string;
  field: keyof Measure;
  value: number;
  level: number;
  levelLabel: string;
  levelDesc: string;
  advice: string;
  iconName: string;
};

const MUSCLE_ADVICE: Record<
  string,
  { name: string; field: keyof Measure; advice: string; iconName: string }
> = {
  chest: {
    name: "Pecho / Pectorales",
    field: "pecho",
    advice: "Press de banca, flexiones o aperturas. Controla la bajada para máxima activación y desarrollo del torso.",
    iconName: "shield-outline",
  },
  biceps: {
    name: "Bíceps",
    field: "biceps",
    advice: "Curls con mancuernas o barra. Mantén los codos pegados al cuerpo y aprieta un segundo en el punto más alto.",
    iconName: "fitness-outline",
  },
  triceps: {
    name: "Tríceps",
    field: "biceps",
    advice: "Fondos en paralelas o extensiones en polea. El tríceps aporta el 60% del volumen del brazo.",
    iconName: "fitness-outline",
  },
  quadriceps: {
    name: "Cuádriceps",
    field: "cuadriceps",
    advice: "Sentadillas y prensa de piernas. Bajar de forma profunda y controlada estimula todas las fibras.",
    iconName: "barbell-outline",
  },
  hamstring: {
    name: "Isquiotibiales",
    field: "cuadriceps",
    advice: "Peso muerto rumano y curls femorales. Clave para proteger las rodillas y dar equilibrio a la pierna.",
    iconName: "barbell-outline",
  },
  gluteal: {
    name: "Glúteos",
    field: "gluteos",
    advice: "Hip thrusts y zancadas profundas. Es el grupo muscular más potente y base de la fuerza corporal.",
    iconName: "walk-outline",
  },
  calves: {
    name: "Gemelos / Pantorrillas",
    field: "gemelos",
    advice: "Elevaciones de talón con pausa de 2 segundos arriba. Responden mejor a repeticiones altas y lentas.",
    iconName: "footsteps-outline",
  },
  "upper-back": {
    name: "Espalda Alta / Dorsales",
    field: "espalda",
    advice: "Dominadas o jalón al pecho para dar amplitud en V; remos con mancuerna para ganar grosor.",
    iconName: "airplane-outline",
  },
  "lower-back": {
    name: "Espalda Baja / Lumbar",
    field: "espalda",
    advice: "Extensiones lumbares y peso muerto con técnica limpia para proteger tu columna.",
    iconName: "body-outline",
  },
  trapezius: {
    name: "Trapecios",
    field: "espalda",
    advice: "Encogimientos de hombros con mancuernas y paseos del granjero.",
    iconName: "triangle-outline",
  },
  deltoids: {
    name: "Hombros / Deltoides",
    field: "hombros",
    advice: "Elevaciones laterales y press militar para dar amplitud atlética a tus hombros.",
    iconName: "expand-outline",
  },
  abs: {
    name: "Abdomen / Core",
    field: "cintura",
    advice: "Planchas y elevaciones de piernas para estabilidad. La definición se logra con tu déficit calórico.",
    iconName: "flame-outline",
  },
  obliques: {
    name: "Oblicuos",
    field: "cintura",
    advice: "Rotaciones rusas y planchas laterales para fortalecer el contorno de la cintura.",
    iconName: "sync-outline",
  },
  forearm: {
    name: "Antebrazos",
    field: "antebrazo",
    advice: "Paseos de granjero y flexiones de muñeca. Mejorarán tu agarre en todos los ejercicios pesados.",
    iconName: "hand-left-outline",
  },
  neck: {
    name: "Cuello",
    field: "cuello",
    advice: "Ejercicios isométricos suaves y mantener una buena postura al trabajar.",
    iconName: "shield-checkmark-outline",
  },
};

export default function BodyHeatmap({ refreshTrigger }: BodyHeatmapProps = {}) {
  const { colors, isDark } = useTheme();
  const [latestMeasures, setLatestMeasures] = useState<Measure | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(
    Dimensions.get("window").width - 32
  );
  const scrollViewRef = useRef<ScrollView>(null);

  const [selectedMuscle, setSelectedMuscle] = useState<MuscleDetailInfo | null>(
    null
  );

  const loadData = async () => {
    const data = await getLatestSanitizedMeasure();
    setLatestMeasures(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  if (!latestMeasures) {
    return null;
  }

  const isFemale =
    (latestMeasures.sexo || "masculino").toLowerCase() === "femenino";

  const muscleMap: { field: keyof Measure; slugs: string[] }[] = [
    { field: "pecho", slugs: ["chest"] },
    { field: "biceps", slugs: ["biceps", "triceps"] },
    { field: "cuadriceps", slugs: ["quadriceps", "hamstring"] },
    { field: "gluteos", slugs: ["gluteal"] },
    { field: "gemelos", slugs: ["calves"] },
    { field: "espalda", slugs: ["upper-back", "lower-back", "trapezius"] },
    { field: "antebrazo", slugs: ["forearm"] },
    { field: "hombros", slugs: ["deltoids"] },
    { field: "cintura", slugs: ["abs", "obliques"] },
    { field: "cuello", slugs: ["neck"] },
  ];

  const bodyData: { slug: string; intensity: number }[] = [];

  muscleMap.forEach((m) => {
    const val = Number(latestMeasures[m.field]) || 0;
    if (val > 0) {
      const intensity = calculateMuscleIntensity(
        m.field,
        val,
        latestMeasures
      );
      m.slugs.forEach((slug) => {
        bodyData.push({ slug, intensity });
      });
    }
  });

  if (bodyData.length === 0) return null;

  // Escala de colores según intensidad (1 a 4) adaptada al tema
  const colorScale = [
    colors.primary + "30", // 1: Base (<72% del potencial)
    colors.primary + "65", // 2: Intermedio (72-83% del potencial)
    colors.primary + "A5", // 3: Fuerte (84-93% del potencial)
    colors.primary,        // 4: Élite (≥94% del potencial)
  ];

  const estimatedFat = calculateNavyBodyFat(latestMeasures);

  const legendItems = [1, 2, 3, 4].map((lvl) => ({
    level: lvl,
    color: colorScale[lvl - 1],
    ...getDevelopmentLevelInfo(lvl),
  }));

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - containerWidth) > 5) {
      setContainerWidth(w);
    }
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / (containerWidth || 1));
    if (page !== activeIndex && (page === 0 || page === 1)) {
      setActiveIndex(page);
    }
  };

  const scrollToPage = (pageIndex: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveIndex(pageIndex);
    scrollViewRef.current?.scrollTo({
      x: pageIndex * containerWidth,
      animated: true,
    });
  };

  const handleBodyPartPress = (bodyPart: any) => {
    const slug = bodyPart?.slug as string;
    if (!slug) return;

    // Solo considerar partes que son grupos musculares medibles
    const info = MUSCLE_ADVICE[slug];
    if (!info) {
      // Partes no medibles como manos, pies, cabeza, etc. -> no mostrar nada
      return;
    }

    const val = Number(latestMeasures[info.field]) || 0;
    // Si el músculo no ha sido medido todavía (valor 0 o no registrado), no mostrar el modal
    if (val <= 0) {
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const level = calculateMuscleIntensity(info.field, val, latestMeasures);
    const levelInfo = getDevelopmentLevelInfo(level);

    setSelectedMuscle({
      name: info.name,
      field: info.field,
      value: val,
      level,
      levelLabel: levelInfo.label,
      levelDesc: levelInfo.desc,
      advice: info.advice,
      iconName: info.iconName,
    });
  };

  return (
    <View
      onLayout={handleLayout}
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <Ionicons name="body" size={20} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>
            Mapa de desarrollo muscular
          </Text>
        </View>
      </View>

      <Text
        style={{
          color: colors.textSecondary,
          fontSize: 12,
          textAlign: "center",
          marginBottom: 10,
          lineHeight: 16,
          paddingHorizontal: 8,
        }}
      >
        Evaluado según tu potencial genético natural (altura{" "}
        {latestMeasures.altura || 175} cm, ~{estimatedFat}% grasa).
      </Text>

      {/* Indicador de toque interactivo */}
      <View
        style={[
          styles.tapTipBanner,
          {
            backgroundColor: colors.cardHighlight,
            borderColor: colors.cardBorder,
          },
        ]}
      >
        <Ionicons name="finger-print-outline" size={14} color={colors.primary} />
        <Text style={[styles.tapTipText, { color: colors.primary }]}>
          Toca cualquier músculo medido para ver su detalle y consejos
        </Text>
      </View>

      {/* Selector de pestañas Frente / Espalda */}
      <View
        style={{
          flexDirection: "row",
          backgroundColor: colors.background,
          borderRadius: 20,
          padding: 3,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: colors.cardBorder,
        }}
      >
        <TouchableOpacity
          onPress={() => scrollToPage(0)}
          style={{
            paddingVertical: 6,
            paddingHorizontal: 20,
            borderRadius: 16,
            backgroundColor: activeIndex === 0 ? colors.primary : "transparent",
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "bold",
              color: activeIndex === 0 ? colors.background : colors.textSecondary,
            }}
          >
            FRENTE
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => scrollToPage(1)}
          style={{
            paddingVertical: 6,
            paddingHorizontal: 20,
            borderRadius: 16,
            backgroundColor: activeIndex === 1 ? colors.primary : "transparent",
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "bold",
              color: activeIndex === 1 ? colors.background : colors.textSecondary,
            }}
          >
            ESPALDA
          </Text>
        </TouchableOpacity>
      </View>

      {/* Carrusel Deslizante Frente / Espalda */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled={true}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={containerWidth}
        snapToAlignment="center"
        onScroll={handleScroll}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={{ width: containerWidth }}
        contentContainerStyle={{ width: containerWidth * 2 }}
      >
        <View style={[styles.bodySlide, { width: containerWidth }]}>
          <Body
            data={bodyData as any}
            gender={isFemale ? "female" : "male"}
            side="front"
            scale={1.1}
            colors={colorScale}
            defaultFill={isDark ? "#2A2A35" : "#E0E0E0"}
            onBodyPartPress={handleBodyPartPress}
          />
        </View>

        <View style={[styles.bodySlide, { width: containerWidth }]}>
          <Body
            data={bodyData as any}
            gender={isFemale ? "female" : "male"}
            side="back"
            scale={1.1}
            colors={colorScale}
            defaultFill={isDark ? "#2A2A35" : "#E0E0E0"}
            onBodyPartPress={handleBodyPartPress}
          />
        </View>
      </ScrollView>

      {/* 2 Puntitos Indicadores de Paginación */}
      <View style={styles.paginationDotsContainer}>
        <TouchableOpacity
          onPress={() => scrollToPage(0)}
          activeOpacity={0.7}
          style={[
            styles.dot,
            {
              width: activeIndex === 0 ? 20 : 8,
              backgroundColor:
                activeIndex === 0 ? colors.primary : colors.textSecondary + "40",
            },
          ]}
        />
        <TouchableOpacity
          onPress={() => scrollToPage(1)}
          activeOpacity={0.7}
          style={[
            styles.dot,
            {
              width: activeIndex === 1 ? 20 : 8,
              backgroundColor:
                activeIndex === 1 ? colors.primary : colors.textSecondary + "40",
            },
          ]}
        />
      </View>

      {/* Leyenda de Intensidades Fisiológicas */}
      <View style={styles.legendContainer}>
        {legendItems.map((item) => (
          <View key={item.level} style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                {
                  backgroundColor: item.color,
                  borderColor:
                    item.level === 4 ? colors.primary : "transparent",
                },
              ]}
            />
            <Text
              style={[
                styles.legendText,
                { color: colors.text, fontWeight: item.level >= 3 ? "700" : "500" },
              ]}
            >
              {item.emoji ? `${item.emoji} ` : ""}{item.label}
            </Text>
          </View>
        ))}
      </View>

      {/* MODAL DE DETALLE MUSCULAR */}
      <Modal
        visible={!!selectedMuscle}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedMuscle(null)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.primary,
              },
            ]}
          >
            {selectedMuscle && selectedMuscle.value > 0 && (
              <>
                <View style={styles.modalHeaderRow}>
                  <View style={styles.modalTitleRow}>
                    <Ionicons
                      name={(selectedMuscle.iconName as any) || "fitness-outline"}
                      size={24}
                      color={colors.primary}
                    />
                    <Text style={[styles.modalTitle, { color: colors.text }]}>
                      {selectedMuscle.name}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedMuscle(null)}
                    style={styles.modalCloseBtn}
                  >
                    <Ionicons name="close" size={22} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Datos del Músculo */}
                <View style={styles.muscleStatsRow}>
                  <View style={styles.muscleStatBox}>
                    <Text style={[styles.muscleStatLabel, { color: colors.textSecondary }]}>
                      Medida actual
                    </Text>
                    <Text style={[styles.muscleStatValue, { color: colors.text }]}>
                      {selectedMuscle.value > 0
                        ? `${selectedMuscle.value} cm`
                        : "Sin registrar"}
                    </Text>
                  </View>

                  <View style={styles.muscleStatBox}>
                    <Text style={[styles.muscleStatLabel, { color: colors.textSecondary }]}>
                      Nivel de desarrollo
                    </Text>
                    <View
                      style={[
                        styles.levelBadge,
                        {
                          backgroundColor:
                            selectedMuscle.level === 4
                              ? colors.primary
                              : colors.cardHighlight,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.levelBadgeText,
                          {
                            color:
                              selectedMuscle.level === 4
                                ? colors.background
                                : colors.primary,
                          },
                        ]}
                      >
                        {selectedMuscle.levelLabel} ({selectedMuscle.levelDesc})
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Consejo para Principiantes */}
                <View
                  style={[
                    styles.adviceBox,
                    {
                      backgroundColor: colors.cardHighlight,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                >
                  <View style={styles.adviceHeaderRow}>
                    <Ionicons name="bulb-outline" size={16} color={colors.primary} />
                    <Text style={[styles.adviceHeaderTitle, { color: colors.primary }]}>
                      Consejo de entrenamiento
                    </Text>
                  </View>
                  <Text style={[styles.adviceBodyText, { color: colors.text }]}>
                    {selectedMuscle.advice}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.modalConfirmBtn, { backgroundColor: colors.primary }]}
                  onPress={() => setSelectedMuscle(null)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.modalConfirmBtnText, { color: colors.background }]}
                  >
                    Entendido
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    borderWidth: 1,
    overflow: "hidden",
  },
  headerRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  titleWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
  },
  tapTipBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
  },
  tapTipText: {
    fontSize: 11,
    fontWeight: "600",
  },
  bodySlide: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
  },
  paginationDotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 6,
    marginBottom: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  legendContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(150, 150, 150, 0.15)",
    width: "100%",
    paddingHorizontal: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    flex: 1,
  },
  modalCloseBtn: {
    padding: 4,
  },
  muscleStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },
  muscleStatBox: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
  },
  muscleStatLabel: {
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 4,
  },
  muscleStatValue: {
    fontSize: 16,
    fontWeight: "800",
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  adviceBox: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    marginBottom: 18,
  },
  adviceHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  adviceHeaderTitle: {
    fontSize: 12,
    fontWeight: "700",
  },
  adviceBodyText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500",
  },
  modalConfirmBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalConfirmBtnText: {
    fontSize: 14,
    fontWeight: "800",
  },
});
