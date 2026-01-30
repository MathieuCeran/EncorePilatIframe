import { Resend } from "resend";
import React from "react";
import config from "@/config";
import { AccountConfirmation, PasswordReset } from "@/mails/react-email";
import type {
  AccountConfirmationProps,
  PasswordResetProps,
} from "@/mails/react-email";

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY environment variable is required");
}

const resend = new Resend(process.env.RESEND_API_KEY);

// Configuration des emails d'authentification - utilise le domaine vérifié
const AUTH_EMAIL_CONFIG = {
  from: config.resend.from, // 'Encore Pilates <noreply@encorepilates.ma>'
  replyTo: config.resend.supportEmail, // 'support@encorepilates.ma'
} as const;

// Types pour les erreurs
export interface AuthEmailError {
  success: false;
  error: string;
  code?: string;
}

export interface AuthEmailSuccess {
  success: true;
  messageId: string;
}

export type AuthEmailResult = AuthEmailSuccess | AuthEmailError;

/**
 * Service d'envoi d'emails d'authentification via Resend
 * Gère la confirmation de compte et la réinitialisation de mot de passe
 */
export class AuthEmailService {
  /**
   * Envoie un email de confirmation de compte
   * @param to - Adresse email du destinataire
   * @param customerName - Nom du client
   * @param confirmationUrl - URL de confirmation du compte
   * @returns Résultat de l'envoi avec gestion d'erreurs
   */
  static async sendAccountConfirmation(
    to: string,
    customerName: string,
    confirmationUrl: string
  ): Promise<AuthEmailResult> {
    try {
      // Validation des paramètres
      if (!to || !customerName || !confirmationUrl) {
        return {
          success: false,
          error: "Paramètres manquants pour l'envoi de l'email de confirmation",
          code: "MISSING_PARAMETERS",
        };
      }

      // Validation de l'email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(to)) {
        return {
          success: false,
          error: "Adresse email invalide",
          code: "INVALID_EMAIL",
        };
      }

      // Validation de l'URL
      try {
        new URL(confirmationUrl);
      } catch {
        return {
          success: false,
          error: "URL de confirmation invalide",
          code: "INVALID_URL",
        };
      }

      const emailProps: AccountConfirmationProps = {
        customerName: customerName.trim(),
        confirmationUrl,
      };

      const { data, error } = await resend.emails.send({
        from: AUTH_EMAIL_CONFIG.from,
        to: [to.toLowerCase().trim()],
        subject: "Confirmez votre compte Encore Pilates",
        react: React.createElement(AccountConfirmation, emailProps),
        replyTo: AUTH_EMAIL_CONFIG.replyTo,
        tags: [
          { name: "category", value: "auth" },
          { name: "type", value: "account-confirmation" },
        ],
      });

      if (error) {
        console.error("Erreur Resend lors de l'envoi de confirmation:", error);
        return {
          success: false,
          error: "Erreur lors de l'envoi de l'email de confirmation",
          code: "RESEND_ERROR",
        };
      }

      if (!data?.id) {
        return {
          success: false,
          error: "Aucun ID de message retourné par Resend",
          code: "NO_MESSAGE_ID",
        };
      }

      console.log(`Email de confirmation envoyé avec succès. ID: ${data.id}`);
      return {
        success: true,
        messageId: data.id,
      };
    } catch (error) {
      console.error(
        "Erreur inattendue lors de l'envoi de confirmation:",
        error
      );
      return {
        success: false,
        error: "Erreur interne lors de l'envoi de l'email",
        code: "INTERNAL_ERROR",
      };
    }
  }

  /**
   * Envoie un email de réinitialisation de mot de passe
   * @param to - Adresse email du destinataire
   * @param customerName - Nom du client
   * @param resetUrl - URL de réinitialisation du mot de passe
   * @returns Résultat de l'envoi avec gestion d'erreurs
   */
  static async sendPasswordReset(
    to: string,
    customerName: string,
    resetUrl: string
  ): Promise<AuthEmailResult> {
    try {
      // Validation des paramètres
      if (!to || !customerName || !resetUrl) {
        return {
          success: false,
          error:
            "Paramètres manquants pour l'envoi de l'email de réinitialisation",
          code: "MISSING_PARAMETERS",
        };
      }

      // Validation de l'email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(to)) {
        return {
          success: false,
          error: "Adresse email invalide",
          code: "INVALID_EMAIL",
        };
      }

      // Validation de l'URL
      try {
        new URL(resetUrl);
      } catch {
        return {
          success: false,
          error: "URL de réinitialisation invalide",
          code: "INVALID_URL",
        };
      }

      const emailProps: PasswordResetProps = {
        customerName: customerName.trim(),
        resetUrl,
      };

      const { data, error } = await resend.emails.send({
        from: AUTH_EMAIL_CONFIG.from,
        to: [to.toLowerCase().trim()],
        subject: "Réinitialisation de votre mot de passe Encore Pilates",
        react: React.createElement(PasswordReset, emailProps),
        replyTo: AUTH_EMAIL_CONFIG.replyTo,
        tags: [
          { name: "category", value: "auth" },
          { name: "type", value: "password-reset" },
        ],
      });

      if (error) {
        console.error(
          "Erreur Resend lors de l'envoi de réinitialisation:",
          error
        );
        return {
          success: false,
          error: "Erreur lors de l'envoi de l'email de réinitialisation",
          code: "RESEND_ERROR",
        };
      }

      if (!data?.id) {
        return {
          success: false,
          error: "Aucun ID de message retourné par Resend",
          code: "NO_MESSAGE_ID",
        };
      }

      console.log(
        `Email de réinitialisation envoyé avec succès. ID: ${data.id}`
      );
      return {
        success: true,
        messageId: data.id,
      };
    } catch (error) {
      console.error(
        "Erreur inattendue lors de l'envoi de réinitialisation:",
        error
      );
      return {
        success: false,
        error: "Erreur interne lors de l'envoi de l'email",
        code: "INTERNAL_ERROR",
      };
    }
  }

  /**
   * Vérifie que le service Resend est correctement configuré
   * @returns True si la configuration est valide
   */
  static async isConfigured(): Promise<boolean> {
    try {
      // Test simple pour vérifier que l'API key est valide
      const { error } = await resend.emails.send({
        from: AUTH_EMAIL_CONFIG.from,
        to: ["test@resend.dev"],
        subject: "Configuration Test",
        html: "<p>Test de configuration</p>",
      });

      // Une erreur 404 ou autre erreur API est attendue avec test@resend.dev
      // L'important est que l'API key soit acceptée (pas d'erreur 401)
      return !error || !error.message.includes("API key");
    } catch {
      return false;
    }
  }

  /**
   * Utilitaire pour logger les métriques d'envoi d'emails
   * @param type - Type d'email envoyé
   * @param success - Si l'envoi a réussi
   * @param email - Email du destinataire (masqué pour la confidentialité)
   */
  static logEmailMetrics(
    type: "confirmation" | "reset",
    success: boolean,
    email: string
  ): void {
    const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, "$1***$3");
    console.log(
      `[AuthEmailService] ${type} email ${success ? "envoyé" : "échoué"} pour ${maskedEmail}`
    );
  }
}
