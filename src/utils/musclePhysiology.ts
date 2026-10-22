import { Measure } from "@/store/measures";

/**
 * Calcula el porcentaje de grasa corporal utilizando la fórmula de la Marina de EE.UU. (US Navy Method)
 */
export const calculateNavyBodyFat = (datos: Partial<Measure>): number => {
  if (!datos) return 15;
  const esHombre = (datos.sexo || "masculino").toLowerCase() === "masculino";
  const alturaCm = datos.altura || 175;
  const cuello = datos.cuello || 0;
  const cintura = datos.cintura || 0;
  const cadera = datos.cadera || 0;

  let pctGrasa = esHombre ? 15 : 22;

  if (cuello > 0 && cintura > 0) {
    if (esHombre && cintura > cuello) {
      pctGrasa =
        86.01 * Math.log10(cintura - cuello) -
        70.041 * Math.log10(alturaCm) +
        36.76;
    } else if (!esHombre && cadera > 0 && cintura + cadera > cuello) {
      pctGrasa =
        163.205 * Math.log10(cintura + cadera - cuello) -
        97.684 * Math.log10(alturaCm) -
        78.387;
    }
  }

  return Math.max(5, Math.min(50, parseFloat(pctGrasa.toFixed(1))));
};

// Potencial muscular natural máximo de referencia para una altura de 175 cm (en cm)
const BASE_POTENTIAL_MALE: Partial<Record<keyof Measure, number>> = {
  biceps: 42.5,
  pecho: 116.0,
  espalda: 118.0,
  hombros: 128.0,
  antebrazo: 33.5,
  cuadriceps: 64.0,
  gemelos: 41.0,
  gluteos: 104.0,
  cuello: 42.0,
};

const BASE_POTENTIAL_FEMALE: Partial<Record<keyof Measure, number>> = {
  biceps: 32.5,
  pecho: 96.0,
  espalda: 98.0,
  hombros: 108.0,
  antebrazo: 26.0,
  cuadriceps: 58.0,
  gemelos: 36.0,
  gluteos: 102.0,
  cuello: 35.0,
};

/**
 * Calcula el potencial muscular máximo adaptado para una persona según su altura, edad, sexo y grasa.
 */
export const calculateMuscleMaxPotential = (
  field: keyof Measure,
  measures: Partial<Measure>
): number => {
  const esHombre = (measures.sexo || "masculino").toLowerCase() === "masculino";
  const altura = measures.altura || 175;
  const edad = measures.edad || 25;
  const pctGrasa = calculateNavyBodyFat(measures);

  // Escalado por altura
  const heightScale = altura / 175;

  // Factor de madurez muscular por edad
  let ageFactor = 1.0;
  if (edad < 18) {
    ageFactor = 0.90 + 0.10 * (edad / 18);
  } else if (edad > 35 && edad <= 55) {
    ageFactor = 1.0 - 0.003 * (edad - 35);
  } else if (edad > 55) {
    ageFactor = 0.94 - 0.005 * (edad - 55);
  }

  // Ajuste por adiposidad (mayor porcentaje de grasa aumenta la circunferencia sin ser músculo)
  const refFat = esHombre ? 12 : 20;
  const fatDiff = Math.max(0, pctGrasa - refFat);
  const isTorso =
    field === "pecho" ||
    field === "espalda" ||
    field === "gluteos" ||
    field === "hombros";
  const fatMultiplier = 1 + fatDiff * (isTorso ? 0.006 : 0.004);

  const baseMap = esHombre ? BASE_POTENTIAL_MALE : BASE_POTENTIAL_FEMALE;
  const baseVal = baseMap[field] || 50;

  return parseFloat((baseVal * heightScale * ageFactor * fatMultiplier).toFixed(1));
};

/**
 * Calcula el nivel de intensidad (1 a 4) de desarrollo muscular para cada grupo individual.
 * 1: En desarrollo (< 72% del potencial)
 * 2: Intermedio (72% - 84% del potencial)
 * 3: Avanzado / Fuerte (84% - 94% del potencial)
 * 4: Élite / Muy Fuerte (>= 94% del potencial)
 */
export const calculateMuscleIntensity = (
  field: keyof Measure,
  value: number,
  measures: Partial<Measure>
): number => {
  if (!value || value <= 0) return 1;

  const esHombre = (measures.sexo || "masculino").toLowerCase() === "masculino";
  const altura = measures.altura || 175;

  // Caso especial para cintura (evalúa estrechez / definición atlética del core)
  if (field === "cintura") {
    const waistRatio = value / altura;
    if (esHombre) {
      if (waistRatio <= 0.45) return 4;
      if (waistRatio <= 0.49) return 3;
      if (waistRatio <= 0.54) return 2;
      return 1;
    } else {
      if (waistRatio <= 0.42) return 4;
      if (waistRatio <= 0.46) return 3;
      if (waistRatio <= 0.51) return 2;
      return 1;
    }
  }

  const maxPotential = calculateMuscleMaxPotential(field, measures);
  if (maxPotential <= 0) return 2;

  const ratio = value / maxPotential;

  if (ratio >= 0.94) return 4; // Élite / Muy Fuerte
  if (ratio >= 0.84) return 3; // Fuerte / Avanzado
  if (ratio >= 0.72) return 2; // Intermedio / Buen Tono
  return 1; // Base / En Desarrollo
};

export const getDevelopmentLevelInfo = (level: number) => {
  switch (level) {
    case 4:
      return { label: "Élite", emoji: "", desc: "≥ 94% potencial" };
    case 3:
      return { label: "Fuerte", emoji: "", desc: "84% - 93%" };
    case 2:
      return { label: "Intermedio", emoji: "", desc: "72% - 83%" };
    case 1:
    default:
      return { label: "Base", emoji: "", desc: "< 72%" };
  }
};
