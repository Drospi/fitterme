import TimePickerModal from "@/components/TimePickerModal";
import { useTheme } from "@/context/ThemeContext";
import { getSettings, saveSettings, UserSettings } from "@/store/conf";
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  getNotificationSettings,
  MealReminderItem,
  NotificationSettings,
  saveNotificationSettings,
  sendTestNotification,
} from "@/store/notificationsConfig";
import { getGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
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

  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [userSettings, setUserSettings] = useState<UserSettings>({
    unit: "kg",
    weightIncrement: 2.5,
    defaultRestTimer: 90,
  });

  // Estado para el TimePicker Modal
  const [timePickerTarget, setTimePickerTarget] = useState<
    "workout" | "weeklyReport" | "measures" | { type: "meal"; mealId: string } | null
  >(null);
  const [testingNotification, setTestingNotification] = useState(false);

  const loadSettings = async () => {
    const [notifData, generalData] = await Promise.all([
      getNotificationSettings(),
      getSettings(),
    ]);
    setSettings(notifData);
    setUserSettings(generalData);
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

  const handleRestTimerChange = async (newTimer: number) => {
    if (newTimer === userSettings.defaultRestTimer) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = await saveSettings({ defaultRestTimer: newTimer });
    setUserSettings(updated);
    Toast.show({
      type: "success",
      text1: "Descanso Guardado",
      text2: `Temporizador y notificaciones de descanso configurados en ${
        newTimer >= 60
          ? newTimer % 60 === 0
            ? `${newTimer / 60} min`
            : `${(newTimer / 60).toFixed(1)} min`
          : `${newTimer}s`
      }.`,
    });
  };

  const handleTestNotification = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTestingNotification(true);
    const success = await sendTestNotification();
    setTestingNotification(false);

    if (success) {
      Toast.show({
        type: "success",
        text1: "Notificación Enviada",
        text2: "Comprueba la barra de notificaciones de tu dispositivo.",
      });
    } else {
      Toast.show({
        type: "error",
        text1: "Permiso Requerido",
        text2: "Por favor concede permisos de notificación en los ajustes de tu dispositivo.",
      });
    }
  };

  const toggleWorkoutDay = (dayVal: number) => {
    const currentDays = settings.workout?.days || [];
    const exists = currentDays.includes(dayVal);
    const newDays = exists
      ? currentDays.filter((d) => d !== dayVal)
      : [...currentDays, dayVal].sort();

    updateSettings({
      workout: { ...settings.workout, days: newDays },
    });
  };

  const toggleMealItem = (mealId: string) => {
    const times = settings.meals?.times || [];
    const updatedTimes = times.map((m) =>
      m.id === mealId ? { ...m, enabled: !m.enabled } : m
    );
    updateSettings({
      meals: { ...settings.meals, times: updatedTimes },
    });
  };

  const handleAddMealTime = () => {
    if (Alert.prompt) {
      Alert.prompt(
        "Nuevo Horario de Comida",
        "Ingresa el nombre para este recordatorio (ej. Merienda, Snack, Post-Entreno):",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Agregar",
            onPress: (text?: string) => {
              const label = (text || "").trim() || `Comida ${(settings.meals?.times?.length || 0) + 1}`;
              const newId = `meal_${Date.now()}`;
              const newTimes: MealReminderItem[] = [
                ...(settings.meals?.times || []),
                { id: newId, label, time: "16:00", enabled: true },
              ];
              updateSettings({
                meals: { ...settings.meals, times: newTimes },
              });
            },
          },
        ]
      );
    } else {
      const newId = `meal_${Date.now()}`;
      const newTimes: MealReminderItem[] = [
        ...(settings.meals?.times || []),
        {
          id: newId,
          label: `Comida ${(settings.meals?.times?.length || 0) + 1}`,
          time: "16:00",
          enabled: true,
        },
      ];
      updateSettings({
        meals: { ...settings.meals, times: newTimes },
      });
    }
  };

  const handleDeleteMealTime = (mealId: string) => {
    const times = settings.meals?.times || [];
    const updatedTimes = times.filter((m) => m.id !== mealId);
    updateSettings({
      meals: { ...settings.meals, times: updatedTimes },
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
    } else if (timePickerTarget && typeof timePickerTarget === "object" && timePickerTarget.type === "meal") {
      const targetMealId = timePickerTarget.mealId;
      const times = settings.meals?.times || [];
      const updatedTimes = times.map((m) =>
        m.id === targetMealId ? { ...m, time: timeString } : m
      );
      updateSettings({
        meals: { ...settings.meals, times: updatedTimes },
      });
    }

    setTimePickerTarget(null);
  };

  let activeInitialTime = "08:30";
  let activeTitle = "Seleccionar Hora";

  if (timePickerTarget === "workout") {
    activeInitialTime = settings.workout?.time || "08:30";
    activeTitle = "Hora de Entrenamiento";
  } else if (timePickerTarget === "weeklyReport") {
    activeInitialTime = settings.weeklyReport?.time || "20:00";
    activeTitle = "Hora de Resumen Semanal";
  } else if (timePickerTarget === "measures") {
    activeInitialTime = settings.measures?.time || "09:00";
    activeTitle = "Hora de Mediciones";
  } else if (timePickerTarget && typeof timePickerTarget === "object" && timePickerTarget.type === "meal") {
    const targetMealId = timePickerTarget.mealId;
    const meal = settings.meals?.times?.find((m) => m.id === targetMealId);
    activeInitialTime = meal?.time || "12:00";
    activeTitle = `Hora de ${meal?.label || "Comida"}`;
  }

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
        {/* BOTÓN PROBAR NOTIFICACIÓN INMEDIATA */}
        <View style={{ marginTop: 15, marginBottom: 5 }}>
          <TouchableOpacity
            onPress={handleTestNotification}
            disabled={testingNotification}
            style={[
              globalStyles.card,
              {
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: colors.primary + "20",
                borderWidth: 1.5,
                borderColor: colors.primary,
                paddingVertical: 14,
              },
            ]}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
              <Ionicons name="paper-plane" size={22} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "bold", fontSize: 15, color: colors.primary }}>
                  Probar Notificación Ahora
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                  Toca aquí para verificar que llegan las alertas
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

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
                Ver Resumen Semanal Actual
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

        {/* 4. RECORDATORIO DE COMIDAS / NUTRICIÓN */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontWeight: "bold", fontSize: 16, color: colors.primary, marginBottom: 10, letterSpacing: 1 }}>
            RECORDATORIOS DE COMIDAS Y DIETA
          </Text>

          <View style={[globalStyles.card, { gap: 16 }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={globalStyles.text}>Recordar registrar comidas</Text>
                <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                  Alertas diarias en tus horarios para ingresar alimentos, macros y calorías
                </Text>
              </View>
              <Switch
                value={settings.meals?.enabled ?? true}
                onValueChange={(val) =>
                  updateSettings({ meals: { ...settings.meals, enabled: val } })
                }
                trackColor={{ false: colors.background, true: colors.primary }}
              />
            </View>

            {settings.meals?.enabled && (
              <>
                <View style={{ paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.background, gap: 10 }}>
                  <Text style={[globalStyles.cardText, { marginBottom: 4 }]}>Horarios del día programados:</Text>

                  {(settings.meals?.times || []).map((meal) => (
                    <View
                      key={meal.id}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        backgroundColor: colors.surface,
                        paddingVertical: 10,
                        paddingHorizontal: 12,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: meal.enabled ? colors.primary + "40" : colors.textSecondary + "25",
                      }}
                    >
                      <TouchableOpacity
                        onPress={() => toggleMealItem(meal.id)}
                        style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}
                      >
                        <Ionicons
                          name={meal.enabled ? "checkmark-circle" : "ellipse-outline"}
                          size={22}
                          color={meal.enabled ? colors.primary : colors.textSecondary}
                        />
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: "bold",
                              color: meal.enabled ? colors.text : colors.textSecondary,
                            }}
                          >
                            {meal.label}
                          </Text>
                          <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                            {meal.enabled ? "Activo diariamente" : "Desactivado"}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <TouchableOpacity
                          disabled={!meal.enabled}
                          onPress={() => setTimePickerTarget({ type: "meal", mealId: meal.id })}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 5,
                            backgroundColor: meal.enabled ? colors.background : colors.surface,
                            borderColor: meal.enabled ? colors.primary : colors.textSecondary + "30",
                            borderWidth: 1,
                            borderRadius: 10,
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            opacity: meal.enabled ? 1 : 0.4,
                          }}
                        >
                          <Ionicons name="time-outline" size={16} color={colors.primary} />
                          <Text style={{ fontWeight: "bold", fontSize: 14, color: colors.primary }}>
                            {meal.time}
                          </Text>
                        </TouchableOpacity>

                        {(settings.meals?.times?.length || 0) > 1 && (
                          <TouchableOpacity
                            onPress={() => handleDeleteMealTime(meal.id)}
                            style={{ padding: 4 }}
                          >
                            <Ionicons name="trash-outline" size={18} color={colors.delete} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))}

                  {/* Botón Añadir Horario Personalizado */}
                  <TouchableOpacity
                    onPress={handleAddMealTime}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      backgroundColor: colors.surface,
                      borderColor: colors.primary + "50",
                      borderWidth: 1,
                      borderStyle: "dashed",
                      borderRadius: 12,
                      paddingVertical: 10,
                      marginTop: 4,
                    }}
                  >
                    <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                    <Text style={{ fontSize: 13, fontWeight: "bold", color: colors.primary }}>
                      Agregar Horario Personalizado
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Botón Acceso Rápido a Comidas */}
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
                  onPress={() => router.push("/(tabs)/meals")}
                >
                  <Ionicons name="fast-food" size={18} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontWeight: "bold", fontSize: 14 }}>
                    Ir a Registro de Comidas
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* 5. TIEMPO DE DESCANSO EN ENTRENAMIENTOS (SINCRONIZACIÓN DE TIMER) */}
        <View style={{ marginBottom: 25 }}>
          <Text style={{ fontWeight: "bold", fontSize: 16, color: colors.primary, marginBottom: 10, letterSpacing: 1 }}>
            TIEMPO DE DESCANSO (ENTRENAMIENTOS)
          </Text>

          <View style={[globalStyles.card, { gap: 14 }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Ionicons name="timer-outline" size={24} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={globalStyles.text}>Descanso automático entre series</Text>
                <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                  Tiempo predeterminado para el temporizador y la alerta de fin de descanso
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
              {[
                { label: "45s", value: 45 },
                { label: "90s", value: 90 },
                { label: "2 min", value: 120 },
                { label: "3 min", value: 180 },
              ].map((item) => {
                const isSelected = userSettings.defaultRestTimer === item.value;
                return (
                  <TouchableOpacity
                    key={item.value}
                    onPress={() => handleRestTimerChange(item.value)}
                    style={{
                      flex: 1,
                      borderRadius: 10,
                      paddingVertical: 10,
                      alignItems: "center",
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderWidth: 1.5,
                      borderColor: isSelected ? colors.primary : colors.textSecondary + "30",
                    }}
                  >
                    <Text
                      style={{
                        fontWeight: "bold",
                        fontSize: 13,
                        color: isSelected ? colors.background : colors.text,
                      }}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: 8,
                borderTopWidth: 1,
                borderTopColor: colors.background,
              }}
              onPress={() => router.push("/settings/timer")}
            >
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                Configuración detallada de temporizador
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
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
