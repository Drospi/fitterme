import AsyncStorage from "@react-native-async-storage/async-storage";

export type AIProvider = "gemini" | "openai" | "custom";

export type AIConfig = {
  apiKey: string;
  provider: AIProvider;
  model: string;
  isEnabled: boolean;
  lastTestedAt?: string;
};

const AI_CONFIG_KEY = "@fitterme_ai_config_v1";

export const DEFAULT_AI_CONFIG: AIConfig = {
  apiKey: "",
  provider: "gemini",
  model: "gemini-3.5-flash",
  isEnabled: false,
};

export const AVAILABLE_GEMINI_MODELS = [
  {
    id: "gemini-3.5-flash",
    name: "Gemini 3.5 Flash",
    tag: "Recomendado",
    description: "Modelo oficial de alto rendimiento, rápido y optimizado para visión y texto.",
  },
  {
    id: "gemini-3.6-flash",
    name: "Gemini 3.6 Flash",
    tag: "Avanzado",
    description: "Alta precisión, velocidad y análisis multimodal para comidas y rutinas.",
  },
  {
    id: "gemini-3.7-flash",
    name: "Gemini 3.7 Flash",
    tag: "Potente",
    description: "Mayor capacidad de razonamiento y comprensión contextual.",
  },
  {
    id: "gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
    tag: "Última Generación",
    description: "La versión más avanzada y actualizada de la familia Gemini Flash.",
  },
];

/**
 * Obtiene la configuración guardada de IA
 */
export const getAIConfig = async (): Promise<AIConfig> => {
  try {
    const raw = await AsyncStorage.getItem(AI_CONFIG_KEY);
    if (!raw) return DEFAULT_AI_CONFIG;
    const parsed = JSON.parse(raw);
    const isLegacyOrRetired =
      !parsed.model ||
      parsed.model.startsWith("gemini-1.") ||
      parsed.model.startsWith("gemini-2.0") ||
      parsed.model === "gemini-2.5-flash";
    const savedModel = isLegacyOrRetired ? "gemini-3.5-flash" : parsed.model;
    return {
      apiKey: parsed.apiKey || "",
      provider: parsed.provider || "gemini",
      model: savedModel,
      isEnabled: Boolean(parsed.isEnabled),
      lastTestedAt: parsed.lastTestedAt,
    };
  } catch (error) {
    console.error("Error al obtener configuración de IA:", error);
    return DEFAULT_AI_CONFIG;
  }
};

/**
 * Guarda la configuración de IA
 */
export const saveAIConfig = async (config: Partial<AIConfig>): Promise<AIConfig> => {
  try {
    const current = await getAIConfig();
    const updated: AIConfig = {
      ...current,
      ...config,
      provider: "gemini",
    };
    await AsyncStorage.setItem(AI_CONFIG_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error("Error al guardar configuración de IA:", error);
    return DEFAULT_AI_CONFIG;
  }
};

/**
 * Retorna true si la IA tiene una API Key configurada y está habilitada
 */
export const isAIConfigured = async (): Promise<boolean> => {
  try {
    const config = await getAIConfig();
    return Boolean(config.isEnabled && config.apiKey && config.apiKey.trim().length > 0);
  } catch {
    return false;
  }
};

/**
 * Limpia y desactiva la configuración de IA
 */
export const clearAIConfig = async (): Promise<AIConfig> => {
  try {
    await AsyncStorage.removeItem(AI_CONFIG_KEY);
    return DEFAULT_AI_CONFIG;
  } catch (error) {
    console.error("Error al limpiar configuración de IA:", error);
    return DEFAULT_AI_CONFIG;
  }
};

/**
 * Consulta los modelos activos con soporte generateContent disponibles para la API Key
 * utilizando directamente el endpoint ModelService.ListModels de Google Gemini.
 */
export const fetchAvailableGeminiModels = async (
  apiKey: string
): Promise<Array<{ id: string; name: string; tag?: string; description?: string }>> => {
  const trimmedKey = apiKey.trim();
  if (!trimmedKey) return AVAILABLE_GEMINI_MODELS;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${trimmedKey}`
    );
    if (!response.ok) return AVAILABLE_GEMINI_MODELS;
    const data = await response.json();
    if (!data.models || !Array.isArray(data.models)) return AVAILABLE_GEMINI_MODELS;

    const supported = data.models.filter(
      (m: any) =>
        Array.isArray(m.supportedGenerationMethods) &&
        m.supportedGenerationMethods.includes("generateContent")
    );

    if (supported.length === 0) return AVAILABLE_GEMINI_MODELS;

    // Priorizar modelos más útiles para la app (flash, luego pro, luego otros)
    return supported
      .map((m: any) => {
        const cleanId = m.name.replace(/^models\//, "");
        const isRecommended = cleanId === "gemini-3.5-flash";
        const isAdvanced = cleanId.includes("3.6") || cleanId.includes("3.7") || cleanId.includes("3.8");
        return {
          id: cleanId,
          name: m.displayName || cleanId,
          tag: isRecommended ? "Recomendado" : isAdvanced ? "Avanzado" : undefined,
          description: m.description || `Modelo ${cleanId} con soporte para generateContent.`,
        };
      })
      .sort((a: any, b: any) => {
        if (a.id === "gemini-3.5-flash") return -1;
        if (b.id === "gemini-3.5-flash") return 1;
        if (a.id.includes("3.") && !b.id.includes("3.")) return -1;
        if (!a.id.includes("3.") && b.id.includes("3.")) return 1;
        return a.id.localeCompare(b.id);
      });
  } catch (error) {
    console.warn("Error al consultar lista de modelos de Gemini:", error);
    return AVAILABLE_GEMINI_MODELS;
  }
};

/**
 * Prueba la conexión con la API de Google Gemini utilizando la API Key proporcionada.
 * Consulta primero ModelService.ListModels para descubrir los modelos reales habilitados
 * para la cuenta y selecciona automáticamente el mejor disponible.
 */
export const testAIConnection = async (
  apiKey: string,
  model: string = "gemini-3.5-flash"
): Promise<{ success: boolean; message: string; workingModel?: string; availableModels?: Array<{ id: string; name: string; tag?: string; description?: string }> }> => {
  const trimmedKey = apiKey.trim();
  if (!trimmedKey) {
    return {
      success: false,
      message: "Ingresa una API Key válida antes de realizar la prueba.",
    };
  }

  try {
    // 1. Consultar ModelService.ListModels para validar la clave y ver qué modelos admite
    const listResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${trimmedKey}`
    );

    if (!listResponse.ok) {
      const errData = await listResponse.json().catch(() => null);
      const rawMsg = errData?.error?.message || "";
      if (
        listResponse.status === 400 ||
        listResponse.status === 403 ||
        rawMsg.toLowerCase().includes("api key not valid")
      ) {
        return {
          success: false,
          message: "La API Key no es válida. Cópiala directamente desde Google AI Studio (aistudio.google.com).",
        };
      }
      return {
        success: false,
        message: rawMsg || `Error al conectar con Google Gemini (HTTP ${listResponse.status}).`,
      };
    }

    const listData = await listResponse.json();
    const rawModels: any[] = listData.models || [];
    const supported = rawModels
      .filter(
        (m) =>
          Array.isArray(m.supportedGenerationMethods) &&
          m.supportedGenerationMethods.includes("generateContent")
      )
      .map((m) => m.name.replace(/^models\//, ""));

    if (supported.length === 0) {
      return {
        success: false,
        message: "Tu clave es válida, pero tu proyecto de Google Cloud no tiene modelos con 'generateContent' habilitados.",
      };
    }

    // 2. Determinar el mejor modelo a usar
    let targetModel = model && supported.includes(model) ? model : "";

    if (!targetModel) {
      targetModel =
        supported.find((m) => m === "gemini-3.5-flash") ||
        supported.find((m) => m === "gemini-3.6-flash") ||
        supported.find((m) => m === "gemini-3.7-flash") ||
        supported.find((m) => m === "gemini-3.8-flash") ||
        supported.find((m) => m.includes("flash") && !m.includes("tts")) ||
        supported[0];
    }

    // Probar candidatos comenzando por targetModel
    const candidatesToTry = Array.from(new Set([targetModel, ...supported]));
    let lastError = "";

    for (const candidate of candidatesToTry) {
      try {
        const testResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${candidate}:generateContent?key=${trimmedKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: "Responde únicamente: OK" }] }],
            }),
          }
        );

        if (testResponse.ok) {
          const testData = await testResponse.json();
          const reply = testData.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (reply) {
            await saveAIConfig({ model: candidate, isEnabled: true });
            const wasAutoSelected = model && candidate !== model;
            return {
              success: true,
              message: wasAutoSelected
                ? `¡Conexión exitosa! El modelo '${model}' no estaba disponible en tu cuenta, por lo que se configuró automáticamente '${candidate}'.`
                : `¡Conexión exitosa! El modelo '${candidate}' funciona perfectamente.`,
              workingModel: candidate,
            };
          }
        } else {
          const errData = await testResponse.json().catch(() => null);
          lastError = errData?.error?.message || `HTTP ${testResponse.status}`;
        }
      } catch (e: any) {
        lastError = e?.message || "Error de red";
      }
    }

    return {
      success: false,
      message: lastError || "No se pudo generar respuesta con los modelos disponibles.",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || "Error al conectar con los servidores de Google Gemini.",
    };
  }
};
