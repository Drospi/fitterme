import MeasureCard from "@/components/MeasureCard";
import { useTheme } from "@/context/ThemeContext";
import { addMeasure, getLatestSanitizedMeasure, getMeasures, Measure } from "@/store/measures";
import { getGlobalStyles } from "@/styles/global";
import Toast from "react-native-toast-message";

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
  const [edad, setEdad] = useState(18);
  const [sexo, setSexo] = useState("Masculino");
  const [peso, setPeso] = useState(70);
  const [altura, setAltura] = useState(170);

  const [precision, setPrecision] = useState<number>(0.1);
  const [previousMeasures, setPreviousMeasures] = useState<Partial<Measure>>({});

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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: "success",
        text1: "Medidas Guardadas",
        text2: "Tus medidas corporales se han registrado con éxito.",
      });
      route.back();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error al guardar",
        text2: "No se pudieron guardar las medidas.",
      });
    }
  };

  const loadMeasures = async () => {
    const latest = await getLatestSanitizedMeasure();
    if (latest) {
      setCuello(latest.cuello || 38);
      setPecho(latest.pecho || 95);
      setHombros(latest.hombros || 110);
      setBiceps(latest.biceps || 32);
      setAntebrazo(latest.antebrazo || 15);
      setCintura(latest.cintura || 80);
      setCadera(latest.cadera || 90);
      setEspalda(latest.espalda || 105);
      setCuadriceps(latest.cuadriceps || 45);
      setGemelos(latest.gemelos || 33);
      setGluteos(latest.gluteos || 95);
      setEdad(latest.edad || 18);
      setSexo(latest.sexo || "Masculino");
      setPeso(latest.peso || 70);
      setAltura(latest.altura || 170);

      setPreviousMeasures(latest);
    }
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
          Registra tu progreso corporal. Todos los valores en centímetros (cm).
        </Text>
      </View>

      <View
        style={[
          globalStyles.card,
          {
            marginBottom: 15,
            padding: 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          },
        ]}
      >
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={{ fontSize: 13, fontWeight: "bold", color: colors.text }}>
            Precisión de ajuste
          </Text>
          <Text style={{ fontSize: 11, color: colors.textSecondary }}>
            Incrementos al presionar +/-
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: 6 }}>
          {[0.1, 0.5, 1.0].map((step) => (
            <TouchableOpacity
              key={step}
              onPress={() => {
                Haptics.selectionAsync();
                setPrecision(step);
              }}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: precision === step ? colors.primary : colors.background,
                borderWidth: 1,
                borderColor: precision === step ? colors.primary : colors.textSecondary + "30",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "bold",
                  color: precision === step ? colors.background : colors.text,
                }}
              >
                ±{step}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <MeasureCard
        name="Cuello"
        measure={cuello}
        previousMeasure={previousMeasures.cuello}
        setMeasure={setCuello}
        precision={precision}
        instructions="Mide alrededor de la parte media del cuello, justo por debajo de la manzana de Adán. Mantén la cabeza erguida en posición relajada."
      />
      <MeasureCard
        name="Pecho"
        measure={pecho}
        previousMeasure={previousMeasures.pecho}
        setMeasure={setPecho}
        precision={precision}
        instructions="Pasa la cinta alrededor del tórax a la altura de los pezones (parte más prominente). Mide al final de una exhalación normal con el torso erguido."
      />
      <MeasureCard
        name="Espalda"
        measure={espalda}
        previousMeasure={previousMeasures.espalda}
        setMeasure={setEspalda}
        precision={precision}
        instructions="Coloca la cinta métrica justo por debajo de las axilas, rodeando la parte superior de la espalda sobre los dorsales (lats) con los brazos relajados."
      />
      <MeasureCard
        name="Hombros"
        measure={hombros}
        previousMeasure={previousMeasures.hombros}
        setMeasure={setHombros}
        precision={precision}
        instructions="Mide alrededor de la parte más ancha de los hombros, envolviendo ambos deltoides con los brazos pegados al cuerpo en posición erguida."
      />
      <MeasureCard
        name="Bíceps"
        measure={biceps}
        previousMeasure={previousMeasures.biceps}
        setMeasure={setBiceps}
        precision={precision}
        instructions="Mide en el punto de mayor circunferencia del brazo. Flexiona el codo a 90° y contrae el bíceps al máximo para una medición precisa."
      />
      <MeasureCard
        name="Antebrazo"
        measure={antebrazo}
        previousMeasure={previousMeasures.antebrazo}
        setMeasure={setAntebrazo}
        precision={precision}
        instructions="Extiende el brazo y cierra el puño. Mide alrededor de la zona más gruesa del antebrazo, aproximadamente 2 cm por debajo del codo."
      />
      <MeasureCard
        name="Cintura"
        measure={cintura}
        previousMeasure={previousMeasures.cintura}
        setMeasure={setCintura}
        precision={precision}
        instructions="Mide en el punto más estrecho del abdomen (justo por encima del ombligo). Mide al final de una exhalación relajada sin contraer el abdomen."
      />
      <MeasureCard
        name="Cadera"
        measure={cadera}
        previousMeasure={previousMeasures.cadera}
        setMeasure={setCadera}
        precision={precision}
        instructions="Junta los pies y mide alrededor de la parte más prominente de los glúteos y la cadera con la cinta métrica perfectamente horizontal."
      />
      <MeasureCard
        name="Cuádriceps"
        measure={cuadriceps}
        previousMeasure={previousMeasures.cuadriceps}
        setMeasure={setCuadriceps}
        precision={precision}
        instructions="De pie con el peso distribuido por igual, mide en la parte media del muslo (punto medio entre la cadera y la rodilla) en la zona de mayor volumen."
      />
      <MeasureCard
        name="Gemelos"
        measure={gemelos}
        previousMeasure={previousMeasures.gemelos}
        setMeasure={setGemelos}
        precision={precision}
        instructions="De pie, mide alrededor de la circunferencia más ancha de la pantorrilla, asegurándote de que la cinta esté nivelada."
      />
      <MeasureCard
        name="Glúteos"
        measure={gluteos}
        previousMeasure={previousMeasures.gluteos}
        setMeasure={setGluteos}
        precision={precision}
        instructions="Mide alrededor de la parte con mayor volumen de los glúteos vista de perfil, manteniendo los pies juntos."
      />

      <View style={{ marginBottom: 90 }}>
        <TouchableOpacity onPress={handleSave} style={globalStyles.button}>
          <Text style={globalStyles.buttonText}>Guardar Medidas</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({});
