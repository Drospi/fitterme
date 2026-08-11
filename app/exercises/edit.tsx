import { useTheme } from "@/context/ThemeContext";
import {
  ExerciseCatalogItem,
  getExerciseById,
  updateExercise,
} from "@/store/excercise";
import { getGlobalStyles } from "@/styles/global";
import { getExerciseImage } from "@/utils/imageMap";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import Toast from "react-native-toast-message";
import {
  ActivityIndicator,
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

const OBJECTIVES = ["Hipertrofia", "Fuerza", "Resistencia"];

const EQUIPMENT = [
  "Mancuernas",
  "Barra",
  "Polea",
  "Máquina",
  "Peso corporal",
  "Bandas",
];

export default function EditExerciseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [exercise, setExercise] = useState<ExerciseCatalogItem | null>(null);

  const [nombre, setNombre] = useState("");
  const [musculo, setMusculo] = useState("pecho");
  const [objetivo, setObjetivo] = useState("Hipertrofia");
  const [equipamiento, setEquipamiento] = useState("Mancuernas");
  const [descripcion, setDescripcion] = useState("");
  const [imageUri, setImageUri] = useState<string | undefined>(undefined);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const ex = await getExerciseById(id);
      if (ex) {
        setExercise(ex);
        setNombre(ex.nombre);
        setMusculo(ex.musculo);
        setObjetivo(ex.objetivo);
        setEquipamiento(ex.equipamiento);
        setDescripcion(ex.descripcion || "");
        setImageUri(ex.urlimage);
      }
      setLoading(false);
    };
    load();
  }, [id]);

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
                text2: "Se requiere permiso de la cámara.",
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
                text2: "Se requiere permiso a la galería.",
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
    if (!exercise) return;
    if (!nombre.trim()) {
      Toast.show({
        type: "error",
        text1: "Nombre requerido",
        text2: "Ingresa el nombre del ejercicio para guardar.",
      });
      return;
    }

    const updated: ExerciseCatalogItem = {
      ...exercise,
      nombre: nombre.trim(),
      musculo,
      objetivo,
      equipamiento,
      descripcion: descripcion.trim() || undefined,
      urlimage: imageUri,
    };

    await updateExercise(updated);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Toast.show({
      type: "success",
      text1: "Ejercicio Actualizado",
      text2: `"${nombre}" fue guardado con éxito.`,
    });
    router.back();
  };

  if (loading) {
    return (
      <View style={[globalStyles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!exercise) {
    return (
      <View style={[globalStyles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={globalStyles.cardText}>Ejercicio no encontrado.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={globalStyles.container}>
      {/* Header */}
      <View style={[globalStyles.header, { marginBottom: 20 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={[globalStyles.title, { fontSize: 20 }]}>Editar Ejercicio</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* Imagen */}
      <Text style={[globalStyles.textSecondary, { marginBottom: 8 }]}>Imagen del Ejercicio</Text>
      <TouchableOpacity
        onPress={handlePickImage}
        style={{
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.surface,
          borderRadius: 16,
          height: 160,
          marginBottom: 20,
          borderWidth: 1.5,
          borderColor: colors.primary + "80",
          overflow: "hidden",
        }}
      >
        <Image
          source={getExerciseImage(exercise.id, imageUri)}
          style={{ width: "100%", height: "100%" }}
        />
        <View
          style={{
            position: "absolute",
            bottom: 10,
            backgroundColor: "rgba(0,0,0,0.6)",
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Ionicons name="camera" size={16} color="#FFF" />
          <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "bold" }}>Cambiar Foto</Text>
        </View>
      </TouchableOpacity>

      {/* Nombre */}
      <Text style={[globalStyles.textSecondary, { marginBottom: 8 }]}>Nombre</Text>
      <TextInput
        style={globalStyles.input}
        value={nombre}
        onChangeText={setNombre}
        placeholderTextColor={colors.textSecondary}
      />

      {/* Descripción */}
      <Text style={[globalStyles.textSecondary, { marginTop: 15, marginBottom: 8 }]}>
        Descripción / Instrucciones de Ejecución
      </Text>
      <TextInput
        style={[globalStyles.input, { height: 100, textAlignVertical: "top" }]}
        value={descripcion}
        onChangeText={setDescripcion}
        multiline
        placeholder="Explica cómo realizar el movimiento con la técnica correcta..."
        placeholderTextColor={colors.textSecondary}
      />

      {/* Grupo Muscular */}
      <Text style={[globalStyles.textSecondary, { marginTop: 15, marginBottom: 8 }]}>
        Grupo Muscular
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

      {/* Objetivo */}
      <Text style={[globalStyles.textSecondary, { marginBottom: 8 }]}>Objetivo</Text>
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 15 }}>
        {OBJECTIVES.map((obj) => {
          const isSelected = objetivo === obj;
          return (
            <TouchableOpacity
              key={obj}
              onPress={() => setObjetivo(obj)}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 16,
                alignItems: "center",
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
                {obj}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Equipamiento */}
      <Text style={[globalStyles.textSecondary, { marginBottom: 8 }]}>Equipamiento</Text>
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

      {/* Guardar Cambios */}
      <TouchableOpacity
        style={[globalStyles.button, { marginBottom: 60 }]}
        onPress={handleSave}
      >
        <Text style={globalStyles.buttonText}>Guardar Cambios</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({});
