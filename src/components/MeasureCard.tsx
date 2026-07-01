import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../styles/global";

type Props = {
  name: string;
  measure: number;
  setMeasure: (measure: number) => void;
};

const MeasureCard = ({ name, measure, setMeasure }: Props) => {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{name}</Text>
      <View style={styles.row}>
        <TouchableOpacity onPress={() => setMeasure(Math.max(0, measure - 1))}>
          <Ionicons
            name="remove-circle-outline"
            size={32}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        <Text style={styles.value}>{measure} cm</Text>

        <TouchableOpacity onPress={() => setMeasure(measure + 1)}>
          <Ionicons
            name="add-circle-outline"
            size={32}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default MeasureCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    marginTop: 20,
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: colors.textSecondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: "center",
  },
  label: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  value: {
    fontSize: 28,
    fontWeight: "bold",
    marginHorizontal: 20,
    color: colors.text,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
});
