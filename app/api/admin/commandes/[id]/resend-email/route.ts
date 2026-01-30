import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { EmailService } from "@/lib/email-service";

/**
 * API pour renvoyer les emails de confirmation d'une commande
 * POST /api/admin/commandes/[id]/resend-email
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServiceClient();
    const client = await createClient();
    const { id: commandeId } = await params;

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "Non autorisé" },
        { status: 401 }
      );
    }

    // Vérifier que l'utilisateur est admin
    const { data: roleData } = await client.rpc("get_user_role");

    if (roleData !== "admin" && roleData !== "hostess") {
      return NextResponse.json(
        { success: false, message: "Accès refusé" },
        { status: 403 }
      );
    }

    // Récupérer la commande avec toutes les infos nécessaires
    const { data: commande, error: commandeError } = await supabase
      .from("commandes")
      .select(
        `
        *,
        packs (
          id,
          nom,
          prix,
          nombre_cours_total
        ),
        reservations (
          id,
          course_id,
          statut
        )
      `
      )
      .eq("id", commandeId)
      .single();

    if (commandeError || !commande) {
      console.error("Erreur récupération commande:", commandeError);
      return NextResponse.json(
        { success: false, message: "Commande introuvable" },
        { status: 404 }
      );
    }

    // Récupérer les informations utilisateur
    const { data: userProfile, error: userError } = await supabase
      .from("profiles")
      .select("email, first_name, last_name")
      .eq("id", commande.user_id)
      .single();

    if (userError || !userProfile) {
      console.error("Erreur récupération profil:", userError);
      return NextResponse.json(
        { success: false, message: "Profil utilisateur introuvable" },
        { status: 404 }
      );
    }

    const emailErrors: string[] = [];
    let emailsSent = 0;

    // Envoyer l'email de confirmation de commande
    const orderEmailResult = await EmailService.sendOrderConfirmation(
      userProfile.email,
      {
        customerName: `${userProfile.first_name} ${userProfile.last_name}`,
        orderNumber: commande.id,
        packName: commande.packs.nom,
        sessionsCount: String(commande.packs.nombre_cours_total || 1),
        unitPrice: String(commande.packs.prix || 0),
        paymentMethod: commande.type_paiement === "cash" ? "Paiement sur site" : "En ligne",
        totalAmount: String(commande.montant_total),
        accountURL: `${process.env.NEXT_PUBLIC_APP_URL || "https://encorepilates.ma"}/account`,
      }
    );

    if (orderEmailResult.success) {
      emailsSent++;
    } else {
      emailErrors.push(`Commande: ${orderEmailResult.error}`);
    }

    // Si une réservation existe, envoyer aussi l'email de cours
    if (commande.reservations && commande.reservations.length > 0) {
      const reservation = commande.reservations[0];
      
      // Récupérer les détails complets du cours
      const { data: courseDetails, error: courseError } = await supabase
        .from("courses")
        .select(
          `
          id,
          date,
          start_time,
          end_time,
          course_types (name),
          instructors (first_name, last_name)
        `
        )
        .eq("id", reservation.course_id)
        .single();

      if (!courseError && courseDetails) {
        const courseDate = new Date(courseDetails.date).toLocaleDateString(
          "fr-FR",
          {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }
        );

        const instructorName = courseDetails.instructors && courseDetails.instructors.length > 0
          ? `${courseDetails.instructors[0].first_name} ${courseDetails.instructors[0].last_name}`
          : "À déterminer";

        const courseEmailResult = await EmailService.sendCourseConfirmation(
          userProfile.email,
          {
            customerName: `${userProfile.first_name} ${userProfile.last_name}`,
            courseType: (courseDetails.course_types as { name: string }[] | null)?.[0]?.name || "Cours",
            courseDate,
            courseTime: courseDetails.start_time,
            courseDuration: `${courseDetails.start_time} - ${courseDetails.end_time}`,
            instructorName,
            packName: commande.packs.nom,
            courseDateISO: courseDetails.date, // Format YYYY-MM-DD
            courseEndTime: courseDetails.end_time,
          }
        );

        if (courseEmailResult.success) {
          emailsSent++;
        } else {
          emailErrors.push(`Cours: ${courseEmailResult.error}`);
        }
      }
    }

    // Mettre à jour le statut d'envoi d'email dans la commande
    const updateData: {
      email_confirmation_sent: boolean;
      email_confirmation_sent_at?: string;
      email_confirmation_error?: string | null;
    } = {
      email_confirmation_sent: emailErrors.length === 0,
    };

    if (emailErrors.length === 0) {
      updateData.email_confirmation_sent_at = new Date().toISOString();
      updateData.email_confirmation_error = null;
    } else {
      updateData.email_confirmation_error = emailErrors.join(" | ");
    }

    await supabase
      .from("commandes")
      .update(updateData)
      .eq("id", commandeId);

    if (emailErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Erreur lors de l'envoi des emails`,
          errors: emailErrors,
          emailsSent,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${emailsSent} email(s) envoyé(s) avec succès`,
      emailsSent,
    });
  } catch (error) {
    console.error("Erreur lors du renvoi des emails:", error);
    return NextResponse.json(
      { success: false, message: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
