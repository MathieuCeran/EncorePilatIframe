-- Migration: Changer l'intensité (1-4) en niveaux (1-3)
-- Date: 2025-11-11
-- Description: Remplace le système d'intensité par un système de niveaux
--   1 = Tous niveaux (anciennement 1-2)
--   2 = Intermédiaire (anciennement 3)
--   3 = Intense (anciennement 4)

-- Étape 1: Mapper les anciennes valeurs vers les nouvelles
-- Avant de modifier la contrainte, on met à jour les valeurs existantes
UPDATE courses
SET intensity = CASE
  WHEN intensity <= 2 THEN 1  -- Tous niveaux
  WHEN intensity = 3 THEN 2   -- Intermédiaire
  WHEN intensity >= 4 THEN 3  -- Intense
  ELSE 1                       -- Valeur par défaut si NULL ou invalide
END
WHERE intensity IS NOT NULL;

-- Étape 2: Supprimer l'ancienne contrainte
ALTER TABLE courses
DROP CONSTRAINT IF EXISTS courses_intensity_check;

-- Étape 3: Ajouter la nouvelle contrainte (1-3)
ALTER TABLE courses
ADD CONSTRAINT courses_intensity_check CHECK (intensity = ANY (ARRAY[1, 2, 3]));

-- Étape 4: Mettre à jour la valeur par défaut
ALTER TABLE courses
ALTER COLUMN intensity SET DEFAULT 1;

-- Vérification: Afficher la distribution des niveaux après migration
SELECT 
  intensity,
  COUNT(*) as count,
  CASE 
    WHEN intensity = 1 THEN 'Tous niveaux'
    WHEN intensity = 2 THEN 'Intermédiaire'
    WHEN intensity = 3 THEN 'Intense'
    ELSE 'Inconnu'
  END as niveau
FROM courses
GROUP BY intensity
ORDER BY intensity;
