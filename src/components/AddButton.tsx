import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { globalStyles } from "../styles/global";

type AddButtonProps = {
  title: string;
  handleFunction: () => void;
};

const AddButton = ({ handleFunction, title }: AddButtonProps) => {
  return (
    <TouchableOpacity style={globalStyles.button} onPress={handleFunction}>
      <Text style={globalStyles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
};

export default AddButton;
