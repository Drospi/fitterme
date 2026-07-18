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
                    {measures[0]?.peso || "No data"}
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
                    {measures[0]?.edad || "No data"}
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
                    {measures[0]?.altura || "No data"}
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
                    {measures[0]?.sexo || "No data"}
                  </Text>
                </Text>
              </View>
              {measures[0]?.sexo === "Masculino" ? (
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
        {measures[0]?.pecho ? (
          <MeasureItem name="Pecho" measure={measures[0]?.pecho} link="" />
        ) : null}
        {measures[0]?.cuello ? (
          <MeasureItem name="Cuello" measure={measures[0]?.cuello} link="" />
        ) : null}
        {measures[0]?.hombros ? (
          <MeasureItem name="Hombros" measure={measures[0]?.hombros} link="" />
        ) : null}
        {measures[0]?.biceps ? (
          <MeasureItem name="Biceps" measure={measures[0]?.biceps} link="" />
        ) : null}
        {measures[0]?.antebrazo ? (
          <MeasureItem
            name="Antebrazo"
            measure={measures[0]?.antebrazo}
            link=""
          />
        ) : null}
        {measures[0]?.cintura ? (
          <MeasureItem name="Cintura" measure={measures[0]?.cintura} link="" />
        ) : null}
        {measures[0]?.cadera ? (
          <MeasureItem name="Cadera" measure={measures[0]?.cadera} link="" />
        ) : null}
        {measures[0]?.cuadriceps ? (
          <MeasureItem
            name="Cuadriceps"
            measure={measures[0]?.cuadriceps}
            link=""
          />
        ) : null}
        {measures[0]?.gemelos ? (
          <MeasureItem name="Gemelos" measure={measures[0]?.gemelos} link="" />
        ) : null}
        {measures[0]?.gluteos ? (
          <MeasureItem name="Gluteos" measure={measures[0]?.gluteos} link="" />
        ) : null}
      </View>
      {measures.length === 0 ? (
        <View>
          <Text style={globalStyles.textSecondary}>
            No existen medidas todavia...
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
