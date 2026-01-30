import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST - Ajouter un pack à un utilisateur
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: userId } = await params;
    const body = await request.json();

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

    // Vérifier que l'utilisateur existe
    const { data: userProfile, error: userError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (userError || !userProfile) {
      return NextResponse.json(
        { success: false, message: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    // Vérifier que le pack existe
    const { data: pack, error: packError } = await supabase
      .from("packs")
      .select("*")
      .eq("id", body.pack_id)
      .is("deleted_at", null)
      .single();

    if (packError || !pack) {
      return NextResponse.json(
        { success: false, message: "Pack introuvable" },
        { status: 404 }
      );
    }

    // Calculer la date d'expiration si pas fournie
    let dateExpiration = body.date_expiration;
    if (!dateExpiration && pack.duree_validite_jours) {
      const now = new Date();
      now.setDate(now.getDate() + pack.duree_validite_jours);
      dateExpiration = now.toISOString();
    }

    // Créer le user_pack_purchase
    const { data: newPack, error: createError } = await supabase
      .from("user_pack_purchases")
      .insert({
        user_id: userId,
        pack_id: body.pack_id,
        date_achat: new Date().toISOString(),
        date_expiration: dateExpiration,
        cours_restants: body.cours_restants || pack.nombre_cours_total,
        statut: body.statut || "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select(
        `
        *,
        packs (
          nom,
          description,
          prix,
          type_pack,
          nombre_cours_total
        )
      `
      )
      .single();

    if (createError) {
      console.error("Erreur lors de la création:", createError);
      return NextResponse.json(
        { success: false, message: "Erreur lors de l'ajout du pack" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Pack ajouté avec succès",
      data: newPack,
    });
  } catch (error) {
    console.error("Erreur serveur:", error);
    return NextResponse.json(
      { success: false, message: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// GET /api/admin/users/[id]/packs
// Récupère les packs avec pagination et recherche
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
      .from("user_pack_purchases")
      .select(
        `
        *,
        packs (
          id,
          nom,
          description,
          prix,
          type_pack
        ),
        usage:user_pack_usage (
          id,
          course_type_id,
          utilisations_consommees,
          course_types (
            id,
            name,
            description
          )
        )
      `,
        { count: "exact" }
      )
      .eq("user_id", userId);

    // Ajouter la recherche sur le nom du pack
    if (search) {
      // Recherche dans les packs liés
      query = query.filter("packs.nom", "ilike", `%${search}%`);
    }

    const { data: packPurchases, error } = await query
      .order("date_achat", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Erreur Supabase:", error);
      return NextResponse.json(
        {
          error: "Erreur lors de la récupération des packs",
          details: error.message,
        },
        { status: 400 }
      );
    }

    // Filtrer les résultats pour exclure les packs sans nom si on fait une recherche
    let filteredPacks = packPurchases || [];
    if (search && packPurchases) {
      filteredPacks = packPurchases.filter((pack) => {
        return (
          pack.packs &&
          pack.packs.nom &&
          pack.packs.nom.toLowerCase().includes(search.toLowerCase())
        );
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        packs: filteredPacks,
        pagination: {
          page,
          limit,
          total: filteredPacks.length,
          totalPages: Math.ceil(filteredPacks.length / limit),
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
