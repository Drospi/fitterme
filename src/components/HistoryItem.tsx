import { useTheme } from "@/context/ThemeContext";
import { toDisplayWeight, WeightUnit } from "@/store/conf";
import { getGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type HistoryItemProps = {
  dateDay: string;
  date: string;
  tonelaje: number;
  timeTrains: number;
  id: string;
  routineName?: string;
  exercisesCount?: number;
  unit?: WeightUnit;
  onDatePress?: () => void;
};

const HistoryItem = ({
  dateDay,
  date,
  tonelaje,
  timeTrains,
  id,
  routineName,
  exercisesCount,
  unit = "kg",
  onDatePress,
}: HistoryItemProps) => {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const router = useRouter();

  const displayVolume = toDisplayWeight(tonelaje, unit);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        Haptics.selectionAsync();
        router.push({
          pathname: "/routines/DetailsRoutine/[id]",
          params: { id: id },
        });
      }}
      style={[
        globalStyles.card,
        {
          padding: 16,
          borderWidth: 1,
          borderColor: colors.neutral,
          marginBottom: 12,
        },
      ]}
    >
      {/* Cabecera del Item: Día / Nombre de Rutina y Fecha */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 12,
        }}
      >
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text
            style={{
              fontWeight: "bold",
              fontSize: 18,
              color: colors.text,
              textTransform: "capitalize",
            }}
            numberOfLines={1}
          >
            {dateDay}
          </Text>
        </View>

        {/* Fecha limpia sin opacity background */}
        <TouchableOpacity
          onPress={() => {
            Haptics.selectionAsync();
            if (onDatePress) onDatePress();
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            paddingVertical: 2,
          }}
        >
          <Ionicons name="calendar-outline" size={14} color={colors.primary} />
          <Text style={{ fontWeight: "600", fontSize: 13, color: colors.primary }}>
            {date}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Métricas con fondo sólido sin opacidades */}
      <View style={{ flexDirection: "row", gap: 10 }}>
        {/* Volumen / Tonelaje */}
        <View
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 10,
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <Ionicons name="barbell" size={15} color={colors.primary} />
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: colors.textSecondary,
                letterSpacing: 0.5,
              }}
            >
              VOLUMEN
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "center", gap: 4 }}>
            <Text
              style={{
                fontWeight: "bold",
                color: colors.text,
                fontSize: 22,
              }}
            >
              {displayVolume.toLocaleString()}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textSecondary }}>
              {unit}
            </Text>
          </View>
        </View>

        {/* Duración */}
        <View
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 10,
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <Ionicons name="time" size={15} color={colors.secondary} />
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: colors.textSecondary,
                letterSpacing: 0.5,
              }}
            >
              DURACIÓN
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "center", gap: 4 }}>
            <Text
              style={{
                fontWeight: "bold",
                color: colors.text,
                fontSize: 22,
              }}
            >
              {timeTrains}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textSecondary }}>
              min
            </Text>
          </View>
        </View>
      </View>


    </TouchableOpacity>
  );
};

export default HistoryItem;
