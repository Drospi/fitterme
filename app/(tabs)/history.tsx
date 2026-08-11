import CalendarToday from "@/components/CalendarToday";
import HistoryItem from "@/components/HistoryItem";
import WorkoutCalendarModal from "@/components/WorkoutCalendarModal";
import { useTheme } from "@/context/ThemeContext";
import { getSettings, UserSettings } from "@/store/conf";
import { getRoutineSessions, RoutineSession } from "@/store/historyRoutine";
import { getGlobalStyles } from "@/styles/global";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";

export default function HistoryScreen() {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  const [sessions, setSessions] = useState<RoutineSession[]>([]);
  const [userSettings, setUserSettings] = useState<UserSettings>({
    unit: "kg",
    weightIncrement: 2.5,
    defaultRestTimer: 90,
  });

  // Estado del Modal de Calendario
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [calendarInitialDate, setCalendarInitialDate] = useState<string | undefined>(undefined);

  const loadData = async () => {
    const s = await getSettings();
    setUserSettings(s);
    const data = await getRoutineSessions();
    setSessions(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleOpenCalendar = (dateStr?: string) => {
    setCalendarInitialDate(dateStr);
    setIsCalendarVisible(true);
  };

  return (
    <ScrollView style={globalStyles.container} showsVerticalScrollIndicator={false}>
      <View
        style={[
          globalStyles.header,
          { flexDirection: "column", alignItems: "flex-start" },
        ]}
      >
        <Text style={globalStyles.title}>Historial</Text>
        <Text style={globalStyles.text}>Tus registros diarios y progreso</Text>
      </View>

      <View style={{ marginTop: 25, gap: 20 }}>
        <CalendarToday onPress={() => handleOpenCalendar()} />
      </View>

      <View style={{ marginTop: 25, gap: 15, marginBottom: 100 }}>
        {sessions.length === 0 ? (
          <View style={[globalStyles.card, { alignItems: "center", paddingVertical: 30 }]}>
            <Text style={globalStyles.cardText}>
              No hay registros todavía, ¡comienza a entrenar!
            </Text>
          </View>
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
              unit={userSettings.unit}
              onDatePress={() => handleOpenCalendar(session.date)}
            />
          ))
        )}
      </View>

      {/* Modal de Calendario Interactivo con Puntitos */}
      <WorkoutCalendarModal
        visible={isCalendarVisible}
        onClose={() => setIsCalendarVisible(false)}
        sessions={sessions}
        unit={userSettings.unit}
        initialDate={calendarInitialDate}
      />
    </ScrollView>
  );
}
