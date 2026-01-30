/**
 * Utilitaires pour gérer les niveaux d'intensité des cours
 * 
 * Mapping:
 * 1 = Tous niveaux
 * 2 = Intermédiaire
 * 3 = Intense
 */

export type IntensityLevel = 1 | 2 | 3;

export const INTENSITY_LABELS: Record<IntensityLevel, string> = {
  1: "Tous niveaux",
  2: "Intermédiaire",
  3: "Intense",
};

export const INTENSITY_DESCRIPTIONS: Record<IntensityLevel, string> = {
  1: "Accessible à tous, idéal pour débuter",
  2: "Nécessite une base de pratique",
  3: "Pour pratiquants confirmés",
};

/**
 * Convertit une ancienne valeur d'intensité (1-4) vers le nouveau système (1-3)
 * Pour la rétrocompatibilité lors de la migration
 */
export function migrateIntensity(oldIntensity: number): IntensityLevel {
  if (oldIntensity <= 2) return 1; // Tous niveaux
  if (oldIntensity === 3) return 2; // Intermédiaire
  return 3; // Intense
}

/**
 * Obtient le label d'intensité
 */
export function getIntensityLabel(intensity: number): string {
  const level = (intensity >= 1 && intensity <= 3 ? intensity : 1) as IntensityLevel;
  return INTENSITY_LABELS[level];
}

/**
 * Obtient la description d'intensité
 */
export function getIntensityDescription(intensity: number): string {
  const level = (intensity >= 1 && intensity <= 3 ? intensity : 1) as IntensityLevel;
  return INTENSITY_DESCRIPTIONS[level];
}

/**
 * Valide une valeur d'intensité
 */
export function isValidIntensity(intensity: number): intensity is IntensityLevel {
  return intensity >= 1 && intensity <= 3;
}
