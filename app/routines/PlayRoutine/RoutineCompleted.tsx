import { useTheme } from "@/context/ThemeContext";
import { getGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

type ExerciseType = {
  id: number;
  nombre: string;
  musculo: string;
  objetivo: string;
  equipamiento: string;
  urlimage?: string;
  series?: number;
  reps?: number;
  peso?: number;
};

type Props = {
  data: {
    name: string;
    exercises: ExerciseType[];
  };
  timer: number;
  tonelaje: number;
  series: number;
  newRecordsCount?: number;
};

const formatTime = (timer: number) => {
  const hour = Math.floor(timer / 3600);
  const min = Math.floor((timer % 3600) / 60);
  const sec = Math.floor(timer % 60);
  return { hour, min, sec };
};

const getAIFeedbackComment = (
  tonelaje: number,
  series: number,
  timerSeconds: number,
  newRecordsCount: number
) => {
  const durationMin = Math.max(1, Math.round(timerSeconds / 60));

  if (newRecordsCount > 0) {
    return {
      title: "⚡ ¡Superación Excepcional!",
      text: `Rompiste ${newRecordsCount} nuevo${newRecordsCount > 1 ? "s" : ""} récord${newRecordsCount > 1 ? "s" : ""} personal${newRecordsCount > 1 ? "es" : ""} y acumulaste ${tonelaje.toLocaleString()} kg de tonelaje en ${durationMin} min. ¡La sobrecarga progresiva se nota!`,
      badgeColor: "#22c55e",
    };
  }

  if (tonelaje >= 3500) {
    return {
      title: "🔥 ¡Volumen de Carga Masivo!",
      text: `Moviste ${tonelaje.toLocaleString()} kg en ${series} series durante ${durationMin} min. Estímulo de hipertrofia de alto nivel. Prioriza tu hidratación y descanso.`,
      badgeColor: "#3b82f6",
    };
  }

  if (series >= 8) {
    return {
      title: "💪 ¡Gran Consistencia!",
      text: `Completaste ${series} series en ${durationMin} minutos sumando ${tonelaje.toLocaleString()} kg totales. Excelente ritmo de trabajo.`,
      badgeColor: "#eab308",
    };
  }

  return {
    title: "💡 ¡Sesión de Estímulo Sólido!",
    text: `Completaste ${series} series en ${durationMin} min (${tonelaje.toLocaleString()} kg). Mantener la constancia y buena técnica garantiza progresar a largo plazo.`,
    badgeColor: "#a855f7",
  };
};

const RoutineCompleted = ({
  data,
  timer,
  tonelaje,
  series,
  newRecordsCount = 0,
}: Props) => {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const router = useRouter();

  const aiComment = getAIFeedbackComment(tonelaje, series, timer, newRecordsCount);

  return (
    <ScrollView
      style={globalStyles.container}
      contentContainerStyle={{ alignItems: "center", paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 100,
          backgroundColor: colors.primary + "25",
          width: 130,
          height: 130,
          marginTop: 20,
          marginBottom: 15,
        }}
      >
        <Ionicons name="trophy" size={80} color={colors.primary} />
      </View>

      <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.primary, textAlign: "center" }}>
        ENTRENAMIENTO COMPLETADO
      </Text>
      <Text style={[globalStyles.textSecondary, { marginTop: 4 }]}>
        Sesión finalizada con éxito.
      </Text>

      {/* Tarjeta de Resumen */}
      <View style={[globalStyles.card, { marginTop: 20, width: "100%", padding: 18 }]}>
        <Text style={globalStyles.cardText}>Resumen de la Rutina</Text>
        <Text style={[globalStyles.cardTitle, { fontSize: 22, fontWeight: "bold", marginTop: 4 }]}>
          {data.name}
        </Text>

        <View
          style={{
            flexDirection: "row",
            gap: 10,
            width: "100%",
            justifyContent: "space-between",
            marginTop: 15,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={globalStyles.cardText}>DURACIÓN</Text>
            <Text style={{ fontWeight: "bold", color: colors.text, fontSize: 32 }}>
              {formatTime(timer).hour > 0 ? `${formatTime(timer).hour}h ` : ""}
              {formatTime(timer).min}min
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={globalStyles.cardText}>TONELAJE TOTAL</Text>
            <Text style={{ fontWeight: "bold", color: colors.text, fontSize: 32 }}>
              {tonelaje.toLocaleString()} <Text style={{ fontSize: 16 }}>KG</Text>
            </Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            gap: 10,
            width: "100%",
            justifyContent: "space-between",
            marginTop: 20,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={globalStyles.cardText}>SERIES COMPLETADAS</Text>
            <Text style={{ fontWeight: "bold", color: colors.text, fontSize: 32 }}>
              {series}
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              backgroundColor: colors.primary + "20",
              borderRadius: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: colors.primary + "40",
            }}
          >
            <Text style={[globalStyles.cardText, { color: colors.primary, fontWeight: "bold" }]}>
              NUEVOS RÉCORDS
            </Text>
            <Text
              style={{
                fontWeight: "bold",
                color: colors.primary,
                fontSize: 32,
                marginTop: 2,
              }}
            >
              {newRecordsCount}{" "}
              <Text style={{ color: colors.primary, fontSize: 16 }}>
                {newRecordsCount === 1 ? "NUEVO" : "NUEVOS"}
              </Text>
            </Text>
          </View>
        </View>
      </View>

      {/* Tarjeta de Feedback con IA */}
      <View
        style={[
          globalStyles.card,
          {
            width: "100%",
            marginTop: 15,
            padding: 16,
            borderColor: aiComment.badgeColor + "60",
            borderWidth: 1.5,
            backgroundColor: colors.surface,
          },
        ]}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Ionicons name="sparkles" size={20} color={aiComment.badgeColor} />
          <Text style={{ color: aiComment.badgeColor, fontWeight: "bold", fontSize: 13, letterSpacing: 0.5 }}>
            EVALUACIÓN IA DEL ENTRENAMIENTO
          </Text>
        </View>

        <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.text, marginBottom: 6 }}>
          {aiComment.title}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19 }}>
          {aiComment.text}
        </Text>
      </View>

      {/* Botones Inferiores */}
      <View style={{ width: "100%", marginTop: 25, gap: 12 }}>
        <TouchableOpacity
          style={[globalStyles.button, { width: "100%" }]}
          onPress={() => router.dismissAll()}
        >
          <Text style={globalStyles.buttonText}>VOLVER AL INICIO</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            globalStyles.button,
            { backgroundColor: colors.surface, width: "100%", borderWidth: 1, borderColor: colors.textSecondary + "40" },
          ]}
          onPress={() => router.replace("/(tabs)/history" as any)}
        >
          <Text style={{ color: colors.text, fontWeight: "bold" }}>
            VER EN HISTORIAL
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default RoutineCompleted;
