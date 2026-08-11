import { useTheme } from "@/context/ThemeContext";
import {
  AIFoodAnalysisResult,
  analyzeFoodImageWithAI,
} from "@/services/aiNutritionService";
import { MealCategory } from "@/store/meals";
import { getGlobalStyles } from "@/styles/global";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirmLog: (mealData: {
    name: string;
    category: MealCategory;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    icon: string;
  }) => void;
};

const CATEGORIES: MealCategory[] = ["Desayuno", "Almuerzo", "Cena", "Snack"];

export default function AIFoodScannerModal({
  visible,
  onClose,
  onConfirmLog,
}: Props) {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIFoodAnalysisResult | null>(null);

  // Campos editables tras el análisis de IA
  const [editedName, setEditedName] = useState("");
  const [editedCategory, setEditedCategory] = useState<MealCategory>("Almuerzo");
  const [editedCalories, setEditedCalories] = useState("");
  const [editedProtein, setEditedProtein] = useState("");
  const [editedCarbs, setEditedCarbs] = useState("");
  const [editedFat, setEditedFat] = useState("");

  const resetState = () => {
    setImageUri(null);
    setIsAnalyzing(false);
    setAnalysisResult(null);
    setEditedName("");
    setEditedCategory("Almuerzo");
    setEditedCalories("");
    setEditedProtein("");
    setEditedCarbs("");
    setEditedFat("");
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const processSelectedImage = async (uri: string, base64?: string | null) => {
    setImageUri(uri);
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const result = await analyzeFoodImageWithAI(base64 || "");
      setAnalysisResult(result);
      setEditedName(result.name);
      setEditedCategory(result.category);
      setEditedCalories(result.calories.toString());
      setEditedProtein(result.protein.toString());
      setEditedCarbs(result.carbs.toString());
      setEditedFat(result.fat.toString());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      alert("Error al analizar la imagen. Inténtalo de nuevo.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePickFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      alert("Se requiere permiso de la cámara para tomar fotos de tus platos.");
      return;
    }

    const pickerResult = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

    if (!pickerResult.canceled && pickerResult.assets?.[0]) {
      const asset = pickerResult.assets[0];
      await processSelectedImage(asset.uri, asset.base64);
    }
  };

  const handlePickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert("Se requiere permiso a la galería para seleccionar imágenes.");
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

    if (!pickerResult.canceled && pickerResult.assets?.[0]) {
      const asset = pickerResult.assets[0];
      await processSelectedImage(asset.uri, asset.base64);
    }
  };

  const handleConfirm = () => {
    if (!editedName.trim()) {
      alert("Por favor ingresa un nombre para el registro de consumo.");
      return;
    }

    onConfirmLog({
      name: editedName.trim(),
      category: editedCategory,
      calories: parseInt(editedCalories) || 0,
      protein: parseInt(editedProtein) || 0,
      carbs: parseInt(editedCarbs) || 0,
      fat: parseInt(editedFat) || 0,
      icon: analysisResult?.icon || "restaurant",
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    handleClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Header del Modal */}
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="sparkles" size={24} color={colors.primary} />
              <Text style={[globalStyles.title, { fontSize: 20 }]}>Reconocimiento IA de Comidas</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={{ padding: 4 }}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Paso 1: Selección de Imagen */}
            {!imageUri && (
              <View style={{ alignItems: "center", paddingVertical: 20 }}>
                <View
                  style={{
                    width: 90,
                    height: 90,
                    borderRadius: 45,
                    backgroundColor: colors.primary + "20",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  <Ionicons name="camera-outline" size={48} color={colors.primary} />
                </View>

                <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.text, textAlign: "center", marginBottom: 6 }}>
                  Escanea tu plato con Inteligencia Artificial
                </Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: "center", paddingHorizontal: 20, marginBottom: 24 }}>
                  Toma una foto a tu comida y la IA estimará automáticamente sus calorías y macronutrientes.
                </Text>

                <View style={{ width: "100%", gap: 12 }}>
                  <TouchableOpacity
                    style={[globalStyles.button, { flexDirection: "row", justifyContent: "center", gap: 10, marginTop: 0 }]}
                    onPress={handlePickFromCamera}
                  >
                    <Ionicons name="camera" size={22} color={colors.background} />
                    <Text style={globalStyles.buttonText}>Tomar Foto con Cámara</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      globalStyles.card,
                      { flexDirection: "row", justifyContent: "center", gap: 10, alignItems: "center", marginTop: 0 },
                    ]}
                    onPress={handlePickFromGallery}
                  >
                    <Ionicons name="images-outline" size={22} color={colors.primary} />
                    <Text style={{ fontWeight: "bold", color: colors.primary }}>Seleccionar de la Galería</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Paso 2: Procesando con IA */}
            {imageUri && isAnalyzing && (
              <View style={{ alignItems: "center", paddingVertical: 30 }}>
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
                <Text style={{ marginTop: 12, fontWeight: "bold", color: colors.primary, fontSize: 16 }}>
                  🤖 Analizando alimento con IA...
                </Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4, textAlign: "center" }}>
                  Estimando nombre, calorías y macronutrientes...
                </Text>
              </View>
            )}

            {/* Paso 3: Resultados detectados para revisión y confirmación */}
            {imageUri && !isAnalyzing && analysisResult && (
              <View style={{ gap: 16, paddingVertical: 10 }}>
                <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                  <Image source={{ uri: imageUri }} style={styles.thumbnailImage} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "bold" }}>
                      ✨ DETECTADO POR IA
                    </Text>
                    <TextInput
                      style={[globalStyles.input, { marginTop: 4, fontWeight: "bold", fontSize: 16 }]}
                      value={editedName}
                      onChangeText={setEditedName}
                      placeholder="Nombre del alimento"
                    />
                  </View>
                </View>

                {/* Selección de Categoría */}
                <View>
                  <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 8 }}>Categoría de Comida</Text>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {CATEGORIES.map((cat) => {
                      const isSelected = editedCategory === cat;
                      return (
                        <TouchableOpacity
                          key={cat}
                          onPress={() => setEditedCategory(cat)}
                          style={{
                            flex: 1,
                            paddingVertical: 8,
                            borderRadius: 16,
                            alignItems: "center",
                            backgroundColor: isSelected ? colors.primary : colors.surface,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: "bold",
                              color: isSelected ? colors.background : colors.text,
                            }}
                          >
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Métricas Nutricionales Estimadas (Editables) */}
                <View style={{ gap: 10 }}>
                  <Text style={{ fontSize: 13, color: colors.textSecondary }}>Nutrición Estimada (Revisa o Edita)</Text>

                  {/* Calorías */}
                  <View style={[globalStyles.card, { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 0 }]}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Ionicons name="flame" size={24} color={colors.primary} />
                      <Text style={{ fontWeight: "bold", color: colors.text, fontSize: 15 }}>Calorías Estimadas</Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <TextInput
                        style={{
                          fontSize: 20,
                          fontWeight: "bold",
                          color: colors.primary,
                          textAlign: "right",
                          minWidth: 50,
                        }}
                        keyboardType="numeric"
                        value={editedCalories}
                        onChangeText={setEditedCalories}
                      />
                      <Text style={{ color: colors.textSecondary, fontWeight: "bold" }}>kcal</Text>
                    </View>
                  </View>

                  {/* Macros (Proteína, Carbs, Grasa) */}
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {/* Proteína */}
                    <View style={[globalStyles.card, { flex: 1, padding: 10, marginVertical: 0 }]}>
                      <Text style={{ fontSize: 11, color: colors.secondary, fontWeight: "bold" }}>Proteína</Text>
                      <View style={{ flexDirection: "row", alignItems: "baseline", marginTop: 4 }}>
                        <TextInput
                          style={{ fontSize: 18, fontWeight: "bold", color: colors.text, minWidth: 35 }}
                          keyboardType="numeric"
                          value={editedProtein}
                          onChangeText={setEditedProtein}
                        />
                        <Text style={{ fontSize: 12, color: colors.textSecondary }}>g</Text>
                      </View>
                    </View>

                    {/* Carbs */}
                    <View style={[globalStyles.card, { flex: 1, padding: 10, marginVertical: 0 }]}>
                      <Text style={{ fontSize: 11, color: colors.delete, fontWeight: "bold" }}>Carbs</Text>
                      <View style={{ flexDirection: "row", alignItems: "baseline", marginTop: 4 }}>
                        <TextInput
                          style={{ fontSize: 18, fontWeight: "bold", color: colors.text, minWidth: 35 }}
                          keyboardType="numeric"
                          value={editedCarbs}
                          onChangeText={setEditedCarbs}
                        />
                        <Text style={{ fontSize: 12, color: colors.textSecondary }}>g</Text>
                      </View>
                    </View>

                    {/* Grasa */}
                    <View style={[globalStyles.card, { flex: 1, padding: 10, marginVertical: 0 }]}>
                      <Text style={{ fontSize: 11, color: colors.primary, fontWeight: "bold" }}>Grasas</Text>
                      <View style={{ flexDirection: "row", alignItems: "baseline", marginTop: 4 }}>
                        <TextInput
                          style={{ fontSize: 18, fontWeight: "bold", color: colors.text, minWidth: 35 }}
                          keyboardType="numeric"
                          value={editedFat}
                          onChangeText={setEditedFat}
                        />
                        <Text style={{ fontSize: 12, color: colors.textSecondary }}>g</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Banner de Privacidad e Información */}
                <View style={{ backgroundColor: colors.surface, padding: 12, borderRadius: 10, flexDirection: "row", gap: 10, alignItems: "center" }}>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.primary} />
                  <Text style={{ fontSize: 11, color: colors.textSecondary, flex: 1, lineHeight: 15 }}>
                    La foto <Text style={{ fontWeight: "bold", color: colors.text }}>NO se guardará</Text> ni creará un elemento permanente en tu catálogo. Solo se registrará este consumo en tu total de hoy.
                  </Text>
                </View>

                {/* Botón de Confirmación */}
                <TouchableOpacity
                  style={[globalStyles.button, { marginTop: 10 }]}
                  onPress={handleConfirm}
                >
                  <Text style={globalStyles.buttonText}>✅ Confirmar y Registrar Consumo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={resetState}
                  style={{ alignItems: "center", paddingVertical: 8 }}
                >
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Escanear otra foto</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  previewImage: {
    width: 200,
    height: 160,
    borderRadius: 16,
  },
  thumbnailImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
  },
});
