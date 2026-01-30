import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    const body = await request.json();
    const {
      courseTypeId,
      instructorId,
      startTime,
      endTime,
      maxCapacity,
      date,
      intensity = 1, // Valeur par défaut: Tous niveaux
      name,
    } = body;

    // Validation des données
    if (
      !courseTypeId ||
      !instructorId ||
      !startTime ||
      !endTime ||
      !maxCapacity ||
      !date ||
      !name
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Tous les champs obligatoires doivent être remplis",
        },
        { status: 400 }
      );
    }

    // Vérifier que l'heure de fin est après l'heure de début
    if (startTime >= endTime) {
      return NextResponse.json(
        {
          success: false,
          message: "L'heure de fin doit être après l'heure de début",
        },
        { status: 400 }
      );
    }

    // Vérifier que le niveau est valide (1-3)
    if (intensity < 1 || intensity > 3) {
      return NextResponse.json(
        {
          success: false,
          message: "Le niveau doit être compris entre 1 et 3",
        },
        { status: 400 }
      );
    }

    // Vérifier que le type de cours existe
    const { data: courseType, error: courseTypeError } = await supabase
      .from("course_types")
      .select("id, name")
      .eq("id", courseTypeId)
      .single();

    if (courseTypeError || !courseType) {
      return NextResponse.json(
        {
          success: false,
          message: "Type de cours invalide",
        },
        { status: 400 }
      );
    }

    // Vérifier que l'instructeur existe
    const { data: instructor, error: instructorError } = await supabase
      .from("instructors")
      .select("id, first_name, last_name")
      .eq("id", instructorId)
      .single();

    if (instructorError || !instructor) {
      return NextResponse.json(
        {
          success: false,
          message: "Instructeur invalide",
        },
        { status: 400 }
      );
    }

    // Vérification des conflits d'horaire supprimée - les instructeurs peuvent avoir plusieurs cours en même temps

    // Créer le cours
    const { data: newCourse, error: insertError } = await supabase
      .from("courses")
      .insert({
        course_type_id: courseTypeId,
        instructor_id: instructorId,
        start_time: startTime,
        end_time: endTime,
        max_capacity: maxCapacity,
        date,
        intensity,
        status: "active",
        current_bookings: 0,
        name,
      })
      .select(
        `
        *,
        course_types (
          id,
          name,
          description
        ),
        instructors (
          id,
          first_name,
          last_name
        )
      `
      )
      .single();

    if (insertError) {
      console.error("Erreur lors de la création du cours:", insertError);
      return NextResponse.json(
        { success: false, message: "Erreur lors de la création du cours" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Cours créé avec succès",
      data: newCourse,
    });
  } catch (error) {
    console.error("Erreur serveur:", error);
    return NextResponse.json(
      { success: false, message: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}

export async function GET() {
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
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Accès refusé" },
        { status: 403 }
      );
    }

    // Récupérer les cours avec les relations
    const { data: courses, error } = await supabase
      .from("courses")
      .select(
        `
        *,
        course_types (
          id,
          name,
          description
        ),
        instructors (
          id,
          first_name,
          last_name
        )
      `
      )
      .order("date", { ascending: false })
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Erreur lors de la récupération des cours:", error);
      return NextResponse.json(
        { success: false, message: "Erreur lors de la récupération des cours" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: courses,
    });
  } catch (error) {
    console.error("Erreur serveur:", error);
    return NextResponse.json(
      { success: false, message: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}
