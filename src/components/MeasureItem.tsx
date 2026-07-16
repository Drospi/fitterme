import { useTheme } from "@/context/ThemeContext";
import { getGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type MeasureItemProps = {
  name: string;
  measure: number;
  link?: string;
};

const MeasureItem = ({ name, measure, link }: MeasureItemProps) => {
  const router = useRouter();
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
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
        <View>
          <View>
            <Text style={{ color: colors.primary }}>
              <Ionicons
                name="cellular-outline"
                size={20}
                color={colors.primary}
              />{" "}
              + 1.2 cm
            </Text>
          </View>
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
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
                  marginTop: 5,
                  alignSelf: "center",
                  color: colors.secondary,
                },
              ]}
            >
              Ver progreso{" "}
            </Text>
            <Ionicons name="arrow-forward" size={20} color={colors.secondary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default MeasureItem;
