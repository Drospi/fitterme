import { useTheme } from "@/context/ThemeContext";
import {
  AIConfig,
  AVAILABLE_GEMINI_MODELS,
  clearAIConfig,
  fetchAvailableGeminiModels,
  getAIConfig,
  saveAIConfig,
  testAIConnection,
} from "@/store/aiConfig";
import { getGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

export default function AIConfigScreen() {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const router = useRouter();

  type ModelOption = {
    id: string;
    name: string;
    tag?: string;
    description?: string;
  };

  const [apiKey, setApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState("gemini-3.5-flash");
  const [availableModels, setAvailableModels] = useState<ModelOption[]>(AVAILABLE_GEMINI_MODELS);
  const [isEnabled, setIsEnabled] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    workingModel?: string;
  } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const config = await getAIConfig();
    setApiKey(config.apiKey);
    const isLegacyOrRetired =
      !config.model ||
      config.model.startsWith("gemini-1.") ||
      config.model.startsWith("gemini-2.0") ||
      config.model === "gemini-2.5-flash";
    const effectiveModel = isLegacyOrRetired ? "gemini-3.5-flash" : config.model;
    setSelectedModel(effectiveModel);
    setIsEnabled(config.isEnabled);

    if (config.apiKey && config.apiKey.trim().length > 0) {
      fetchAvailableGeminiModels(config.apiKey).then((models) => {
        if (models && models.length > 0) {
          setAvailableModels(models);
        }
      });
    }
  };

  const handlePaste = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const text = await Clipboard.getStringAsync();
    if (text) {
      setApiKey(text.trim());
      Toast.show({
        type: "info",
        text1: "Clave Pegada",
        text2: "API Key pegada desde el portapapeles.",
      });
    }
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      Toast.show({
        type: "error",
        text1: "API Key Requerida",
        text2: "Por favor ingresa una API Key para probar la conexión.",
      });
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsTesting(true);
    setTestResult(null);

    const result = await testAIConnection(apiKey, selectedModel);
    setIsTesting(false);
    setTestResult(result);

    if (result.workingModel) {
      setSelectedModel(result.workingModel);
    }

    fetchAvailableGeminiModels(apiKey).then((models) => {
      if (models && models.length > 0) {
        setAvailableModels(models);
      }
    });

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: "success",
        text1: "¡Conexión Exitosa!",
        text2: result.workingModel && result.workingModel !== selectedModel
          ? `Conectado y configurado automáticamente con ${result.workingModel}.`
          : "La API Key de Gemini funciona correctamente.",
      });
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: "error",
        text1: "Error de Conexión",
        text2: result.message,
      });
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      Alert.alert(
        "API Key Vacía",
        "Si guardas sin una API Key, las funciones de IA permanecerán deshabilitadas. ¿Deseas continuar?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Desactivar IA",
            style: "destructive",
            onPress: async () => {
              await clearAIConfig();
              setApiKey("");
              setIsEnabled(false);
              setTestResult(null);
              Toast.show({
                type: "info",
                text1: "IA Deshabilitada",
                text2: "Las opciones de IA han sido ocultadas.",
              });
            },
          },
        ]
      );
      return;
    }

    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    await saveAIConfig({
      apiKey: apiKey.trim(),
      model: selectedModel,
      isEnabled: true,
      provider: "gemini",
      lastTestedAt: new Date().toISOString(),
    });

    setIsEnabled(true);
    setIsSaving(false);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Toast.show({
      type: "success",
      text1: "Configuración Guardada",
      text2: "Las funciones de IA han sido activadas exitosamente.",
    });
  };

  const handleClear = async () => {
    Alert.alert(
      "Desactivar y Eliminar API Key",
      "¿Estás seguro de eliminar tu API Key? Las opciones de escaneo de alimentos y generación de rutinas por IA se deshabilitarán.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            await clearAIConfig();
            setApiKey("");
            setIsEnabled(false);
            setTestResult(null);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Toast.show({
              type: "info",
              text1: "API Key Eliminada",
              text2: "Las funciones de IA han sido deshabilitadas.",
            });
          },
        },
      ]
    );
  };

  const isConfigured = isEnabled && apiKey.trim().length > 0;

  return (
    <View style={globalStyles.container}>
      {/* Header */}
      <View style={globalStyles.header}>
        <Ionicons
          onPress={() => router.back()}
          name="arrow-back"
          size={24}
          color={colors.text}
        />
        <Text style={globalStyles.title}>Configuración de IA</Text>
        <Ionicons name="sparkles" size={24} color={colors.primary} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Tarjeta de Estado Actual */}
        <View
          style={[
            globalStyles.card,
            {
              marginTop: 15,
              borderColor: isConfigured ? colors.primary + "60" : colors.textSecondary + "30",
              borderWidth: 1.5,
              gap: 10,
            },
          ]}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: isConfigured ? colors.primary + "20" : colors.textSecondary + "20",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name={isConfigured ? "checkmark-circle" : "alert-circle"}
                  size={22}
                  color={isConfigured ? colors.primary : colors.textSecondary}
                />
              </View>
              <View>
                <Text style={{ fontWeight: "bold", fontSize: 16, color: colors.text }}>
                  Estado de la IA
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                  {isConfigured
                    ? "Funciones activas y conectadas"
                    : "Deshabilitada (Requiere API Key)"}
                </Text>
              </View>
            </View>

            <View
              style={{
                backgroundColor: isConfigured ? colors.primary : colors.surface,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: isConfigured ? colors.primary : colors.textSecondary + "40",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "bold",
                  color: isConfigured ? colors.background : colors.textSecondary,
                }}
              >
                {isConfigured ? "ACTIVO" : "INACTIVO"}
              </Text>
            </View>
          </View>

          <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 16 }}>
            {isConfigured
              ? "Las herramientas de escaneo nutricional por imagen y el generador de rutinas por sobrecarga progresiva están disponibles en la aplicación."
              : "Las opciones de IA permanecerán ocultas en las pestañas de Comidas y Rutinas hasta que ingreses y guardes tu API Key."}
          </Text>
        </View>

        {/* Formulario de API Key */}
        <View style={{ marginTop: 20 }}>
          <Text
            style={{
              fontWeight: "bold",
              fontSize: 17,
              color: colors.primary,
              marginBottom: 10,
            }}
          >
            GOOGLE GEMINI API KEY
          </Text>

          <View style={[globalStyles.card, { gap: 14 }]}>
            <Text style={{ fontSize: 13, color: colors.textSecondary }}>
              Ingresa tu clave de Google Gemini para habilitar el procesamiento inteligente:
            </Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.background,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.textSecondary + "30",
                paddingHorizontal: 12,
              }}
            >
              <Ionicons name="key-outline" size={20} color={colors.primary} />
              <TextInput
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 10,
                  color: colors.text,
                  fontSize: 14,
                }}
                placeholder="AIzaSy..."
                placeholderTextColor={colors.textSecondary + "80"}
                value={apiKey}
                onChangeText={(t) => {
                  setApiKey(t);
                  setTestResult(null);
                }}
                secureTextEntry={!showKey}
                autoCapitalize="none"
                autoCorrect={false}
              />

              {apiKey.length > 0 && (
                <TouchableOpacity onPress={() => setShowKey(!showKey)} style={{ padding: 6 }}>
                  <Ionicons
                    name={showKey ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={handlePaste} style={{ padding: 6 }}>
                <Ionicons name="clipboard-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Resultado de la prueba si existe */}
            {testResult && (
              <View
                style={{
                  padding: 10,
                  borderRadius: 10,
                  backgroundColor: testResult.success ? colors.primary + "15" : colors.delete + "15",
                  borderWidth: 1,
                  borderColor: testResult.success ? colors.primary : colors.delete,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Ionicons
                  name={testResult.success ? "checkmark-circle" : "close-circle"}
                  size={20}
                  color={testResult.success ? colors.primary : colors.delete}
                />
                <Text
                  style={{
                    fontSize: 12,
                    color: testResult.success ? colors.primary : colors.delete,
                    flex: 1,
                    fontWeight: "600",
                  }}
                >
                  {testResult.message}
                </Text>
              </View>
            )}

            {/* Botón de Probar Conexión */}
            <TouchableOpacity
              style={[
                globalStyles.card,
                {
                  marginTop: 4,
                  marginVertical: 0,
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 8,
                  backgroundColor: colors.surface,
                  borderColor: colors.primary + "50",
                  borderWidth: 1,
                  paddingVertical: 10,
                },
              ]}
              onPress={handleTestConnection}
              disabled={isTesting}
            >
              {isTesting ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="flash-outline" size={18} color={colors.primary} />
              )}
              <Text style={{ fontWeight: "bold", color: colors.primary, fontSize: 13 }}>
                {isTesting ? "Verificando API..." : "Probar Conexión con Gemini"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Selector de Modelo */}
        <View style={{ marginTop: 20 }}>
          <Text
            style={{
              fontWeight: "bold",
              fontSize: 17,
              color: colors.primary,
              marginBottom: 10,
            }}
          >
            MODELO DE INTELIGENCIA ARTIFICIAL
          </Text>

          <View style={[globalStyles.card, { gap: 10 }]}>
            {availableModels.map((model) => {
              const isSelected = selectedModel === model.id;
              return (
                <TouchableOpacity
                  key={model.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedModel(model.id);
                    setTestResult(null);
                  }}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: colors.background,
                    borderWidth: 1.5,
                    borderColor: isSelected ? colors.primary : colors.textSecondary + "20",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 }}>
                      <Text
                        style={{
                          fontWeight: "bold",
                          fontSize: 14,
                          color: isSelected ? colors.primary : colors.text,
                        }}
                      >
                        {model.name}
                      </Text>
                      <View
                        style={{
                          backgroundColor: isSelected ? colors.primary + "20" : colors.surface,
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 6,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: "bold",
                            color: isSelected ? colors.primary : colors.textSecondary,
                          }}
                        >
                          {model.tag}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                      {model.description}
                    </Text>
                  </View>

                  <Ionicons
                    name={isSelected ? "radio-button-on" : "radio-button-off"}
                    size={20}
                    color={isSelected ? colors.primary : colors.textSecondary}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Botones Principales de Guardar / Borrar */}
        <View style={{ marginTop: 24, gap: 10 }}>
          <TouchableOpacity
            style={[
              globalStyles.button,
              {
                marginTop: 0,
                backgroundColor: colors.primary,
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
              },
            ]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <Ionicons name="save" size={20} color={colors.background} />
            )}
            <Text style={globalStyles.buttonText}>
              {isSaving ? "Guardando..." : "Guardar y Activar Opciones de IA"}
            </Text>
          </TouchableOpacity>

          {isConfigured && (
            <TouchableOpacity
              style={[
                globalStyles.card,
                {
                  marginVertical: 0,
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 8,
                  backgroundColor: colors.surface,
                  borderColor: colors.delete + "50",
                  borderWidth: 1,
                  paddingVertical: 12,
                },
              ]}
              onPress={handleClear}
            >
              <Ionicons name="trash-outline" size={18} color={colors.delete} />
              <Text style={{ fontWeight: "bold", color: colors.delete, fontSize: 14 }}>
                Desactivar y Eliminar API Key
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tutorial / Guía: Cómo obtener tu API Key */}
        <View
          style={[
            globalStyles.card,
            {
              marginTop: 24,
              backgroundColor: colors.surface,
              borderColor: colors.primary + "30",
              borderWidth: 1,
              gap: 12,
            },
          ]}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="help-circle-outline" size={22} color={colors.primary} />
            <Text style={{ fontWeight: "bold", fontSize: 15, color: colors.text }}>
              ¿Cómo obtener tu API Key Gratuita?
            </Text>
          </View>

          <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 18 }}>
            Google ofrece acceso gratuito a Gemini con límites amplios para uso personal:
          </Text>

          <View style={{ gap: 8 }}>
            {[
              "1. Ingresa en tu navegador a: aistudio.google.com",
              "2. Inicia sesión con tu cuenta de Google.",
              "3. Haz clic en el botón 'Create API key'.",
              "4. Copia tu clave generada y pégala en esta pantalla.",
            ].map((step, idx) => (
              <View key={idx} style={{ flexDirection: "row", gap: 6 }}>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>{step}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({});
