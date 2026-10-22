import { getWorkoutTheme } from "@/app/routines/PlayFreeRoutine";
import { useTheme } from "@/context/ThemeContext";
import { WeightUnit } from "@/store/conf";
import {
  calculateRIRPrescription,
  getGeminiCoachPrescription,
  RIRCoachPrescription,
} from "@/utils/rirCoachCalculator";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
  prescription: RIRCoachPrescription | null;
  exercise?: any;
  lastSession?: any;
  personalBest?: any;
  onApplyOption: (
    optionType: "A" | "topSet" | "backOff" | "cardio" | "sameWeight",
    appliedUnit: WeightUnit
  ) => void;
  userUnit?: WeightUnit;
}

export default function CoachRIRModal({
  visible,
  onClose,
  prescription,
  exercise,
  lastSession,
  personalBest,
  onApplyOption,
  userUnit = "kg",
}: Props) {
  const { colors } = useTheme();
  const UI_KIT = getWorkoutTheme(colors);

  const [activeUnit, setActiveUnit] = useState<WeightUnit>(
    prescription?.unit || userUnit || "kg"
  );

  useEffect(() => {
    if (prescription?.unit) {
      setActiveUnit(prescription.unit);
    } else if (userUnit) {
      setActiveUnit(userUnit);
    }
  }, [prescription?.unit, userUnit, visible]);

  // Recalcular dinámicamente si el usuario alterna la unidad en el modal
  const activePrescription = useMemo(() => {
    if (!prescription) return null;
    if (prescription.unit === activeUnit) return prescription;
    if (exercise) {
      return calculateRIRPrescription(exercise, lastSession, personalBest, activeUnit);
    }
    return prescription;
  }, [prescription, activeUnit, exercise, lastSession, personalBest]);

  const p = activePrescription || prescription;

  const [isLoadingGemini, setIsLoadingGemini] = useState(false);
  const [geminiAnalysis, setGeminiAnalysis] = useState<string | null>(null);
  const [showGemini, setShowGemini] = useState(false);

  if (!p) return null;

  const handleToggleUnit = (newUnit: WeightUnit) => {
    if (newUnit === activeUnit) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveUnit(newUnit);
  };

  const handleApply = (optionType: "A" | "topSet" | "backOff" | "cardio" | "sameWeight") => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onApplyOption(optionType, activeUnit);
    onClose();
  };

  const handleFetchGemini = async () => {
    setIsLoadingGemini(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const result = await getGeminiCoachPrescription(
        {
          id: p.exerciseId,
          nombre: p.exerciseName,
          musculo: "",
          objetivo: "",
          equipamiento: "",
        },
        lastSession || null,
        personalBest || {
          peso: p.bestWeightKg,
          reps: p.bestReps,
        },
        activeUnit
      );
      if (result) {
        setGeminiAnalysis(result);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setGeminiAnalysis(
          "⚠️ Configura tu API Key en Ajustes > IA para consultas en vivo."
        );
      }
    } catch {
      setGeminiAnalysis(
        "No se pudo conectar con el servicio de IA."
      );
    } finally {
      setIsLoadingGemini(false);
    }
  };

  const isGym = p.category === "Gym";
  const isFatigued = p.hasNeuralFatigue;
  const isLoadProgression = p.progressionType === "load";
  const isRepsProgression = p.progressionType === "reps";

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.overlay}>
        <TouchableOpacity style={s.backdropTap} activeOpacity={1} onPress={onClose} />

        <View style={[s.sheet, { backgroundColor: UI_KIT.bg }]}>
          {/* ── Drag handle ── */}
          <View style={s.handleRow}>
            <View style={[s.handle, { backgroundColor: UI_KIT.textSecondary + "40" }]} />
          </View>

          {/* ── Header: exercise name + badges + unit toggle + close ── */}
          <View style={s.header}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <View style={s.tagRow}>
                <View style={[s.dot, { backgroundColor: UI_KIT.accentOrange }]} />
                <Text style={[s.tag, { color: UI_KIT.accentOrange }]}>RIR COACH</Text>

                {isLoadProgression && (
                  <View style={[s.badgePill, { backgroundColor: "rgba(16,185,129,0.15)" }]}>
                    <Ionicons name="trending-up" size={10} color="#10b981" />
                    <Text style={[s.badgeText, { color: "#10b981" }]}>+Peso</Text>
                  </View>
                )}

                {isRepsProgression && (
                  <View style={[s.badgePill, { backgroundColor: "rgba(59,130,246,0.15)" }]}>
                    <Ionicons name="trending-up" size={10} color="#3b82f6" />
                    <Text style={[s.badgeText, { color: "#3b82f6" }]}>+Reps</Text>
                  </View>
                )}

                {isFatigued && (
                  <View style={[s.badgePill, { backgroundColor: "rgba(239,68,68,0.15)" }]}>
                    <Ionicons name="alert-circle" size={10} color="#ef4444" />
                    <Text style={[s.badgeText, { color: "#ef4444" }]}>Fatiga</Text>
                  </View>
                )}
              </View>
              <Text style={[s.exerciseName, { color: UI_KIT.textPrimary }]} numberOfLines={1}>
                {p.exerciseName}
              </Text>
            </View>

            {/* ── Segmented Unit Selector KG / LB ── */}
            <View
              style={{
                flexDirection: "row",
                backgroundColor: UI_KIT.card,
                borderRadius: 14,
                padding: 2,
                borderWidth: 1,
                borderColor: UI_KIT.cardBorder,
                marginRight: 8,
              }}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleToggleUnit("kg")}
                style={{
                  paddingHorizontal: 9,
                  paddingVertical: 5,
                  borderRadius: 12,
                  backgroundColor: activeUnit === "kg" ? UI_KIT.accentOrange : "transparent",
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "bold",
                    color: activeUnit === "kg" ? UI_KIT.onPrimary : UI_KIT.textMuted,
                  }}
                >
                  KG
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleToggleUnit("lb")}
                style={{
                  paddingHorizontal: 9,
                  paddingVertical: 5,
                  borderRadius: 12,
                  backgroundColor: activeUnit === "lb" ? UI_KIT.accentOrange : "transparent",
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "bold",
                    color: activeUnit === "lb" ? UI_KIT.onPrimary : UI_KIT.textMuted,
                  }}
                >
                  LB
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[s.closeBtn, { backgroundColor: UI_KIT.card, borderColor: UI_KIT.cardBorder }]}
            >
              <Ionicons name="close" size={16} color={UI_KIT.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={s.scrollBody}
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* ── Quick stats row ── */}
            <View style={[s.statsRow, { backgroundColor: UI_KIT.card, borderColor: UI_KIT.cardBorder }]}>
              <View style={s.statCell}>
                <Text style={[s.statLabel, { color: UI_KIT.textSecondary }]}>PREVIO</Text>
                <Text style={[s.statValue, { color: UI_KIT.textPrimary }]} numberOfLines={1}>
                  {p.lastSessionSetsSummary}
                </Text>
              </View>
              <View style={[s.statDivider, { backgroundColor: UI_KIT.cardBorder }]} />
              <View style={s.statCell}>
                <Text style={[s.statLabel, { color: UI_KIT.textSecondary }]}>ESTRATEGIA</Text>
                <Text
                  style={[
                    s.statValue,
                    {
                      color: isLoadProgression
                        ? "#10b981"
                        : isFatigued
                          ? "#ef4444"
                          : UI_KIT.accentOrange,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {isLoadProgression
                    ? "Subir Carga"
                    : isRepsProgression
                      ? "Añadir Reps"
                      : isFatigued
                        ? "Control Fatiga"
                        : "Calibración"}
                </Text>
              </View>
              <View style={[s.statDivider, { backgroundColor: UI_KIT.cardBorder }]} />
              <View style={s.statCell}>
                <Text style={[s.statLabel, { color: UI_KIT.textSecondary }]}>DESCANSO</Text>
                <View style={s.inlineRow}>
                  <Ionicons name="time-outline" size={11} color={UI_KIT.accentOrange} />
                  <Text style={[s.statValue, { color: UI_KIT.textPrimary }]} numberOfLines={1}>
                    {p.recommendedRest}
                  </Text>
                </View>
              </View>
            </View>

            {/* ── Coach Insight / Diagnosis ── */}
            {p.diagnosis ? (
              <View style={[s.diagnosisBox, { backgroundColor: UI_KIT.card, borderColor: UI_KIT.cardBorder }]}>
                <View style={s.inlineRow}>
                  <Ionicons
                    name={
                      isLoadProgression
                        ? "trending-up"
                        : isFatigued
                          ? "alert-circle"
                          : "sparkles"
                    }
                    size={13}
                    color={
                      isLoadProgression
                        ? "#10b981"
                        : isFatigued
                          ? "#ef4444"
                          : UI_KIT.accentOrange
                    }
                  />
                  <Text
                    style={[
                      s.diagnosisTitle,
                      {
                        color:
                          isLoadProgression
                            ? "#10b981"
                            : isFatigued
                              ? "#ef4444"
                              : UI_KIT.accentOrange,
                      },
                    ]}
                  >
                    {isLoadProgression
                      ? "SOBRECARGA EN CARGA (+PESO)"
                      : isRepsProgression
                        ? "SOBRECARGA EN REPETICIONES (+REPS)"
                        : isFatigued
                          ? "GESTIÓN DE FATIGA NEURAL"
                          : "ORIENTACIÓN DEL COACH"}
                  </Text>
                </View>
                <Text style={[s.diagnosisText, { color: UI_KIT.textPrimary }]}>
                  {p.diagnosis}
                </Text>
              </View>
            ) : null}

            {/* ── Option A Card ── */}
            <View style={[s.optionCard, { backgroundColor: UI_KIT.inset, borderColor: UI_KIT.insetBorder }]}>
              <View style={s.optionTop}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.optionTitle, { color: UI_KIT.textPrimary }]}>
                    {p.optionA.title}
                  </Text>
                  <Text style={[s.optionScheme, { color: UI_KIT.accentOrange }]}>
                    {p.optionA.scheme}
                  </Text>
                  {p.optionA.subTitle ? (
                    <Text style={[s.optionSubTitle, { color: UI_KIT.textSecondary }]}>
                      {p.optionA.subTitle}
                    </Text>
                  ) : null}
                </View>
                <View style={[s.rirBadge, { backgroundColor: UI_KIT.card, borderColor: UI_KIT.cardBorder }]}>
                  <Text style={[s.rirBadgeText, { color: UI_KIT.accentOrange }]}>
                    {p.optionA.targetRIR}
                  </Text>
                </View>
              </View>

              {p.sameWeightOption ? (
                /* Botón Dual: Subir Carga vs Mantener Peso (+Reps) */
                <View style={s.dualBtnRow}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleApply("A")}
                    style={[s.applyChip, { flex: 1.2, backgroundColor: UI_KIT.accentOrange }]}
                  >
                    <Ionicons name="arrow-up" size={13} color={UI_KIT.onPrimary} />
                    <Text style={[s.applyChipText, { color: UI_KIT.onPrimary }]}>
                      Subir Carga
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleApply("sameWeight")}
                    style={[
                      s.applyChip,
                      {
                        flex: 1,
                        backgroundColor: UI_KIT.card,
                        borderWidth: 1,
                        borderColor: UI_KIT.cardBorder,
                      },
                    ]}
                  >
                    <Ionicons name="repeat" size={13} color={UI_KIT.textPrimary} />
                    <Text style={[s.applyChipText, { color: UI_KIT.textPrimary }]} numberOfLines={1}>
                      {p.sameWeightOption.targetWeightDisplay} {activeUnit} (+Reps)
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={s.optionBottom}>
                  <View style={s.inlineRow}>
                    <Ionicons name="timer-outline" size={10} color={UI_KIT.textSecondary} />
                    <Text style={[s.optionRest, { color: UI_KIT.textSecondary }]}>
                      {p.optionA.restTime}
                    </Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleApply("A")}
                    style={[s.applyChip, { backgroundColor: UI_KIT.accentOrange }]}
                  >
                    <Ionicons name="checkmark" size={13} color={UI_KIT.onPrimary} />
                    <Text style={[s.applyChipText, { color: UI_KIT.onPrimary }]}>Aplicar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* ── Option B Card ── */}
            {isGym && p.optionB.topSet ? (
              <View style={[s.optionCard, { backgroundColor: UI_KIT.inset, borderColor: UI_KIT.insetBorder }]}>
                <View style={s.optionTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.optionTitle, { color: UI_KIT.textPrimary }]}>
                      {p.optionB.title}
                    </Text>
                    <Text style={[s.optionScheme, { color: UI_KIT.accentCoral }]}>
                      {p.optionB.scheme}
                    </Text>
                    {p.optionB.subTitle ? (
                      <Text style={[s.optionSubTitle, { color: UI_KIT.textSecondary }]}>
                        {p.optionB.subTitle}
                      </Text>
                    ) : null}
                  </View>
                  <View style={[s.rirBadge, { backgroundColor: UI_KIT.card, borderColor: UI_KIT.cardBorder }]}>
                    <Text style={[s.rirBadgeText, { color: UI_KIT.accentCoral }]}>
                      {p.optionB.targetRIR}
                    </Text>
                  </View>
                </View>
                <View style={s.dualBtnRow}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleApply("topSet")}
                    style={[s.applyChip, { flex: 1, backgroundColor: UI_KIT.accentCoral }]}
                  >
                    <Ionicons name="flame" size={12} color={UI_KIT.onPrimary} />
                    <Text style={[s.applyChipText, { color: UI_KIT.onPrimary }]}>Top Set</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleApply("backOff")}
                    style={[s.applyChip, { flex: 1, backgroundColor: UI_KIT.card, borderWidth: 1, borderColor: UI_KIT.cardBorder }]}
                  >
                    <Ionicons name="refresh" size={12} color={UI_KIT.textPrimary} />
                    <Text style={[s.applyChipText, { color: UI_KIT.textPrimary }]}>Back-off</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleApply("cardio")}
                style={[s.optionCard, { backgroundColor: UI_KIT.inset, borderColor: UI_KIT.insetBorder }]}
              >
                <View style={s.optionTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.optionTitle, { color: UI_KIT.textPrimary }]}>
                      {p.optionB.title}
                    </Text>
                    <Text style={[s.optionScheme, { color: UI_KIT.accentCoral }]}>
                      {p.optionB.scheme}
                    </Text>
                    {p.optionB.subTitle ? (
                      <Text style={[s.optionSubTitle, { color: UI_KIT.textSecondary }]}>
                        {p.optionB.subTitle}
                      </Text>
                    ) : null}
                  </View>
                  <View style={[s.rirBadge, { backgroundColor: UI_KIT.card, borderColor: UI_KIT.cardBorder }]}>
                    <Text style={[s.rirBadgeText, { color: UI_KIT.accentCoral }]}>
                      {p.optionB.targetRIR}
                    </Text>
                  </View>
                </View>
                <View style={s.optionBottom}>
                  <View style={s.inlineRow}>
                    <Ionicons name="timer-outline" size={10} color={UI_KIT.textSecondary} />
                    <Text style={[s.optionRest, { color: UI_KIT.textSecondary }]}>
                      {p.optionB.restTime}
                    </Text>
                  </View>
                  <View style={[s.applyChip, { backgroundColor: UI_KIT.accentCoral }]}>
                    <Ionicons name="checkmark" size={13} color={UI_KIT.onPrimary} />
                    <Text style={[s.applyChipText, { color: UI_KIT.onPrimary }]}>Aplicar</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}

            {/* ── Gemini AI footer ── */}
            <View style={s.geminiFooter}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  if (!geminiAnalysis && !showGemini) {
                    setShowGemini(true);
                    handleFetchGemini();
                  } else {
                    setShowGemini(!showGemini);
                  }
                }}
                style={[s.geminiToggle, { backgroundColor: UI_KIT.card, borderColor: UI_KIT.cardBorder }]}
              >
                {isLoadingGemini ? (
                  <ActivityIndicator size="small" color={UI_KIT.accentOrange} />
                ) : (
                  <Ionicons name="sparkles" size={13} color={UI_KIT.accentOrange} />
                )}
                <Text style={[s.geminiToggleText, { color: UI_KIT.textSecondary }]}>
                  {isLoadingGemini ? "Analizando..." : "Coach IA"}
                </Text>
                {!isLoadingGemini && (
                  <Ionicons
                    name={showGemini ? "chevron-down" : "chevron-forward"}
                    size={12}
                    color={UI_KIT.textSecondary}
                  />
                )}
              </TouchableOpacity>

              {showGemini && geminiAnalysis && (
                <View style={[s.geminiOutput, { borderColor: UI_KIT.cardBorder }]}>
                  <Text style={[s.geminiOutputText, { color: UI_KIT.textSecondary }]}>
                    {geminiAnalysis}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdropTap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === "ios" ? 36 : 20,
    maxHeight: "85%",
  },
  handleRow: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },

  /* ── Header ── */
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 12,
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  tag: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  fatiguePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 4,
  },
  fatigueText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#ef4444",
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: "800",
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  /* ── Quick stats ── */
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  statCell: {
    flex: 1,
    gap: 1,
  },
  statLabel: {
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 12,
    fontWeight: "700",
  },
  statDivider: {
    width: 1,
    height: 22,
    marginHorizontal: 10,
  },
  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  /* ── Scroll body ── */
  scrollBody: {
    maxHeight: "100%",
  },
  scrollContent: {
    paddingBottom: 24,
  },

  /* ── Badges ── */
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "700",
  },

  /* ── Diagnosis box ── */
  diagnosisBox: {
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
    gap: 6,
  },
  diagnosisTitle: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  diagnosisText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "500",
  },
  optionSubTitle: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },

  /* ── Option card ── */
  optionCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  optionTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  optionTitle: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 2,
  },
  optionScheme: {
    fontSize: 14,
    fontWeight: "800",
  },
  rirBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    marginLeft: 8,
  },
  rirBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  optionBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionRest: {
    fontSize: 10,
    fontWeight: "600",
  },
  applyChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 4,
  },
  applyChipText: {
    fontSize: 11,
    fontWeight: "800",
  },
  dualBtnRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },

  /* ── Gemini footer ── */
  geminiFooter: {
    marginHorizontal: 16,
    marginTop: 4,
  },
  geminiToggle: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  geminiToggleText: {
    fontSize: 11,
    fontWeight: "600",
  },
  geminiOutput: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  geminiOutputText: {
    fontSize: 11,
    lineHeight: 16,
  },
});