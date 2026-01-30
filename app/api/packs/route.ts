import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Type definitions for better type safety
interface CourseType {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
}

interface PackLimitation {
  id: string;
  pack_id: string;
  course_type_id: string;
  max_utilisations: number | null;
  course_types: CourseType;
}

interface Pack {
  id: string;
  name: string;
  description: string | null;
  price: number;
  type_pack: string;
  is_active: boolean;
  created_at: string;
  limitations: PackLimitation[];
  course_types?: (CourseType & { max_utilisations: number | null })[];
}

interface PackWithCourseTypes extends Omit<Pack, "limitations"> {
  course_types: (CourseType & { max_utilisations: number | null })[];
}

// Helper to flatten course types from limitations
const attachCourseTypes = (pack: Pack): PackWithCourseTypes => {
  const limitations = Array.isArray(pack?.limitations) ? pack.limitations : [];
  const course_types = limitations
    .filter((l: PackLimitation) => l?.course_types)
    .map((l: PackLimitation) => ({
      id: l.course_types.id,
      name: l.course_types.name,
      description: l.course_types.description,
      duration_minutes: l.course_types.duration_minutes,
      max_utilisations: l.max_utilisations ?? null,
    }));
  return { ...pack, course_types };
};

// Public GET endpoint for packs (read-only). Mirrors admin GET with no auth requirements.
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const packId = searchParams.get("id");
    const is_active = searchParams.get("is_active");
    const type = searchParams.get("type");
    const course_type_id = searchParams.get("course_type_id");
    const course_type_ids = searchParams.getAll("course_type_ids");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Base select with limitations and related course types
    const baseSelect = `*, limitations:pack_limitations (
      id,
      pack_id,
      course_type_id,
      max_utilisations,
      course_types (
        id,
        name,
        description,
        duration_minutes
      )
    )`;

    // If a specific ID is provided
    if (packId) {
      const { data: pack, error: packError } = await supabase
        .from("packs")
        .select(baseSelect)
        .eq("id", packId)
        .is("deleted_at", null) // Exclure les packs supprimés
        .single();

      if (packError) {
        console.error("Pack not found error:", packError);
        return NextResponse.json({ error: "Pack non trouvé" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: attachCourseTypes(pack as Pack),
      });
    }

    // If filtering by course type ids, fetch packs that contain any of these types
    // and ALWAYS include multi_cours packs
    if (course_type_id || course_type_ids.length > 0) {
      const courseTypeIds = course_type_id ? [course_type_id] : course_type_ids;

      // Get pack IDs that have limitations for the requested course types
      const { data: packIds, error: packIdsError } = await supabase
        .from("pack_limitations")
        .select("pack_id")
        .in("course_type_id", courseTypeIds);

      if (packIdsError) {
        console.error("Error fetching pack IDs by course type:", packIdsError);
        return NextResponse.json(
          {
            error: "Erreur lors de la récupération des packs par type de cours",
            details: packIdsError.message,
          },
          { status: 500 }
        );
      }

      const packIdList =
        packIds?.map((p: { pack_id: string }) => p.pack_id) || [];

      // Apply is_active filter (default true publicly)
      const activeFilter = is_active !== null ? is_active === "true" : true;

      // Query packs matching the course type limitations
      let queryByType = supabase
        .from("packs")
        .select(baseSelect)
        .eq("is_active", activeFilter)
        .is("deleted_at", null) // Exclure les packs supprimés
        .order("created_at", { ascending: false });

      if (packIdList.length > 0) {
        queryByType = queryByType.in("id", packIdList);
      } else {
        // No specific packs for this course type, return empty result
        queryByType = queryByType.eq("id", "__none__"); // ensure empty result
      }

      // Query all multi_cours packs
      const queryMulti = supabase
        .from("packs")
        .select(baseSelect)
        .eq("type_pack", "multi_cours")
        .eq("is_active", activeFilter)
        .is("deleted_at", null) // Exclure les packs supprimés
        .order("created_at", { ascending: false });

      const [{ data: byType, error: err1 }, { data: multi, error: err2 }] =
        await Promise.all([queryByType, queryMulti]);

      if (err1 || err2) {
        console.error("Error fetching packs:", { err1, err2 });
        return NextResponse.json(
          {
            error: "Erreur lors de la récupération des packs",
            details: err1?.message || err2?.message,
          },
          { status: 500 }
        );
      }

      // Merge and deduplicate by id
      const map = new Map<string, Pack>();
      (byType || []).concat(multi || []).forEach((p: Pack) => {
        if (p && !map.has(p.id)) map.set(p.id, p);
      });
      const merged = Array.from(map.values());

      const withCourseTypes = merged.map(attachCourseTypes);
      return NextResponse.json({
        success: true,
        data: withCourseTypes,
        total: withCourseTypes.length,
        limit,
        offset,
      });
    }

    // Otherwise list packs with optional filters
    let query = supabase
      .from("packs")
      .select(baseSelect, { count: "exact" })
      .is("deleted_at", null) // Exclure les packs supprimés
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    // Default to active packs publicly if not explicitly provided
    if (is_active !== null) {
      query = query.eq("is_active", is_active === "true");
    } else {
      query = query.eq("is_active", true);
    }

    if (type) {
      query = query.eq("type_pack", type);
    }

    const { data: packs, error, count } = await query;
    if (error) {
      console.error("Error fetching packs:", error);
      return NextResponse.json(
        {
          error: "Erreur lors de la récupération des packs",
          details: error.message,
        },
        { status: 500 }
      );
    }

    const withCourseTypes = (packs || []).map((pack: Pack) =>
      attachCourseTypes(pack)
    );
    return NextResponse.json({
      success: true,
      data: withCourseTypes,
      total: count,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
