import { useTheme } from "@/context/ThemeContext";
import { getGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface BiometricsGridProps {
  peso?: number;
  altura?: number;
  edad?: number;
  sexo?: string;
}

export default function BiometricsGrid({
  peso,
  altura,
  edad,
  sexo,
}: BiometricsGridProps) {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  const isFemale = (sexo || "").toLowerCase() === "femenino";

  return (
    <View style={styles.container}>
      {/* Fila 1 de Métricas: Peso y Altura */}
      <View style={styles.row}>
        {/* Peso Actual */}
        <View style={[globalStyles.card, styles.statCard]}>
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: colors.primary + "18" },
              ]}
            >
              <Ionicons name="scale-outline" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
              PESO ACTUAL
            </Text>
          </View>

          <View style={styles.valueRow}>
            <Text style={[styles.mainValue, { color: colors.primary }]}>
              {peso !== undefined && peso > 0 ? peso : "No data"}
            </Text>
            {peso !== undefined && peso > 0 && (
              <Text style={[styles.unitText, { color: colors.textSecondary }]}>
                kg
              </Text>
            )}
          </View>
        </View>

        {/* Altura Actual */}
        <View style={[globalStyles.card, styles.statCard]}>
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: colors.secondary + "18" },
              ]}
            >
              <Ionicons name="body-outline" size={20} color={colors.secondary} />
            </View>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
              ALTURA ACTUAL
            </Text>
          </View>

          <View style={styles.valueRow}>
            <Text style={[styles.mainValue, { color: colors.text }]}>
              {altura !== undefined && altura > 0 ? altura : "No data"}
            </Text>
            {altura !== undefined && altura > 0 && (
              <Text style={[styles.unitText, { color: colors.textSecondary }]}>
                cm
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Fila 2 de Métricas: Edad y Género */}
      <View style={styles.row}>
        {/* Edad */}
        <View style={[globalStyles.card, styles.statCard]}>
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: "#f59e0b18" },
              ]}
            >
              <Ionicons name="calendar-outline" size={20} color="#f59e0b" />
            </View>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
              EDAD
            </Text>
          </View>

          <View style={styles.valueRow}>
            <Text style={[styles.mainValue, { color: colors.text }]}>
              {edad !== undefined && edad > 0 ? edad : "No data"}
            </Text>
            {edad !== undefined && edad > 0 && (
              <Text style={[styles.unitText, { color: colors.textSecondary }]}>
                años
              </Text>
            )}
          </View>
        </View>

        {/* Género */}
        <View style={[globalStyles.card, styles.statCard]}>
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: isFemale
                    ? colors.delete + "18"
                    : colors.secondary + "18",
                },
              ]}
            >
              <Ionicons
                name={isFemale ? "female-outline" : "male-outline"}
                size={20}
                color={isFemale ? colors.delete : colors.secondary}
              />
            </View>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
              GÉNERO
            </Text>
          </View>

          <Text
            style={[styles.genderValue, { color: colors.text }]}
            numberOfLines={1}
          >
            {sexo || "No data"}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    padding: 14,
    justifyContent: "space-between",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  mainValue: {
    fontSize: 22,
    fontWeight: "bold",
  },
  unitText: {
    fontSize: 12,
    fontWeight: "600",
  },
  genderValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
});
