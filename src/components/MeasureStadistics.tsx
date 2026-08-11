import { useTheme } from "@/context/ThemeContext";
import { DEFAULT_GOAL, getLatestGoal, Goals } from "@/store/goals";
import { getMeasures } from "@/store/measures";
import { getGlobalStyles } from "@/styles/global";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import FitnessAdvisor from "./FitnessAdvisor";

export default function MeasuresStadistics() {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  const [grasa, setGrasa] = useState(0);
  const [masaMagra, setMasaMagra] = useState(0);
  const [pesoActual, setPesoActual] = useState(0);
  const [measures, setMeasures] = useState<any>({});
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOAL);

  const calcularComposicion = (datos: any) => {
    if (!datos) return;

    const esHombre = (datos.sexo || "masculino").toLowerCase() === "masculino";
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
    const mm = ((100 - grasaFinal) / 100) * datos.peso;
    setMasaMagra(parseFloat(mm.toFixed(1)));
    setPesoActual(datos.peso);
  };

  const loadData = async () => {
    const userGoals = await getLatestGoal();
    setGoals(userGoals);

    const data = await getMeasures();
    const latestMeasure = data[0];

    if (latestMeasure) {
      calcularComposicion(latestMeasure);
      setMeasures(latestMeasure);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  // Mensajes alentadores personalizados
  const diffPeso =
    pesoActual > 0 ? (pesoActual - goals.goalWeight).toFixed(1) : 0;
  const diffGrasa = grasa > 0 ? (grasa - goals.goalGrass).toFixed(1) : 0;
  const diffMasaMagra =
    masaMagra > 0 ? (goals.masaMagra - masaMagra).toFixed(1) : 0;

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
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
              width: `${Math.min(100, grasa)}%`,
            }}
          />
        </View>
      </View>

      <FitnessAdvisor medidas={measures} />

      {/* Tarjeta de Mensajes Motivacionales según Metas */}
      {pesoActual > 0 && (
        <View
          style={[
            globalStyles.card,
            { backgroundColor: colors.surface, marginBottom: 100 },
          ]}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginBottom: 10,
            }}
          >
            <Ionicons
              name="trophy-outline"
              size={20}
              color={colors.secondary}
            />
            <Text
              style={[
                globalStyles.cardTitle,
                { fontSize: 16, fontWeight: "bold", marginBottom: 0 },
              ]}
            >
              Progreso hacia tus Metas
            </Text>
          </View>

          <View style={{ gap: 10 }}>
            {/* Mensaje de Peso */}
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Ionicons name="scale-outline" size={18} color={colors.primary} />
              <Text
                style={{
                  fontSize: 13,
                  color: colors.text,
                  flex: 1,
                  lineHeight: 18,
                }}
              >
                {parseFloat(diffPeso as any) > 0
                  ? `Te faltan ${diffPeso} kg para tu peso ideal (${goals.goalWeight} kg). ¡Sigue fuerte!`
                  : parseFloat(diffPeso as any) < 0
                    ? `Estás a ${Math.abs(parseFloat(diffPeso as any))} kg de tu objetivo de peso (${goals.goalWeight} kg).`
                    : `¡Felicidades! Has alcanzado exactamente tu peso meta (${goals.goalWeight} kg).`}
              </Text>
            </View>

            {/* Mensaje de Grasa Corporal */}
            {grasa > 0 && (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Ionicons
                  name="flame-outline"
                  size={18}
                  color={colors.delete}
                />
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.text,
                    flex: 1,
                    lineHeight: 18,
                  }}
                >
                  {parseFloat(diffGrasa as any) > 0
                    ? `A solo ${diffGrasa}% de alcanzar tu meta de grasa corporal (${goals.goalGrass}%).`
                    : `¡Excelente porcentaje de grasa! Mantente en tu meta de ${goals.goalGrass}%.`}
                </Text>
              </View>
            )}

            {/* Mensaje de Masa Magra */}
            {masaMagra > 0 && (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Ionicons
                  name="fitness-outline"
                  size={18}
                  color={colors.secondary}
                />
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.text,
                    flex: 1,
                    lineHeight: 18,
                  }}
                >
                  {parseFloat(diffMasaMagra as any) > 0
                    ? `Te faltan ${diffMasaMagra} kg de masa muscular para alcanzar tu meta (${goals.masaMagra} kg).`
                    : `¡Meta de masa muscular alcanzada! Tienes ${masaMagra} kg de masa magra.`}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
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
