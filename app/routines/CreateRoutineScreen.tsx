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
    exercises: [],
  });
  const handleUpdate = (newData: any) => {
    setRoutineData((prev) => ({ ...prev, ...newData }));
  };
  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {step === 1 && (
        <Step1
          next={() => setStep(2)}
          data={routineData as any}
          updateData={handleUpdate}
        />
      )}
      {step === 2 && <Step2 next={() => setStep(3)} back={() => setStep(1)} />}
      {step === 3 && <Step3 back={() => setStep(2)} />}
    </View>
  );
};
export default CreateRoutineScreen;
