import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/admin/users/[id]/promote
 * Endpoint pour promouvoir un utilisateur en admin
 * Nécessite d'être admin pour utiliser cette fonction
 */
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

    // Vérifier que l'utilisateur connecté est admin
    const { data: currentUserRole } = await supabase.rpc("get_user_role");
    
    if (currentUserRole !== "admin") {
      return NextResponse.json(
        { success: false, message: "Seuls les admins peuvent promouvoir d'autres utilisateurs" },
        { status: 403 }
      );
    }

    const { id: targetUserId } = await params;
    const { role_name } = await request.json();

    // Valider le rôle demandé
    const allowedRoles = ['admin', 'client', 'hostess'];
    if (!allowedRoles.includes(role_name)) {
      return NextResponse.json(
        { error: "Rôle invalide. Rôles autorisés: " + allowedRoles.join(', ') },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur cible existe
    const { data: targetUser, error: targetUserError } = await supabase
      .from("profiles")
      .select("id, email, first_name, last_name")
      .eq("id", targetUserId)
      .single();

    if (targetUserError || !targetUser) {
      return NextResponse.json(
        { error: "Utilisateur cible non trouvé" },
        { status: 404 }
      );
    }

    // Récupérer l'ID du nouveau rôle
    const { data: newRole, error: roleError } = await supabase
      .from("roles")
      .select("id, name")
      .eq("name", role_name)
      .single();

    if (roleError || !newRole) {
      return NextResponse.json(
        { error: "Rôle non trouvé" },
        { status: 404 }
      );
    }

    // Récupérer le rôle actuel
    const { data: currentRoleData } = await supabase
      .from("user_roles")
      .select(`
        role_id,
        roles(name)
      `)
      .eq("user_id", targetUserId)
      .single();

    const currentRoleName = Array.isArray(currentRoleData?.roles)
      ? (currentRoleData?.roles?.[0] as { name?: string })?.name
      : ((currentRoleData?.roles as unknown) as { name?: string })?.name;

    // Si l'utilisateur a déjà le bon rôle
    if (currentRoleName === role_name) {
      return NextResponse.json({
        success: true,
        message: `L'utilisateur est déjà ${role_name}`,
        data: {
          user: targetUser,
          previous_role: currentRoleName,
          new_role: role_name
        }
      });
    }

    // Mettre à jour le rôle
    const { error: updateError } = await supabase
      .from("user_roles")
      .upsert({
        user_id: targetUserId,
        role_id: newRole.id
      }, {
        onConflict: "user_id"
      });

    if (updateError) {
      console.error("Erreur lors de la mise à jour du rôle:", updateError);
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour du rôle" },
        { status: 500 }
      );
    }

    // Log de l'action pour audit
    console.log(`🔄 ROLE_CHANGE: Admin ${user.email} a changé le rôle de ${targetUser.email} de ${currentRoleName} à ${role_name}`);

    return NextResponse.json({
      success: true,
      message: `Rôle mis à jour avec succès`,
      data: {
        user: targetUser,
        previous_role: currentRoleName,
        new_role: role_name,
        updated_by: user.email,
        updated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("Erreur serveur:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
