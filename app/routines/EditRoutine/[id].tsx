import { useTheme } from "@/context/ThemeContext";
import { getRoutineById, Routine, updateRoutine } from "@/store/routines";
import { getGlobalStyles } from "@/styles/global";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import Step1 from "../Step1";
import Step2 from "../Step2";
import Step3 from "../Step3";

const EditRoutineScreen = () => {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [routineData, setRoutineData] = useState<any>({
    id: "",
    name: "",
    category: "",
    createdAt: new Date().toISOString(),
    exercises: [],
  });

  const loadRoutine = async () => {
    if (!id) return;
    try {
      const data = await getRoutineById(id);
      if (data) {
        setRoutineData(data);
      }
    } catch (error) {
      console.error("Error al cargar rutina para editar:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadRoutine();
    }, [id])
  );

  const handleUpdate = (newData: any) => {
    setRoutineData((prev: any) => ({ ...prev, ...newData }));
  };

  const handleSaveRoutine = async () => {
    if (!routineData.id) return;

    const routineToSave: Routine = {
      ...routineData,
      createdAt: routineData.createdAt || new Date().toISOString(),
      exercises: (routineData.exercises || []).map((ex: any) => ({
        ...ex,
        series: ex.series ? Number(ex.series) : 4,
        reps: ex.reps ? Number(ex.reps) : 10,
        peso: ex.peso ? Number(ex.peso) : 10,
      })),
    };

    await updateRoutine(routineData.id, routineToSave);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    alert("¡Rutina actualizada con éxito!");
    router.replace("/(tabs)/routines" as any);
  };

  if (loading) {
    return (
      <View style={[globalStyles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      {/* Header Bar */}
      <View style={[globalStyles.header, { marginBottom: 15 }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={[globalStyles.title, { fontSize: 20, marginBottom: 0 }]}>
          Editar Rutina
        </Text>
        <View style={{ width: 26 }} />
      </View>

      {step === 1 && (
        <Step1
          next={() => setStep(2)}
          data={routineData}
          updateData={handleUpdate}
        />
      )}
      {step === 2 && (
        <Step2
          next={() => setStep(3)}
          back={() => setStep(1)}
          data={routineData}
          updateData={handleUpdate}
        />
      )}
      {step === 3 && (
        <Step3
          back={() => setStep(2)}
          data={routineData}
          updateData={handleUpdate}
          saveRoutine={handleSaveRoutine}
        />
      )}
    </View>
  );
};

export default EditRoutineScreen;
