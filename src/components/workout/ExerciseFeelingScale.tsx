import {
  calculateEffortAdjustment,
  EFFORT_LEVELS,
  EffortAdjustmentResult,
  EffortRating,
} from "@/calculos/perceivedEffort";
import { useTheme } from "@/context/ThemeContext";
import { WeightUnit } from "@/store/conf";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

interface ExerciseFeelingScaleProps {
  selectedRating: EffortRating | null;
  onSelectRating: (rating: EffortRating, result: EffortAdjustmentResult) => void;
  currentWeight: number;
  currentReps: number;
  unit: WeightUnit;
  weightIncrement?: number;
  isBodyweight?: boolean;
  isCardio?: boolean;
  currentTimeMinutes?: number;
  currentIntensity?: string;
  exerciseName?: string;
}

const RATINGS: EffortRating[] = [1, 2, 3, 4, 5];

export default function ExerciseFeelingScale({
  selectedRating,
  onSelectRating,
  currentWeight,
  currentReps,
  unit,
  weightIncrement = 2.5,
  isBodyweight = false,
  isCardio = false,
  currentTimeMinutes = 15,
  currentIntensity = "Moderada",
}: ExerciseFeelingScaleProps) {
  const { colors } = useTheme();

  const [activeFeedback, setActiveFeedback] = useState<{
    rating: EffortRating;
    title: string;
    text: string;
    color: string;
  } | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  const handlePressRating = (rating: EffortRating) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = calculateEffortAdjustment({
      currentWeight,
      currentReps,
      rating,
      unit,
      weightIncrement,
      isBodyweight,
      isCardio,
      currentTimeMinutes,
      currentIntensity,
    });

    onSelectRating(rating, result);

    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }

    const info = EFFORT_LEVELS[rating];
    let actionText = "";
    if (rating === 1) {
      actionText = "Bajaremos la carga en tu próxima rutina para proteger tu recuperación.";
    } else if (rating === 4 || rating === 5) {
      actionText = "¡Con energía de sobra! Subiremos la carga en tu próxima rutina.";
    } else {
      actionText = "Cerca del límite sin quemarte; mantendremos el peso para consolidar.";
    }

    setActiveFeedback({
      rating,
      title: info.title,
      text: `Coach Fitto: ${actionText}`,
      color: info.color,
    });

    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // El mensaje se desvanece suavemente a los 2.5 segundos
    hideTimerRef.current = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        setActiveFeedback(null);
      });
    }, 2500);
  };

  // Render SVG Face matching the 5 levels
  const renderSmileyFace = (rating: EffortRating, isSelected: boolean) => {
    const size = 44;
    const info = EFFORT_LEVELS[rating];

    return (
      <View
        style={[
          styles.faceWrapper,
          {
            borderColor: isSelected ? info.color : "transparent",
            transform: [{ scale: isSelected ? 1.08 : 1 }],
          },
        ]}
      >
        <Svg width={size} height={size} viewBox="0 0 44 44">
          {/* Circular Face Base */}
          <Circle cx="22" cy="22" r="21" fill={info.color} />

          {/* Eyes */}
          <Circle cx="16" cy="17" r="2.4" fill="#18181b" />
          <Circle cx="28" cy="17" r="2.4" fill="#18181b" />

          {/* Mouth expressions */}
          {rating === 1 && (
            <Path
              d="M 13 32 Q 22 21 31 32"
              stroke="#18181b"
              strokeWidth="2.8"
              strokeLinecap="round"
              fill="none"
            />
          )}

          {rating === 2 && (
            <Path
              d="M 14 30 Q 22 23 30 30"
              stroke="#18181b"
              strokeWidth="2.8"
              strokeLinecap="round"
              fill="none"
            />
          )}

          {rating === 3 && (
            <Path
              d="M 15 28 L 29 28"
              stroke="#18181b"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
          )}

          {rating === 4 && (
            <Path
              d="M 14 26 Q 22 34 30 26"
              stroke="#18181b"
              strokeWidth="2.8"
              strokeLinecap="round"
              fill="none"
            />
          )}

          {rating === 5 && (
            <Path
              d="M 13 25 Q 22 37 31 25"
              stroke="#18181b"
              strokeWidth="3.2"
              strokeLinecap="round"
              fill="none"
            />
          )}
        </Svg>
      </View>
    );
  };

  // Render dots pill indicator under the face
  const renderDotsPill = (dotsFilled: number, activeColor: string, isSelected: boolean) => {
    return (
      <View
        style={[
          styles.dotsPill,
          {
            backgroundColor: "#0d0f15",
            borderColor: isSelected ? activeColor : "rgba(255,255,255,0.12)",
          },
        ]}
      >
        {[1, 2, 3, 4, 5].map((dotIndex) => {
          const isFilled = dotIndex <= dotsFilled;
          return (
            <View
              key={dotIndex}
              style={[
                styles.dot,
                {
                  backgroundColor: isFilled ? activeColor : "rgba(255,255,255,0.18)",
                  transform: [{ scale: isFilled && isSelected ? 1.2 : 1 }],
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: selectedRating
            ? EFFORT_LEVELS[selectedRating].color + "45"
            : colors.cardBorder || "rgba(255,255,255,0.08)",
        },
      ]}
    >
      {/* Pregunta única sin textos restantes */}
      <View style={styles.headerRow}>
        <Ionicons
          name="sparkles"
          size={16}
          color={selectedRating ? EFFORT_LEVELS[selectedRating].color : colors.primary}
        />
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          ¿Cómo te sentiste?
        </Text>
      </View>

      {/* Caritas interactivas */}
      <View style={styles.scaleRow}>
        {RATINGS.map((rating) => {
          const isSelected = selectedRating === rating;
          const info = EFFORT_LEVELS[rating];

          return (
            <TouchableOpacity
              key={rating}
              activeOpacity={0.7}
              onPress={() => handlePressRating(rating)}
              style={styles.ratingButton}
            >
              {renderSmileyFace(rating, isSelected)}
              {renderDotsPill(rating, info.color, isSelected)}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Mensaje que aparece al seleccionar y se desvanece en 2 a 3 segundos */}
      {activeFeedback && (
        <Animated.View
          style={[
            styles.fadingMessageCard,
            {
              opacity: fadeAnim,
              backgroundColor: activeFeedback.color + "16",
              borderColor: activeFeedback.color + "50",
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-4, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons
              name={
                activeFeedback.rating === 1
                  ? "arrow-down-circle"
                  : activeFeedback.rating >= 4
                    ? "trending-up"
                    : "shield-checkmark"
              }
              size={14}
              color={activeFeedback.color}
            />
            <Text
              style={[
                styles.fadingMessageTitle,
                { color: activeFeedback.color },
              ]}
            >
              {activeFeedback.title}
            </Text>
          </View>
          <Text style={[styles.fadingMessageText, { color: colors.text }]}>
            {activeFeedback.text}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 3,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  scaleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 2,
  },
  ratingButton: {
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 2,
  },
  faceWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  dotsPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  dot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 2.25,
  },
  fadingMessageCard: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 3,
  },
  fadingMessageTitle: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  fadingMessageText: {
    fontSize: 11,
    fontWeight: "500",
    lineHeight: 15,
  },
});
