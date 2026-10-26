import { useTheme } from "@/context/ThemeContext";
import { getGlobalStyles } from "@/styles/global";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

interface MeasureCalculatorCardProps {
  calculatorDays: number;
  onDaysChange: (days: number) => void;
  calculatedFutureDate: string;
  calculatedFutureValue: number;
  calculatedFutureDiff: number;
  calculatedFuturePct: number;
}

const PRESET_DAYS = [15, 30, 60, 90];

export default function MeasureCalculatorCard({
  calculatorDays,
  onDaysChange,
  calculatedFutureDate,
  calculatedFutureValue,
  calculatedFutureDiff,
  calculatedFuturePct,
}: MeasureCalculatorCardProps) {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  const isPositive = calculatedFutureDiff >= 0;

  return (
    <View
      style={[
        globalStyles.card,
        {
          marginBottom: 20,
          padding: 16,
        },
      ]}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <Ionicons name="calculator-outline" size={20} color={colors.primary} />
        <Text style={{ fontSize: 13, fontWeight: "bold", color: colors.text }}>
          CALCULADORA DE PROYECCIÓN
        </Text>
      </View>

      {/* Preset Days Chips */}
      <View
        style={{
          flexDirection: "row",
          gap: 8,
          marginBottom: 14,
        }}
      >
        {PRESET_DAYS.map((days) => {
          const isSelected = calculatorDays === days;
          return (
            <TouchableOpacity
              key={days}
              onPress={() => {
                Haptics.selectionAsync();
                onDaysChange(days);
              }}
              style={{
                flex: 1,
                paddingVertical: 7,
                borderRadius: 10,
                alignItems: "center",
                backgroundColor: isSelected ? colors.primary : colors.background,
                borderWidth: 1,
                borderColor: isSelected ? colors.primary : colors.textSecondary + "20",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: isSelected ? "bold" : "600",
                  color: isSelected ? colors.background : colors.textSecondary,
                }}
              >
                {days} días
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Stepper + Input */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
          paddingHorizontal: 6,
        }}
      >
        <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: "500" }}>
          Días a proyectar:
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              onDaysChange(Math.max(1, calculatorDays - 5));
            }}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: colors.surface,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: colors.textSecondary + "30",
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.text }}>-5</Text>
          </TouchableOpacity>

          <TextInput
            keyboardType="numeric"
            value={calculatorDays.toString()}
            onChangeText={(val) => {
              const num = parseInt(val, 10);
              if (!isNaN(num)) onDaysChange(Math.max(1, num));
              else if (val === "") onDaysChange(0);
            }}
            style={{
              minWidth: 55,
              textAlign: "center",
              fontSize: 16,
              fontWeight: "bold",
              color: colors.primary,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 8,
              backgroundColor: colors.surface,
            }}
          />

          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              onDaysChange(calculatorDays + 5);
            }}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: colors.surface,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: colors.textSecondary + "30",
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.text }}>+5</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Calculator Result Box */}
      <View
        style={{
          padding: 14,
          borderRadius: 14,
          backgroundColor: colors.primary + "12",
          borderWidth: 1,
          borderColor: colors.primary + "40",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 6,
          }}
        >
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>
            Fecha estimada ({calculatorDays} días):
          </Text>
          <Text style={{ fontSize: 12, fontWeight: "bold", color: colors.primary }}>
            📅 {calculatedFutureDate}
          </Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginTop: 4,
          }}
        >
          <View>
            <Text style={{ fontSize: 11, color: colors.textSecondary }}>
              Medida proyectada:
            </Text>
            <Text style={{ fontSize: 28, fontWeight: "bold", color: colors.text }}>
              {calculatedFutureValue}{" "}
              <Text style={{ fontSize: 16, color: colors.textSecondary }}>cm</Text>
            </Text>
          </View>

          <View style={{ alignItems: "flex-end" }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "bold",
                color: isPositive ? colors.primary : colors.delete,
              }}
            >
              {isPositive ? `+${calculatedFutureDiff}` : `${calculatedFutureDiff}`} cm
            </Text>
            <Text style={{ fontSize: 11, color: colors.textSecondary }}>
              ({isPositive ? `+${calculatedFuturePct}` : `${calculatedFuturePct}`}%)
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
