import { useTheme } from "@/context/ThemeContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const BEGINNER_TIPS = [
  {
    icon: "sparkles",
    title: "La constancia es la clave",
    text: "Es mucho mejor entrenar 3 días todas las semanas que 6 días una sola semana y agotarte. ¡Celebra cada sesión completada!",
  },
  {
    icon: "water-outline",
    title: "Hidratación inteligente",
    text: "Bebe agua antes, durante y después de tu entrenamiento. Estar bien hidratado mejora tu energía y rendimiento hasta un 15%.",
  },
  {
    icon: "shield-checkmark-outline",
    title: "Técnica antes que peso",
    text: "No te preocupes por cuánto peso levantas. Una técnica limpia y controlada estimula mucho mejor tus músculos y previene lesiones.",
  },
  {
    icon: "moon-outline",
    title: "El músculo crece durmiendo",
    text: "El esfuerzo se hace en el gimnasio, pero el cambio ocurre en tu cama. Prioriza dormir de 7 a 8 horas para recuperarte al 100%.",
  },
  {
    icon: "nutrition-outline",
    title: "Nutre tu esfuerzo",
    text: "Incluye una fuente de proteína (huevos, pollo, atún o legumbres) en cada comida principal para acelerar tu recuperación.",
  },
];

export default function DailyAdviceCard() {
  const { colors } = useTheme();
  const [tipIndex, setTipIndex] = useState(0);

  const currentTip = BEGINNER_TIPS[tipIndex];

  const handleNextTip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTipIndex((prev) => (prev + 1) % BEGINNER_TIPS.length);
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      {/* Cabecera con Título y Botón para rotar consejo */}
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <Ionicons name="bulb" size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Consejo del día
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleNextTip}
          style={[styles.nextTipButton, { backgroundColor: colors.cardHighlight }]}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh-outline" size={15} color={colors.primary} />
          <Text style={[styles.nextTipText, { color: colors.primary }]}>
            Otro consejo
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenedor del consejo: Con padding interno y flexWrap para evitar desbordes */}
      <View style={styles.tipContentWrapper}>
        <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
          <Ionicons
            name={(currentTip.icon as any) || "sparkles"}
            size={22}
            color={colors.background}
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.tipTitle, { color: colors.primary }]}>
            {currentTip.title}
          </Text>
          <Text
            style={[styles.tipBody, { color: colors.text }]}
            numberOfLines={4}
          >
            {currentTip.text}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 28,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  titleWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  nextTipButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  nextTipText: {
    fontSize: 11,
    fontWeight: "700",
  },
  tipContentWrapper: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 14,
    padding: 14,
    paddingRight: 16,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
    flexShrink: 1,
    justifyContent: "center",
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 4,
  },
  tipBody: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500",
    flexWrap: "wrap",
  },
});
