import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

/**
 * API Route pour effectuer la réinitialisation avec un token personnalisé
 * POST /api/auth/reset-password-with-token
 */
export async function POST(request: NextRequest) {
  try {
    // Validation du Content-Type
    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return NextResponse.json(
        {
          success: false,
          error: "Content-Type doit être application/json",
        },
        { status: 400 }
      );
    }

    // Parsing du body
    let body: ResetPasswordRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Corps de requête JSON invalide",
        },
        { status: 400 }
      );
    }

    const { token, newPassword } = body;

    // Validation des paramètres
    if (!token || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "Token et nouveau mot de passe requis",
        },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: "Le mot de passe doit contenir au moins 6 caractères",
        },
        { status: 400 }
      );
    }

    // Initialisation du client Supabase
    const supabase = createServiceClient();

    // Rechercher et valider le token
    const { data: tokenData, error: tokenError } = await supabase
      .from("password_reset_tokens")
      .select("*")
      .eq("token", token)
      .is("used_at", null) // Token non utilisé
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json(
        {
          success: false,
          error: "Token invalide ou déjà utilisé",
        },
        { status: 404 }
      );
    }

    // Vérifier l'expiration
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);

    if (now > expiresAt) {
      // Supprimer le token expiré
      await supabase.from("password_reset_tokens").delete().eq("token", token);

      return NextResponse.json(
        {
          success: false,
          error: "Token expiré",
        },
        { status: 410 }
      );
    }

    // Mettre à jour le mot de passe via l'API admin de Supabase
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      tokenData.user_id,
      { password: newPassword }
    );

    if (updateError) {
      console.error(
        "Erreur lors de la mise à jour du mot de passe:",
        updateError
      );
      return NextResponse.json(
        {
          success: false,
          error: "Erreur lors de la mise à jour du mot de passe",
        },
        { status: 500 }
      );
    }

    // Marquer le token comme utilisé
    const { error: markUsedError } = await supabase
      .from("password_reset_tokens")
      .update({ used_at: now.toISOString() })
      .eq("token", token);

    if (markUsedError) {
      console.error(
        "Erreur lors du marquage du token comme utilisé:",
        markUsedError
      );
      // Ne pas faire échouer la requête pour ça
    }

    // Nettoyer les autres tokens non utilisés pour cet utilisateur
    await supabase
      .from("password_reset_tokens")
      .delete()
      .eq("user_id", tokenData.user_id)
      .is("used_at", null)
      .neq("token", token);

    console.log(
      `Mot de passe mis à jour avec succès pour l'utilisateur ${tokenData.user_id}`
    );

    return NextResponse.json({
      success: true,
      message: "Mot de passe mis à jour avec succès",
    });
  } catch (error) {
    console.error("Erreur inattendue dans reset-password-with-token:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur interne du serveur",
      },
      { status: 500 }
    );
  }
}

// Rejeter les autres méthodes HTTP
export async function GET() {
  return NextResponse.json(
    { success: false, error: "Méthode non autorisée" },
    { status: 405 }
  );
}
