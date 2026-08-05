import { useTheme } from "@/context/ThemeContext";
import { getGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity } from "react-native";

type Props = {
  next: () => void;
  data: { name: string; category: string };
  updateData: (newData: Partial<{ name: string; category: string }>) => void;
};

export default function Step1({ next, data, updateData }: Props) {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const [category, setCategory] = useState(data ? data.category : "");
  const [name, setName] = useState(data ? data.name : "");

  useEffect(() => {
    setName(data.name);
    setCategory(data.category);
  }, [data]);

  const handleSelect = () => {
    updateData({ name: name, category: category });
    next();
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Ionicons
        name="arrow-back"
        size={32}
        onPress={() => router.back()}
        color={colors.text}
      />
      <Text style={[globalStyles.title, { fontSize: 20 }]}>
        Paso 1: Información Básica
      </Text>
      <Text style={globalStyles.textSecondary}>
        Define el nombre y el objetivo principal de tu nueva rutina para
        empezar.
      </Text>
      <Text style={[globalStyles.title, { fontSize: 28 }]}>
        Nombre de la Rutina
      </Text>
      <TextInput
        placeholder="Ej: Lunes Pecho & Biceps"
        style={globalStyles.input}
        placeholderTextColor={colors.textSecondary}
        value={name}
        onChangeText={setName}
      />

      <Text
        style={[
          globalStyles.title,
          { fontSize: 20, marginBottom: 10, marginTop: 20 },
        ]}
      >
        Objetivo Principal
      </Text>
      <TouchableOpacity
        style={
          category === "fuerza" ? globalStyles.activeCard : globalStyles.card
        }
        onPress={() => {
          setCategory("fuerza");
        }}
      >
        <Ionicons name="barbell" size={32} color={colors.secondary}></Ionicons>
        <Text style={globalStyles.title}>Fuerza</Text>
        <Text style={globalStyles.cardText}>
          Maximo peso, bajas repeticiones.
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={
          category === "hipertrofia"
            ? globalStyles.activeCard
            : globalStyles.card
        }
        onPress={() => {
          setCategory("hipertrofia");
        }}
      >
        <Ionicons name="body-sharp" size={32} color={colors.delete}></Ionicons>
        <Text style={globalStyles.title}>Hipertrofia</Text>
        <Text style={globalStyles.cardText}>
          Volumen medio, desarrollo muscular.
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={
          category === "resistencia"
            ? globalStyles.activeCard
            : globalStyles.card
        }
        onPress={() => {
          setCategory("resistencia");
        }}
      >
        <Ionicons
          name="battery-full-sharp"
          size={32}
          color={colors.primary}
        ></Ionicons>
        <Text style={globalStyles.title}>Resistencia</Text>
        <Text style={globalStyles.cardText}>
          Altas repeticiones, cardio integrado.
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          globalStyles.button,
          {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 100,
          },
        ]}
        onPress={handleSelect}
      >
        <Text style={globalStyles.buttonText}>Siguiente</Text>
        <Ionicons name="arrow-forward" size={24} color={colors.background} />
      </TouchableOpacity>
    </ScrollView>
  );
}
