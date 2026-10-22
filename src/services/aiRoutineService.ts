import exercisesData from "@/data/exercises.json";
import { getAIConfig } from "@/store/aiConfig";
import { getPersonalBest } from "@/store/historyExcercise";
import { addRoutine, Routine } from "@/store/routines";

export type TargetMuscle =
  | "pecho"
  | "espalda"
  | "hombros"
  | "biceps"
  | "triceps"
  | "antebrazo"
  | "cuadriceps"
  | "gemelos"
  | "gluteos";

export type TargetGoal = "Hipertrofia" | "Fuerza" | "Resistencia";

export type AIGeneratedExercise = {
  id: number;
  nombre: string;
  musculo: string;
  objetivo: string;
  equipamiento: string;
  series: number;
  reps: number;
  peso: number;
  previousPR?: { peso: number; reps: number } | null;
  aiSuggestionNote: string;
};

export type AIGeneratedRoutine = {
  name: string;
  category: string;
  exercises: AIGeneratedExercise[];
};

export const generateAIRoutine = async (
  selectedMuscles: TargetMuscle[],
  goal: TargetGoal,
): Promise<AIGeneratedRoutine> => {
  if (!selectedMuscles || selectedMuscles.length === 0) {
    selectedMuscles = ["pecho", "triceps"];
  }

  // Filtrar ejercicios del catálogo json que coincidan con los músculos seleccionados
  const availableExercises = exercisesData.filter((ex) =>
    selectedMuscles.includes(ex.musculo.toLowerCase() as TargetMuscle),
  );

  const candidatePool =
    availableExercises.length > 0 ? availableExercises : exercisesData;

  // Obtener récords previos para los ejercicios candidatos
  const candidateHistoryPromises = candidatePool.map(async (ex) => {
    const pb = await getPersonalBest(ex.id);
    return {
      id: ex.id,
      nombre: ex.nombre,
      musculo: ex.musculo,
      equipamiento: ex.equipamiento,
      pb: pb ? { peso: pb.peso, reps: pb.reps } : null,
    };
  });
  const candidatesWithHistory = await Promise.all(candidateHistoryPromises);

  // Intentar generar con la API de Gemini si hay API Key configurada
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
        const prompt = `Actúa como un entrenador personal y preparador físico de élite.
El usuario quiere entrenar hoy enfocado en: ${goal}.
Músculos a trabajar: ${selectedMuscles.join(", ")}.

Lista de ejercicios disponibles en el catálogo de la app (con su ID y récords previos del usuario si existen):
${JSON.stringify(candidatesWithHistory, null, 2)}

Tu tarea:
1. Selecciona de 4 a 6 de los mejores ejercicios para el entrenamiento del día, ordenados de forma biomecánica óptima (compuestos primero, aislamiento después).
2. Asigna series, repeticiones y peso sugerido con sobrecarga progresiva según el objetivo y el récord previo del usuario.
3. Genera una nota explicativa breve para cada ejercicio explicando por qué es el mejor ejercicio y el criterio de sobrecarga para hoy.

Devuelve ÚNICAMENTE un JSON válido con este formato estricto (sin bloques de código markdown):
{
  "name": "Nombre de la rutina (ej. IA: Pecho y Tríceps Explosivo)",
  "category": "${goal}",
  "exercises": [
    {
      "id": id_numerico_exacto_del_catalogo,
      "nombre": "Nombre del ejercicio",
      "musculo": "Grupo muscular",
      "objetivo": "${goal}",
      "equipamiento": "Equipamiento",
      "series": numero_de_series,
      "reps": numero_de_reps,
      "peso": peso_en_kg,
      "aiSuggestionNote": "Nota breve de la IA sobre la carga o técnica para hoy"
    }
  ]
}`;

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
                  parts: [{ text: prompt }],
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

          if (parsed && Array.isArray(parsed.exercises) && parsed.exercises.length > 0) {
            const validatedExercises: AIGeneratedExercise[] = [];

            for (const item of parsed.exercises) {
              const original = candidatePool.find((c) => c.id === item.id) || candidatePool.find((c) => c.nombre.toLowerCase() === item.nombre.toLowerCase());
              const pb = original ? await getPersonalBest(original.id) : null;

              validatedExercises.push({
                id: original ? original.id : item.id,
                nombre: original ? original.nombre : item.nombre,
                musculo: original ? original.musculo : item.musculo,
                objetivo: goal,
                equipamiento: original ? original.equipamiento : (item.equipamiento || "Gimnasio"),
                series: typeof item.series === "number" ? Math.max(1, Math.min(6, item.series)) : 3,
                reps: typeof item.reps === "number" ? Math.max(1, Math.min(30, item.reps)) : 10,
                peso: typeof item.peso === "number" ? Math.max(0, item.peso) : (pb ? pb.peso : 20),
                previousPR: pb,
                aiSuggestionNote: item.aiSuggestionNote || "Mantén cadencia controlada y rango completo de movimiento.",
              });
            }

            if (validatedExercises.length > 0) {
              return {
                name: parsed.name || `IA: ${selectedMuscles.join(" y ").toUpperCase()}`,
                category: goal,
                exercises: validatedExercises,
              };
            }
          }
        }
      } catch (error) {
        console.warn(`Error al generar rutina con modelo ${model}:`, error);
      }
    }
  }

  // Fallback Algorítmico Local:
  const selectedCandidates: typeof candidatePool = [];
  const muscleGroupsMap: Record<string, number> = {};

  for (const ex of candidatePool) {
    const count = muscleGroupsMap[ex.musculo] || 0;
    if (count < 2 && selectedCandidates.length < 6) {
      selectedCandidates.push(ex);
      muscleGroupsMap[ex.musculo] = count + 1;
    }
  }

  for (const ex of candidatePool) {
    if (selectedCandidates.length >= 5) break;
    if (!selectedCandidates.some((item) => item.id === ex.id)) {
      selectedCandidates.push(ex);
    }
  }

  const aiExercises: AIGeneratedExercise[] = [];

  for (const ex of selectedCandidates) {
    const pb = await getPersonalBest(ex.id);

    let targetSeries = 3;
    let targetReps = 10;
    let targetPeso = 20;
    let note = "";

    if (goal === "Fuerza") {
      targetSeries = 4;
      targetReps = 6;
    } else if (goal === "Resistencia") {
      targetSeries = 3;
      targetReps = 15;
    } else {
      targetSeries = 3;
      targetReps = 10;
    }

    if (pb && pb.peso > 0) {
      const increment = pb.peso >= 50 ? 5 : 2.5;
      targetPeso = Math.round(pb.peso + increment);
      note = `Sobrecarga Progresiva IA: +${increment} kg sobre tu récord anterior (${pb.peso} kg x ${pb.reps} reps)`;
    } else {
      const equip = (ex.equipamiento || "").toLowerCase();
      if (equip.includes("barra")) {
        targetPeso = goal === "Fuerza" ? 40 : 30;
      } else if (equip.includes("mancuerna")) {
        targetPeso = goal === "Fuerza" ? 16 : 12;
      } else if (equip.includes("polea") || equip.includes("máquina")) {
        targetPeso = goal === "Fuerza" ? 35 : 25;
      } else {
        targetPeso = 10;
      }
      note = `💡 Sugerencia inicial IA basada en ${ex.equipamiento} para establecer tu marca personal.`;
    }

    aiExercises.push({
      id: ex.id,
      nombre: ex.nombre,
      musculo: ex.musculo,
      objetivo: goal,
      equipamiento: ex.equipamiento,
      series: targetSeries,
      reps: targetReps,
      peso: targetPeso,
      previousPR: pb,
      aiSuggestionNote: note,
    });
  }

  const muscleNamesStr = selectedMuscles
    .map((m) => m.charAt(0).toUpperCase() + m.slice(1))
    .join(" & ");

  const routineName = `IA: ${muscleNamesStr} (${goal})`;

  return {
    name: routineName,
    category: goal,
    exercises: aiExercises,
  };
};

export const saveAIRoutineToStore = async (
  aiRoutine: AIGeneratedRoutine,
): Promise<Routine> => {
  return await addRoutine({
    name: aiRoutine.name,
    category: aiRoutine.category,
    exercises: aiRoutine.exercises.map((ex) => ({
      id: ex.id,
      nombre: ex.nombre,
      musculo: ex.musculo,
      objetivo: ex.objetivo,
      equipamiento: ex.equipamiento,
      series: ex.series,
      reps: ex.reps,
      peso: ex.peso,
    })),
  });
};
