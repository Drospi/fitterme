import { useLocalSearchParams } from "expo-router";
import React from "react";

const DetailsRoutineScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <div>[id]</div>;
};

export default DetailsRoutineScreen;
