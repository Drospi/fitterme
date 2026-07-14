import ExerciseItem from "@/components/ExcerciseItem";
import { useTheme } from "@/context/ThemeContext";
import { getExerciseIdByExerciseName } from "@/store/excercise";
import {
  addExerciseLog,
  ExerciseSet,
  getPersonalBest,
} from "@/store/historyExcercise";
import { addRoutineSession } from "@/store/historyRoutine";
import { getRoutineById } from "@/store/routines";
import { getGlobalStyles } from "@/styles/global";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import ExcerciseCompleted from "./ExcerciseCompleted";
import RoutineCompleted from "./RoutineCompleted";

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
      series: number;
      reps: number;
      peso?: number;
    }>,
  });

  const [seriesCompletadas, setSeriesCompletadas] = useState<ExerciseSet[]>([]);
  const [personalBest, setPersonalBest] = useState<{
    peso: number;
    reps: number;
  } | null>(null);

  const [serieActual, setSerieActual] = useState(0);
  const [ejercicioActual, setEjercicioActual] = useState(0);

  const [mejorRepEjercicio, setMejorRepEjercicio] = useState(0);
  const [mejorPesoEjercicio, setMejorPesoEjercicio] = useState(0);

  const [performedSets, setPerformedSets] = useState<
    Record<number, Array<{ reps: number; peso: number }>>
  >({});

  const [totalTonelaje, setTotalTonelaje] = useState(0);
  const [totalSeries, setTotalSeries] = useState(0);

  const [timer, setTimer] = useState(1);
  const [isActiveTimer, setIsActiveTimer] = useState(true);
  const [isRoutineCompleted, setIsRoutineCompleted] = useState(false);

  const loadRoutine = async () => {
    const data = await getRoutineById(id);
    setRoutineData(data);
  };

  useEffect(() => {
    let interval: number = 0;

    if (isActiveTimer && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } else if (timer === 0) {
      clearInterval(interval);
      setIsActiveTimer(false);
    }

    return () => clearInterval(interval);
  }, [isActiveTimer, timer]);

  useEffect(() => {
    const loadPR = async () => {
      const ejercicio = routineData.exercises[ejercicioActual];
      if (ejercicio) {
        setRepActual(ejercicio.reps ?? 0);
        setPesoActual(ejercicio.peso ?? 0);

        // Consultar el mejor histórico
        const pb = await getPersonalBest(ejercicio.id);
        setPersonalBest(pb);
      }
    };

    loadPR();
  }, [routineData, ejercicioActual]);

  useFocusEffect(
    useCallback(() => {
      loadRoutine();
    }, [id]),
  );
  const [repActual, setRepActual] = useState(0);
  const [pesoActual, setPesoActual] = useState(0);

  useEffect(() => {
    const ejercicio = routineData.exercises[ejercicioActual];

    if (ejercicio) {
      setRepActual(ejercicio.reps ?? 0);
      setPesoActual(ejercicio.peso ?? 0);
    }
  }, [routineData, ejercicioActual]);

  if (routineData.id === "") {
    return (
      <View style={globalStyles.container}>
        <Text>Cargando rutina...</Text>
      </View>
    );
  }
  const formatTime = (timer: number) => {
    return new Date(timer * 1000).toISOString().substr(11, 8);
  };

  const handleAddSerie = () => {
    const newExercises = [...routineData.exercises];

    newExercises[ejercicioActual] = {
      ...newExercises[ejercicioActual],
      series: (newExercises[ejercicioActual].series || 0) + 1,
    };

    setRoutineData({
      ...routineData,
      exercises: newExercises,
    });
  };

  const handleNextExercise = async () => {
    if (seriesCompletadas.length > 0) {
      console.log(
        "Intentando guardar:",
        routineData.exercises[ejercicioActual].nombre,
      );
      console.log("Series a guardar:", seriesCompletadas);
      const currentExerciseName = routineData.exercises[ejercicioActual].nombre;
      const currentExerciseId =
        await getExerciseIdByExerciseName(currentExerciseName);
      if (currentExerciseId !== null) {
        await addExerciseLog(currentExerciseId, seriesCompletadas);
      } else {
        console.error(
          "No se encontró ID para el ejercicio:",
          currentExerciseName,
        );
      }
    }

    setSeriesCompletadas([]);

    if (ejercicioActual < routineData.exercises.length - 1) {
      setEjercicioActual((prev) => prev + 1);
      setSerieActual(0);
      setMejorRepEjercicio(0);
      setMejorPesoEjercicio(0);
    } else {
      setIsActiveTimer(false);
      setIsRoutineCompleted(true);
      handleFinishRoutine();
    }
  };

  const handleFinishRoutine = async () => {
    const sessionData = {
      name: routineData.name,
      duration: timer, // Tu contador de tiempo
      totalVolume: totalTonelaje,
      exercises: routineData.exercises.map((ex) => ({
        exerciseName: ex.nombre,
        sets: performedSets[ex.id] || [],
      })),
    };

    await addRoutineSession(sessionData);
  };

  const handleCompleteSerie = () => {
    setSeriesCompletadas((prev) => [
      ...prev,
      { reps: repActual, peso: pesoActual },
    ]);
    const currentExercise = routineData.exercises[ejercicioActual];
    const newSet = { reps: repActual, peso: pesoActual };
    setPerformedSets((prev) => ({
      ...prev,
      [currentExercise.id]: [...(prev[currentExercise.id] || []), newSet],
    }));
    setSerieActual((prev) => prev + 1);
    setTotalTonelaje((prev) => prev + pesoActual * repActual);
    setTotalSeries((prev) => prev + 1);

    if (repActual > mejorRepEjercicio || pesoActual > mejorPesoEjercicio) {
      setMejorRepEjercicio(repActual);
      setMejorPesoEjercicio(pesoActual);
    }
  };

  if (isRoutineCompleted) {
    return (
      <RoutineCompleted
        data={routineData}
        timer={timer}
        tonelaje={totalTonelaje}
        series={totalSeries}
      />
    );
  }

  if (serieActual >= routineData.exercises[ejercicioActual].series) {
    return (
      <ExcerciseCompleted
        next={handleNextExercise}
        data={routineData}
        addSerie={handleAddSerie}
        timer={timer}
        series={serieActual}
        excercise={ejercicioActual}
        mejorRepEjercicio={mejorRepEjercicio}
        mejorPesoEjercicio={mejorPesoEjercicio}
      />
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
          <Text style={globalStyles.title}>
            {routineData.name.length > 18
              ? routineData.name.slice(0, 18) + "..."
              : routineData.name}
          </Text>
        </View>
        <View
          style={[
            globalStyles.card,
            {
              flexDirection: "row",
              gap: 10,
              alignItems: "center",
              marginHorizontal: 20,
              borderRadius: 30,
              justifyContent: "center",
            },
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
            {formatTime(timer)}
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
              {routineData.exercises[ejercicioActual].nombre}
            </Text>

            <Text style={globalStyles.textSecondary}>
              {routineData.exercises[ejercicioActual].objetivo} -{" "}
              {routineData.exercises[ejercicioActual].equipamiento}
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
                {routineData.exercises[ejercicioActual].musculo
                  .slice(0, 1)
                  .toUpperCase() +
                  routineData.exercises[ejercicioActual].musculo.slice(1)}
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
              Array.from({
                length: routineData.exercises[ejercicioActual].series,
              }).map((_, i) => (
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
                        i === serieActual ? colors.primary : colors.background,
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
              ))
            ) : (
              <Text>Cargando series...</Text>
            )}
          </View>
          <Text style={globalStyles.textSecondary}>
            Serie Actual {serieActual + 1} /{" "}
            {routineData?.exercises?.[ejercicioActual]?.series}
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={globalStyles.cardText}>PESO (KG)</Text>

            <View
              style={{
                flexDirection: "row",
                gap: 10,
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Ionicons
                name="remove-circle"
                onPress={() => setPesoActual(Math.max(0, pesoActual - 2.5))}
                size={32}
                color={colors.primary}
              />
              <TextInput
                placeholder="4"
                placeholderTextColor="#666"
                keyboardType="numeric"
                value={pesoActual.toString()}
                style={[
                  globalStyles.input,
                  {
                    backgroundColor: colors.background,
                    textAlign: "center",
                    fontSize: 24,
                    marginBottom: 10,
                    height: 50,
                    paddingVertical: 0,
                    width: "60%",
                  },
                ]}
              />
              <Ionicons
                name="add-circle"
                onPress={() => setPesoActual(pesoActual + 2.5)}
                size={32}
                color={colors.primary}
              />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={globalStyles.cardText}>REPS</Text>
            <View
              style={{
                flexDirection: "row",
                gap: 10,
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Ionicons
                name="remove-circle"
                size={32}
                onPress={() => setRepActual(Math.max(0, repActual - 1))}
                color={colors.primary}
              />

              <TextInput
                placeholder="4"
                placeholderTextColor="#666"
                keyboardType="numeric"
                value={repActual.toString()}
                style={[
                  globalStyles.input,
                  {
                    backgroundColor: colors.background,
                    textAlign: "center",
                    fontSize: 24,
                    marginBottom: 10,
                    height: 50,
                    paddingVertical: 0,
                    width: "60%",
                  },
                ]}
              />
              <Ionicons
                name="add-circle"
                size={32}
                color={colors.primary}
                onPress={() => setRepActual(repActual + 1)}
              />
            </View>
          </View>
        </View>
        <Text style={globalStyles.cardText}>
          Mejor serie:{" "}
          {personalBest
            ? `${personalBest.peso}kg x ${personalBest.reps} reps`
            : "Sin registro previo"}
        </Text>
        <TouchableOpacity
          style={globalStyles.button}
          onPress={() => handleCompleteSerie()}
        >
          <Text style={globalStyles.buttonText}>Completar Serie</Text>
        </TouchableOpacity>
      </View>

      <View style={[globalStyles.card, { opacity: 0.5, marginTop: 20 }]}>
        <Text style={globalStyles.title}>Proximos Ejercicios</Text>
        {routineData.exercises.slice(ejercicioActual + 1).map((ex) => (
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
