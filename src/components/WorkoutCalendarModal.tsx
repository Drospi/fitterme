import { useTheme } from "@/context/ThemeContext";
import { toDisplayWeight, WeightUnit } from "@/store/conf";
import { RoutineSession } from "@/store/historyRoutine";
import { getGlobalStyles } from "@/styles/global";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  sessions: RoutineSession[];
  unit: WeightUnit;
  initialDate?: string;
};

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default function WorkoutCalendarModal({
  visible,
  onClose,
  sessions,
  unit,
  initialDate,
}: Props) {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const router = useRouter();

  // Fecha visible en el mes (año y mes)
  const [currentDate, setCurrentDate] = useState(() => {
    return initialDate ? new Date(initialDate) : new Date();
  });

  // Día seleccionado en formato YYYY-MM-DD
  const [selectedDayKey, setSelectedDayKey] = useState<string>(() => {
    const today = initialDate ? new Date(initialDate) : new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });

  // Mapear sesiones por fecha local "YYYY-MM-DD"
  const sessionsByDateKey = useMemo(() => {
    const map: Record<string, RoutineSession[]> = {};

    sessions.forEach((s) => {
      const d = new Date(s.date);
      if (isNaN(d.getTime())) return;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const key = `${y}-${m}-${day}`;

      if (!map[key]) map[key] = [];
      map[key].push(s);
    });

    return map;
  }, [sessions]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });

  // Días del mes actual
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Primer día de la semana (0 = Domingo, adaptado para Lunes = 0)
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;

  const handlePrevMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleSelectDay = (dayNum: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const mStr = String(month + 1).padStart(2, "0");
    const dStr = String(dayNum).padStart(2, "0");
    setSelectedDayKey(`${year}-${mStr}-${dStr}`);
  };

  const selectedSessions = sessionsByDateKey[selectedDayKey] || [];

  const formattedSelectedDateText = useMemo(() => {
    const parts = selectedDayKey.split("-");
    if (parts.length !== 3) return selectedDayKey;
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return d.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }, [selectedDayKey]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[globalStyles.container, { flex: 1 }]}>
        {/* Header del Modal */}
        <View style={[globalStyles.header, { marginBottom: 10 }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Ionicons name="calendar-outline" size={26} color={colors.primary} />
            <Text style={[globalStyles.title, { fontSize: 20 }]}>
              Calendario de Entrenamientos
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
            <Ionicons name="close-circle" size={30} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {/* Navegación por Mes */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginVertical: 10,
              backgroundColor: colors.surface,
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 14,
            }}
          >
            <TouchableOpacity onPress={handlePrevMonth} style={{ padding: 6 }}>
              <Ionicons name="chevron-back" size={22} color={colors.primary} />
            </TouchableOpacity>

            <Text
              style={{
                fontSize: 16,
                fontWeight: "bold",
                color: colors.text,
                textTransform: "capitalize",
              }}
            >
              {monthName}
            </Text>

            <TouchableOpacity onPress={handleNextMonth} style={{ padding: 6 }}>
              <Ionicons name="chevron-forward" size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Días de la semana */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-around",
              marginBottom: 8,
            }}
          >
            {WEEKDAYS.map((wd) => (
              <Text
                key={wd}
                style={{
                  width: 40,
                  textAlign: "center",
                  fontSize: 12,
                  fontWeight: "bold",
                  color: colors.textSecondary,
                }}
              >
                {wd}
              </Text>
            ))}
          </View>

          {/* Rejilla del Calendario */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 8,
              marginBottom: 20,
            }}
          >
            {/* Celdas vacías iniciales */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <View key={`empty-${i}`} style={styles.dayCell} />
            ))}

            {/* Celdas para cada día del mes */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const mStr = String(month + 1).padStart(2, "0");
              const dStr = String(dayNum).padStart(2, "0");
              const dateKey = `${year}-${mStr}-${dStr}`;

              const hasWorkout = !!sessionsByDateKey[dateKey];
              const isSelected = selectedDayKey === dateKey;

              return (
                <TouchableOpacity
                  key={`day-${dayNum}`}
                  style={[
                    styles.dayCell,
                    isSelected && {
                      backgroundColor: colors.primary + "30",
                      borderColor: colors.primary,
                      borderWidth: 1.5,
                      borderRadius: 10,
                    },
                  ]}
                  onPress={() => handleSelectDay(dayNum)}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: isSelected || hasWorkout ? "bold" : "normal",
                      color: isSelected ? colors.primary : colors.text,
                    }}
                  >
                    {dayNum}
                  </Text>

                  {/* Puntito de entrenamiento */}
                  {hasWorkout && (
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: colors.primary,
                        marginTop: 4,
                      }}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Sección de Entrenamientos del Día Seleccionado */}
          <View style={[globalStyles.card, { marginBottom: 30 }]}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="fitness-outline" size={22} color={colors.primary} />
                <Text
                  style={[
                    globalStyles.cardTitle,
                    { fontSize: 16, fontWeight: "bold", marginBottom: 0, textTransform: "capitalize" },
                  ]}
                >
                  {formattedSelectedDateText}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: colors.primary + "20",
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 10,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "bold", color: colors.primary }}>
                  {selectedSessions.length} sesio{selectedSessions.length === 1 ? "n" : "nes"}
                </Text>
              </View>
            </View>

            {selectedSessions.length === 0 ? (
              <View style={{ paddingVertical: 16, alignItems: "center" }}>
                <Ionicons name="barbell-outline" size={32} color={colors.textSecondary} />
                <Text style={[globalStyles.cardText, { marginTop: 6, textAlign: "center" }]}>
                  No se registraron entrenamientos en este día.
                </Text>
              </View>
            ) : (
              selectedSessions.map((session) => {
                const volume = toDisplayWeight(session.totalVolume, unit);
                return (
                  <View
                    key={session.id}
                    style={{
                      backgroundColor: colors.background,
                      padding: 12,
                      borderRadius: 12,
                      marginBottom: 10,
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.text }}>
                        {session.name}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                        ⏱️ {Math.floor(session.duration / 60)} min • 🏋️ {volume.toLocaleString()} {unit}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        backgroundColor: colors.primary,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 16,
                      }}
                      onPress={() => {
                        onClose();
                        router.push({
                          pathname: "/routines/DetailsRoutine/[id]",
                          params: { id: session.id },
                        });
                      }}
                    >
                      <Text style={{ color: colors.background, fontWeight: "bold", fontSize: 12 }}>
                        Ver detalles
                      </Text>
                      <Ionicons name="chevron-forward" size={14} color={colors.background} />
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dayCell: {
    width: "14.28%", // 100% / 7 dias
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 2,
  },
});
