import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/admin/users
// Renvoie uniquement les infos de la table `profiles` (lazy loading via pagination + recherche)
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);

    const q = searchParams.get("q");
    const limitParam = searchParams.get("limit");
    const limit = limitParam === "all" ? null : parseInt(limitParam || "1000", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const sort = searchParams.get("sort") || "created_at"; // created_at | first_name | last_name
    const order =
      (searchParams.get("order") || "desc").toLowerCase() === "asc"
        ? "asc"
        : "desc";

    // Sélection paginée des profils uniquement
    let query = supabase
      .from("profiles")
      .select(
        "id, email, first_name, last_name, phone, created_at, updated_at",
        { count: "exact" }
      )
      .order(sort, { ascending: order === "asc" });

    // Appliquer la limite seulement si elle n'est pas "all"
    if (limit !== null) {
      query = query.range(offset, offset + limit - 1);
    }

    if (q && q.trim().length > 0) {
      // Recherche simple sur prénom/nom/email
      query = query.or(
        `first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`
      );
    }

    const { data, error, count } = await query;
    if (error) {
      console.error("Erreur récupération profils:", error);
      return NextResponse.json(
        {
          error: "Erreur lors de la récupération des profils",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      total: count ?? data?.length ?? 0,
      limit: limit || "all",
      offset,
      sort,
      order,
    });
  } catch (err) {
    console.error("Erreur serveur:", err);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
