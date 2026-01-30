import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/admin/users/[id]/orders
// Récupère les commandes avec pagination et recherche
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
      .from("commandes")
      .select(
        `
        *,
        packs (
          id,
          nom,
          description,
          prix,
          type_pack,
          nombre_cours_total
        )
      `,
        { count: "exact" }
      )
      .eq("user_id", userId);

    // Ajouter la recherche sur l'ID de commande ou les notes
    if (search) {
      query = query.or(`id.ilike.%${search}%,notes.ilike.%${search}%`);
    }

    const { data: commandes, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Erreur Supabase:", error);
      return NextResponse.json(
        {
          error: "Erreur lors de la récupération des commandes",
          details: error.message,
        },
        { status: 400 }
      );
    }

    // Filtrer les résultats côté serveur si on cherche dans les noms de packs
    let filteredCommandes = commandes || [];
    if (search && commandes) {
      filteredCommandes = commandes.filter((commande) => {
        // Recherche dans les champs de la commande (déjà fait par Supabase)
        const commandeMatch =
          commande.id.toLowerCase().includes(search.toLowerCase()) ||
          (commande.notes &&
            commande.notes.toLowerCase().includes(search.toLowerCase()));

        // Recherche dans le nom du pack
        const packMatch =
          commande.packs &&
          commande.packs.nom &&
          commande.packs.nom.toLowerCase().includes(search.toLowerCase());

        return commandeMatch || packMatch;
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        orders: filteredCommandes,
        pagination: {
          page,
          limit,
          total: filteredCommandes.length,
          totalPages: Math.ceil(filteredCommandes.length / limit),
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
