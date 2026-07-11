import { getRoutineById, Routine, updateRoutine } from "@/store/routines";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { View } from "react-native";
import Step1 from "../Step1";
import Step2 from "../Step2";
import Step3 from "../Step3";

const EditRoutineScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [step, setStep] = useState(1);
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

  const loadRoutine = async () => {
    const data = await getRoutineById(id);
    setRoutineData(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadRoutine();
    }, [id]),
  );

  const handleUpdate = (newData: any) => {
    setRoutineData((prev) => ({ ...prev, ...newData }));
  };

  const handleSaveRoutine = async () => {
    const routineToSave: Routine = {
      ...routineData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      exercises: routineData.exercises.map((ex) => ({
        ...ex,

        series: ex.series ? Number(ex.series) : 4,
        reps: ex.reps ? Number(ex.reps) : 10,
        peso: ex.peso ? Number(ex.peso) : 10,
      })),
    };

    await updateRoutine(routineData.id, routineToSave);

    setRoutineData({
      id: "",
      name: "",
      category: "",
      exercises: [],
    });
    router.back();
  };
  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
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
