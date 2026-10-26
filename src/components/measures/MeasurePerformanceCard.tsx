import { useTheme } from "@/context/ThemeContext";
import { getGlobalStyles } from "@/styles/global";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

export interface TopExerciseItem {
  id: number;
  nombre: string;
  objetivo?: string;
  equipamiento?: string;
  totalVolume: number;
}

interface MeasurePerformanceCardProps {
  globalBest: {
    bestWeight: number;
    bestReps: number;
    name: number;
  };
  frequency: string;
  avgRPE: number;
  topExercises: TopExerciseItem[];
  totalVolume: number;
}

const truncateExerciseName = (name?: string, maxChars = 24) => {
  if (!name) return "";
  return name.length > maxChars ? `${name.slice(0, maxChars)}...` : name;
};

export default function MeasurePerformanceCard({
  globalBest,
  frequency,
  avgRPE,
  topExercises,
  totalVolume,
}: MeasurePerformanceCardProps) {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const router = useRouter();

  return (
    <View style={{ gap: 20 }}>
      {/* Muscle Exercise History & Stats */}
      <View>
        <View
          style={[
            globalStyles.card,
            {
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            },
          ]}
        >
          <View>
            <Text style={globalStyles.textSecondary}>RÉCORD PERSONAL</Text>
            <Text
              style={{
                fontSize: 32,
                fontWeight: "bold",
                color: colors.text,
              }}
            >
              {globalBest.bestWeight > 0 ? (
                <>
                  {globalBest.bestWeight}{" "}
                  <Text style={globalStyles.textSecondary}>kg</Text>
                </>
              ) : globalBest.bestReps > 0 ? (
                <>
                  {globalBest.bestReps}{" "}
                  <Text style={globalStyles.textSecondary}>reps</Text>
                </>
              ) : (
                "--"
              )}
            </Text>
            <Text style={globalStyles.textSecondary}>
              {globalBest.bestWeight > 0
                ? `${globalBest.bestReps} reps`
                : globalBest.bestReps > 0
                  ? "Peso corporal"
                  : "Sin registros"}
            </Text>
          </View>
          <Ionicons name="medal-outline" size={24} color={colors.primary} />
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <View style={[globalStyles.card, { flex: 1 }]}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Ionicons name="time-outline" size={22} color={colors.primary} />
              <Text style={globalStyles.cardTitle}>Frecuencia</Text>
            </View>
            <Text style={globalStyles.title}>
              {frequency}{" "}
              <Text style={globalStyles.textSecondary}>veces/sem</Text>
            </Text>
          </View>

          <View style={[globalStyles.card, { flex: 1 }]}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Ionicons name="flash-outline" size={22} color={colors.primary} />
              <Text style={globalStyles.cardTitle}>INTENSIDAD</Text>
            </View>
            <Text style={globalStyles.title}>
              {avgRPE.toFixed(1)}{" "}
              <Text style={globalStyles.textSecondary}> RPE prom.</Text>
            </Text>
          </View>
        </View>
      </View>

      {/* Top Exercises */}
      {topExercises.length > 0 && (
        <View>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              color: colors.text,
              marginBottom: 14,
            }}
          >
            TOP EJERCICIOS
          </Text>

          <View style={{ gap: 10 }}>
            {topExercises.map((e) => (
              <TouchableOpacity
                key={e.id}
                activeOpacity={0.7}
                onPress={() => {
                  Haptics.selectionAsync();
                  router.push(`/exercises/DetailsExercise/${e.id}` as any);
                }}
                style={[
                  globalStyles.card,
                  {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    justifyContent: "space-between",
                  },
                ]}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    flex: 1,
                    marginRight: 8,
                  }}
                >
                  <View
                    style={{
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 10,
                      borderRadius: 50,
                      backgroundColor: colors.primary + "33",
                      flexShrink: 0,
                    }}
                  >
                    <Ionicons
                      name="barbell-outline"
                      size={24}
                      color={colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={globalStyles.cardTitle}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {truncateExerciseName(e.nombre, 24)}
                    </Text>
                    <Text
                      style={globalStyles.textSecondary}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {e.objetivo ? `${e.objetivo} • ` : ""}{e.equipamiento || "Sin equipamiento"}
                    </Text>
                  </View>
                </View>

                <View style={{ alignItems: "flex-end", flexShrink: 0 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "bold",
                      color: colors.secondary || colors.primary,
                    }}
                  >
                    {totalVolume > 0
                      ? `${((e.totalVolume / totalVolume) * 100).toFixed(1)}%`
                      : "Sin datos"}
                  </Text>
                  <Text style={globalStyles.textSecondary}>
                    {totalVolume > 0 ? "del volumen" : "Sin datos"}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
