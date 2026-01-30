import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ReservationWithCourse, FormattedReservation } from "@/types/types";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Vérifier l'authentification de l'utilisateur
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const selectFields = `
      *,
      courses (
        id,
        date,
        start_time,
        end_time,
        max_capacity,
        current_bookings,
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
      )
    `;

    let query = supabase
      .from("reservations")
      .select(selectFields, { count: "exact" })
      .eq("user_id", user.id)
      .neq("statut", "cancelled") // Exclure les réservations annulées
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("statut", status);
    }

    const { data: reservations, error, count } = await query;

    if (error) {
      console.error("Erreur Supabase:", error);
      return NextResponse.json(
        {
          error: "Erreur lors de la récupération des réservations",
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Formater les données pour l'affichage
    const formattedReservations = reservations?.map(
      (reservation: ReservationWithCourse): FormattedReservation => ({
        id: reservation.id,
        course: {
          id: reservation.courses.id,
          date: reservation.courses.date,
          start_time: reservation.courses.start_time,
          end_time: reservation.courses.end_time,
          max_capacity: reservation.courses.max_capacity,
          current_bookings: reservation.courses.current_bookings,
          course_type: reservation.courses.course_types,
          instructor: reservation.courses.instructors,
        },
        status: reservation.statut,
        presente: reservation.presente,
        date_presence: reservation.date_presence,
        date_annulation: reservation.date_annulation,
        raison_annulation: reservation.raison_annulation,
        created_at: reservation.created_at,
        pack_info: null,
      })
    );

    return NextResponse.json({
      success: true,
      data: formattedReservations,
      total: count,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Erreur serveur:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
