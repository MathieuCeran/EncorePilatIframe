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

    const { data: userRole, error: userRoleError } = await supabase
      .rpc("get_user_role")
      .single();

    if (userRoleError) {
      return NextResponse.json(
        { error: userRoleError.message },
        { status: 400 }
      );
    }
    return NextResponse.json({ role: userRole });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
