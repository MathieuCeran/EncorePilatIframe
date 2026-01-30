import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { EmailService } from "@/lib/email-service";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServiceClient();
    const client = await createClient();
    const { id: commandeId } = await params;
    const body = await request.json();

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

    const { action } = body;

    if (action !== "confirm_payment") {
      return NextResponse.json(
        { success: false, message: "Action non reconnue" },
        { status: 400 }
      );
    }

    // Récupérer la commande avec la réservation associée (si elle existe)
    const { data: commande, error: commandeError } = await supabase
      .from("commandes")
      .select(
        `
        *,
        packs (
          id,
          nom,
          prix,
          type_pack,
          duree_validite_jours,
          nombre_cours_total
        ),
        reservations (
          id,
          course_id,
          statut,
          courses (
            id,
            course_type_id
          )
        )
      `
      )
      .eq("id", commandeId)
      .single();

    if (commandeError || !commande) {
      return NextResponse.json(
        { success: false, message: "Commande introuvable" },
        { status: 404 }
      );
    }

    // Vérifier que la commande est en attente de paiement
    if (commande.statut !== "pending") {
      return NextResponse.json(
        {
          success: false,
          message: "Cette commande n'est pas en attente de paiement",
        },
        { status: 400 }
      );
    }

    // Vérifier que c'est un paiement cash
    if (commande.type_paiement !== "cash") {
      return NextResponse.json(
        {
          success: false,
          message: "Cette commande n'est pas un paiement cash",
        },
        { status: 400 }
      );
    }

    // Trouver le user_pack_purchase en statut "pending" pour cette commande
    const { data: packPurchase, error: packPurchaseError } = await supabase
      .from("user_pack_purchases")
      .select("*")
      .eq("user_id", commande.user_id)
      .eq("pack_id", commande.pack_id)
      .eq("statut", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (packPurchaseError || !packPurchase) {
      return NextResponse.json(
        { success: false, message: "Aucun pack purchase en attente trouvé" },
        { status: 404 }
      );
    }

    // Mettre à jour le pack purchase : passer de "pending" à "active"
    const { error: updatePackError } = await supabase
      .from("user_pack_purchases")
      .update({
        cours_restants: packPurchase.cours_restants - 1, // Déduire le cours utilisé
        statut: packPurchase.cours_restants - 1 > 0 ? "active" : "consumed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", packPurchase.id);

    if (updatePackError) {
      return NextResponse.json(
        { success: false, message: "Erreur lors de la mise à jour du pack" },
        { status: 500 }
      );
    }

    // Si la commande a une réservation associée, traiter la réservation
    if (commande.reservations && commande.reservations.length > 0) {
      const reservation = commande.reservations[0]; // Prendre la première réservation

      // Créer un user_pack_usage pour cette réservation
      const { error: usageError } = await supabase
        .from("user_pack_usage")
        .insert({
          user_id: commande.user_id,
          user_pack_purchase_id: packPurchase.id,
          course_type_id: reservation.courses.course_type_id,
          utilisations_consommees: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (usageError) {
        return NextResponse.json(
          {
            success: false,
            message: "Erreur lors de la création de l'usage du pack",
          },
          { status: 500 }
        );
      }

      // Mettre à jour le statut de la réservation
      const { error: updateReservationError } = await supabase
        .from("reservations")
        .update({
          statut: "confirmed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", reservation.id);

      if (updateReservationError) {
        return NextResponse.json(
          {
            success: false,
            message: "Erreur lors de la mise à jour de la réservation",
          },
          { status: 500 }
        );
      }
    }

    // Marquer la commande comme payée
    const { error: updateCommandeError } = await supabase
      .from("commandes")
      .update({
        statut: "paid",
        date_paiement: new Date().toISOString(),
        notes: "Confirmé par admin",
        updated_at: new Date().toISOString(),
      })
      .eq("id", commandeId);

    if (updateCommandeError) {
      return NextResponse.json(
        {
          success: false,
          message: "Erreur lors de la mise à jour de la commande",
        },
        { status: 500 }
      );
    }

    // Envoyer les emails de confirmation
    try {
      console.log("📧 Envoi des emails de confirmation après validation admin...");
      
      // Récupérer les informations utilisateur
      const { data: userProfile, error: userError } = await supabase
        .from("profiles")
        .select("email, first_name, last_name")
        .eq("id", commande.user_id)
        .single();

      if (userError || !userProfile) {
        console.error("❌ Impossible de récupérer le profil utilisateur:", userError);
      } else {
        // Email de confirmation de commande
        const orderEmailResult = await EmailService.sendOrderConfirmation(userProfile.email, {
          customerName: `${userProfile.first_name} ${userProfile.last_name}`,
          orderNumber: commande.id,
          packName: commande.packs.nom,
          sessionsCount: String(commande.packs.nombre_cours_total || 1),
          unitPrice: String(commande.packs.prix || 0),
          paymentMethod: "Paiement sur site",
          totalAmount: String(commande.montant_total),
          accountURL: `${process.env.NEXT_PUBLIC_APP_URL || "https://encorepilates.ma"}/account`,
        });

        if (!orderEmailResult.success) {
          console.error("❌ Erreur email commande:", orderEmailResult.error);
        } else {
          console.log("✅ Email de confirmation de commande envoyé");
        }

        // Si une réservation existe, envoyer aussi l'email de cours
        if (commande.reservations && commande.reservations.length > 0) {
          const reservation = commande.reservations[0];
          
          // Récupérer les détails du cours
          const { data: courseDetails, error: courseError } = await supabase
            .from("courses")
            .select(`
              *,
              course_types (name),
              instructors (first_name, last_name)
            `)
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

            await EmailService.sendCourseConfirmation(userProfile.email, {
              customerName: `${userProfile.first_name} ${userProfile.last_name}`,
              courseType: courseDetails.course_types.name,
              courseDate,
              courseTime: courseDetails.start_time,
              courseDuration: `${courseDetails.start_time} - ${courseDetails.end_time}`,
              instructorName,
              packName: commande.packs.nom,
              courseDateISO: courseDetails.date, // Format YYYY-MM-DD
              courseEndTime: courseDetails.end_time,
            }).then((result) => {
              if (!result.success) {
                console.error("❌ Erreur email cours:", result.error);
              } else {
                console.log("✅ Email de confirmation de cours envoyé");
              }
            });
          }
        }
      }
    } catch (emailError) {
      console.error("❌ Erreur lors de l'envoi des emails:", emailError);
      // Ne pas faire échouer la validation si l'email échoue
    }

    return NextResponse.json({
      success: true,
      message: "Paiement confirmé avec succès",
      data: {
        commande: {
          ...commande,
          statut: "paid",
          date_paiement: new Date().toISOString(),
        },
        pack_purchase: {
          ...packPurchase,
          statut: packPurchase.cours_restants - 1 > 0 ? "active" : "consumed",
          cours_restants: packPurchase.cours_restants - 1,
        },
      },
    });
  } catch (error) {
    console.error("Erreur serveur:", error);
    return NextResponse.json(
      { success: false, message: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// DELETE - Annuler une commande pending
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const commandeId = (await params).id;

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

    // Récupérer la commande
    const { data: commande, error: commandeError } = await supabase
      .from("commandes")
      .select("*, user_id, pack_id")
      .eq("id", commandeId)
      .single();

    if (commandeError || !commande) {
      return NextResponse.json(
        { success: false, message: "Commande introuvable" },
        { status: 404 }
      );
    }

    // Vérifier que la commande est en statut pending
    if (commande.statut !== "pending") {
      return NextResponse.json(
        {
          success: false,
          message: "Seules les commandes en attente peuvent être annulées",
        },
        { status: 400 }
      );
    }

    // Trouver et annuler le pack purchase associé
    const { data: packPurchase, error: packError } = await supabase
      .from("user_pack_purchases")
      .select("id")
      .eq("user_id", commande.user_id)
      .eq("pack_id", commande.pack_id)
      .eq("statut", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!packError && packPurchase) {
      // Annuler le pack purchase
      await supabase
        .from("user_pack_purchases")
        .update({
          statut: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", packPurchase.id);
    }

    // Annuler les réservations associées et décrémenter current_bookings
    const { data: reservations, error: reservationsError } = await supabase
      .from("reservations")
      .select("course_id")
      .eq("commande_id", commandeId);

    if (!reservationsError && reservations) {
      // Annuler les réservations
      await supabase
        .from("reservations")
        .update({
          statut: "cancelled",
          date_annulation: new Date().toISOString(),
          raison_annulation: "Commande annulée par l'administrateur",
          updated_at: new Date().toISOString(),
        })
        .eq("commande_id", commandeId);

      // Décrémenter current_bookings pour chaque cours
      for (const reservation of reservations) {
        const { data: currentCourse } = await supabase
          .from("courses")
          .select("current_bookings")
          .eq("id", reservation.course_id)
          .single();

        if (currentCourse) {
          await supabase
            .from("courses")
            .update({
              current_bookings: Math.max(0, currentCourse.current_bookings - 1),
              updated_at: new Date().toISOString(),
            })
            .eq("id", reservation.course_id);
        }
      }
    }

    // Annuler la commande
    const { error: updateError } = await supabase
      .from("commandes")
      .update({
        statut: "cancelled",
        notes: "Annulée par l'administrateur",
        updated_at: new Date().toISOString(),
      })
      .eq("id", commandeId);

    if (updateError) {
      return NextResponse.json(
        {
          success: false,
          message: "Erreur lors de l'annulation de la commande",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Commande annulée avec succès",
    });
  } catch (error) {
    console.error("Erreur serveur:", error);
    return NextResponse.json(
      { success: false, message: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
