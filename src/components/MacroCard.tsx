import { useTheme } from "@/context/ThemeContext";
import { getGlobalStyles } from "@/styles/global";
import { StyleSheet, Text, View } from "react-native";
type MacroCardProps = {
  label: string;
  value: string;
  goal: string;
  color: string;
};

export default function MacroCard({
  label,
  value,
  goal,
  color,
}: MacroCardProps) {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  return (
    <View style={[globalStyles.card, { borderLeftColor: color }, styles.card]}>
      <Text style={globalStyles.cardTitle}>{label}</Text>
      <Text style={globalStyles.cardText}> {value}</Text>
      <Text style={globalStyles.cardText}>/ {goal}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    width: "47%",
    borderLeftWidth: 4,
  },
  label: {
    fontSize: 14,
    color: "#a0a0b0",
  },
  value: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    marginTop: 4,
  },
  goal: {
    fontSize: 14,
    color: "#a0a0b0",
    marginTop: 2,
  },
});
