import { useTheme } from "@/context/ThemeContext";
import { getSettings, toDisplayWeight, UserSettings, WeightUnit } from "@/store/conf";
import { getGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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

export const getAIFeedbackComment = (
  displayTonelaje: number,
  series: number,
  timerSeconds: number,
  newRecordsCount: number,
  unit: WeightUnit = "kg"
) => {
  const durationMin = Math.max(1, Math.round(timerSeconds / 60));

  if (newRecordsCount > 0) {
    return {
      title: "⚡ ¡Superación Excepcional!",
      text: `Rompiste ${newRecordsCount} nuevo${newRecordsCount > 1 ? "s" : ""} récord${newRecordsCount > 1 ? "es" : ""} personal${newRecordsCount > 1 ? "es" : ""} y acumulaste ${displayTonelaje.toLocaleString()} ${unit} de tonelaje en ${durationMin} min. ¡La sobrecarga progresiva se nota!`,
      badgeColor: "#22c55e",
    };
  }

  if (displayTonelaje >= (unit === "lb" ? 7500 : 3500)) {
    return {
      title: "🔥 ¡Volumen de Carga Masivo!",
      text: `Moviste ${displayTonelaje.toLocaleString()} ${unit} en ${series} series durante ${durationMin} min. Estímulo de hipertrofia de alto nivel. Prioriza tu hidratación y descanso.`,
      badgeColor: "#3b82f6",
    };
  }

  if (series >= 8) {
    return {
      title: "💪 ¡Gran Consistencia!",
      text: `Completaste ${series} series en ${durationMin} minutos sumando ${displayTonelaje.toLocaleString()} ${unit} totales. Excelente ritmo de trabajo.`,
      badgeColor: "#eab308",
    };
  }

  return {
    title: "💡 ¡Sesión de Estímulo Sólido!",
    text: `Completaste ${series} series en ${durationMin} min (${displayTonelaje.toLocaleString()} ${unit}). Mantener la constancia y buena técnica garantiza progresar a largo plazo.`,
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

  const [userSettings, setUserSettings] = useState<UserSettings>({
    unit: "kg",
    weightIncrement: 2.5,
    defaultRestTimer: 90,
  });

  useEffect(() => {
    getSettings().then((s) => setUserSettings(s));
  }, []);

  const displayTonelaje = toDisplayWeight(tonelaje, userSettings.unit);
  const aiComment = getAIFeedbackComment(
    displayTonelaje,
    series,
    timer,
    newRecordsCount,
    userSettings.unit
  );

  const isNeonLime =
    colors.primary?.toLowerCase().includes("c8ff") ||
    colors.primary?.toLowerCase() === "#c8ff00" ||
    colors.primary?.toLowerCase() === "#52b788";
  const onPrimaryColor = isNeonLime ? "#000000" : "#ffffff";

  return (
    <ScrollView
      style={[globalStyles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ alignItems: "center", paddingBottom: 50, paddingHorizontal: 16 }}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 65,
          width: 120,
          height: 120,
          marginTop: 24,
          marginBottom: 16,
          backgroundColor: colors.primary,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.5,
          shadowRadius: 16,
          elevation: 8,
        }}
      >
        <Ionicons name="trophy" size={64} color={onPrimaryColor} />
      </View>

      <View
        style={{
          backgroundColor: colors.primary,
          paddingHorizontal: 10,
          paddingVertical: 3,
          borderRadius: 6,
          marginBottom: 8,
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: "900", color: onPrimaryColor, letterSpacing: 1.2 }}>
          SESIÓN CONQUISTADA
        </Text>
      </View>

      <Text
        style={{
          fontSize: 26,
          fontWeight: "900",
          color: colors.text,
          textAlign: "center",
          letterSpacing: 0.5,
          textTransform: "uppercase",
        }}
      >
        ENTRENAMIENTO COMPLETADO
      </Text>
      <Text style={[globalStyles.textSecondary, { marginTop: 4, fontSize: 13, textAlign: "center" }]}>
        Has llevado la intensidad al siguiente nivel. Registro guardado en tu historial.
      </Text>

      {/* Tarjeta de Resumen Editorial */}
      <View
        style={{
          marginTop: 24,
          width: "100%",
          padding: 20,
          backgroundColor: colors.surface,
          borderRadius: 20,
          borderWidth: 1.5,
          borderColor: colors.cardBorder || "rgba(255,255,255,0.1)",
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontSize: 11, fontWeight: "800", color: colors.textSecondary, letterSpacing: 1 }}>
            RESUMEN DE SESIÓN
          </Text>
          <View
            style={{
              backgroundColor: colors.primary + "20",
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 4,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: "900", color: colors.primary }}>
              COMPLETADO ▶
            </Text>
          </View>
        </View>

        <Text style={{ fontSize: 22, fontWeight: "900", color: colors.text, marginTop: 6, textTransform: "uppercase" }}>
          {data.name}
        </Text>

        <View
          style={{
            flexDirection: "row",
            gap: 12,
            width: "100%",
            justifyContent: "space-between",
            marginTop: 18,
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: colors.background,
              padding: 14,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.cardBorder || "rgba(255,255,255,0.06)",
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: "800", color: colors.textSecondary, letterSpacing: 0.8 }}>
              DURACIÓN
            </Text>
            <Text style={{ fontWeight: "900", color: colors.text, fontSize: 26, marginTop: 4 }}>
              {formatTime(timer).hour > 0 ? `${formatTime(timer).hour}h ` : ""}
              {formatTime(timer).min}min
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              backgroundColor: colors.background,
              padding: 14,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.cardBorder || "rgba(255,255,255,0.06)",
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: "800", color: colors.textSecondary, letterSpacing: 0.8 }}>
              TONELAJE TOTAL
            </Text>
            <Text style={{ fontWeight: "900", color: colors.primary, fontSize: 26, marginTop: 4 }}>
              {displayTonelaje.toLocaleString()}{" "}
              <Text style={{ fontSize: 14, fontWeight: "800", color: colors.textSecondary }}>
                {userSettings.unit.toUpperCase()}
              </Text>
            </Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            gap: 12,
            width: "100%",
            justifyContent: "space-between",
            marginTop: 12,
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: colors.background,
              padding: 14,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.cardBorder || "rgba(255,255,255,0.06)",
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: "800", color: colors.textSecondary, letterSpacing: 0.8 }}>
              SERIES
            </Text>
            <Text style={{ fontWeight: "900", color: colors.text, fontSize: 26, marginTop: 4 }}>
              {series}
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              backgroundColor: colors.primary + "18",
              padding: 14,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: colors.primary + "45",
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: "900", color: colors.primary, letterSpacing: 0.8 }}>
              RÉCORDS PERSONALES
            </Text>
            <Text style={{ fontWeight: "900", color: colors.primary, fontSize: 26, marginTop: 4 }}>
              {newRecordsCount}{" "}
              <Text style={{ fontSize: 12, fontWeight: "800" }}>
                {newRecordsCount === 1 ? "NUEVO" : "NUEVOS"}
              </Text>
            </Text>
          </View>
        </View>
      </View>

      {/* Tarjeta de Feedback con IA */}
      <View
        style={{
          width: "100%",
          marginTop: 16,
          padding: 18,
          borderRadius: 18,
          borderColor: aiComment.badgeColor + "60",
          borderWidth: 1.5,
          backgroundColor: colors.surface,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Ionicons name="sparkles" size={18} color={aiComment.badgeColor} />
          <Text style={{ color: aiComment.badgeColor, fontWeight: "900", fontSize: 11, letterSpacing: 0.8 }}>
            EVALUACIÓN DE RENDIMIENTO FITTERME
          </Text>
        </View>

        <Text style={{ fontSize: 16, fontWeight: "800", color: colors.text, marginBottom: 6 }}>
          {aiComment.title}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19 }}>
          {aiComment.text}
        </Text>
      </View>

      {/* Botones Inferiores estilo Póster */}
      <View style={{ width: "100%", marginTop: 24, gap: 12 }}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={{
            backgroundColor: colors.primary,
            borderRadius: 16,
            paddingVertical: 16,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.45,
            shadowRadius: 10,
            elevation: 5,
          }}
          onPress={() => router.dismissAll()}
        >
          <Text style={{ color: onPrimaryColor, fontWeight: "900", fontSize: 15, letterSpacing: 0.5 }}>
            VOLVER AL INICIO
          </Text>
          <Ionicons name="arrow-forward" size={18} color={onPrimaryColor} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            paddingVertical: 15,
            alignItems: "center",
            borderWidth: 1.5,
            borderColor: colors.cardBorder || "rgba(255,255,255,0.12)",
          }}
          onPress={() => router.replace("/(tabs)/history" as any)}
        >
          <Text style={{ color: colors.text, fontWeight: "800", fontSize: 14 }}>
            VER EN HISTORIAL
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default RoutineCompleted;
