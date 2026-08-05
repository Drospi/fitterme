import { useTheme } from "@/context/ThemeContext";
import { getGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type MeasureItemProps = {
  name: string;
  measure: number;
  previousMeasure?: number;
  link?: string;
};

const MeasureItem = ({ name, measure, previousMeasure, link }: MeasureItemProps) => {
  const router = useRouter();
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  let diffText = "";
  let diffColor = colors.textSecondary;
  let iconName: "trending-up" | "trending-down" | "remove-outline" = "remove-outline";

  const hasPrevious = previousMeasure !== undefined && previousMeasure > 0;

  if (hasPrevious) {
    const diff = measure - previousMeasure!;
    if (diff > 0) {
      const formatted = diff % 1 === 0 ? diff : diff.toFixed(1);
      diffText = `+${formatted} cm`;
      diffColor = colors.primary;
      iconName = "trending-up";
    } else if (diff < 0) {
      const formatted = diff % 1 === 0 ? diff : diff.toFixed(1);
      diffText = `${formatted} cm`;
      diffColor = colors.delete;
      iconName = "trending-down";
    } else {
      diffText = "0 cm";
      diffColor = colors.textSecondary;
      iconName = "remove-outline";
    }
  }

  return (
    <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
      <View
        style={[
          globalStyles.card,
          {
            flex: 1,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          },
        ]}
      >
        <View>
          <Text style={globalStyles.cardText}>{name}</Text>
          <Text style={globalStyles.cardText}>
            <Text
              style={{
                fontWeight: "bold",
                color: colors.text,
                fontSize: 20,
              }}
            >
              {measure}
            </Text>{" "}
            cm
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          {hasPrevious ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Ionicons name={iconName} size={18} color={diffColor} />
              <Text style={{ color: diffColor, fontWeight: "bold", fontSize: 14 }}>
                {diffText}
              </Text>
            </View>
          ) : (
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
              Primer registro
            </Text>
          )}
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              marginTop: 6,
            }}
            onPress={() =>
              router.push({
                pathname: "/measures/DetailsMeasure/[measure]",
                params: { measure: measure, name: name },
              })
            }
          >
            <Text
              style={[
                globalStyles.textSecondary,
                {
                  alignSelf: "center",
                  color: colors.secondary,
                  fontSize: 13,
                },
              ]}
            >
              Ver progreso{" "}
            </Text>
            <Ionicons name="arrow-forward" size={16} color={colors.secondary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default MeasureItem;
