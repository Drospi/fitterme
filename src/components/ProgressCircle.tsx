import { useTheme } from "@/context/ThemeContext";
import React from "react";
import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";

export default function ProgressCircle({
  percent = 0,
  radius = 40,
  strokeWidth = 8,
}) {
  const { colors } = useTheme();
  const size = radius * 2;
  const circumference = radius * 2 * Math.PI;

  const safePercent = Math.max(percent, 0.1);
  const strokeDashoffset = circumference - (safePercent / 100) * circumference;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* Fondo fijo */}
        <Circle
          stroke={colors.text}
          cx={radius}
          cy={radius}
          r={radius - strokeWidth / 2}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeLinecap="round"
        />
        {/* Trazo de progreso */}
        <Circle
          stroke={colors.primary}
          cx={radius}
          cy={radius}
          r={radius - strokeWidth / 2}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          originX={radius}
          originY={radius}
        />
      </Svg>
    </View>
  );
}
