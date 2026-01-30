import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Types locaux pour ce module
interface Instructor {
  id: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateInstructorRequest {
  first_name: string;
  last_name: string;
  is_active?: boolean;
}

interface UpdateInstructorRequest {
  id: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
}

// GET - Récupérer la liste ou un instructeur spécifique
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

    const id = searchParams.get("id");
    const is_active = searchParams.get("is_active");
    const q = searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Un instructeur précis
    if (id) {
      const { data, error } = await supabase
        .from("instructors")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: "Instructeur non trouvé" },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data });
    }

    // Liste avec filtres
    let query = supabase
      .from("instructors")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (is_active !== null) {
      query = query.eq("is_active", is_active === "true");
    }

    if (q && q.trim().length > 0) {
      // Recherche simple sur prénom/nom (il faut avoir activé l'extension pg_trgm pour ilike performant sinon ça reste ok pour faible volume)
      query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Erreur récupération instructeurs:", error);
      return NextResponse.json(
        {
          error: "Erreur lors de la récupération des instructeurs",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      total: count ?? data?.length ?? 0,
      limit,
      offset,
    });
  } catch (err) {
    console.error("Erreur serveur:", err);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// POST - Créer un instructeur
export async function POST(request: NextRequest) {
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

    const body: CreateInstructorRequest = await request.json();

    if (!body.first_name || !body.last_name) {
      return NextResponse.json(
        { error: "first_name et last_name sont requis" },
        { status: 400 }
      );
    }

    const insertData = {
      first_name: body.first_name.trim(),
      last_name: body.last_name.trim(),
      is_active: body.is_active ?? true,
    };

    const { data, error } = await supabase
      .from("instructors")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Erreur création instructeur:", error);
      return NextResponse.json(
        {
          error: "Erreur lors de la création de l'instructeur",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data, message: "Instructeur créé avec succès" },
      { status: 201 }
    );
  } catch (err) {
    console.error("Erreur serveur:", err);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour un instructeur
export async function PUT(request: NextRequest) {
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

    const body: UpdateInstructorRequest = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: "ID de l'instructeur requis" },
        { status: 400 }
      );
    }

    // Vérifier l'existence
    const { data: existing, error: fetchError } = await supabase
      .from("instructors")
      .select("*")
      .eq("id", body.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: "Instructeur non trouvé" },
        { status: 404 }
      );
    }

    const updateData: Partial<Instructor> = {};
    if (body.first_name !== undefined)
      updateData.first_name = body.first_name.trim();
    if (body.last_name !== undefined)
      updateData.last_name = body.last_name.trim();
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    updateData.updated_at = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from("instructors")
      .update(updateData)
      .eq("id", body.id)
      .select()
      .single();

    if (error) {
      console.error("Erreur mise à jour instructeur:", error);
      return NextResponse.json(
        {
          error: "Erreur lors de la mise à jour de l'instructeur",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Instructeur mis à jour avec succès",
    });
  } catch (err) {
    console.error("Erreur serveur:", err);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un instructeur
export async function DELETE(request: NextRequest) {
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
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID de l'instructeur requis" },
        { status: 400 }
      );
    }

    // Vérifier l'existence
    const { data: existing, error: fetchError } = await supabase
      .from("instructors")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: "Instructeur non trouvé" },
        { status: 404 }
      );
    }

    const { error } = await supabase.from("instructors").delete().eq("id", id);

    if (error) {
      console.error("Erreur suppression instructeur:", error);
      return NextResponse.json(
        {
          error: "Erreur lors de la suppression de l'instructeur",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Instructeur supprimé avec succès",
    });
  } catch (err) {
    console.error("Erreur serveur:", err);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
