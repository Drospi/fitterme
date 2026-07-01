import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export const lightTheme = {
  background: "#ffffff",
  surface: "#f0f0f0",
  primary: "#007AFF",
  text: "#000000",
  textSecondary: "#666666",
};
export const darkTheme = {
  background: "#1a1a2e",
  surface: "#2a2a4a",
  primary: "#4fc3f7",
  text: "#ffffff",
  textSecondary: "#a0a0b0",
};

const ThemeContext = createContext({
  colors: darkTheme,
  toggleTheme: () => {},
  isDark: true,
  isLoading: true,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDark, setIsDark] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar tema guardado al iniciar
  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await AsyncStorage.getItem("isDark");
      if (savedTheme !== null) setIsDark(JSON.parse(savedTheme));
      setIsLoading(false);
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newMode = !isDark;
    setIsDark(newMode);
    await AsyncStorage.setItem("isDark", JSON.stringify(newMode));
  };

  const colors = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ colors, toggleTheme, isDark, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
