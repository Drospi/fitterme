import { useTheme } from "@/context/ThemeContext";
import { getMeasures } from "@/store/measures";
import { getGlobalStyles } from "@/styles/global";
import Ionicons from "@expo/vector-icons/Ionicons";
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
    setMasaMagra(((100 - grasaFinal) / 100) * datos.peso);
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
      {/* Componente visual de resultados */}
      <View style={globalStyles.card}>
        <View style={styles.row}>
          <View style={styles.center}>
            <View style={styles.row}>
              <Ionicons
                name="body-outline"
                size={16}
                color={colors.primary}
                style={{ opacity: 0.8, paddingRight: 5 }}
              />
              <Text style={globalStyles.cardText}>Grasa Corporal </Text>
            </View>
            <Text
              style={{ fontWeight: "bold", fontSize: 20, color: colors.text }}
            >
              {grasa}%
            </Text>
          </View>

          <View style={styles.center}>
            <View style={styles.row}>
              <Ionicons name="barbell" size={16} color={colors.secondary} />
              <Text style={globalStyles.cardText}> Masa Magra </Text>
            </View>
            <Text
              style={{ fontWeight: "bold", fontSize: 20, color: colors.text }}
            >
              {masaMagra} kg
            </Text>
          </View>
        </View>

        {/* Barra visual simple */}
        <View
          style={{
            height: 12,
            backgroundColor: colors.secondary,
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
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    alignItems: "center",
  },
  center: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
});
