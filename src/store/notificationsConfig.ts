import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

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

export type MealReminderItem = {
  id: string;
  label: string; // ej. "Desayuno", "Almuerzo", "Merienda", "Cena"
  time: string; // "09:00", "14:00", etc.
  enabled: boolean;
};

export type MealsReminderConfig = {
  enabled: boolean;
  times: MealReminderItem[];
};

export type NotificationSettings = {
  workout: WorkoutReminderConfig;
  weeklyReport: WeeklyReportReminderConfig;
  measures: MeasuresReminderConfig;
  meals: MealsReminderConfig;
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
  meals: {
    enabled: true,
    times: [
      { id: "breakfast", label: "Desayuno", time: "09:00", enabled: true },
      { id: "lunch", label: "Almuerzo", time: "14:00", enabled: true },
      { id: "snack", label: "Merienda", time: "17:30", enabled: false },
      { id: "dinner", label: "Cena", time: "21:00", enabled: true },
    ],
  },
};

// Configurar comportamiento predeterminado de notificaciones en primer plano (solo en plataformas nativas)
if (Platform.OS !== "web") {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (e) {
    console.warn("Notification handler registration skipped:", e);
  }
}

/**
 * Configura el canal de notificaciones en Android
 */
export const setupNotificationChannels = async () => {
  if (Platform.OS === "android") {
    try {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Recordatorios FitterMe",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#CCFF00",
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: false,
        sound: "default",
        enableLights: true,
        enableVibrate: true,
      });
    } catch (e) {
      console.warn("Error setting notification channel:", e);
    }
  }
};

export const getNotificationSettings = async (): Promise<NotificationSettings> => {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATIONS_SETTINGS_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      ...parsed,
      workout: { ...DEFAULT_NOTIFICATION_SETTINGS.workout, ...(parsed.workout || {}) },
      weeklyReport: { ...DEFAULT_NOTIFICATION_SETTINGS.weeklyReport, ...(parsed.weeklyReport || {}) },
      measures: { ...DEFAULT_NOTIFICATION_SETTINGS.measures, ...(parsed.measures || {}) },
      meals: {
        ...DEFAULT_NOTIFICATION_SETTINGS.meals,
        ...(parsed.meals || {}),
        times: Array.isArray(parsed?.meals?.times)
          ? parsed.meals.times
          : DEFAULT_NOTIFICATION_SETTINGS.meals.times,
      },
    };
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
    const updated: NotificationSettings = {
      ...current,
      ...newSettings,
      workout: newSettings.workout ? { ...current.workout, ...newSettings.workout } : current.workout,
      weeklyReport: newSettings.weeklyReport ? { ...current.weeklyReport, ...newSettings.weeklyReport } : current.weeklyReport,
      measures: newSettings.measures ? { ...current.measures, ...newSettings.measures } : current.measures,
      meals: newSettings.meals ? { ...current.meals, ...newSettings.meals } : current.meals,
    };
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
  if (Platform.OS === "web") return true;
  try {
    await setupNotificationChannels();
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = status;
    }

    return finalStatus === "granted";
  } catch (error) {
    console.error("Error pidiendo permisos de notificacion:", error);
    return false;
  }
};

/**
 * Envía una notificación de prueba inmediata
 */
export const sendTestNotification = async (): Promise<boolean> => {
  if (Platform.OS === "web") return true;
  try {
    const granted = await requestNotificationPermissions();
    if (!granted) return false;
    await setupNotificationChannels();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "FitterMe - Notificación de Prueba",
        body: "Las notificaciones locales están configuradas y funcionando correctamente.",
        sound: "default",
        data: { type: "test", screen: "/(tabs)/index" },
      },
      trigger: {
        channelId: "default",
      },
    });
    return true;
  } catch (error) {
    console.error("Error enviando notificacion de prueba:", error);
    return false;
  }
};

export const rescheduleNotifications = async (settings: NotificationSettings) => {
  if (Platform.OS === "web") return;
  try {
    const granted = await requestNotificationPermissions();
    if (!granted) return;

    await setupNotificationChannels();

    // Cancelar notificaciones programadas previas
    await Notifications.cancelAllScheduledNotificationsAsync();

    // 1. Programar Recordatorios de Entrenamiento
    if (settings.workout?.enabled && settings.workout.days?.length > 0) {
      const [hour, minute] = settings.workout.time.split(":").map(Number);

      for (const dayOfWeek of settings.workout.days) {
        // En Expo Notifications: Domingo = 1, Lunes = 2, ..., Sábado = 7
        const expoDay = dayOfWeek === 7 ? 1 : dayOfWeek + 1;

        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Hora de Entrenar - FitterMe",
            body: "Mantén tu racha activa y supera tus marcas de hoy. ¡A entrenar!",
            sound: "default",
            data: { type: "workout", screen: "/(tabs)/routines" },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: expoDay,
            hour,
            minute,
            channelId: "default",
          },
        });
      }
    }

    // 2. Programar Resumen Semanal
    if (settings.weeklyReport?.enabled) {
      const [hour, minute] = settings.weeklyReport.time.split(":").map(Number);
      const expoDay = settings.weeklyReport.dayOfWeek === 7 ? 1 : settings.weeklyReport.dayOfWeek + 1;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Tu Resumen Semanal FitterMe está Listo",
          body: "Descubre tus récords superados, días de dieta cumplidos y consejos para la próxima semana.",
          sound: "default",
          data: { type: "weeklyReport", screen: "/reports/weekly" },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: expoDay,
          hour,
          minute,
          channelId: "default",
        },
      });
    }

    // 3. Programar Recordatorio de Actualización de Medidas
    if (settings.measures?.enabled) {
      const [hour, minute] = settings.measures.time.split(":").map(Number);

      if (settings.measures.type === "weekly") {
        const expoDay = settings.measures.dayOfWeek === 7 ? 1 : settings.measures.dayOfWeek + 1;
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Hora de Actualizar tus Medidas",
            body: "Registra tu peso y pliegues para ver el avance de tu porcentaje de grasa y masa magra.",
            sound: "default",
            data: { type: "measures", screen: "/measures/measures" },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: expoDay,
            hour,
            minute,
            channelId: "default",
          },
        });
      } else {
        // Mensual
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Medición Mensual FitterMe",
            body: "Revisa tu progreso mensual de peso y medidas corporales.",
            sound: "default",
            data: { type: "measures", screen: "/measures/measures" },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
            day: Math.min(28, settings.measures.dayOfMonth || 1),
            hour,
            minute,
            channelId: "default",
          },
        });
      }
    }

    // 4. Programar Recordatorios de Comidas / Nutrición del Día
    if (settings.meals?.enabled && Array.isArray(settings.meals.times)) {
      for (const mealItem of settings.meals.times) {
        if (!mealItem.enabled || !mealItem.time) continue;
        const [hour, minute] = mealItem.time.split(":").map(Number);

        await Notifications.scheduleNotificationAsync({
          content: {
            title: `Recordatorio de Comidas (${mealItem.label})`,
            body: `Es hora de registrar tu ${mealItem.label.toLowerCase()} en FitterMe para mantener tus calorías y macros al día.`,
            sound: "default",
            data: { type: "meals", screen: "/(tabs)/meals" },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour,
            minute,
            channelId: "default",
          },
        });
      }
    }
  } catch (error) {
    console.error("Error al reprogramar notificaciones:", error);
  }
};

/**
 * Cancela todas las notificaciones pendientes de fin de descanso en el sistema.
 * Previene que notificaciones de descansos cortados, omitidos o de series/ejercicios anteriores queden programadas.
 */
export const cancelAllRestTimerNotifications = async (): Promise<void> => {
  if (Platform.OS === "web") return;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      const data = notif.content?.data;
      const title = notif.content?.title || "";
      if (data?.type === "rest_timer" || title.toLowerCase().includes("descanso") || title.toLowerCase().includes("recuperación")) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }
  } catch (error) {
    console.error("Error al cancelar notificaciones de descanso pendientes:", error);
  }
};

/**
 * Programa una notificación local para avisar que el tiempo de descanso terminó.
 * Funciona en primer plano, segundo plano y pantalla bloqueada.
 * Borra previamente cualquier notificación de descanso anterior para evitar solapamientos o desfases.
 */
export const scheduleRestTimerNotification = async (
  seconds: number,
  exerciseName?: string,
  routePath?: string
): Promise<string | null> => {
  if (Platform.OS === "web") return null;
  try {
    // 1. Limpiar inmediatamente cualquier notificación de descanso previa
    await cancelAllRestTimerNotifications();

    const granted = await requestNotificationPermissions();
    if (!granted) return null;
    await setupNotificationChannels();

    const durationText =
      seconds >= 60
        ? seconds % 60 === 0
          ? `${seconds / 60} min`
          : `${(seconds / 60).toFixed(1)} min`
        : `${seconds}s`;

    const title = `Tiempo de descanso terminado (${durationText})`;
    const body = exerciseName
      ? `Listo para la siguiente serie de ${exerciseName}. ¡A darlo todo!`
      : "Tu tiempo de recuperación ha finalizado. ¡A por la siguiente serie!";

    const notifId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          type: "rest_timer",
          screen: routePath || "",
        },
        sound: "default",
        vibrate: [0, 500, 200, 500],
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(Date.now() + seconds * 1000),
        channelId: "default",
      },
    });

    return notifId;
  } catch (error) {
    console.error("Error al programar notificación de descanso:", error);
    return null;
  }
};

/**
 * Cancela una notificación de descanso programada (si el usuario adelanta, salta o cambia el tiempo).
 */
export const cancelRestTimerNotification = async (notificationId: string | null) => {
  if (Platform.OS === "web") return;
  if (notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error("Error al cancelar notificación de descanso por id:", error);
    }
  }
  // Asegurar limpieza total de cualquier timer de descanso residual
  await cancelAllRestTimerNotifications();
};


