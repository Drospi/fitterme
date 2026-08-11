import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

export type WorkoutReminderConfig = {
  enabled: boolean;
  time: string; // "08:30"
  days: number[]; // 1 = Lunes, 7 = Domingo
};

export type WeeklyReportReminderConfig = {
  enabled: boolean;
  time: string; // "20:00"
  dayOfWeek: number; // 1 = Lunes ... 7 = Domingo
};

export type MeasuresReminderConfig = {
  enabled: boolean;
  time: string; // "09:00"
  type: "weekly" | "monthly";
  dayOfWeek: number; // 1..7 (si es semanal)
  dayOfMonth: number; // 1..31 (si es mensual)
};

export type NotificationSettings = {
  workout: WorkoutReminderConfig;
  weeklyReport: WeeklyReportReminderConfig;
  measures: MeasuresReminderConfig;
};

const NOTIFICATIONS_SETTINGS_KEY = "NotificationSettings_v1";

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  workout: {
    enabled: true,
    time: "08:30",
    days: [1, 2, 3, 4, 5],
  },
  weeklyReport: {
    enabled: true,
    time: "20:00",
    dayOfWeek: 7, // Domingo
  },
  measures: {
    enabled: true,
    time: "09:00",
    type: "weekly",
    dayOfWeek: 1, // Lunes
    dayOfMonth: 1,
  },
};

// Configurar comportamiento predeterminado de notificaciones en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const getNotificationSettings = async (): Promise<NotificationSettings> => {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATIONS_SETTINGS_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_SETTINGS;
    return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(raw) };
  } catch (error) {
    console.error("Error al cargar configuración de notificaciones:", error);
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
};

export const saveNotificationSettings = async (
  newSettings: Partial<NotificationSettings>
): Promise<NotificationSettings> => {
  try {
    const current = await getNotificationSettings();
    const updated = { ...current, ...newSettings };
    await AsyncStorage.setItem(NOTIFICATIONS_SETTINGS_KEY, JSON.stringify(updated));

    // Re-programar notificaciones locales
    await rescheduleNotifications(updated);

    return updated;
  } catch (error) {
    console.error("Error al guardar notificaciones:", error);
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
};

export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === "granted";
  } catch (error) {
    console.error("Error pidiendo permisos de notificacion:", error);
    return false;
  }
};

export const rescheduleNotifications = async (settings: NotificationSettings) => {
  try {
    const granted = await requestNotificationPermissions();
    if (!granted) return;

    // Cancelar notificaciones programadas previas
    await Notifications.cancelAllScheduledNotificationsAsync();

    // 1. Programar Recordatorios de Entrenamiento
    if (settings.workout.enabled && settings.workout.days.length > 0) {
      const [hour, minute] = settings.workout.time.split(":").map(Number);

      for (const dayOfWeek of settings.workout.days) {
        const expoDay = dayOfWeek === 7 ? 1 : dayOfWeek + 1;

        await Notifications.scheduleNotificationAsync({
          content: {
            title: "🏋️ ¡Hora de Entrenar en FitterMe!",
            body: "Mantén tu racha activa y supera tus marcas de hoy. ¡A entrenar!",
            sound: true,
          },
          trigger: {
            hour,
            minute,
            weekday: expoDay,
            repeats: true,
          } as any,
        });
      }
    }

    // 2. Programar Resumen Semanal
    if (settings.weeklyReport.enabled) {
      const [hour, minute] = settings.weeklyReport.time.split(":").map(Number);
      const expoDay = settings.weeklyReport.dayOfWeek === 7 ? 1 : settings.weeklyReport.dayOfWeek + 1;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "📊 Tu Resumen Semanal FitterMe está Listo",
          body: "Descubre tus récords superados, días de dieta cumplidos y consejos para la próxima semana.",
          sound: true,
          data: { screen: "/reports/weekly" },
        },
        trigger: {
          hour,
          minute,
          weekday: expoDay,
          repeats: true,
        } as any,
      });
    }

    // 3. Programar Recordatorio de Actualización de Medidas
    if (settings.measures.enabled) {
      const [hour, minute] = settings.measures.time.split(":").map(Number);

      if (settings.measures.type === "weekly") {
        const expoDay = settings.measures.dayOfWeek === 7 ? 1 : settings.measures.dayOfWeek + 1;
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "📏 ¡Hora de Actualizar tus Medidas!",
            body: "Registra tu peso y pliegues para ver el avance de tu porcentaje de grasa y masa magra.",
            sound: true,
            data: { screen: "/measures/measures" },
          },
          trigger: {
            hour,
            minute,
            weekday: expoDay,
            repeats: true,
          } as any,
        });
      } else {
        // Mensual
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "📏 Medición Mensual FitterMe",
            body: "Revisa tu progreso mensual de peso y medidas corporales.",
            sound: true,
            data: { screen: "/measures/measures" },
          },
          trigger: {
            hour,
            minute,
            day: Math.min(28, settings.measures.dayOfMonth || 1),
            repeats: true,
          } as any,
        });
      }
    }
  } catch (error) {
    console.error("Error al reprogramar notificaciones:", error);
  }
};
