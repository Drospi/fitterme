import { useTheme } from "@/context/ThemeContext";
import {
  cancelAllRestTimerNotifications,
  cancelRestTimerNotification,
  scheduleRestTimerNotification,
} from "@/store/notificationsConfig";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";

type Props = {
  duration: number; // en segundos (ej. 45, 90, 120, 180)
  startTime: number; // timestamp Date.now() cuando se inició
  exerciseName?: string;
  routePath?: string;
  onAddSeconds?: (seconds: number) => void;
  onSkip?: () => void;
};

export default function InlineRestTimer({
  duration,
  startTime,
  exerciseName,
  routePath,
  onAddSeconds,
  onSkip,
}: Props) {
  const { colors } = useTheme();

  const [remaining, setRemaining] = useState(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    return Math.max(0, duration - elapsed);
  });

  const [hasCompleted, setHasCompleted] = useState(false);
  const notifIdRef = useRef<string | null>(null);

  // Programar notificación local para cuando termine el descanso
  useEffect(() => {
    let isCancelled = false;
    const initialElapsed = Math.floor((Date.now() - startTime) / 1000);
    const initialLeft = Math.max(0, duration - initialElapsed);

    if (initialLeft > 0) {
      scheduleRestTimerNotification(initialLeft, exerciseName, routePath).then((id) => {
        if (!isCancelled) {
          notifIdRef.current = id;
        } else if (id) {
          cancelRestTimerNotification(id);
        }
      });
    }

    return () => {
      isCancelled = true;
      if (notifIdRef.current) {
        cancelRestTimerNotification(notifIdRef.current);
        notifIdRef.current = null;
      }
      cancelAllRestTimerNotifications();
    };
  }, [startTime, duration, exerciseName, routePath]);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const left = Math.max(0, duration - elapsed);
      setRemaining(left);

      if (left === 0 && !hasCompleted) {
        setHasCompleted(true);
        cancelAllRestTimerNotifications();
        // Vibrar el teléfono con patrón dinámico
        try {
          Vibration.vibrate([0, 500, 200, 500]);
        } catch (e) {
          console.warn("Vibration error:", e);
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [startTime, duration, hasCompleted]);

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const formattedDuration =
    duration >= 60
      ? duration % 60 === 0
        ? `${duration / 60} min`
        : `${(duration / 60).toFixed(1)} min`
      : `${duration}s`;

  const progressPercent =
    duration > 0 ? Math.min(100, Math.max(0, ((duration - remaining) / duration) * 100)) : 100;

  const isFinished = remaining === 0 || hasCompleted;

  if (isFinished) {
    return (
      <View
        style={[
          styles.completedContainer,
          {
            backgroundColor: colors.primary + "15",
            borderColor: colors.primary,
          },
        ]}
      >
        <View style={styles.completedHeader}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
            <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.completedTitle, { color: colors.primary }]}>
                Descanso completado ({formattedDuration})
              </Text>
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                ¡Excelente recuperación! Listo para registrar tu siguiente serie.
              </Text>
            </View>
          </View>
        </View>

        {/* Línea decorativa verde / primario */}
        <View
          style={{
            height: 3,
            width: "100%",
            backgroundColor: colors.primary,
            borderRadius: 2,
            marginTop: 8,
          }}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.activeContainer,
        {
          backgroundColor: colors.surface,
          borderColor: colors.primary + "60",
        },
      ]}
    >
      {/* Cabecera del Timer */}
      <View style={styles.activeHeader}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
          <Ionicons name="timer-outline" size={20} color={colors.primary} />
          <View>
            <Text style={{ fontSize: 11, fontWeight: "bold", color: colors.textSecondary, letterSpacing: 0.5 }}>
              TIEMPO DE RECUPERACIÓN
            </Text>
            <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.primary }}>
              {formatSeconds(remaining)}
              <Text style={{ fontSize: 12, fontWeight: "normal", color: colors.textSecondary }}>
                {" "}
                / {formattedDuration}
              </Text>
            </Text>
          </View>
        </View>

        {/* Acciones Rápidas */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {onAddSeconds && (
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                cancelAllRestTimerNotifications();
                onAddSeconds(30);
              }}
              style={[styles.smallButton, { backgroundColor: colors.background, borderColor: colors.primary + "40" }]}
            >
              <Text style={{ fontSize: 11, fontWeight: "bold", color: colors.primary }}>+30s</Text>
            </TouchableOpacity>
          )}

          {onSkip && (
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                cancelAllRestTimerNotifications();
                onSkip();
              }}
              style={[styles.smallButton, { backgroundColor: colors.background, borderColor: colors.textSecondary + "40" }]}
            >
              <Text style={{ fontSize: 11, fontWeight: "bold", color: colors.textSecondary }}>Saltar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Barra / Línea de Progreso */}
      <View
        style={{
          height: 6,
          width: "100%",
          backgroundColor: colors.background,
          borderRadius: 3,
          overflow: "hidden",
          marginTop: 10,
        }}
      >
        <View
          style={{
            height: "100%",
            backgroundColor: colors.primary,
            width: `${progressPercent}%`,
            borderRadius: 3,
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  activeContainer: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  completedContainer: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    marginVertical: 8,
  },
  completedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  completedTitle: {
    fontSize: 13,
    fontWeight: "bold",
  },
  smallButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
});
