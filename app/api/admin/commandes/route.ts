import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const client = await createClient();
    const supabase = await createServiceClient();

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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    let query = supabase
      .from("commandes")
      .select(
        `
        *,
        profiles (
          id,
          first_name,
          last_name,
          email
        ),
        packs (
          id,
          nom,
          prix,
          type_pack,
          nombre_cours_total
        )
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("statut", status);
    }

    const { data: commandes, error, count } = await query;

    if (error) {
      console.error("Erreur lors de la récupération des commandes:", error);
      return NextResponse.json(
        {
          success: false,
          message: "Erreur lors de la récupération des commandes",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: commandes,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
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
