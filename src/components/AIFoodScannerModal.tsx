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
  Switch,
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
    saveToCatalog: boolean;
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

  // Valores base originales reconocidos por la IA para cálculo de multiplicador
  const [baseMetrics, setBaseMetrics] = useState<{
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    weight: number;
  }>({ calories: 0, protein: 0, carbs: 0, fat: 0, weight: 0 });

  const [portionMultiplier, setPortionMultiplier] = useState<number>(1.0);

  // Campos editables tras el análisis de IA
  const [editedName, setEditedName] = useState("");
  const [editedCategory, setEditedCategory] = useState<MealCategory>("Almuerzo");
  const [editedCalories, setEditedCalories] = useState("");
  const [editedProtein, setEditedProtein] = useState("");
  const [editedCarbs, setEditedCarbs] = useState("");
  const [editedFat, setEditedFat] = useState("");
  const [saveToCatalog, setSaveToCatalog] = useState(false);

  const resetState = () => {
    setImageUri(null);
    setIsAnalyzing(false);
    setAnalysisResult(null);
    setBaseMetrics({ calories: 0, protein: 0, carbs: 0, fat: 0, weight: 0 });
    setPortionMultiplier(1.0);
    setEditedName("");
    setEditedCategory("Almuerzo");
    setEditedCalories("");
    setEditedProtein("");
    setEditedCarbs("");
    setEditedFat("");
    setSaveToCatalog(false);
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

      setBaseMetrics({
        calories: result.calories,
        protein: result.protein,
        carbs: result.carbs,
        fat: result.fat,
        weight: result.estimatedWeightGrams || 350,
      });
      setPortionMultiplier(1.0);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      alert("Error al analizar la imagen. Inténtalo de nuevo.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyMultiplier = (mult: number) => {
    setPortionMultiplier(mult);
    Haptics.selectionAsync();
    setEditedCalories(Math.round(baseMetrics.calories * mult).toString());
    setEditedProtein(Math.round(baseMetrics.protein * mult).toString());
    setEditedCarbs(Math.round(baseMetrics.carbs * mult).toString());
    setEditedFat(Math.round(baseMetrics.fat * mult).toString());
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
      saveToCatalog,
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
                  La IA analiza el tamaño de la porción y las proporciones reales del plato para calcular calorías y macronutrientes precisos.
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
                  🤖 Dimensionando porción e ingredientes...
                </Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4, textAlign: "center" }}>
                  Estimando dimensiones del plato, peso en gramos y macronutrientes proporcionales...
                </Text>
              </View>
            )}

            {/* Paso 3: Resultados detectados para revisión y confirmación */}
            {imageUri && !isAnalyzing && analysisResult && (
              <View style={{ gap: 16, paddingVertical: 10 }}>
                {/* Cabecera del Alimento Reconocido */}
                <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                  <Image source={{ uri: imageUri }} style={styles.thumbnailImage} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "bold" }}>
                        ✨ DETECTADO POR IA
                      </Text>
                      {analysisResult.portionSize && (
                        <View style={{ backgroundColor: colors.primary + "20", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                          <Text style={{ fontSize: 10, fontWeight: "bold", color: colors.primary, textTransform: "capitalize" }}>
                            Porción {analysisResult.portionSize} (~{Math.round(baseMetrics.weight * portionMultiplier)}g)
                          </Text>
                        </View>
                      )}
                    </View>
                    <TextInput
                      style={[globalStyles.input, { marginTop: 2, fontWeight: "bold", fontSize: 15 }]}
                      value={editedName}
                      onChangeText={setEditedName}
                      placeholder="Nombre del alimento"
                    />
                  </View>
                </View>

                {/* Desglose visual de ingredientes */}
                {analysisResult.portionBreakdown && (
                  <View style={{ backgroundColor: colors.surface, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.cardBorder || "rgba(255,255,255,0.06)" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <Ionicons name="scale-outline" size={15} color={colors.primary} />
                      <Text style={{ fontSize: 12, fontWeight: "bold", color: colors.text }}>
                        Estimación de peso e ingredientes:
                      </Text>
                    </View>
                    <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 16 }}>
                      {analysisResult.portionBreakdown}
                    </Text>
                  </View>
                )}

                {/* Ajuste rápido de escala de porción */}
                <View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: "600" }}>
                      ¿El tamaño no coincide con lo que comiste? Ajusta la porción:
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: 6 }}>
                    {[
                      { label: "0.7x (Chica)", mult: 0.7 },
                      { label: "1.0x (Normal)", mult: 1.0 },
                      { label: "1.3x (Grande)", mult: 1.3 },
                      { label: "1.5x (Extra)", mult: 1.5 },
                    ].map((item) => {
                      const isSelected = portionMultiplier === item.mult;
                      return (
                        <TouchableOpacity
                          key={item.label}
                          onPress={() => applyMultiplier(item.mult)}
                          style={{
                            flex: 1,
                            paddingVertical: 7,
                            borderRadius: 10,
                            alignItems: "center",
                            backgroundColor: isSelected ? colors.primary : colors.surface,
                            borderWidth: 1,
                            borderColor: isSelected ? colors.primary : colors.cardBorder || "rgba(255,255,255,0.06)",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: "bold",
                              color: isSelected ? colors.background : colors.text,
                            }}
                          >
                            {item.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Selección de Categoría */}
                <View>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 6, fontWeight: "600" }}>Categoría de Comida</Text>
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
                            borderRadius: 14,
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
                <View style={{ gap: 8 }}>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: "600" }}>Nutrición Calculada (Revisa o Edita)</Text>

                  {/* Calorías */}
                  <View style={[globalStyles.card, { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 0, padding: 12 }]}>
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
                          minWidth: 55,
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

                {/* Opción de Guardado Permanente en Catálogo */}
                <View
                  style={{
                    backgroundColor: colors.surface,
                    padding: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: saveToCatalog ? colors.primary : colors.cardBorder || "rgba(255,255,255,0.06)",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <Ionicons name="bookmark-outline" size={16} color={colors.primary} />
                      <Text style={{ fontSize: 13, fontWeight: "bold", color: colors.text }}>
                        Guardar en mi Catálogo de Comidas
                      </Text>
                    </View>
                    <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                      Permite volver a registrar este plato en el futuro con un solo tap desde tu lista.
                    </Text>
                  </View>
                  <Switch
                    value={saveToCatalog}
                    onValueChange={(val) => {
                      Haptics.selectionAsync();
                      setSaveToCatalog(val);
                    }}
                    trackColor={{ false: colors.background, true: colors.primary }}
                    thumbColor={colors.background}
                  />
                </View>

                {/* Banner de Confirmación y Registro */}
                <View style={{ backgroundColor: colors.primary + "12", padding: 10, borderRadius: 10, flexDirection: "row", gap: 8, alignItems: "center" }}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                  <Text style={{ fontSize: 11, color: colors.text, flex: 1, lineHeight: 15 }}>
                    Al confirmar, <Text style={{ fontWeight: "bold" }}>se guardará en tu registro de hoy y en tus estadísticas nutricionales</Text>.
                  </Text>
                </View>

                {/* Botón de Confirmación */}
                <TouchableOpacity
                  style={[globalStyles.button, { marginTop: 4 }]}
                  onPress={handleConfirm}
                >
                  <Text style={globalStyles.buttonText}>
                    {saveToCatalog ? "💾 Guardar en Catálogo y Registrar Consumo" : "✅ Confirmar y Registrar Consumo"}
                  </Text>
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
    maxHeight: "88%",
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
    width: 65,
    height: 65,
    borderRadius: 12,
  },
});
