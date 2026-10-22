import { themes, useTheme } from "@/context/ThemeContext";
import { isAIConfigured } from "@/store/aiConfig";
import { getSettings, saveSettings, UserSettings } from "@/store/conf";
import { getGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Href, useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";

export default function SettingsScreen() {
  const { colors, themeName } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const router = useRouter();

  const [settings, setSettingsState] = useState<UserSettings>({
    unit: "kg",
    weightIncrement: 2.5,
    defaultRestTimer: 90,
  });
  const [isAIActive, setIsAIActive] = useState(false);

  const loadUserSettings = async () => {
    const data = await getSettings();
    setSettingsState(data);
    const aiStatus = await isAIConfigured();
    setIsAIActive(aiStatus);
  };

  useFocusEffect(
    useCallback(() => {
      loadUserSettings();
    }, [])
  );

  const formatTimerLabel = (secs: number) => {
    if (secs >= 60) {
      return secs % 60 === 0 ? `${secs / 60} min` : `${(secs / 60).toFixed(1)} min`;
    }
    return `${secs} seg`;
  };

  return (
    <View style={[globalStyles.container, { backgroundColor: colors.background }]}>
      {/* HEADER EDITORIAL / POSTER */}
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
        <Text style={[globalStyles.title, { letterSpacing: 0.5 }]}>CONFIGURACIÓN</Text>
        <View
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
          <Ionicons name="settings-sharp" size={18} color={colors.primary} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
        {/* BANNER EDITORIAL DE AJUSTES */}
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
                CENTRO DE CONTROL
              </Text>
            </View>
            <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: "700" }}>
              AJUSTES GLOBALES
            </Text>
          </View>
          <Text style={{ fontSize: 16, fontWeight: "800", color: colors.text, textTransform: "uppercase" }}>
            Preferencias del sistema
          </Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4, lineHeight: 17 }}>
            Selecciona cada apartado para acceder a su página de configuración dedicada y ajustar tus parámetros.
          </Text>
        </View>

        {/* SECCIÓN 1: ENTRENAMIENTO Y CARGAS */}
        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 20, marginBottom: 10, gap: 6 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary }} />
            <Text
              style={{
                fontSize: 12,
                fontWeight: "900",
                color: colors.primary,
                letterSpacing: 1.2,
              }}
            >
              ENTRENAMIENTO Y CARGAS
            </Text>
          </View>

          <View
            style={{
              marginHorizontal: 16,
              backgroundColor: colors.surface,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.cardBorder || "rgba(255,255,255,0.08)",
              overflow: "hidden",
            }}
          >
            {/* Unidad de peso y saltos */}
            <TouchableOpacity
              onPress={() => router.push("/settings/unit" as Href)}
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: colors.cardBorder || "rgba(255,255,255,0.06)",
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: colors.background,
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 14,
                }}
              >
                <Ionicons name="scale-outline" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={{ fontSize: 15, fontWeight: "800", color: colors.text }}>
                  Unidad de Peso e Incrementos
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                  Configuración métrica (Kg / Lb) y saltos de carga (+/- {settings.weightIncrement} {settings.unit})
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View
                  style={{
                    backgroundColor: colors.primary + "20",
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: "900", color: colors.primary }}>
                    {settings.unit.toUpperCase()}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary + "90"} />
              </View>
            </TouchableOpacity>

            {/* Temporizador de descanso */}
            <TouchableOpacity
              onPress={() => router.push("/settings/timer" as Href)}
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: colors.background,
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 14,
                }}
              >
                <Ionicons name="timer-outline" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={{ fontSize: 15, fontWeight: "800", color: colors.text }}>
                  Temporizador de Descanso
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                  Tiempo automático de recuperación entre series de trabajo
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View
                  style={{
                    backgroundColor: colors.background,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: colors.cardBorder || "rgba(255,255,255,0.1)",
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: "900", color: colors.text }}>
                    {formatTimerLabel(settings.defaultRestTimer || 90)}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary + "90"} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* SECCIÓN 2: APARIENCIA */}
        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 20, marginBottom: 10, gap: 6 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary }} />
            <Text
              style={{
                fontSize: 12,
                fontWeight: "900",
                color: colors.primary,
                letterSpacing: 1.2,
              }}
            >
              APARIENCIA Y DISEÑO
            </Text>
          </View>

          <View
            style={{
              marginHorizontal: 16,
              backgroundColor: colors.surface,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.cardBorder || "rgba(255,255,255,0.08)",
              overflow: "hidden",
            }}
          >
            <TouchableOpacity
              onPress={() => router.push("/settings/theme" as Href)}
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: colors.background,
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 14,
                }}
              >
                <Ionicons name="color-palette-outline" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={{ fontSize: 15, fontWeight: "800", color: colors.text }}>
                  Estilo Visual y Tema
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                  Tema activo: {themes[themeName]?.name || "Cyberpunk"}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: colors.primary,
                    borderWidth: 2,
                    borderColor: colors.surface,
                  }}
                />
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary + "90"} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* SECCIÓN 3: MI PERFIL Y METAS */}
        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 20, marginBottom: 10, gap: 6 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary }} />
            <Text
              style={{
                fontSize: 12,
                fontWeight: "900",
                color: colors.primary,
                letterSpacing: 1.2,
              }}
            >
              PERFIL Y EVALUACIÓN
            </Text>
          </View>

          <View
            style={{
              marginHorizontal: 16,
              backgroundColor: colors.surface,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.cardBorder || "rgba(255,255,255,0.08)",
              overflow: "hidden",
            }}
          >
            {[
              {
                icon: "person-outline",
                title: "Editar Perfil y Datos Personales",
                sub: "Nombre, edad, estatura, peso base y nivel atlético",
                link: "../measures/PersonalData",
              },
              {
                icon: "body-outline",
                title: "Actualizar Medidas Corporales",
                sub: "Pecho, cintura, brazos, piernas y grasa corporal",
                link: "../measures/measures",
              },
              {
                icon: "flag-outline",
                title: "Fijar Metas y Objetivos",
                sub: "Fuerza, calorías diarias y hábitos de constancia",
                link: "../measures/goals",
              },
              {
                icon: "stats-chart-outline",
                title: "Resumen Semanal de Rendimiento",
                sub: "Volumen acumulado, entrenamientos y gráficos",
                link: "../reports/weekly",
              },
            ].map((item, index, arr) => (
              <TouchableOpacity
                key={index}
                onPress={() => router.push(item.link as Href)}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 16,
                  borderBottomWidth: index === arr.length - 1 ? 0 : 1,
                  borderBottomColor: colors.cardBorder || "rgba(255,255,255,0.06)",
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: colors.background,
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 14,
                  }}
                >
                  <Ionicons name={item.icon as any} size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={{ fontSize: 15, fontWeight: "800", color: colors.text }}>
                    {item.title}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                    {item.sub}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary + "90"} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* SECCIÓN 4: SISTEMA E INTEGRACIONES */}
        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 20, marginBottom: 10, gap: 6 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary }} />
            <Text
              style={{
                fontSize: 12,
                fontWeight: "900",
                color: colors.primary,
                letterSpacing: 1.2,
              }}
            >
              SISTEMA E INTELIGENCIA
            </Text>
          </View>

          <View
            style={{
              marginHorizontal: 16,
              backgroundColor: colors.surface,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.cardBorder || "rgba(255,255,255,0.08)",
              overflow: "hidden",
            }}
          >
            {/* Notificaciones */}
            <TouchableOpacity
              onPress={() => router.push("../settings/notifications" as Href)}
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: colors.cardBorder || "rgba(255,255,255,0.06)",
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: colors.background,
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 14,
                }}
              >
                <Ionicons name="notifications-outline" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={{ fontSize: 15, fontWeight: "800", color: colors.text }}>
                  Notificaciones y Recordatorios
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                  Alarmas de entrenamiento, hidratación y fin de descanso
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary + "90"} />
            </TouchableOpacity>

            {/* Motor IA Gemini */}
            <TouchableOpacity
              onPress={() => router.push("../settings/aiConfig" as Href)}
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: colors.background,
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 14,
                }}
              >
                <Ionicons name="sparkles" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={{ fontSize: 15, fontWeight: "800", color: colors.text }}>
                  Motor de Inteligencia Artificial
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                  Asistente nutricional, generador de rutinas y análisis
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View
                  style={{
                    backgroundColor: isAIActive ? colors.primary + "20" : colors.background,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 6,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "900",
                      color: isAIActive ? colors.primary : colors.textSecondary,
                    }}
                  >
                    {isAIActive ? "CONECTADO ▶" : "CONFIGURAR"}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary + "90"} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({});
