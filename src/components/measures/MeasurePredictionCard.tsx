import { useTheme } from "@/context/ThemeContext";
import { getGlobalStyles } from "@/styles/global";
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface MeasurePredictionCardProps {
  latestVal: number;
  predicted30DaysValue: number;
  diff30Days: number;
  pct30Days: number;
  weeklyRate: number;
  monthlyRate: number;
}

export default function MeasurePredictionCard({
  latestVal,
  predicted30DaysValue,
  diff30Days,
  pct30Days,
  weeklyRate,
  monthlyRate,
}: MeasurePredictionCardProps) {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  const isPositive = diff30Days >= 0;

  return (
    <View
      style={[
        globalStyles.card,
        {
          marginBottom: 20,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.primary + "35",
        },
      ]}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: colors.primary + "20",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="sparkles" size={18} color={colors.primary} />
          </View>
          <View>
            <Text style={{ fontSize: 13, fontWeight: "bold", color: colors.text }}>
              +1 MES PREDICTIVO
            </Text>
            <Text style={{ fontSize: 11, color: colors.textSecondary }}>
              Proyección basada en tu tendencia actual
            </Text>
          </View>
        </View>
      </View>

      {/* Main projection metric */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          justifyContent: "space-between",
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderRadius: 14,
          backgroundColor: colors.primary + "12",
          marginBottom: 14,
        }}
      >
        <View>
          <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 2 }}>
            Medida estimada en 30 días:
          </Text>
          <Text style={{ fontSize: 32, fontWeight: "bold", color: colors.text }}>
            {predicted30DaysValue}{" "}
            <Text style={{ fontSize: 18, color: colors.textSecondary }}>cm</Text>
          </Text>
        </View>

        <View style={{ alignItems: "flex-end" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons
              name={isPositive ? "arrow-up" : "arrow-down"}
              size={16}
              color={isPositive ? colors.primary : colors.delete}
            />
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: isPositive ? colors.primary : colors.delete,
              }}
            >
              {isPositive ? `+${diff30Days}` : `${diff30Days}`} cm
            </Text>
          </View>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
            ({isPositive ? `+${pct30Days}` : `${pct30Days}`}%)
          </Text>
        </View>
      </View>

      {/* Rate breakdown sub-grid */}
      <View
        style={{
          flexDirection: "row",
          gap: 10,
        }}
      >
        <View
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 12,
            backgroundColor: colors.background,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 11, color: colors.textSecondary }}>Ritmo semanal</Text>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "bold",
              color: weeklyRate >= 0 ? colors.primary : colors.delete,
              marginTop: 4,
            }}
          >
            {weeklyRate >= 0 ? `+${weeklyRate}` : `${weeklyRate}`} cm/sem
          </Text>
        </View>

        <View
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 12,
            backgroundColor: colors.background,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 11, color: colors.textSecondary }}>Ritmo mensual</Text>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "bold",
              color: monthlyRate >= 0 ? colors.primary : colors.delete,
              marginTop: 4,
            }}
          >
            {monthlyRate >= 0 ? `+${monthlyRate}` : `${monthlyRate}`} cm/mes
          </Text>
        </View>

        <View
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 12,
            backgroundColor: colors.background,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 11, color: colors.textSecondary }}>Actual</Text>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "bold",
              color: colors.text,
              marginTop: 4,
            }}
          >
            {latestVal} cm
          </Text>
        </View>
      </View>
    </View>
  );
}
