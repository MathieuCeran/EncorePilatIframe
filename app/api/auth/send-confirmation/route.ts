import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { AuthEmailService } from "@/lib/auth-email-service";

interface ConfirmationRequestBody {
  email: string;
  firstName?: string;
  lastName?: string;
}

/**
 * API Route pour envoyer un email de confirmation de compte
 * POST /api/auth/send-confirmation
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
    let body: ConfirmationRequestBody;
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

    const { email, firstName, lastName } = body;

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

    // Vérifier si l'utilisateur existe déjà
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

    // Si l'utilisateur existe, vérifier son statut via l'API Auth
    if (existingUser) {
      console.log(
        "Utilisateur existant trouvé, envoi de l'email de confirmation."
      );
      // Note: Il n'y a pas de méthode simple pour vérifier le statut de confirmation
      // sans l'ID utilisateur. On procède à l'envoi de l'email.
    }

    // Déterminer le nom à utiliser
    const customerName = existingUser
      ? `${existingUser.first_name || ""} ${existingUser.last_name || ""}`.trim() ||
        "Cher(e) client(e)"
      : `${firstName || ""} ${lastName || ""}`.trim() || "Cher(e) client(e)";

    // Générer un token de confirmation sécurisé
    const { data: authData, error: authError } =
      await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: email.toLowerCase(),
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm`,
        },
      });

    if (authError || !authData.properties?.action_link) {
      console.error(
        "Erreur lors de la génération du lien de confirmation:",
        authError
      );
      return NextResponse.json(
        {
          success: false,
          error: "Erreur lors de la génération du lien de confirmation",
        },
        { status: 500 }
      );
    }

    // Envoyer l'email via Resend
    const emailResult = await AuthEmailService.sendAccountConfirmation(
      email.toLowerCase(),
      customerName,
      authData.properties.action_link
    );

    if (!emailResult.success) {
      console.error("Erreur lors de l'envoi de l'email:", emailResult.error);
      return NextResponse.json(
        {
          success: false,
          error: "Erreur lors de l'envoi de l'email de confirmation",
        },
        { status: 500 }
      );
    }

    // Log des métriques
    AuthEmailService.logEmailMetrics("confirmation", true, email);

    return NextResponse.json({
      success: true,
      message: "Email de confirmation envoyé avec succès",
      messageId: emailResult.messageId,
    });
  } catch (error) {
    console.error("Erreur inattendue dans send-confirmation:", error);
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
