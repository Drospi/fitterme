import { useTheme } from "@/context/ThemeContext";
import { Routine } from "@/store/routines";
import {
  assignRestToDay,
  assignRoutineToDay,
  DAY_NAMES,
  DaySchedule,
  getWeeklySchedule,
  ORDERED_DAYS,
  unassignDay,
} from "@/store/weeklySchedule";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface TodayWorkoutCardProps {
  routine: Routine | null;
  todaySchedule: DaySchedule;
  allRoutines: Routine[];
  todayDayOfWeek: number;
  onRefresh: () => void;
}

export default function TodayWorkoutCard({
  routine,
  todaySchedule,
  allRoutines,
  todayDayOfWeek,
  onRefresh,
}: TodayWorkoutCardProps) {
  const { colors } = useTheme();

  // Modal para asignar rutina o descanso a un día
  const [isScheduleModalVisible, setIsScheduleModalVisible] = useState(false);
  const [selectedDayToEdit, setSelectedDayToEdit] = useState<number>(todayDayOfWeek);
  const [weeklySchedule, setWeeklySchedule] = useState<Record<number, DaySchedule>>({});

  useEffect(() => {
    loadWeeklySchedule();
  }, [todaySchedule]);

  const loadWeeklySchedule = async () => {
    const data = await getWeeklySchedule();
    setWeeklySchedule(data);
  };

  const todayName = DAY_NAMES[todayDayOfWeek] || "Hoy";

  const handleStartWorkout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (routine && routine.id) {
      router.push(`/routines/PlayRoutine/${routine.id}` as any);
    } else {
      router.push("/routines/PlayFreeRoutine" as any);
    }
  };

  const handleOpenAssignModal = (dayOfWeek?: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDayToEdit(dayOfWeek !== undefined ? dayOfWeek : todayDayOfWeek);
    setIsScheduleModalVisible(true);
  };

  const handleSelectRoutineForDay = async (r: Routine) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await assignRoutineToDay(selectedDayToEdit, r.id, r.name);
    await loadWeeklySchedule();
    setIsScheduleModalVisible(false);
    onRefresh();
  };

  const handleSelectRestForDay = async (dayToSet: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await assignRestToDay(dayToSet);
    await loadWeeklySchedule();
    setIsScheduleModalVisible(false);
    onRefresh();
  };

  const handleUnassignDay = async (dayToClear: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await unassignDay(dayToClear);
    await loadWeeklySchedule();
    setIsScheduleModalVisible(false);
    onRefresh();
  };

  // CASO 1: HOY ESTÁ ASIGNADO COMO DÍA DE DESCANSO
  if (todaySchedule.type === "rest") {
    return (
      <View
        style={[
          styles.featuredCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.rest,
          },
        ]}
      >
        <View style={styles.badgeRow}>
          <View
            style={[
              styles.restBadge,
              { backgroundColor: colors.rest + "20", borderColor: colors.rest + "40" },
            ]}
          >
            <Ionicons name="leaf" size={14} color={colors.rest} />
            <Text style={[styles.restBadgeText, { color: colors.rest }]}>
              DÍA DE DESCANSO • {todayName.toUpperCase()}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => handleOpenAssignModal(todayDayOfWeek)}
            style={styles.switchButton}
          >
            <Text style={[styles.switchButtonText, { color: colors.textSecondary }]}>
              Cambiar día
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          Recuperación y Crecimiento Muscular
        </Text>

        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Hoy tienes programado descanso. Los músculos crecen y se reparan durante
          el reposo. Hidrátate con abundante agua, mantén tu ingesta de proteínas y
          duerme al menos 7-8 horas.
        </Text>

        <View style={styles.restTipsRow}>
          <View style={styles.restTipItem}>
            <Ionicons name="water-outline" size={16} color={colors.rest} />
            <Text style={[styles.restTipText, { color: colors.text }]}>Hidratación</Text>
          </View>
          <View style={styles.restTipItem}>
            <Ionicons name="moon-outline" size={16} color={colors.rest} />
            <Text style={[styles.restTipText, { color: colors.text }]}>Sueño 8h</Text>
          </View>
          <View style={styles.restTipItem}>
            <Ionicons name="walk-outline" size={16} color={colors.rest} />
            <Text style={[styles.restTipText, { color: colors.text }]}>Paseo Suave</Text>
          </View>
        </View>

        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.primary, flex: 1 }]}
            onPress={() => handleOpenAssignModal(todayDayOfWeek)}
            activeOpacity={0.8}
          >
            <Ionicons name="swap-horizontal" size={18} color={colors.primary} />
            <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
              Asignar rutina a hoy
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.calendarIconBtn, { borderColor: colors.cardBorder }]}
            onPress={() => handleOpenAssignModal()}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar-outline" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

        {renderScheduleModal()}
      </View>
    );
  }

  // CASO 2: HOY TIENE UNA RUTINA ASIGNADA
  if (todaySchedule.type === "routine" && routine) {
    const exerciseCount = routine.exercises?.length || 4;
    const estimatedMinutes = Math.max(30, exerciseCount * 8);

    return (
      <View
        style={[
          styles.featuredCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.primary,
          },
        ]}
      >
        <View style={styles.badgeRow}>
          <View style={[styles.neonBadge, { backgroundColor: colors.primary }]}>
            <Ionicons name="flash" size={14} color={colors.background} />
            <Text style={[styles.neonBadgeText, { color: colors.background }]}>
              ENTRENAMIENTO DE HOY • {todayName.toUpperCase()}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => handleOpenAssignModal(todayDayOfWeek)}
            style={styles.switchButton}
          >
            <Text style={[styles.switchButtonText, { color: colors.textSecondary }]}>
              Cambiar
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          {routine.name}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaPill}>
            <Ionicons name="time-outline" size={16} color={colors.primary} />
            <Text style={[styles.metaText, { color: colors.text }]}>
              ~{estimatedMinutes} min
            </Text>
          </View>
          <View style={styles.metaPill}>
            <Ionicons name="barbell-outline" size={16} color={colors.primary} />
            <Text style={[styles.metaText, { color: colors.text }]}>
              {exerciseCount} ejercicios
            </Text>
          </View>
          <View style={styles.metaPill}>
            <Ionicons name="trending-up-outline" size={16} color={colors.primary} />
            <Text style={[styles.metaText, { color: colors.text }]}>
              Sobrecarga
            </Text>
          </View>
        </View>

        {/* Botón principal grande y llamativo */}
        <TouchableOpacity
          style={[styles.bigButton, { backgroundColor: colors.primary }]}
          onPress={handleStartWorkout}
          activeOpacity={0.85}
        >
          <Ionicons name="play" size={20} color={colors.background} />
          <Text style={[styles.bigButtonText, { color: colors.background }]}>
            Empezar rutina
          </Text>
        </TouchableOpacity>

        {/* Opciones secundarias: Planificar semana o Marcar como descanso */}
        <View style={styles.subActionsRow}>
          <TouchableOpacity
            style={styles.subActionItem}
            onPress={() => handleSelectRestForDay(todayDayOfWeek)}
          >
            <Ionicons name="leaf-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.subActionText, { color: colors.textSecondary }]}>
              Pasar a día de descanso
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.subActionItem}
            onPress={() => handleOpenAssignModal()}
          >
            <Ionicons name="calendar-outline" size={14} color={colors.primary} />
            <Text style={[styles.subActionText, { color: colors.primary }]}>
              Plan semanal
            </Text>
          </TouchableOpacity>
        </View>

        {renderScheduleModal()}
      </View>
    );
  }

  // CASO 3: HOY NO TIENE RUTINA ASIGNADA
  const hasCreatedRoutines = allRoutines.length > 0;

  return (
    <View
      style={[
        styles.featuredCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <View style={styles.badgeRow}>
        <View
          style={[
            styles.unassignedBadge,
            { backgroundColor: colors.cardHighlight, borderColor: colors.cardBorder },
          ]}
        >
          <Ionicons name="calendar" size={14} color={colors.primary} />
          <Text style={[styles.unassignedBadgeText, { color: colors.primary }]}>
            HOY • {todayName.toUpperCase()}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => handleSelectRestForDay(todayDayOfWeek)}
          style={styles.switchButton}
        >
          <Text style={[styles.switchButtonText, { color: colors.textSecondary }]}>
            Marcar descanso
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.title, { color: colors.text }]}>
        {hasCreatedRoutines
          ? `¿Deseas asignar una rutina a este ${todayName}?`
          : "¿Deseas crear una rutina?"}
      </Text>

      <Text style={[styles.description, { color: colors.textSecondary }]}>
        {hasCreatedRoutines
          ? "Tienes rutinas listas en tu biblioteca. Elige cuál deseas entrenar hoy o programa tus días de descanso."
          : "Aún no tienes rutinas registradas. Crea tu primer entrenamiento o genera uno adaptado a tus objetivos."}
      </Text>

      {hasCreatedRoutines ? (
        <View style={{ gap: 10 }}>
          <TouchableOpacity
            style={[styles.bigButton, { backgroundColor: colors.primary }]}
            onPress={() => handleOpenAssignModal(todayDayOfWeek)}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle" size={20} color={colors.background} />
            <Text style={[styles.bigButtonText, { color: colors.background }]}>
              Asignar rutina a hoy
            </Text>
          </TouchableOpacity>

          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: colors.cardBorder, flex: 1 }]}
              onPress={() => handleSelectRestForDay(todayDayOfWeek)}
              activeOpacity={0.8}
            >
              <Ionicons name="leaf-outline" size={16} color={colors.rest} />
              <Text style={[styles.secondaryButtonText, { color: colors.rest }]}>
                Hoy es mi día de descanso
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.calendarIconBtn, { borderColor: colors.cardBorder }]}
              onPress={() => handleOpenAssignModal()}
              activeOpacity={0.8}
            >
              <Ionicons name="calendar-outline" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          <TouchableOpacity
            style={[styles.bigButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/routines/CreateRoutineScreen" as any)}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={22} color={colors.background} />
            <Text style={[styles.bigButtonText, { color: colors.background }]}>
              + Crear mi primera rutina
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.cardBorder }]}
            onPress={() => router.push("/routines/PlayFreeRoutine" as any)}
            activeOpacity={0.8}
          >
            <Ionicons name="flash-outline" size={18} color={colors.text} />
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
              O entrenar sesión libre ahora
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {renderScheduleModal()}
    </View>
  );

  // RENDER DEL MODAL PARA ASIGNAR RUTINAS O DÍAS DE DESCANSO
  function renderScheduleModal() {
    const editDayName = DAY_NAMES[selectedDayToEdit] || "Día";

    return (
      <Modal
        visible={isScheduleModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsScheduleModalVisible(false)}
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
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Planificador de Rutinas
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  Asigna qué entrenas cada día de la semana
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsScheduleModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Selector de los 7 días de la semana */}
            <View style={styles.weekDaysPickerRow}>
              {ORDERED_DAYS.map((dayNum) => {
                const isSelected = selectedDayToEdit === dayNum;
                const isToday = dayNum === todayDayOfWeek;
                const assignment = weeklySchedule[dayNum];
                const isRest = assignment?.type === "rest";
                const isRoutine = assignment?.type === "routine";

                return (
                  <TouchableOpacity
                    key={dayNum}
                    style={[
                      styles.dayTab,
                      isSelected && {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      },
                      !isSelected && {
                        backgroundColor: colors.background,
                        borderColor: isToday ? colors.primary + "60" : colors.cardBorder,
                      },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedDayToEdit(dayNum);
                    }}
                  >
                    <Text
                      style={[
                        styles.dayTabText,
                        {
                          color: isSelected
                            ? colors.background
                            : isToday
                            ? colors.primary
                            : colors.text,
                          fontWeight: isSelected || isToday ? "800" : "600",
                        },
                      ]}
                    >
                      {DAY_NAMES[dayNum].slice(0, 3)}
                    </Text>

                    {/* Indicador de qué hay asignado */}
                    <View
                      style={[
                        styles.miniIndicator,
                        {
                          backgroundColor: isSelected
                            ? colors.background
                            : isRoutine
                            ? colors.primary
                            : isRest
                            ? colors.rest
                            : "transparent",
                        },
                      ]}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 320 }}
              contentContainerStyle={{ paddingVertical: 8 }}
            >
              {/* Encabezado del día seleccionado */}
              <View style={styles.dayStatusBanner}>
                <Text style={[styles.dayStatusTitle, { color: colors.text }]}>
                  Opciones para {editDayName}:
                </Text>
                {weeklySchedule[selectedDayToEdit]?.type === "routine" && (
                  <Text style={[styles.dayStatusActive, { color: colors.primary }]}>
                    Asignado: {weeklySchedule[selectedDayToEdit]?.routineName}
                  </Text>
                )}
                {weeklySchedule[selectedDayToEdit]?.type === "rest" && (
                  <Text style={[styles.dayStatusActive, { color: colors.rest }]}>
                    Asignado: Día de descanso
                  </Text>
                )}
              </View>

              {/* Botón: Asignar Descanso a este día */}
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  {
                    backgroundColor: colors.background,
                    borderColor:
                      weeklySchedule[selectedDayToEdit]?.type === "rest"
                        ? colors.rest
                        : colors.cardBorder,
                  },
                ]}
                onPress={() => handleSelectRestForDay(selectedDayToEdit)}
              >
                <View
                  style={[
                    styles.optionIconCircle,
                    { backgroundColor: colors.rest + "20" },
                  ]}
                >
                  <Ionicons name="leaf" size={18} color={colors.rest} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>
                    Día de descanso
                  </Text>
                  <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>
                    Pausa para recuperación muscular
                  </Text>
                </View>
                {weeklySchedule[selectedDayToEdit]?.type === "rest" && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.rest} />
                )}
              </TouchableOpacity>

              {/* Lista de Rutinas creadas para asignar */}
              {allRoutines.length > 0 ? (
                <>
                  <Text
                    style={[
                      styles.sectionDividerText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    O selecciona una de tus rutinas:
                  </Text>

                  {allRoutines.map((r) => {
                    const isCurrent =
                      weeklySchedule[selectedDayToEdit]?.type === "routine" &&
                      weeklySchedule[selectedDayToEdit]?.routineId === r.id;

                    return (
                      <TouchableOpacity
                        key={r.id}
                        style={[
                          styles.optionButton,
                          {
                            backgroundColor: colors.background,
                            borderColor: isCurrent
                              ? colors.primary
                              : colors.cardBorder,
                          },
                        ]}
                        onPress={() => handleSelectRoutineForDay(r)}
                      >
                        <View
                          style={[
                            styles.optionIconCircle,
                            { backgroundColor: colors.primary + "20" },
                          ]}
                        >
                          <Ionicons
                            name="barbell"
                            size={18}
                            color={colors.primary}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.optionTitle, { color: colors.text }]}>
                            {r.name}
                          </Text>
                          <Text
                            style={[
                              styles.optionDesc,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {r.exercises?.length || 0} ejercicios • {r.category || "General"}
                          </Text>
                        </View>
                        {isCurrent && (
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color={colors.primary}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.createPromptBox,
                    {
                      borderColor: colors.primary,
                      backgroundColor: colors.cardHighlight,
                    },
                  ]}
                  onPress={() => {
                    setIsScheduleModalVisible(false);
                    router.push("/routines/CreateRoutineScreen" as any);
                  }}
                >
                  <Ionicons name="add-circle" size={24} color={colors.primary} />
                  <Text style={[styles.createPromptText, { color: colors.text }]}>
                    No tienes rutinas creadas aún. Pulsa aquí para crear una.
                  </Text>
                </TouchableOpacity>
              )}

              {/* Botón para desasignar / limpiar día */}
              {weeklySchedule[selectedDayToEdit]?.type !== "unassigned" && (
                <TouchableOpacity
                  style={styles.clearDayButton}
                  onPress={() => handleUnassignDay(selectedDayToEdit)}
                >
                  <Text style={styles.clearDayText}>
                    Dejar {editDayName} sin asignación
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  }
}

const styles = StyleSheet.create({
  featuredCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    borderWidth: 2,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  neonBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  neonBadgeText: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  restBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  restBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  unassignedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  unassignedBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  switchButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  switchButtonText: {
    fontSize: 12,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  title: {
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: 10,
    lineHeight: 27,
  },
  description: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 19,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 18,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  metaText: {
    fontSize: 13,
    fontWeight: "600",
  },
  bigButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
    width: "100%",
    elevation: 3,
  },
  bigButtonText: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  restTipsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  restTipItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  restTipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  actionButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  secondaryButton: {
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
    paddingHorizontal: 12,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: "800",
  },
  calendarIconBtn: {
    borderWidth: 1.5,
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  subActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  subActionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 4,
  },
  subActionText: {
    fontSize: 12,
    fontWeight: "600",
  },
  // Modal de Asignación Semanal
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
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: "800",
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  weekDaysPickerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
    gap: 4,
  },
  dayTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  dayTabText: {
    fontSize: 11,
  },
  miniIndicator: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 4,
  },
  dayStatusBanner: {
    marginBottom: 12,
  },
  dayStatusTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  dayStatusActive: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  optionIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  optionDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  sectionDividerText: {
    fontSize: 12,
    fontWeight: "600",
    marginVertical: 10,
  },
  createPromptBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: "dashed",
    marginVertical: 10,
  },
  createPromptText: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
    lineHeight: 18,
  },
  clearDayButton: {
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  clearDayText: {
    fontSize: 13,
    color: "#FF4D4D",
    fontWeight: "600",
  },
});
