import { render } from "@react-email/render";
import { CourseConfirmation, OrderConfirmation } from "../mails/react-email";
import { generateGoogleCalendarLink } from "./calendar-utils";

export interface CourseConfirmationData {
  customerName: string;
  courseType: string;
  courseDate: string;
  courseTime: string;
  courseDuration: string;
  instructorName: string;
  packName: string;
  courseId?: string;
  // Pour le calendrier
  courseDateISO?: string; // Format: YYYY-MM-DD
  courseEndTime?: string; // Format: HH:MM
}

export interface OrderConfirmationData {
  customerName: string;
  orderNumber: string;
  packName: string;
  sessionsCount: string;
  unitPrice: string;
  paymentMethod: string;
  totalAmount: string;
  accountURL: string;
}

/**
 * Renders the course confirmation email template to HTML
 */
export async function renderCourseConfirmation(
  data: CourseConfirmationData
): Promise<string> {
  // Générer le lien Google Calendar si les données sont disponibles
  let googleCalendarLink: string | undefined;
  
  console.log("📅 Données pour calendrier:", {
    courseDateISO: data.courseDateISO,
    courseTime: data.courseTime,
    courseEndTime: data.courseEndTime,
    hasAllData: !!(data.courseDateISO && data.courseTime && data.courseEndTime),
  });
  
  if (data.courseDateISO && data.courseTime && data.courseEndTime) {
    googleCalendarLink = generateGoogleCalendarLink({
      title: `Cours Encore Pilates - ${data.courseType}`,
      description: `Cours de ${data.courseType} avec ${data.instructorName}\n\nPack: ${data.packName}\n\nN'oubliez pas:\n- Arrivez 10 minutes avant\n- Apportez une bouteille d'eau et une serviette\n- Portez des vêtements confortables`,
      location: "Angle Rue N1 et 3, Quartier de l'Aviation, Residence magnolia, Bureau B5, RDC, Casablanca, Maroc",
      startDate: data.courseDateISO,
      startTime: data.courseTime,
      endTime: data.courseEndTime,
    });
    console.log("✅ Lien Google Calendar généré:", googleCalendarLink);
  } else {
    console.warn("⚠️ Impossible de générer le lien Google Calendar - données manquantes");
  }

  const emailComponent = await CourseConfirmation({
    ...data,
    googleCalendarLink,
  });
  return await render(emailComponent);
}

/**
 * Renders the order confirmation email template to HTML
 */
export async function renderOrderConfirmation(
  data: OrderConfirmationData
): Promise<string> {
  const emailComponent = await OrderConfirmation(data);
  return await render(emailComponent);
}

/**
 * Renders any React Email component to HTML
 */
export async function renderEmailComponent(
  component: React.ReactElement
): Promise<string> {
  return await render(component);
}
