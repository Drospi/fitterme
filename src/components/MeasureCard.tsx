import { useTheme } from "@/context/ThemeContext";
import { getGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Popover from "react-native-popover-view";

type Props = {
  name: string;
  measure: number;
  previousMeasure?: number;
  measureType?: string;
  setMeasure: (measure: number) => void;
  instructions?: string;
};

const MeasureCard = ({
  name,
  measure,
  previousMeasure,
  measureType,
  setMeasure,
  instructions,
}: Props) => {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  const [showPopover, setShowPopover] = useState(false);

  const measureRef = useRef(measure);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    measureRef.current = measure;
  }, [measure]);

  const startAdjusting = (increment: number) => {
    const updateValue = () => {
      const nextVal = Math.max(0, measureRef.current + increment);
      measureRef.current = nextVal;
      setMeasure(nextVal);
    };

    updateValue();

    intervalRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        updateValue();
      }, 100);
    }, 500);
  };

  const stopAdjusting = () => {
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const previousText =
    previousMeasure !== undefined && previousMeasure > 0
      ? `${previousMeasure} ${measureType ?? "cm"}`
      : "--";

  return (
    <View style={globalStyles.card}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            flex: 1,
          }}
        >
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.primary,
              width: 40,
              height: 40,
              borderRadius: 20,
            }}
          >
            <Ionicons name="body" size={24} color={colors.neutral} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                globalStyles.cardTitle,
                { fontWeight: "bold", fontSize: 20, marginBottom: 2 },
              ]}
            >
              {name}
            </Text>
            <Text
              style={[globalStyles.cardText, { color: colors.textSecondary }]}
            >
              Anterior:{" "}
              <Text style={{ fontWeight: "bold", color: colors.text }}>
                {previousText}
              </Text>
            </Text>
          </View>
        </View>

        {instructions ? (
          <Popover
            isVisible={showPopover}
            onRequestClose={() => setShowPopover(false)}
            from={
              <TouchableOpacity
                onPress={() => setShowPopover(true)}
                style={{
                  padding: 8,
                  backgroundColor: colors.surface,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: colors.primary + "40",
                }}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={22}
                  color={colors.primary}
                />
              </TouchableOpacity>
            }
          >
            <View
              style={{
                padding: 16,
                maxWidth: 280,
                backgroundColor: colors.background,
                borderWidth: 0,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <Ionicons
                  name="help-circle-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text
                  style={{
                    fontWeight: "bold",
                    fontSize: 16,
                    color: colors.text,
                  }}
                >
                  ¿Cómo medir {name}?
                </Text>
              </View>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 13,
                  lineHeight: 18,
                }}
              >
                {instructions}
              </Text>
            </View>
          </Popover>
        ) : null}
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          width: "100%",
          justifyContent: "space-between",
          marginTop: 16,
        }}
      >
        <TouchableOpacity
          onPressIn={() => startAdjusting(-1)}
          onPressOut={stopAdjusting}
        >
          <Ionicons
            name="remove-circle-outline"
            size={48}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        <Text style={globalStyles.cardText}>
          <Text
            style={{
              fontWeight: "bold",
              color: colors.secondary,
              fontSize: 24,
            }}
          >
            {measure}
          </Text>{" "}
          {measureType ?? "cm"}
        </Text>

        <TouchableOpacity
          onPressIn={() => startAdjusting(+1)}
          onPressOut={stopAdjusting}
        >
          <Ionicons
            name="add-circle-outline"
            size={48}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default MeasureCard;
