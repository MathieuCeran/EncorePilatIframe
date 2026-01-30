import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { FormattedCourse } from "@/types/types";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Paramètres de requête
    const date = searchParams.get("date"); // Format: YYYY-MM-DD
    const courseType = searchParams.get("courseType"); // ID du cours
    const instructor = searchParams.get("instructor");
    const courseId = searchParams.get("courseId"); // ID spécifique d'un cours
    const isAdmin = searchParams.get("admin") === "true"; // Paramètre pour l'admin

    // Récupérer les réservations de l'utilisateur connecté
    let userBookings: string[] = [];
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: bookings } = await supabase
          .from("reservations")
          .select("course_id")
          .eq("user_id", user.id)
          .in("statut", ["confirmed", "pending_payment"]);

        userBookings = bookings?.map((booking) => booking.course_id) || [];
      }
    } catch (bookingsError) {
      // Utilisateur non connecté ou erreur d'authentification
      console.error("Erreur d'authentification:", bookingsError);
      return NextResponse.json(
        { error: "Erreur d'authentification" },
        { status: 401 }
      );
    }

    // Si un courseId est fourni, récupérer ce cours spécifique
    if (courseId) {
      const { data: specificCourse, error: specificError } = await supabase
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
            last_name,
            first_name
          )
        `
        )
        .eq("id", courseId)
        .single();

      if (specificError) {
        console.error("Erreur Supabase pour cours spécifique:", specificError);
        return NextResponse.json(
          {
            error: "Cours non trouvé",
            details: specificError.message,
          },
          { status: 404 }
        );
      }

      if (!specificCourse) {
        return NextResponse.json(
          {
            error: "Cours non trouvé",
          },
          { status: 404 }
        );
      }

      // Formater le cours spécifique avec les infos de réservation
      const formattedSpecificCourse = formatCourse(
        specificCourse,
        userBookings
      );

      return NextResponse.json({
        success: true,
        data: [formattedSpecificCourse] as FormattedCourse[],
        count: 1,
        isSpecificCourse: true,
        courseDate: specificCourse.date, // Ajouter la date originale du cours
      });
    }

    // Construction de la requête pour les cours multiples
    let query = supabase
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
          last_name,
          first_name
        )
      `
      )
      .order("start_time", { ascending: true });

    // Filtres conditionnels
    if (date) {
      // Recherche par date spécifique (utilise la colonne date, pas start_time)
      query = query.eq("date", date);

      // Si ce n'est pas l'admin ET que la date sélectionnée est aujourd'hui,
      // exclure les cours dont l'heure est passée
      if (!isAdmin) {
        const now = new Date();
        const today = now.toISOString().split("T")[0]; // Format YYYY-MM-DD

        if (date === today) {
          const currentTime = now.toTimeString().split(" ")[0]; // Format HH:MM:SS
          query = query.gt("start_time", currentTime);
        }

        // Exclure aussi les cours dont le status est "canceled"
        query = query.eq("status", "active");
      }
    } else {
      // Exclure les cours passés seulement si ce n'est pas l'admin
      if (!isAdmin) {
        const now = new Date();
        const today = now.toISOString().split("T")[0]; // Format YYYY-MM-DD
        const currentTime = now.toTimeString().split(" ")[0]; // Format HH:MM:SS

        // Exclure les cours dont la date est passée ou dont la date est aujourd'hui mais l'heure est passée
        query = query.or(
          `date.gt.${today},and(date.eq.${today},start_time.gt.${currentTime})`
        );

        // Exclure aussi les cours dont le status est "canceled"
        query = query.eq("status", "active");
      }
    }

    if (courseType && courseType !== "all") {
      query = query.eq("course_type_id", courseType);
    }

    if (instructor) {
      query = query.eq("instructors.id", instructor);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Erreur Supabase:", error);
      return NextResponse.json(
        {
          error: "Erreur lors de la récupération des cours",
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Formatage des données pour l'affichage
    const formattedCourses = data?.map((course) =>
      formatCourse(course, userBookings)
    );

    return NextResponse.json({
      success: true,
      data: formattedCourses as FormattedCourse[],
      count: formattedCourses?.length || 0,
    });
  } catch (error) {
    console.error("Erreur serveur:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// Fonction utilitaire pour formater un cours
function formatCourse(
  course: {
    id: string;
    course_type_id?: string;
    instructor_id?: string;
    start_time?: string;
    end_time?: string;
    date?: string;
    intensity?: number;
    max_capacity?: number;
    current_bookings?: number;
    status?: string;
    course_types?: {
      id?: string;
      name?: string;
      description?: string;
    };
    instructors?: {
      id?: string;
      first_name?: string;
      last_name?: string;
    };
    name?: string; // Added for the new logic
  },
  userBookings: string[] = []
): FormattedCourse {
  let startTime = "N/A";
  let endTime = "N/A";
  let date = "N/A";

  // Traitement de start_time (format "HH:MM:SS")
  if (course.start_time) {
    try {
      const timeMatch = course.start_time.match(/^(\d{2}):(\d{2}):(\d{2})$/);
      if (timeMatch) {
        startTime = `${timeMatch[1]}:${timeMatch[2]}`;
      } else {
        // Fallback: essayer de parser comme une date complète
        const dateObj = new Date(course.start_time);
        if (!isNaN(dateObj.getTime())) {
          startTime = dateObj.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          });
        }
      }
    } catch (e) {
      console.warn("Erreur parsing start_time:", course.start_time, e);
    }
  }

  // Traitement de end_time (format "HH:MM:SS")
  if (course.end_time) {
    try {
      const timeMatch = course.end_time.match(/^(\d{2}):(\d{2}):(\d{2})$/);
      if (timeMatch) {
        endTime = `${timeMatch[1]}:${timeMatch[2]}`;
      } else {
        // Fallback: essayer de parser comme une date complète
        const dateObj = new Date(course.end_time);
        if (!isNaN(dateObj.getTime())) {
          endTime = dateObj.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          });
        }
      }
    } catch (e) {
      console.warn("Erreur parsing end_time:", course.end_time, e);
    }
  }

  // Traitement de la date (colonne date séparée)
  if (course.date) {
    try {
      const dateObj = new Date(course.date + "T00:00:00");
      if (!isNaN(dateObj.getTime())) {
        // Keep the original date string format for consistency
        date = course.date;
      }
    } catch (e) {
      console.warn("Erreur parsing date:", course.date, e);
    }
  }

  const isUserBooked = userBookings.includes(course.id);

  // Mapper l'ancienne intensité (1-4) vers la nouvelle (1-3) pour la rétrocompatibilité
  let mappedIntensity = course.intensity || 1;
  if (mappedIntensity > 3) {
    mappedIntensity = 3; // 4 → 3 (Intense)
  } else if (mappedIntensity < 1) {
    mappedIntensity = 1;
  }

  return {
    id: course.id,
    startTime,
    endTime,
    name: course.name || course.course_types?.name || "Cours",
    date,
    instructor: course.instructors
      ? `${course.instructors.first_name || ""} ${course.instructors.last_name || ""}`.trim()
      : "Instructeur non défini",
    instructorId: course.instructor_id || course.instructors?.id || "",
    intensity: mappedIntensity,
    current_capacity: course.max_capacity || 0,
    current_bookings: course.current_bookings || 0,
    max_capacity: course.max_capacity || 0,
    isFull: (course.current_bookings || 0) >= (course.max_capacity || 0),
    isUserBooked,
    courseType: course.course_types?.name || "Cours",
    courseTypeId: course.course_type_id || course.course_types?.id || "",
    status: course.status || "active",
  };
}
