import { ThemeMode, themes, useTheme } from "@/context/ThemeContext";
import { getGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";

export default function ThemeScreen() {
  const { colors, themeName, setThemeName } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const router = useRouter();

  const handleSelectTheme = (mode: ThemeMode) => {
    if (themeName === mode) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setThemeName(mode);
    Toast.show({
      type: "success",
      text1: "Tema Aplicado",
      text2: `Estilo visual cambiado a ${themes[mode].name}.`,
    });
  };

  const themeBadges: Record<ThemeMode, { tag: string; desc: string }> = {
    dark: {
      tag: "CYBERPUNK LIME",
      desc: "Negro absoluto y acento verde lima neón #C8FF00 de alto impacto atlético.",
    },
    midnight: {
      tag: "DEEP NAVY",
      desc: "Azul profundo espacial con acentos eléctricos para entrenamientos nocturnos.",
    },
    emerald: {
      tag: "VIVID EMERALD",
      desc: "Bosque verde oscuro de alta concentración y acentos esmeralda orgánicos.",
    },
    sunset: {
      tag: "SUNSET GLOW",
      desc: "Degradados cálidos de atardecer, fuego naranja y magenta vibrante.",
    },
    sunsetNeo: {
      tag: "DARK CORAL",
      desc: "Gris marengo técnico con botones naranja fuego y toques coral.",
    },
    light: {
      tag: "CLEAN WHITE",
      desc: "Fondo blanco puro de alta visibilidad bajo luz solar directa.",
    },
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
        <Text style={[globalStyles.title, { letterSpacing: 0.5 }]}>APARIENCIA Y TEMA</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* BANNER POSTER */}
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
                DISEÑO VISUAL
              </Text>
            </View>
            <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: "700" }}>
              ATMÓSFERA EDITORIAL
            </Text>
          </View>
          <Text style={{ fontSize: 16, fontWeight: "800", color: colors.text, textTransform: "uppercase" }}>
            Elige el color de tu energía
          </Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4, lineHeight: 17 }}>
            Cada pantalla del sistema se adaptará respetando la jerarquía gráfica, los contrastes y los tonos de tu estilo preferido.
          </Text>
        </View>

        {/* LISTA DE TEMAS DISPONIBLES */}
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
          TEMAS DISPONIBLES ({Object.keys(themes).length})
        </Text>

        <View style={{ marginHorizontal: 16, gap: 14 }}>
          {(Object.keys(themes) as ThemeMode[]).map((mode) => {
            const t = themes[mode];
            const isSelected = themeName === mode;
            const badge = themeBadges[mode] || { tag: "ESTILO", desc: "" };

            return (
              <TouchableOpacity
                key={mode}
                onPress={() => handleSelectTheme(mode)}
                activeOpacity={0.85}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 18,
                  padding: 18,
                  borderWidth: 2,
                  borderColor: isSelected ? colors.primary : colors.cardBorder || "rgba(255,255,255,0.08)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Cabecera del tema */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
                    {/* Previsualizador de colores del tema */}
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        backgroundColor: t.colors.background,
                        borderWidth: 2,
                        borderColor: t.colors.cardBorder || "rgba(255,255,255,0.2)",
                        justifyContent: "center",
                        alignItems: "center",
                        overflow: "hidden",
                      }}
                    >
                      <View
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          backgroundColor: t.colors.primary,
                          borderWidth: 2,
                          borderColor: t.colors.surface,
                        }}
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
                        {t.name}
                      </Text>
                      <View style={{ flexDirection: "row", marginTop: 3 }}>
                        <View
                          style={{
                            backgroundColor: isSelected ? colors.primary : colors.background,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 4,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 9,
                              fontWeight: "900",
                              color: isSelected ? "#000000" : colors.textSecondary,
                              letterSpacing: 0.7,
                            }}
                          >
                            {badge.tag}
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

                {/* Muestrario de paleta */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 14,
                    paddingTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: colors.cardBorder || "rgba(255,255,255,0.06)",
                  }}
                >
                  <View style={{ flexDirection: "row", gap: 6, flex: 1 }}>
                    <View style={{ width: 18, height: 18, borderRadius: 5, backgroundColor: t.colors.primary }} />
                    <View style={{ width: 18, height: 18, borderRadius: 5, backgroundColor: t.colors.background, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" }} />
                    <View style={{ width: 18, height: 18, borderRadius: 5, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" }} />
                    <View style={{ width: 18, height: 18, borderRadius: 5, backgroundColor: t.colors.text }} />
                    <View style={{ width: 18, height: 18, borderRadius: 5, backgroundColor: t.colors.success }} />
                  </View>
                  {isSelected && (
                    <View style={{ backgroundColor: colors.primary, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 }}>
                      <Text style={{ fontSize: 9, fontWeight: "900", color: "#000000" }}>ACTIVO ▶</Text>
                    </View>
                  )}
                </View>

                <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 8, lineHeight: 16 }}>
                  {badge.desc}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({});
