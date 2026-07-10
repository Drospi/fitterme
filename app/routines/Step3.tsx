// Step1.tsx
import React from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";

type Props = {
  back: () => void;
};

export default function Step3({ back }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Paso 3: Configuracion</Text>

      <TextInput
        placeholder="Nombre de la Rutina"
        style={styles.input}
        placeholderTextColor="#666"
      />

      {/* Botón que dispara el cambio de paso */}
      <Button title="Siguiente" color="#d4ff00" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1 },
  title: { color: "#fff", fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  input: {
    backgroundColor: "#1a1a1a",
    color: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
});
