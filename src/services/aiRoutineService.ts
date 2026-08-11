import exercisesData from "@/data/exercises.json";
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

  // Si no hay suficientes, seleccionar por al menos un músculo
  const candidatePool =
    availableExercises.length > 0 ? availableExercises : exercisesData;

  // Seleccionar de 4 a 6 ejercicios balanceados
  const selectedCandidates: typeof candidatePool = [];
  const muscleGroupsMap: Record<string, number> = {};

  for (const ex of candidatePool) {
    const count = muscleGroupsMap[ex.musculo] || 0;
    if (count < 2 && selectedCandidates.length < 6) {
      selectedCandidates.push(ex);
      muscleGroupsMap[ex.musculo] = count + 1;
    }
  }

  // Si aún faltan para completar al menos 4 ejercicios:
  for (const ex of candidatePool) {
    if (selectedCandidates.length >= 5) break;
    if (!selectedCandidates.some((item) => item.id === ex.id)) {
      selectedCandidates.push(ex);
    }
  }

  // Procesar cada ejercicio analizando el historial y calculando sobrecarga progresiva IA
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
      // Hipertrofia
      targetSeries = 3;
      targetReps = 10;
    }

    if (pb && pb.peso > 0) {
      // Si existe récord previo -> Calcular Sobrecarga Progresiva con IA (+2.5% a +5% de incremento)
      const increment = pb.peso >= 50 ? 5 : 2.5;
      targetPeso = Math.round(pb.peso + increment);
      note = `Sobrecarga Progresiva IA: +${increment} kg sobre tu récord anterior (${pb.peso} kg x ${pb.reps} reps)`;
    } else {
      // Si no existe historial -> Sugerencia de peso base inicial por tipo de equipamiento
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

  // Generar título descriptivo de la rutina
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
