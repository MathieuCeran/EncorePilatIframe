import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const serviceClient = createServiceClient();
    const { id: bookingId } = await params;
    const body = await request.json();

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

    // Vérifier que l'utilisateur est admin ou hostess
    const { data: roleData } = await supabase.rpc("get_user_role");
    if (roleData !== "admin" && roleData !== "hostess") {
      return NextResponse.json(
        { success: false, message: "Accès refusé" },
        { status: 403 }
      );
    }

    // Récupérer la réservation avec les détails du cours
    const { data: reservation, error: reservationError } = await serviceClient
      .from("reservations")
      .select(
        `
        *,
        courses (
          id,
          course_type_id
        )
      `
      )
      .eq("id", bookingId)
      .single();

    if (reservationError || !reservation) {
      return NextResponse.json(
        { success: false, message: "Réservation non trouvée" },
        { status: 404 }
      );
    }

    // Préparer les données de mise à jour
    const updateData: {
      updated_at: string;
      presente?: boolean;
      date_presence?: string | null;
      statut?: string;
      date_annulation?: string;
      raison_annulation?: string;
    } = {
      updated_at: new Date().toISOString(),
    };

    // Gérer les différents types de mises à jour
    if (body.presente !== undefined) {
      updateData.presente = body.presente;
      updateData.date_presence = body.presente
        ? new Date().toISOString()
        : null;
    }

    if (body.statut) {
      updateData.statut = body.statut;
      if (body.statut === "cancelled") {
        updateData.date_annulation = new Date().toISOString();
        updateData.raison_annulation =
          body.raison_annulation || "Expulsé par l'administrateur";
      }
    }

    // Mettre à jour la réservation
    const { data: updatedReservation, error: updateError } = await serviceClient
      .from("reservations")
      .update(updateData)
      .eq("id", bookingId)
      .select("*")
      .single();

    if (updateError) {
      console.error("Erreur lors de la mise à jour:", updateError);
      return NextResponse.json(
        { success: false, message: "Erreur lors de la mise à jour" },
        { status: 500 }
      );
    }

    // Si on expulse (statut = cancelled) ou marque comme absent, gérer le remboursement du pack
    if (body.statut === "cancelled" || body.presente === false) {
      const now = new Date();

      // Si la réservation avait un pack associé, recréditer le cours
      if (reservation.commande_id) {
        const { data: packPurchase, error: packError } = await serviceClient
          .from("user_pack_purchases")
          .select("id, cours_restants, statut, date_expiration")
          .eq("id", reservation.commande_id)
          .single();

        if (!packError && packPurchase) {
          // Vérifier si le pack peut être recrédité (non expiré ou pas de date d'expiration)
          const isPackValid =
            !packPurchase.date_expiration ||
            new Date(packPurchase.date_expiration) > now;

          if (isPackValid) {
            // Recréditer le pack
            const { error: updatePackError } = await serviceClient
              .from("user_pack_purchases")
              .update({
                cours_restants: packPurchase.cours_restants + 1,
                statut:
                  packPurchase.cours_restants + 1 > 0 ? "active" : "consumed",
                updated_at: new Date().toISOString(),
              })
              .eq("id", packPurchase.id);

            if (updatePackError) {
              console.error(
                "Erreur lors de la mise à jour du pack:",
                updatePackError
              );
            } else {
              // Décrémenter l'usage pour ce type de cours en utilisant upsert
              const { error: upsertError } = await serviceClient
                .from("user_pack_usage")
                .upsert(
                  {
                    user_pack_purchase_id: packPurchase.id,
                    course_type_id: reservation.courses.course_type_id,
                    user_id: reservation.user_id,
                    utilisations_consommees: 0,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                  {
                    onConflict: "user_id,course_type_id",
                    ignoreDuplicates: false,
                  }
                );

              if (upsertError) {
                console.error(
                  "Erreur lors de l'upsert de l'usage:",
                  upsertError
                );
              } else {
                // Maintenant décrémenter l'usage existant
                const { data: currentUsage } = await serviceClient
                  .from("user_pack_usage")
                  .select("utilisations_consommees")
                  .eq("user_pack_purchase_id", packPurchase.id)
                  .eq("course_type_id", reservation.courses.course_type_id)
                  .single();

                if (currentUsage) {
                  const newUsage = Math.max(
                    0,
                    currentUsage.utilisations_consommees - 1
                  );

                  const { error: updateUsageError } = await serviceClient
                    .from("user_pack_usage")
                    .update({
                      utilisations_consommees: newUsage,
                      updated_at: new Date().toISOString(),
                    })
                    .eq("user_pack_purchase_id", packPurchase.id)
                    .eq("course_type_id", reservation.courses.course_type_id);

                  if (updateUsageError) {
                    console.error(
                      "Erreur lors de la mise à jour de l'usage:",
                      updateUsageError
                    );
                  }
                }
              }
            }
          }
        }
      } else {
        // Si pas de commande_id, chercher un pack actif pour l'utilisateur et ce type de cours
        const { data: activePack, error: activePackError } = await serviceClient
          .from("user_pack_purchases")
          .select("id, cours_restants, statut, date_expiration")
          .eq("user_id", reservation.user_id)
          .eq("statut", "active")
          .gt("cours_restants", 0)
          .order("date_achat", { ascending: true })
          .limit(1)
          .single();

        if (!activePackError && activePack) {
          // Vérifier si le pack peut être recrédité
          const isPackValid =
            !activePack.date_expiration ||
            new Date(activePack.date_expiration) > now;

          if (isPackValid) {
            // Recréditer le pack
            const { error: updatePackError } = await serviceClient
              .from("user_pack_purchases")
              .update({
                cours_restants: activePack.cours_restants + 1,
                updated_at: new Date().toISOString(),
              })
              .eq("id", activePack.id);

            if (updatePackError) {
              console.error(
                "Erreur lors de la mise à jour du pack actif:",
                updatePackError
              );
            } else {
              // Décrémenter l'usage pour ce type de cours en utilisant upsert
              const { error: upsertError } = await serviceClient
                .from("user_pack_usage")
                .upsert(
                  {
                    user_pack_purchase_id: activePack.id,
                    course_type_id: reservation.courses.course_type_id,
                    user_id: reservation.user_id,
                    utilisations_consommees: 0,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                  {
                    onConflict: "user_id,course_type_id",
                    ignoreDuplicates: false,
                  }
                );

              if (upsertError) {
                console.error(
                  "Erreur lors de l'upsert de l'usage actif:",
                  upsertError
                );
              } else {
                // Maintenant décrémenter l'usage existant
                const { data: currentUsage } = await serviceClient
                  .from("user_pack_usage")
                  .select("utilisations_consommees")
                  .eq("user_pack_purchase_id", activePack.id)
                  .eq("course_type_id", reservation.courses.course_type_id)
                  .single();

                if (currentUsage) {
                  const newUsage = Math.max(
                    0,
                    currentUsage.utilisations_consommees - 1
                  );

                  const { error: updateUsageError } = await serviceClient
                    .from("user_pack_usage")
                    .update({
                      utilisations_consommees: newUsage,
                      updated_at: new Date().toISOString(),
                    })
                    .eq("user_pack_purchase_id", activePack.id)
                    .eq("course_type_id", reservation.courses.course_type_id);

                  if (updateUsageError) {
                    console.error(
                      "Erreur lors de la mise à jour de l'usage actif:",
                      updateUsageError
                    );
                  }
                }
              }
            }
          }
        }
      }

      // Décrémenter le nombre de réservations du cours (toujours faire cette mise à jour)
      const { data: currentCourse } = await serviceClient
        .from("courses")
        .select("current_bookings")
        .eq("id", reservation.course_id)
        .single();

      if (currentCourse) {
        const { error: updateCourseError } = await serviceClient
          .from("courses")
          .update({
            current_bookings: Math.max(0, currentCourse.current_bookings - 1),
            updated_at: new Date().toISOString(),
          })
          .eq("id", reservation.course_id);

        if (updateCourseError) {
          console.error(
            "Erreur lors de la mise à jour du cours:",
            updateCourseError
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Réservation mise à jour avec succès",
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
