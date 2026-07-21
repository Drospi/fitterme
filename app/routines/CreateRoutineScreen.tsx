import { useTheme } from "@/context/ThemeContext";
import { Routine, addRoutine } from "@/store/routines";
import { getGlobalStyles } from "@/styles/global";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView } from "react-native";
import Step1 from "./Step1";
import Step2 from "./Step2";
import Step3 from "./Step3";

const CreateRoutineScreen = () => {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  const router = useRouter();
  const [step, setStep] = useState(1);
  const [routineData, setRoutineData] = useState({
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

    await addRoutine(routineToSave);
    setStep(1);
    setRoutineData({
      name: "",
      category: "",
      exercises: [],
    });
    router.push("/routines");
  };
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={globalStyles.container}
    >
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
    </ScrollView>
  );
};
export default CreateRoutineScreen;
