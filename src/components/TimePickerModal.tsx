import { useTheme } from "@/context/ThemeContext";
import { getGlobalStyles } from "@/styles/global";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelectTime: (timeString: string) => void; // Formato "HH:MM"
  initialTime?: string;
  title?: string;
};

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = [
  "00", "05", "10", "15", "20", "25",
  "30", "35", "40", "45", "50", "55"
];

export default function TimePickerModal({
  visible,
  onClose,
  onSelectTime,
  initialTime = "08:30",
  title = "Seleccionar Hora",
}: Props) {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  const [selectedHour, setSelectedHour] = useState("08");
  const [selectedMinute, setSelectedMinute] = useState("30");

  useEffect(() => {
    if (initialTime && initialTime.includes(":")) {
      const [h, m] = initialTime.split(":");
      if (HOURS.includes(h)) setSelectedHour(h);
      if (m) {
        // Ajustar al minuto más cercano de la lista
        const mNum = parseInt(m, 10);
        const closestMin = MINUTES.reduce((prev, curr) =>
          Math.abs(parseInt(curr, 10) - mNum) < Math.abs(parseInt(prev, 10) - mNum) ? curr : prev
        );
        setSelectedMinute(closestMin);
      }
    }
  }, [initialTime, visible]);

  const handleConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const finalTime = `${selectedHour}:${selectedMinute}`;
    onSelectTime(finalTime);
    onClose();
  };

  const isPM = parseInt(selectedHour, 10) >= 12;
  const hour12 = parseInt(selectedHour, 10) % 12 || 12;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            globalStyles.card,
            {
              width: "90%",
              maxWidth: 360,
              padding: 20,
              backgroundColor: colors.surface,
              borderRadius: 24,
              borderWidth: 1.5,
              borderColor: colors.primary + "40",
            },
          ]}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 15,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="time-outline" size={24} color={colors.primary} />
              <Text style={[globalStyles.cardTitle, { fontSize: 18, fontWeight: "bold", marginBottom: 0 }]}>
                {title}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Reloj Digital Preview grande */}
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.background,
              paddingVertical: 14,
              borderRadius: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: colors.primary + "30",
            }}
          >
            <Text style={{ fontSize: 38, fontWeight: "bold", color: colors.primary, letterSpacing: 2 }}>
              {selectedHour}:{selectedMinute}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: "600", marginTop: 2 }}>
              {hour12}:{selectedMinute} {isPM ? "PM" : "AM"} (Formato 24h: {selectedHour}:{selectedMinute})
            </Text>
          </View>

          {/* Selector de Hora (00 a 23) */}
          <View style={{ marginBottom: 14 }}>
            <Text style={{ fontSize: 12, fontWeight: "bold", color: colors.textSecondary, marginBottom: 6 }}>
              HORA
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 6, paddingVertical: 2 }}
            >
              {HOURS.map((h) => {
                const isSelected = selectedHour === h;
                return (
                  <TouchableOpacity
                    key={h}
                    style={{
                      width: 44,
                      height: 42,
                      borderRadius: 12,
                      backgroundColor: isSelected ? colors.primary : colors.background,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: isSelected ? colors.primary : colors.textSecondary + "30",
                    }}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedHour(h);
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "bold",
                        color: isSelected ? colors.background : colors.text,
                      }}
                    >
                      {h}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Selector de Minutos */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 12, fontWeight: "bold", color: colors.textSecondary, marginBottom: 6 }}>
              MINUTOS
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 6, paddingVertical: 2 }}
            >
              {MINUTES.map((m) => {
                const isSelected = selectedMinute === m;
                return (
                  <TouchableOpacity
                    key={m}
                    style={{
                      width: 44,
                      height: 42,
                      borderRadius: 12,
                      backgroundColor: isSelected ? colors.secondary : colors.background,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: isSelected ? colors.secondary : colors.textSecondary + "30",
                    }}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedMinute(m);
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "bold",
                        color: isSelected ? colors.background : colors.text,
                      }}
                    >
                      {m}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Botón de Confirmar */}
          <TouchableOpacity
            style={[globalStyles.button, { marginTop: 4 }]}
            onPress={handleConfirm}
          >
            <Text style={globalStyles.buttonText}>Confirmar Hora ({selectedHour}:{selectedMinute})</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
  },
});
