import { useTheme } from "@/context/ThemeContext";
import { StyleSheet } from "react-native";

export const { colors } = useTheme();

export const getGlobalStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: 60,
      paddingHorizontal: 20,
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: colors.text,
      marginTop: 10,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.textSecondary,
      marginTop: 30,
      marginBottom: 16,
    },
    empty: {
      color: colors.textSecondary,
      fontSize: 14,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    button: {
      backgroundColor: colors.primary,
      padding: 16,
      borderRadius: 10,
      alignItems: "center",
      marginTop: 24,
    },
    buttonText: {
      color: colors.background,
      fontSize: 16,
      fontWeight: "bold",
    },
    text: {
      fontSize: 16,
      color: colors.text,
    },
    textSecondary: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    textPrimary: {
      fontSize: 16,
      color: colors.primary,
    },
    input: {
      backgroundColor: colors.surface,
      color: colors.text,
      padding: 16,
      borderRadius: 10,
      fontSize: 16,
      marginTop: 16,
    },
    inputError: {
      backgroundColor: colors.surface,
      color: colors.text,
      padding: 16,
      borderRadius: 10,
      fontSize: 16,
      marginTop: 16,
      borderColor: colors.alert,
      borderWidth: 1,
    },
    card: {
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 10,
      marginBottom: 10,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 10,
    },
    cardText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
  });
