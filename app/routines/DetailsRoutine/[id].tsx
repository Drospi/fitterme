import { useTheme } from "@/context/ThemeContext";
import { getRoutineSession, RoutineSession } from "@/store/historyRoutine";
import { getGlobalStyles } from "@/styles/global";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";

const DetailsRoutineScreen = () => {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [session, setSession] = useState<RoutineSession | null>(null);

  const loadSession = async () => {
    const data = await getRoutineSession(id);
    setSession(data);
  };

  useEffect(() => {
    loadSession();
  }, []);

  if (!session) return <Text style={globalStyles.cardText}> Cargando...</Text>;

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
          { icon: "barbell", val: session.totalVolume, label: "KG" },
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
              onPress={() =>
                router.push({
                  pathname: "../../exercises/DetailsExercise/[id]",
                  params: { id: exercise.exerciseName },
                })
              }
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
            {["SERIE", "PESO", "REPS", "HITO"].map((h) => (
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
            {exercise.sets.map((set, setIndex) => {
              const bestWeight = exercise.sets.reduce(
                (acc, s) => Math.max(acc, s.peso),
                0,
              );
              const bestReps = exercise.sets.reduce(
                (acc, s) => Math.max(acc, s.reps),
                0,
              );
              return (
                <View
                  key={`${exercise.exerciseName}-${setIndex}`}
                  style={{
                    flexDirection: "row",
                    backgroundColor: colors.background, // Un color ligeramente diferente al card
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
                    {set.peso} <Text style={{ fontSize: 10 }}>kg</Text>
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
                    {bestWeight === set.peso && bestReps === set.reps && (
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
            })}
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

export default DetailsRoutineScreen;
