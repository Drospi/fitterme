import { useTheme } from "@/context/ThemeContext";
import { addCustomExercise } from "@/store/excercise";
import { getGlobalStyles } from "@/styles/global";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import Toast from "react-native-toast-message";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const MUSCLES = [
  "cardio",
  "pecho",
  "espalda",
  "hombros",
  "biceps",
  "triceps",
  "antebrazo",
  "cuadriceps",
  "gemelos",
  "gluteos",
  "abdomen",
];

const CATEGORIES = ["Gym", "Cardio", "Peso corporal"] as const;

const EQUIPMENT = [
  "Mancuernas",
  "Barra",
  "Polea",
  "Máquina",
  "Peso corporal",
  "Bandas",
];

export default function AddCustomExerciseScreen() {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [musculo, setMusculo] = useState("pecho");
  const [categoria, setCategoria] = useState<string>("Gym");
  const [equipamiento, setEquipamiento] = useState("Mancuernas");
  const [descripcion, setDescripcion] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);

  const handlePickImage = () => {
    Alert.alert(
      "Imagen del Ejercicio",
      "Selecciona el origen de la imagen",
      [
        {
          text: "📷 Tomar Foto",
          onPress: async () => {
            const permission = await ImagePicker.requestCameraPermissionsAsync();
            if (!permission.granted) {
              Toast.show({
                type: "error",
                text1: "Permiso denegado",
                text2: "Se requiere permiso de acceso a la cámara.",
              });
              return;
            }
            const res = await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (!res.canceled && res.assets?.[0]) {
              setImageUri(res.assets[0].uri);
            }
          },
        },
        {
          text: "🖼️ Elegir de la Galería",
          onPress: async () => {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
              Toast.show({
                type: "error",
                text1: "Permiso denegado",
                text2: "Se requiere permiso de acceso a la galería.",
              });
              return;
            }
            const res = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (!res.canceled && res.assets?.[0]) {
              setImageUri(res.assets[0].uri);
            }
          },
        },
        { text: "Cancelar", style: "cancel" },
      ]
    );
  };

  const handleSave = async () => {
    if (!nombre.trim()) {
      Toast.show({
        type: "error",
        text1: "Nombre requerido",
        text2: "Ingresa el nombre del ejercicio para guardar.",
      });
      return;
    }

    await addCustomExercise({
      nombre: nombre.trim(),
      musculo,
      objetivo: categoria,
      category: categoria,
      equipamiento,
      descripcion: descripcion.trim() || undefined,
      urlimage: imageUri || undefined,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Toast.show({
      type: "success",
      text1: "Ejercicio Creado",
      text2: `"${nombre}" fue creado correctamente.`,
    });
    router.back();
  };

  return (
    <ScrollView style={globalStyles.container}>
      <Text style={[globalStyles.title, { marginBottom: 20 }]}>
        Crear Ejercicio Personalizado
      </Text>

      {/* Selector de Imagen */}
      <Text style={[globalStyles.textSecondary, { marginBottom: 8 }]}>
        Imagen del Ejercicio
      </Text>
      <TouchableOpacity
        onPress={handlePickImage}
        style={{
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.surface,
          borderRadius: 16,
          height: 150,
          marginBottom: 20,
          borderWidth: 1.5,
          borderStyle: "dashed",
          borderColor: colors.primary + "80",
          overflow: "hidden",
        }}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={{ width: "100%", height: "100%" }} />
        ) : (
          <View style={{ alignItems: "center", gap: 6 }}>
            <Ionicons name="camera-outline" size={36} color={colors.primary} />
            <Text style={{ color: colors.primary, fontWeight: "bold", fontSize: 14 }}>
              Subir Foto o Imagen del Ejercicio
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
              Toca aquí para seleccionar de cámara o galería
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Nombre */}
      <Text style={[globalStyles.textSecondary, { marginBottom: 8 }]}>
        Nombre del Ejercicio
      </Text>
      <TextInput
        style={globalStyles.input}
        placeholder="Ej. Press Inclinado con Cadenas"
        placeholderTextColor={colors.textSecondary}
        value={nombre}
        onChangeText={setNombre}
      />

      {/* Descripción / Instrucciones */}
      <Text style={[globalStyles.textSecondary, { marginTop: 15, marginBottom: 8 }]}>
        Descripción / Instrucciones de Ejecución
      </Text>
      <TextInput
        style={[globalStyles.input, { height: 90, textAlignVertical: "top" }]}
        placeholder="Explica paso a paso cómo realizar el movimiento con técnica correcta..."
        placeholderTextColor={colors.textSecondary}
        value={descripcion}
        onChangeText={setDescripcion}
        multiline
      />

      {/* Músculo */}
      <Text style={[globalStyles.textSecondary, { marginTop: 15, marginBottom: 8 }]}>
        Grupo Muscular Principal
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 15 }}>
        {MUSCLES.map((m) => {
          const isSelected = musculo === m;
          const label = m.charAt(0).toUpperCase() + m.slice(1);
          return (
            <TouchableOpacity
              key={m}
              onPress={() => setMusculo(m)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 18,
                backgroundColor: isSelected ? colors.primary : colors.surface,
              }}
            >
              <Text
                style={{
                  fontWeight: "bold",
                  fontSize: 13,
                  color: isSelected ? colors.background : colors.text,
                }}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Categoría del Ejercicio */}
      <Text style={[globalStyles.textSecondary, { marginBottom: 8 }]}>
        Categoría del Ejercicio
      </Text>
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 15 }}>
        {CATEGORIES.map((cat) => {
          const isSelected = categoria === cat;
          const icon = cat === "Gym" ? "🏋️ " : cat === "Cardio" ? "🏃 " : "🤸 ";
          return (
            <TouchableOpacity
              key={cat}
              onPress={() => setCategoria(cat)}
              style={{
                flex: 1,
                paddingVertical: 10,
                paddingHorizontal: 4,
                borderRadius: 16,
                alignItems: "center",
                backgroundColor: isSelected ? colors.primary : colors.surface,
              }}
            >
              <Text
                style={{
                  fontWeight: "bold",
                  fontSize: 12,
                  color: isSelected ? colors.background : colors.text,
                  textAlign: "center",
                }}
              >
                {icon}{cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Equipamiento */}
      <Text style={[globalStyles.textSecondary, { marginBottom: 8 }]}>
        Equipamiento Requerido
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 25 }}>
        {EQUIPMENT.map((eq) => {
          const isSelected = equipamiento === eq;
          return (
            <TouchableOpacity
              key={eq}
              onPress={() => setEquipamiento(eq)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 18,
                backgroundColor: isSelected ? colors.primary : colors.surface,
              }}
            >
              <Text
                style={{
                  fontWeight: "bold",
                  fontSize: 13,
                  color: isSelected ? colors.background : colors.text,
                }}
              >
                {eq}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Guardar */}
      <TouchableOpacity
        style={[globalStyles.button, { marginBottom: 60 }]}
        onPress={handleSave}
      >
        <Text style={globalStyles.buttonText}>Guardar Ejercicio Personalizado</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({});
