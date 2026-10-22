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
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";

export default function UnitSettingsScreen() {
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

  const handleUnitSelect = async (unit: WeightUnit) => {
    if (settings.unit === unit) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = await saveSettings({ unit });
    setSettings(updated);
    Toast.show({
      type: "success",
      text1: "Unidad Guardada",
      text2: `Sistema configurado en ${unit.toUpperCase()}.`,
    });
  };

  const handleIncrementSelect = async (inc: number) => {
    if (settings.weightIncrement === inc) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = await saveSettings({ weightIncrement: inc });
    setSettings(updated);
    Toast.show({
      type: "success",
      text1: "Incremento Actualizado",
      text2: `Ajuste rápido en botones configurado a +/- ${inc} ${settings.unit}.`,
    });
  };

  return (
    <View style={[globalStyles.container, { backgroundColor: colors.background }]}>
      {/* HEADER POSTER */}
      <View style={globalStyles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.surface,
            justifyContent: "center",
            alignItems: "center",
            borderWidth: 1,
            borderColor: colors.cardBorder || "rgba(255,255,255,0.1)",
          }}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[globalStyles.title, { letterSpacing: 0.5 }]}>UNIDAD DE PESO</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* BANNER EDITORIAL */}
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 8,
            marginBottom: 20,
            padding: 18,
            borderRadius: 16,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.cardBorder || "rgba(255,255,255,0.1)",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <View
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 6,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: "900", color: "#000000", letterSpacing: 0.8 }}>
                SISTEMA METROLÓGICO
              </Text>
            </View>
            <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: "700" }}>
              PRECISIÓN DE CARGA
            </Text>
          </View>
          <Text style={{ fontSize: 16, fontWeight: "800", color: colors.text, textTransform: "uppercase" }}>
            Elige tu unidad de trabajo
          </Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4, lineHeight: 17 }}>
            Tus registros, marcas personales y cargas en entrenamiento libre se calcularán y mostrarán en la escala seleccionada.
          </Text>
        </View>

        {/* SELECCIÓN DE UNIDAD PRINCIPAL */}
        <Text
          style={{
            fontSize: 12,
            fontWeight: "900",
            color: colors.primary,
            marginLeft: 20,
            marginBottom: 10,
            letterSpacing: 1.2,
          }}
        >
          UNIDAD PRINCIPAL
        </Text>

        <View style={{ marginHorizontal: 16, gap: 12, marginBottom: 28 }}>
          {[
            {
              id: "kg" as WeightUnit,
              title: "KILOGRAMOS (KG)",
              subtitle: "Estándar internacional. Ideal para gimnasios métricos y precisión fraccional.",
              icon: "barbell",
              badge: "MÉTRICO",
            },
            {
              id: "lb" as WeightUnit,
              title: "LIBRAS (LB)",
              subtitle: "Estándar imperial. Ideal para discos marcados en libras y mancuernas USA.",
              icon: "fitness",
              badge: "IMPERIAL",
            },
          ].map((item) => {
            const isSelected = settings.unit === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleUnitSelect(item.id)}
                activeOpacity={0.85}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 16,
                  padding: 18,
                  borderWidth: 2,
                  borderColor: isSelected ? colors.primary : colors.cardBorder || "rgba(255,255,255,0.08)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        backgroundColor: isSelected ? colors.primary : colors.background,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Ionicons
                        name={item.icon as any}
                        size={22}
                        color={isSelected ? "#000000" : colors.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 17,
                          fontWeight: "900",
                          color: isSelected ? colors.primary : colors.text,
                          letterSpacing: 0.5,
                        }}
                      >
                        {item.title}
                      </Text>
                      <View style={{ flexDirection: "row", marginTop: 4 }}>
                        <View
                          style={{
                            backgroundColor: isSelected ? colors.primary + "25" : colors.background,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 4,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 9,
                              fontWeight: "900",
                              color: isSelected ? colors.primary : colors.textSecondary,
                              letterSpacing: 0.6,
                            }}
                          >
                            {item.badge}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <Ionicons
                    name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                    size={26}
                    color={isSelected ? colors.primary : colors.textSecondary + "50"}
                  />
                </View>

                <Text
                  style={{
                    fontSize: 12,
                    color: colors.textSecondary,
                    marginTop: 12,
                    lineHeight: 18,
                  }}
                >
                  {item.subtitle}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* SELECCIÓN DE INCREMENTO RÁPIDO */}
        <Text
          style={{
            fontSize: 12,
            fontWeight: "900",
            color: colors.primary,
            marginLeft: 20,
            marginBottom: 10,
            letterSpacing: 1.2,
          }}
        >
          PASO DE INCREMENTO RÁPIDO (+ / -)
        </Text>

        <View style={{ marginHorizontal: 16 }}>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.cardBorder || "rgba(255,255,255,0.08)",
            }}
          >
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 14 }}>
              Cantidad de carga que se sumará o restará al pulsar los botones táctiles en tus entrenamientos:
            </Text>

            <View style={{ flexDirection: "row", gap: 10 }}>
              {[1, 2.5, 5, 10].map((step) => {
                const isSelected = settings.weightIncrement === step;
                return (
                  <TouchableOpacity
                    key={step}
                    onPress={() => handleIncrementSelect(step)}
                    activeOpacity={0.8}
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      borderRadius: 12,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: isSelected ? colors.primary : colors.background,
                      borderWidth: 1.5,
                      borderColor: isSelected ? colors.primary : colors.cardBorder || "rgba(255,255,255,0.1)",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "900",
                        color: isSelected ? "#000000" : colors.text,
                      }}
                    >
                      {step}
                    </Text>
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "800",
                        color: isSelected ? "#000000" : colors.textSecondary,
                        marginTop: 2,
                      }}
                    >
                      {settings.unit.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({});
