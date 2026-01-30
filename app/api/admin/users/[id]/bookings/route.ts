import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/admin/users/[id]/bookings
// Récupère les réservations avec pagination et recherche
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

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
    // Rôle
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

    const { id: userId } = await params;
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const offset = (page - 1) * limit;

    let query = supabase
      .from("reservations")
      .select(
        `
        *,
        courses (
          id,
          date,
          start_time,
          end_time,
          course_types (
            id,
            name
          )
        )
      `,
        { count: "exact" }
      )
      .eq("user_id", userId);

    // Ajouter la recherche sur le nom du type de cours
    if (search) {
      // Recherche dans les types de cours liés
      query = query.filter("courses.course_types.name", "ilike", `%${search}%`);
    }

    const { data: reservations, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        {
          error: "Erreur lors de la récupération des réservations",
          details: error.message,
        },
        { status: 400 }
      );
    }

    // Filtrer les résultats pour exclure les réservations sans nom de cours si on fait une recherche
    let filteredReservations = reservations || [];
    if (search && reservations) {
      filteredReservations = reservations.filter((reservation) => {
        return (
          reservation.courses &&
          reservation.courses.course_types &&
          reservation.courses.course_types.name &&
          reservation.courses.course_types.name
            .toLowerCase()
            .includes(search.toLowerCase())
        );
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        bookings: filteredReservations,
        pagination: {
          page,
          limit,
          total: filteredReservations.length,
          totalPages: Math.ceil(filteredReservations.length / limit),
        },
      },
    });
  } catch (err) {
    console.error("Erreur serveur:", err);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
