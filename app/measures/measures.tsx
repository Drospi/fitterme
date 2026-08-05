import MeasureCard from "@/components/MeasureCard";
import { useTheme } from "@/context/ThemeContext";
import { addMeasure, getMeasures, Measure } from "@/store/measures";
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
  const [edad, setEdad] = useState(18);
  const [sexo, setSexo] = useState("Masculino");
  const [peso, setPeso] = useState(70);
  const [altura, setAltura] = useState(170);

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
      route.dismissAll();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      alert("Error al guardar");
    }
  };

  const loadMeasures = async () => {
    const data = await getMeasures();
    if (data && data.length > 0) {
      const latest = data[0];
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

      const prev = data.length > 1 ? data[1] : data[0];
      setPreviousMeasures(prev);
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

      <MeasureCard
        name="Cuello"
        measure={cuello}
        previousMeasure={previousMeasures.cuello}
        setMeasure={setCuello}
        instructions="Mide alrededor de la parte media del cuello, justo por debajo de la manzana de Adán. Mantén la cabeza erguida en posición relajada."
      />
      <MeasureCard
        name="Pecho"
        measure={pecho}
        previousMeasure={previousMeasures.pecho}
        setMeasure={setPecho}
        instructions="Pasa la cinta alrededor del tórax a la altura de los pezones (parte más prominente). Mide al final de una exhalación normal con el torso erguido."
      />
      <MeasureCard
        name="Espalda"
        measure={espalda}
        previousMeasure={previousMeasures.espalda}
        setMeasure={setEspalda}
        instructions="Coloca la cinta métrica justo por debajo de las axilas, rodeando la parte superior de la espalda sobre los dorsales (lats) con los brazos relajados."
      />
      <MeasureCard
        name="Hombros"
        measure={hombros}
        previousMeasure={previousMeasures.hombros}
        setMeasure={setHombros}
        instructions="Mide alrededor de la parte más ancha de los hombros, envolviendo ambos deltoides con los brazos pegados al cuerpo en posición erguida."
      />
      <MeasureCard
        name="Bíceps"
        measure={biceps}
        previousMeasure={previousMeasures.biceps}
        setMeasure={setBiceps}
        instructions="Mide en el punto de mayor circunferencia del brazo. Flexiona el codo a 90° y contrae el bíceps al máximo para una medición precisa."
      />
      <MeasureCard
        name="Antebrazo"
        measure={antebrazo}
        previousMeasure={previousMeasures.antebrazo}
        setMeasure={setAntebrazo}
        instructions="Extiende el brazo y cierra el puño. Mide alrededor de la zona más gruesa del antebrazo, aproximadamente 2 cm por debajo del codo."
      />
      <MeasureCard
        name="Cintura"
        measure={cintura}
        previousMeasure={previousMeasures.cintura}
        setMeasure={setCintura}
        instructions="Mide en el punto más estrecho del abdomen (justo por encima del ombligo). Mide al final de una exhalación relajada sin contraer el abdomen."
      />
      <MeasureCard
        name="Cadera"
        measure={cadera}
        previousMeasure={previousMeasures.cadera}
        setMeasure={setCadera}
        instructions="Junta los pies y mide alrededor de la parte más prominente de los glúteos y la cadera con la cinta métrica perfectamente horizontal."
      />
      <MeasureCard
        name="Cuádriceps"
        measure={cuadriceps}
        previousMeasure={previousMeasures.cuadriceps}
        setMeasure={setCuadriceps}
        instructions="De pie con el peso distribuido por igual, mide en la parte media del muslo (punto medio entre la cadera y la rodilla) en la zona de mayor volumen."
      />
      <MeasureCard
        name="Gemelos"
        measure={gemelos}
        previousMeasure={previousMeasures.gemelos}
        setMeasure={setGemelos}
        instructions="De pie, mide alrededor de la circunferencia más ancha de la pantorrilla, asegurándote de que la cinta esté nivelada."
      />
      <MeasureCard
        name="Glúteos"
        measure={gluteos}
        previousMeasure={previousMeasures.gluteos}
        setMeasure={setGluteos}
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
