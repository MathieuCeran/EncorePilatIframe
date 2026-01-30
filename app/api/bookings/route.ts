// app/api/bookings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const courseId = searchParams.get("course_id");
    const status = searchParams.get("status");
    const presente = searchParams.get("presente"); // nouveau paramètre pour filtrer par présence
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("reservations")
      .select(
        `
        *,
        courses (
          id,
          date,
          start_time,
          end_time,
          max_capacity,
          current_bookings,
          course_types (name, description)
        ),
        profiles (
          id,
          first_name,
          last_name,
          email
        )
      `
      )
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (courseId) {
      query = query.eq("course_id", courseId);
    }

    if (status) {
      query = query.eq("statut", status);
    }

    if (presente) {
      if (presente === "true") {
        query = query.eq("presente", true);
      } else if (presente === "false") {
        query = query.eq("presente", false);
      } else if (presente === "null") {
        query = query.is("presente", null);
      }
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      bookings: data,
      total: count,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}
