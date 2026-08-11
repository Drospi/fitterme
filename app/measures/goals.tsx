import { useTheme } from "@/context/ThemeContext";
import { addGoal, getLatestGoal } from "@/store/goals";
import { getGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";

export default function GoalScreen() {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const router = useRouter();

  const [goalWeight, setGoalWeight] = useState(75);
  const [goalGrass, setGoalGrass] = useState(15);
  const [masaMagra, setMasaMagra] = useState(60);
  const [frequency, setFrequency] = useState(4);

  const [targetCalories, setTargetCalories] = useState(2500);
  const [targetProtein, setTargetProtein] = useState(140);
  const [targetCarbs, setTargetCarbs] = useState(250);
  const [targetFat, setTargetFat] = useState(70);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const latest = await getLatestGoal();
        setGoalWeight(latest.goalWeight || 75);
        setGoalGrass(latest.goalGrass || 15);
        setMasaMagra(latest.masaMagra || 60);
        setFrequency(latest.frequency || 4);

        setTargetCalories(latest.targetCalories || 2500);
        setTargetProtein(latest.targetProtein || 140);
        setTargetCarbs(latest.targetCarbs || 250);
        setTargetFat(latest.targetFat || 70);
      } catch (error) {
        console.error("Error al cargar las metas:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await addGoal({
      goalWeight,
      goalGrass,
      masaMagra,
      frequency,
      targetCalories,
      targetProtein,
      targetCarbs,
      targetFat,
    });

    Toast.show({
      type: "success",
      text1: "Metas Guardadas",
      text2: "Tus metas nutricionales y físicas han sido actualizadas.",
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
        <Text style={{ color: colors.text, fontSize: 18 }}>Cargando metas...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={globalStyles.container} showsVerticalScrollIndicator={false}>
      <View style={globalStyles.header}>
        <Ionicons
          name="arrow-back"
          size={24}
          color={colors.text}
          onPress={() => router.back()}
        />
        <Text style={{ fontWeight: "bold", fontSize: 24, color: colors.text }}>
          Fijar Metas
        </Text>
        <Ionicons
          name="analytics"
          size={24}
          color={colors.primary}
        />
      </View>

      {/* METAS NUTRICIONALES */}
      <View>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "bold",
            color: colors.primary,
            marginVertical: 15,
            letterSpacing: 1.5,
          }}
        >
          METAS NUTRICIONALES DIARIAS
        </Text>

        {/* Calorías Objetivo */}
        <View style={globalStyles.card}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={globalStyles.cardText}>Calorías Objetivo</Text>
            <Text style={{ fontWeight: "bold", fontSize: 24, color: colors.primary }}>
              {targetCalories} <Text style={{ fontSize: 14 }}>kcal</Text>
            </Text>
          </View>
          <Slider
            style={{ width: "100%", height: 40 }}
            minimumValue={1200}
            maximumValue={4500}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.background}
            value={targetCalories}
            onValueChange={(val) => setTargetCalories(Math.round(val))}
            step={50}
            thumbTintColor={colors.primary}
          />
        </View>

        {/* Proteínas Objetivo */}
        <View style={globalStyles.card}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={globalStyles.cardText}>Proteína Objetivo</Text>
            <Text style={{ fontWeight: "bold", fontSize: 24, color: colors.secondary }}>
              {targetProtein} <Text style={{ fontSize: 14 }}>g</Text>
            </Text>
          </View>
          <Slider
            style={{ width: "100%", height: 40 }}
            minimumValue={40}
            maximumValue={300}
            minimumTrackTintColor={colors.secondary}
            maximumTrackTintColor={colors.background}
            value={targetProtein}
            onValueChange={(val) => setTargetProtein(Math.round(val))}
            step={5}
            thumbTintColor={colors.secondary}
          />
        </View>

        {/* Carbohidratos Objetivo */}
        <View style={globalStyles.card}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={globalStyles.cardText}>Carbohidratos Objetivo</Text>
            <Text style={{ fontWeight: "bold", fontSize: 24, color: colors.delete }}>
              {targetCarbs} <Text style={{ fontSize: 14 }}>g</Text>
            </Text>
          </View>
          <Slider
            style={{ width: "100%", height: 40 }}
            minimumValue={50}
            maximumValue={500}
            minimumTrackTintColor={colors.delete}
            maximumTrackTintColor={colors.background}
            value={targetCarbs}
            onValueChange={(val) => setTargetCarbs(Math.round(val))}
            step={5}
            thumbTintColor={colors.delete}
          />
        </View>

        {/* Grasas Objetivo */}
        <View style={globalStyles.card}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={globalStyles.cardText}>Grasas Objetivo</Text>
            <Text style={{ fontWeight: "bold", fontSize: 24, color: colors.textSecondary }}>
              {targetFat} <Text style={{ fontSize: 14 }}>g</Text>
            </Text>
          </View>
          <Slider
            style={{ width: "100%", height: 40 }}
            minimumValue={20}
            maximumValue={150}
            minimumTrackTintColor={colors.textSecondary}
            maximumTrackTintColor={colors.background}
            value={targetFat}
            onValueChange={(val) => setTargetFat(Math.round(val))}
            step={5}
            thumbTintColor={colors.textSecondary}
          />
        </View>
      </View>

      {/* METAS DE PESO Y COMPOSICIÓN */}
      <View>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "bold",
            color: colors.primary,
            marginVertical: 15,
            letterSpacing: 1.5,
          }}
        >
          PESO Y COMPOSICIÓN CORPORAL
        </Text>

        <View style={globalStyles.card}>
          <Text style={globalStyles.cardText}>Meta de Peso deseado</Text>
          <Text
            style={{ fontWeight: "bold", fontSize: 36, color: colors.primary, marginTop: 4 }}
          >
            {goalWeight} <Text style={{ fontSize: 18 }}>kg</Text>
          </Text>
          <Slider
            style={{ width: "100%", height: 40 }}
            minimumValue={40}
            maximumValue={150}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.background}
            value={goalWeight}
            onValueChange={(val) => setGoalWeight(Math.round(val))}
            step={1}
            thumbTintColor={colors.primary}
          />
        </View>

        <View style={globalStyles.card}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={globalStyles.cardText}>Grasa corporal meta (%)</Text>
            <Text style={{ fontWeight: "bold", fontSize: 22, color: colors.primary }}>
              {goalGrass} %
            </Text>
          </View>
          <Slider
            style={{ width: "100%", height: 40 }}
            minimumValue={5}
            maximumValue={45}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.background}
            value={goalGrass}
            onValueChange={(val) => setGoalGrass(Math.round(val))}
            step={1}
            thumbTintColor={colors.primary}
          />
        </View>

        <View style={globalStyles.card}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={globalStyles.cardText}>Masa magra meta (kg)</Text>
            <Text style={{ fontWeight: "bold", fontSize: 22, color: colors.secondary }}>
              {masaMagra} kg
            </Text>
          </View>
          <Slider
            style={{ width: "100%", height: 40 }}
            minimumValue={30}
            maximumValue={110}
            minimumTrackTintColor={colors.secondary}
            maximumTrackTintColor={colors.background}
            value={masaMagra}
            onValueChange={(val) => setMasaMagra(Math.round(val))}
            step={1}
            thumbTintColor={colors.secondary}
          />
        </View>
      </View>

      {/* FRECUENCIA SEMANAL */}
      <View style={{ marginBottom: 20 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "bold",
            color: colors.primary,
            marginVertical: 15,
            letterSpacing: 1.5,
          }}
        >
          FRECUENCIA DE ENTRENAMIENTO
        </Text>
        <Text style={[globalStyles.cardText, { marginBottom: 10 }]}>
          Días a entrenar por semana: <Text style={{ fontWeight: "bold", color: colors.primary }}>{frequency} días</Text>
        </Text>
        <View style={{ flexDirection: "row", gap: 10, justifyContent: "space-between" }}>
          {[1, 2, 3, 4, 5, 6, 7].map((val) => {
            const isSelected = frequency === val;
            return (
              <TouchableOpacity
                key={val}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: isSelected ? colors.primary : colors.textSecondary + "40",
                  backgroundColor: isSelected ? colors.primary : colors.surface,
                  alignItems: "center",
                }}
                onPress={() => setFrequency(val)}
              >
                <Text
                  style={{
                    fontWeight: "bold",
                    fontSize: 16,
                    color: isSelected ? colors.background : colors.text,
                  }}
                >
                  {val}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <TouchableOpacity
        onPress={handleSave}
        style={[globalStyles.button, { marginBottom: 80 }]}
      >
        <Text style={globalStyles.buttonText}>Guardar Objetivos</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
