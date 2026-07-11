import { useTheme } from "@/context/ThemeContext";
import { getRoutineById } from "@/store/routines";
import { getGlobalStyles } from "@/styles/global";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

import ExerciseItem from "@/components/ExcerciseItem";

const PlayRoutineScreen = () => {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const { id } = useLocalSearchParams<{ id: string }>();
  const [routineData, setRoutineData] = useState({
    id: "",
    name: "",
    category: "",
    exercises: [] as Array<{
      id: number;
      nombre: string;
      musculo: string;
      objetivo: string;
      equipamiento: string;
      urlimage?: string;
      series?: number;
      reps?: number;
      peso?: number;
    }>,
  });
  const [serieActual, setSerieActual] = useState(0);

  const loadRoutine = async () => {
    const data = await getRoutineById(id);
    setRoutineData(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadRoutine();
    }, [id]),
  );
  if (routineData.id === "") {
    return (
      <View style={globalStyles.container}>
        <Text>Cargando rutina...</Text>
      </View>
    );
  }
  return (
    <View style={globalStyles.container}>
      <View style={globalStyles.header}>
        <View>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              color: colors.primary,
            }}
          >
            ENTRENAMIENTO ACTIVO
          </Text>
          <Text style={globalStyles.title}>{routineData.name}</Text>
        </View>
        <View
          style={[
            globalStyles.card,
            { flexDirection: "row", gap: 10, alignItems: "center" },
          ]}
        >
          <Ionicons
            name="timer-outline"
            size={32}
            color={colors.primary}
          ></Ionicons>
          <Text
            style={[globalStyles.title, { fontSize: 20, alignSelf: "center" }]}
          >
            42:15
          </Text>
        </View>
      </View>
      <View style={globalStyles.card}>
        <View
          style={{
            flexDirection: "row",
            gap: 10,
          }}
        >
          <View style={{ gap: 10, marginBottom: 20 }}>
            <Text style={globalStyles.title}>
              {routineData.exercises[0].nombre}
            </Text>

            <Text style={globalStyles.textSecondary}>
              {routineData.exercises[0].objetivo} -{" "}
              {routineData.exercises[0].equipamiento}
            </Text>
            <View
              style={{
                padding: 10,
                borderRadius: 10,
                backgroundColor: colors.background,
                width: 100,
                alignItems: "center",
              }}
            >
              <Text style={{ color: colors.primary }}>
                {routineData.exercises[0].musculo.slice(0, 1).toUpperCase() +
                  routineData.exercises[0].musculo.slice(1)}
              </Text>
            </View>
          </View>
        </View>
        <View
          style={{
            gap: 10,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", gap: 10 }}>
            {routineData?.exercises?.[0]?.series ? (
              Array.from({ length: routineData.exercises[0].series }).map(
                (_, i) => (
                  <View
                    style={[
                      globalStyles.card,
                      {
                        height: 50,
                        width: 50,
                        borderRadius: "100%",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor:
                          i === serieActual
                            ? colors.primary
                            : colors.background,
                      },
                    ]}
                    key={i}
                  >
                    <Text
                      style={[
                        globalStyles.cardText,
                        {
                          color:
                            i === serieActual
                              ? colors.neutral
                              : colors.textSecondary,
                        },
                      ]}
                    >
                      {i + 1}
                    </Text>
                  </View>
                ),
              )
            ) : (
              <Text>Cargando series...</Text>
            )}
          </View>
          <Text style={globalStyles.textSecondary}>
            Serie Actual {serieActual + 1} /{" "}
            {routineData?.exercises?.[0]?.series}
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={globalStyles.cardText}>PESO (KG)</Text>

            <TextInput
              placeholder="4"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={routineData?.exercises?.[0]?.series?.toString() ?? ""}
              style={[
                globalStyles.input,
                {
                  backgroundColor: colors.background,
                  textAlign: "center",
                  fontSize: 24,
                  marginBottom: 10,
                },
              ]}
            />
            <Text style={globalStyles.cardText}>Mejor: 75kg</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={globalStyles.cardText}>REPS</Text>

            <TextInput
              placeholder="4"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={routineData?.exercises?.[0]?.series?.toString() ?? ""}
              style={[
                globalStyles.input,
                {
                  backgroundColor: colors.background,
                  textAlign: "center",
                  fontSize: 24,
                  marginBottom: 10,
                },
              ]}
            />
            <Text style={globalStyles.cardText}>Mejor: 11</Text>
          </View>
        </View>

        <TouchableOpacity
          style={globalStyles.button}
          onPress={() => setSerieActual(serieActual + 1)}
        >
          <Text style={globalStyles.buttonText}>Completar Serie</Text>
        </TouchableOpacity>
      </View>

      <View style={[globalStyles.card, { opacity: 0.5, marginTop: 20 }]}>
        <Text style={globalStyles.title}>Proximos Ejercicios</Text>
        {routineData.exercises.map((ex) => (
          <View key={ex.id}>
            <ExerciseItem
              excerciseInfo={ex}
              onCheck={() => {}}
              isCheckedFather={false}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

export default PlayRoutineScreen;
