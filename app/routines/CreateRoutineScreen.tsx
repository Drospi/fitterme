import { Routine, addRoutine } from "@/store/routines";
import { getGlobalStyles } from "@/styles/global";
import { useTheme } from "@react-navigation/native";
import { useState } from "react";
import { View } from "react-native";
import Step1 from "./Step1";
import Step2 from "./Step2";
import Step3 from "./Step3";

const CreateRoutineScreen = () => {
  const { colors } = useTheme();
  const styles = getGlobalStyles(colors);
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

  const handleSaveRoutine = () => {
    const routineToSave: Routine = {
      ...routineData,
      id: Date.now().toString(), // Generamos un ID si no existe
      createdAt: new Date().toISOString(),
      exercises: routineData.exercises.map((ex) => ({
        ...ex,
        // Convertimos a número, asegurando que sea 0 si está vacío
        series: ex.series ? Number(ex.series) : 0,
        reps: ex.reps ? Number(ex.reps) : 0,
        peso: ex.peso ? Number(ex.peso) : 0,
      })),
    };

    addRoutine(routineToSave);
    setStep(1);
    setRoutineData({
      name: "",
      category: "",
      exercises: [],
    });
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
export default CreateRoutineScreen;
