import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer les informations du profil utilisateur
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      return NextResponse.json(
        { error: profileError.message },
        { status: 400 }
      );
    }

    // Récupérer le rôle de l'utilisateur depuis la table roles
    const { data: userRole, error: roleError } = await supabase
      .from("user_roles")
      .select(
        `
        roles (
          name
        )
      `
      )
      .eq("user_id", user.id)
      .single();

    if (roleError) {
      return NextResponse.json({ error: roleError.message }, { status: 400 });
    }

    const userInfo = {
      id: user.id,
      email: user.email,
      first_name: profile?.first_name || "",
      last_name: profile?.last_name || "",
      phone: profile?.phone || "",
      role: userRole?.roles,
      created_at: user.created_at,
    };

    return NextResponse.json({ user: userInfo });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
