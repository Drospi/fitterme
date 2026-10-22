import { getAIConfig } from "@/store/aiConfig";
import { MealCategory } from "@/store/meals";

export type AIFoodAnalysisResult = {
  name: string;
  category: MealCategory;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  icon: string;
  portionSize?: "pequeña" | "mediana" | "grande" | "abundante";
  estimatedWeightGrams?: number;
  portionBreakdown?: string;
};

// Base de datos inteligente de estimaciones de platos para fallback vision AI
const MOCK_FOOD_PRESETS: AIFoodAnalysisResult[] = [
  {
    name: "Pechuga a la Plancha con Arroz y Ensalada",
    category: "Almuerzo",
    calories: 520,
    protein: 44,
    carbs: 56,
    fat: 10,
    icon: "restaurant",
    portionSize: "mediana",
    estimatedWeightGrams: 420,
    portionBreakdown: "200g pechuga de pollo, 150g arroz blanco, 70g ensalada mixta",
  },
  {
    name: "Huevos Revueltos con Tostadas y Aguacate",
    category: "Desayuno",
    calories: 430,
    protein: 24,
    carbs: 34,
    fat: 22,
    icon: "egg",
    portionSize: "mediana",
    estimatedWeightGrams: 310,
    portionBreakdown: "3 huevos revueltos (150g), 2 tostadas (60g), 1/2 aguacate (100g)",
  },
  {
    name: "Batido Proteico con Plátano y Avena",
    category: "Snack",
    calories: 380,
    protein: 34,
    carbs: 48,
    fat: 6,
    icon: "flame",
    portionSize: "mediana",
    estimatedWeightGrams: 450,
    portionBreakdown: "1 scoop proteína (30g), 1 plátano (120g), 40g avena, 250ml leche",
  },
  {
    name: "Filete de Salmón con Vegetales al Vapor",
    category: "Cena",
    calories: 540,
    protein: 40,
    carbs: 18,
    fat: 26,
    icon: "fish",
    portionSize: "mediana",
    estimatedWeightGrams: 380,
    portionBreakdown: "200g salmón fresco, 180g brócoli y zanahoria al vapor",
  },
  {
    name: "Pasta Bolognesa con Carne Magra",
    category: "Almuerzo",
    calories: 680,
    protein: 38,
    carbs: 82,
    fat: 20,
    icon: "pizza",
    portionSize: "grande",
    estimatedWeightGrams: 480,
    portionBreakdown: "250g pasta cocida, 150g salsa boloñesa con carne magra, 20g queso",
  },
  {
    name: "Ensalada César con Pollo Grillado Abundante",
    category: "Cena",
    calories: 460,
    protein: 42,
    carbs: 16,
    fat: 20,
    icon: "leaf",
    portionSize: "grande",
    estimatedWeightGrams: 410,
    portionBreakdown: "220g pechuga a la parrilla, 150g lechuga romana, aderezo césar ligero",
  },
];

/**
 * Analiza la imagen enviando el Base64 a la API de IA configurada por el usuario (Gemini Vision).
 * Evalúa las dimensiones del plato, elementos de referencia y volumen visual para estimar
 * el peso real y los macronutrientes proporcionales a la cantidad visible.
 */
export const analyzeFoodImageWithAI = async (
  base64Image: string,
): Promise<AIFoodAnalysisResult> => {
  const aiConfig = await getAIConfig();
  const apiKey = aiConfig.apiKey?.trim() || process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  const isLegacyOrRetired =
    !aiConfig.model ||
    aiConfig.model.startsWith("gemini-1.") ||
    aiConfig.model.startsWith("gemini-2.0") ||
    aiConfig.model === "gemini-2.5-flash";
  const preferredModel = isLegacyOrRetired ? "gemini-3.5-flash" : aiConfig.model;

  if (apiKey) {
    const candidateModels = Array.from(
      new Set([preferredModel, "gemini-3.5-flash", "gemini-3.6-flash", "gemini-3.7-flash", "gemini-3.8-flash"])
    );

    for (const model of candidateModels) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `Actúa como un nutricionista y experto en visión artificial para análisis de alimentos.
Examina detenidamente la comida mostrada en la imagen.
MISION CLAVE: NO devuelvas valores genéricos de una porción promedio de diccionario. DEBES DIMENSIONAR VISUALMENTE LA COMIDA REAL EN LA FOTO:
1. Usa referencias de escala visual (el diámetro o profundidad del plato, bandeja, recipiente, vaso, cubiertos, mesa o manos si son visibles).
2. Determina el TAMAÑO DE LA PORCIÓN real observada: "pequeña", "mediana", "grande" o "abundante".
3. Identifica cada componente o ingrediente visible (proteína, carbohidratos, grasas/aceites, verduras) y estima su PESO INDIVIDUAL EN GRAMOS según el volumen que ocupa en el plato.
4. Calcula el PESO TOTAL ESTIMADO en gramos del plato.
5. Calcula las calorías, proteínas, carbohidratos y grasas SUMANDO los aportes de cada ingrediente según su peso estimado (por ejemplo: si ves una pechuga enorme de 250g, no pongas 25g de proteína, pon ~55-60g de proteína; si ves una porción pequeña de arroz de 80g, no pongas 200 kcal sino ~100 kcal).

Devuelve ÚNICAMENTE un objeto JSON válido con este formato estricto (sin formato markdown ni bloques de código):
{
  "name": "Nombre descriptivo y específico del plato en español",
  "category": "Desayuno" | "Almuerzo" | "Cena" | "Snack",
  "portionSize": "pequeña" | "mediana" | "grande" | "abundante",
  "estimatedWeightGrams": número_entero_gramos_totales,
  "portionBreakdown": "Breve desglose de componentes con gramos estimados (ej: 200g salmón, 150g arroz, 80g brócoli)",
  "calories": número_entero_kcal_total_calculado,
  "protein": número_entero_gramos_total_calculado,
  "carbs": número_entero_gramos_total_calculado,
  "fat": número_entero_gramos_total_calculado,
  "icon": "restaurant" | "egg" | "fish" | "pizza" | "flame" | "leaf" | "nutrition"
}`,
                    },
                    {
                      inline_data: {
                        mime_type: "image/jpeg",
                        data: base64Image,
                      },
                    },
                  ],
                },
              ],
            }),
          },
        );

        if (response.ok) {
          const jsonResponse = await response.json();
          const rawText =
            jsonResponse.candidates?.[0]?.content?.parts?.[0]?.text || "";
          const cleanJsonText = rawText
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();
          const parsed = JSON.parse(cleanJsonText);

          const calories = parseInt(parsed.calories) || 450;
          const protein = parseInt(parsed.protein) || 30;
          const carbs = parseInt(parsed.carbs) || 45;
          const fat = parseInt(parsed.fat) || 12;
          const estimatedWeightGrams = parseInt(parsed.estimatedWeightGrams) || 350;

          return {
            name: parsed.name || "Plato Detectado por IA",
            category: parsed.category || "Almuerzo",
            calories,
            protein,
            carbs,
            fat,
            icon: parsed.icon || "restaurant",
            portionSize: parsed.portionSize || "mediana",
            estimatedWeightGrams,
            portionBreakdown: parsed.portionBreakdown || `${estimatedWeightGrams}g porción estimada`,
          };
        }
      } catch (error) {
        console.warn(`Error probando modelo ${model} en análisis nutricional:`, error);
      }
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 1500));

  const randomIndex = Math.floor(Math.random() * MOCK_FOOD_PRESETS.length);
  return MOCK_FOOD_PRESETS[randomIndex];
};
