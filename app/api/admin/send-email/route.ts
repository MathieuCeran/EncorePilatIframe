import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { EmailService } from "@/lib/email-service";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const serviceClient = createServiceClient();
    const body = await request.json();

    const { type, booking_id, order_id } = body;

    if (!type || (!booking_id && !order_id)) {
      return NextResponse.json(
        { error: "type et booking_id ou order_id sont requis" },
        { status: 400 }
      );
    }

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "Non autorisé" },
        { status: 401 }
      );
    }

    // Vérifier que l'utilisateur est admin
    const { data: roleData } = await supabase.rpc("get_user_role");
    if (roleData !== "admin") {
      return NextResponse.json(
        { success: false, message: "Accès refusé" },
        { status: 403 }
      );
    }

    if (type === "course_confirmation" && booking_id) {
      // Envoyer email de confirmation de cours
      const { data: booking } = await serviceClient
        .from("reservations")
        .select(
          `
          *,
          courses (
            id,
            date,
            start_time,
            end_time,
            course_types (name),
            instructors (first_name, last_name)
          ),
          profiles (
            id,
            first_name,
            last_name,
            email
          ),
          user_pack_purchases (
            packs (nom)
          )
        `
        )
        .eq("id", booking_id)
        .single();

      if (!booking) {
        return NextResponse.json(
          { error: "Réservation introuvable" },
          { status: 404 }
        );
      }

      const courseDate = new Date(booking.courses.date).toLocaleDateString(
        "fr-FR",
        {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      );

      const startTime = booking.courses.start_time;
      const endTime = booking.courses.end_time;
      const duration = `${startTime} - ${endTime}`;

      const instructorName = booking.courses.instructors && booking.courses.instructors.length > 0
        ? `${booking.courses.instructors[0].first_name} ${booking.courses.instructors[0].last_name}`
        : "À déterminer";

      await EmailService.sendCourseConfirmation(booking.profiles.email, {
        customerName: `${booking.profiles.first_name} ${booking.profiles.last_name}`,
        courseType: booking.courses.course_types?.name || "Pilates",
        courseDate,
        courseTime: startTime,
        courseDuration: duration,
        instructorName,
        packName: booking.user_pack_purchases?.packs?.nom || "Pack",
        courseDateISO: booking.courses.date, // Format YYYY-MM-DD
        courseEndTime: endTime,
      });

      return NextResponse.json({
        success: true,
        message: "Email de confirmation de cours envoyé avec succès",
      });
    } else if (type === "order_confirmation" && order_id) {
      // Envoyer email de confirmation de commande
      const { data: order } = await serviceClient
        .from("commandes")
        .select(
          `
          *,
          profiles (
            id,
            first_name,
            last_name,
            email
          ),
          packs (
            id,
            nom,
            prix,
            nombre_cours_total
          )
        `
        )
        .eq("id", order_id)
        .single();

      if (!order) {
        return NextResponse.json(
          { error: "Commande introuvable" },
          { status: 404 }
        );
      }

      await EmailService.sendOrderConfirmation(order.profiles.email, {
        customerName: `${order.profiles.first_name} ${order.profiles.last_name}`,
        orderNumber: order.id,
        packName: order.packs.nom,
        sessionsCount: String(order.packs.nombre_cours_total || 1),
        unitPrice: String(order.packs.prix || 0),
        paymentMethod:
          order.type_paiement === "cash"
            ? "Paiement sur site"
            : "Carte bancaire",
        totalAmount: String(order.montant_total),
        accountURL: `${process.env.NEXT_PUBLIC_APP_URL || "https://encorepilates.ma"}/account`,
      });

      return NextResponse.json({
        success: true,
        message: "Email de confirmation de commande envoyé avec succès",
      });
    } else {
      return NextResponse.json(
        { error: "Type d'email non supporté" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}
