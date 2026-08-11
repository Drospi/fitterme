import { useTheme } from "@/context/ThemeContext";
import {
  getSettings,
  saveSettings,
  UserSettings,
  WeightUnit,
} from "@/store/conf";
import { getGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Href, useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";

export default function SettingsScreen() {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const router = useRouter();

  const [settings, setSettingsState] = useState<UserSettings>({
    unit: "kg",
    weightIncrement: 2.5,
    defaultRestTimer: 90,
  });

  const loadUserSettings = async () => {
    const data = await getSettings();
    setSettingsState(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadUserSettings();
    }, []),
  );

  const handleUnitChange = async (newUnit: WeightUnit) => {
    if (newUnit === settings.unit) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = await saveSettings({ unit: newUnit });
    setSettingsState(updated);
    Toast.show({
      type: "success",
      text1: "Unidad Actualizada",
      text2: `Unidad cambiada a ${newUnit.toUpperCase()}. Todos los pesos se mostrarán en ${newUnit.toUpperCase()}.`,
    });
  };

  const handleIncrementChange = async (newInc: number) => {
    if (newInc === settings.weightIncrement) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = await saveSettings({ weightIncrement: newInc });
    setSettingsState(updated);
    Toast.show({
      type: "success",
      text1: "Incremento Actualizado",
      text2: `Contador configurado a +/- ${newInc} ${settings.unit}.`,
    });
  };

  const handleRestTimerChange = async (newTimer: number) => {
    if (newTimer === settings.defaultRestTimer) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = await saveSettings({ defaultRestTimer: newTimer });
    setSettingsState(updated);
    Toast.show({
      type: "success",
      text1: "Temporizador Actualizado",
      text2: `Tiempo de descanso configurado en ${newTimer} segundos.`,
    });
  };

  return (
    <View style={globalStyles.container}>
      <View style={globalStyles.header}>
        <Ionicons
          onPress={() => router.back()}
          name="arrow-back"
          size={24}
          color={colors.text}
        />
        <Text style={globalStyles.title}>Ajustes</Text>
        <Ionicons name="settings" size={24} color={colors.text} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ENTRENAMIENTO */}
        <View style={{ marginVertical: 20 }}>
          <Text
            style={{
              fontWeight: "bold",
              fontSize: 18,
              color: colors.primary,
              marginBottom: 10,
            }}
          >
            ENTRENAMIENTO Y PESOS
          </Text>

          <View style={[globalStyles.card, { gap: 18 }]}>
            {/* Unidades de peso (Kg vs Lb) */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  gap: 10,
                  alignItems: "center",
                  flex: 1,
                }}
              >
                <Ionicons name="scale-outline" size={22} color={colors.text} />
                <View>
                  <Text style={globalStyles.text}>Unidades de peso</Text>
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                    Guardado interno siempre en KG
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  onPress={() => handleUnitChange("kg")}
                  style={{
                    borderRadius: 8,
                    paddingVertical: 6,
                    paddingHorizontal: 14,
                    backgroundColor:
                      settings.unit === "kg" ? colors.primary : colors.surface,
                    borderWidth: 1,
                    borderColor: colors.primary,
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "bold",
                      fontSize: 15,
                      color:
                        settings.unit === "kg"
                          ? colors.background
                          : colors.primary,
                    }}
                  >
                    Kg
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleUnitChange("lb")}
                  style={{
                    borderRadius: 8,
                    paddingVertical: 6,
                    paddingHorizontal: 14,
                    backgroundColor:
                      settings.unit === "lb" ? colors.primary : colors.surface,
                    borderWidth: 1,
                    borderColor: colors.primary,
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "bold",
                      fontSize: 15,
                      color:
                        settings.unit === "lb"
                          ? colors.background
                          : colors.primary,
                    }}
                  >
                    Lb
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Incremento de peso por defecto (+/-) */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: colors.background,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  gap: 10,
                  alignItems: "center",
                  flex: 1,
                }}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={22}
                  color={colors.text}
                />
                <View>
                  <Text style={globalStyles.text}>Incremento por defecto</Text>
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                    Aumento en botones +/-
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 6 }}>
                {[1, 2.5, 5, 10].map((inc) => {
                  const isSelected = settings.weightIncrement === inc;
                  return (
                    <TouchableOpacity
                      key={inc}
                      onPress={() => handleIncrementChange(inc)}
                      style={{
                        borderRadius: 6,
                        paddingVertical: 5,
                        paddingHorizontal: 8,
                        backgroundColor: isSelected
                          ? colors.primary
                          : colors.background,
                        borderWidth: 1,
                        borderColor: isSelected
                          ? colors.primary
                          : colors.textSecondary + "40",
                      }}
                    >
                      <Text
                        style={{
                          fontWeight: "bold",
                          fontSize: 12,
                          color: isSelected ? colors.background : colors.text,
                        }}
                      >
                        {inc}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Tiempo de descanso por defecto */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: colors.background,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  gap: 10,
                  alignItems: "center",
                  flex: 1,
                }}
              >
                <Ionicons name="timer-outline" size={22} color={colors.text} />
                <Text style={globalStyles.text}>Descanso por defecto</Text>
              </View>

              <View style={{ flexDirection: "row", gap: 6 }}>
                {[60, 90, 120].map((timerVal) => {
                  const isSelected = settings.defaultRestTimer === timerVal;
                  return (
                    <TouchableOpacity
                      key={timerVal}
                      onPress={() => handleRestTimerChange(timerVal)}
                      style={{
                        borderRadius: 6,
                        paddingVertical: 5,
                        paddingHorizontal: 8,
                        backgroundColor: isSelected
                          ? colors.primary
                          : colors.background,
                        borderWidth: 1,
                        borderColor: isSelected
                          ? colors.primary
                          : colors.textSecondary + "40",
                      }}
                    >
                      <Text
                        style={{
                          fontWeight: "bold",
                          fontSize: 12,
                          color: isSelected ? colors.background : colors.text,
                        }}
                      >
                        {timerVal}s
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* CUENTA Y DATOS */}
        <View style={{ marginBottom: 20 }}>
          <Text
            style={{
              fontWeight: "bold",
              fontSize: 18,
              color: colors.primary,
              marginBottom: 10,
            }}
          >
            CUENTA Y DATOS
          </Text>
          <View style={[globalStyles.card, { paddingTop: 0 }]}>
            {[
              {
                icon: "person-outline",
                value: "Editar Perfil",
                link: "../measures/PersonalData",
              },
              {
                icon: "accessibility-outline",
                value: "Actualizar Medidas",
                link: "../measures/measures",
              },
              {
                icon: "analytics-outline",
                value: "Fijar Metas",
                link: "../measures/goals",
              },
            ].map((item, index) => (
              <View key={index} style={{ marginTop: 18 }}>
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    gap: 10,
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                  onPress={() => router.push(item.link as Href)}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 10,
                      alignItems: "center",
                    }}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={22}
                      color={colors.text}
                    />
                    <Text style={globalStyles.text}>{item.value}</Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <View style={{ marginBottom: 40 }}>
          <Text
            style={{
              fontWeight: "bold",
              fontSize: 18,
              color: colors.primary,
              marginBottom: 10,
            }}
          >
            NOTIFICACIONES
          </Text>
          <View style={[globalStyles.card, { paddingTop: 0 }]}>
            {[
              {
                icon: "notifications-outline",
                value: "Notificaciones y Recordatorios",
                link: "../settings/notifications",
              },
              {
                icon: "sparkles-outline",
                value: "Ver Resumen Semanal Actual",
                link: "../reports/weekly",
              },
            ].map((item, index) => (
              <View key={index} style={{ marginTop: 18 }}>
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    gap: 10,
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                  onPress={() => router.push(item.link as Href)}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 10,
                      alignItems: "center",
                    }}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={22}
                      color={colors.text}
                    />
                    <Text style={globalStyles.text}>{item.value}</Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
