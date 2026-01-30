// app/api/bookings/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Types for the booking data structure

interface FormattedBookingResponse {
  booking: {
    id: string;
    statut: string;
    created_at: string;
    courses: {
      id: string;
      date: string;
      start_time: string;
      end_time: string;
      course_types: {
        name: string;
        description: string;
      };
    };
  };
  pack_info: {
    id: string;
    nom: string;
    description: string;
    cours_restants: number;
    date_expiration: string | null;
  } | null;
  message: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: bookingId } = await params;

    if (!bookingId) {
      return NextResponse.json(
        { error: "ID de réservation requis" },
        { status: 400 }
      );
    }

    // Vérifier l'authentification de l'utilisateur
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer la réservation avec les détails du cours
    const { data: booking, error: bookingError } = await supabase
      .from("reservations")
      .select(
        `
        id,
        statut,
        created_at,
        commande_id,
        courses (
          id,
          date,
          start_time,
          end_time,
          course_types (
            id,
            name,
            description
          )
        )
      `
      )
      .eq("id", bookingId)
      .eq("user_id", user.id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: "Réservation introuvable" },
        { status: 404 }
      );
    }

    // Récupérer les informations du pack si la réservation en a un
    let packInfo = null;
    if (booking.commande_id) {
      const { data: packPurchase, error: packError } = await supabase
        .from("user_pack_purchases")
        .select(
          `
          id,
          cours_restants,
          date_expiration,
          packs (
            id,
            nom,
            description
          )
        `
        )
        .eq("id", booking.commande_id)
        .single();

      if (!packError && packPurchase && packPurchase.packs) {
        const pack = Array.isArray(packPurchase.packs)
          ? packPurchase.packs[0]
          : packPurchase.packs;
        if (pack) {
          packInfo = {
            id: pack.id,
            nom: pack.nom,
            description: pack.description,
            cours_restants: packPurchase.cours_restants,
            date_expiration: packPurchase.date_expiration,
          };
        }
      }
    }

    // Formater les données pour la page de succès
    const bookingData = booking as unknown as {
      id: string;
      statut: string;
      created_at: string;
      commande_id: string | null;
      courses: {
        id: string;
        date: string;
        start_time: string;
        end_time: string;
        course_types:
          | {
              id: string;
              name: string;
              description: string;
            }
          | Array<{
              id: string;
              name: string;
              description: string;
            }>;
      };
    };

    // Vérifier que les données du cours existent
    if (!bookingData.courses) {
      return NextResponse.json(
        { error: "Données du cours manquantes" },
        { status: 404 }
      );
    }

    const course = bookingData.courses;

    // Vérifier que les données du type de cours existent
    if (!course.course_types) {
      return NextResponse.json(
        { error: "Données du type de cours manquantes" },
        { status: 404 }
      );
    }

    const formattedData: FormattedBookingResponse = {
      booking: {
        id: bookingData.id,
        statut: bookingData.statut,
        created_at: bookingData.created_at,
        courses: {
          id: course.id,
          date: course.date,
          start_time: course.start_time,
          end_time: course.end_time,
          course_types: Array.isArray(course.course_types)
            ? course.course_types[0]
            : course.course_types,
        },
      },
      pack_info: packInfo,
      message: "Réservation confirmée avec votre pack",
    };

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error("Error fetching booking:", error);
    return NextResponse.json(
      {
        error: "Erreur serveur interne",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();

    // Vérifier l'authentification de l'utilisateur
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const allowedFields = ["booking_status", "payment_status", "notes"];
    const updateData: Record<string, string> = {};

    // Filtrer les champs autorisés
    Object.keys(body).forEach((key) => {
      if (allowedFields.includes(key)) {
        updateData[key] = body[key];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "Aucun champ valide à mettre à jour" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("course_bookings")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
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

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Les triggers gèrent automatiquement les promotions depuis la waitlist
    // si le booking_status change vers 'cancelled' ou 'no_show'

    return NextResponse.json({
      booking: data,
      message: "Réservation mise à jour avec succès",
    });
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}

// PUT - Confirmer un paiement cash et attribuer le pack
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: reservationId } = await params;
    const body = await request.json();

    const { action, hostess_user_id } = body;

    if (action !== "confirm_cash_payment") {
      return NextResponse.json(
        { error: "Action non reconnue" },
        { status: 400 }
      );
    }

    // Récupérer la réservation
    const { data: reservation, error: reservationError } = await supabase
      .from("reservations")
      .select(
        `
        *,
        courses (
          id,
          course_type_id
        ),
        profiles (
          id,
          first_name,
          last_name
        )
      `
      )
      .eq("id", reservationId)
      .single();

    if (reservationError || !reservation) {
      return NextResponse.json(
        { error: "Réservation non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que la réservation n'a pas déjà un pack attribué
    if (reservation.commande_id) {
      return NextResponse.json(
        { error: "Cette réservation a déjà un pack attribué" },
        { status: 400 }
      );
    }

    // Récupérer le user_pack_purchase en statut "pending" associé à cette réservation
    const { data: packPurchase, error: packPurchaseError } = await supabase
      .from("user_pack_purchases")
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
        )
      `
      )
      .eq("id", reservation.user_pack_purchase_id) // La réservation pointe vers le pack purchase en pending
      .eq("statut", "pending")
      .single();

    if (packPurchaseError || !packPurchase) {
      return NextResponse.json(
        { error: "Aucun pack purchase en attente trouvé" },
        { status: 404 }
      );
    }

    // Récupérer la commande associée pour la mettre à jour
    const { data: commande, error: commandeError } = await supabase
      .from("commandes")
      .select("*")
      .eq("user_id", reservation.user_id)
      .eq("pack_id", packPurchase.pack_id)
      .eq("type_paiement", "cash")
      .eq("statut", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (commandeError || !commande) {
      return NextResponse.json(
        { error: "Aucune commande cash en attente trouvée" },
        { status: 404 }
      );
    }

    // Mettre à jour le pack purchase : passer de "pending" à "active" et déduire le cours
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
        { error: "Erreur lors de la mise à jour du pack" },
        { status: 500 }
      );
    }

    // Créer l'enregistrement d'usage pour le type de cours réservé
    await supabase.from("user_pack_usage").insert({
      user_pack_purchase_id: packPurchase.id,
      course_type_id: reservation.courses.course_type_id,
      utilisations_consommees: 1,
    });

    // Marquer la commande comme payée
    await supabase
      .from("commandes")
      .update({
        statut: "payee",
        date_paiement: new Date().toISOString(),
        notes: hostess_user_id
          ? `Confirmé par hôtesse: ${hostess_user_id}`
          : "Paiement cash confirmé",
        updated_at: new Date().toISOString(),
      })
      .eq("id", commande.id);

    return NextResponse.json({
      success: true,
      message: "Paiement confirmé et pack attribué avec succès",
      data: {
        pack_purchase: packPurchase,
        reservation: reservation,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la confirmation du paiement:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// DELETE - Annuler une réservation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: reservationId } = await params;

    // Vérifier l'authentification de l'utilisateur
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer la réservation
    const { data: reservation, error: reservationError } = await supabase
      .from("reservations")
      .select(
        `
        *,
        courses (
          id,
          date,
          start_time,
          course_type_id
        )
      `
      )
      .eq("id", reservationId)
      .eq("user_id", user.id)
      .single();

    if (reservationError || !reservation) {
      return NextResponse.json(
        { error: "Réservation non trouvée ou non autorisée" },
        { status: 404 }
      );
    }

    // Vérifier que l'annulation se fait au moins 12h avant le cours
    const courseDateTime = new Date(
      reservation.courses.date + "T" + reservation.courses.start_time
    );
    const now = new Date();
    const hoursUntilCourse =
      (courseDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilCourse < 12) {
      return NextResponse.json(
        { error: "Annulation impossible : moins de 12h avant le cours" },
        { status: 400 }
      );
    }

    // Vérifier que la réservation n'est pas déjà annulée
    if (reservation.statut === "cancelled") {
      return NextResponse.json(
        { error: "Réservation déjà annulée" },
        { status: 400 }
      );
    }

    // Marquer la réservation comme annulée
    const { error: updateReservationError } = await supabase
      .from("reservations")
      .update({
        statut: "cancelled",
        raison_annulation: "Annulation client dans les délais",
        updated_at: new Date().toISOString(),
      })
      .eq("id", reservationId);

    if (updateReservationError) {
      return NextResponse.json(
        { error: "Erreur lors de l'annulation de la réservation" },
        { status: 500 }
      );
    }

    // Si la réservation a une commande associée en statut "pending", la passer à "cancelled"
    if (reservation.commande_id) {
      const { data: commande, error: commandeError } = await supabase
        .from("commandes")
        .select("id, statut")
        .eq("id", reservation.commande_id)
        .single();

      if (!commandeError && commande && commande.statut === "pending") {
        const { error: updateCommandeError } = await supabase
          .from("commandes")
          .update({
            statut: "cancelled",
            updated_at: new Date().toISOString(),
          })
          .eq("id", reservation.commande_id);

        if (updateCommandeError) {
          console.error(
            "Erreur lors de l'annulation de la commande:",
            updateCommandeError
          );
          // On continue même si l'annulation de la commande échoue
        }
      }
    }

    // Si la réservation avait un pack associé, recréditer le cours
    if (reservation.user_pack_purchase_id) {
      const { data: packPurchase, error: packError } = await supabase
        .from("user_pack_purchases")
        .select("id, cours_restants, statut, date_expiration")
        .eq("id", reservation.user_pack_purchase_id)
        .single();

      if (!packError && packPurchase) {
        // Si le statut de la réservation était "pending_payment", mettre le pack purchase à "cancelled"
        if (reservation.statut === "pending_payment") {
          await supabase
            .from("user_pack_purchases")
            .update({
              statut: "cancelled",
              updated_at: new Date().toISOString(),
            })
            .eq("id", packPurchase.id);
        } else {
          // Sinon, recréditer le pack normalement
          const isPackValid =
            !packPurchase.date_expiration ||
            new Date(packPurchase.date_expiration) > now;

          if (isPackValid) {
            // Recréditer le pack
            await supabase
              .from("user_pack_purchases")
              .update({
                cours_restants: packPurchase.cours_restants + 1,
                statut:
                  packPurchase.cours_restants + 1 > 0 ? "active" : "consumed",
                updated_at: new Date().toISOString(),
              })
              .eq("id", packPurchase.id);

            // Décrémenter l'usage pour ce type de cours
            const { data: currentUsage, error: usageError } = await supabase
              .from("user_pack_usage")
              .select("utilisations_consommees")
              .eq("user_pack_purchase_id", packPurchase.id)
              .eq("course_type_id", reservation.courses.course_type_id)
              .single();

            if (currentUsage) {
              // Si l'enregistrement existe, le décrémenter
              await supabase
                .from("user_pack_usage")
                .update({
                  utilisations_consommees: Math.max(
                    0,
                    currentUsage.utilisations_consommees - 1
                  ),
                  updated_at: new Date().toISOString(),
                })
                .eq("user_pack_purchase_id", packPurchase.id)
                .eq("course_type_id", reservation.courses.course_type_id);
            } else if (usageError && usageError.code === "PGRST116") {
              // Si l'enregistrement n'existe pas, le créer avec 0 utilisations
              // (car on annule une réservation, donc on rembourse l'utilisation)
              await supabase.from("user_pack_usage").insert({
                user_pack_purchase_id: packPurchase.id,
                course_type_id: reservation.courses.course_type_id,
                utilisations_consommees: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
            }
          }
        }
      }
    } else if (reservation.commande_id) {
      // Si la réservation a une commande_id, chercher le user_pack_purchase associé
      const { data: commande } = await supabase
        .from("commandes")
        .select("pack_id")
        .eq("id", reservation.commande_id)
        .single();

      if (commande) {
        const { data: packPurchase, error: packError } = await supabase
          .from("user_pack_purchases")
          .select("id, cours_restants, statut, date_expiration")
          .eq("user_id", user.id)
          .eq("pack_id", commande.pack_id)
          .eq("statut", "pending")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (!packError && packPurchase) {
          // Si le statut de la réservation était "pending_payment", mettre le pack purchase à "cancelled"
          if (reservation.statut === "pending_payment") {
            await supabase
              .from("user_pack_purchases")
              .update({
                statut: "cancelled",
                updated_at: new Date().toISOString(),
              })
              .eq("id", packPurchase.id);
          } else {
            // Sinon, recréditer le pack normalement
            const isPackValid =
              !packPurchase.date_expiration ||
              new Date(packPurchase.date_expiration) > now;

            if (isPackValid) {
              // Recréditer le pack
              await supabase
                .from("user_pack_purchases")
                .update({
                  cours_restants: packPurchase.cours_restants + 1,
                  statut:
                    packPurchase.cours_restants + 1 > 0 ? "active" : "consumed",
                  updated_at: new Date().toISOString(),
                })
                .eq("id", packPurchase.id);

              // Décrémenter l'usage pour ce type de cours
              const { data: currentUsage, error: usageError } = await supabase
                .from("user_pack_usage")
                .select("utilisations_consommees")
                .eq("user_pack_purchase_id", packPurchase.id)
                .eq("course_type_id", reservation.courses.course_type_id)
                .single();

              if (currentUsage) {
                // Si l'enregistrement existe, le décrémenter
                await supabase
                  .from("user_pack_usage")
                  .update({
                    utilisations_consommees: Math.max(
                      0,
                      currentUsage.utilisations_consommees - 1
                    ),
                    updated_at: new Date().toISOString(),
                  })
                  .eq("user_pack_purchase_id", packPurchase.id)
                  .eq("course_type_id", reservation.courses.course_type_id);
              } else if (usageError && usageError.code === "PGRST116") {
                // Si l'enregistrement n'existe pas, le créer avec 0 utilisations
                await supabase.from("user_pack_usage").insert({
                  user_pack_purchase_id: packPurchase.id,
                  course_type_id: reservation.courses.course_type_id,
                  utilisations_consommees: 0,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                });
              }
            }
          }
        }
      }
    } else {
      // Si pas de commande_id, chercher un pack actif pour l'utilisateur et ce type de cours

      const { data: activePack, error: activePackError } = await supabase
        .from("user_pack_purchases")
        .select("id, cours_restants, statut, date_expiration")
        .eq("user_id", user.id)
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
          await supabase
            .from("user_pack_purchases")
            .update({
              cours_restants: activePack.cours_restants + 1,
              updated_at: new Date().toISOString(),
            })
            .eq("id", activePack.id);

          // Décrémenter l'usage pour ce type de cours
          const { data: currentUsage, error: usageError } = await supabase
            .from("user_pack_usage")
            .select("utilisations_consommees")
            .eq("user_pack_purchase_id", activePack.id)
            .eq("course_type_id", reservation.courses.course_type_id)
            .single();

          if (currentUsage) {
            // Si l'enregistrement existe, le décrémenter
            await supabase
              .from("user_pack_usage")
              .update({
                utilisations_consommees: Math.max(
                  0,
                  currentUsage.utilisations_consommees - 1
                ),
                updated_at: new Date().toISOString(),
              })
              .eq("user_pack_purchase_id", activePack.id)
              .eq("course_type_id", reservation.courses.course_type_id);
          } else if (usageError && usageError.code === "PGRST116") {
            // Si l'enregistrement n'existe pas, le créer avec 0 utilisations
            // (car on annule une réservation, donc on rembourse l'utilisation)
            await supabase.from("user_pack_usage").insert({
              user_pack_purchase_id: activePack.id,
              course_type_id: reservation.courses.course_type_id,
              utilisations_consommees: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
        }
      }
    }

    // Décrémenter le nombre de réservations du cours
    const { data: currentCourse } = await supabase
      .from("courses")
      .select("current_bookings")
      .eq("id", reservation.courses.id)
      .single();

    if (currentCourse) {
      await supabase
        .from("courses")
        .update({
          current_bookings: Math.max(0, currentCourse.current_bookings - 1),
          updated_at: new Date().toISOString(),
        })
        .eq("id", reservation.courses.id);
    }

    return NextResponse.json({
      success: true,
      message: "Réservation annulée avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de l'annulation:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
