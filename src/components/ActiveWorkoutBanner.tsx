import { useActiveWorkout } from "@/context/ActiveWorkoutContext";
import { useTheme } from "@/context/ThemeContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { usePathname, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ActiveWorkoutBanner() {
  const { colors } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { activeWorkout, getElapsedTime } = useActiveWorkout();

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  const screen = Dimensions.get("window");
  const BUBBLE_SIZE = 64;
  const initialX = screen.width - BUBBLE_SIZE - 16;
  const initialY = screen.height - 180;

  const pan = useRef(new Animated.ValueXY({ x: initialX, y: initialY })).current;
  const offsetRef = useRef({ x: initialX, y: initialY });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: offsetRef.current.x,
          y: offsetRef.current.y,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gestureState) => {
        pan.flattenOffset();
        const finalX = offsetRef.current.x + gestureState.dx;
        const finalY = offsetRef.current.y + gestureState.dy;

        // Limitar dentro de los bordes de la pantalla
        const clampedX = Math.max(10, Math.min(screen.width - BUBBLE_SIZE - 10, finalX));
        const clampedY = Math.max(45, Math.min(screen.height - BUBBLE_SIZE - 60, finalY));

        offsetRef.current = { x: clampedX, y: clampedY };

        Animated.spring(pan, {
          toValue: { x: clampedX, y: clampedY },
          useNativeDriver: false,
          friction: 6,
        }).start();

        // Si fue un toque rápido (tap) sin arrastre significativo
        if (Math.abs(gestureState.dx) < 6 && Math.abs(gestureState.dy) < 6) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setIsMinimized(false);
        }
      },
    })
  ).current;

  useEffect(() => {
    if (!activeWorkout?.isActive) return;

    setElapsedSeconds(getElapsedTime());

    const interval = setInterval(() => {
      setElapsedSeconds(getElapsedTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [activeWorkout, getElapsedTime]);

  if (!activeWorkout || !activeWorkout.isActive) return null;

  // Ocultar banner si el usuario ya está en la pantalla de entrenamiento activo o editando
  const shouldHideBanner =
    pathname.includes("/routines/PlayRoutine") ||
    pathname.includes("/routines/PlayFreeRoutine") ||
    pathname.includes("EditExercise") ||
    pathname.includes("/exercises/edit") ||
    pathname.includes("/routines/EditRoutine");

  if (shouldHideBanner) return null;

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) {
      const remMins = mins % 60;
      return `${hrs}:${remMins < 10 ? "0" : ""}${remMins}:${secs < 10 ? "0" : ""}${secs}`;
    }
    return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleResumeWorkout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (activeWorkout.routePath) {
      router.push(activeWorkout.routePath as any);
    }
  };

  // MODO 1: BOLITA FLOTANTE ARRASTRABLE (PiP Bubble)
  if (isMinimized) {
    return (
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.bubbleContainer,
          {
            transform: [{ translateX: pan.x }, { translateY: pan.y }],
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setIsMinimized(false);
          }}
          style={[
            styles.bubble,
            {
              backgroundColor: colors.surface,
              borderColor: colors.primary,
              shadowColor: colors.primary,
            },
          ]}
        >
          {/* Punto verde pulsante de entrenamiento activo */}
          <View
            style={[
              styles.pulseDot,
              { backgroundColor: colors.primary, borderColor: colors.surface },
            ]}
          />

          <Ionicons name="barbell" size={22} color={colors.primary} />

          {/* Mini temporizador dentro de la bolita */}
          <View
            style={[
              styles.bubbleTimerBadge,
              { backgroundColor: colors.primary },
            ]}
          >
            <Text
              style={{
                fontSize: 9,
                fontWeight: "900",
                color: colors.background,
              }}
            >
              {formatTimer(elapsedSeconds)}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // MODO 2: BANNER COMPLETO SUPERIOR
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.banner,
          {
            backgroundColor: colors.surface,
            borderColor: colors.primary,
            shadowColor: colors.primary,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleResumeWorkout}
          style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: colors.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="barbell" size={20} color={colors.background} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, fontWeight: "bold", color: colors.primary, letterSpacing: 0.5 }}>
              ENTRENAMIENTO EN CURSO
            </Text>
            <Text
              style={{ fontSize: 14, fontWeight: "bold", color: colors.text }}
              numberOfLines={1}
            >
              {activeWorkout.routineName}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View
            style={{
              backgroundColor: colors.background,
              paddingHorizontal: 8,
              paddingVertical: 5,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: colors.primary + "30",
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: "bold", color: colors.primary }}>
              ⏱️ {formatTimer(elapsedSeconds)}
            </Text>
          </View>

          {/* Botón Minimizar a Bolita */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsMinimized(true);
            }}
            style={{
              backgroundColor: colors.background,
              width: 32,
              height: 32,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: colors.primary + "40",
            }}
          >
            <Ionicons name="contract" size={16} color={colors.primary} />
          </TouchableOpacity>

          {/* Botón Volver al Entrenamiento */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleResumeWorkout}
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: 9,
              paddingVertical: 6,
              borderRadius: 12,
              flexDirection: "row",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Text style={{ color: colors.background, fontWeight: "bold", fontSize: 12 }}>
              Volver
            </Text>
            <Ionicons name="chevron-forward" size={14} color={colors.background} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: 12,
    right: 12,
    zIndex: 9999,
    elevation: 10,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  bubbleContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 99999,
    elevation: 20,
  },
  bubble: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 12,
  },
  pulseDot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  bubbleTimerBadge: {
    position: "absolute",
    bottom: -6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
});

