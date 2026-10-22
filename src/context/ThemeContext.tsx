import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeMode = "dark" | "light" | "midnight" | "emerald" | "sunset" | "sunsetNeo";

export type ThemeColors = {
  background: string;
  surface: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  textSecondary: string;
  textWhite: string;
  success: string;
  neutral: string;
  delete: string;
  cardBorder: string;
  cardHighlight: string;
  flame: string;
  protein: string;
  carbs: string;
  fat: string;
  rest: string;
  warning: string;
  info: string;
};

export const themes: Record<
  ThemeMode,
  {
    name: string;
    icon: string;
    colors: ThemeColors;
  }
> = {
  dark: {
    name: "Oscuro Cyberpunk",
    icon: "moon",
    colors: {
      background: "#12121e",
      surface: "#1e1e32",
      secondary: "#0066ff",
      primary: "#C8FF00",
      accent: "#C8FF00",
      text: "#ffffff",
      textWhite: "#ffffff",
      textSecondary: "#a0a0b0",
      success: "#4CAF50",
      neutral: "#121212",
      delete: "#FF4D4D",
      cardBorder: "rgba(200, 255, 0, 0.15)",
      cardHighlight: "rgba(200, 255, 0, 0.08)",
      flame: "#FF7A00",
      protein: "#38BDF8",
      carbs: "#FBBF24",
      fat: "#C084FC",
      rest: "#00B4D8",
      warning: "#F59E0B",
      info: "#38BDF8",
    },
  },
  light: {
    name: "Claro Fresco",
    icon: "sunny",
    colors: {
      background: "#F4F6F9",
      surface: "#FFFFFF",
      secondary: "#0055FF",
      primary: "#0066FF",
      accent: "#0055FF",
      text: "#1A1D20",
      textSecondary: "#6C757D",
      textWhite: "#ffffff",
      success: "#28A745",
      neutral: "#E9ECEF",
      delete: "#DC3545",
      cardBorder: "rgba(0, 102, 255, 0.12)",
      cardHighlight: "rgba(0, 102, 255, 0.06)",
      flame: "#EA580C",
      protein: "#0284C7",
      carbs: "#D97706",
      fat: "#9333EA",
      rest: "#0891B2",
      warning: "#D97706",
      info: "#0284C7",
    },
  },
  midnight: {
    name: "Azul Noche",
    icon: "planet",
    colors: {
      background: "#0B132B",
      surface: "#1C2541",
      secondary: "#3A86EF",
      primary: "#C8FF00",
      accent: "#00B4D8",
      text: "#F8F9FA",
      textSecondary: "#8D99AE",
      textWhite: "#ffffff",
      success: "#06D6A0",
      neutral: "#0B132B",
      delete: "#EF476F",
      cardBorder: "rgba(200, 255, 0, 0.15)",
      cardHighlight: "rgba(0, 180, 216, 0.08)",
      flame: "#FF7A00",
      protein: "#38BDF8",
      carbs: "#FBBF24",
      fat: "#C084FC",
      rest: "#00B4D8",
      warning: "#F59E0B",
      info: "#38BDF8",
    },
  },
  emerald: {
    name: "Verde Esmeralda",
    icon: "leaf",
    colors: {
      background: "#081C15",
      surface: "#1B4332",
      secondary: "#2D6A4F",
      primary: "#52B788",
      accent: "#74C69D",
      text: "#D8F3DC",
      textSecondary: "#95D5B2",
      textWhite: "#ffffff",
      success: "#40916C",
      neutral: "#081C15",
      delete: "#FF5964",
      cardBorder: "rgba(82, 183, 136, 0.2)",
      cardHighlight: "rgba(82, 183, 136, 0.08)",
      flame: "#F48C06",
      protein: "#52B788",
      carbs: "#E9C46A",
      fat: "#F4A261",
      rest: "#40916C",
      warning: "#F4A261",
      info: "#74C69D",
    },
  },
  sunset: {
    name: "Atardecer Cálido",
    icon: "flame",
    colors: {
      background: "#1A0914",
      surface: "#2D1225",
      secondary: "#E01E5A",
      primary: "#FF6B35",
      accent: "#FF8C42",
      text: "#FFF0F5",
      textSecondary: "#C77DFF",
      textWhite: "#ffffff",
      success: "#00F5D4",
      neutral: "#1A0914",
      delete: "#FF206E",
      cardBorder: "rgba(255, 107, 53, 0.2)",
      cardHighlight: "rgba(255, 107, 53, 0.08)",
      flame: "#FF4D00",
      protein: "#FF8C42",
      carbs: "#FFC857",
      fat: "#C77DFF",
      rest: "#00F5D4",
      warning: "#FFB703",
      info: "#00F5D4",
    },
  },
  sunsetNeo: {
    name: "Dark Sunset UI (Kit)",
    icon: "contrast",
    colors: {
      background: "#141724",
      surface: "#1E2235",
      secondary: "#FF3D60",
      primary: "#FF7328",
      accent: "#FF7328",
      text: "#F3F5FA",
      textSecondary: "#8F97B2",
      textWhite: "#ffffff",
      success: "#22C55E",
      neutral: "#151826",
      delete: "#FF4757",
      cardBorder: "rgba(255, 115, 40, 0.25)",
      cardHighlight: "rgba(255, 61, 96, 0.15)",
      flame: "#FF7328",
      protein: "#FF7328",
      carbs: "#FF9F43",
      fat: "#FF3D60",
      rest: "#00B4D8",
      warning: "#F59E0B",
      info: "#38BDF8",
    },
  },
};

const THEME_STORAGE_KEY = "UserThemeMode_v1";

type ThemeContextType = {
  colors: ThemeColors;
  themeName: ThemeMode;
  setThemeName: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: boolean;
  isLoading: boolean;
};

const ThemeContext = createContext<ThemeContextType>({
  colors: themes.dark.colors,
  themeName: "dark",
  setThemeName: () => {},
  toggleTheme: () => {},
  isDark: true,
  isLoading: true,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved && (saved in themes)) {
          setThemeMode(saved as ThemeMode);
        }
      } catch (error) {
        console.error("Error al cargar tema:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTheme();
  }, []);

  const changeTheme = async (mode: ThemeMode) => {
    setThemeMode(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error("Error al guardar tema:", error);
    }
  };

  const toggleTheme = () => {
    const newMode: ThemeMode = themeMode === "light" ? "dark" : "light";
    changeTheme(newMode);
  };

  const currentTheme = themes[themeMode] || themes.dark;

  return (
    <ThemeContext.Provider
      value={{
        colors: currentTheme.colors,
        themeName: themeMode,
        setThemeName: changeTheme,
        toggleTheme,
        isDark: themeMode !== "light",
        isLoading,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
