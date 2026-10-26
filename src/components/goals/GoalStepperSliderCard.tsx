import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface GoalStepperSliderCardProps {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
  unit: string;
  min: number;
  max: number;
  step?: number;
  tintColor?: string;
  onValueChange: (val: number) => void;
  onAdjust: (delta: number) => void;
}

export default function GoalStepperSliderCard({
  title,
  subtitle,
  icon,
  value,
  unit,
  min,
  max,
  step = 1,
  tintColor,
  onValueChange,
  onAdjust,
}: GoalStepperSliderCardProps) {
  const { colors } = useTheme();
  const activeColor = tintColor || colors.primary;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: activeColor + "20" },
            ]}
          >
            <Ionicons name={icon} size={20} color={activeColor} />
          </View>
          <View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {title}
            </Text>
            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.stepperRow}>
        <TouchableOpacity
          onPress={() => onAdjust(-step)}
          style={[styles.stepperButton, { borderColor: colors.cardBorder }]}
          disabled={value <= min}
        >
          <Ionicons
            name="remove"
            size={22}
            color={value <= min ? colors.textSecondary + "50" : colors.text}
          />
        </TouchableOpacity>

        <View style={styles.valueDisplay}>
          <Text style={[styles.bigNumber, { color: activeColor }]}>
            {value}
          </Text>
          <Text style={[styles.unitText, { color: colors.textSecondary }]}>
            {unit}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => onAdjust(step)}
          style={[styles.stepperButton, { borderColor: colors.cardBorder }]}
          disabled={value >= max}
        >
          <Ionicons
            name="add"
            size={22}
            color={value >= max ? colors.textSecondary + "50" : colors.text}
          />
        </TouchableOpacity>
      </View>

      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        minimumTrackTintColor={activeColor}
        maximumTrackTintColor={colors.background}
        thumbTintColor={activeColor}
        value={value}
        onValueChange={(val) => onValueChange(Math.round(val))}
        step={step}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  valueDisplay: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  bigNumber: {
    fontSize: 36,
    fontWeight: "bold",
  },
  unitText: {
    fontSize: 14,
    fontWeight: "600",
  },
  slider: {
    width: "100%",
    height: 30,
  },
});
