import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const service = createServiceClient();
    const { searchParams } = new URL(request.url);

    const courseTypeId = searchParams.get("courseTypeId");
    if (!courseTypeId) {
      return NextResponse.json(
        { success: false, message: "courseTypeId requis" },
        { status: 400 }
      );
    }

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

    // Check if user has any past reservation with a decouverte pack for this course type
    const { data: priorDiscovery } = await service
      .from("reservations")
      .select(
        `id,
         courses ( course_type_id ),
         user_pack_purchases (
           id,
           packs ( type_pack )
         )`
      )
      .eq("user_id", user.id)
      .eq("courses.course_type_id", courseTypeId)
      .eq("user_pack_purchases.packs.type_pack", "decouverte")
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      discoveryEligible: !priorDiscovery,
      message: priorDiscovery
        ? "Vous avez déjà utilisé une offre Découverte pour ce type de cours"
        : null,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    );
  }
}
