import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type PackType = "decouverte" | "mono_cours" | "multi_cours";

interface DbPack {
  id: string;
  nom: string;
  description?: string | null;
  prix: number;
  type_pack: PackType;
  duree_validite_jours?: number | null;
  nombre_cours_total?: number | null;
}

interface PurchaseRow {
  id: string;
  pack_id: string;
  cours_restants: number;
  statut: string;
  date_expiration: string | null;
  date_achat: string | null;
}

interface LimitationRow {
  pack_id: string;
  max_utilisations: number | null;
  course_type_id: string;
}

interface UsageRow {
  user_pack_purchase_id: string;
  utilisations_consommees: number;
  course_type_id: string;
}

// GET /api/me/active-pack?courseTypeId=<uuid> or ?courseTypeIds=<uuid1>&courseTypeIds=<uuid2>...
// - Always returns { hasActivePack: boolean }
// - If courseTypeId(s) is provided and a valid pack purchase exists for that type(s),
//   returns { selected: { purchaseId, cours_restants, date_expiration, date_achat,
//                        max_utilisations, used_for_type, pack: {...} } }
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const courseTypeId = searchParams.get("courseTypeId");
    const courseTypeIds = searchParams.getAll("courseTypeIds");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ hasActivePack: false }, { status: 200 });
    }

    const nowIso = new Date().toISOString();
    const { data: purchases, error: purchasesErr } = await supabase
      .from("user_pack_purchases")
      .select(
        "id, pack_id, cours_restants, statut, date_expiration, date_achat"
      )
      .eq("user_id", user.id)
      .eq("statut", "active")
      .gt("cours_restants", 0)
      .or(`date_expiration.is.null,date_expiration.gt.${nowIso}`);

    if (purchasesErr) {
      return NextResponse.json({ hasActivePack: false }, { status: 200 });
    }

    const activePurchases: PurchaseRow[] = (purchases || []).filter(
      (p: PurchaseRow) => {
        if (!p?.date_expiration) return true;
        return p.date_expiration > nowIso;
      }
    );

    const hasActivePack = activePurchases.length > 0;

    // Determine which course type IDs to check
    const courseTypeIdsToCheck = courseTypeId ? [courseTypeId] : courseTypeIds;

    // If no courseTypeId(s) requested or no active purchases, return early
    if (courseTypeIdsToCheck.length === 0 || !hasActivePack) {
      return NextResponse.json({ hasActivePack }, { status: 200 });
    }

    const packIds = Array.from(new Set(activePurchases.map((p) => p.pack_id)));
    if (packIds.length === 0) {
      return NextResponse.json({ hasActivePack }, { status: 200 });
    }

    // Fetch packs info
    const { data: packs, error: packsErr } = await supabase
      .from("packs")
      .select(
        "id, nom, description, prix, type_pack, duree_validite_jours, nombre_cours_total"
      )
      .in("id", packIds)
      .is("deleted_at", null); // Exclure les packs supprimés

    if (packsErr || !packs) {
      return NextResponse.json({ hasActivePack }, { status: 200 });
    }

    // Fetch limitations for all requested course types
    const { data: limitations } = await supabase
      .from("pack_limitations")
      .select("pack_id, max_utilisations, course_type_id")
      .in("course_type_id", courseTypeIdsToCheck)
      .in("pack_id", packIds);

    // Fetch usage for all requested course types for each purchase
    const { data: usageRows } = await supabase
      .from("user_pack_usage")
      .select("user_pack_purchase_id, utilisations_consommees, course_type_id")
      .in("course_type_id", courseTypeIdsToCheck)
      .in(
        "user_pack_purchase_id",
        activePurchases.map((p) => p.id)
      );

    const packById = new Map<string, DbPack>(
      (packs || []).map((p: DbPack) => [p.id, p])
    );
    const limitationsByPackId = new Map<string, LimitationRow[]>();
    (limitations || []).forEach((l: LimitationRow) => {
      if (!limitationsByPackId.has(l.pack_id)) {
        limitationsByPackId.set(l.pack_id, []);
      }
      limitationsByPackId.get(l.pack_id)!.push(l);
    });
    const usageByPurchaseId = new Map<string, UsageRow[]>();
    (usageRows || []).forEach((u: UsageRow) => {
      if (!usageByPurchaseId.has(u.user_pack_purchase_id)) {
        usageByPurchaseId.set(u.user_pack_purchase_id, []);
      }
      usageByPurchaseId.get(u.user_pack_purchase_id)!.push(u);
    });

    // Filter eligible purchases for the requested course types
    const eligible = activePurchases
      .map((purchase) => {
        const pack = packById.get(purchase.pack_id);
        if (!pack) return null;

        // Check if this pack allows any of the requested course types
        let allowed = false;
        let maxUtilisations: number | null = null;
        let bestCourseTypeId: string | null = null;
        const packLimitations = limitationsByPackId.get(pack.id) || [];

        if (pack.type_pack === "multi_cours") {
          // Multi_cours packs allow all course types, but may have specific limitations
          allowed = true;
          // Find the best limitation (highest max_utilisations or null for unlimited)
          const bestLimitation = packLimitations
            .filter((l) => courseTypeIdsToCheck.includes(l.course_type_id))
            .sort((a, b) => {
              if (a.max_utilisations === null && b.max_utilisations === null)
                return 0;
              if (a.max_utilisations === null) return -1;
              if (b.max_utilisations === null) return 1;
              return b.max_utilisations - a.max_utilisations;
            })[0];
          if (bestLimitation) {
            maxUtilisations = bestLimitation.max_utilisations;
            bestCourseTypeId = bestLimitation.course_type_id;
          }
        } else {
          // For decouverte and mono_cours, require an explicit limitation row
          const matchingLimitation = packLimitations.find((l) =>
            courseTypeIdsToCheck.includes(l.course_type_id)
          );
          if (matchingLimitation) {
            allowed = true;
            maxUtilisations = matchingLimitation.max_utilisations;
            bestCourseTypeId = matchingLimitation.course_type_id;
          }
        }

        if (!allowed) return null;

        // Calculate total usage for the best course type
        const purchaseUsage = usageByPurchaseId.get(purchase.id) || [];
        const usedForType = bestCourseTypeId
          ? purchaseUsage.find((u) => u.course_type_id === bestCourseTypeId)
              ?.utilisations_consommees || 0
          : 0;

        if (maxUtilisations !== null && usedForType >= maxUtilisations) {
          return null; // limit reached for this type
        }

        return {
          purchase,
          pack,
          usedForType,
          maxUtilisations,
          courseTypeId: bestCourseTypeId,
        };
      })
      .filter(Boolean) as Array<{
      purchase: PurchaseRow;
      pack: DbPack;
      usedForType: number;
      maxUtilisations: number | null;
      courseTypeId: string | null;
    }>;

    if (eligible.length === 0) {
      return NextResponse.json({ hasActivePack }, { status: 200 });
    }

    // Sort by oldest purchase date first (plus ancien), then by earliest expiration
    eligible.sort((a, b) => {
      const aBuy = a.purchase.date_achat || "";
      const bBuy = b.purchase.date_achat || "";
      const buyDiff = aBuy.localeCompare(bBuy);
      if (buyDiff !== 0) return buyDiff;

      const aExp = a.purchase.date_expiration || "9999-12-31T00:00:00.000Z";
      const bExp = b.purchase.date_expiration || "9999-12-31T00:00:00.000Z";
      return aExp.localeCompare(bExp);
    });

    const best = eligible[0];

    // Fetch all restrictions for the selected pack to display in UI
    const { data: allLimitations } = await supabase
      .from("pack_limitations")
      .select(
        `course_type_id, max_utilisations, course_types (id, name, description, duration_minutes)`
      )
      .eq("pack_id", best.pack.id);

    type LimRow = {
      course_type_id: string;
      max_utilisations: number | null;
      course_types?: {
        id: string;
        name: string;
        description?: string | null;
        duration_minutes?: number | null;
      } | null;
    };
    const rawLimitations = (allLimitations || []) as unknown as LimRow[];
    const restrictions = rawLimitations.map((l) => ({
      course_type_id: l.course_type_id,
      max_utilisations: l.max_utilisations,
      name: l.course_types?.name,
    }));

    return NextResponse.json(
      {
        hasActivePack,
        selected: {
          purchaseId: best.purchase.id,
          cours_restants: best.purchase.cours_restants,
          date_expiration: best.purchase.date_expiration,
          date_achat: best.purchase.date_achat,
          max_utilisations: best.maxUtilisations,
          used_for_type: best.usedForType,
          restrictions,
          pack: best.pack,
        },
      },
      { status: 200 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ hasActivePack: false }, { status: 200 });
  }
}
