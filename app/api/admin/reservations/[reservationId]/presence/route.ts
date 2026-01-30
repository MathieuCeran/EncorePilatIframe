import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// PATCH - Marquer la présence/absence d'un utilisateur
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reservationId: string }> }
) {
  try {
    const supabase = await createClient();
    const { reservationId } = await params;
    const body = await request.json();

    // Vérifier l'authentification admin
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

    // Vérifier le rôle admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id)
      .single();

    const roleName = Array.isArray(roleData?.roles)
      ? (roleData?.roles?.[0]?.name ?? null)
      : ((roleData as { roles?: { name?: string } })?.roles?.name ?? null);

    if (!roleName || roleName !== "admin") {
      return NextResponse.json(
        { success: false, message: "Accès refusé" },
        { status: 403 }
      );
    }

    // Vérifier que la réservation existe
    const { data: reservation, error: reservationError } = await supabase
      .from("reservations")
      .select("id, statut")
      .eq("id", reservationId)
      .single();

    if (reservationError || !reservation) {
      return NextResponse.json(
        { success: false, message: "Réservation introuvable" },
        { status: 404 }
      );
    }

    if (reservation.statut !== "confirmed") {
      return NextResponse.json(
        {
          success: false,
          message: "Seules les réservations confirmées peuvent être marquées",
        },
        { status: 400 }
      );
    }

    // Mettre à jour la présence
    const { data: updatedReservation, error: updateError } = await supabase
      .from("reservations")
      .update({
        presente: body.presente,
        date_presence: body.date_presence || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", reservationId)
      .select()
      .single();

    if (updateError) {
      console.error("Erreur lors de la mise à jour:", updateError);
      return NextResponse.json(
        {
          success: false,
          message: "Erreur lors de la mise à jour de la présence",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: body.presente ? "Présence confirmée" : "Absence marquée",
      data: updatedReservation,
    });
  } catch (error) {
    console.error("Erreur serveur:", error);
    return NextResponse.json(
      { success: false, message: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
