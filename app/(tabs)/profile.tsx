import MeasureItem from "@/components/MeasureItem";
import { useTheme } from "@/context/ThemeContext";
import { Measure, getMeasures } from "@/store/measures";
import { getGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { Link, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function ProfileScreen() {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  const router = useRouter();

  const [measures, setMeasures] = useState<Measure[]>([]);

  const loadMeasures = async () => {
    const data = await getMeasures();
    setMeasures(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadMeasures();
    }, []),
  );

  const latest = measures[0];
  const previous = measures.length > 1 ? measures[1] : undefined;

  return (
    <ScrollView style={globalStyles.container}>
      <View style={globalStyles.header}>
        <Text style={globalStyles.title}>Mi Perfil</Text>
        <Link href="/settings/settings" asChild>
          <Ionicons style={globalStyles.title} name="settings" />
        </Link>
      </View>
      <View style={{ marginTop: 30 }}>
        {measures.length === 0 ? (
          <View style={[globalStyles.card, { alignItems: "center" }]}>
            <Ionicons name="person" size={40} color={colors.primary} />
            <Text style={globalStyles.cardText}>
              No hay informacion del perfil, desea agregarla?
            </Text>
            <TouchableOpacity
              style={globalStyles.button}
              onPress={() => router.push("/measures/PersonalData")}
            >
              <Text style={globalStyles.buttonText}>Agregar Información</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <View
              style={[
                globalStyles.card,
                {
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                },
              ]}
            >
              <View>
                <Text style={globalStyles.cardText}>Peso Actual</Text>
                <Text style={globalStyles.cardText}>
                  <Text
                    style={{
                      fontWeight: "bold",
                      color: colors.primary,
                      fontSize: 20,
                    }}
                  >
                    {latest?.peso || "No data"}
                  </Text>{" "}
                  kg
                </Text>
              </View>
              <Ionicons name="scale-outline" size={40} color={colors.primary} />
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={[globalStyles.card, { flex: 1 }]}>
                <Text style={globalStyles.cardText}>Edad</Text>
                <Text style={globalStyles.cardText}>
                  <Text
                    style={{
                      fontWeight: "bold",
                      color: colors.text,
                      fontSize: 20,
                    }}
                  >
                    {latest?.edad || "No data"}
                  </Text>{" "}
                  años
                </Text>
              </View>
              <View style={[globalStyles.card, { flex: 1 }]}>
                <Text style={globalStyles.cardText}>Altura Actual</Text>
                <Text style={globalStyles.cardText}>
                  <Text
                    style={{
                      fontWeight: "bold",
                      color: colors.text,
                      fontSize: 20,
                    }}
                  >
                    {latest?.altura || "No data"}
                  </Text>{" "}
                  cm
                </Text>
              </View>
            </View>
            <View
              style={[
                globalStyles.card,
                {
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                },
              ]}
            >
              <View>
                <Text style={globalStyles.cardText}>Genero</Text>

                <Text style={globalStyles.cardText}>
                  <Text
                    style={{
                      fontWeight: "bold",
                      color: colors.text,
                      fontSize: 20,
                    }}
                  >
                    {latest?.sexo || "No data"}
                  </Text>
                </Text>
              </View>
              {latest?.sexo === "Masculino" ? (
                <Ionicons
                  name="male-outline"
                  size={40}
                  color={colors.secondary}
                />
              ) : (
                <Ionicons
                  name="female-outline"
                  size={40}
                  color={colors.delete}
                />
              )}
            </View>
          </View>
        )}
        <Link style={globalStyles.title} href="/measures/measures">
          Medidas Corporales
        </Link>
        <Text style={globalStyles.textSecondary}>
          Rastrea tu progreso a lo largo del tiempo.
        </Text>

        {latest?.pecho ? (
          <MeasureItem
            name="Pecho"
            measure={latest.pecho}
            previousMeasure={previous?.pecho}
          />
        ) : null}
        {latest?.cuello ? (
          <MeasureItem
            name="Cuello"
            measure={latest.cuello}
            previousMeasure={previous?.cuello}
          />
        ) : null}
        {latest?.hombros ? (
          <MeasureItem
            name="Hombros"
            measure={latest.hombros}
            previousMeasure={previous?.hombros}
          />
        ) : null}
        {latest?.biceps ? (
          <MeasureItem
            name="Bíceps"
            measure={latest.biceps}
            previousMeasure={previous?.biceps}
          />
        ) : null}
        {latest?.antebrazo ? (
          <MeasureItem
            name="Antebrazo"
            measure={latest.antebrazo}
            previousMeasure={previous?.antebrazo}
          />
        ) : null}
        {latest?.cintura ? (
          <MeasureItem
            name="Cintura"
            measure={latest.cintura}
            previousMeasure={previous?.cintura}
          />
        ) : null}
        {latest?.cadera ? (
          <MeasureItem
            name="Cadera"
            measure={latest.cadera}
            previousMeasure={previous?.cadera}
          />
        ) : null}
        {latest?.cuadriceps ? (
          <MeasureItem
            name="Cuádriceps"
            measure={latest.cuadriceps}
            previousMeasure={previous?.cuadriceps}
          />
        ) : null}
        {latest?.gemelos ? (
          <MeasureItem
            name="Gemelos"
            measure={latest.gemelos}
            previousMeasure={previous?.gemelos}
          />
        ) : null}
        {latest?.gluteos ? (
          <MeasureItem
            name="Glúteos"
            measure={latest.gluteos}
            previousMeasure={previous?.gluteos}
          />
        ) : null}
      </View>

      {measures.length === 0 ? (
        <View>
          <Text style={globalStyles.textSecondary}>
            No existen medidas todavía...
          </Text>
          <TouchableOpacity
            style={[globalStyles.button, { width: "100%", marginBottom: 20 }]}
            onPress={() => router.push("/measures/measures")}
          >
            <Text style={globalStyles.buttonText}>Registrar Medidas</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[globalStyles.button, { width: "100%", marginBottom: 80 }]}
          onPress={() => router.push("/measures/measures")}
        >
          <Text style={globalStyles.buttonText}>Actualizar Medidas</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}
