import { useTheme } from "@/context/ThemeContext";
import React from "react";
import { Text, TouchableOpacity } from "react-native";

type Props = {
  name: string;
  muscleSelected: string;
  setMuscleSelected: React.Dispatch<React.SetStateAction<string>>;
};

const Step2FilterButton = ({
  name,
  muscleSelected,
  setMuscleSelected,
}: Props) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={() => setMuscleSelected(name)}
      style={{
        backgroundColor:
          muscleSelected === name ? colors.primary : colors.surface,
        padding: 10,
        marginRight: 10,
        height: 40,
        borderRadius: 30,
        paddingHorizontal: 20,
      }}
    >
      <Text
        style={{
          color: muscleSelected === name ? colors.neutral : colors.text,
        }}
      >
        {name}
      </Text>
    </TouchableOpacity>
  );
};

export default Step2FilterButton;
