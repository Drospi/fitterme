import { useEffect, useState } from "react";

import { useTheme } from "@/context/ThemeContext";
import { addGoal, getGoals, Goals } from "@/store/goals";
import { getGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

const goalScreen = () => {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  const router = useRouter();

  const [goalWeight, setGoalWeight] = useState(0);
  const [goalGrass, setGoalGrass] = useState(0);
  const [masaMagra, setMasaMagra] = useState(0);
  const [frecuency, setFrecuency] = useState(0);

  const [goals, setGoals] = useState<Goals[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const fetchedGoals = await getGoals();
        if (fetchedGoals && fetchedGoals.length > 0) {
          const currentGoal = fetchedGoals[0];
          // Seteamos los estados con los datos obtenidos de la BD/Store
          setGoalWeight(currentGoal.goalWeight || 0);
          setGoalGrass(currentGoal.goalGrass || 0);
          setMasaMagra(currentGoal.masaMagra || 0);
          setFrecuency(currentGoal.frequency || 0);
        }
      } catch (error) {
        console.error("Error al cargar las metas:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    await addGoal({
      goalWeight,
      goalGrass,
      masaMagra,
      frequency: frecuency,
    });
    router.back();
  };

  if (loading) {
    return (
      <View
        style={[
          globalStyles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text style={{ color: colors.text, fontSize: 18 }}>Cargando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={globalStyles.container}>
      <View style={globalStyles.header}>
        <Ionicons
          name="arrow-back"
          size={24}
          color={colors.text}
          onPress={() => router.back()}
        ></Ionicons>
        <Text style={{ fontWeight: "bold", fontSize: 24, color: colors.text }}>
          Fijar Metas
        </Text>
        <Ionicons
          name="information-circle-outline"
          size={24}
          color={colors.text}
        ></Ionicons>
      </View>
      <View>
        <Text
          style={{
            fontSize: 20,
            color: colors.primary,
            marginVertical: 20,
            letterSpacing: 2,
          }}
        >
          PESO CORPORAL
        </Text>
        <View style={globalStyles.card}>
          <Text style={globalStyles.cardText}>Meta deseada</Text>
          <Text
            style={{ fontWeight: "bold", fontSize: 40, color: colors.primary }}
          >
            {goalWeight} <Text style={{ fontSize: 20 }}>kg</Text>
          </Text>
          <Slider
            style={{ width: "100%", height: 40 }}
            minimumValue={0}
            maximumValue={150}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.background}
            value={goalWeight}
            onValueChange={(value) => setGoalWeight(value)}
            step={1}
            thumbTintColor={colors.primary}
          />
        </View>
      </View>
      <View>
        <Text
          style={{
            fontSize: 20,
            color: colors.primary,
            marginVertical: 20,
            letterSpacing: 2,
          }}
        >
          COMPOSICION
        </Text>
        <View style={globalStyles.card}>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <Text style={globalStyles.cardText}>Grasa corporal (%)</Text>
            <Text
              style={{
                fontWeight: "bold",
                fontSize: 24,
                color: colors.primary,
              }}
            >
              {goalGrass} %
            </Text>
          </View>
          <Slider
            style={{ width: "100%", height: 40 }}
            minimumValue={0}
            maximumValue={100}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.background}
            value={goalGrass}
            onValueChange={(value) => setGoalGrass(value)}
            step={1}
            thumbTintColor={colors.primary}
          />
        </View>
        <View style={globalStyles.card}>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <Text style={globalStyles.cardText}>Masa magra (kg)</Text>
            <Text
              style={{
                fontWeight: "bold",
                fontSize: 24,
                color: colors.secondary,
              }}
            >
              {masaMagra} kg
            </Text>
          </View>
          <Slider
            style={{ width: "100%", height: 40 }}
            minimumValue={0}
            maximumValue={100}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.background}
            value={masaMagra}
            onValueChange={(value) => setMasaMagra(value)}
            step={1}
            thumbTintColor={colors.primary}
          />
        </View>
      </View>

      <View style={{ marginBottom: 20 }}>
        <Text
          style={{
            fontSize: 20,
            color: colors.primary,
            marginVertical: 20,
            letterSpacing: 2,
          }}
        >
          FRECUENCIA SEMANAL
        </Text>
        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[...Array(7)].map((_, index) => (
              <TouchableOpacity
                key={index}
                style={{
                  padding: 10,
                  paddingHorizontal: 15,
                  borderRadius: 50,
                  borderColor: colors.textSecondary,
                  borderWidth: 1,
                  marginRight: 10,
                  backgroundColor:
                    frecuency === index + 1 ? colors.primary : "transparent",
                }}
                onPress={() => setFrecuency(index + 1)}
              >
                <Text style={globalStyles.cardText}>{index + 1}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      <TouchableOpacity
        onPress={handleSave}
        style={[globalStyles.button, { marginBottom: 100 }]}
      >
        <Text style={globalStyles.buttonText}>Guardar Objetivos</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default goalScreen;
