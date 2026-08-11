import { ThemeProvider } from "@/context/ThemeContext";
import { Stack } from "expo-router";
import Toast from "react-native-toast-message";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="settings/settings"
          options={{ title: "Settings" }}
        />
      </Stack>
      <Toast />
    </ThemeProvider>
  );
}
