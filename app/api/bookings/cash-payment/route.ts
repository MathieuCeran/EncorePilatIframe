import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { EmailService } from "@/lib/email-service";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const serviceClient = createServiceClient();
    const body = await request.json();

    const { course_id, pack_id, promo_code } = body;

    if (!course_id || !pack_id) {
      return NextResponse.json(
        { error: "course_id et pack_id sont requis" },
        { status: 400 }
      );
    }

    // Vérifier l'authentification de l'utilisateur
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log("Auth check:", { user: user?.id, authError });

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier que le cours existe et est actif
    const { data: course, error: courseError } = await serviceClient
      .from("courses")
      .select(
        "max_capacity, current_bookings, status, date, start_time, course_type_id"
      )
      .eq("id", course_id)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: "Cours introuvable" }, { status: 404 });
    }

    if (course.status !== "active") {
      return NextResponse.json(
        { error: "Ce cours n'est plus disponible" },
        { status: 400 }
      );
    }

    // Vérifier la capacité du cours
    if (course.current_bookings >= course.max_capacity) {
      return NextResponse.json({ error: "Cours complet" }, { status: 400 });
    }

    // Vérifier si l'utilisateur a déjà une réservation ACTIVE pour ce cours
    const { data: existingBooking } = await serviceClient
      .from("reservations")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", course_id)
      .neq("statut", "cancelled") // Exclure les réservations annulées
      .single();

    if (existingBooking) {
      return NextResponse.json(
        { error: "Vous avez déjà une réservation active pour ce cours" },
        { status: 409 }
      );
    }

    // Vérifier que le pack existe
    const { data: pack, error: packError } = await serviceClient
      .from("packs")
      .select("*")
      .eq("id", pack_id)
      .is("deleted_at", null) // Exclure les packs supprimés
      .single();

    if (packError || !pack) {
      return NextResponse.json({ error: "Pack introuvable" }, { status: 404 });
    }

    // Calculer le total avec promo éventuel
    let montant_total = pack.prix as number;
    let promoDiscountAmount = 0;
    let appliedPromo: null | { id: string; code: string } = null;
    if (promo_code) {
      // Valider le code promo côté serveur via la table
      const { data: promo, error: promoError } = await serviceClient
        .from("promo_codes")
        .select("*")
        .eq("code", promo_code.trim())
        .eq("is_active", true)
        .maybeSingle();

      if (!promoError && promo) {
        // Vérifier limites d'utilisation globale et par utilisateur
        let canUse = true;
        if (promo.usage_limit !== null && promo.usage_limit !== undefined) {
          const { count: totalUsage } = await serviceClient
            .from("promo_code_usages")
            .select("id", { count: "exact", head: true })
            .eq("promo_code_id", promo.id);
          if (
            typeof totalUsage === "number" &&
            totalUsage >= promo.usage_limit
          ) {
            canUse = false;
          }
        }
        if (
          canUse &&
          promo.user_usage_limit !== null &&
          promo.user_usage_limit !== undefined
        ) {
          const { count: userUsage } = await serviceClient
            .from("promo_code_usages")
            .select("id", { count: "exact", head: true })
            .eq("promo_code_id", promo.id)
            .eq("user_id", user.id);
          if (
            typeof userUsage === "number" &&
            userUsage >= promo.user_usage_limit
          ) {
            canUse = false;
          }
        }

        const now = new Date();
        const startOk = !promo.start_date || new Date(promo.start_date) <= now;
        const endOk = !promo.end_date || new Date(promo.end_date) >= now;
        const meetsMin =
          !promo.minimum_order_amount ||
          montant_total >= promo.minimum_order_amount;
        if (canUse && startOk && endOk && meetsMin) {
          if (promo.discount_type === "percentage") {
            promoDiscountAmount = (montant_total * promo.discount_value) / 100;
          } else {
            promoDiscountAmount = promo.discount_value;
          }
          if (promo.maximum_discount_amount) {
            promoDiscountAmount = Math.min(
              promoDiscountAmount,
              promo.maximum_discount_amount
            );
          }
          montant_total = Math.max(
            0,
            Number((montant_total - promoDiscountAmount).toFixed(2))
          );
          appliedPromo = { id: promo.id, code: promo.code };
        }
      }
    }

    // Créer la commande en cash
    const { data: commande, error: commandeError } = await serviceClient
      .from("commandes")
      .insert({
        user_id: user.id,
        pack_id: pack_id,
        montant_total,
        type_paiement: "cash",
        statut: "pending",
        date_commande: new Date().toISOString(),
      })
      .select()
      .single();

    if (commandeError) {
      console.error("Erreur création commande:", commandeError);
      return NextResponse.json(
        {
          error: "Erreur lors de la création de la commande",
          details: commandeError.message,
        },
        { status: 500 }
      );
    }

    // Enregistrer l'usage du code promo si appliqué (audit) + incrémenter le compteur
    if (appliedPromo && promoDiscountAmount > 0) {
      try {
        // Insérer l'enregistrement d'usage
        const { error: usageInsertError } = await serviceClient
          .from("promo_code_usages")
          .insert({
            promo_code_id: appliedPromo.id,
            user_id: user.id,
            commande_id: commande.id,
            discount_amount: promoDiscountAmount,
            used_at: new Date().toISOString(),
          });

        if (usageInsertError) {
          console.error(
            "Erreur insertion promo_code_usages:",
            usageInsertError
          );
          throw usageInsertError;
        }

        // Incrémente usage_count de manière atomique
        const { data: promoRow, error: fetchPromoError } = await serviceClient
          .from("promo_codes")
          .select("usage_count")
          .eq("id", appliedPromo.id)
          .single();

        if (fetchPromoError) {
          console.error(
            "Erreur récupération promo_codes.usage_count:",
            fetchPromoError
          );
        } else {
          const nextCount = (promoRow?.usage_count ?? 0) + 1;
          const { error: incrementError } = await serviceClient
            .from("promo_codes")
            .update({
              usage_count: nextCount,
              updated_at: new Date().toISOString(),
            })
            .eq("id", appliedPromo.id);

          if (incrementError) {
            console.error("Erreur incrément usage_count:", incrementError);
          } else {
            console.log(
              `✅ Usage count incrémenté pour le code promo ${appliedPromo.code}: ${nextCount}`
            );
          }
        }
      } catch (e) {
        console.error("Erreur enregistrement usage code promo:", e);
        // Ne pas faire échouer la commande si l'incrémentation échoue
      }
    }

    // Créer un user_pack_purchase en statut "pending"
    const { data: packPurchase, error: packPurchaseError } = await serviceClient
      .from("user_pack_purchases")
      .insert({
        user_id: user.id,
        pack_id: pack_id,
        date_achat: new Date().toISOString(),
        date_expiration: pack.duree_validite_jours
          ? new Date(
              Date.now() + pack.duree_validite_jours * 24 * 60 * 60 * 1000
            ).toISOString()
          : null,
        cours_restants: pack.nombre_cours_total || 1,
        statut: "pending",
      })
      .select()
      .single();

    if (packPurchaseError) {
      console.error("Erreur création pack purchase:", packPurchaseError);
      // Supprimer la commande créée en cas d'erreur
      await serviceClient.from("commandes").delete().eq("id", commande.id);
      return NextResponse.json(
        {
          error: "Erreur lors de la création du pack purchase",
          details: packPurchaseError.message,
        },
        { status: 500 }
      );
    }

    // Créer la réservation en pending_payment
    const { data: reservation, error: reservationError } = await serviceClient
      .from("reservations")
      .insert({
        user_id: user.id,
        course_id: course_id,
        commande_id: commande.id,
        user_pack_purchase_id: packPurchase.id,
        statut: "pending_payment",
      })
      .select(
        `
        *,
        courses (
          id,
          date,
          start_time,
          end_time,
          course_types (name)
        )
      `
      )
      .single();

    if (reservationError) {
      console.error("Erreur création réservation:", reservationError);
      // Supprimer la commande et le pack purchase créés en cas d'erreur
      await serviceClient.from("commandes").delete().eq("id", commande.id);
      await serviceClient
        .from("user_pack_purchases")
        .delete()
        .eq("id", packPurchase.id);
      return NextResponse.json(
        {
          error: "Erreur lors de la création de la réservation",
          details: reservationError.message,
        },
        { status: 500 }
      );
    }

    // Mettre à jour le nombre de réservations du cours
    const { error: updateCourseError } = await serviceClient
      .from("courses")
      .update({
        current_bookings: course.current_bookings + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", course_id);

    if (updateCourseError) {
      console.error("Erreur mise à jour compteur cours:", updateCourseError);
      // Supprimer la réservation, la commande et le pack purchase créés en cas d'erreur
      await serviceClient
        .from("reservations")
        .delete()
        .eq("id", reservation.id);
      await serviceClient.from("commandes").delete().eq("id", commande.id);
      await serviceClient
        .from("user_pack_purchases")
        .delete()
        .eq("id", packPurchase.id);
      return NextResponse.json(
        {
          error: "Erreur lors de la mise à jour du compteur du cours",
          details: updateCourseError.message,
        },
        { status: 500 }
      );
    }

    // Envoyer les emails de confirmation
    try {
      console.log("📧 Début de l'envoi des emails de confirmation...");
      console.log("📧 User ID:", user.id);
      console.log("📧 Course ID:", course_id);
      console.log("📧 Commande ID:", commande.id);
      
      // Récupérer toutes les informations nécessaires une seule fois
      const { data: userProfile, error: profileError } = await serviceClient
        .from("profiles")
        .select("first_name, last_name, email")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("❌ Erreur récupération profil:", profileError);
      } else {
        console.log("✅ Profil récupéré:", {
          email: userProfile?.email,
          firstName: userProfile?.first_name,
          lastName: userProfile?.last_name,
        });
      }

      const { data: courseDetails, error: courseError } = await serviceClient
        .from("courses")
        .select(
          `
          date,
          start_time,
          end_time,
          name,
          instructors (first_name, last_name)
        `
        )
        .eq("id", course_id)
        .single();

      if (courseError) {
        console.error("❌ Erreur récupération cours:", courseError);
      } else {
        console.log("✅ Cours récupéré:", {
          date: courseDetails?.date,
          name: courseDetails?.name,
          hasInstructors: !!courseDetails?.instructors,
        });
      }

      if (userProfile && courseDetails) {
        console.log("📧 Préparation des emails pour:", userProfile.email);

        // Préparer les données pour les emails
        const courseDate = new Date(courseDetails.date).toLocaleDateString(
          "fr-FR",
          {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }
        );

        const startTime = courseDetails.start_time;
        const endTime = courseDetails.end_time;
        const duration = `${startTime} - ${endTime}`;

        const instructorName = courseDetails.instructors && courseDetails.instructors.length > 0
          ? `${courseDetails.instructors[0].first_name} ${courseDetails.instructors[0].last_name}`
          : "À déterminer";

        // Utiliser la méthode d'envoi multiple pour une meilleure gestion
        const emailResults = await EmailService.sendMultipleEmails([
          // Email de confirmation de commande
          () =>
            EmailService.sendOrderConfirmation(userProfile.email, {
              customerName: `${userProfile.first_name} ${userProfile.last_name}`,
              orderNumber: commande.id,
              packName: pack.nom,
              sessionsCount: String(pack.nombre_cours_total || 1),
              unitPrice: String(pack.prix || 0),
              paymentMethod: "Paiement sur site",
              totalAmount: String(montant_total),
              accountURL: `${process.env.NEXT_PUBLIC_APP_URL || "https://encorepilates.ma"}/account`,
            }).then((result) => {
              if (!result.success) {
                throw new Error(result.error || "Échec envoi email commande");
              }
            }),
          // Email de confirmation de cours
          () =>
            EmailService.sendCourseConfirmation(userProfile.email, {
              customerName: `${userProfile.first_name} ${userProfile.last_name}`,
              courseType: courseDetails.name,
              courseDate,
              courseTime: startTime,
              courseDuration: duration,
              instructorName,
              packName: pack.nom,
              courseDateISO: courseDetails.date, // Format YYYY-MM-DD
              courseEndTime: endTime,
            }).then((result) => {
              if (!result.success) {
                throw new Error(result.error || "Échec envoi email cours");
              }
            }),
        ]);

        // Log des résultats
        let emailSuccess = false;
        let emailErrorMessage: string | null = null;
        
        if (emailResults.success.length > 0) {
          console.log(
            `✅ Emails envoyés avec succès: ${emailResults.success.join(", ")}`
          );
        }
        if (emailResults.failed.length > 0) {
          console.warn(`⚠️ Emails en échec: ${emailResults.failed.join(", ")}`);
          emailErrorMessage = emailResults.failed.join(" | ");
        }

        // Déterminer le statut global
        emailSuccess = emailResults.failed.length === 0;

        // Mettre à jour le statut d'envoi d'email dans la commande
        const updateData: {
          email_confirmation_sent: boolean;
          email_confirmation_sent_at?: string;
          email_confirmation_error?: string | null;
        } = {
          email_confirmation_sent: emailSuccess,
        };

        if (emailSuccess) {
          updateData.email_confirmation_sent_at = new Date().toISOString();
          updateData.email_confirmation_error = null;
        } else if (emailErrorMessage) {
          updateData.email_confirmation_error = emailErrorMessage;
        }

        await serviceClient
          .from("commandes")
          .update(updateData)
          .eq("id", commande.id);

        console.log("🎉 Traitement des emails terminé");
      } else {
        console.warn(
          "⚠️ Impossible de récupérer les informations utilisateur ou cours pour l'envoi d'emails"
        );
        console.warn("Détails:", {
          hasUserProfile: !!userProfile,
          hasCourseDetails: !!courseDetails,
          userId: user.id,
          courseId: course_id,
        });
        
        // Mettre à jour la commande avec un statut d'erreur
        await serviceClient
          .from("commandes")
          .update({
            email_confirmation_sent: false,
            email_confirmation_error: "Données manquantes pour l'envoi d'email",
          })
          .eq("id", commande.id);
      }
    } catch (emailError) {
      console.error("❌ Erreur lors de l'envoi des emails:", emailError);
      console.error("Stack trace:", emailError instanceof Error ? emailError.stack : "N/A");
      
      // Mettre à jour la commande avec l'erreur
      try {
        await serviceClient
          .from("commandes")
          .update({
            email_confirmation_sent: false,
            email_confirmation_error: emailError instanceof Error ? emailError.message : "Erreur inconnue",
          })
          .eq("id", commande.id);
      } catch (updateError) {
        console.error("❌ Impossible de mettre à jour le statut d'erreur:", updateError);
      }
    }
    return NextResponse.json(
      {
        success: true,
        message:
          "Réservation confirmée et commande créée en attente de paiement cash",
        reservation: reservation,
        commande: commande,
        booking_id: reservation.id,
        order_id: commande.id,
        redirect_url: `/checkout/success-cash?booking_id=${reservation.id}&order_id=${commande.id}&amount=${montant_total}${appliedPromo ? `&promo_code=${encodeURIComponent(appliedPromo.code)}&discount=${promoDiscountAmount}` : ""}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating cash payment booking:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}
