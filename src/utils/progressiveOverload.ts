import { WeightUnit, toDisplayWeight } from "@/store/conf";

export type ProgressionType = "WEIGHT" | "REPS" | "CONSOLIDATE";

export interface ExerciseSetInput {
  reps: number;
  peso: number;
}

export interface ExerciseItemInput {
  exerciseName: string;
  sets: ExerciseSetInput[];
}

export interface ProgressionRecommendation {
  exerciseName: string;
  muscle: string;
  type: ProgressionType;

  // Pesos y Reps para visualización
  workingWeightDisplay: number;
  nextWeightDisplay: number;
  unit: WeightUnit;

  currentRepsRef: number;
  targetRepsRef: number;
  allReps: number[];
  targetRepsList?: number[];

  // Etiquetas e indicaciones
  badgeLabel: string;
  badgeEmoji: string;
  badgeColorType: "success" | "primary" | "warning";
  actionText: string;
  coachComment: string;
  milestoneGoal?: string;

  // Textos formateados
  fromText: string;
  toText: string;
  inlineTransition: string;

  // Puntuación para ordenamiento y selección inteligente
  priorityScore: number;
}

export interface CuratedProgressionResult {
  primaryGoal: ProgressionRecommendation | null;
  secondaryGoals: ProgressionRecommendation[];
  remainingGoals: ProgressionRecommendation[];
  totalExercises: number;
}

/**
 * Normaliza el nombre del músculo para mostrar de forma limpia y concisa.
 */
export const formatMuscleName = (muscle?: string): string => {
  if (!muscle) return "";
  const m = muscle.trim().toLowerCase();
  const map: Record<string, string> = {
    pecho: "Pecho",
    hombros: "Hombros",
    espalda: "Espalda",
    piernas: "Piernas",
    biceps: "Bíceps",
    triceps: "Tríceps",
    abdominales: "Abdominales",
    gluteos: "Glúteos",
    gemelos: "Gemelos",
    antebrazo: "Antebrazo",
    trapecio: "Trapecio",
    cardio: "Cardio",
  };
  return map[m] || m.charAt(0).toUpperCase() + m.slice(1);
};

/**
 * Analiza un ejercicio individual utilizando la regla de Doble Progresión (10–12 reps).
 * Evalúa TODAS las series del ejercicio paso a paso:
 * - Si todas las series completan 12 reps -> Sube de peso y vuelve a 10 reps.
 * - Si algunas series ya llegaron a 12 reps -> Eleva la serie rezagada para completar las series a 12.
 * - Si las series son dispares (ej: 7 / 8 / 9 o 10 / 7 / 7) -> Eleva las series bajas (ej: 8 / 8 / 9) para consolidar en la mejor repetición lograda (3 series de 9 reps).
 * - Si las series son parejas (ej: 10 / 10 / 10 o 11 / 11 / 11) -> Busca subir a la siguiente repetición en todas las series.
 */
export const analyzeExerciseProgression = (
  exercise: ExerciseItemInput,
  unit: WeightUnit,
  weightIncrement: number = 2.5,
  muscle: string = ""
): ProgressionRecommendation | null => {
  // Excluir ejercicios de cardio de la sobrecarga progresiva
  const mLower = (muscle || "").trim().toLowerCase();
  const nameLower = (exercise.exerciseName || "").trim().toLowerCase();
  if (
    mLower === "cardio" ||
    nameLower.includes("cinta") ||
    nameLower.includes("treadmill") ||
    nameLower.includes("bicicleta") ||
    nameLower.includes("elíptica") ||
    nameLower.includes("eliptica") ||
    nameLower.includes("escaladora") ||
    nameLower.includes("stairmaster") ||
    nameLower.includes("cardio") ||
    nameLower.includes("remoergómetro") ||
    nameLower.includes("salto de cuerda")
  ) {
    return null;
  }

  const validSets = (exercise.sets || []).filter((s) => s.reps > 0);
  if (validSets.length === 0) return null;

  const repsList = validSets.map((s) => s.reps);
  const minReps = Math.min(...repsList);
  const maxReps = Math.max(...repsList);
  const numSets = repsList.length;

  // Peso de trabajo más representativo (máximo peso registrado entre las series)
  const maxWeightKg = Math.max(...validSets.map((s) => s.peso || 0));
  const workingWeightDisplay = toDisplayWeight(maxWeightKg, unit);
  const step = weightIncrement > 0 ? weightIncrement : unit === "lb" ? 5 : 2.5;
  const weightPrefix =
    workingWeightDisplay > 0
      ? `${workingWeightDisplay} ${unit} × `
      : "Corporal × ";
  const repsString = repsList.join(" / ");

  let type: ProgressionType;
  let nextWeightDisplay = workingWeightDisplay;
  let currentRepsRef = minReps;
  let targetRepsRef = 10;
  let targetRepsList: number[] = [];
  let badgeLabel = "";
  let badgeEmoji = "";
  let badgeColorType: "success" | "primary" | "warning";
  let actionText = "";
  let coachComment = "";
  let milestoneGoal = "";
  let fromText = "";
  let toText = "";
  let inlineTransition = "";
  let priorityScore = 0;

  // CASO 1: 🎯 SUBIR PESO - Todas las series alcanzaron 12+ reps (ej: 12 / 12 / 12)
  if (minReps >= 12) {
    type = "WEIGHT";
    badgeLabel = "Listo para progresar";
    badgeEmoji = "🎯";
    badgeColorType = "success";
    nextWeightDisplay = Math.round((workingWeightDisplay + step) * 10) / 10;
    targetRepsRef = 10;
    currentRepsRef = maxReps;
    targetRepsList = repsList.map(() => 10);

    actionText = `Sube a ${nextWeightDisplay} ${unit} (vuelve a 10 reps)`;
    coachComment = `¡Dominaste las 12 reps en todas tus series! Sube el peso a ${nextWeightDisplay} ${unit} e intenta completar ${numSets} series de 10 reps.`;
    milestoneGoal = `Meta: ${numSets} series de 10 reps`;

    fromText =
      numSets > 1
        ? `${weightPrefix}${numSets} series de 12`
        : `${weightPrefix}12 reps`;
    toText = `${nextWeightDisplay} ${unit} × ${numSets} series de 10 reps`;
    inlineTransition = `${weightPrefix}12 reps → ${nextWeightDisplay} ${unit} × 10 reps`;

    // Máxima prioridad para el objetivo principal
    priorityScore = 1000 + (workingWeightDisplay > 0 ? workingWeightDisplay : 50);
  }
  // CASO 2: 📈 CASI LISTO PARA SUBIR PESO - Alguna serie en 12 reps, pero faltan series por completar 12 (ej: 12 / 12 / 10 o 12 / 12 / 11)
  else if (maxReps >= 12 && minReps < 12) {
    type = "REPS";
    badgeLabel = "Casi listo para subir peso";
    badgeEmoji = "📈";
    badgeColorType = "primary";

    // Elevamos las series que están en el mínimo hacia 12
    targetRepsList = repsList.map((r) => (r === minReps ? r + 1 : r));
    const targetRepsStr = targetRepsList.join(" / ");
    currentRepsRef = minReps;
    targetRepsRef = minReps + 1;

    actionText = `Completa las ${numSets} series a 12 reps`;
    coachComment = `Ya tocaste las 12 reps. Sube la serie rezagada (${targetRepsStr}) para completar las ${numSets} series a 12 y poder subir de peso.`;
    milestoneGoal = `Meta: ${numSets} series de 12 reps`;

    fromText = `${weightPrefix}${repsString}`;
    toText = `${weightPrefix}${targetRepsStr}`;
    inlineTransition = `${weightPrefix}${repsString} → ${weightPrefix}${targetRepsStr} (meta: ${numSets}×12)`;

    priorityScore = 900 + (workingWeightDisplay > 0 ? workingWeightDisplay / 2 : 10);
  }
  // CASO 3: 🔁 O 📈 SERIES DISPARES / ESCALONADAS (ej: 7 / 8 / 9 o 10 / 7 / 7 o 9 / 8 / 7)
  // El usuario ya tocó maxReps en alguna serie; el objetivo es elevar las series bajas paso a paso hasta lograr numSets x maxReps
  else if (minReps < maxReps) {
    const isSevereDrop = maxReps - minReps >= 3;
    type = isSevereDrop ? "CONSOLIDATE" : "REPS";
    badgeLabel = isSevereDrop ? "Consolida repeticiones" : "Sigue progresando";
    badgeEmoji = isSevereDrop ? "🔁" : "📈";
    badgeColorType = isSevereDrop ? "warning" : "primary";

    // Próximo paso: elevar las series con la repetición más baja (+1)
    targetRepsList = repsList.map((r) => (r === minReps ? r + 1 : r));
    const nextStepStr = targetRepsList.join(" / ");
    currentRepsRef = minReps;
    targetRepsRef = minReps + 1;

    actionText = `Trata de hacer ${numSets} series de ${maxReps} reps`;
    coachComment = `Ya llegaste a ${maxReps} reps. Primero busca subir las series bajas (${nextStepStr}) hasta lograr ${numSets} series a ${maxReps} reps.`;
    milestoneGoal = `Meta: ${numSets} series de ${maxReps} reps`;

    fromText = `${weightPrefix}${repsString}`;
    toText = `${weightPrefix}${nextStepStr}`;
    inlineTransition = `${weightPrefix}${repsString} → ${weightPrefix}${nextStepStr} (meta: ${numSets}×${maxReps})`;

    priorityScore = isSevereDrop
      ? 650 + (maxReps - minReps) * 20
      : 700 + maxReps * 15;
  }
  // CASO 4: 📈 SERIES PAREJAS EN 11 REPS (ej: 11 / 11 / 11)
  else if (minReps === 11 && maxReps === 11) {
    type = "REPS";
    badgeLabel = "A 1 rep de subir peso";
    badgeEmoji = "📈";
    badgeColorType = "primary";
    currentRepsRef = 11;
    targetRepsRef = 12;
    targetRepsList = repsList.map(() => 12);

    actionText = `Busca ${numSets} series de 12 reps`;
    coachComment = `Excelente consistencia en 11 reps. Tu objetivo es alcanzar las 12 reps en todas tus series para poder subir peso.`;
    milestoneGoal = `Meta: ${numSets} series de 12 reps`;

    fromText =
      numSets > 1
        ? `${weightPrefix}${numSets} series de 11`
        : `${weightPrefix}11 reps`;
    toText = `${weightPrefix}${numSets} series de 12 reps`;
    inlineTransition = `${weightPrefix}11 reps → ${weightPrefix}12 reps`;

    priorityScore = 850 + (workingWeightDisplay > 0 ? workingWeightDisplay / 2 : 10);
  }
  // CASO 5: 📈 SERIES PAREJAS EN 10 REPS (ej: 10 / 10 / 10)
  else if (minReps === 10 && maxReps === 10) {
    type = "REPS";
    badgeLabel = "Sigue progresando";
    badgeEmoji = "📈";
    badgeColorType = "primary";
    currentRepsRef = 10;
    targetRepsRef = 11;
    targetRepsList = [11, ...repsList.slice(1)];

    actionText = `Busca 11 reps en tus series`;
    coachComment = `Base de 10 reps asegurada en las ${numSets} series. Ahora intenta sacar 11 reps en tu primera serie y avanzar hacia 11 en todas.`;
    milestoneGoal = `Meta: ${numSets} series de 11 reps`;

    fromText =
      numSets > 1
        ? `${weightPrefix}${numSets} series de 10`
        : `${weightPrefix}10 reps`;
    toText = `${weightPrefix}${numSets} series de 11 reps`;
    inlineTransition = `${weightPrefix}10 reps → ${weightPrefix}11 reps`;

    priorityScore = 780 + (workingWeightDisplay > 0 ? workingWeightDisplay / 2 : 10);
  }
  // CASO 6: 📈 SERIES PAREJAS POR DEBAJO DE 10 REPS (ej: 8 / 8 / 8 o 9 / 9 / 9)
  else {
    type = "REPS";
    badgeLabel = "Sigue progresando";
    badgeEmoji = "📈";
    badgeColorType = "primary";
    const nextTargetReps = Math.min(10, minReps + 1);
    currentRepsRef = minReps;
    targetRepsRef = nextTargetReps;
    targetRepsList = repsList.map(() => nextTargetReps);

    actionText = `Busca ${numSets} series de ${nextTargetReps} reps`;
    coachComment = `Mantén el peso e intenta sacar ${nextTargetReps} reps en cada serie para acercarte a la base de 10 reps.`;
    milestoneGoal = `Meta: ${numSets} series de 10 reps`;

    fromText =
      numSets > 1
        ? `${weightPrefix}${numSets} series de ${minReps}`
        : `${weightPrefix}${minReps} reps`;
    toText = `${weightPrefix}${numSets} series de ${nextTargetReps} reps`;
    inlineTransition = `${weightPrefix}${minReps} reps → ${weightPrefix}${nextTargetReps} reps`;

    priorityScore = 500 + minReps * 20;
  }

  return {
    exerciseName: exercise.exerciseName,
    muscle: formatMuscleName(muscle),
    type,
    workingWeightDisplay,
    nextWeightDisplay,
    unit,
    currentRepsRef,
    targetRepsRef,
    allReps: repsList,
    targetRepsList,
    badgeLabel,
    badgeEmoji,
    badgeColorType,
    actionText,
    coachComment,
    milestoneGoal,
    fromText,
    toText,
    inlineTransition,
    priorityScore,
  };
};

/**
 * Selecciona inteligentemente entre 2 y 4 recomendaciones clave para representar toda la rutina.
 * Distribuye por tipo de progresión (subir peso, mejorar reps, consolidar) y por grupos musculares.
 */
export const selectCuratedProgressions = (
  exercises: ExerciseItemInput[],
  muscleMap: Record<string, string>,
  unit: WeightUnit,
  weightIncrement: number = 2.5
): CuratedProgressionResult => {
  if (!exercises || exercises.length === 0) {
    return {
      primaryGoal: null,
      secondaryGoals: [],
      remainingGoals: [],
      totalExercises: 0,
    };
  }

  // 1. Analizar todos los ejercicios
  const analyzed: ProgressionRecommendation[] = [];
  exercises.forEach((ex) => {
    const rawName = ex.exerciseName.trim().toLowerCase();
    const muscle = muscleMap[rawName] || "";
    const rec = analyzeExerciseProgression(ex, unit, weightIncrement, muscle);
    if (rec) {
      analyzed.push(rec);
    }
  });

  const total = analyzed.length;
  if (total === 0) {
    return {
      primaryGoal: null,
      secondaryGoals: [],
      remainingGoals: [],
      totalExercises: 0,
    };
  }

  // Si solo hay 1 ejercicio
  if (total === 1) {
    return {
      primaryGoal: analyzed[0],
      secondaryGoals: [],
      remainingGoals: [],
      totalExercises: 1,
    };
  }

  // Determinar cuántas recomendaciones mostrar inicialmente (entre 2 y 4)
  const targetCuratedCount = Math.min(4, Math.max(2, Math.min(total, 3)));

  // 2. Seleccionar el OBJETIVO PRINCIPAL:
  // Preferir un ejercicio listo para subir de peso (WEIGHT);
  // Si no hay, preferir el que esté más cerca de subir (11 reps o casi listo);
  // Si no, el de mayor puntaje.
  const weightReady = analyzed.filter((a) => a.type === "WEIGHT");
  let primaryIndex = -1;

  if (weightReady.length > 0) {
    // Si hay varios listos para subir peso, ordenar por mayor peso/volumen
    weightReady.sort((a, b) => b.workingWeightDisplay - a.workingWeightDisplay);
    primaryIndex = analyzed.findIndex(
      (a) => a.exerciseName === weightReady[0].exerciseName
    );
  } else {
    // Ordenar por priorityScore general
    const sorted = [...analyzed].sort(
      (a, b) => b.priorityScore - a.priorityScore
    );
    primaryIndex = analyzed.findIndex(
      (a) => a.exerciseName === sorted[0].exerciseName
    );
  }

  const primaryGoal = analyzed[primaryIndex];
  const remainingPool = analyzed.filter((_, idx) => idx !== primaryIndex);

  const selectedSecondary: ProgressionRecommendation[] = [];
  const usedMuscles = new Set<string>();
  if (primaryGoal.muscle) {
    usedMuscles.add(primaryGoal.muscle.toLowerCase());
  }
  const usedTypes = new Set<ProgressionType>([primaryGoal.type]);

  // 3. Seleccionar las recomendaciones secundarias con diversidad de propósito y músculo
  while (
    selectedSecondary.length < targetCuratedCount - 1 &&
    remainingPool.length > 0
  ) {
    let bestCandidateIdx = -1;
    let highestCandidateScore = -Infinity;

    for (let i = 0; i < remainingPool.length; i++) {
      const candidate = remainingPool[i];
      let score = candidate.priorityScore;

      // Bono por diversidad de tipo de progresión (propósito diferente)
      if (!usedTypes.has(candidate.type)) {
        score += 300;
      }

      // Bono por diversidad muscular
      const m = (candidate.muscle || "").toLowerCase();
      if (m && !usedMuscles.has(m)) {
        score += 200;
      }

      if (score > highestCandidateScore) {
        highestCandidateScore = score;
        bestCandidateIdx = i;
      }
    }

    if (bestCandidateIdx >= 0) {
      const chosen = remainingPool.splice(bestCandidateIdx, 1)[0];
      selectedSecondary.push(chosen);
      if (chosen.muscle) usedMuscles.add(chosen.muscle.toLowerCase());
      usedTypes.add(chosen.type);
    } else {
      break;
    }
  }

  return {
    primaryGoal,
    secondaryGoals: selectedSecondary,
    remainingGoals: remainingPool,
    totalExercises: total,
  };
};
