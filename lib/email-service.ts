import { sendEmail } from "./resend";
import {
  renderCourseConfirmation,
  renderOrderConfirmation,
  type CourseConfirmationData,
  type OrderConfirmationData,
} from "./email-renderer";

export interface EmailResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

export class EmailService {
  /**
   *confirmation de cours
   */
  static async sendCourseConfirmation(
    to: string,
    data: CourseConfirmationData
  ): Promise<EmailResult> {
    try {
      const html = await renderCourseConfirmation(data);

      const result = await sendEmail({
        to,
        subject: "Confirmation de votre cours Encore Pilates",
        text: `Bonjour ${data.customerName} ! Votre réservation pour le cours ${data.courseType} du ${data.courseDate} à ${data.courseTime} a été confirmée.`,
        html,
        replyTo: "encorepilate@gmail.com",
      });

      if (!result?.id) {
        return { success: false, error: "Aucun ID de message retourné" };
      }

      console.log(`✅ Email de confirmation de cours envoyé à ${to} - ID: ${result.id}`);
      return { success: true, messageId: result.id };
    } catch (error) {
      console.error(
        "❌ Erreur lors de l'envoi de l'email de confirmation de cours:",
        error
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * confirmation de commande
   */
  static async sendOrderConfirmation(
    to: string,
    data: OrderConfirmationData
  ): Promise<EmailResult> {
    try {
      const html = await renderOrderConfirmation(data);

      const result = await sendEmail({
        to,
        subject: "Confirmation de votre commande Encore Pilates",
        text: `Bonjour ${data.customerName} ! Votre commande ${data.orderNumber} pour le pack ${data.packName} a été confirmée.`,
        html,
        replyTo: "encorepilate@gmail.com",
      });

      if (!result?.id) {
        return { success: false, error: "Aucun ID de message retourné" };
      }

      console.log(`✅ Email de confirmation de commande envoyé à ${to} - ID: ${result.id}`);
      return { success: true, messageId: result.id };
    } catch (error) {
      console.error(
        "❌ Erreur lors de l'envoi de l'email de confirmation de commande:",
        error
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Envoie plusieurs emails de manière séquentielle avec gestion d'erreur
   */
  static async sendMultipleEmails(
    emailTasks: Array<() => Promise<void>>
  ): Promise<{ success: string[]; failed: string[] }> {
    const results = { success: [] as string[], failed: [] as string[] };

    for (let i = 0; i < emailTasks.length; i++) {
      try {
        console.log(`📧 Envoi email ${i + 1}/${emailTasks.length}...`);
        await emailTasks[i]();
        results.success.push(`Email ${i + 1}`);
        console.log(`✅ Email ${i + 1} envoyé avec succès`);

        // Petit délai entre les envois pour éviter le rate limiting
        if (i < emailTasks.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error(`❌ Erreur lors de l'envoi de l'email ${i + 1}:`, error);
        results.failed.push(
          `Email ${i + 1}: ${error instanceof Error ? error.message : "Erreur inconnue"}`
        );
      }
    }

    return results;
  }
}
