import TimePickerModal from "@/components/TimePickerModal";
import { useTheme } from "@/context/ThemeContext";
import {
  getNotificationSettings,
  NotificationSettings,
  saveNotificationSettings,
} from "@/store/notificationsConfig";
import { getGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

const WEEKDAYS = [
  { label: "Lun", value: 1 },
  { label: "Mar", value: 2 },
  { label: "Mié", value: 3 },
  { label: "Jue", value: 4 },
  { label: "Vie", value: 5 },
  { label: "Sáb", value: 6 },
  { label: "Dom", value: 7 },
];

export default function NotificationsSettingsScreen() {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const router = useRouter();

  const [settings, setSettings] = useState<NotificationSettings>({
    workout: { enabled: true, time: "08:30", days: [1, 2, 3, 4, 5] },
    weeklyReport: { enabled: true, time: "20:00", dayOfWeek: 7 },
    measures: { enabled: true, time: "09:00", type: "weekly", dayOfWeek: 1, dayOfMonth: 1 },
  });

  // Estado para el TimePicker Modal
  const [timePickerTarget, setTimePickerTarget] = useState<"workout" | "weeklyReport" | "measures" | null>(null);

  const loadSettings = async () => {
    const data = await getNotificationSettings();
    setSettings(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [])
  );

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = await saveNotificationSettings(newSettings);
    setSettings(updated);
    Toast.show({
      type: "success",
      text1: "Notificaciones Guardadas",
      text2: "Los recordatorios locales se han actualizado correctamente.",
    });
  };

  const toggleWorkoutDay = (dayVal: number) => {
    const currentDays = settings.workout.days;
    const exists = currentDays.includes(dayVal);
    const newDays = exists
      ? currentDays.filter((d) => d !== dayVal)
      : [...currentDays, dayVal].sort();

    updateSettings({
      workout: { ...settings.workout, days: newDays },
    });
  };

  const handleSelectTime = (timeString: string) => {
    if (!timePickerTarget) return;

    if (timePickerTarget === "workout") {
      updateSettings({
        workout: { ...settings.workout, time: timeString },
      });
    } else if (timePickerTarget === "weeklyReport") {
      updateSettings({
        weeklyReport: { ...settings.weeklyReport, time: timeString },
      });
    } else if (timePickerTarget === "measures") {
      updateSettings({
        measures: { ...settings.measures, time: timeString },
      });
    }

    setTimePickerTarget(null);
  };

  const activeInitialTime =
    timePickerTarget === "workout"
      ? settings.workout.time
      : timePickerTarget === "weeklyReport"
      ? settings.weeklyReport.time
      : timePickerTarget === "measures"
      ? settings.measures.time
      : "08:30";

  const activeTitle =
    timePickerTarget === "workout"
      ? "Hora de Entrenamiento"
      : timePickerTarget === "weeklyReport"
      ? "Hora de Resumen Semanal"
      : timePickerTarget === "measures"
      ? "Hora de Mediciones"
      : "Seleccionar Hora";

  return (
    <View style={globalStyles.container}>
      {/* Header */}
      <View style={globalStyles.header}>
        <Ionicons
          name="arrow-back"
          size={24}
          color={colors.text}
          onPress={() => router.back()}
        />
        <Text style={globalStyles.title}>Notificaciones</Text>
        <Ionicons name="notifications" size={24} color={colors.primary} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* 1. RECORDATORIO DE ENTRENAMIENTO */}
        <View style={{ marginVertical: 15 }}>
          <Text style={{ fontWeight: "bold", fontSize: 16, color: colors.primary, marginBottom: 10, letterSpacing: 1 }}>
            RECORDATORIO DE ENTRENAMIENTO
          </Text>

          <View style={[globalStyles.card, { gap: 16 }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={globalStyles.text}>Notificar días de entrenamiento</Text>
                <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                  Te recuerda entrenar a la hora y días seleccionados
                </Text>
              </View>
              <Switch
                value={settings.workout.enabled}
                onValueChange={(val) =>
                  updateSettings({ workout: { ...settings.workout, enabled: val } })
                }
                trackColor={{ false: colors.background, true: colors.primary }}
              />
            </View>

            {settings.workout.enabled && (
              <>
                {/* Selector de Hora con Reloj */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: 10,
                    borderTopWidth: 1,
                    borderTopColor: colors.background,
                  }}
                >
                  <Text style={globalStyles.cardText}>Hora del recordatorio</Text>

                  <TouchableOpacity
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      backgroundColor: colors.surface,
                      borderColor: colors.primary + "60",
                      borderWidth: 1,
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                    }}
                    onPress={() => setTimePickerTarget("workout")}
                  >
                    <Ionicons name="time-outline" size={18} color={colors.primary} />
                    <Text style={{ fontWeight: "bold", fontSize: 16, color: colors.primary }}>
                      {settings.workout.time}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Selector de Días */}
                <View style={{ paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.background }}>
                  <Text style={[globalStyles.cardText, { marginBottom: 10 }]}>Días a notificar:</Text>
                  <View style={{ flexDirection: "row", gap: 6, justifyContent: "space-between" }}>
                    {WEEKDAYS.map((day) => {
                      const isSelected = settings.workout.days.includes(day.value);
                      return (
                        <TouchableOpacity
                          key={day.value}
                          style={{
                            flex: 1,
                            paddingVertical: 10,
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: isSelected ? colors.primary : colors.textSecondary + "40",
                            backgroundColor: isSelected ? colors.primary : colors.surface,
                            alignItems: "center",
                          }}
                          onPress={() => toggleWorkoutDay(day.value)}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: "bold",
                              color: isSelected ? colors.background : colors.text,
                            }}
                          >
                            {day.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {/* 2. RESUMEN SEMANAL */}
        <View style={{ marginBottom: 15 }}>
          <Text style={{ fontWeight: "bold", fontSize: 16, color: colors.primary, marginBottom: 10, letterSpacing: 1 }}>
            RESUMEN SEMANAL DE RENDIMIENTO
          </Text>

          <View style={[globalStyles.card, { gap: 16 }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={globalStyles.text}>Notificación de Resumen Semanal</Text>
                <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                  Da un vistazo de tus récords, dieta y consejos semanales
                </Text>
              </View>
              <Switch
                value={settings.weeklyReport.enabled}
                onValueChange={(val) =>
                  updateSettings({ weeklyReport: { ...settings.weeklyReport, enabled: val } })
                }
                trackColor={{ false: colors.background, true: colors.primary }}
              />
            </View>

            {settings.weeklyReport.enabled && (
              <>
                {/* Selector de Día de la Semana */}
                <View style={{ paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.background }}>
                  <Text style={[globalStyles.cardText, { marginBottom: 10 }]}>Día de entrega:</Text>
                  <View style={{ flexDirection: "row", gap: 6, justifyContent: "space-between" }}>
                    {WEEKDAYS.map((day) => {
                      const isSelected = settings.weeklyReport.dayOfWeek === day.value;
                      return (
                        <TouchableOpacity
                          key={day.value}
                          style={{
                            flex: 1,
                            paddingVertical: 10,
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: isSelected ? colors.primary : colors.textSecondary + "40",
                            backgroundColor: isSelected ? colors.primary : colors.surface,
                            alignItems: "center",
                          }}
                          onPress={() =>
                            updateSettings({
                              weeklyReport: { ...settings.weeklyReport, dayOfWeek: day.value },
                            })
                          }
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: "bold",
                              color: isSelected ? colors.background : colors.text,
                            }}
                          >
                            {day.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Selector de Hora con Reloj */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: 10,
                    borderTopWidth: 1,
                    borderTopColor: colors.background,
                  }}
                >
                  <Text style={globalStyles.cardText}>Hora de notificación</Text>

                  <TouchableOpacity
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      backgroundColor: colors.surface,
                      borderColor: colors.primary + "60",
                      borderWidth: 1,
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                    }}
                    onPress={() => setTimePickerTarget("weeklyReport")}
                  >
                    <Ionicons name="time-outline" size={18} color={colors.primary} />
                    <Text style={{ fontWeight: "bold", fontSize: 16, color: colors.primary }}>
                      {settings.weeklyReport.time}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Botón Ver Resumen Semanal Directo */}
            <TouchableOpacity
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.primary,
                borderWidth: 1.5,
                borderRadius: 12,
                paddingVertical: 12,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginTop: 4,
              }}
              onPress={() => router.push("/reports/weekly")}
            >
              <Ionicons name="sparkles" size={18} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: "bold", fontSize: 14 }}>
                👁️ Ver Resumen Semanal Actual
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. RECORDATORIO DE MEDIDAS */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontWeight: "bold", fontSize: 16, color: colors.primary, marginBottom: 10, letterSpacing: 1 }}>
            ACTUALIZACIÓN DE MEDIDAS
          </Text>

          <View style={[globalStyles.card, { gap: 16 }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={globalStyles.text}>Recordatorio para medirte</Text>
                <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                  Notificación periódica para registrar tu peso y pliegues
                </Text>
              </View>
              <Switch
                value={settings.measures.enabled}
                onValueChange={(val) =>
                  updateSettings({ measures: { ...settings.measures, enabled: val } })
                }
                trackColor={{ false: colors.background, true: colors.primary }}
              />
            </View>

            {settings.measures.enabled && (
              <>
                {/* Tipo de Frecuencia */}
                <View style={{ paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.background }}>
                  <Text style={[globalStyles.cardText, { marginBottom: 10 }]}>Frecuencia:</Text>
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor:
                          settings.measures.type === "weekly"
                            ? colors.primary
                            : colors.textSecondary + "40",
                        backgroundColor:
                          settings.measures.type === "weekly"
                            ? colors.primary
                            : colors.surface,
                        alignItems: "center",
                      }}
                      onPress={() =>
                        updateSettings({
                          measures: { ...settings.measures, type: "weekly" },
                        })
                      }
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "bold",
                          color:
                            settings.measures.type === "weekly"
                              ? colors.background
                              : colors.text,
                        }}
                      >
                        Una vez a la semana
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor:
                          settings.measures.type === "monthly"
                            ? colors.primary
                            : colors.textSecondary + "40",
                        backgroundColor:
                          settings.measures.type === "monthly"
                            ? colors.primary
                            : colors.surface,
                        alignItems: "center",
                      }}
                      onPress={() =>
                        updateSettings({
                          measures: { ...settings.measures, type: "monthly" },
                        })
                      }
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "bold",
                          color:
                            settings.measures.type === "monthly"
                              ? colors.background
                              : colors.text,
                        }}
                      >
                        Una vez al mes
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Selección Día Semanal o Día del Mes */}
                {settings.measures.type === "weekly" ? (
                  <View style={{ paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.background }}>
                    <Text style={[globalStyles.cardText, { marginBottom: 10 }]}>Día de la semana:</Text>
                    <View style={{ flexDirection: "row", gap: 6, justifyContent: "space-between" }}>
                      {WEEKDAYS.map((day) => {
                        const isSelected = settings.measures.dayOfWeek === day.value;
                        return (
                          <TouchableOpacity
                            key={day.value}
                            style={{
                              flex: 1,
                              paddingVertical: 10,
                              borderRadius: 10,
                              borderWidth: 1,
                              borderColor: isSelected ? colors.primary : colors.textSecondary + "40",
                              backgroundColor: isSelected ? colors.primary : colors.surface,
                              alignItems: "center",
                            }}
                            onPress={() =>
                              updateSettings({
                                measures: { ...settings.measures, dayOfWeek: day.value },
                              })
                            }
                          >
                            <Text
                              style={{
                                fontSize: 12,
                                fontWeight: "bold",
                                color: isSelected ? colors.background : colors.text,
                              }}
                            >
                              {day.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ) : (
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingTop: 10,
                      borderTopWidth: 1,
                      borderTopColor: colors.background,
                    }}
                  >
                    <Text style={globalStyles.cardText}>Día del mes (1 - 28)</Text>
                    <TextInput
                      value={String(settings.measures.dayOfMonth || 1)}
                      keyboardType="numeric"
                      style={[
                        globalStyles.input,
                        {
                          marginBottom: 0,
                          height: 38,
                          width: 70,
                          textAlign: "center",
                          fontSize: 16,
                          fontWeight: "bold",
                        },
                      ]}
                      onChangeText={(text) => {
                        const parsed = parseInt(text) || 1;
                        setSettings({
                          ...settings,
                          measures: { ...settings.measures, dayOfMonth: Math.min(28, Math.max(1, parsed)) },
                        });
                      }}
                      onBlur={() => updateSettings({ measures: settings.measures })}
                    />
                  </View>
                )}

                {/* Selector de Hora con Reloj */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: 10,
                    borderTopWidth: 1,
                    borderTopColor: colors.background,
                  }}
                >
                  <Text style={globalStyles.cardText}>Hora del recordatorio</Text>

                  <TouchableOpacity
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      backgroundColor: colors.surface,
                      borderColor: colors.primary + "60",
                      borderWidth: 1,
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                    }}
                    onPress={() => setTimePickerTarget("measures")}
                  >
                    <Ionicons name="time-outline" size={18} color={colors.primary} />
                    <Text style={{ fontWeight: "bold", fontSize: 16, color: colors.primary }}>
                      {settings.measures.time}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Modal Selector de Hora con Reloj Digital */}
      <TimePickerModal
        visible={timePickerTarget !== null}
        onClose={() => setTimePickerTarget(null)}
        onSelectTime={handleSelectTime}
        initialTime={activeInitialTime}
        title={activeTitle}
      />
    </View>
  );
}
