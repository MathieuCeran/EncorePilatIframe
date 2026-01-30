// app/api/course-types/route.ts

import { NextRequest, NextResponse } from "next/server";
import { CourseType } from "@/types/types";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Paramètres optionnels
    const is_active = searchParams.get("is_active"); // true/false
    const limit = searchParams.get("limit");

    // Construction de la requête
    let query = supabase
      .from("course_types")
      .select("*")
      .order("name", { ascending: true });

    // Filtres conditionnels
    if (is_active !== null) {
      query = query.eq("is_active", is_active === "true");
    }

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data, error } = await query;

    if (error) {
      console.error("Erreur Supabase:", error);
      return NextResponse.json(
        {
          error: "Erreur lors de la récupération des types de cours",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
      count: data?.length || 0,
    });
  } catch (error) {
    console.error("Erreur serveur:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Validation des champs requis
    const { name, description, duration_minutes, benefits } = body;

    if (!name || !description || !duration_minutes) {
      return NextResponse.json(
        {
          error: "Champs requis manquants",
          required: ["name", "description", "duration_minutes"],
        },
        { status: 400 }
      );
    }

    // Validation des types de données
    if (typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Le nom doit être une chaîne non vide" },
        { status: 400 }
      );
    }

    if (typeof description !== "string" || description.trim().length === 0) {
      return NextResponse.json(
        { error: "La description doit être une chaîne non vide" },
        { status: 400 }
      );
    }

    if (typeof duration_minutes !== "number" || duration_minutes <= 0) {
      return NextResponse.json(
        { error: "La durée doit être un nombre positif" },
        { status: 400 }
      );
    }

    // Préparation des données à insérer
    const courseTypeData = {
      name: name.trim(),
      description: description.trim(),
      duration_minutes,
      benefits: benefits || [],
      is_active: body.is_active !== undefined ? body.is_active : true,
    };

    const { data, error } = await supabase
      .from("course_types")
      .insert([courseTypeData])
      .select()
      .single();

    if (error) {
      console.error("Erreur Supabase:", error);
      return NextResponse.json(
        {
          error: "Erreur lors de la création du type de cours",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: "Type de cours créé avec succès",
    });
  } catch (error) {
    console.error("Erreur serveur:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "L'ID du type de cours est requis" },
        { status: 400 }
      );
    }

    // Vérifier si le type de cours existe
    const { data: existingCourseType, error: fetchError } = await supabase
      .from("course_types")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existingCourseType) {
      return NextResponse.json(
        { error: "Type de cours non trouvé" },
        { status: 404 }
      );
    }

    // Validation des champs à mettre à jour
    const updateFields: Partial<CourseType> = {};

    if (updateData.name !== undefined) {
      if (
        typeof updateData.name !== "string" ||
        updateData.name.trim().length === 0
      ) {
        return NextResponse.json(
          { error: "Le nom doit être une chaîne non vide" },
          { status: 400 }
        );
      }
      updateFields.name = updateData.name.trim();
    }

    if (updateData.description !== undefined) {
      if (
        typeof updateData.description !== "string" ||
        updateData.description.trim().length === 0
      ) {
        return NextResponse.json(
          { error: "La description doit être une chaîne non vide" },
          { status: 400 }
        );
      }
      updateFields.description = updateData.description.trim();
    }

    if (updateData.duration_minutes !== undefined) {
      if (
        typeof updateData.duration_minutes !== "number" ||
        updateData.duration_minutes <= 0
      ) {
        return NextResponse.json(
          { error: "La durée doit être un nombre positif" },
          { status: 400 }
        );
      }
      updateFields.duration_minutes = updateData.duration_minutes;
    }

    if (updateData.benefits !== undefined) {
      if (!Array.isArray(updateData.benefits)) {
        return NextResponse.json(
          { error: "Les bénéfices doivent être un tableau" },
          { status: 400 }
        );
      }
      updateFields.benefits = updateData.benefits;
    }

    if (updateData.is_active !== undefined) {
      if (typeof updateData.is_active !== "boolean") {
        return NextResponse.json(
          { error: "is_active doit être un booléen" },
          { status: 400 }
        );
      }
      updateFields.is_active = updateData.is_active;
    }

    // Mise à jour du type de cours
    const { data, error } = await supabase
      .from("course_types")
      .update(updateFields)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Erreur Supabase:", error);
      return NextResponse.json(
        {
          error: "Erreur lors de la mise à jour du type de cours",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: "Type de cours mis à jour avec succès",
    });
  } catch (error) {
    console.error("Erreur serveur:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "L'ID du type de cours est requis" },
        { status: 400 }
      );
    }

    // Vérifier si le type de cours existe
    const { data: existingCourseType, error: fetchError } = await supabase
      .from("course_types")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existingCourseType) {
      return NextResponse.json(
        { error: "Type de cours non trouvé" },
        { status: 404 }
      );
    }

    // Supprimer le type de cours
    const { error } = await supabase.from("course_types").delete().eq("id", id);

    if (error) {
      console.error("Erreur Supabase:", error);
      return NextResponse.json(
        {
          error: "Erreur lors de la suppression du type de cours",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Type de cours supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur serveur:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
