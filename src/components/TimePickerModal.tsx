import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useState, useEffect } from "react";
import { Platform, View, Modal, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { getGlobalStyles } from "@/styles/global";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelectTime: (timeString: string) => void;
  initialTime?: string;
  title?: string;
};

export default function TimePickerModal({
  visible,
  onClose,
  onSelectTime,
  initialTime = "08:30",
  title = "Seleccionar Hora",
}: Props) {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  const [date, setDate] = useState(new Date());

  useEffect(() => {
    if (initialTime && initialTime.includes(":")) {
      const [h, m] = initialTime.split(":");
      const d = new Date();
      d.setHours(parseInt(h, 10));
      d.setMinutes(parseInt(m, 10));
      setDate(d);
    }
  }, [initialTime, visible]);

  if (!visible) return null;

  const onChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      if (event.type === "set" && selectedDate) {
        const hh = String(selectedDate.getHours()).padStart(2, "0");
        const mm = String(selectedDate.getMinutes()).padStart(2, "0");
        onSelectTime(`${hh}:${mm}`);
      }
      onClose(); // Cerrar independientemente de si se seleccionó o se canceló
    } else {
      // Para iOS solo actualizamos el estado, el botón confirmar hace el guardado
      if (selectedDate) setDate(selectedDate);
    }
  };

  if (Platform.OS === "android") {
    // Android usa el "reloj de sala" nativo como un Dialog, no requiere Modal extra
    return (
      <DateTimePicker
        value={date}
        mode="time"
        is24Hour={true}
        display="default" // "default" on Android 11+ is "clock" mode (el reloj de sala redondo)
        onChange={onChange}
      />
    );
  }

  // iOS UI: spinner mode within a Modal
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.iosOverlay}>
        <View style={[styles.iosContainer, { backgroundColor: colors.surface }]}>
          <View style={[styles.iosHeader, { borderBottomColor: colors.neutral }]}>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ color: colors.textSecondary, fontSize: 16 }}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={{ fontWeight: "bold", fontSize: 16, color: colors.text }}>{title}</Text>
            <TouchableOpacity
              onPress={() => {
                const hh = String(date.getHours()).padStart(2, "0");
                const mm = String(date.getMinutes()).padStart(2, "0");
                onSelectTime(`${hh}:${mm}`);
                onClose();
              }}
            >
              <Text style={{ color: colors.primary, fontWeight: "bold", fontSize: 16 }}>Hecho</Text>
            </TouchableOpacity>
          </View>
          <View style={{ backgroundColor: colors.surface }}>
            <DateTimePicker
              value={date}
              mode="time"
              is24Hour={true}
              display="spinner"
              onChange={onChange}
              textColor={colors.text} // Importante en iOS para el modo oscuro
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  iosOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  iosContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 40,
  },
  iosHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
