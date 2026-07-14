import { useTheme } from "@/context/ThemeContext";
import { getGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type ExerciseType = {
  id: number;
  nombre: string;
  musculo: string;
  objetivo: string;
  equipamiento: string;
  urlimage?: string;
  series?: number;
  reps?: number;
  peso?: number;
};

type ExerciseList = ExerciseType[];

type Props = {
  data: {
    name: string;
    exercises: ExerciseType[];
  };
  timer: number;
  tonelaje: number;
  series: number;
};
const formatTime = (timer: number) => {
  const hour = Math.floor(timer / 3600);
  const min = Math.floor((timer % 3600) / 60);
  const sec = Math.floor(timer % 60);
  return { hour, min, sec };
};
const RoutineCompleted = ({ data, timer, tonelaje, series }: Props) => {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  const router = useRouter();
  return (
    <View
      style={[
        globalStyles.container,
        { alignItems: "center", flex: 1, justifyContent: "space-between" },
      ]}
    >
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
          borderRadius: " 100%",
          backgroundColor: colors.primary + 33,
          width: 150,
          height: 150,
          marginBottom: 40,
        }}
      >
        <Ionicons name="trophy" size={100} color={colors.primary} />
      </View>
      <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.primary }}>
        ENTRENAMIENTO COMPLETADO
      </Text>
      <Text style={globalStyles.textSecondary}>
        Sesion finalizada con exito.
      </Text>
      <View style={[globalStyles.card, { marginTop: 20, width: "100%" }]}>
        <Text style={globalStyles.cardText}>Resumen de la Rutina</Text>
        <Text style={globalStyles.cardTitle}> {data.name}</Text>
        <View
          style={{
            flexDirection: "row",
            gap: 10,
            width: "100%",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flex: 1, alignItems: "flex-start" }}>
            <Text style={globalStyles.cardText}>DURACION: </Text>

            <Text
              style={{ fontWeight: "bold", color: colors.text, fontSize: 40 }}
            >
              {formatTime(timer).hour}h
            </Text>
            <Text
              style={{ fontWeight: "bold", color: colors.text, fontSize: 40 }}
            >
              {formatTime(timer).min}min
            </Text>
          </View>
          <View style={{ flex: 1, alignItems: "flex-start" }}>
            <Text style={globalStyles.cardText}>PESO TOTAL: </Text>

            <Text
              style={{ fontWeight: "bold", color: colors.text, fontSize: 40 }}
            >
              {tonelaje}
            </Text>
            <Text
              style={{ fontWeight: "bold", color: colors.text, fontSize: 40 }}
            >
              KG
            </Text>
          </View>
        </View>
        <View
          style={{
            flexDirection: "row",
            gap: 10,
            width: "100%",
            justifyContent: "space-between",
            marginTop: 40,
          }}
        >
          <View style={{ flex: 1, alignItems: "flex-start" }}>
            <Text style={globalStyles.cardText}>SERIES: </Text>

            <Text
              style={{ fontWeight: "bold", color: colors.text, fontSize: 40 }}
            >
              {series}
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              alignItems: "flex-start",
              backgroundColor: colors.primary + 33,
              borderRadius: 10,
              padding: 10,
            }}
          >
            <Text style={[globalStyles.cardText, { color: colors.primary }]}>
              RECORDS:{" "}
            </Text>
            <Text
              style={{
                fontWeight: "bold",
                color: colors.primary,
                fontSize: 40,
              }}
            >
              2{" "}
              <Text style={{ color: colors.primary, fontSize: 20 }}>
                NUEVOS
              </Text>
            </Text>
          </View>
        </View>
      </View>
      <View style={{ width: "100%", marginBottom: 50 }}>
        <TouchableOpacity
          style={[globalStyles.button, { width: "100%" }]}
          onPress={() => router.dismissAll()}
        >
          <Text style={globalStyles.buttonText}>VOLVER AL INICIO</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            globalStyles.button,
            { backgroundColor: colors.surface, width: "100%" },
          ]}
        >
          <Text style={{ color: colors.text, fontWeight: "bold" }}>
            COMPARTIR RESUMEN
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default RoutineCompleted;
