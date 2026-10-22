import ActiveWorkoutBanner from "@/components/ActiveWorkoutBanner";
import { ActiveWorkoutProvider } from "@/context/ActiveWorkoutContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { setupNotificationChannels } from "@/store/notificationsConfig";
import * as Notifications from "expo-notifications";
import { Stack, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import Toast from "react-native-toast-message";

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    setupNotificationChannels();

    if (Platform.OS === "web") return;

    const handleNotificationPayload = (data: any) => {
      if (!data) return;
      const targetScreen = data.screen || data.url;
      const type = data.type;

      if (targetScreen) {
        try {
          router.push(targetScreen as any);
        } catch (e) {
          console.warn("Error navigating from notification screen:", e);
        }
      } else if (type === "workout") {
        router.push("/(tabs)/routines");
      } else if (type === "measures") {
        router.push("/measures/measures");
      } else if (type === "meals") {
        router.push("/(tabs)/meals");
      } else if (type === "weeklyReport") {
        router.push("/reports/weekly");
      }
    };

    let subscription: { remove: () => void } | null = null;

    try {
      // Manejar cuando la app se abre al tocar una notificación con la app cerrada
      if (typeof Notifications.getLastNotificationResponseAsync === "function") {
        Notifications.getLastNotificationResponseAsync().then((response) => {
          if (response?.notification?.request?.content?.data) {
            handleNotificationPayload(response.notification.request.content.data);
          }
        }).catch((e) => console.warn("getLastNotificationResponseAsync error:", e));
      }

      // Manejar cuando se toca una notificación mientras la app está activa o en segundo plano
      if (typeof Notifications.addNotificationResponseReceivedListener === "function") {
        subscription = Notifications.addNotificationResponseReceivedListener(
          (response) => {
            const data = response?.notification?.request?.content?.data;
            if (data) {
              handleNotificationPayload(data);
            }
          }
        );
      }
    } catch (e) {
      console.warn("Notification listener setup skipped:", e);
    }

    return () => {
      if (subscription && typeof subscription.remove === "function") {
        subscription.remove();
      }
    };
  }, [router]);

  return (
    <ThemeProvider>
      <ActiveWorkoutProvider>
        <ActiveWorkoutBanner />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="settings/settings"
            options={{ title: "Settings" }}
          />
        </Stack>
        <Toast />
      </ActiveWorkoutProvider>
    </ThemeProvider>
  );
}


