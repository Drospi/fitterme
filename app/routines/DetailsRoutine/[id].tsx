import ProgressiveOverloadGoals from "@/components/ProgressiveOverloadGoals";
import ShareButton from "@/components/ShareButton";
import { useTheme } from "@/context/ThemeContext";
import { isAIConfigured } from "@/store/aiConfig";
import { getSettings, toDisplayWeight, UserSettings } from "@/store/conf";
import {
  ExerciseCatalogItem,
  getAllExercises,
  getExerciseCategory,
  getExerciseIdByExerciseName,
} from "@/store/excercise";
import { isBetterSet } from "@/store/historyExcercise";
import { getRoutineSession, RoutineSession } from "@/store/historyRoutine";
import { getGlobalStyles } from "@/styles/global";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import Popover from "react-native-popover-view";
import { getAIFeedbackComment } from "../PlayRoutine/RoutineCompleted";

interface ThemedInfoPopoverProps {
  title: string;
  content: string;
  icon?: keyof typeof Ionicons.glyphMap;
  triggerIcon?: keyof typeof Ionicons.glyphMap;
  triggerColor?: string;
  colors: any;
}

const ThemedInfoPopover: React.FC<ThemedInfoPopoverProps> = ({
  title,
  content,
  icon = "information-circle",
  triggerIcon = "information-circle-outline",
  triggerColor,
  colors,
}) => {
  return (
    <Popover
      popoverStyle={{
        backgroundColor: colors.surface,
        borderRadius: 14,
        borderWidth: 0,
        borderColor: "transparent",
        shadowColor: "transparent",
        shadowOpacity: 0,
        elevation: 0,
      }}
      from={
        <TouchableOpacity
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{
            padding: 3,
            borderRadius: 10,
            backgroundColor: (triggerColor || colors.primary) + "18",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons
            name={triggerIcon}
            size={16}
            color={triggerColor || colors.primary}
          />
        </TouchableOpacity>
      }
    >
      <View
        style={{
          padding: 14,
          maxWidth: 280,
          backgroundColor: colors.surface,
          borderRadius: 14,
          borderWidth: 0,
          borderColor: "transparent",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 7,
            marginBottom: 6,
          }}
        >
          <Ionicons name={icon} size={18} color={triggerColor || colors.primary} />
          <Text
            style={{
              fontWeight: "bold",
              fontSize: 14,
              color: colors.text,
              flex: 1,
            }}
          >
            {title}
          </Text>
        </View>
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: 12,
            lineHeight: 18,
          }}
        >
          {content}
        </Text>
      </View>
    </Popover>
  );
};

const DetailsRoutineScreen = () => {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [session, setSession] = useState<RoutineSession | null>(null);
  const [aiEnabled, setAiEnabled] = useState<boolean>(false);
  const [muscleMap, setMuscleMap] = useState<Record<string, string>>({});
  const [catalogMap, setCatalogMap] = useState<Record<string, ExerciseCatalogItem>>({});
  const [userSettings, setUserSettings] = useState<UserSettings>({
    unit: "kg",
    weightIncrement: 2.5,
    defaultRestTimer: 90,
  });

  const loadSession = async () => {
    const s = await getSettings();
    setUserSettings(s);
    const hasAI = await isAIConfigured();
    setAiEnabled(hasAI);
    try {
      const catalog = await getAllExercises();
      const map: Record<string, string> = {};
      const fullMap: Record<string, ExerciseCatalogItem> = {};
      catalog.forEach((ex) => {
        const key = ex.nombre.trim().toLowerCase();
        map[key] = ex.musculo;
        fullMap[key] = ex;
      });
      setMuscleMap(map);
      setCatalogMap(fullMap);
    } catch (e) {
      console.error("Error loading exercises catalog for muscle mapping:", e);
    }
    const data = await getRoutineSession(id);
    setSession(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadSession();
    }, [id])
  );

  const getExerciseCategoryInfo = useCallback(
    (
      exerciseName: string,
      sets?: RoutineSession["exercises"][0]["sets"]
    ): "Cardio" | "Peso corporal" | "Gym" => {
      const key = exerciseName.trim().toLowerCase();
      const catalogItem = catalogMap[key];
      if (catalogItem) {
        return getExerciseCategory(catalogItem);
      }
      if (muscleMap[key]?.toLowerCase() === "cardio") return "Cardio";
      const hasCardioSignature = (sets || []).some(
        (s) => s.timeMinutes !== undefined && s.timeMinutes > 0
      );
      if (hasCardioSignature) return "Cardio";
      if (
        key.includes("cinta") ||
        key.includes("treadmill") ||
        key.includes("bicicleta") ||
        key.includes("elíptica") ||
        key.includes("eliptica") ||
        key.includes("escaladora") ||
        key.includes("stairmaster") ||
        key.includes("cardio") ||
        key.includes("remoergómetro") ||
        key.includes("salto de cuerda")
      ) {
        return "Cardio";
      }
      if (
        key.includes("dominada") ||
        key.includes("fondo") ||
        key.includes("flexion") ||
        key.includes("flexión") ||
        key.includes("plancha") ||
        key.includes("pull up") ||
        key.includes("dip") ||
        key.includes("push up")
      ) {
        return "Peso corporal";
      }
      return "Gym";
    },
    [catalogMap, muscleMap]
  );

  const nonCardioExercises = useMemo(() => {
    if (!session?.exercises) return [];
    return session.exercises.filter((ex) => {
      return getExerciseCategoryInfo(ex.exerciseName, ex.sets) !== "Cardio";
    });
  }, [session?.exercises, getExerciseCategoryInfo]);

  if (!session) return <Text style={globalStyles.cardText}> Cargando...</Text>;

  const displayTotalVolume = toDisplayWeight(session.totalVolume, userSettings.unit);
  const totalSeriesCount = session.exercises.reduce((acc, e) => acc + e.sets.length, 0);

  const formattedDate = new Date(session.date).toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const generateRoutineSummary = () => {
    let text = `🏋️ Entrenamiento Completado: ${session.name}\n📅 ${formattedDate}\n\n`;
    text += `⏱️ Duración: ${(session.duration / 60).toFixed(0)} min\n`;
    text += `📊 Volumen: ${displayTotalVolume.toLocaleString()} ${userSettings.unit.toUpperCase()}\n`;
    text += `🔄 Series / Bloques Totales: ${totalSeriesCount}\n`;
    text += `\n📋 Ejercicios:\n`;
    session.exercises.forEach((ex) => {
      const cat = getExerciseCategoryInfo(ex.exerciseName, ex.sets);
      text += `- ${ex.exerciseName} (${cat}):\n`;
      ex.sets.forEach((set, i) => {
        if (cat === "Cardio") {
          text += `  Bloque ${i + 1}: ${set.timeMinutes || 0} min · ${set.intensity || "Moderada"}\n`;
        } else if (cat === "Peso corporal") {
          const modText =
            set.peso === 0
              ? "Solo cuerpo"
              : set.peso > 0
                ? `+${toDisplayWeight(set.peso, userSettings.unit)} ${userSettings.unit} lastre`
                : `-${toDisplayWeight(Math.abs(set.peso), userSettings.unit)} ${userSettings.unit} ayuda`;
          text += `  Serie ${i + 1}: ${set.reps} reps (${modText})\n`;
        } else {
          const setWeight = toDisplayWeight(set.peso, userSettings.unit);
          text += `  Serie ${i + 1}: ${set.reps} reps x ${setWeight} ${userSettings.unit}\n`;
        }
      });
    });
    text += `\n¡Sigue así! 🚀`;
    return text;
  };

  const aiComment =
    session.aiFeedback ||
    getAIFeedbackComment(
      displayTotalVolume,
      totalSeriesCount,
      session.duration,
      0,
      userSettings.unit
    );

  return (
    <ScrollView style={[globalStyles.container, { padding: 15 }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={{ marginBottom: 18 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
            <Ionicons
              name="arrow-back"
              size={28}
              onPress={() => router.back()}
              color={colors.text}
            />
            <View style={{ flex: 1 }}>
              <Text style={[globalStyles.title, { marginBottom: 2 }]} numberOfLines={1}>
                {session.name}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
                <Text style={{ fontSize: 12, color: colors.textSecondary, textTransform: "capitalize" }}>
                  {formattedDate}
                </Text>
              </View>
            </View>
          </View>
          <ShareButton text={generateRoutineSummary()} />
        </View>
      </View>

      {/* Stats superiores (Gymrat Quick KPIs) */}
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 18 }}>
        {[
          {
            icon: "time-outline",
            val: (session.duration / 60).toFixed(0),
            label: "MIN",
            popoverTitle: "Duración de Sesión",
            popoverContent: "Tiempo activo total registrado en este entrenamiento.",
            color: colors.primary,
          },
          {
            icon: "barbell",
            val: displayTotalVolume.toLocaleString(),
            label: userSettings.unit.toUpperCase(),
            popoverTitle: `Tonelaje Total (${userSettings.unit.toUpperCase()})`,
            popoverContent: "Volumen acumulado: suma de (peso × repeticiones) de cada serie completada.",
            color: colors.secondary,
          },
          {
            icon: "repeat",
            val: totalSeriesCount,
            label: "SERIES",
            popoverTitle: "Series de Trabajo",
            popoverContent: "Número total de series completadas en todos los ejercicios de la sesión.",
            color: colors.textSecondary,
          },
        ].map((stat, i) => (
          <View
            key={i}
            style={[
              globalStyles.card,
              { flex: 1, alignItems: "center", paddingVertical: 12, paddingHorizontal: 6 },
            ]}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                width: "100%",
                alignItems: "center",
                marginBottom: 6,
                paddingHorizontal: 4,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: stat.color + "18",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name={stat.icon as any}
                  size={18}
                  color={stat.color}
                />
              </View>
              <ThemedInfoPopover
                title={stat.popoverTitle}
                content={stat.popoverContent}
                triggerColor={stat.color}
                colors={colors}
              />
            </View>
            <Text
              style={{ fontWeight: "bold", fontSize: 18, color: colors.text }}
            >
              {stat.val}
            </Text>
            <Text style={{ fontSize: 10, fontWeight: "600", color: colors.textSecondary, marginTop: 2 }}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Widget Visual IA Coach (Sin parrafadas de texto) */}
      {aiEnabled && (
        <View
          style={[
            globalStyles.card,
            {
              width: "100%",
              marginBottom: 18,
              padding: 14,
              borderColor: (aiComment.badgeColor || colors.primary) + "40",
              borderWidth: 1.5,
              backgroundColor: colors.surface,
            },
          ]}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1, marginRight: 8 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: (aiComment.badgeColor || colors.primary) + "20",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="sparkles" size={20} color={aiComment.badgeColor || colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <Text style={{ fontSize: 14, fontWeight: "bold", color: colors.text }}>
                    {aiComment.title}
                  </Text>
                  <View
                    style={{
                      backgroundColor: (aiComment.badgeColor || colors.primary) + "22",
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 6,
                    }}
                  >
                    <Text
                      style={{
                        color: aiComment.badgeColor || colors.primary,
                        fontSize: 9,
                        fontWeight: "bold",
                      }}
                    >
                      IA COACH
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                  Estímulo neuromuscular analizado
                </Text>
              </View>
            </View>

            <Popover
              popoverStyle={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                borderWidth: 0,
                borderColor: "transparent",
                shadowColor: "transparent",
                shadowOpacity: 0,
                elevation: 0,
              }}
              from={
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    paddingHorizontal: 10,
                    paddingVertical: 7,
                    borderRadius: 10,
                    backgroundColor: (aiComment.badgeColor || colors.primary) + "18",
                    borderWidth: 0,
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={14} color={aiComment.badgeColor || colors.primary} />
                  <Text style={{ fontSize: 11, fontWeight: "bold", color: aiComment.badgeColor || colors.primary }}>
                    Feedback
                  </Text>
                </TouchableOpacity>
              }
            >
              <View
                style={{
                  padding: 16,
                  maxWidth: 290,
                  backgroundColor: colors.surface,
                  borderRadius: 16,
                  borderWidth: 0,
                  borderColor: "transparent",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <Ionicons name="sparkles" size={18} color={aiComment.badgeColor || colors.primary} />
                  <Text style={{ fontWeight: "bold", fontSize: 14, color: colors.text, flex: 1 }}>
                    {aiComment.title}
                  </Text>
                </View>
                <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 18 }}>
                  {aiComment.text}
                </Text>
              </View>
            </Popover>
          </View>
        </View>
      )}

      {/* Objetivos para el próximo entrenamiento (Sobrecarga Progresiva Inteligente) */}
      <ProgressiveOverloadGoals
        exercises={nonCardioExercises}
        muscleMap={muscleMap}
        userSettings={userSettings}
      />

      {/* Título de ejercicios realizados */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: "bold",
            color: colors.text,
            letterSpacing: 0.5,
          }}
        >
          DETALLE DE SERIES
        </Text>
        <ThemedInfoPopover
          title="Registro de Series"
          content="Desglose detallado por ejercicio. Muestra tiempo e intensidad para cardio, peso y modalidad para calistenia/peso corporal, y cargas para ejercicios con pesas."
          colors={colors}
        />
      </View>

      {/* Ejercicios */}
      {session.exercises.map((exercise, exIndex) => {
        const category = getExerciseCategoryInfo(exercise.exerciseName, exercise.sets);
        const isCardio = category === "Cardio";
        const isBodyweight = category === "Peso corporal";

        const exVol = exercise.sets.reduce((sum, s) => sum + (s.peso || 0) * (s.reps || 0), 0);
        const bestSetInExercise = exercise.sets.reduce(
          (best, s) => (isBetterSet(s, best) ? s : best),
          { peso: 0, reps: 0 }
        );

        let subtitle = "";
        if (isCardio) {
          const totalMinutes = exercise.sets.reduce((sum, s) => sum + (s.timeMinutes || 0), 0);
          subtitle = `${exercise.sets.length} ${exercise.sets.length === 1 ? "bloque" : "bloques"}${totalMinutes > 0 ? ` · ⏱️ ${totalMinutes} min` : ""}`;
        } else if (isBodyweight) {
          const totalReps = exercise.sets.reduce((sum, s) => sum + (s.reps || 0), 0);
          const ballastVol = exercise.sets
            .filter((s) => s.peso > 0)
            .reduce((sum, s) => sum + s.peso * s.reps, 0);
          subtitle = `${exercise.sets.length} ${exercise.sets.length === 1 ? "serie" : "series"} · ${totalReps} reps${ballastVol > 0 ? ` · ${toDisplayWeight(ballastVol, userSettings.unit)} ${userSettings.unit} lastre` : ""}`;
        } else {
          subtitle = `${exercise.sets.length} ${exercise.sets.length === 1 ? "serie" : "series"} · ${toDisplayWeight(exVol, userSettings.unit).toLocaleString()} ${userSettings.unit}`;
        }

        const iconName: keyof typeof Ionicons.glyphMap = isCardio
          ? "pulse"
          : isBodyweight
          ? "body"
          : "barbell";
        const iconBg = isCardio
          ? "#06b6d420"
          : isBodyweight
          ? "#a855f720"
          : colors.primary + "20";
        const iconColor = isCardio
          ? "#06b6d4"
          : isBodyweight
          ? "#a855f7"
          : colors.primary;

        const tableHeaders = isCardio
          ? ["BLOQUE", "TIEMPO", "INTENSIDAD", "ESTADO"]
          : isBodyweight
          ? ["SERIE", "MODALIDAD", "REPS", "TOP"]
          : ["SERIE", `PESO (${userSettings.unit.toUpperCase()})`, "REPS", "TOP"];

        const bestCardioIdx = isCardio
          ? exercise.sets.reduce((bestIdx, s, idx, arr) => {
              const prevMin = arr[bestIdx]?.timeMinutes || 0;
              const currMin = s.timeMinutes || 0;
              return currMin > prevMin ? idx : bestIdx;
            }, 0)
          : -1;

        return (
          <View
            key={`${exercise.exerciseName}-${exIndex}`}
            style={[globalStyles.card, { padding: 14, marginBottom: 16 }]}
          >
            {/* Header del ejercicio */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1, marginRight: 8 }}>
                <View
                  style={{
                    backgroundColor: iconBg,
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Ionicons name={iconName} size={20} color={iconColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <Text
                      style={{
                        fontWeight: "bold",
                        fontSize: 16,
                        color: colors.text,
                      }}
                      numberOfLines={1}
                    >
                      {exercise.exerciseName}
                    </Text>
                    <View
                      style={{
                        backgroundColor: iconColor + "20",
                        paddingHorizontal: 6,
                        paddingVertical: 1.5,
                        borderRadius: 6,
                      }}
                    >
                      <Text style={{ fontSize: 9, fontWeight: "bold", color: iconColor }}>
                        {isCardio ? "CARDIO" : isBodyweight ? "PESO CORPORAL" : "GYM"}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 1 }}>
                    {subtitle}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={async () => {
                  Haptics.selectionAsync();
                  const exId = (exercise as any).id || (exercise as any).exerciseId;
                  if (exId) {
                    router.push({
                      pathname: "/exercises/DetailsExercise/[id]",
                      params: { id: String(exId) },
                    });
                  } else {
                    const resolvedId = await getExerciseIdByExerciseName(exercise.exerciseName);
                    router.push({
                      pathname: "/exercises/DetailsExercise/[id]",
                      params: { id: resolvedId ? String(resolvedId) : exercise.exerciseName },
                    });
                  }
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  backgroundColor: colors.primary + "18",
                  paddingHorizontal: 9,
                  paddingVertical: 6,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.primary + "35",
                }}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="stats-chart" size={13} color={colors.primary} />
                <Text style={{ fontSize: 11, fontWeight: "bold", color: colors.primary }}>
                  Stats
                </Text>
              </TouchableOpacity>
            </View>

            {/* Encabezados de tabla */}
            <View
              style={{
                flexDirection: "row",
                paddingHorizontal: 8,
                marginBottom: 6,
              }}
            >
              {tableHeaders.map((h) => (
                <Text
                  key={h}
                  style={{
                    flex: 1,
                    color: colors.textSecondary,
                    fontSize: 10,
                    fontWeight: "700",
                    textAlign: "center",
                    letterSpacing: 0.5,
                  }}
                >
                  {h}
                </Text>
              ))}
            </View>

            {/* Lista de sets con estilo visual adaptado al tipo de ejercicio */}
            <View style={{ gap: 6 }}>
              {exercise.sets.map((set, setIndex) => {
                const isBestSet =
                  set.peso === bestSetInExercise.peso &&
                  set.reps === bestSetInExercise.reps &&
                  set.reps > 0 &&
                  (set.peso > 0 || isBodyweight);

                const isBestCardioSet = isCardio && setIndex === bestCardioIdx && (set.timeMinutes || 0) > 0;
                const isHighlighted = isCardio ? isBestCardioSet : isBestSet;

                return (
                  <View
                    key={`${exercise.exerciseName}-${setIndex}`}
                    style={{
                      flexDirection: "row",
                      backgroundColor: isHighlighted ? iconColor + "10" : colors.background,
                      borderWidth: 1,
                      borderColor: isHighlighted ? iconColor + "40" : colors.textSecondary + "15",
                      paddingVertical: 10,
                      paddingHorizontal: 8,
                      borderRadius: 10,
                      alignItems: "center",
                    }}
                  >
                    {/* Columna 1: Serie / Bloque */}
                    <Text
                      style={{
                        flex: 1,
                        textAlign: "center",
                        color: colors.textSecondary,
                        fontSize: 13,
                        fontWeight: "600",
                      }}
                    >
                      {isCardio ? `B${setIndex + 1}` : setIndex + 1}
                    </Text>

                    {/* Columna 2: Tiempo (Cardio) o Modalidad (Peso Corporal) o Peso (Gym) */}
                    {isCardio ? (
                      <Text
                        style={{
                          flex: 1,
                          textAlign: "center",
                          fontWeight: "bold",
                          fontSize: 14,
                          color: colors.text,
                        }}
                      >
                        {set.timeMinutes || 0} min
                      </Text>
                    ) : isBodyweight ? (
                      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                        {set.peso === 0 ? (
                          <View
                            style={{
                              backgroundColor: "#a855f720",
                              paddingHorizontal: 7,
                              paddingVertical: 2.5,
                              borderRadius: 6,
                            }}
                          >
                            <Text style={{ fontSize: 11, fontWeight: "bold", color: "#a855f7" }}>
                              Solo cuerpo
                            </Text>
                          </View>
                        ) : set.peso > 0 ? (
                          <Text
                            style={{
                              textAlign: "center",
                              fontWeight: "bold",
                              fontSize: 12,
                              color: colors.success || "#22c55e",
                            }}
                          >
                            +{toDisplayWeight(set.peso, userSettings.unit)} {userSettings.unit}
                          </Text>
                        ) : (
                          <Text
                            style={{
                              textAlign: "center",
                              fontWeight: "bold",
                              fontSize: 11,
                              color: colors.secondary || "#3b82f6",
                            }}
                          >
                            -{toDisplayWeight(Math.abs(set.peso), userSettings.unit)} {userSettings.unit} (Ayuda)
                          </Text>
                        )}
                      </View>
                    ) : (
                      <Text
                        style={{
                          flex: 1,
                          textAlign: "center",
                          fontWeight: "bold",
                          fontSize: 14,
                          color: colors.text,
                        }}
                      >
                        {toDisplayWeight(set.peso, userSettings.unit)}
                      </Text>
                    )}

                    {/* Columna 3: Intensidad (Cardio) o Reps (Fuerza / Corporal) */}
                    {isCardio ? (
                      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                        {(() => {
                          const intensity = set.intensity || "Moderada";
                          const intColor =
                            intensity === "Máxima"
                              ? "#ef4444"
                              : intensity === "Alta"
                              ? "#f97316"
                              : intensity === "Baja"
                              ? "#10b981"
                              : "#eab308";
                          return (
                            <View
                              style={{
                                backgroundColor: intColor + "20",
                                paddingHorizontal: 7,
                                paddingVertical: 2.5,
                                borderRadius: 6,
                              }}
                            >
                              <Text style={{ fontSize: 11, fontWeight: "bold", color: intColor }}>
                                {intensity}
                              </Text>
                            </View>
                          );
                        })()}
                      </View>
                    ) : (
                      <Text
                        style={{
                          flex: 1,
                          textAlign: "center",
                          fontWeight: "bold",
                          fontSize: 14,
                          color: colors.text,
                        }}
                      >
                        {set.reps}
                      </Text>
                    )}

                    {/* Columna 4: Estado / TOP */}
                    <View style={{ flex: 1, alignItems: "center" }}>
                      {isCardio ? (
                        isBestCardioSet ? (
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 3,
                              backgroundColor: "#06b6d425",
                              paddingHorizontal: 7,
                              paddingVertical: 3,
                              borderRadius: 6,
                            }}
                          >
                            <Ionicons name="flash" size={12} color="#06b6d4" />
                            <Text style={{ color: "#06b6d4", fontSize: 10, fontWeight: "bold" }}>
                              TOP
                            </Text>
                          </View>
                        ) : (
                          <Ionicons
                            name="checkmark"
                            size={16}
                            color={colors.textSecondary + "50"}
                          />
                        )
                      ) : isBestSet ? (
                        <Popover
                          popoverStyle={{
                            backgroundColor: colors.surface,
                            borderRadius: 12,
                            borderWidth: 0,
                            borderColor: "transparent",
                            shadowColor: "transparent",
                            shadowOpacity: 0,
                            elevation: 0,
                          }}
                          from={
                            <TouchableOpacity
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 3,
                                backgroundColor: (isBodyweight ? "#a855f7" : colors.primary) + "25",
                                paddingHorizontal: 7,
                                paddingVertical: 3,
                                borderRadius: 6,
                              }}
                            >
                              <Ionicons
                                name="flame"
                                size={12}
                                color={isBodyweight ? "#a855f7" : colors.primary}
                              />
                              <Text
                                style={{
                                  color: isBodyweight ? "#a855f7" : colors.primary,
                                  fontSize: 10,
                                  fontWeight: "bold",
                                }}
                              >
                                TOP
                              </Text>
                            </TouchableOpacity>
                          }
                        >
                          <View
                            style={{
                              padding: 12,
                              maxWidth: 220,
                              backgroundColor: colors.surface,
                              borderRadius: 12,
                              borderWidth: 0,
                              borderColor: "transparent",
                            }}
                          >
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                              <Ionicons
                                name="flame"
                                size={15}
                                color={isBodyweight ? "#a855f7" : colors.primary}
                              />
                              <Text style={{ fontWeight: "bold", fontSize: 13, color: colors.text }}>
                                Mejor Serie
                              </Text>
                            </View>
                            <Text style={{ fontSize: 11, color: colors.textSecondary, lineHeight: 16 }}>
                              {isBodyweight
                                ? set.peso === 0
                                  ? `Mayor número de repeticiones registradas (${set.reps} reps).`
                                  : set.peso > 0
                                  ? `Mayor sobrecarga con lastre (+${toDisplayWeight(set.peso, userSettings.unit)} ${userSettings.unit} × ${set.reps} reps).`
                                  : `Serie completada con ayuda (${set.reps} reps).`
                                : `Mayor estímulo neuromuscular registrado en esta sesión (${toDisplayWeight(set.peso, userSettings.unit)} ${userSettings.unit} × ${set.reps} reps).`}
                            </Text>
                          </View>
                        </Popover>
                      ) : (
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color={colors.textSecondary + "50"}
                        />
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}
      <View style={{ height: 60 }} />
    </ScrollView>
  );
};

export default DetailsRoutineScreen;
