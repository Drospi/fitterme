import { useTheme } from "@/context/ThemeContext";
import { getGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";

type Props = {
  next: () => void;
  data: { name: string; category: string };
  updateData: (newData: Partial<{ name: string; category: string }>) => void;
};

export default function Step1({ next, data, updateData }: Props) {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const [category, setCategory] = useState(data ? data.category : "fuerza");
  const [name, setName] = useState(data ? data.name : "");

  const isNeonLime =
    colors.primary?.toLowerCase().includes("c8ff") ||
    colors.primary?.toLowerCase() === "#c8ff00" ||
    colors.primary?.toLowerCase() === "#52b788";
  const onPrimaryColor = isNeonLime ? "#000000" : "#ffffff";

  useEffect(() => {
    setName(data.name);
    if (data.category) setCategory(data.category);
  }, [data]);

  const handleSelect = () => {
    if (!name.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Toast.show({
        type: "error",
        text1: "Nombre Requerido",
        text2: "Por favor escribe un nombre para tu rutina.",
      });
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateData({ name: name.trim(), category });
    next();
  };

  const categories = [
    {
      id: "fuerza",
      title: "FUERZA Y POTENCIA",
      subtitle: "Cargas pesadas, repeticiones bajas (1 - 6 reps) y máxima tensión mecánica.",
      icon: "barbell",
      tag: "CARGA PESADA",
    },
    {
      id: "hipertrofia",
      title: "HIPERTROFIA MUSCULAR",
      subtitle: "Volumen medio (8 - 12 reps), congestión muscular y estimulación de masa.",
      icon: "body-sharp",
      tag: "VOLUMEN & MASA",
    },
    {
      id: "resistencia",
      title: "RESISTENCIA & CARDIO",
      subtitle: "Altas repeticiones (15+ reps), menor descanso y acondicionamiento cardiovascular.",
      icon: "battery-charging-sharp",
      tag: "ACONDICIONAMIENTO",
    },
  ];

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
      {/* Header Poster */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4, marginBottom: 16 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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

        <View
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 6,
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: "900", color: onPrimaryColor, letterSpacing: 0.8 }}>
            PASO 01 / 03 ▶
          </Text>
        </View>
      </View>

      <Text
        style={{
          fontSize: 26,
          fontWeight: "900",
          color: colors.text,
          letterSpacing: 0.5,
          textTransform: "uppercase",
        }}
      >
        DISEÑA TU RUTINA
      </Text>
      <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4, marginBottom: 20 }}>
        Nombra tu entrenamiento y define el estímulo principal de la sesión.
      </Text>

      {/* Input de Nombre */}
      <View style={{ marginBottom: 24 }}>
        <Text
          style={{
            fontSize: 11,
            fontWeight: "900",
            color: colors.primary,
            marginBottom: 8,
            letterSpacing: 1.2,
          }}
        >
          NOMBRE DEL ENTRENAMIENTO
        </Text>
        <TextInput
          placeholder="Ej: Push Day Pesado / Torso Épico"
          style={[
            globalStyles.input,
            {
              backgroundColor: colors.surface,
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 16,
              fontWeight: "700",
              color: colors.text,
              borderWidth: 1.5,
              borderColor: colors.cardBorder || "rgba(255,255,255,0.12)",
            },
          ]}
          placeholderTextColor={colors.textSecondary + "70"}
          value={name}
          onChangeText={setName}
        />
      </View>

      {/* Selector de Objetivo Principal */}
      <Text
        style={{
          fontSize: 11,
          fontWeight: "900",
          color: colors.primary,
          marginBottom: 10,
          letterSpacing: 1.2,
        }}
      >
        ESTÍMULO / OBJETIVO PRINCIPAL
      </Text>

      <View style={{ gap: 12, marginBottom: 30 }}>
        {categories.map((cat) => {
          const isSelected = category === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              activeOpacity={0.85}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCategory(cat.id);
              }}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 18,
                borderWidth: 2,
                borderColor: isSelected ? colors.primary : colors.cardBorder || "rgba(255,255,255,0.08)",
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      backgroundColor: isSelected ? colors.primary : colors.background,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons
                      name={cat.icon as any}
                      size={22}
                      color={isSelected ? onPrimaryColor : colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "900",
                        color: isSelected ? colors.primary : colors.text,
                        letterSpacing: 0.5,
                      }}
                    >
                      {cat.title}
                    </Text>
                    <View style={{ flexDirection: "row", marginTop: 3 }}>
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
                          {cat.tag}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <Ionicons
                  name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                  size={24}
                  color={isSelected ? colors.primary : colors.textSecondary + "50"}
                />
              </View>

              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 10, lineHeight: 17 }}>
                {cat.subtitle}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Botón Siguiente estilo Póster */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleSelect}
        style={{
          backgroundColor: colors.primary,
          borderRadius: 16,
          paddingVertical: 16,
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          gap: 8,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.45,
          shadowRadius: 10,
          elevation: 5,
        }}
      >
        <Text style={{ color: onPrimaryColor, fontWeight: "900", fontSize: 15, letterSpacing: 0.5 }}>
          CONTINUAR AL PASO 2
        </Text>
        <Ionicons name="arrow-forward" size={18} color={onPrimaryColor} />
      </TouchableOpacity>
    </ScrollView>
  );
}
