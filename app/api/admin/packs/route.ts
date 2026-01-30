import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Pack, CreatePackRequest, UpdatePackRequest } from "@/types/types";

// GET - Récupérer tous les packs ou un pack spécifique
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const packId = searchParams.get("id");
    const is_active = searchParams.get("is_active");
    const type = searchParams.get("type");
    const course_type_id = searchParams.get("course_type_id");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

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

    // Sélection commune avec relations: inclut les limitations par type de cours
    const baseSelect = `*, limitations:pack_limitations (
      id,
      pack_id,
      course_type_id,
      max_utilisations,
      course_types (
        id,
        name,
        description,
        duration_minutes
      )
    )`;

    // Si un ID spécifique est fourni, récupérer ce pack avec ses limitations
    if (packId) {
      const { data: pack, error: packError } = await supabase
        .from("packs")
        .select(baseSelect)
        .eq("id", packId)
        .is("deleted_at", null) // Exclure les packs supprimés
        .single();

      if (packError) {
        return NextResponse.json({ error: "Pack non trouvé" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: pack,
      });
    }

    // Si un course_type_id est fourni, récupérer les packs qui contiennent ce type de cours
    if (course_type_id) {
      const { data: packIds, error: packIdsError } = await supabase
        .from("pack_limitations")
        .select("pack_id")
        .eq("course_type_id", course_type_id);

      if (packIdsError) {
        console.error("Erreur récupération pack IDs:", packIdsError);
        return NextResponse.json(
          {
            error: "Erreur lors de la récupération des packs par type de cours",
            details: packIdsError.message,
          },
          { status: 500 }
        );
      }

      const packIdList = packIds?.map((p) => p.pack_id) || [];

      if (packIdList.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
          total: 0,
          limit,
          offset,
        });
      }

      let query = supabase
        .from("packs")
        .select(baseSelect, { count: "exact" })
        .in("id", packIdList)
        .is("deleted_at", null) // Exclure les packs supprimés
        .range(offset, offset + limit - 1)
        .order("created_at", { ascending: false });

      if (is_active !== null) {
        query = query.eq("is_active", is_active === "true");
      }

      if (type) {
        query = query.eq("type_pack", type);
      }

      const { data: packs, error, count } = await query;

      if (error) {
        console.error("Erreur Supabase:", error);
        return NextResponse.json(
          {
            error: "Erreur lors de la récupération des packs",
            details: error.message,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: packs,
        total: count,
        limit,
        offset,
      });
    }

    // Sinon, récupérer tous les packs avec filtres
    let query = supabase
      .from("packs")
      .select(baseSelect, { count: "exact" })
      .is("deleted_at", null) // Exclure les packs supprimés
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (is_active !== null) {
      query = query.eq("is_active", is_active === "true");
    }

    if (type) {
      query = query.eq("type_pack", type);
    }

    const { data: packs, error, count } = await query;

    if (error) {
      console.error("Erreur Supabase:", error);
      return NextResponse.json(
        {
          error: "Erreur lors de la récupération des packs",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: packs,
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

// POST - Créer un nouveau pack
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body: CreatePackRequest = await request.json();

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

    // Validation des données
    if (!body.nom || !body.prix || !body.type_pack) {
      return NextResponse.json(
        { error: "Nom, prix et type_pack sont requis" },
        { status: 400 }
      );
    }

    if (!["decouverte", "mono_cours", "multi_cours"].includes(body.type_pack)) {
      return NextResponse.json(
        { error: "Type de pack invalide" },
        { status: 400 }
      );
    }

    // Validation pour tous les types de packs
    if (
      (body.type_pack === "multi_cours" ||
        body.type_pack === "mono_cours" ||
        body.type_pack === "decouverte") &&
      (!body.limitations || body.limitations.length === 0)
    ) {
      return NextResponse.json(
        {
          error:
            "Tous les types de packs doivent avoir au moins une limitation de type de cours",
        },
        { status: 400 }
      );
    }

    // Créer le pack
    const packData = {
      nom: body.nom,
      description: body.description,
      prix: body.prix,
      type_pack: body.type_pack,
      duree_validite_jours: body.duree_validite_jours,
      nombre_cours_total: body.nombre_cours_total,
      is_active: body.is_active ?? true,
    };

    const { data: pack, error: packError } = await supabase
      .from("packs")
      .insert(packData)
      .select()
      .single();

    if (packError) {
      console.error("Erreur création pack:", packError);
      return NextResponse.json(
        { error: "Erreur lors de la création du pack" },
        { status: 500 }
      );
    }

    // Créer les limitations pour les types de cours
    if (body.limitations && body.limitations.length > 0) {
      const limitationsData = body.limitations.map((limitation) => ({
        pack_id: pack.id,
        course_type_id: limitation.course_type_id,
        max_utilisations: limitation.max_utilisations,
      }));

      const { error: limitationsError } = await supabase
        .from("pack_limitations")
        .insert(limitationsData);

      if (limitationsError) {
        console.error("Erreur création limitations:", limitationsError);
        // Supprimer le pack créé en cas d'erreur
        await supabase.from("packs").delete().eq("id", pack.id);
        return NextResponse.json(
          { error: "Erreur lors de la création des limitations de cours" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: pack,
        message: "Pack créé avec succès",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur serveur:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour un pack
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body: UpdatePackRequest = await request.json();

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

    if (!body.id) {
      return NextResponse.json({ error: "ID du pack requis" }, { status: 400 });
    }

    // Vérifier que le pack existe
    const { data: existingPack, error: fetchError } = await supabase
      .from("packs")
      .select("*")
      .eq("id", body.id)
      .single();

    if (fetchError || !existingPack) {
      return NextResponse.json({ error: "Pack non trouvé" }, { status: 404 });
    }

    // Préparer les données de mise à jour
    const updateData: Partial<Pack> = {};
    if (body.nom) updateData.nom = body.nom;
    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.prix !== undefined) updateData.prix = body.prix;
    if (body.type_pack) updateData.type_pack = body.type_pack;
    if (body.duree_validite_jours !== undefined)
      updateData.duree_validite_jours = body.duree_validite_jours;
    if (body.nombre_cours_total !== undefined)
      updateData.nombre_cours_total = body.nombre_cours_total;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    updateData.updated_at = new Date().toISOString();

    // Mettre à jour le pack
    const { data: updatedPack, error: updateError } = await supabase
      .from("packs")
      .update(updateData)
      .eq("id", body.id)
      .select()
      .single();

    if (updateError) {
      console.error("Erreur mise à jour pack:", updateError);
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour du pack" },
        { status: 500 }
      );
    }

    // Mettre à jour les limitations de types de cours
    if (body.limitations) {
      // Supprimer les anciennes limitations
      await supabase.from("pack_limitations").delete().eq("pack_id", body.id);

      // Créer les nouvelles limitations si des types de cours sont fournis
      if (body.limitations.length > 0) {
        const limitationsData = body.limitations.map((limitation) => ({
          pack_id: body.id,
          course_type_id: limitation.course_type_id,
          max_utilisations: limitation.max_utilisations,
        }));

        const { error: limitationsError } = await supabase
          .from("pack_limitations")
          .insert(limitationsData);

        if (limitationsError) {
          console.error("Erreur mise à jour limitations:", limitationsError);
          return NextResponse.json(
            {
              error: "Erreur lors de la mise à jour des limitations de cours",
            },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedPack,
      message: "Pack mis à jour avec succès",
    });
  } catch (error) {
    console.error("Erreur serveur:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un pack
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const packId = searchParams.get("id");

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

    if (!packId) {
      return NextResponse.json({ error: "ID du pack requis" }, { status: 400 });
    }

    // Vérifier que le pack existe
    const { data: existingPack, error: fetchError } = await supabase
      .from("packs")
      .select("*")
      .eq("id", packId)
      .single();

    if (fetchError || !existingPack) {
      return NextResponse.json({ error: "Pack non trouvé" }, { status: 404 });
    }

    // Vérifier s'il y a des achats ou commandes liés à ce pack
    const { data: purchases } = await supabase
      .from("user_pack_purchases")
      .select("id")
      .eq("pack_id", packId)
      .limit(1);

    const { data: orders } = await supabase
      .from("commandes")
      .select("id")
      .eq("pack_id", packId)
      .limit(1);

    const hasLinkedData =
      (purchases && purchases.length > 0) || (orders && orders.length > 0);

    if (hasLinkedData) {
      // Soft delete: marquer comme supprimé au lieu de supprimer physiquement
      const { error: updateError } = await supabase
        .from("packs")
        .update({
          deleted_at: new Date().toISOString(),
          is_active: false,
          nom: `[SUPPRIMÉ] ${existingPack.nom}`,
        })
        .eq("id", packId);

      if (updateError) {
        console.error("Erreur soft delete pack:", updateError);
        return NextResponse.json(
          { error: "Erreur lors de la suppression du pack" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Pack supprimé avec succès (données utilisateurs préservées)",
        soft_deleted: true,
      });
    } else {
      // Suppression physique si aucune donnée liée
      const { error: deleteError } = await supabase
        .from("packs")
        .delete()
        .eq("id", packId);

      if (deleteError) {
        console.error("Erreur suppression pack:", deleteError);
        return NextResponse.json(
          { error: "Erreur lors de la suppression du pack" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Pack supprimé définitivement",
        soft_deleted: false,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Pack supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur serveur:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
