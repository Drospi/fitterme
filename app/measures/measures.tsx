import MeasureCard from "@/components/MeasureCard";
import { useTheme } from "@/context/ThemeContext";
import { addMeasure, getMeasures } from "@/store/measures";
import { getGlobalStyles } from "@/styles/global";

import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function MeasuresScreen() {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  const [cuello, setCuello] = useState(38);
  const [pecho, setPecho] = useState(95);
  const [hombros, setHombros] = useState(110);
  const [biceps, setBiceps] = useState(32);
  const [antebrazo, setAntebrazo] = useState(15);
  const [cintura, setCintura] = useState(80);
  const [cadera, setCadera] = useState(90);
  const [espalda, setEspalda] = useState(105);
  const [cuadriceps, setCuadriceps] = useState(45);
  const [gemelos, setGemelos] = useState(33);
  const [gluteos, setGluteos] = useState(95);
  const [edad, setEdad] = useState(0);
  const [sexo, setSexo] = useState("masculino");
  const [peso, setPeso] = useState(0);
  const [altura, setAltura] = useState(0);

  const route = useRouter();

  const handleSave = async () => {
    try {
      await addMeasure({
        name: "Measures",
        cuello,
        pecho,
        hombros,
        biceps,
        antebrazo,
        cintura,
        cadera,
        cuadriceps,
        gemelos,
        gluteos,
        espalda,
        edad,
        sexo,
        peso,
        altura,
      });
      route.dismissAll();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      alert("Error al guardar");
    }
  };

  const loadMeasures = async () => {
    const data = await getMeasures();
    setCuello(data[0]?.cuello || 38);
    setPecho(data[0]?.pecho || 95);
    setHombros(data[0]?.hombros || 110);
    setBiceps(data[0]?.biceps || 32);
    setAntebrazo(data[0]?.antebrazo || 15);
    setCintura(data[0]?.cintura || 80);
    setCadera(data[0]?.cadera || 90);
    setEspalda(data[0]?.espalda || 105);
    setCuadriceps(data[0]?.cuadriceps || 45);
    setGemelos(data[0]?.gemelos || 33);
    setGluteos(data[0]?.gluteos || 95);
    setEdad(data[0]?.edad || 18);
    setSexo(data[0]?.sexo || "Masculino");
    setPeso(data[0]?.peso || 70);
    setAltura(data[0]?.altura || 170);
  };

  useFocusEffect(
    useCallback(() => {
      loadMeasures();
    }, []),
  );
  return (
    <ScrollView style={globalStyles.container}>
      <View
        style={[
          globalStyles.header,
          {
            flexDirection: "column",
            alignItems: "flex-start",
            marginBottom: 20,
          },
        ]}
      >
        <Text style={globalStyles.title}>Actualizar mis medidas</Text>
        <Text style={globalStyles.textSecondary}>
          Registra tu progreso. Valores en cm
        </Text>
      </View>
      <MeasureCard measure={cuello} setMeasure={setCuello} name="Cuello" />
      <MeasureCard measure={pecho} setMeasure={setPecho} name="Pecho" />
      <MeasureCard measure={espalda} setMeasure={setEspalda} name="Espalda" />
      <MeasureCard measure={hombros} setMeasure={setHombros} name="Hombros" />
      <MeasureCard measure={biceps} setMeasure={setBiceps} name="Biceps" />
      <MeasureCard
        measure={antebrazo}
        setMeasure={setAntebrazo}
        name="Antebrazo"
      />
      <MeasureCard measure={cintura} setMeasure={setCintura} name="Cintura" />
      <MeasureCard measure={cadera} setMeasure={setCadera} name="Cadera" />
      <MeasureCard
        measure={cuadriceps}
        setMeasure={setCuadriceps}
        name="Cuadriceps"
      />
      <MeasureCard measure={gemelos} setMeasure={setGemelos} name="Gemelos" />
      <MeasureCard measure={gluteos} setMeasure={setGluteos} name="Gluteos" />
      <View style={{ marginBottom: 90 }}>
        <TouchableOpacity onPress={handleSave} style={globalStyles.button}>
          <Text style={globalStyles.buttonText}>Save Measure</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({});
