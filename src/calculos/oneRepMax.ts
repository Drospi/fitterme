/**
 * Fórmulas y Cálculos Científicos de 1RM (Una Repetición Máxima)
 * Basado en las ecuaciones clásicas de Brzycki, Epley y Lombardi.
 */

/**
 * Fórmula estándar híbrida de 1RM:
 * - Reps = 1: Peso exacto.
 * - Reps <= 10: Ecuación de Brzycki: peso / (1.0278 - 0.0278 * reps).
 * - Reps > 10: Ecuación de Epley: peso * (1 + reps / 30).
 */
export const calculate1RM = (peso: number, reps: number): number => {
  if (peso <= 0 || reps <= 0) return 0;
  if (reps === 1) return peso;
  if (reps <= 10) {
    return peso / (1.0278 - 0.0278 * reps);
  }
  return peso * (1 + reps / 30);
};

/**
 * Fórmula específica de Brzycki (ideal para rango de 1 a 10 reps).
 */
export const calculateBrzycki1RM = (peso: number, reps: number): number => {
  if (peso <= 0 || reps <= 0) return 0;
  if (reps === 1) return peso;
  const denom = 1.0278 - 0.0278 * reps;
  if (denom <= 0) return peso;
  return peso / denom;
};

/**
 * Fórmula específica de Epley (ideal para repeticiones moderadas/altas).
 */
export const calculateEpley1RM = (peso: number, reps: number): number => {
  if (peso <= 0 || reps <= 0) return 0;
  if (reps === 1) return peso;
  return peso * (1 + reps / 30);
};

/**
 * Fórmula de Lombardi: peso * reps^0.10
 */
export const calculateLombardi1RM = (peso: number, reps: number): number => {
  if (peso <= 0 || reps <= 0) return 0;
  return peso * Math.pow(reps, 0.1);
};

/**
 * Estima el porcentaje de 1RM para un número determinado de repeticiones.
 */
export const repsToPercentage1RM = (reps: number): number => {
  if (reps <= 1) return 100;
  if (reps > 30) return 40;
  // Aproximación lineal / Brzycki: ~2.5% menos por cada rep adicional
  return Math.max(40, Math.round((1.0278 - 0.0278 * reps) * 100));
};

/**
 * Estima el peso sugerido para un objetivo de repeticiones dado un 1RM.
 */
export const estimateWeightForReps = (oneRM: number, reps: number): number => {
  if (oneRM <= 0 || reps <= 0) return 0;
  if (reps === 1) return oneRM;
  const pct = repsToPercentage1RM(reps) / 100;
  return Math.round(oneRM * pct * 10) / 10;
};
