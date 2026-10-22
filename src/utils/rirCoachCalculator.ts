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
import { ExerciseHistory, ExerciseSet } from "@/store/historyExcercise";

export interface RIRPrescriptionOption {
  title: string;
  subTitle: string;
  scheme: string; // ej. "3 x 8 reps con 140 kg"
  targetWeightKg: number;
  targetWeightDisplay: number;
  targetReps: number;
  targetSets: number;
  targetRIR: string; // ej. "RIR 2 (RPE 8)"
  restTime: string; // ej. "3 a 5 min"
  notes: string;
  // Para Top Set + Back-off
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

export interface RIRCoachPrescription {
  exerciseId: number;
  exerciseName: string;
  category: "Gym" | "Cardio" | "Peso corporal";
  isCompound: boolean;
  unit: WeightUnit;
  lastSessionSetsSummary: string; // ej: "140 kg x 10, 140 kg x 8, 140 kg x 6"
  bestWeightKg: number;
  bestReps: number;
  hasPreviousData: boolean;
  hasNeuralFatigue: boolean;
  progressionType?: "load" | "reps" | "fatigue" | "calibrate";
  diagnosis: string;
  recommendedRest: string;
  optionA: RIRPrescriptionOption;
  optionB: RIRPrescriptionOption;
  sameWeightOption?: RIRPrescriptionOption; // Opción alternativa para mantener peso y subir reps
  progressiveOverloadCriteria: string;
  shortSummary: string; // Para mostrar en el encabezado del ejercicio
}

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
export const isLowerBodyCompound = (name: string): boolean => {
  const n = (name || "").toLowerCase();
  return (
    n.includes("sentadilla") ||
    n.includes("squat") ||
    n.includes("peso muerto") ||
    n.includes("deadlift") ||
    n.includes("prensa") ||
    n.includes("leg press") ||
    n.includes("hack") ||
    n.includes("thrust")
  );
};

/**
 * Calcula la prescripción RIR / RPE del Coach de Fuerza con SOBRECARGA PROGRESIVA real
 * basada en la metodología de Doble Progresión (Double Progression) y autorregulación.
 */
export const calculateRIRPrescription = (
  exercise: ExerciseCatalogItem & { series?: number; reps?: number; peso?: number },
  lastSession: ExerciseHistory | null | undefined,
  personalBest: { peso: number; reps: number; timeMinutes?: number; intensity?: string } | null | undefined,
  unit: WeightUnit = "kg"
): RIRCoachPrescription => {
  const category = getExerciseCategory(exercise);
  const isCardio = isCardioExercise(exercise);
  const isBodyweight = isBodyweightExercise(exercise);
  const isCompound = isCompoundMovement(exercise.nombre);
  const isLower = isLowerBodyCompound(exercise.nombre);

  const recommendedRest = isCardio
    ? "60 a 90 seg entre intervalos"
    : isCompound
      ? "3 a 5 min (fuerza en básicos / recuperación de ATP-PC)"
      : "2 a 3 min (aislamiento controlado)";

  // ==========================================
  // 1. CARDIO
  // ==========================================
  if (isCardio) {
    const lastMinutes = personalBest?.timeMinutes || (lastSession?.sets?.[0]?.timeMinutes) || 15;
    const lastIntensity = personalBest?.intensity || (lastSession?.sets?.[0]?.intensity) || "Moderada";
    const nextMinutes = lastMinutes + 5;

    return {
      exerciseId: exercise.id,
      exerciseName: exercise.nombre,
      category: "Cardio",
      isCompound: false,
      unit,
      lastSessionSetsSummary: `${lastMinutes} min (${lastIntensity})`,
      bestWeightKg: 0,
      bestReps: lastMinutes,
      hasPreviousData: Boolean(personalBest || lastSession),
      hasNeuralFatigue: false,
      progressionType: "load",
      diagnosis:
        lastSession || personalBest
          ? `Sesión aeróbica previa registrada: ${lastMinutes} min @ ${lastIntensity}. Aplicamos sobrecarga en duración (+5 min) manteniendo control aeróbico.`
          : "Sin registro previo de cardio. Comenzamos con adaptación aeróbica sub-máxima.",
      recommendedRest: "60-90 seg entre bloques",
      optionA: {
        title: "Opción A: Ritmo Continuo (+5 min)",
        subTitle: "Capacidad aeróbica en progresión continua (RIR aeróbico 2)",
        scheme: `${nextMinutes} min a intensidad Moderada`,
        targetWeightKg: 0,
        targetWeightDisplay: 0,
        targetReps: nextMinutes,
        targetSets: 1,
        targetRIR: "RPE 6-7 (puedes hablar)",
        restTime: "Continuo",
        notes: "Añade 5 min al tiempo anterior manteniendo respiración nasal y cadencia fluida.",
      },
      optionB: {
        title: "Opción B: Intervalos HIIT (Potencia)",
        subTitle: "Intervalos fraccionados de mayor potencia aeróbica",
        scheme: `4 bloques x 5 min a intensidad Alta (RIR 2)`,
        targetWeightKg: 0,
        targetWeightDisplay: 0,
        targetReps: 5,
        targetSets: 4,
        targetRIR: "RPE 8 (esfuerzo intenso controlado)",
        restTime: "90 seg entre bloques",
        notes: "Alterna 5 min intensos con 90 segundos de recuperación activa.",
      },
      progressiveOverloadCriteria:
        "Añade 3-5 minutos por sesión o pasa al siguiente nivel de intensidad cuando termines sin fatiga excesiva.",
      shortSummary: `Coach: ${nextMinutes} min @ Moderada o 4x5m HIIT (RIR 2)`,
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
    let repDrop = 0;

    if (sets.length > 0) {
      setsSummary = sets.map((s) => `${s.reps} reps`).join(" → ");
      const repsArr = sets.map((s) => s.reps);
      minReps = Math.min(...repsArr);
      maxReps = Math.max(...repsArr);
      repDrop = repsArr[0] - repsArr[repsArr.length - 1];
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

    let progressionType: "load" | "reps" | "fatigue" | "calibrate" = "reps";
    let targetRepsA = minReps;
    let diagnosis = "";

    if (!hasData) {
      progressionType = "calibrate";
      targetRepsA = Math.max(5, exercise.reps || 8);
      diagnosis = "Primera sesión de calistenia registrada. Esquema de calibración sub-máxima en RIR 2 para evaluar tu resistencia.";
    } else if (hasDrop) {
      progressionType = "fatigue";
      targetRepsA = Math.max(5, Math.floor((minReps + maxReps) / 2));
      diagnosis = `Fatiga pronunciada observada (${setsSummary}). Ir al fallo en las primeras series provocó una caída de ${repDrop} reps. Ajustamos a repeticiones parejas sostenibles (${targetRepsA} reps) a RIR 2 para maximizar volumen limpio.`;
    } else {
      // Progresión en repeticiones: ¡siempre avanzar +1 rep, NUNCA retroceder!
      progressionType = "reps";
      targetRepsA = minReps + 1;
      diagnosis = `¡Excelente consistencia neuromuscular (${setsSummary})! Aplicamos sobrecarga progresiva buscando +1 repetición por serie (${targetRepsA} reps) manteniendo RIR 2 limpio.`;
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
      hasNeuralFatigue: hasDrop,
      progressionType,
      diagnosis,
      recommendedRest,
      optionA: {
        title: progressionType === "fatigue" ? "Opción A: Series Sostenibles (Control Fatiga)" : "Opción A: Sobrecarga en Reps (+1 Rep)",
        subTitle: progressionType === "fatigue" ? "Volumen limpio sin llegar al fallo prematuro" : "Mismo peso, +1 repetición para aumentar volumen total",
        scheme: `3 series x ${targetRepsA} reps (${weightSign})`,
        targetWeightKg: lastWeight,
        targetWeightDisplay: targetWeightDisp,
        targetReps: targetRepsA,
        targetSets: 3,
        targetRIR: "RIR 2 (RPE 8)",
        restTime: "2 a 3 min",
        notes: "Detén la serie cuando sientas que te quedan 2 repeticiones antes del fallo técnico.",
      },
      optionB: {
        title: "Opción B: Top Set + Back-off",
        subTitle: minReps >= 10 ? "1 Top Set con lastre (+2.5 kg) o máx reps + series de descarga" : "1 serie de máxima tensión técnica + series de descarga",
        scheme: `1 x ${maxReps} reps (Top Set RIR 1-2) + 2 x ${Math.max(5, targetRepsA - 2)} reps (Back-off)`,
        targetWeightKg: lastWeight,
        targetWeightDisplay: targetWeightDisp,
        targetReps: maxReps,
        targetSets: 3,
        targetRIR: "RIR 1-2 (Top) / RIR 2 (Back-off)",
        restTime: "3 min",
        notes: "Top Set sólida seguida de 2 series sub-máximas con descanso completo.",
        isTopSetStyle: true,
        topSet: {
          weightKg: lastWeight,
          weightDisplay: targetWeightDisp,
          reps: maxReps,
          rir: "RIR 1-2",
          restTime: "3 min",
        },
        backOffSet: {
          weightKg: lastWeight,
          weightDisplay: targetWeightDisp,
          reps: Math.max(5, targetRepsA - 2),
          setsCount: 2,
          rir: "RIR 2",
          restTime: "2 a 3 min",
          reductionPercent: 15,
        },
      },
      progressiveOverloadCriteria:
        "Añade 1 repetición por serie cuando completes las 3 series en RIR 2. Al superar las 12-15 reps limpias, añade lastre (+1.25 a +2.5 kg).",
      shortSummary: `Coach: 3x${targetRepsA} reps (${weightSign}) • RIR 2`,
    };
  }

  // ==========================================
  // 3. FUERZA / GYM (Básicos y Aislamiento)
  // ==========================================
  const hasData = Boolean(personalBest || lastSession);
  const sets = lastSession?.sets || [];
  const peakWeightKg = personalBest?.peso || lastSession?.bestWeight || (exercise.peso ?? 20);
  const peakReps = personalBest?.reps || lastSession?.bestReps || (exercise.reps ?? 10);

  // Filtrar series de trabajo (peso > 0 y reps > 0)
  const workingSets = sets.filter((s) => s.peso > 0 && s.reps > 0);

  let setsSummary = "";
  let minReps = peakReps;
  let maxReps = peakReps;
  let hasDrop = false;
  let repDrop = 0;
  let maxLoggedWeight = peakWeightKg;

  if (workingSets.length > 0) {
    setsSummary = workingSets
      .map((s) => `${formatWeightText(s.peso, unit)} x ${s.reps}`)
      .join(", ");

    maxLoggedWeight = Math.max(...workingSets.map((s) => s.peso));
    // Analizar series realizadas cerca del peso pico (para no confundir calentamientos con caídas)
    const peakWeightSets = workingSets.filter((s) => s.peso >= maxLoggedWeight - 5);
    const repsArr = peakWeightSets.map((s) => s.reps);

    if (repsArr.length > 0) {
      minReps = Math.min(...repsArr);
      maxReps = Math.max(...repsArr);
      repDrop = repsArr[0] - repsArr[repsArr.length - 1];
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

  // Determinar incremento de peso según tipo de ejercicio y unidad
  let loadIncrementKg: number;
  let loadIncrementDisplay: number;

  if (unit === "lb") {
    loadIncrementDisplay = isLower && maxLoggedWeight >= 60 ? 10 : isCompound ? 5 : 2.5;
    loadIncrementKg = toStoredKg(loadIncrementDisplay, "lb");
  } else {
    loadIncrementKg = isLower && maxLoggedWeight >= 60 ? 5 : isCompound ? 2.5 : 1.25;
    loadIncrementDisplay = loadIncrementKg;
  }

  // Umbral objetivo de repeticiones para autorizar subida de carga
  // Si la rutina especifica reps (ej. 10 o 12), usamos esa meta.
  // Si no, umbral estándar de hipertrofia: 12 reps para aislamiento / torso, 10 para pierna/compuestos pesados.
  const routineTargetReps = exercise.reps && exercise.reps > 0 ? exercise.reps : null;
  const upperRepThreshold = routineTargetReps
    ? routineTargetReps
    : isCompound
      ? peakReps <= 6
        ? 6
        : peakReps <= 10
          ? 10
          : 12
      : 12;

  // ¿Califica para aumento de carga (+peso)?
  // Si completó sus series efectivas alcanzando o superando el umbral de repeticiones sin caída de reps
  const peakWorkingSets = workingSets.filter((s) => s.peso >= maxLoggedWeight - 5);
  const canIncreaseWeight =
    hasData &&
    !hasDrop &&
    (
      (routineTargetReps && minReps >= routineTargetReps && peakWorkingSets.length >= 2) ||
      (!routineTargetReps && minReps >= upperRepThreshold && peakWorkingSets.length >= 2) ||
      // Si hizo una sola serie registrada y superó ampliamente el umbral
      (peakWorkingSets.length <= 1 && maxReps >= upperRepThreshold)
    );

  let progressionType: "load" | "reps" | "fatigue" | "calibrate" = "reps";
  let diagnosis = "";
  let targetWeightKgA = maxLoggedWeight;
  let targetWeightDisplayA = toDisplayWeight(targetWeightKgA, unit);
  let targetRepsA = minReps;
  let optionATitle = "Opción A: Series Fijas (Straight Sets)";
  let optionASubtitle = "Mismo peso, repeticiones sub-máximas constantes para volumen limpio";
  let sameWeightOption: RIRPrescriptionOption | undefined = undefined;

  if (!hasData) {
    progressionType = "calibrate";
    targetWeightKgA = exercise.peso || 20;
    targetWeightDisplayA = toDisplayWeight(targetWeightKgA, unit);
    targetRepsA = exercise.reps || 10;
    diagnosis =
      "Primera sesión registrada para este ejercicio. Prescribimos un esquema inicial de calibración sub-máxima en RIR 2-3 para asentar el patrón de movimiento de forma segura.";
    optionATitle = "Opción A: Calibración Sub-máxima";
    optionASubtitle = "Esquema inicial controlado para fijar técnica";
  } else if (hasDrop) {
    // Caso Fatiga Neural Severa: Caída de 3+ repeticiones entre series
    progressionType = "fatigue";
    targetWeightKgA = maxLoggedWeight;
    targetWeightDisplayA = toDisplayWeight(targetWeightKgA, unit);
    // Prescribir repeticiones sostenibles para que la serie 1 no destruya las series posteriores
    targetRepsA = Math.max(5, Math.round(peakWorkingSets.reduce((a, b) => a + b.reps, 0) / peakWorkingSets.length));
    diagnosis = `Fatiga neural pronunciada observada en la última sesión (${setsSummary}). Ir al fallo absoluto (RIR 0) en las primeras series comprometió el SNC y causó una caída de ${repDrop} repeticiones. Ajustamos a ${targetRepsA} repeticiones parejas sostenibles a RIR 2 para lograr mayor volumen total neto sin fatiga residual.`;
    optionATitle = "Opción A: Series Sostenibles (Control Fatiga)";
    optionASubtitle = "Repeticiones parejas sin fallo prematuro para volumen neto superior";
  } else if (canIncreaseWeight) {
    // Caso SOBRECARGA EN CARGA (+PESO / DOBLE PROGRESIÓN)
    // El usuario completó todas las reps (ej. 60 kg x 12 en 3 series).
    progressionType = "load";
    targetWeightKgA = Math.round((maxLoggedWeight + loadIncrementKg) * 10) / 10;
    targetWeightDisplayA = toDisplayWeight(targetWeightKgA, unit);

    // Al subir carga, el rango de repeticiones se reinicia a la base del rango (ej. de 12 pasa a 10 reps)
    targetRepsA = Math.max(6, Math.min(minReps, minReps - 2));

    const nextWeightText = formatWeightText(targetWeightKgA, unit);
    const prevWeightText = formatWeightText(maxLoggedWeight, unit);

    diagnosis = `🎯 ¡Objetivo dominado en la sesión previa (${setsSummary})! Completaste todas tus series a ${minReps} reps. Aplicamos Sobrecarga Progresiva (Doble Progresión): subimos la carga a ${nextWeightText} para ${targetRepsA} reps a RIR 2.`;
    optionATitle = `Opción A: Subir Carga (+${loadIncrementDisplay} ${unit})`;
    optionASubtitle = `Sobrecarga progresiva: ${nextWeightText} x ${targetRepsA} reps (RIR 2)`;

    // Opción alternativa por si el usuario prefiere no subir carga y consolidar repeticiones (+reps)
    const sameWeightTargetReps = Math.min(15, maxReps + 1);
    sameWeightOption = {
      title: `Mantener Peso (+Reps)`,
      subTitle: `Consolidar con ${prevWeightText} buscando +1 rep`,
      scheme: `3 series x ${sameWeightTargetReps} reps con ${prevWeightText}`,
      targetWeightKg: maxLoggedWeight,
      targetWeightDisplay: toDisplayWeight(maxLoggedWeight, unit),
      targetReps: sameWeightTargetReps,
      targetSets: 3,
      targetRIR: "RIR 1-2 (RPE 8-9)",
      restTime: recommendedRest,
      notes: `Si prefieres mantener ${prevWeightText} hoy, busca alcanzar ${sameWeightTargetReps} reps en tu primera serie para superar tu marca anterior.`,
    };
  } else {
    // Caso SOBRECARGA EN REPETICIONES (+REPS CON EL MISMO PESO)
    // El usuario tuvo rendimiento consistente pero aún está subiendo reps (ej. 10, 10, 9 o 8, 8, 8)
    progressionType = "reps";
    targetWeightKgA = maxLoggedWeight;
    targetWeightDisplayA = toDisplayWeight(targetWeightKgA, unit);
    // Buscar +1 repetición sobre la mínima de la sesión anterior
    targetRepsA = Math.max(minReps + 1, maxReps);

    diagnosis = `Buen control neuromuscular en la sesión previa (${setsSummary}). Aplicamos sobrecarga en repeticiones: mantenemos ${formatWeightText(maxLoggedWeight, unit)} y buscamos ${targetRepsA} reps constantes por serie a RIR 2 para consolidar volumen antes de subir peso.`;
    optionATitle = `Opción A: Sobrecarga en Reps (+1 Rep)`;
    optionASubtitle = `Mismo peso, buscando ${targetRepsA} reps para seguir construyendo volumen`;
  }

  // ==========================================
  // CONFIGURACIÓN DE OPCIÓN B: TOP SET + BACK-OFF
  // ==========================================
  let topSetWeightKg = maxLoggedWeight;
  let topSetReps = Math.max(4, Math.min(6, maxReps - 2));

  // Si califica para aumento de carga, el Top Set testea la nueva carga
  if (canIncreaseWeight) {
    topSetWeightKg = targetWeightKgA;
    topSetReps = Math.max(4, Math.min(6, targetRepsA - 2));
  }

  const topSetWeightDisplay = toDisplayWeight(topSetWeightKg, unit);

  // Back-off a -12.5% de descarga respecto a la serie pesada
  const backOffReduction = 0.125;
  const backOffWeightKg = Math.round((topSetWeightKg * (1 - backOffReduction)) * 2) / 2;
  const backOffWeightDisplay = toDisplayWeight(backOffWeightKg, unit);
  const backOffReps = Math.max(8, targetRepsA + 1);

  const weightTextA = formatWeightText(targetWeightKgA, unit);
  const weightTopText = formatWeightText(topSetWeightKg, unit);
  const weightBackOffText = formatWeightText(backOffWeightKg, unit);

  const progressiveStepText = isLower && maxLoggedWeight >= 60
    ? unit === "lb" ? "+10 lb" : "+5 kg"
    : isCompound
      ? unit === "lb" ? "+5 lb" : "+2.5 kg"
      : unit === "lb" ? "+2.5 lb" : "+1.25 kg";

  const overloadCriteria = canIncreaseWeight
    ? `¡Criterio de sobrecarga alcanzado! Sube carga a ${weightTextA} para ${targetRepsA} reps. Cuando logres completar todas las series en ${upperRepThreshold} reps con RIR 2, vuelve a subir ${progressiveStepText}.`
    : `Consolida todas tus series a ${upperRepThreshold} reps manteniendo al menos RIR 2. Al completar todas las series con técnica limpia, desbloquearás el aumento de peso (${progressiveStepText}).`;

  let shortSummaryText = "";
  if (progressionType === "load") {
    shortSummaryText = `Coach RIR: 3x${targetRepsA} con ${weightTextA} (+${loadIncrementDisplay} ${unit}) • RIR 2`;
  } else if (progressionType === "reps") {
    shortSummaryText = `Coach RIR: 3x${targetRepsA} con ${weightTextA} (+1 rep) • RIR 2`;
  } else if (progressionType === "fatigue") {
    shortSummaryText = `Coach RIR: 3x${targetRepsA} con ${weightTextA} (Control fatiga) • RIR 2`;
  } else {
    shortSummaryText = `Coach RIR: 3x${targetRepsA} con ${weightTextA} (Calibración) • RIR 2`;
  }

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
    hasNeuralFatigue: hasDrop,
    progressionType,
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
      notes: canIncreaseWeight
        ? `Subida de carga de ${formatWeightText(maxLoggedWeight, unit)} a ${weightTextA}. Mantén 2 repeticiones en reserva para construir volumen hasta alcanzar ${upperRepThreshold} reps.`
        : "Realiza todas las series con carga controlada. Deja 2 repeticiones en reserva.",
    },
    optionB: {
      title: "Opción B: Top Set + Back-off Sets",
      subTitle: "1 serie pesada de estímulo neuromuscular + descarga para volumen limpio",
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
    progressiveOverloadCriteria: overloadCriteria,
    shortSummary: shortSummaryText,
  };
};

/**
 * Consulta a Gemini si hay una API Key configurada para obtener un análisis conversacional profundo.
 */
export const getGeminiCoachPrescription = async (
  exercise: ExerciseCatalogItem,
  lastSession: ExerciseHistory | null | undefined,
  personalBest: { peso: number; reps: number; timeMinutes?: number; intensity?: string } | null | undefined,
  unit: WeightUnit = "kg"
): Promise<string | null> => {
  const aiConfig = await getAIConfig();
  const apiKey = aiConfig.apiKey?.trim() || process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) return null;

  const setsSummary =
    lastSession?.sets && lastSession.sets.length > 0
      ? lastSession.sets.map((s) => `${formatWeightText(s.peso, unit)} x ${s.reps}`).join(", ")
      : personalBest
        ? `${formatWeightText(personalBest.peso, unit)} x ${personalBest.reps}`
        : "Sin datos previos";

  const prompt = `Eres un entrenador de fuerza y preparador físico de élite, experto en autorregulación y biomecánica (metodologías RPE/RIR y sobrecarga progresiva).

Tu misión es calcular y prescribir una sesión óptima para la próxima sesión que asegure SOBRECARGA PROGRESIVA constante, sin generar estancamiento ni retrocesos de rendimiento.

### PRINCIPIOS CRÍTICOS DE SOBRECARGA PROGRESIVA (DOUBLE PROGRESSION):
1. **PROGRESO, NO RETROCESO**: Si el atleta completó con éxito sus series previas con repeticiones parejas (ej. 60 kg x 12 en 3 series), NUNCA prescribas menos repeticiones con el mismo peso (ej. 60 kg x 10 es un retroceso inadmisible).
2. **CRITERIO DE SUBIDA DE CARGA**: Si completó las repeticiones objetivo (ej. 10-12 reps limpias en sus series), la prescripción principal es SUBIR PESO (+1 a +2.5 kg en torso/aislamiento, +2.5 a +5 kg en pierna) y reiniciar las repeticiones al rango base (ej. 8-10 reps) a RIR 2.
3. **CRITERIO DE SOBRECARGA EN REPETICIONES**: Si el atleta aún está en camino al tope del rango (ej. 10, 10, 9 o 8, 8, 8), prescribe el MISMO peso buscando +1 repetición en sus series (ej. 10 reps o 9 reps a RIR 2).
4. **FATIGA NEURAL SEVERA**: ÚNICAMENTE si observas una caída pronunciada de 3 o más repeticiones entre series (ej. 12 -> 8 -> 5 con el mismo peso), diagnostica que el atleta fue al fallo absoluto (RIR 0) en la serie 1 y ajusta a repeticiones constantes sostenibles a RIR 2 para elevar el volumen neto total.
5. El rango objetivo para trabajo de hipertrofia y fuerza limpia siempre debe ser RIR 1-3 (RPE 7-9), evitando el fallo técnico.

---

### DATOS DEL ATLETA:
- Ejercicio: ${exercise.nombre} (${exercise.musculo || "Cuerpo completo"}, Equipamiento: ${exercise.equipamiento})
- Última sesión o récord registrado: ${setsSummary} (Unidad preferida: ${unit})
- Objetivo principal: Ganancia de masa muscular y fuerza mediante sobrecarga progresiva
- Frecuencia semanal del movimiento: 2 veces por semana

---

### FORMATO DE RESPUESTA:
1. **Diagnóstico Breve**: Evalúa la sesión anterior e identifica si corresponde subir peso o añadir repeticiones.
2. **Prescripción para la Siguiente Sesión**:
   - Opción Principal: Series x Repeticiones x Carga a RIR objetivo.
   - Opción Alternativa (Top Set + Back-off o Mismo peso +Reps).
   - Descanso recomendado entre series.
3. **Pauta de Progresión**: Criterio exacto para la siguiente semana.

Sé conciso, motivador y profesional como un entrenador de clase mundial. Responde directamente en texto markdown bien formateado.`;

  try {
    const model = aiConfig.model || "gemini-3.5-flash";
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
    console.warn("Error consultando Gemini Coach:", e);
  }
  return null;
};
