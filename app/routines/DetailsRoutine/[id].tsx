import { useTheme } from "@/context/ThemeContext";
import { getSettings, toDisplayWeight, UserSettings } from "@/store/conf";
import { getExerciseIdByExerciseName } from "@/store/excercise";
import { getRoutineSession, RoutineSession } from "@/store/historyRoutine";
import { getGlobalStyles } from "@/styles/global";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";

const DetailsRoutineScreen = () => {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [session, setSession] = useState<RoutineSession | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings>({
    unit: "kg",
    weightIncrement: 2.5,
    defaultRestTimer: 90,
  });

  const loadSession = async () => {
    const s = await getSettings();
    setUserSettings(s);
    const data = await getRoutineSession(id);
    setSession(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadSession();
    }, [id])
  );

  if (!session) return <Text style={globalStyles.cardText}> Cargando...</Text>;

  const displayTotalVolume = toDisplayWeight(session.totalVolume, userSettings.unit);

  return (
    <ScrollView style={[globalStyles.container, { padding: 15 }]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Ionicons
          name="arrow-back"
          size={32}
          onPress={() => router.back()}
          color={colors.text}
        />
        <Text style={[globalStyles.title, { marginBottom: 20 }]}>
          {session.name}
        </Text>
      </View>

      {/* Stats superiores */}
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
        {[
          {
            icon: "time-outline",
            val: (session.duration / 60).toFixed(0),
            label: "MIN",
          },
          {
            icon: "barbell",
            val: displayTotalVolume.toLocaleString(),
            label: userSettings.unit.toUpperCase(),
          },
          {
            icon: "repeat",
            val: session.exercises.reduce((acc, e) => acc + e.sets.length, 0),
            label: "SERIES",
          },
        ].map((stat, i) => (
          <View
            key={i}
            style={[
              globalStyles.card,
              { flex: 1, alignItems: "center", paddingVertical: 15 },
            ]}
          >
            <Ionicons
              name={stat.icon as any}
              size={22}
              color={colors.secondary}
            />
            <Text
              style={{ fontWeight: "bold", fontSize: 18, color: colors.text }}
            >
              {stat.val}
            </Text>
            <Text style={{ fontSize: 10, color: colors.textSecondary }}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Ejercicios */}
      {session.exercises.map((exercise, exIndex) => (
        <View
          key={`${exercise.exerciseName}-${exIndex}`}
          style={[globalStyles.card, { padding: 15, marginBottom: 20 }]}
        >
          {/* Header del ejercicio */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 15,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                flex: 1,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    backgroundColor: colors.primary + "20",
                    padding: 8,
                    borderRadius: 8,
                  }}
                >
                  <Ionicons name="barbell" size={20} color={colors.primary} />
                </View>
                <Text
                  style={{
                    fontWeight: "bold",
                    fontSize: 18,
                    color: colors.text,
                    marginLeft: 10,
                  }}
                >
                  {exercise.exerciseName}
                </Text>
              </View>
            </View>
            <Ionicons
              name="information-circle-outline"
              onPress={async () => {
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
              size={32}
              color={colors.textSecondary}
            />
          </View>

          {/* Encabezados de tabla */}
          <View
            style={{
              flexDirection: "row",
              paddingHorizontal: 10,
              marginBottom: 5,
            }}
          >
            {["SERIE", `PESO (${userSettings.unit.toUpperCase()})`, "REPS", "HITO"].map((h) => (
              <Text
                key={h}
                style={{
                  flex: 1,
                  color: colors.textSecondary,
                  fontSize: 11,
                  textAlign: "center",
                }}
              >
                {h}
              </Text>
            ))}
          </View>

          {/* Lista de sets con estilo "caja" */}
          <View style={{ gap: 8 }}>
            {(() => {
              const bestSetInExercise = exercise.sets.reduce(
                (best, s) => {
                  if (s.peso > best.peso) return s;
                  if (s.peso === best.peso && s.reps > best.reps) return s;
                  return best;
                },
                { peso: 0, reps: 0 }
              );
              return exercise.sets.map((set, setIndex) => {
                const isBestSet =
                  set.peso === bestSetInExercise.peso &&
                  set.reps === bestSetInExercise.reps &&
                  set.peso > 0;
                const displaySetWeight = toDisplayWeight(set.peso, userSettings.unit);
                return (
                  <View
                    key={`${exercise.exerciseName}-${setIndex}`}
                    style={{
                      flexDirection: "row",
                      backgroundColor: colors.background,
                      padding: 12,
                      borderRadius: 10,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{ flex: 1, textAlign: "center", color: colors.text }}
                    >
                      {setIndex + 1}
                    </Text>
                    <Text
                      style={{
                        flex: 1,
                        textAlign: "center",
                        fontWeight: "bold",
                        color: colors.text,
                      }}
                    >
                      {displaySetWeight} <Text style={{ fontSize: 10 }}>{userSettings.unit}</Text>
                    </Text>
                    <Text
                      style={{
                        flex: 1,
                        textAlign: "center",
                        fontWeight: "bold",
                        color: colors.text,
                      }}
                    >
                      {set.reps}
                    </Text>
                    <View style={{ flex: 1, alignItems: "center" }}>
                      {isBestSet && (
                        <View
                          style={{
                            backgroundColor: colors.primary + "20",
                            paddingHorizontal: 6,
                            borderRadius: 4,
                          }}
                        >
                          <Text
                            style={{
                              color: colors.primary,
                              fontSize: 10,
                              fontWeight: "bold",
                            }}
                          >
                            MEJOR
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              });
            })()}
          </View>
        </View>
      ))}
      <View style={{ height: 100 }}></View>
    </ScrollView>
  );
};

export default DetailsRoutineScreen;
