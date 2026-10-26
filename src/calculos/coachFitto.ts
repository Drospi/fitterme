import { getAIConfig } from "@/store/aiConfig";
import {
  convertWeightToggle,
  formatWeightText,
  toDisplayWeight,
  toStoredKg,
  WeightUnit,
} from "@/store/conf";
import {
  ExerciseCatalogItem,
  getExerciseCategory,
  isBodyweightExercise,
  isCardioExercise,
} from "@/store/excercise";
import { ExerciseHistory } from "@/store/historyExcercise";
import { EffortRating, EFFORT_LEVELS } from "./perceivedEffort";

export interface CoachFittoOption {
  title: string;
  subTitle: string;
  scheme: string;
  targetWeightKg: number;
  targetWeightDisplay: number;
  targetReps: number;
  targetSets: number;
  targetRIR: string;
  restTime: string;
  notes: string;
  isTopSetStyle?: boolean;
  topSet?: {
    weightKg: number;
    weightDisplay: number;
    reps: number;
    rir: string;
    restTime: string;
  };
  backOffSet?: {
    weightKg: number;
    weightDisplay: number;
    reps: number;
    setsCount: number;
    rir: string;
    restTime: string;
    reductionPercent: number;
  };
}

// Compatibilidad de tipos
export type RIRPrescriptionOption = CoachFittoOption;

export interface CoachFittoPrescription {
  exerciseId: number;
  exerciseName: string;
  category: "Gym" | "Cardio" | "Peso corporal";
  isCompound: boolean;
  unit: WeightUnit;
  lastSessionSetsSummary: string;
  bestWeightKg: number;
  bestReps: number;
  hasPreviousData: boolean;
  hasNeuralFatigue: boolean;
  progressionType?: "load" | "reps" | "fatigue" | "calibrate" | "deload";
  verdict: "subir" | "mantener" | "bajar";
  coachFittoVerdictText: string;
  effortRating?: EffortRating;
  diagnosis: string;
  recommendedRest: string;
  optionA: CoachFittoOption;
  optionB: CoachFittoOption;
  sameWeightOption?: CoachFittoOption;
  progressiveOverloadCriteria: string;
  shortSummary: string;
}

// Compatibilidad de tipos para código legado
export type RIRCoachPrescription = CoachFittoPrescription;

/**
 * Detecta si el ejercicio es un movimiento multiarticular básico/compuesto
 */
export const isCompoundMovement = (name: string): boolean => {
  const n = (name || "").toLowerCase();
  return (
    n.includes("banca") ||
    n.includes("bench") ||
    n.includes("sentadilla") ||
    n.includes("squat") ||
    n.includes("peso muerto") ||
    n.includes("deadlift") ||
    n.includes("militar") ||
    n.includes("overhead") ||
    n.includes("dominada") ||
    n.includes("pull-up") ||
    n.includes("chin-up") ||
    n.includes("fondo") ||
    n.includes("dip") ||
    n.includes("remo") ||
    n.includes("row") ||
    n.includes("prensa") ||
    n.includes("leg press") ||
    n.includes("hack") ||
    n.includes("thrust") ||
    n.includes("clean") ||
    n.includes("snatch")
  );
};

/**
 * Detecta si el ejercicio compuesto es de tren inferior (pierna/cadera)
 */
export const isLowerBodyMovement = (name: string, muscle?: string): boolean => {
  const n = (name || "").toLowerCase();
  const m = (muscle || "").toLowerCase();
  return (
    m.includes("pierna") ||
    m.includes("cuadriceps") ||
    m.includes("gluteos") ||
    m.includes("isquio") ||
    n.includes("sentadilla") ||
    n.includes("squat") ||
    n.includes("prensa") ||
    n.includes("leg press") ||
    n.includes("peso muerto") ||
    n.includes("deadlift") ||
    n.includes("hack") ||
    n.includes("thrust") ||
    n.includes("zancada") ||
    n.includes("lunge")
  );
};

export interface ExerciseCatalogOrRoutineItem {
  id: number;
  nombre: string;
  musculo?: string;
  objetivo?: string;
  equipamiento?: string;
  urlimage?: string;
  series?: number;
  reps?: number;
  peso?: number;
}

/**
 * Motor de decisión de Coach Fitto:
 * Analiza el peso, repeticiones y la sensación de esfuerzo (escala 1 a 5) de las series previas
 * para prescribir si en la próxima rutina se debe SUBIR, MANTENER o BAJAR la carga.
 */
export const calculateCoachFittoPrescription = (
  exercise: ExerciseCatalogOrRoutineItem | any,
  lastSession: ExerciseHistory | null | undefined,
  personalBest: { peso: number; reps: number; timeMinutes?: number; intensity?: string } | null | undefined,
  unit: WeightUnit = "kg",
  explicitEffortRating?: EffortRating
): CoachFittoPrescription => {
  const category = getExerciseCategory(exercise);
  const isCardio = category === "Cardio" || isCardioExercise(exercise);
  const isBodyweight = category === "Peso corporal" || isBodyweightExercise(exercise);
  const isCompound = isCompoundMovement(exercise.nombre);
  const isLower = isLowerBodyMovement(exercise.nombre, exercise.musculo);

  const recommendedRest = isCompound ? "2 a 3 min" : "60 a 90 seg";
  const resolvedEffort = explicitEffortRating || lastSession?.effortRating;

  // ==========================================
  // 1. EJERCICIOS DE CARDIO
  // ==========================================
  if (isCardio) {
    const hasData = Boolean(personalBest || lastSession);
    const sets = lastSession?.sets || [];
    const bestMinutes = personalBest?.timeMinutes || personalBest?.reps || lastSession?.bestReps || 15;
    const bestIntensity = personalBest?.intensity || (sets.length > 0 ? sets[0].intensity : "Moderada") || "Moderada";

    let verdict: "subir" | "mantener" | "bajar" = "mantener";
    let nextMinutes = bestMinutes;
    let diagnosis = "";

    if (resolvedEffort === 1) {
      verdict = "bajar";
      nextMinutes = Math.max(5, bestMinutes - 5);
      diagnosis = `Coach Fitto: Llegaste a un nivel de agotamiento forzado. Para la próxima rutina bajamos a ${nextMinutes} min para no quemar tus reservas y permitir una recuperación aeróbica óptima.`;
    } else if (resolvedEffort === 5 || resolvedEffort === 4) {
      verdict = "subir";
      nextMinutes = bestMinutes + (resolvedEffort === 5 ? 5 : 2);
      diagnosis = `Coach Fitto: ¡Con energía de sobra! Completaste con comodidad tus ${bestMinutes} min. Para la próxima rutina subimos a ${nextMinutes} min para seguir ampliando tu capacidad cardiovascular.`;
    } else {
      verdict = "mantener";
      diagnosis = `Coach Fitto: Esfuerzo exigente y controlado. Mantenemos ${bestMinutes} min en intensidad ${bestIntensity} para consolidar tu resistencia base.`;
    }

    return {
      exerciseId: exercise.id,
      exerciseName: exercise.nombre,
      category: "Cardio",
      isCompound: false,
      unit,
      lastSessionSetsSummary: `${bestMinutes} min @ ${bestIntensity}`,
      bestWeightKg: 0,
      bestReps: bestMinutes,
      hasPreviousData: hasData,
      hasNeuralFatigue: resolvedEffort === 1,
      progressionType: verdict === "subir" ? "load" : verdict === "bajar" ? "deload" : "reps",
      verdict,
      coachFittoVerdictText: verdict === "subir" ? "SUBIR TIEMPO (+5 min)" : verdict === "bajar" ? "BAJAR TIEMPO (-5 min)" : "MANTENER RITMO",
      effortRating: resolvedEffort,
      diagnosis,
      recommendedRest: "60-90 seg entre bloques",
      optionA: {
        title: verdict === "subir" ? "Opción A: Incrementar Tiempo" : verdict === "bajar" ? "Opción A: Reducir Carga" : "Opción A: Ritmo Continuo",
        subTitle: `${nextMinutes} min a ritmo constante`,
        scheme: `${nextMinutes} min en Intensidad ${bestIntensity}`,
        targetWeightKg: 0,
        targetWeightDisplay: 0,
        targetReps: nextMinutes,
        targetSets: 1,
        targetRIR: "Zona aeróbica 2-3",
        restTime: "Ritmo constante",
        notes: "Mantén respiración controlada y cadencia uniforme.",
      },
      optionB: {
        title: "Opción B: Bloques Interválicos (HIIT)",
        subTitle: "4 bloques de alta intensidad",
        scheme: `4 series x 5 min con 90 seg de pausa activa`,
        targetWeightKg: 0,
        targetWeightDisplay: 0,
        targetReps: 5,
        targetSets: 4,
        targetRIR: "RPE 8 (esfuerzo intenso controlado)",
        restTime: "90 seg entre bloques",
        notes: "Alterna 5 min intensos con 90 segundos de recuperación activa.",
      },
      progressiveOverloadCriteria: "Añade 2-5 minutos cuando termines con comodidad o pasa a mayor intensidad.",
      shortSummary: `Coach Fitto: ${verdict.toUpperCase()} a ${nextMinutes} min @ ${bestIntensity}`,
    };
  }

  // ==========================================
  // 2. PESO CORPORAL / CALISTENIA
  // ==========================================
  if (isBodyweight) {
    const sets = lastSession?.sets || [];
    const bestReps = personalBest?.reps || lastSession?.bestReps || 10;
    const lastWeight = personalBest?.peso ?? lastSession?.bestWeight ?? 0;
    const hasData = Boolean(personalBest || lastSession);

    let setsSummary = "";
    let minReps = bestReps;
    let maxReps = bestReps;
    let hasDrop = false;

    if (sets.length > 0) {
      setsSummary = sets.map((s) => `${s.reps} reps`).join(" → ");
      const repsArr = sets.map((s) => s.reps);
      minReps = Math.min(...repsArr);
      maxReps = Math.max(...repsArr);
      const repDrop = repsArr[0] - repsArr[repsArr.length - 1];
      if (sets.length >= 2 && repDrop >= 3) {
        hasDrop = true;
      }
    } else if (hasData) {
      setsSummary = `${bestReps} reps máximas`;
    } else {
      setsSummary = "Sin sesiones previas registradas";
      minReps = exercise.reps || 8;
      maxReps = minReps;
    }

    let verdict: "subir" | "mantener" | "bajar" = "mantener";
    let targetRepsA = minReps;
    let diagnosis = "";

    if (resolvedEffort === 1 || hasDrop) {
      verdict = "bajar";
      targetRepsA = Math.max(4, minReps - 2);
      diagnosis = `Coach Fitto: Llegaste a un fallo muy forzado (${setsSummary}) y temblor muscular en las últimas reps que desgastó el músculo de más y compromete tu recuperación. Para tu próxima rutina te indico bajar a ${targetRepsA} reps para no quemarte y mantener la técnica estricta.`;
    } else if (resolvedEffort === 5 || (resolvedEffort === 4 && minReps >= 10)) {
      verdict = "subir";
      targetRepsA = minReps + 2;
      diagnosis = `Coach Fitto: ¡Te sobraron repeticiones con comodidad (${setsSummary})! Sientes que podías hacer 2 o más repeticiones con buena técnica. Para la próxima rutina subimos a ${targetRepsA} reps (o añadir lastre suave) para acelerar tu progreso.`;
    } else {
      verdict = "mantener";
      targetRepsA = Math.max(minReps + 1, maxReps);
      diagnosis = `Coach Fitto: Estuviste cerca del límite sin quemarte (${setsSummary}), con un estímulo óptimo. Te sugiero mantener las repeticiones en torno a ${targetRepsA} para consolidar tu fuerza antes de subir más.`;
    }

    const displayWeight = unit === "lb" ? convertWeightToggle(Math.abs(lastWeight), "lb") : Math.abs(lastWeight);
    const targetWeightDisp = lastWeight > 0 ? displayWeight : lastWeight < 0 ? -displayWeight : 0;
    const weightSign = lastWeight > 0 ? `+${displayWeight} ${unit}` : lastWeight < 0 ? `-${displayWeight} ${unit}` : "Solo cuerpo";

    return {
      exerciseId: exercise.id,
      exerciseName: exercise.nombre,
      category: "Peso corporal",
      isCompound: true,
      unit,
      lastSessionSetsSummary: setsSummary,
      bestWeightKg: lastWeight,
      bestReps,
      hasPreviousData: hasData,
      hasNeuralFatigue: hasDrop || resolvedEffort === 1,
      progressionType: verdict === "subir" ? "load" : verdict === "bajar" ? "deload" : "reps",
      verdict,
      coachFittoVerdictText: verdict === "subir" ? "SUBIR EXIGENCIA (+2 reps)" : verdict === "bajar" ? "BAJAR REPETICIONES (-2 reps)" : "MANTENER Y CONSOLIDAR",
      effortRating: resolvedEffort,
      diagnosis,
      recommendedRest,
      optionA: {
        title: verdict === "subir" ? "Opción A: Subir Repeticiones" : verdict === "bajar" ? "Opción A: Descarga Controlada" : "Opción A: Consolidar Volumen",
        subTitle: `${targetRepsA} reps controladas a RIR 2`,
        scheme: `3 series x ${targetRepsA} reps (${weightSign})`,
        targetWeightKg: lastWeight,
        targetWeightDisplay: targetWeightDisp,
        targetReps: targetRepsA,
        targetSets: 3,
        targetRIR: "RIR 2 (RPE 8)",
        restTime: "2 a 3 min",
        notes: "Detén cada serie con 2 repeticiones en reserva para no volver a llegar al fallo forzado.",
      },
      optionB: {
        title: "Opción B: Top Set + Back-off",
        subTitle: "1 serie pesada + 2 de descarga",
        scheme: `1 x ${maxReps} reps (Top Set) + 2 x ${Math.max(5, targetRepsA - 2)} reps (Back-off)`,
        targetWeightKg: lastWeight,
        targetWeightDisplay: targetWeightDisp,
        targetReps: maxReps,
        targetSets: 3,
        targetRIR: "RIR 1-2 (Top) / RIR 2 (Back-off)",
        restTime: "3 min",
        notes: "Top Set sólida seguida de series sub-máximas con descanso completo.",
        isTopSetStyle: true,
      },
      progressiveOverloadCriteria: "Añade 1-2 repeticiones por serie cuando sientas comodidad (RIR 2+).",
      shortSummary: `Coach Fitto: ${verdict.toUpperCase()} • 3x${targetRepsA} reps (${weightSign})`,
    };
  }

  // ==========================================
  // 3. FUERZA / GYM (BÁSICOS Y AISLAMIENTO)
  // ==========================================
  const hasData = Boolean(personalBest || lastSession);
  const sets = lastSession?.sets || [];
  const peakWeightKg = personalBest?.peso || lastSession?.bestWeight || (exercise.peso ?? 20);
  const peakReps = personalBest?.reps || lastSession?.bestReps || (exercise.reps ?? 10);

  const workingSets = sets.filter((s) => s.peso > 0 && s.reps > 0);

  let setsSummary = "";
  let minReps = peakReps;
  let maxReps = peakReps;
  let hasDrop = false;
  let maxLoggedWeight = peakWeightKg;

  if (workingSets.length > 0) {
    setsSummary = workingSets
      .map((s) => `${formatWeightText(s.peso, unit)} x ${s.reps}`)
      .join(", ");

    maxLoggedWeight = Math.max(...workingSets.map((s) => s.peso));
    const peakWeightSets = workingSets.filter((s) => s.peso >= maxLoggedWeight - 5);
    const repsArr = peakWeightSets.map((s) => s.reps);

    if (repsArr.length > 0) {
      minReps = Math.min(...repsArr);
      maxReps = Math.max(...repsArr);
      const repDrop = repsArr[0] - repsArr[repsArr.length - 1];
      if (peakWeightSets.length >= 2 && repDrop >= 3) {
        hasDrop = true;
      }
    }
  } else if (hasData) {
    setsSummary = `${formatWeightText(peakWeightKg, unit)} x ${peakReps}`;
  } else {
    setsSummary = "Sin sesiones previas registradas";
    minReps = exercise.reps || 10;
    maxReps = minReps;
  }

  // Incremento estándar según unidad y grupo muscular
  let loadIncrementKg: number;
  let loadIncrementDisplay: number;

  if (unit === "lb") {
    loadIncrementDisplay = isLower && maxLoggedWeight >= 60 ? 10 : isCompound ? 5 : 2.5;
    loadIncrementKg = toStoredKg(loadIncrementDisplay, "lb");
  } else {
    loadIncrementKg = isLower && maxLoggedWeight >= 60 ? 5 : isCompound ? 2.5 : 1.25;
    loadIncrementDisplay = loadIncrementKg;
  }

  let verdict: "subir" | "mantener" | "bajar" = "mantener";
  let targetWeightKgA = maxLoggedWeight;
  let targetRepsA = minReps;
  let diagnosis = "";
  let optionATitle = "";
  let optionASubtitle = "";
  let sameWeightOption: CoachFittoOption | undefined = undefined;

  // REGLAS ESPECÍFICAS DE COACH FITTO:
  // 1. Fallo muy temprano / forzado (effortRating === 1 o caída pronunciada que compromete recuperación):
  if (resolvedEffort === 1 || hasDrop) {
    verdict = "bajar";
    targetWeightKgA = Math.max(loadIncrementKg, Math.round((maxLoggedWeight - loadIncrementKg) * 10) / 10);
    targetRepsA = Math.max(6, minReps);
    const targetWText = formatWeightText(targetWeightKgA, unit);
    const prevWText = formatWeightText(maxLoggedWeight, unit);

    diagnosis = `Coach Fitto: En la última sesión alcanzaste un fallo muscular muy temprano y forzado (${setsSummary}) donde ya estabas temblando en las últimas repeticiones. Esto compromete la recuperación y desgasta el músculo de más sin aportar más estímulo. Para tu próxima rutina te indico bajar la carga a ${targetWText} (-${loadIncrementDisplay} ${unit}) para realizar ${targetRepsA} reps con velocidad fluida y técnica perfecta.`;
    optionATitle = `Opción A: Bajar Carga (-${loadIncrementDisplay} ${unit})`;
    optionASubtitle = `Recuperar frescura: ${targetWText} x ${targetRepsA} reps`;
  }
  // 2. Sobraron repeticiones con comodidad (effortRating === 5, o 4 con todas las reps completas):
  else if (resolvedEffort === 5 || (resolvedEffort === 4 && minReps >= (exercise.reps || 10))) {
    verdict = "subir";
    targetWeightKgA = Math.round((maxLoggedWeight + loadIncrementKg) * 10) / 10;
    targetRepsA = Math.max(6, minReps - 2);
    const nextWText = formatWeightText(targetWeightKgA, unit);

    diagnosis = `Coach Fitto: ¡Gran demostración de fuerza! En tus series (${setsSummary}) sentías que podías hacer 2 o más repeticiones con total comodidad. Como tienes margen sobrado, en tu próxima rutina te indico subir la carga a ${nextWText} (+${loadIncrementDisplay} ${unit}) iniciando en ${targetRepsA} reps para seguir impulsando la hipertrofia.`;
    optionATitle = `Opción A: Subir Carga (+${loadIncrementDisplay} ${unit})`;
    optionASubtitle = `Sobrecarga progresiva: ${nextWText} x ${targetRepsA} reps`;

    const sameWeightTargetReps = Math.min(15, maxReps + 1);
    sameWeightOption = {
      title: `Mantener Peso (+Reps)`,
      subTitle: `Consolidar con ${formatWeightText(maxLoggedWeight, unit)}`,
      scheme: `3 series x ${sameWeightTargetReps} reps con ${formatWeightText(maxLoggedWeight, unit)}`,
      targetWeightKg: maxLoggedWeight,
      targetWeightDisplay: toDisplayWeight(maxLoggedWeight, unit),
      targetReps: sameWeightTargetReps,
      targetSets: 3,
      targetRIR: "RIR 1-2",
      restTime: recommendedRest,
      notes: "Si prefieres no subir kilos hoy, busca +1 repetición.",
    };
  }
  // 3. Cerca del límite sin quemarse (effortRating === 2 o 3, o series estándar):
  else {
    verdict = "mantener";
    targetWeightKgA = maxLoggedWeight;
    targetRepsA = Math.max(minReps + 1, maxReps);
    const curWText = formatWeightText(maxLoggedWeight, unit);

    diagnosis = `Coach Fitto: Estuviste cerca del límite sin quemarte (${setsSummary}), terminando tus series con la dificultad adecuada (RIR 1-2). Te sugiero mantener el peso en ${curWText} para consolidar la adaptación neuromuscular antes de subir la carga.`;
    optionATitle = `Opción A: Mantener Peso (+1 Rep)`;
    optionASubtitle = `Consolidar ${curWText} buscando ${targetRepsA} reps`;
  }

  const targetWeightDisplayA = toDisplayWeight(targetWeightKgA, unit);
  const weightTextA = formatWeightText(targetWeightKgA, unit);

  // Opción B: Top Set + Back-off
  let topSetWeightKg = maxLoggedWeight;
  let topSetReps = Math.max(4, Math.min(6, maxReps - 2));

  if (verdict === "subir") {
    topSetWeightKg = targetWeightKgA;
    topSetReps = Math.max(4, Math.min(6, targetRepsA - 2));
  } else if (verdict === "bajar") {
    topSetWeightKg = targetWeightKgA;
  }

  const topSetWeightDisplay = toDisplayWeight(topSetWeightKg, unit);
  const backOffWeightKg = Math.round(topSetWeightKg * 0.88 * 10) / 10;
  const backOffWeightDisplay = toDisplayWeight(backOffWeightKg, unit);
  const backOffReps = Math.min(12, topSetReps + 3);

  const weightTopText = formatWeightText(topSetWeightKg, unit);
  const weightBackOffText = formatWeightText(backOffWeightKg, unit);

  return {
    exerciseId: exercise.id,
    exerciseName: exercise.nombre,
    category: "Gym",
    isCompound,
    unit,
    lastSessionSetsSummary: setsSummary,
    bestWeightKg: peakWeightKg,
    bestReps: peakReps,
    hasPreviousData: hasData,
    hasNeuralFatigue: hasDrop || resolvedEffort === 1,
    progressionType: verdict === "subir" ? "load" : verdict === "bajar" ? "deload" : "reps",
    verdict,
    coachFittoVerdictText: verdict === "subir" ? `SUBIR PESO (+${loadIncrementDisplay} ${unit})` : verdict === "bajar" ? `BAJAR PESO (-${loadIncrementDisplay} ${unit})` : `MANTENER PESO (${weightTextA})`,
    effortRating: resolvedEffort,
    diagnosis,
    recommendedRest,
    optionA: {
      title: optionATitle,
      subTitle: optionASubtitle,
      scheme: `3 series x ${targetRepsA} reps con ${weightTextA}`,
      targetWeightKg: targetWeightKgA,
      targetWeightDisplay: targetWeightDisplayA,
      targetReps: targetRepsA,
      targetSets: 3,
      targetRIR: "RIR 2 (RPE 8)",
      restTime: recommendedRest,
      notes: verdict === "bajar"
        ? "Carga reducida para priorizar velocidad, técnica limpia y recuperación."
        : verdict === "subir"
          ? "Aumento de carga por margen de fuerza disponible."
          : "Mantén el peso para consolidar la adaptación antes de subir.",
    },
    optionB: {
      title: "Opción B: Top Set + Back-off Sets",
      subTitle: "1 serie pesada + 2 series de descarga para volumen limpio",
      scheme: `1x${topSetReps} @ ${weightTopText} (Top Set) + 2x${backOffReps} @ ${weightBackOffText} (Back-off -12%)`,
      targetWeightKg: topSetWeightKg,
      targetWeightDisplay: topSetWeightDisplay,
      targetReps: topSetReps,
      targetSets: 3,
      targetRIR: "RIR 1-2 (Top) / RIR 2 (Back-off)",
      restTime: recommendedRest,
      notes: "Top Set de alta tensión mecánica seguida de 2 series de descarga al -12% para acumular volumen sin fatiga excesiva.",
      isTopSetStyle: true,
      topSet: {
        weightKg: topSetWeightKg,
        weightDisplay: topSetWeightDisplay,
        reps: topSetReps,
        rir: "RIR 1-2 (RPE 8-9)",
        restTime: recommendedRest,
      },
      backOffSet: {
        weightKg: backOffWeightKg,
        weightDisplay: backOffWeightDisplay,
        reps: backOffReps,
        setsCount: 2,
        rir: "RIR 2 (RPE 8)",
        restTime: recommendedRest,
        reductionPercent: 12.5,
      },
    },
    sameWeightOption,
    progressiveOverloadCriteria: "Evalúa cada serie con la escala de Coach Fitto para calibrar si subir, mantener o bajar.",
    shortSummary: `Coach Fitto: ${verdict.toUpperCase()} • 3x${targetRepsA} @ ${weightTextA}`,
  };
};

// Alias de retrocompatibilidad
export const calculateRIRPrescription = calculateCoachFittoPrescription;

/**
 * Consulta a Gemini con el prompt oficial de Coach Fitto solicitado por el usuario.
 */
export const getGeminiCoachFittoPrescription = async (
  exercise: ExerciseCatalogOrRoutineItem | any,
  lastSession: ExerciseHistory | null | undefined,
  personalBest: { peso: number; reps: number; timeMinutes?: number; intensity?: string } | null | undefined,
  unit: WeightUnit = "kg",
  effortRating?: EffortRating
): Promise<string | null> => {
  const aiConfig = await getAIConfig();
  const apiKey = aiConfig.apiKey?.trim() || process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) return null;

  const setsSummary =
    lastSession?.sets && lastSession.sets.length > 0
      ? lastSession.sets.map((s, idx) => `Serie ${idx + 1}: ${formatWeightText(s.peso, unit)} x ${s.reps} reps`).join(", ")
      : personalBest
        ? `${formatWeightText(personalBest.peso, unit)} x ${personalBest.reps} reps`
        : "Sin datos previos";

  const resolvedEffort = effortRating || lastSession?.effortRating;
  const effortText = resolvedEffort
    ? `Nivel ${resolvedEffort}/5 (${EFFORT_LEVELS[resolvedEffort].title} - "${EFFORT_LEVELS[resolvedEffort].description}")`
    : "No especificado";

  // PROMPT OFICIAL DE COACH FITTO
  const prompt = `Actúa como coach de FitterMe (Coach Fitto). Con base en el peso, repeticiones y sensación de esfuerzo de mis 3 series (si llegué al fallo muscular o sentía que podía hacer más), dime si en la próxima rutina debo subir, mantener o bajar el peso. Si alcancé un fallo muy temprano o forzado que comprometa la recuperación y desgaste el músculo de más, indícame bajar la carga; si me sobraron repeticiones con comodidad, indícame subirla; y si estuve cerca del límite sin quemarme, sugiéreme mantener el peso para consolidar. Responde de forma breve y motivadora con la recomendación para la siguiente sesión.

### DATOS DE MI SESIÓN:
- Ejercicio: ${exercise.nombre} (${exercise.musculo || "Músculo principal"})
- Series realizadas: ${setsSummary} (Unidad: ${unit})
- Sensación de esfuerzo reportada: ${effortText}

### REGLAS DE RESPUESTA:
1. Comienza con un saludo breve y cercano como "Coach Fitto de FitterMe".
2. Da el veredicto explícito en negrita: **[SUBIR PESO]**, **[MANTENER PESO]** o **[BAJAR CARGA]**.
3. Explica el porqué en 2-3 oraciones concisas y motivadoras basándote en la fatiga o reserva de fuerza.
4. Prescribe los números exactos para la próxima sesión (Series x Reps x Peso estimado).`;

  try {
    const model = aiConfig.model || "gemini-2.5-flash";
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    }
  } catch (e) {
    console.warn("Error consultando Gemini Coach Fitto:", e);
  }
  return null;
};

// Alias de retrocompatibilidad
export const getGeminiCoachPrescription = getGeminiCoachFittoPrescription;
