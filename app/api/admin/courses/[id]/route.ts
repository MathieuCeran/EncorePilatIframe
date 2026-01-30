import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServiceClient();
    const client = await createClient();

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

    // Vérifier que l'utilisateur est admin ou hostess
    const { data: roleData } = await client.rpc("get_user_role");
    if (roleData !== "admin" && roleData !== "hostess") {
      return NextResponse.json(
        { success: false, message: "Accès refusé" },
        { status: 403 }
      );
    }

    const { id: courseId } = await params;
    const body = await request.json();
    const {
      courseTypeId,
      instructorId,
      startTime,
      endTime,
      maxCapacity,
      date,
      intensity = 1, // Valeur par défaut: Tous niveaux
      status = "active",
      name,
    } = body;

    // Validation des données
    if (
      !courseTypeId ||
      !instructorId ||
      !startTime ||
      !endTime ||
      !maxCapacity ||
      !date ||
      !name
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Tous les champs obligatoires doivent être remplis",
        },
        { status: 400 }
      );
    }

    // Vérifier que l'heure de fin est après l'heure de début
    if (startTime >= endTime) {
      return NextResponse.json(
        {
          success: false,
          message: "L'heure de fin doit être après l'heure de début",
        },
        { status: 400 }
      );
    }

    // Vérifier que le niveau est valide (1-3)
    if (intensity < 1 || intensity > 3) {
      return NextResponse.json(
        {
          success: false,
          message: "Le niveau doit être compris entre 1 et 3",
        },
        { status: 400 }
      );
    }

    // Vérifier que le cours existe
    const { data: existingCourse, error: fetchError } = await supabase
      .from("courses")
      .select("id")
      .eq("id", courseId)
      .single();

    if (fetchError || !existingCourse) {
      return NextResponse.json(
        { success: false, message: "Cours non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier que le type de cours existe
    const { data: courseType, error: courseTypeError } = await supabase
      .from("course_types")
      .select("id, name")
      .eq("id", courseTypeId)
      .single();

    if (courseTypeError || !courseType) {
      return NextResponse.json(
        {
          success: false,
          message: "Type de cours invalide",
        },
        { status: 400 }
      );
    }

    // Vérifier que l'instructeur existe
    const { data: instructor, error: instructorError } = await supabase
      .from("instructors")
      .select("id, first_name, last_name")
      .eq("id", instructorId)
      .single();

    if (instructorError || !instructor) {
      return NextResponse.json(
        {
          success: false,
          message: "Instructeur invalide",
        },
        { status: 400 }
      );
    }

    // Vérification des conflits d'horaire supprimée - les instructeurs peuvent avoir plusieurs cours en même temps

    // Mettre à jour le cours
    const { data: updatedCourse, error: updateError } = await supabase
      .from("courses")
      .update({
        course_type_id: courseTypeId,
        instructor_id: instructorId,
        start_time: startTime,
        end_time: endTime,
        max_capacity: maxCapacity,
        date,
        intensity,
        status,
        name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", courseId)
      .select(
        `
        *,
        course_types (
          id,
          name,
          description
        ),
        instructors (
          id,
          first_name,
          last_name
        )
      `
      )
      .single();

    if (updateError) {
      console.error("Erreur lors de la modification du cours:", updateError);
      return NextResponse.json(
        { success: false, message: "Erreur lors de la modification du cours" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Cours modifié avec succès",
      data: updatedCourse,
    });
  } catch (error) {
    console.error("Erreur serveur:", error);
    return NextResponse.json(
      { success: false, message: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServiceClient();
    const client = await createClient();

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

    const { id: courseId } = await params;

    // Vérifier que le cours existe
    const { data: existingCourse, error: fetchError } = await supabase
      .from("courses")
      .select("id")
      .eq("id", courseId)
      .single();

    if (fetchError || !existingCourse) {
      return NextResponse.json(
        { success: false, message: "Cours non trouvé" },
        { status: 404 }
      );
    }

    // Récupérer toutes les réservations actives pour ce cours
    const { data: reservations, error: reservationsError } = await supabase
      .from("reservations")
      .select(
        `
        id,
        user_id,
        user_pack_purchase_id,
        courses (
          course_type_id
        )
      `
      )
      .eq("course_id", courseId)
      .eq("statut", "confirmed");

    if (reservationsError) {
      console.error(
        "Erreur lors de la récupération des réservations:",
        reservationsError
      );
      return NextResponse.json(
        {
          success: false,
          message: "Erreur lors de la récupération des réservations",
        },
        { status: 500 }
      );
    }

    // Supprimer le cours (soft delete en changeant le statut)
    const { error: deleteError } = await supabase
      .from("courses")
      .update({ status: "cancelled", current_bookings: 0 })
      .eq("id", courseId);

    if (deleteError) {
      console.error("Erreur lors de la suppression du cours:", deleteError);
      return NextResponse.json(
        { success: false, message: "Erreur lors de la suppression du cours" },
        { status: 500 }
      );
    }

    // Annuler les réservations associées
    const { error: cancelReservationsError } = await supabase
      .from("reservations")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
        date_annulation: new Date().toISOString(),
        raisonc_annulation: "Cours annulé par l'administrateur",
      })
      .eq("course_id", courseId);

    if (cancelReservationsError) {
      console.error(
        "Erreur lors de l'annulation des réservations:",
        cancelReservationsError
      );
    }

    // Traiter chaque réservation pour récupérer les packs
    for (const reservation of reservations || []) {
      if (reservation.user_pack_purchase_id) {
        // Récupérer le pack purchase
        const { data: packPurchase, error: packError } = await supabase
          .from("user_pack_purchases")
          .select("id, cours_restants, statut")
          .eq("id", reservation.user_pack_purchase_id)
          .single();

        if (packError || !packPurchase) {
          console.error(
            "Erreur lors de la récupération du pack purchase:",
            packError
          );
          continue;
        }

        // Incrémenter le nombre de cours restants
        const newCoursRestants = packPurchase.cours_restants + 1;
        const newStatut =
          packPurchase.statut === "consumed" ? "active" : packPurchase.statut;

        const { error: updatePackError } = await supabase
          .from("user_pack_purchases")
          .update({
            cours_restants: newCoursRestants,
            statut: newStatut,
            updated_at: new Date().toISOString(),
          })
          .eq("id", packPurchase.id);

        if (updatePackError) {
          console.error(
            "Erreur lors de la mise à jour du pack purchase:",
            updatePackError
          );
          continue;
        }

        // Décrémenter l'usage pour ce type de cours
        const { data: usage, error: usageError } = await supabase
          .from("user_pack_usage")
          .select("id, utilisations_consommees")
          .eq("user_pack_purchase_id", reservation.user_pack_purchase_id)
          .eq("course_type_id", reservation.courses[0].course_type_id)
          .single();

        if (usageError || !usage) {
          console.error(
            "Erreur lors de la récupération de l'usage:",
            usageError
          );
          continue;
        }

        const newUtilisations = Math.max(0, usage.utilisations_consommees - 1);

        if (newUtilisations === 0) {
          // Supprimer l'enregistrement si plus d'utilisations
          const { error: deleteUsageError } = await supabase
            .from("user_pack_usage")
            .delete()
            .eq("id", usage.id);

          if (deleteUsageError) {
            console.error(
              "Erreur lors de la suppression de l'usage:",
              deleteUsageError
            );
          }
        } else {
          // Mettre à jour l'usage
          const { error: updateUsageError } = await supabase
            .from("user_pack_usage")
            .update({
              utilisations_consommees: newUtilisations,
            })
            .eq("id", usage.id);

          if (updateUsageError) {
            console.error(
              "Erreur lors de la mise à jour de l'usage:",
              updateUsageError
            );
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Cours supprimé avec succès et packs récupérés",
    });
  } catch (error) {
    console.error("Erreur serveur:", error);
    return NextResponse.json(
      { success: false, message: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}
