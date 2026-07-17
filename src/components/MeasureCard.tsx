import { useTheme } from "@/context/ThemeContext";
import { getGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

type Props = {
  name: string;
  measure: number;
  measureType?: string;
  setMeasure: (measure: number) => void;
};

const MeasureCard = ({ name, measure, measureType, setMeasure }: Props) => {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  const [localMeasure, setLocalMeasure] = useState(measure);

  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startAdjusting = (increment: number) => {
    const updateValue = () => {
      setLocalMeasure((prev) => {
        const newValue = Math.max(0, prev + increment);
        setMeasure(newValue);
        return newValue;
      });
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

  const handlePress = (increment: number) => {
    setLocalMeasure(Math.max(0, measure + increment));
  };
  console.log(measure, localMeasure);

  return (
    <View style={globalStyles.card}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
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
        <View>
          <Text
            style={[
              globalStyles.cardTitle,
              { fontWeight: "bold", fontSize: 20, marginBottom: 0 },
            ]}
          >
            {name}
          </Text>
          {measure !== 0 && (
            <Text style={globalStyles.cardText}>
              Anterior: {measure} {measureType ?? "cm"}
            </Text>
          )}
        </View>
      </View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          width: "100%",
          justifyContent: "space-between",
          marginTop: 20,
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
            {localMeasure}
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
