import CalendarToday from "@/components/CalendarToday";
import HistoryAIChatModal from "@/components/HistoryAIChatModal";
import HistoryItem from "@/components/HistoryItem";
import WorkoutCalendarModal from "@/components/WorkoutCalendarModal";
import { useTheme } from "@/context/ThemeContext";
import { isAIConfigured } from "@/store/aiConfig";
import { getSettings, toDisplayWeight, UserSettings } from "@/store/conf";
import { getRoutineSessions, RoutineSession } from "@/store/historyRoutine";
import { getGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function HistoryScreen() {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  const PAGE_SIZE = 6;
  const [sessions, setSessions] = useState<RoutineSession[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [userSettings, setUserSettings] = useState<UserSettings>({
    unit: "kg",
    weightIncrement: 2.5,
    defaultRestTimer: 90,
  });

  const displayedSessions = useMemo(() => {
    return sessions.slice(0, visibleCount);
  }, [sessions, visibleCount]);

  // Estado del Modal de Calendario
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [calendarInitialDate, setCalendarInitialDate] = useState<string | undefined>(undefined);

  // Estado para Chatbot IA flotante (visible solo si la IA está activa en configuración)
  const [isAIAvailable, setIsAIAvailable] = useState(false);
  const [isAIChatVisible, setIsAIChatVisible] = useState(false);

  const loadData = async () => {
    const s = await getSettings();
    setUserSettings(s);
    const data = await getRoutineSessions();
    setSessions(data);

    const hasAI = await isAIConfigured();
    setIsAIAvailable(hasAI);
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

  // Métricas globales acumuladas
  const totalWorkouts = sessions.length;
  const totalVolumeKg = useMemo(() => {
    return sessions.reduce((acc, s) => acc + (s.totalVolume || 0), 0);
  }, [sessions]);
  const totalMinutes = useMemo(() => {
    return sessions.reduce((acc, s) => acc + Math.floor((s.duration || 0) / 60), 0);
  }, [sessions]);

  const displayTotalVolume = toDisplayWeight(totalVolumeKg, userSettings.unit);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView style={globalStyles.container} showsVerticalScrollIndicator={false}>
      {/* Header Minimalista */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          marginTop: 6,
        }}
      >
        <View>
          <Text style={[globalStyles.title, { marginBottom: 2 }]}>Historial</Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary }}>
            Tus registros diarios y progreso
          </Text>
        </View>

        {sessions.length > 0 && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              backgroundColor: colors.surface,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.neutral,
            }}
          >
            <Ionicons name="barbell" size={14} color={colors.primary} />
            <Text style={{ fontSize: 13, fontWeight: "bold", color: colors.text }}>
              {sessions.length} {sessions.length === 1 ? "sesión" : "sesiones"}
            </Text>
          </View>
        )}
      </View>



      {/* Widget Calendario Hoy */}
      <CalendarToday onPress={() => handleOpenCalendar()} />

      {/* Lista de Registros */}
      <View style={{ marginTop: 20, marginBottom: 90 }}>
        {sessions.length > 0 && (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.text }}>
              Entrenamientos
            </Text>
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textSecondary }}>
              Mostrando {Math.min(visibleCount, sessions.length)} de {sessions.length}
            </Text>
          </View>
        )}

        {sessions.length === 0 ? (
          <View
            style={[
              globalStyles.card,
              {
                alignItems: "center",
                paddingVertical: 36,
                paddingHorizontal: 20,
                borderWidth: 1,
                borderColor: colors.neutral,
                marginTop: 10,
              },
            ]}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: colors.neutral,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 14,
              }}
            >
              <Ionicons name="barbell-outline" size={26} color={colors.primary} />
            </View>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "bold",
                color: colors.text,
                marginBottom: 4,
                textAlign: "center",
              }}
            >
              Sin entrenamientos registrados
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: colors.textSecondary,
                textAlign: "center",
                lineHeight: 18,
              }}
            >
              Completa una rutina para ver aquí tu tonelaje, duración y progreso diario.
            </Text>
          </View>
        ) : (
          <>
            {displayedSessions.map((session) => (
              <HistoryItem
                key={session.id}
                routineName={session.name}
                exercisesCount={session.exercises?.length}
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
            ))}

            {visibleCount < sessions.length && (
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setVisibleCount((prev) => prev + PAGE_SIZE);
                }}
                activeOpacity={0.8}
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.primary + "35",
                  borderRadius: 16,
                  paddingVertical: 14,
                  paddingHorizontal: 20,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  marginTop: 10,
                }}
              >
                <Ionicons name="chevron-down-circle-outline" size={18} color={colors.primary} />
                <Text
                  style={{
                    color: colors.primary,
                    fontWeight: "bold",
                    fontSize: 13,
                    letterSpacing: 0.5,
                  }}
                >
                  VER MÁS ENTRENAMIENTOS ({sessions.length - visibleCount} restantes)
                </Text>
              </TouchableOpacity>
            )}
          </>
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

    {/* Botón Flotante para Abrir el Chatbot IA (Solo si la opción IA está activada en configuración) */}
    {isAIAvailable && (
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setIsAIChatVisible(true);
        }}
        style={{
          position: "absolute",
          bottom: 24,
          right: 20,
          width: 58,
          height: 58,
          borderRadius: 29,
          backgroundColor: colors.primary,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.45,
          shadowRadius: 8,
          elevation: 8,
          borderWidth: 2,
          borderColor: colors.background,
        }}
        activeOpacity={0.85}
      >
        <Ionicons name="chatbubble-ellipses" size={26} color={colors.background} />
        {/* Destello decorativo de IA */}
        <View
          style={{
            position: "absolute",
            top: -2,
            right: -2,
            backgroundColor: colors.surface,
            borderRadius: 9,
            padding: 3,
            borderWidth: 1.5,
            borderColor: colors.primary,
          }}
        >
          <Ionicons name="sparkles" size={11} color={colors.primary} />
        </View>
      </TouchableOpacity>
    )}

    {/* Modal de Chatbot de IA con Selector de Contexto */}
    <HistoryAIChatModal
      visible={isAIChatVisible}
      onClose={() => setIsAIChatVisible(false)}
    />
  </View>
  );
}
