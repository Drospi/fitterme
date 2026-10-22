import { useTheme } from "@/context/ThemeContext";
import { getSettings, saveSettings, UserSettings } from "@/store/conf";
import { getGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";

export default function TimerSettingsScreen() {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const router = useRouter();

  const [settings, setSettings] = useState<UserSettings>({
    unit: "kg",
    weightIncrement: 2.5,
    defaultRestTimer: 90,
  });

  const loadSettings = async () => {
    const data = await getSettings();
    setSettings(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [])
  );

  const handleSelectTimer = async (seconds: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = await saveSettings({ defaultRestTimer: seconds });
    setSettings(updated);
    Toast.show({
      type: "success",
      text1: "Tiempo Guardado",
      text2: `Descanso configurado en ${seconds >= 60 ? `${seconds / 60} min` : `${seconds}s`}.`,
    });
  };

  const timerOptions = [
    { label: "45 segundos", shortLabel: "45s", value: 45, desc: "Descanso corto, ideal para hipertrofia ligera o resistencia." },
    { label: "90 segundos (1.5 min)", shortLabel: "90s", value: 90, desc: "Descanso estándar recomendado para la mayoría de rutinas." },
    { label: "2 minutos", shortLabel: "2 min", value: 120, desc: "Ideal para ejercicios compuestos y series intensas." },
    { label: "3 minutos", shortLabel: "3 min", value: 180, desc: "Descanso largo para series pesadas de fuerza y potencia." },
  ];

  return (
    <View style={globalStyles.container}>
      <View style={globalStyles.header}>
        <Ionicons
          onPress={() => router.back()}
          name="arrow-back"
          size={24}
          color={colors.text}
        />
        <Text style={globalStyles.title}>Tiempo de Recuperación</Text>
        <Ionicons name="timer-outline" size={24} color={colors.primary} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={{ marginTop: 15 }}>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 15, lineHeight: 18 }}>
            Selecciona el tiempo de descanso automático que se iniciará debajo de cada serie completada durante tus entrenamientos libres y rutinas:
          </Text>

          <View style={{ gap: 12 }}>
            {timerOptions.map((opt) => {
              const isSelected = settings.defaultRestTimer === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => handleSelectTimer(opt.value)}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 14,
                    padding: 16,
                    borderWidth: 1.5,
                    borderColor: isSelected ? colors.primary : colors.textSecondary + "25",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <Text style={{ fontSize: 16, fontWeight: "bold", color: isSelected ? colors.primary : colors.text }}>
                        {opt.label}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                      {opt.desc}
                    </Text>
                  </View>

                  <Ionicons
                    name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                    size={24}
                    color={isSelected ? colors.primary : colors.textSecondary + "60"}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({});
