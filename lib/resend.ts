import { Resend } from "resend";
import config from "@/config";

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY is not set");
}

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends an email using the provided parameters.
 *
 * @async
 * @param {Object} params - The parameters for sending the email.
 * @param {string | string[]} params.to - The recipient's email address or an array of email addresses.
 * @param {string} params.subject - The subject of the email.
 * @param {string} params.text - The plain text content of the email.
 * @param {string} params.html - The HTML content of the email.
 * @param {string} [params.replyTo] - The email address to set as the "Reply-To" address.
 * @returns {Promise<Object>} A Promise that resolves with the email sending result data.
 */

interface SendEmailParams {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}

export const sendEmail = async ({
  to,
  subject,
  text,
  html,
  replyTo,
}: SendEmailParams) => {
  try {
    console.log(`📧 Tentative d'envoi d'email à: ${to}`);
    console.log(`📧 Sujet: ${subject}`);

    const { data, error } = await resend.emails.send({
      from: config.resend.from,
      to,
      subject,
      text,
      html,
      ...(replyTo && { replyTo }),
    });

    if (error) {
      console.error("❌ Erreur Resend lors de l'envoi:", {
        message: error.message,
        name: error.name,
      });
      throw error;
    }

    console.log(`✅ Email envoyé avec succès via Resend. ID: ${data?.id}`);
    return data;
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi d'email:", {
      error: error instanceof Error ? error.message : "Erreur inconnue",
      stack: error instanceof Error ? error.stack : undefined,
      to,
      subject,
    });
    throw error;
  }
};
