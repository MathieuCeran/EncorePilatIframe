import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { EmailService } from "@/lib/email-service";

interface PackLimitation {
  course_type_id: string;
  max_utilisations: number | null;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const serviceClient = createServiceClient();
    const body = await request.json();

    const { course_id, pack_id } = body;

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
        {
          error: "Vous avez déjà une réservation active pour ce cours",
        },
        { status: 409 }
      );
    }

    // Vérifier que le pack existe et est compatible avec le type de cours
    const { data: pack, error: packError } = await serviceClient
      .from("packs")
      .select(
        `
        *,
        pack_limitations (
          course_type_id,
          max_utilisations
        )
      `
      )
      .eq("id", pack_id)
      .is("deleted_at", null) // Exclure les packs supprimés
      .single();

    if (packError || !pack) {
      return NextResponse.json({ error: "Pack introuvable" }, { status: 404 });
    }

    // Vérifier que le pack est compatible avec le type de cours
    const packLimitations = (pack.pack_limitations || []) as PackLimitation[];
    const isCompatible =
      packLimitations.length === 0 ||
      packLimitations.some(
        (limitation: PackLimitation) =>
          limitation.course_type_id === course.course_type_id
      );

    if (!isCompatible) {
      return NextResponse.json(
        { error: "Ce pack n'est pas compatible avec ce type de cours" },
        { status: 400 }
      );
    }

    // Trouver un achat de pack actif et utilisable
    const { data: existingPack, error: existingPackErr } = await serviceClient
      .from("user_pack_purchases")
      .select("id, cours_restants, date_expiration")
      .eq("user_id", user.id)
      .eq("pack_id", pack_id)
      .eq("statut", "active")
      .gt("cours_restants", 0)
      .order("date_achat", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (existingPackErr || !existingPack) {
      console.error("Error finding existing pack:", existingPackErr);
      return NextResponse.json(
        { error: "Aucun pack actif disponible" },
        { status: 400 }
      );
    }

    // Vérifier si le pack n'est pas expiré
    if (
      existingPack.date_expiration &&
      new Date(existingPack.date_expiration) < new Date()
    ) {
      return NextResponse.json(
        { error: "Votre pack a expiré" },
        { status: 400 }
      );
    }

    // Vérifier la limitation par type de cours si applicable
    const { data: limitation } = await serviceClient
      .from("pack_limitations")
      .select("max_utilisations")
      .eq("pack_id", pack_id)
      .eq("course_type_id", course.course_type_id)
      .maybeSingle();

    if (limitation) {
      const { data: usageRow } = await serviceClient
        .from("user_pack_usage")
        .select("id, utilisations_consommees")
        .eq("user_id", user.id)
        .eq("course_type_id", course.course_type_id)
        .maybeSingle();

      const used = usageRow?.utilisations_consommees || 0;
      if (
        limitation.max_utilisations !== null &&
        used >= limitation.max_utilisations
      ) {
        return NextResponse.json(
          { error: "Limite de ce type de cours atteinte pour votre pack" },
          { status: 400 }
        );
      }
    }

    // Décrémenter le nombre de cours restants du pack
    const { error: updateError } = await serviceClient
      .from("user_pack_purchases")
      .update({
        cours_restants: existingPack.cours_restants - 1,
        statut: existingPack.cours_restants - 1 <= 0 ? "consumed" : "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingPack.id);

    if (updateError) {
      console.error("Error updating pack:", updateError);
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour du pack" },
        { status: 500 }
      );
    }

    // Upsert l'usage pour ce type de cours
    // D'abord, vérifier s'il existe déjà un enregistrement
    const { data: existingUsage } = await serviceClient
      .from("user_pack_usage")
      .select("utilisations_consommees")
      .eq("user_id", user.id)
      .eq("course_type_id", course.course_type_id)
      .maybeSingle();

    const currentUsage = existingUsage?.utilisations_consommees || 0;

    const { error: usageError } = await serviceClient
      .from("user_pack_usage")
      .upsert(
        {
          user_id: user.id,
          course_type_id: course.course_type_id,
          user_pack_purchase_id: existingPack.id,
          utilisations_consommees: currentUsage + 1,
        },
        {
          onConflict: "user_id,course_type_id",
        }
      );

    if (usageError) {
      console.error("Error updating pack usage:", usageError);
      return NextResponse.json(
        { error: "Erreur lors de l'enregistrement de l'usage" },
        { status: 500 }
      );
    }

    // Créer la réservation
    const { data: reservation, error: reservationError } = await serviceClient
      .from("reservations")
      .insert({
        user_id: user.id,
        course_id: course_id,
        commande_id: null, // Pas de commande pour les réservations avec pack
        statut: "confirmed",
        user_pack_purchase_id: existingPack.id, // Ajouter l'ID de l'achat de pack
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
      console.error("Error creating reservation:", reservationError);
      return NextResponse.json(
        { error: reservationError.message },
        { status: 400 }
      );
    }

    // Mettre à jour le nombre de réservations du cours
    await serviceClient
      .from("courses")
      .update({ current_bookings: course.current_bookings + 1 })
      .eq("id", course_id);

    // Envoyer l'email de confirmation de cours
    try {
      // Récupérer les informations complètes pour l'email
      const { data: userProfile } = await serviceClient
        .from("profiles")
        .select("first_name, last_name, email")
        .eq("id", user.id)
        .single();

      const { data: courseDetails } = await serviceClient
        .from("courses")
        .select(
          `
          date,
          start_time,
          end_time,
          name
        `
        )
        .eq("id", course_id)
        .single();

      const { data: instructorDetails } = await serviceClient
        .from("courses")
        .select(
          `
          instructors (first_name, last_name)
        `
        )
        .eq("id", course_id)
        .single();

      if (userProfile && courseDetails && instructorDetails) {
        console.log("🔔 Début envoi email de confirmation de cours");
        console.log("📧 Destinataire:", userProfile.email);
        
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

        const instructorName = instructorDetails.instructors && instructorDetails.instructors.length > 0
          ? `${instructorDetails.instructors[0].first_name} ${instructorDetails.instructors[0].last_name}`
          : "À déterminer";

        console.log("📨 Données email:", {
          courseType: courseDetails.name,
          courseDate,
          courseTime: startTime,
          instructorName,
          packName: pack.nom,
        });

        await EmailService.sendCourseConfirmation(userProfile.email, {
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
            throw new Error(result.error || "Échec envoi email");
          }
        });
        
        console.log("✅ Email de confirmation envoyé avec succès");
      } else {
        console.error("❌ Données manquantes pour l'email:", {
          hasUserProfile: !!userProfile,
          hasCourseDetails: !!courseDetails,
          hasInstructorDetails: !!instructorDetails,
        });
      }
    } catch (emailError) {
      console.error(
        "❌ ERREUR EMAIL - Détails complets:",
        emailError
      );
      console.error("Stack:", emailError instanceof Error ? emailError.stack : "N/A");
      // Ne pas faire échouer la réservation si l'email échoue
    }

    return NextResponse.json(
      {
        booking: reservation,
        message: "Réservation confirmée avec votre pack",
        pack_remaining: existingPack.cours_restants - 1,
        booking_id: reservation.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating booking with pack:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const serviceClient = createServiceClient();
    const { searchParams } = new URL(request.url);

    const courseId = searchParams.get("course_id");
    const packId = searchParams.get("pack_id");

    if (!courseId || !packId) {
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

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier que le cours existe
    const { data: course, error: courseError } = await serviceClient
      .from("courses")
      .select("course_type_id")
      .eq("id", courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: "Cours introuvable" }, { status: 404 });
    }

    // Vérifier que le pack existe et est compatible
    const { data: pack, error: packError } = await serviceClient
      .from("packs")
      .select(
        `
        *,
        pack_limitations (
          course_type_id,
          max_utilisations
        )
      `
      )
      .eq("id", packId)
      .is("deleted_at", null) // Exclure les packs supprimés
      .single();

    if (packError || !pack) {
      return NextResponse.json({ error: "Pack introuvable" }, { status: 404 });
    }

    // Vérifier la compatibilité
    const packLimitations = (pack.pack_limitations || []) as PackLimitation[];
    const isCompatible =
      packLimitations.length === 0 ||
      packLimitations.some(
        (limitation: PackLimitation) =>
          limitation.course_type_id === course.course_type_id
      );

    if (!isCompatible) {
      return NextResponse.json(
        { error: "Ce pack n'est pas compatible avec ce type de cours" },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur a un pack actif
    const { data: userPack, error: userPackError } = await serviceClient
      .from("user_pack_purchases")
      .select("id, cours_restants, date_expiration")
      .eq("user_id", user.id)
      .eq("pack_id", packId)
      .eq("statut", "active")
      .gt("cours_restants", 0)
      .order("date_achat", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (userPackError || !userPack) {
      return NextResponse.json(
        { error: "Aucun pack actif disponible" },
        { status: 400 }
      );
    }

    // Vérifier l'expiration
    const isExpired =
      userPack.date_expiration &&
      new Date(userPack.date_expiration) < new Date();

    if (isExpired) {
      return NextResponse.json(
        { error: "Votre pack a expiré" },
        { status: 400 }
      );
    }

    // Vérifier les limitations par type de cours
    let canBook = true;
    let limitationMessage = "";

    if (packLimitations.length > 0) {
      const limitation = packLimitations.find(
        (l: PackLimitation) => l.course_type_id === course.course_type_id
      );

      if (limitation && limitation.max_utilisations !== null) {
        const { data: usageRow } = await serviceClient
          .from("user_pack_usage")
          .select("utilisations_consommees")
          .eq("user_id", user.id)
          .eq("course_type_id", course.course_type_id)
          .maybeSingle();

        const used = usageRow?.utilisations_consommees || 0;

        if (used >= limitation.max_utilisations) {
          canBook = false;
          limitationMessage = `Limite de ${limitation.max_utilisations} cours pour ce type atteinte`;
        }
      }
    }

    return NextResponse.json({
      can_book: canBook,
      pack_info: {
        id: pack.id,
        nom: pack.nom,
        cours_restants: userPack.cours_restants,
        date_expiration: userPack.date_expiration,
      },
      limitation_message: limitationMessage,
    });
  } catch (error) {
    console.error("Error checking pack availability:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}
