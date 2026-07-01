import { useTheme } from "@/context/ThemeContext";
import { getMeasures } from "@/store/measures";
import { getGlobalStyles } from "@/styles/global";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import FitnessAdvisor from "./FitnessAdvisor";

export default function MeasuresStadistics() {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  const [grasa, setGrasa] = useState(0);
  const [masaMagra, setMasaMagra] = useState(0);
  const [measures, setMeasures] = useState({});

  const calcularComposicion = (datos: any) => {
    console.log("Datos recibidos para cálculo:", datos);
    if (!datos) return;

    const esHombre = datos.sexo.toLowerCase() === "masculino";
    const alturaCm = datos.altura;
    const cuello = datos.cuello;
    const cintura = datos.cintura;
    const cadera = datos.cadera;

    let pctGrasa = 0;

    if (esHombre && cintura > cuello) {
      pctGrasa =
        86.01 * Math.log10(cintura - cuello) -
        70.041 * Math.log10(alturaCm) +
        36.76;
    } else if (!esHombre && cintura + cadera > cuello) {
      pctGrasa =
        163.205 * Math.log10(cintura + cadera - cuello) -
        97.684 * Math.log10(alturaCm) -
        78.387;
    }

    const grasaFinal = Math.max(0, parseFloat(pctGrasa.toFixed(1)));
    setGrasa(grasaFinal);
    setMasaMagra(100 - grasaFinal);
  };

  const loadMeasures = async () => {
    const data = await getMeasures();
    const latestMeasure = data[0];

    if (latestMeasure) {
      calcularComposicion(latestMeasure);
      setMeasures(latestMeasure);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadMeasures();
    }, []),
  );
  return (
    <ScrollView>
      <View style={globalStyles.header}>
        <Text style={globalStyles.title}>Estadísticas</Text>
      </View>

      {/* Componente visual de resultados */}
      <View style={globalStyles.card}>
        <Text style={globalStyles.cardTitle}>Composición Corporal</Text>
        <View style={styles.row}>
          <Text style={globalStyles.cardText}>Grasa Corporal: {grasa}%</Text>
          <Text style={globalStyles.cardText}>Masa Magra: {masaMagra}%</Text>
        </View>

        {/* Barra visual simple */}
        <View
          style={{
            height: 12,
            backgroundColor: colors.background,
            borderRadius: 6,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              height: "100%",
              backgroundColor: colors.primary,
              width: `${grasa}%`,
            }}
          />
        </View>
      </View>
      <FitnessAdvisor medidas={measures} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
});
