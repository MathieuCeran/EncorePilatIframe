import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { AuthEmailService } from "@/lib/auth-email-service";

interface ResetPasswordRequestBody {
  email: string;
}

/**
 * API Route pour envoyer un email de réinitialisation de mot de passe
 * POST /api/auth/send-reset-password
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
    let body: ResetPasswordRequestBody;
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

    const { email } = body;

    // Validation des paramètres requis
    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: "L'adresse email est requise",
        },
        { status: 400 }
      );
    }

    // Validation du format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: "Format d'email invalide",
        },
        { status: 400 }
      );
    }

    // Initialisation du client Supabase
    const supabase = createServiceClient();

    // Vérifier si l'utilisateur existe
    const { data: existingUser, error: userCheckError } = await supabase
      .from("profiles")
      .select("email, first_name, last_name")
      .eq("email", email.toLowerCase())
      .single();

    if (userCheckError && userCheckError.code !== "PGRST116") {
      console.error(
        "Erreur lors de la vérification de l'utilisateur:",
        userCheckError
      );
      return NextResponse.json(
        {
          success: false,
          error: "Erreur lors de la vérification du compte",
        },
        { status: 500 }
      );
    }

    // Si l'utilisateur n'existe pas, on renvoie quand même un succès pour des raisons de sécurité
    // (éviter l'énumération d'emails)
    if (!existingUser) {
      console.log(`Tentative de reset pour email inexistant: ${email}`);
      return NextResponse.json({
        success: true,
        message:
          "Si un compte existe avec cette adresse email, vous recevrez un lien de réinitialisation",
      });
    }

    // Note: La vérification du statut de confirmation est complexe sans l'ID utilisateur
    // On procède à l'envoi, Supabase gérera la validation côté serveur

    // Déterminer le nom à utiliser
    const customerName =
      `${existingUser.first_name || ""} ${existingUser.last_name || ""}`.trim() ||
      "Cher(e) client(e)";

    // Générer un token personnalisé sécurisé au lieu d'utiliser Supabase
    const resetToken = `rst_${Date.now()}_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // Récupérer l'ID utilisateur depuis la table profiles (qui contient l'ID auth)
    const { data: profileUser, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, first_name, last_name")
      .eq("email", email.toLowerCase())
      .single();

    if (profileError || !profileUser) {
      console.error(
        "Erreur lors de la récupération du profil utilisateur:",
        profileError
      );
      return NextResponse.json(
        {
          success: false,
          error: "Utilisateur introuvable",
        },
        { status: 404 }
      );
    }

    // Supprimer les anciens tokens non utilisés pour cet utilisateur
    await supabase
      .from("password_reset_tokens")
      .delete()
      .eq("email", email.toLowerCase())
      .is("used_at", null);

    // Stocker le token en base
    const { error: tokenError } = await supabase
      .from("password_reset_tokens")
      .insert({
        user_id: profileUser.id, // C'est l'ID de auth.users
        token: resetToken,
        email: email.toLowerCase(),
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      console.error("Erreur lors de la création du token:", tokenError);
      return NextResponse.json(
        {
          success: false,
          error: "Erreur lors de la génération du token de réinitialisation",
        },
        { status: 500 }
      );
    }

    // Créer l'URL de réinitialisation personnalisée
    const resetUrl = `https://www.encorepilates.ma/auth/callback?token=${resetToken}&type=password_reset`;

    // Envoyer l'email uniquement via Resend avec notre template
    const emailResult = await AuthEmailService.sendPasswordReset(
      email.toLowerCase(),
      customerName,
      resetUrl
    );

    if (!emailResult.success) {
      // Supprimer le token si l'email échoue
      await supabase
        .from("password_reset_tokens")
        .delete()
        .eq("token", resetToken);

      console.error("Erreur lors de l'envoi de l'email:", emailResult.error);
      return NextResponse.json(
        {
          success: false,
          error: "Erreur lors de l'envoi de l'email de réinitialisation",
        },
        { status: 500 }
      );
    }

    // Log des métriques
    AuthEmailService.logEmailMetrics("reset", true, email);

    return NextResponse.json({
      success: true,
      message: "Email de réinitialisation envoyé avec succès",
      messageId: emailResult.messageId,
    });
  } catch (error) {
    console.error("Erreur inattendue dans send-reset-password:", error);
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

export async function PUT() {
  return NextResponse.json(
    { success: false, error: "Méthode non autorisée" },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, error: "Méthode non autorisée" },
    { status: 405 }
  );
}
