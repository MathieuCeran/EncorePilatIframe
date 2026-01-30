import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

interface VerifyTokenRequest {
  token: string;
}

/**
 * API Route pour vérifier un token de réinitialisation personnalisé
 * POST /api/auth/verify-reset-token
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
    let body: VerifyTokenRequest;
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

    const { token } = body;

    // Validation du token
    if (!token || typeof token !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Token requis",
        },
        { status: 400 }
      );
    }

    // Vérifier le format du token
    if (!token.startsWith("rst_")) {
      return NextResponse.json(
        {
          success: false,
          error: "Format de token invalide",
        },
        { status: 400 }
      );
    }

    // Initialisation du client Supabase
    const supabase = createServiceClient();

    // Rechercher le token en base
    const { data: tokenData, error: tokenError } = await supabase
      .from("password_reset_tokens")
      .select("*")
      .eq("token", token)
      .is("used_at", null) // Token non utilisé
      .single();

    if (tokenError || !tokenData) {
      console.log(`Token non trouvé ou déjà utilisé: ${token}`);
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
      console.log(`Token expiré: ${token}`);

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

    // Token valide
    return NextResponse.json({
      success: true,
      email: tokenData.email,
      userId: tokenData.user_id,
      expiresAt: tokenData.expires_at,
    });
  } catch (error) {
    console.error("Erreur inattendue dans verify-reset-token:", error);
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
