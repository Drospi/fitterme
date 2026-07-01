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

  const [cuello, setCuello] = useState(0);
  const [pecho, setPecho] = useState(0);
  const [hombros, setHombros] = useState(0);
  const [biceps, setBiceps] = useState(0);
  const [antebrazo, setAntebrazo] = useState(0);
  const [cintura, setCintura] = useState(0);
  const [cadera, setCadera] = useState(0);
  const [cuadriceps, setCuadriceps] = useState(0);
  const [gemelos, setGemelos] = useState(0);
  const [gluteos, setGluteos] = useState(0);
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
        edad,
        sexo,
        peso,
        altura,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      route.dismissAll();
    } catch (error) {
      alert("Error al guardar");
    }
  };

  const loadMeasures = async () => {
    const data = await getMeasures();
    setCuello(data[0]?.cuello || 0);
    setPecho(data[0]?.pecho || 0);
    setHombros(data[0]?.hombros || 0);
    setBiceps(data[0]?.biceps || 0);
    setAntebrazo(data[0]?.antebrazo || 0);
    setCintura(data[0]?.cintura || 0);
    setCadera(data[0]?.cadera || 0);
    setCuadriceps(data[0]?.cuadriceps || 0);
    setGemelos(data[0]?.gemelos || 0);
    setGluteos(data[0]?.gluteos || 0);
    setEdad(data[0]?.edad || 0);
    setSexo(data[0]?.sexo || "masculino");
    setPeso(data[0]?.peso || 0);
    setAltura(data[0]?.altura || 0);
  };

  useFocusEffect(
    useCallback(() => {
      loadMeasures();
    }, []),
  );
  return (
    <ScrollView
      style={globalStyles.container}
      contentContainerStyle={{ paddingBottom: 20 }}
    >
      <View style={globalStyles.header}>
        <Text style={globalStyles.title}>All Measures</Text>
      </View>
      <ScrollView style={{ gap: 20 }}>
        <MeasureCard measure={edad} setMeasure={setEdad} name="Edad" />
        <MeasureCard measure={peso} setMeasure={setPeso} name="Peso" />
        <MeasureCard measure={altura} setMeasure={setAltura} name="Altura" />
        <MeasureCard measure={cuello} setMeasure={setCuello} name="Cuello" />
        <MeasureCard measure={pecho} setMeasure={setPecho} name="Pecho" />
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
      </ScrollView>
      <TouchableOpacity onPress={handleSave} style={globalStyles.button}>
        <Text style={globalStyles.buttonText}>Save Measure</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({});
