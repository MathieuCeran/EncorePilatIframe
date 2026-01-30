import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/admin/users/[id]
// Renvoie le profil complet + rôle
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

    // Profil de base
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé", details: profileError.message },
        { status: 404 }
      );
    }

    // Récupérer le rôle de l'utilisateur cible (pas l'utilisateur connecté)
    const { data: targetUserRoleData } = await supabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", userId)
      .single();

    const targetUserRole = Array.isArray(targetUserRoleData?.roles)
      ? (targetUserRoleData?.roles?.[0]?.name ?? null)
      : ((targetUserRoleData as { roles?: { name?: string } })?.roles?.name ?? null);

    return NextResponse.json({
      success: true,
      data: {
        profile,
        role: targetUserRole, // Rôle de l'utilisateur cible
        roleData: targetUserRoleData, // Données complètes si nécessaire
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

// POST /api/admin/users/[id]
// Met à jour le profil et (optionnel) le rôle
export async function POST(
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
    const { data: roleData } = await supabase.rpc("get_user_role");
    if (roleData !== "admin" && roleData !== "hostess") {
      return NextResponse.json(
        { success: false, message: "Accès refusé" },
        { status: 403 }
      );
    }

    const { id: userId } = await params;
    const body = await request.json();

    const updateProfile: Record<string, unknown> = {};
    if (body.email !== undefined)
      updateProfile.email = String(body.email).trim();
    if (body.first_name !== undefined)
      updateProfile.first_name = String(body.first_name).trim();
    if (body.last_name !== undefined)
      updateProfile.last_name = String(body.last_name).trim();
    if (body.phone !== undefined)
      updateProfile.phone = String(body.phone).trim();

    let updatedProfile = null;
    if (Object.keys(updateProfile).length > 0) {
      const { data, error } = await supabase
        .from("profiles")
        .update(updateProfile)
        .eq("id", userId)
        .select()
        .single();
      if (error) {
        return NextResponse.json(
          {
            error: "Erreur lors de la mise à jour du profil",
            details: error.message,
          },
          { status: 400 }
        );
      }
      updatedProfile = data;
    }

    // Mise à jour du rôle optionnelle via body.role_name
    let updatedRole: string | null = null;
    if (body.role_name !== undefined) {
      // Récupérer l'id du rôle par son nom
      const { data: roleRow, error: roleLookupError } = await supabase
        .from("roles")
        .select("id, name")
        .eq("name", body.role_name)
        .single();

      if (roleLookupError || !roleRow) {
        return NextResponse.json(
          { error: "Rôle inconnu", details: roleLookupError?.message },
          { status: 400 }
        );
      }

      // Upsert sur user_roles
      const { error: upsertError } = await supabase
        .from("user_roles")
        .upsert(
          { user_id: userId, role_id: roleRow.id },
          { onConflict: "user_id" }
        );

      if (upsertError) {
        return NextResponse.json(
          {
            error: "Erreur lors de la mise à jour du rôle",
            details: upsertError.message,
          },
          { status: 400 }
        );
      }
      updatedRole = roleRow.name;
    }

    return NextResponse.json({
      success: true,
      message: "Utilisateur mis à jour",
      data: {
        profile: updatedProfile,
        role: updatedRole,
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
