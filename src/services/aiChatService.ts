import { getAIConfig } from "@/store/aiConfig";
import { getSettings, toDisplayWeight } from "@/store/conf";
import { ExerciseCatalogItem, getAllExercises } from "@/store/excercise";
import { DEFAULT_GOAL, getLatestGoal, Goals } from "@/store/goals";
import {
  calculate1RM,
  ExerciseHistory,
  getExerciseHistory,
} from "@/store/historyExcercise";
import { getRoutineSessions, RoutineSession } from "@/store/historyRoutine";
import { ConsumedMeal, DailyMealLog, getTodayMealLog } from "@/store/meals";
import {
  getLatestSanitizedMeasure,
  getSanitizedMeasuresSummary,
  Measure,
} from "@/store/measures";
import { getUserProfile, UserProfile } from "@/store/userProfile";

export type MentionType =
  | "muscle"
  | "exercise"
  | "biometric"
  | "goal"
  | "nutrition"
  | "general";

export type MentionItem = {
  id: string;
  type: MentionType;
  label: string;
  tag: string;
  description: string;
  icon: string;
  keywords: string[];
};

export type ChatMessage = {
  id: string;
  sender: "user" | "assistant" | "system";
  text: string;
  timestamp: string;
  isError?: boolean;
};

/**
 * Obtiene la lista completa de opciones mencionables con @ para el autocompletado en el chat.
 */
export const getAvailableMentionItems = async (): Promise<MentionItem[]> => {
  const items: MentionItem[] = [];

  // 1. Grupos Musculares
  const muscles = [
    { name: "Pecho", id: "pecho", desc: "Medidas, ejercicios y PRs de pectoral", icon: "body-outline", kw: ["pecho", "chest", "pectoral"] },
    { name: "Bíceps", id: "biceps", desc: "Medidas de brazos y curls de bíceps", icon: "barbell-outline", kw: ["biceps", "brazos", "arms", "brazo"] },
    { name: "Tríceps", id: "triceps", desc: "Ejercicios de empuje y extensión de tríceps", icon: "barbell-outline", kw: ["triceps", "brazos", "arms"] },
    { name: "Espalda", id: "espalda", desc: "Medidas de dorsal, remos y jalones", icon: "body-outline", kw: ["espalda", "back", "dorsales", "trapecio"] },
    { name: "Hombros", id: "hombros", desc: "Medidas de deltoides y presses militares", icon: "body-outline", kw: ["hombros", "shoulders", "deltoides"] },
    { name: "Cuádriceps", id: "cuadriceps", desc: "Medidas de piernas, sentadillas y prensas", icon: "walk-outline", kw: ["cuadriceps", "piernas", "legs", "muslos"] },
    { name: "Gemelos", id: "gemelos", desc: "Medidas y elevaciones de pantorrilla", icon: "walk-outline", kw: ["gemelos", "calves", "pantorrillas"] },
    { name: "Glúteos", id: "gluteos", desc: "Medidas de cadera, hip thrust y glúteos", icon: "body-outline", kw: ["gluteos", "cadera", "glutes"] },
    { name: "Cintura", id: "cintura", desc: "Medida de cintura, abdomen y core", icon: "fitness-outline", kw: ["cintura", "abdomen", "core", "abs"] },
    { name: "Antebrazo", id: "antebrazo", desc: "Medidas y fuerza de agarre", icon: "hand-left-outline", kw: ["antebrazo", "forearm", "agarre"] },
    { name: "Cuello", id: "cuello", desc: "Medida de cuello para cálculo de grasa", icon: "body-outline", kw: ["cuello", "neck"] },
  ];

  muscles.forEach((m) => {
    items.push({
      id: `muscle_${m.id}`,
      type: "muscle",
      label: m.name,
      tag: `@${m.name}`,
      description: m.desc,
      icon: m.icon,
      keywords: m.kw,
    });
  });

  // 2. Biométricos Clave
  items.push(
    {
      id: "bio_peso",
      type: "biometric",
      label: "Peso Corporal",
      tag: "@Peso",
      description: "Peso actual vs peso objetivo",
      icon: "scale-outline",
      keywords: ["peso", "weight", "kg", "libras", "balanza"],
    },
    {
      id: "bio_grasa",
      type: "biometric",
      label: "Grasa Corporal",
      tag: "@Grasa",
      description: "% de grasa estimado por US Navy",
      icon: "flame-outline",
      keywords: ["grasa", "fat", "porcentaje", "definicion", "adiposidad"],
    },
    {
      id: "bio_masa_magra",
      type: "biometric",
      label: "Masa Magra",
      tag: "@MasaMagra",
      description: "Kilos de masa muscular magra",
      icon: "fitness-outline",
      keywords: ["masa magra", "musculo", "lean mass"],
    },
    {
      id: "bio_medidas",
      type: "biometric",
      label: "Todas las Medidas",
      tag: "@Medidas",
      description: "Resumen completo de perímetros corporales",
      icon: "resize-outline",
      keywords: ["medidas", "perimetros", "cinta", "centimetros"],
    }
  );

  // 3. Metas y Nutrición
  items.push(
    {
      id: "gen_metas",
      type: "goal",
      label: "Metas y Objetivos",
      tag: "@Metas",
      description: "Objetivos de peso, grasa, volumen y macros",
      icon: "flag-outline",
      keywords: ["metas", "objetivos", "goals", "calorias objetivo", "volumen"],
    },
    {
      id: "gen_nutricion",
      type: "nutrition",
      label: "Nutrición de Hoy",
      tag: "@Nutrición",
      description: "Calorías y macros consumidos en el día",
      icon: "restaurant-outline",
      keywords: ["nutricion", "comidas", "calorias", "dieta", "proteinas"],
    },
    {
      id: "gen_historial",
      type: "general",
      label: "Historial de Entrenamientos",
      tag: "@Historial",
      description: "Últimas rutinas, tonelaje y series",
      icon: "calendar-outline",
      keywords: ["historial", "rutinas", "entrenamientos", "sesiones", "tonelaje"],
    }
  );

  // 4. Ejercicios del Catálogo con Récords o Destacados
  try {
    const catalog: ExerciseCatalogItem[] = await getAllExercises();
    const historyLogs = await getExerciseHistory();

    // Priorizar los que tienen registros o los primeros 25 del catálogo
    const loggedIds = new Set(historyLogs.map((l) => l.exerciseId));

    catalog.forEach((ex) => {
      const hasLogs = loggedIds.has(ex.id);
      items.push({
        id: `exercise_${ex.id}`,
        type: "exercise",
        label: ex.nombre,
        tag: `@${ex.nombre.replace(/\s+/g, "_")}`,
        description: `${ex.musculo.toUpperCase()} • ${hasLogs ? "Tiene récords registrados" : "En catálogo"}`,
        icon: "barbell-outline",
        keywords: [ex.nombre.toLowerCase(), ex.musculo.toLowerCase(), "ejercicio"],
      });
    });
  } catch (e) {
    console.error("Error cargando ejercicios para menciones @:", e);
  }

  return items;
};

/**
 * Compila el contexto enfocado según las menciones @ presentes en la pregunta o el contexto general.
 */
export const compileTargetedChatContext = async (
  userText: string,
  taggedItems: MentionItem[] = []
): Promise<string> => {
  const settings = await getSettings();
  const unit = settings.unit || "kg";
  const profile: UserProfile = await getUserProfile();
  const latestMeasure: Measure | null = await getLatestSanitizedMeasure();
  const measuresSummary = await getSanitizedMeasuresSummary();
  const goals: Goals = await getLatestGoal();
  const allExercises = await getAllExercises();
  const historyLogs: ExerciseHistory[] = await getExerciseHistory();
  const sessions: RoutineSession[] = await getRoutineSessions();
  const todayLog: DailyMealLog = await getTodayMealLog();

  const sections: string[] = [];

  sections.push(`### Perfil del Atleta:
- Nombre: ${profile.name || "Atleta"}
- Unidad preferida: ${unit.toUpperCase()}`);

  const lowerQuery = userText.toLowerCase();

  // Detectar menciones o palabras clave en el texto
  const hasTag = (idPrefix: string, textKeyword: string) => {
    return (
      taggedItems.some((t) => t.id.startsWith(idPrefix) || t.tag.toLowerCase() === `@${textKeyword}`) ||
      lowerQuery.includes(`@${textKeyword}`) ||
      lowerQuery.includes(textKeyword)
    );
  };

  const isSpecificTargeted =
    taggedItems.length > 0 ||
    lowerQuery.includes("@") ||
    [
      "biceps",
      "bíceps",
      "pecho",
      "triceps",
      "tríceps",
      "espalda",
      "hombros",
      "cuadriceps",
      "cuádriceps",
      "pierna",
      "gemelos",
      "gluteo",
      "cintura",
      "peso",
      "grasa",
      "comida",
      "calorias",
    ].some((k) => lowerQuery.includes(k));

  // --- SECCIÓN: MÚSCULO ESPECÍFICO ---
  const muscleKeys = [
    { key: "biceps", name: "Bíceps", match: ["biceps", "bíceps", "brazo"] },
    { key: "pecho", name: "Pecho", match: ["pecho", "pectoral", "chest"] },
    { key: "triceps", name: "Tríceps", match: ["triceps", "tríceps"] },
    { key: "espalda", name: "Espalda", match: ["espalda", "dorsal", "trapecio"] },
    { key: "hombros", name: "Hombros", match: ["hombros", "deltoides"] },
    { key: "cuadriceps", name: "Cuádriceps", match: ["cuadriceps", "cuádriceps", "pierna", "muslo"] },
    { key: "gemelos", name: "Gemelos", match: ["gemelos", "pantorrilla"] },
    { key: "gluteos", name: "Glúteos", match: ["gluteos", "glúteos", "cadera"] },
    { key: "cintura", name: "Cintura / Core", match: ["cintura", "abdomen", "core", "abs"] },
    { key: "antebrazo", name: "Antebrazo", match: ["antebrazo"] },
    { key: "cuello", name: "Cuello", match: ["cuello"] },
  ];

  for (const m of muscleKeys) {
    const isMuscleTargeted =
      taggedItems.some((t) => t.id === `muscle_${m.key}` || t.label.toLowerCase() === m.name.toLowerCase()) ||
      m.match.some((keyword) => lowerQuery.includes(keyword));

    if (isMuscleTargeted) {
      const circum = (latestMeasure as any)?.[m.key] || (measuresSummary as any)[m.key]?.latest || 0;
      const prevCircum = (measuresSummary as any)[m.key]?.previous;

      // Ejercicios y PRs de este músculo
      const muscleExercises = allExercises.filter(
        (ex) => ex.musculo.toLowerCase() === m.key.toLowerCase() || (m.key === "cuadriceps" && ex.musculo.toLowerCase() === "piernas")
      );

      const musclePRs: string[] = [];
      muscleExercises.forEach((ex) => {
        const logs = historyLogs.filter((l) => l.exerciseId === ex.id);
        let bestW = 0;
        let bestR = 0;
        let best1RM = 0;
        logs.forEach((log) => {
          (log.sets || []).forEach((set) => {
            const rm = calculate1RM(set.peso, set.reps);
            if (rm > best1RM) {
              best1RM = rm;
              bestW = set.peso;
              bestR = set.reps;
            }
          });
        });

        if (bestW > 0) {
          musclePRs.push(
            `- **${ex.nombre}**: ${toDisplayWeight(bestW, unit)} ${unit} x ${bestR} reps (1RM estimado: ${toDisplayWeight(best1RM, unit)} ${unit})`
          );
        }
      });

      sections.push(`### Datos específicos para ${m.name}:
- **Medida actual:** ${circum > 0 ? `${circum} cm` : "NO REGISTRADA AÚN [DATOS_FALTANTES: medidas de " + m.name + "]"}
- **Medida previa:** ${prevCircum && prevCircum > 0 ? `${prevCircum} cm` : "Sin registro previo"}
- **Récords Personales en este grupo muscular:**
${musclePRs.length > 0 ? musclePRs.join("\n") : "NO SE HAN REGISTRADO SERIES DE ESTE MÚSCULO [DATOS_FALTANTES: ejercicios de " + m.name + "]"}`);
    }
  }

  // --- SECCIÓN: BIOMÉTRICOS & COMPOSICIÓN ---
  const wantsBiometrics =
    hasTag("bio", "peso") ||
    hasTag("bio", "grasa") ||
    hasTag("bio", "medidas") ||
    lowerQuery.includes("peso") ||
    lowerQuery.includes("grasa") ||
    lowerQuery.includes("medida") ||
    !isSpecificTargeted;

  if (wantsBiometrics) {
    if (latestMeasure) {
      const esHombre = (latestMeasure.sexo || "masculino").toLowerCase() === "masculino";
      const altura = latestMeasure.altura || 170;
      const cuello = latestMeasure.cuello || 0;
      const cintura = latestMeasure.cintura || 0;
      const cadera = latestMeasure.cadera || 0;

      let pctGrasa = 0;
      if (cuello > 0 && cintura > 0) {
        if (esHombre && cintura > cuello) {
          pctGrasa =
            86.01 * Math.log10(cintura - cuello) -
            70.041 * Math.log10(altura) +
            36.76;
        } else if (!esHombre && cadera > 0 && cintura + cadera > cuello) {
          pctGrasa =
            163.205 * Math.log10(cintura + cadera - cuello) -
            97.684 * Math.log10(altura) -
            78.387;
        }
      }

      const grasaFinal = Math.max(0, parseFloat(pctGrasa.toFixed(1)));
      const masaMagraVal =
        grasaFinal > 0 && latestMeasure.peso > 0
          ? ((100 - grasaFinal) / 100) * latestMeasure.peso
          : 0;

      sections.push(`### Composición y Biometría:
- Peso actual: ${latestMeasure.peso > 0 ? `${latestMeasure.peso} kg` : "NO REGISTRADO [DATOS_FALTANTES: peso]"}
- Altura: ${latestMeasure.altura || "170"} cm | Edad: ${latestMeasure.edad || 18} años
- % Grasa Corporal actual (Fórmula Marina EE.UU.): ${grasaFinal > 0 ? `${grasaFinal}%` : "No disponible (falta cuello/cintura)"}
- Masa Magra actual: ${masaMagraVal > 0 ? `${masaMagraVal.toFixed(1)} kg` : "No disponible"}
- Circunferencias: Cintura: ${measuresSummary.cintura?.latest || latestMeasure.cintura || 0} cm, Cuello: ${measuresSummary.cuello?.latest || latestMeasure.cuello || 0} cm, Bíceps: ${measuresSummary.biceps?.latest || latestMeasure.biceps || 0} cm, Pecho: ${measuresSummary.pecho?.latest || latestMeasure.pecho || 0} cm, Espalda: ${measuresSummary.espalda?.latest || latestMeasure.espalda || 0} cm`);
    } else {
      sections.push(`### Composición y Biometría:
- NO SE HAN REGISTRADO MEDIDAS CORPORALES AÚN [DATOS_FALTANTES: medidas]`);
    }
  }

  // --- SECCIÓN: METAS ---
  const wantsGoals =
    hasTag("gen_metas", "metas") ||
    lowerQuery.includes("meta") ||
    lowerQuery.includes("objetivo") ||
    !isSpecificTargeted;

  if (wantsGoals) {
    sections.push(`### Metas del Atleta:
- Peso objetivo: ${goals.goalWeight || DEFAULT_GOAL.goalWeight} kg (Actual: ${latestMeasure?.peso || 0} kg)
- Grasa meta: ${goals.goalGrass || DEFAULT_GOAL.goalGrass}%
- Masa magra meta: ${goals.masaMagra || DEFAULT_GOAL.masaMagra} kg
- Frecuencia semanal: ${goals.frequency || DEFAULT_GOAL.frequency} días/sem
- Calorías meta: ${goals.targetCalories || 2500} kcal (Proteína: ${goals.targetProtein || 140}g, Carbs: ${goals.targetCarbs || 250}g, Grasas: ${goals.targetFat || 70}g)`);
  }

  // --- SECCIÓN: NUTRICIÓN DE HOY ---
  const wantsNutrition =
    hasTag("gen_nutricion", "nutrición") ||
    lowerQuery.includes("nutricion") ||
    lowerQuery.includes("comida") ||
    lowerQuery.includes("caloria") ||
    lowerQuery.includes("macro");

  if (wantsNutrition) {
    if (todayLog && todayLog.consumedMeals && todayLog.consumedMeals.length > 0) {
      const mealsSummary = todayLog.consumedMeals
        .map((m) => `- ${m.name} (${m.category}): ${m.calories} kcal [P:${m.protein}g C:${m.carbs}g G:${m.fat}g]`)
        .join("\n");
      sections.push(`### Nutrición Registrada Hoy:
- Total calorías consumidas: ${todayLog.totalCalories} kcal (Meta: ${goals.targetCalories || 2500} kcal)
- Macros consumidos: Proteína: ${todayLog.totalProtein}g | Carbs: ${todayLog.totalCarbs}g | Grasas: ${todayLog.totalFat}g
${mealsSummary}`);
    } else {
      sections.push(`### Nutrición Registrada Hoy:
- NO HAY ALIMENTOS REGISTRADOS HOY AÚN [DATOS_FALTANTES: comidas]`);
    }
  }

  // --- SECCIÓN: ENTRENAMIENTOS RECIENTES ---
  const wantsWorkouts =
    hasTag("gen_historial", "historial") ||
    lowerQuery.includes("entreno") ||
    lowerQuery.includes("sesion") ||
    lowerQuery.includes("rutina") ||
    !isSpecificTargeted;

  if (wantsWorkouts) {
    if (sessions.length > 0) {
      const recent = sessions.slice(0, 4).map((s) => {
        const dateStr = new Date(s.date).toLocaleDateString("es-ES", {
          day: "numeric",
          month: "short",
        });
        const mins = Math.floor((s.duration || 0) / 60);
        const vol = toDisplayWeight(s.totalVolume || 0, unit);
        let exercisesDetails = "";
        if (s.exercises && s.exercises.length > 0) {
          const exList = s.exercises.map(ex => {
            const setsStr = ex.sets.map((set, i) => `S${i+1}: ${toDisplayWeight(set.peso, unit)}${unit}x${set.reps}`).join(", ");
            return `    * ${ex.exerciseName} (${setsStr})`;
          }).join("\n");
          exercisesDetails = `\n${exList}`;
        }
        return `- ${dateStr}: "${s.name}" (${mins} min, ${vol} ${unit} total)${exercisesDetails}`;
      });
      sections.push(`### Entrenamientos Recientes:
Total de sesiones completadas: ${sessions.length}
${recent.join("\n")}`);
    } else {
      sections.push(`### Entrenamientos Recientes:
- NO HAY ENTRENAMIENTOS REGISTRADOS AÚN [DATOS_FALTANTES: rutinas]`);
    }
  }

  return sections.join("\n\n");
};

/**
 * Envía la conversación al modelo de Gemini configurado con límite de salida ampliado y directivas concisas.
 */
export const sendAIChatMessage = async (
  messages: ChatMessage[],
  contextText: string
): Promise<string> => {
  const aiConfig = await getAIConfig();
  const apiKey = aiConfig.apiKey?.trim() || process.env.EXPO_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "No se encontró ninguna API Key de Gemini configurada. Por favor ve a Ajustes > Configuración de IA para activarla."
    );
  }

  const isLegacyOrRetired =
    !aiConfig.model ||
    aiConfig.model.startsWith("gemini-1.") ||
    aiConfig.model.startsWith("gemini-2.0") ||
    aiConfig.model === "gemini-2.5-flash";
  const preferredModel = isLegacyOrRetired ? "gemini-3.5-flash" : aiConfig.model;

  const candidateModels = Array.from(
    new Set([
      preferredModel,
      "gemini-3.5-flash",
      "gemini-3.6-flash",
      "gemini-3.7-flash",
      "gemini-3.8-flash",
    ])
  );

  const systemPrompt = `Eres el Coach Personal y Preparador Físico de Élite en la app FitterMe.
Hablas directamente al usuario de manera profesional, cercana, motivadora y científicamente precisa (hipertrofia, sobrecarga progresiva y nutrición).

CONTEXTO Y DATOS DE FITTERME DEL USUARIO:
${contextText}

REGLAS ESTRICTAS DE RESPUESTA:
1. SÉ EXTREMADAMENTE CONCISO, DIRECTO Y AL GRANO. Evita introducciones con rodeos largos, frases vacías o conclusiones redundantes.
2. Responde en 2 o 3 apartados o listas cortas con viñetas claras. Ve directo a las cifras, análisis y consejos aplicables.
3. Si en el contexto notas que un dato solicitado está marcado como [DATOS_FALTANTES], o si el usuario pregunta por algo que no ha registrado aún (ej. medidas de un músculo, comidas de hoy o rutinas):
   - Indícalo amablemente en una sola línea diciendo que no tiene registros de eso todavía y pregúntale: "¿Deseas agregar estos datos ahora?".
   - Incluye AL FINAL EXACTO de tu mensaje una de estas etiquetas correspondientes (la app creará un botón automático):
     * [ACCION:REGISTRAR_MEDIDAS] si le faltan medidas corporales o peso.
     * [ACCION:REGISTRAR_COMIDAS] si no ha registrado comidas hoy.
     * [ACCION:INICIAR_RUTINA] si no tiene entrenamientos de ese músculo o ejercicio.
4. Termina SIEMPRE todas tus oraciones y pensamientos completos. NUNCA te cortes a medias.`;

  // Formatear mensajes para la API de Gemini (solo user y model)
  const geminiContents = messages
    .filter((m) => m.sender === "user" || m.sender === "assistant")
    .map((m) => ({
      role: m.sender === "user" ? "user" : "model",
      parts: [{ text: m.text }],
    }));

  let lastError: any = null;

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
            systemInstruction: {
              parts: [{ text: systemPrompt }],
            },
            contents: geminiContents,
            generationConfig: {
              temperature: 0.65,
              maxOutputTokens: 2500, // Amplio margen para que JAMÁS se corte
            },
          }),
        }
      );

      if (response.ok) {
        const json = await response.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim().length > 0) {
          return text.trim();
        }
      } else {
        const errJson = await response.json().catch(() => null);
        lastError = errJson?.error?.message || `HTTP ${response.status}`;
      }
    } catch (e: any) {
      lastError = e?.message || e;
    }
  }

  throw new Error(
    lastError
      ? `Error al comunicarse con la IA: ${lastError}`
      : "No se pudo obtener respuesta del modelo de IA. Verifica tu conexión y API Key."
  );
};
