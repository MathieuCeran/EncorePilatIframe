import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// PATCH - Modifier un pack utilisateur
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; packId: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: userId, packId } = await params;
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

    // Préparer les données de mise à jour
    const updateData: {
      updated_at: string;
      cours_restants?: number;
      statut?: string;
      date_expiration?: string | null;
    } = {
      updated_at: new Date().toISOString(),
    };

    if (body.cours_restants !== undefined) {
      updateData.cours_restants = body.cours_restants;
    }

    if (body.statut !== undefined) {
      updateData.statut = body.statut;
    }

    if (body.date_expiration !== undefined) {
      updateData.date_expiration = body.date_expiration;
    }

    // Mettre à jour le pack
    const { data: pack, error: updateError } = await supabase
      .from("user_pack_purchases")
      .update(updateData)
      .eq("id", packId)
      .eq("user_id", userId)
      .select()
      .single();

    if (updateError) {
      console.error("Erreur lors de la mise à jour:", updateError);
      return NextResponse.json(
        { success: false, message: "Erreur lors de la mise à jour du pack" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Pack mis à jour avec succès",
      data: pack,
    });
  } catch (error) {
    console.error("Erreur serveur:", error);
    return NextResponse.json(
      { success: false, message: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un pack utilisateur
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; packId: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: userId, packId } = await params;

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

    // Vérifier que le pack existe
    const { data: pack, error: packError } = await supabase
      .from("user_pack_purchases")
      .select("id")
      .eq("id", packId)
      .eq("user_id", userId)
      .single();

    if (packError || !pack) {
      return NextResponse.json(
        { success: false, message: "Pack introuvable" },
        { status: 404 }
      );
    }

    // Vérifier s'il y a des réservations associées
    const { data: reservations, error: reservationsError } = await supabase
      .from("reservations")
      .select("id, statut")
      .eq("user_pack_purchase_id", packId);

    if (reservationsError) {
      console.error(
        "Erreur lors de la vérification des réservations:",
        reservationsError
      );
      return NextResponse.json(
        {
          success: false,
          message: "Erreur lors de la vérification des réservations",
        },
        { status: 500 }
      );
    }

    // S'il y a des réservations, les supprimer d'abord
    if (reservations && reservations.length > 0) {
      const { error: deleteReservationsError } = await supabase
        .from("reservations")
        .delete()
        .eq("user_pack_purchase_id", packId);

      if (deleteReservationsError) {
        console.error(
          "Erreur lors de la suppression des réservations:",
          deleteReservationsError
        );
        return NextResponse.json(
          {
            success: false,
            message: "Erreur lors de la suppression des réservations associées",
          },
          { status: 500 }
        );
      }
    }

    // Supprimer le pack (et les utilisations associées par cascade)
    const { error: deleteError } = await supabase
      .from("user_pack_purchases")
      .delete()
      .eq("id", packId)
      .eq("user_id", userId);

    if (deleteError) {
      console.error("Erreur lors de la suppression:", deleteError);
      return NextResponse.json(
        { success: false, message: "Erreur lors de la suppression du pack" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Pack supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur serveur:", error);
    return NextResponse.json(
      { success: false, message: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
