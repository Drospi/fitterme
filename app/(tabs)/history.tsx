import CalendarToday from "@/components/CalendarToday";
import HistoryItem from "@/components/HistoryItem";
import { useTheme } from "@/context/ThemeContext";
import { getGlobalStyles } from "@/styles/global";
import React from "react";
import { ScrollView, Text, View } from "react-native";

export default function HistoryScreen() {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  return (
    <ScrollView style={globalStyles.container}>
      <View
        style={[
          globalStyles.header,
          { flexDirection: "column", alignItems: "flex-start" },
        ]}
      >
        <Text style={globalStyles.title}>Historial</Text>
        <Text style={globalStyles.text}>Tus registros diarios y progreso</Text>
      </View>
      <View style={{ marginTop: 30, gap: 20 }}>
        <CalendarToday />
      </View>
      <View style={{ marginTop: 30, gap: 20 }}>
        <HistoryItem
          dateDay="Lunes"
          date="01/01/2023"
          kcal={1000}
          timeTrains={65}
        />

        <HistoryItem
          dateDay="Lunes"
          date="01/01/2023"
          kcal={1000}
          timeTrains={65}
        />

        <HistoryItem
          dateDay="Lunes"
          date="01/01/2023"
          kcal={1000}
          timeTrains={65}
        />
      </View>
    </ScrollView>
  );
}
