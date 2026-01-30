import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type PackStatus = "active" | "expired" | "cancelled" | "pending" | string;

interface PackData {
  id: string;
  nom: string;
  description: string | null;
  prix: number;
  type_pack: string;
  duree_validite_jours: number | null;
  nombre_cours_total: number | null;
}

interface UserPackPurchaseWithPack {
  id: string;
  pack_id: string;
  cours_restants: number;
  statut: string;
  date_expiration: string | null;
  date_achat: string | null;
  packs: PackData;
}

interface PackLimitationData {
  pack_id: string;
  course_type_id: string;
  max_utilisations: number | null;
}

interface UserPackUsageData {
  user_pack_purchase_id: string;
  course_type_id: string;
  utilisations_consommees: number;
}

interface CourseTypeData {
  id: string;
  name: string;
}

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: true, active: [], all: [] },
        { status: 200 }
      );
    }

    const { data, error } = await supabase
      .from("user_pack_purchases")
      .select(
        `id, pack_id, cours_restants, statut, date_expiration, date_achat,
         packs:packs!inner (id, nom, description, prix, type_pack, duree_validite_jours, nombre_cours_total)`
      )
      .eq("user_id", user.id)
      .neq("statut", "pending") // Exclure les packs en statut pending
      .is("packs.deleted_at", null) // Exclure les packs supprimés
      .order("date_achat", { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: "Erreur lors de la récupération des packs" },
        { status: 500 }
      );
    }

    const nowIso = new Date().toISOString();
    const purchases = (data || []) as unknown as UserPackPurchaseWithPack[];

    const allPurchaseIds = purchases.map((p) => p.id);
    const allPackIds = Array.from(new Set(purchases.map((p) => p.pack_id)));

    // Fetch all limitations for these packs
    const { data: limitations } = await supabase
      .from("pack_limitations")
      .select("pack_id, course_type_id, max_utilisations")
      .in("pack_id", allPackIds);

    // Fetch names for the involved course types
    const courseTypeIds = Array.from(
      new Set(
        (limitations || []).map((l: PackLimitationData) => l.course_type_id)
      )
    );
    const { data: courseTypes } = courseTypeIds.length
      ? await supabase
          .from("course_types")
          .select("id, name")
          .in("id", courseTypeIds)
      : ({ data: [] as CourseTypeData[] } as { data: CourseTypeData[] });

    const courseTypeNameById = new Map<string, string>(
      ((courseTypes as CourseTypeData[]) || []).map((ct: CourseTypeData) => [
        ct.id,
        ct.name,
      ])
    );

    // Fetch usage per purchase and course type
    const { data: usageRows } = allPurchaseIds.length
      ? await supabase
          .from("user_pack_usage")
          .select(
            "user_pack_purchase_id, course_type_id, utilisations_consommees"
          )
          .in("user_pack_purchase_id", allPurchaseIds)
      : ({ data: [] as UserPackUsageData[] } as { data: UserPackUsageData[] });

    const usageByPurchaseAndType = new Map<string, number>();
    (usageRows || []).forEach((u: UserPackUsageData) => {
      const key = `${u.user_pack_purchase_id}:${u.course_type_id}`;
      usageByPurchaseAndType.set(key, u.utilisations_consommees || 0);
    });

    const limitationsByPackId = new Map<string, PackLimitationData[]>();
    (limitations || []).forEach((l: PackLimitationData) => {
      if (!limitationsByPackId.has(l.pack_id))
        limitationsByPackId.set(l.pack_id, []);
      limitationsByPackId.get(l.pack_id)!.push(l);
    });

    const all = purchases.map((row) => {
      const packLimitations = limitationsByPackId.get(row.pack_id) || [];
      const restrictions = packLimitations
        .filter((l) => l.max_utilisations !== null)
        .map((l) => {
          const used =
            usageByPurchaseAndType.get(`${row.id}:${l.course_type_id}`) || 0;
          return {
            course_type_id: l.course_type_id as string,
            max_utilisations: l.max_utilisations as number | null,
            used,
            name: courseTypeNameById.get(l.course_type_id) || undefined,
          };
        });

      return {
        id: row.id,
        cours_restants: row.cours_restants as number,
        statut: row.statut as PackStatus,
        date_expiration: row.date_expiration as string | null,
        date_achat: row.date_achat as string | null,
        pack: row.packs,
        restrictions,
      };
    });

    const active = all.filter((p) => {
      if (p.statut !== "active") return false;
      if (p.cours_restants <= 0) return false;
      if (!p.date_expiration) return true;
      return p.date_expiration > nowIso;
    });

    return NextResponse.json({ success: true, active, all }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
