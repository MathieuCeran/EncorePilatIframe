-- Migration: Ajouter le suivi d'envoi d'email pour les commandes
-- Date: 2025-11-11
-- Description: Ajoute les colonnes pour tracker l'envoi automatique d'emails de confirmation

-- Étape 1: Ajouter la colonne pour indiquer si l'email a été envoyé
ALTER TABLE commandes
ADD COLUMN IF NOT EXISTS email_confirmation_sent BOOLEAN DEFAULT FALSE;

-- Étape 2: Ajouter la colonne pour la date d'envoi de l'email
ALTER TABLE commandes
ADD COLUMN IF NOT EXISTS email_confirmation_sent_at TIMESTAMP WITH TIME ZONE;

-- Étape 3: Ajouter la colonne pour stocker les erreurs d'envoi
ALTER TABLE commandes
ADD COLUMN IF NOT EXISTS email_confirmation_error TEXT;

-- Étape 4: Ajouter un commentaire pour documenter les colonnes
COMMENT ON COLUMN commandes.email_confirmation_sent IS 'Indique si l''email de confirmation a été envoyé avec succès';
COMMENT ON COLUMN commandes.email_confirmation_sent_at IS 'Date et heure d''envoi de l''email de confirmation';
COMMENT ON COLUMN commandes.email_confirmation_error IS 'Message d''erreur si l''envoi de l''email a échoué';

-- Vérification: Afficher les commandes avec leur statut d'envoi d'email
SELECT 
  id,
  user_id,
  montant_total,
  statut,
  date_commande,
  email_confirmation_sent,
  email_confirmation_sent_at,
  email_confirmation_error
FROM commandes
ORDER BY date_commande DESC
LIMIT 10;
