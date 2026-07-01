import { useTheme } from "@/context/ThemeContext";
import { getGlobalStyles } from "@/styles/global";
import React from "react";
import { Text, TouchableOpacity } from "react-native";

type AddButtonProps = {
  title: string;
  handleFunction: () => void;
};

const AddButton = ({ handleFunction, title }: AddButtonProps) => {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  return (
    <TouchableOpacity style={globalStyles.button} onPress={handleFunction}>
      <Text style={globalStyles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
};

export default AddButton;
