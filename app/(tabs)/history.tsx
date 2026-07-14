import CalendarToday from "@/components/CalendarToday";
import HistoryItem from "@/components/HistoryItem";
import { useTheme } from "@/context/ThemeContext";
import { RoutineSession, getRoutineSessions } from "@/store/historyRoutine";
import { getGlobalStyles } from "@/styles/global";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";

export default function HistoryScreen() {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  const [sessions, setSessions] = useState<RoutineSession[]>([]);

  const loadSessions = async () => {
    const data = await getRoutineSessions();
    setSessions(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, []),
  );

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
        {sessions.length === 0 ? (
          <Text style={globalStyles.text}>
            No hay registros todavia, ¡comienza a entrenar!
          </Text>
        ) : (
          sessions.map((session) => (
            <HistoryItem
              key={session.id}
              dateDay={new Date(session.date).toLocaleDateString("es-ES", {
                weekday: "long",
              })}
              date={new Date(session.date).toLocaleDateString("es-ES")}
              tonelaje={session.totalVolume}
              timeTrains={Math.floor(session.duration / 60)}
              id={session.id}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}
